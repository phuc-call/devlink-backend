import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { groupApi } from '../../../api/user-service/groupApi';
import { GroupPrivacy, type GroupMemberResponse, type GroupCandidateResponse } from '../../../types/group.types';
import type { UserSearchResponse } from '../../../types/profile.types';
import styles from './GroupDetailPage.module.css';
import { useToast } from '../../../context/Toastcontext';
import { Settings, Users, LogOut, Shield, ShieldAlert, Check, X, Copy, RefreshCw } from 'lucide-react';

export default function GroupDetailPage() {
    const { id } = useParams<{ id: string }>();
    const groupId = Number(id);
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Lấy thông tin nhóm truyền từ trang Khám phá (Search)
    // TODO: Cần API getGroupById từ backend để load trực tiếp
    const [groupInfo, setGroupInfo] = useState<any>(location.state?.group || null);

    const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'pending' | 'settings'>('feed');
    const [loading, setLoading] = useState(false);

    const [joinStatus, setJoinStatus] = useState<string | null | undefined>(groupInfo?.joinStatus);
    const [joining, setJoining] = useState(false);

    // State cho Members
    const [members, setMembers] = useState<GroupMemberResponse[]>([]);
    const [pendingMembers, setPendingMembers] = useState<UserSearchResponse[]>([]);
    const [candidates, setCandidates] = useState<GroupCandidateResponse[]>([]);

    const [myUserId, setMyUserId] = useState<number | null>(null);
    const [myRole, setMyRole] = useState<'ADMIN' | 'MODERATOR' | 'MEMBER' | null>(null);

    // State cho Settings
    const [editName, setEditName] = useState(groupInfo?.name || '');
    const [editDesc, setEditDesc] = useState(groupInfo?.description || '');
    const [editPrivacy, setEditPrivacy] = useState<GroupPrivacy>(GroupPrivacy.PUBLIC);
    const [inviteCode, setInviteCode] = useState(groupInfo?.inviteCode || '');
    const [updatingGroup, setUpdatingGroup] = useState(false);
    const [generatingCode, setGeneratingCode] = useState(false);
    
    // Modal Rời nhóm
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [selectedNewAdmin, setSelectedNewAdmin] = useState<number | null>(null);

    useEffect(() => {
        const initData = async () => {
            try {
                // 0. Fetch group details if not passed or to ensure freshness
                const groupRes = await groupApi.getGroupById(groupId);
                const groupData = groupRes.data.data;
                setGroupInfo(groupData);
                setJoinStatus(groupData.joinStatus);
                setEditName(groupData.name);
                setEditDesc(groupData.description || '');
                setEditPrivacy(groupData.privacy);
                setInviteCode(groupData.inviteCode || '');

                // 1. Lấy My Profile
                const { userProfileApi } = await import('../../../api/user-service/userProfileApi');
                const profileRes = await userProfileApi.getProfile();
                const currentUserId = profileRes.data.data.userId;
                setMyUserId(currentUserId);

                // 2. Lấy Members để xem mình là ai
                const memRes = await groupApi.getGroupMembers(groupId);
                const mems = memRes.data.data.content;
                setMembers(mems);
                
                const me = mems.find((m: any) => m.id === currentUserId);
                if (me) {
                    setMyRole(me.role);
                    setJoinStatus('APPROVED');
                } else if (!groupData.joinStatus) {
                    // Try to see if pending by looking at pending members if admin? 
                    // Actually if we just pass joinStatus from previous page it's better.
                }
            } catch (err) {
                console.error(err);
                showToast("Không tìm thấy thông tin nhóm. Vui lòng thêm API getGroupById ở Backend!", "error");
            }
        };
        initData();
    }, [groupId]);

    const loadMembers = async () => {
        setLoading(true);
        try {
            const res = await groupApi.getGroupMembers(groupId);
            setMembers(res.data.data.content);
        } catch (err) {
            console.error(err);
            showToast("Lỗi khi tải thành viên", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadPendingMembers = async () => {
        setLoading(true);
        try {
            const res = await groupApi.getPendingMembers(groupId);
            setPendingMembers(res.data.data.content);
        } catch (err) {
            console.error(err);
            showToast("Lỗi khi tải danh sách chờ", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadCandidates = async () => {
        try {
            const res = await groupApi.getReplacementCandidates(groupId);
            setCandidates(res.data.data.content);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateGroup = async () => {
        setUpdatingGroup(true);
        try {
            await groupApi.updateGroup(groupId, {
                name: editName,
                description: editDesc,
                privacy: editPrivacy,
                coverImage: groupInfo?.coverImage || ''
            });
            showToast("Cập nhật nhóm thành công", "success");
            setGroupInfo({ ...groupInfo, name: editName, description: editDesc });
        } catch (err: any) {
            showToast(err.response?.data?.message || "Lỗi khi cập nhật", "error");
        } finally {
            setUpdatingGroup(false);
        }
    };

    const handleGenerateCode = async () => {
        setGeneratingCode(true);
        try {
            const res = await groupApi.createNewInviteCode(groupId, { code: '' });
            setInviteCode(res.data.data);
            showToast("Đã tạo mã mời", "success");
        } catch (err: any) {
            showToast(err.response?.data?.message || "Lỗi khi tạo mã", "error");
        } finally {
            setGeneratingCode(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'members') loadMembers();
        if (activeTab === 'pending') loadPendingMembers();
        if (activeTab === 'settings') loadCandidates();
    }, [activeTab]);

    const handleLeaveGroupBtnClick = () => {
        if (myRole === 'ADMIN') {
            loadCandidates();
            setShowLeaveModal(true);
        } else {
            if (window.confirm("Bạn có chắc muốn rời nhóm này?")) {
                executeLeaveGroup();
            }
        }
    };

    const executeLeaveGroup = async () => {
        try {
            // Lưu ý: Nếu Admin chọn người thay thế thì BE hiện tại chưa hỗ trợ param newAdminId.
            // Phải chờ BE update. Hiện tại cứ gọi leaveGroup(groupId)
            await groupApi.leaveGroup(groupId);
            showToast("Rời nhóm thành công", "success");
            navigate('/explore');
        } catch (err: any) {
            showToast(err.response?.data?.message || "Rời nhóm thất bại", "error");
        }
    };

    const handleConfirmLeaveModal = () => {
        executeLeaveGroup();
    };

    const handleJoinGroup = async () => {
        if (joining || joinStatus === 'PENDING' || joinStatus === 'APPROVED') return;
        setJoining(true);
        try {
            await groupApi.joinGroup(groupId);
            setJoinStatus('PENDING'); 
            showToast("Đã gửi yêu cầu tham gia", "success");
        } catch (error: any) {
            if (error?.response?.data?.message === 'USER_ALREADY_IN_GROUP') {
                 setJoinStatus('APPROVED');
                 showToast("Bạn đã ở trong nhóm này", "info");
            } else {
                 showToast(error.response?.data?.message || "Lỗi khi tham gia nhóm", "error");
            }
        } finally {
            setJoining(false);
        }
    };

    const handleKickMember = async (memberId: number) => {
        if (!window.confirm("Xóa thành viên này khỏi nhóm?")) return;
        try {
            await groupApi.kickMember(groupId, memberId);
            showToast("Đã xóa thành viên", "success");
            loadMembers();
        } catch (err) {
            console.error(err);
            showToast("Lỗi xóa thành viên", "error");
        }
    };

    const handleApprove = async (memberId: number) => {
        try {
            await groupApi.approveMember(groupId, memberId);
            showToast("Đã duyệt", "success");
            loadPendingMembers();
        } catch (err) {
            showToast("Lỗi khi duyệt", "error");
        }
    };

    const handleReject = async (memberId: number) => {
        try {
            await groupApi.rejectMember(groupId, memberId);
            showToast("Đã từ chối", "success");
            loadPendingMembers();
        } catch (err) {
            showToast("Lỗi khi từ chối", "error");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.coverWrapper}>
                <img src={groupInfo?.coverImage || 'https://via.placeholder.com/1200x400'} alt="Cover" className={styles.coverImage} />
                <div className={styles.groupHeaderInfo}>
                    <h1 className={styles.groupName}>{groupInfo?.name || 'Đang tải...'}</h1>
                    <p className={styles.groupDescription}>{groupInfo?.description}</p>
                    <div className={styles.groupStats}>
                        <Users size={16} /> {groupInfo?.memberCount || 1} thành viên
                    </div>
                </div>
            </div>

            <div className={styles.navbar}>
                <button className={`${styles.navBtn} ${activeTab === 'feed' ? styles.active : ''}`} onClick={() => setActiveTab('feed')}>Thảo luận</button>
                <button className={`${styles.navBtn} ${activeTab === 'members' ? styles.active : ''}`} onClick={() => setActiveTab('members')}>Thành viên</button>
                
                {(myRole === 'ADMIN' || myRole === 'MODERATOR') && (
                    <button className={`${styles.navBtn} ${activeTab === 'pending' ? styles.active : ''}`} onClick={() => setActiveTab('pending')}>Phê duyệt</button>
                )}
                
                {myRole === 'ADMIN' && (
                    <button className={`${styles.navBtn} ${activeTab === 'settings' ? styles.active : ''}`} onClick={() => setActiveTab('settings')}><Settings size={16} /> Cài đặt</button>
                )}
                
                {myRole ? (
                    <button className={styles.leaveBtn} onClick={handleLeaveGroupBtnClick}><LogOut size={16} /> Rời nhóm</button>
                ) : (
                    joinStatus === 'PENDING' ? (
                         <button className={styles.pendingBtn} disabled>Đã gửi yêu cầu</button>
                    ) : (
                         <button className={styles.joinBtn} onClick={handleJoinGroup} disabled={joining}>
                            {joining ? 'Đang gửi...' : 'Tham gia nhóm'}
                         </button>
                    )
                )}
            </div>

            <div className={styles.content}>
                {activeTab === 'feed' && (
                    <div className={styles.tabContent}>
                        <h3>Tính năng bảng tin đang phát triển</h3>
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className={styles.tabContent}>
                        <h3>Thành viên nhóm</h3>
                        {loading ? <p>Đang tải...</p> : (
                            <div className={styles.memberList}>
                                {members.map(m => (
                                    <div key={m.id} className={styles.memberItem}>
                                        <div className={styles.memberInfo}>
                                            <img src={m.avatar || 'https://via.placeholder.com/40'} alt={m.name} className={styles.memberAvatar} />
                                            <div>
                                                <h4>{m.name}</h4>
                                                <span className={styles.roleBadge}>
                                                    {m.role === 'ADMIN' && <Shield size={12} />}
                                                    {m.role === 'MODERATOR' && <ShieldAlert size={12} />}
                                                    {m.role}
                                                </span>
                                            </div>
                                        </div>
                                        {m.role !== 'ADMIN' && (
                                            <button className={styles.kickBtn} onClick={() => handleKickMember(m.id)}>Kích xuất</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'pending' && (
                    <div className={styles.tabContent}>
                        <h3>Yêu cầu tham gia</h3>
                        {loading ? <p>Đang tải...</p> : pendingMembers.length === 0 ? <p>Không có yêu cầu nào.</p> : (
                            <div className={styles.memberList}>
                                {pendingMembers.map(m => (
                                    <div key={m.userId} className={styles.memberItem}>
                                        <div className={styles.memberInfo}>
                                            <img src={m.avatarUrl || 'https://via.placeholder.com/40'} alt={m.fullName} className={styles.memberAvatar} />
                                            <h4>{m.fullName}</h4>
                                        </div>
                                        <div className={styles.actionBtns}>
                                            <button className={styles.approveBtn} onClick={() => handleApprove(m.userId)}><Check size={16} /> Duyệt</button>
                                            <button className={styles.rejectBtn} onClick={() => handleReject(m.userId)}><X size={16} /> Từ chối</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className={styles.tabContent}>
                        <h3>Cài đặt nhóm</h3>
                        
                        <div className={styles.settingsSection}>
                            <h4>Thông tin cơ bản</h4>
                            <div className={styles.inputGroup}>
                                <label>Tên nhóm</label>
                                <input value={editName} onChange={e => setEditName(e.target.value)} className={styles.input} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Mô tả nhóm</label>
                                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className={styles.input} rows={3} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Quyền riêng tư</label>
                                <select value={editPrivacy} onChange={e => setEditPrivacy(e.target.value as GroupPrivacy)} className={styles.input}>
                                    <option value={GroupPrivacy.PUBLIC}>Công khai</option>
                                    <option value={GroupPrivacy.PRIVACY}>Riêng tư</option>
                                </select>
                            </div>
                            <button className={styles.primaryBtn} onClick={handleUpdateGroup} disabled={updatingGroup}>
                                {updatingGroup ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>

                        <div className={styles.settingsSection}>
                            <h4>Mã mời (Invite Code)</h4>
                            <p className={styles.helpText}>Tạo mã mời mới để người khác có thể tham gia nhóm.</p>
                            <div className={styles.inviteCodeBox}>
                                <span className={styles.inviteCode}>{inviteCode || 'Chưa có mã'}</span>
                                <button className={styles.iconBtn} onClick={() => {
                                    navigator.clipboard.writeText(inviteCode);
                                    showToast("Đã copy", "success");
                                }}><Copy size={16} /></button>
                                <button className={styles.iconBtn} onClick={handleGenerateCode} disabled={generatingCode}>
                                    <RefreshCw size={16} className={generatingCode ? styles.spin : ''} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.settingsSection}>
                            <h4>Ứng viên kế nhiệm (Replacement Candidates)</h4>
                            <p className={styles.helpText}>Danh sách những người có thể trở thành Admin tiếp theo nếu bạn rời nhóm.</p>
                            <div className={styles.memberList}>
                                {candidates.length === 0 ? <p>Chưa có ứng viên nào.</p> : candidates.map(c => (
                                    <div key={c.userId} className={styles.memberItem}>
                                        <div className={styles.memberInfo}>
                                            <img src={c.avatarUrl || 'https://via.placeholder.com/40'} alt={c.fullName} className={styles.memberAvatar} />
                                            <div>
                                                <h4>{c.fullName}</h4>
                                                {c.similarityScore && <span className={styles.scoreText}>Điểm tương đồng: {c.similarityScore}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Leave Group Modal for Admin */}
            {showLeaveModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.leaveModal}>
                        <h3>Rời nhóm (Dành cho Quản trị viên)</h3>
                        <p>Vì bạn là Admin, nếu bạn rời đi mà không chọn người thay thế, nhóm có thể bị xóa. Vui lòng chọn người kế nhiệm:</p>
                        <div className={styles.candidateSelect}>
                            {candidates.length === 0 ? <p>Không có ứng viên khả dụng.</p> : (
                                <select 
                                    className={styles.input} 
                                    value={selectedNewAdmin || ''} 
                                    onChange={e => setSelectedNewAdmin(Number(e.target.value))}
                                >
                                    <option value="">-- Chọn người thay thế (hoặc để trống) --</option>
                                    {candidates.map(c => (
                                        <option key={c.userId} value={c.userId}>{c.fullName} - Điểm: {c.similarityScore}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowLeaveModal(false)}>Hủy</button>
                            <button className={styles.confirmLeaveBtn} onClick={handleConfirmLeaveModal}>Xác nhận Rời Nhóm</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
