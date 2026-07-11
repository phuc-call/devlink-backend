import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { groupApi } from '../../../api/user-service/groupApi';
import { GroupPrivacy, type GroupMemberResponse, type GroupCandidateResponse } from '../../../types/group.types';
import type { UserSearchResponse } from '../../../types/profile.types';
import styles from './GroupDetailPage.module.css';
import { useToast } from '../../../context/Toastcontext';
import { Settings, Users, LogOut, Shield, ShieldAlert, Check, X, Copy, RefreshCw, MoreHorizontal, Flag, Lock } from 'lucide-react';

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
    const [initializing, setInitializing] = useState(!groupInfo);

    const [joinStatus, setJoinStatus] = useState<string | null | undefined>(groupInfo?.joinStatus || (groupInfo?.role ? 'APPROVED' : null));
    const [joining, setJoining] = useState(false);

    // State cho Members
    const [members, setMembers] = useState<GroupMemberResponse[]>([]);
    const [pendingMembers, setPendingMembers] = useState<UserSearchResponse[]>([]);
    const [candidates, setCandidates] = useState<GroupCandidateResponse[]>([]);

    const [myUserId, setMyUserId] = useState<number | null>(null);
    const [myRole, setMyRole] = useState<'ADMIN' | 'MODERATOR' | 'MEMBER' | null>(groupInfo?.role || null);

    // State cho Settings
    const [editName, setEditName] = useState(groupInfo?.name || '');
    const [editDesc, setEditDesc] = useState(groupInfo?.description || '');
    const [editPrivacy, setEditPrivacy] = useState<GroupPrivacy>(GroupPrivacy.PUBLIC);
    const [inviteCode, setInviteCode] = useState(groupInfo?.inviteCode || '');
    const [updatingGroup, setUpdatingGroup] = useState(false);
    const [generatingCode, setGeneratingCode] = useState(false);
    
    // Modal Rời nhóm & Menu
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [selectedNewAdmin, setSelectedNewAdmin] = useState<number | null>(null);
    const [showMoreMenu, setShowMoreMenu] = useState(false);

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

                // 1. Lấy My Profile (just to have it if needed)
                const { userProfileApi } = await import('../../../api/user-service/userProfileApi');
                const profileRes = await userProfileApi.getProfile();
                setMyUserId(profileRes.data.data.userId);

                // Initialize role from backend response
                if (groupData.role) {
                    setMyRole(groupData.role);
                }
            } catch (err: any) {
                console.error(err);
                if (err.response?.status === 403 || err.response?.data?.code === 'NO_PERMISSION') {
                    // It's fine if they don't have permission to view members, but getGroupById shouldn't throw 403
                } else {
                    showToast("Không tìm thấy thông tin nhóm.", "error");
                }
            } finally {
                setInitializing(false);
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
            if (myRole === 'ADMIN') {
                await groupApi.leaveAdminGroup(groupId, selectedNewAdmin || undefined);
            } else {
                await groupApi.leaveGroup(groupId);
            }
            showToast("Rời nhóm thành công", "success");
            navigate('/explore');
        } catch (err: any) {
            showToast(err.response?.data?.message || "Rời nhóm thất bại", "error");
        }
    };

    const handleConfirmLeaveModal = () => {
        executeLeaveGroup();
    };

    const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        try {
            showToast("Đang tải ảnh lên...", "info");
            const res = await groupApi.uploadCoverImage(file);
            const coverUrl = res.data.data;
            await groupApi.updateGroup(groupId, {
                name: groupInfo?.name || '',
                description: groupInfo?.description || '',
                privacy: groupInfo?.privacy || GroupPrivacy.PUBLIC,
                coverImage: coverUrl
            });
            setGroupInfo({ ...groupInfo, coverImage: coverUrl });
            showToast("Cập nhật ảnh bìa thành công!", "success");
        } catch (err: any) {
            showToast(err.response?.data?.message || "Lỗi khi tải ảnh lên", "error");
        }
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

    const isPrivateAndNotMember = groupInfo?.privacy === 'PRIVACY' && !myRole;

    return (
        <div className={styles.container}>
            <div className={styles.coverWrapper}>
                <img src={groupInfo?.coverImage || 'https://via.placeholder.com/1200x400'} alt="Cover" className={styles.coverImage} />
                {myRole === 'ADMIN' && (
                    <label className={styles.coverUploadBtn}>
                        Thay ảnh bìa
                        <input type="file" accept="image/*" onChange={handleCoverImageChange} style={{ display: 'none' }} />
                    </label>
                )}
                <div className={styles.groupHeaderInfo}>
                    <h1 className={styles.groupName}>{groupInfo?.name || 'Đang tải...'}</h1>
                    <p className={styles.groupDescription}>{groupInfo?.description}</p>
                    <div className={styles.groupStats}>
                        <Users size={16} /> {groupInfo?.memberCount || 1} thành viên
                    </div>
                </div>
            </div>

            <div className={styles.navbar}>
                {isPrivateAndNotMember ? (
                    <div className={styles.navTabs}>
                        <div style={{ padding: '16px 24px', color: '#6B7280', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Lock size={18} />
                            Nhóm riêng tư
                        </div>
                    </div>
                ) : (
                    <div className={styles.navTabs}>
                        <button className={`${styles.navBtn} ${activeTab === 'feed' ? styles.active : ''}`} onClick={() => setActiveTab('feed')}>Thảo luận</button>
                        <button className={`${styles.navBtn} ${activeTab === 'members' ? styles.active : ''}`} onClick={() => setActiveTab('members')}>Thành viên</button>
                        
                        {(myRole === 'ADMIN' || myRole === 'MODERATOR') && (
                            <button className={`${styles.navBtn} ${activeTab === 'pending' ? styles.active : ''}`} onClick={() => setActiveTab('pending')}>Phê duyệt</button>
                        )}
                        
                        {myRole === 'ADMIN' && (
                            <button className={`${styles.navBtn} ${activeTab === 'settings' ? styles.active : ''}`} onClick={() => setActiveTab('settings')}><Settings size={16} /> Cài đặt</button>
                        )}
                    </div>
                )}

                <div className={styles.navActions}>
                    {initializing ? (
                        <button className={styles.pendingBtn} disabled>Đang tải...</button>
                    ) : myRole ? (
                        <>
                            <div style={{ position: 'relative' }}>
                                <button 
                                    className={styles.moreBtn} 
                                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                                
                                {showMoreMenu && (
                                    <>
                                        <div 
                                            style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
                                            onClick={() => setShowMoreMenu(false)} 
                                        />
                                        <div className={styles.dropdownMenu}>
                                            <button 
                                                className={styles.dropdownItem}
                                                onClick={() => {
                                                    setShowMoreMenu(false);
                                                    showToast("Tính năng Tố cáo nhóm đang phát triển", "info");
                                                }}
                                            >
                                                <Flag size={16} /> Tố cáo nhóm
                                            </button>
                                            <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />
                                            <button 
                                                className={`${styles.dropdownItem} ${styles.danger}`}
                                                onClick={() => {
                                                    setShowMoreMenu(false);
                                                    handleLeaveGroupBtnClick();
                                                }}
                                            >
                                                <LogOut size={16} /> Rời nhóm
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
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
            </div>

            <div className={styles.content}>
                {isPrivateAndNotMember ? (
                    <div className={styles.tabContent} style={{ textAlign: 'center', padding: '64px 24px', color: '#6B7280' }}>
                        <Lock size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 8px', color: '#111827' }}>Đây là nhóm riêng tư</h3>
                        <p style={{ margin: 0 }}>Hãy tham gia nhóm để xem các bài viết và thành viên.</p>
                    </div>
                ) : (
                    <>
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
                                        {myRole === 'ADMIN' && m.role !== 'ADMIN' && (
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
                                    <div key={c.id} className={styles.memberItem}>
                                        <div className={styles.memberInfo}>
                                            <img src={c.avatar || 'https://via.placeholder.com/40'} alt={c.name} className={styles.memberAvatar} />
                                            <div>
                                                <h4>{c.name}</h4>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </>
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
                                        <option key={c.id} value={c.id}>{c.name}</option>
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
