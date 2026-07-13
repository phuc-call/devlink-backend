import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../context/Toastcontext';
import type { UserSearchResponse } from '../../../types/profile.types';
import type { GroupSearchResponse } from '../../../types/group.types';
import styles from '../pages/ExplorePage.module.css';

import { CheckCircle } from 'lucide-react';
import { followApi } from '../../../api/user-service/followApi';

export function UserCard({
    user,
    verified,
    showFollow = false,
    initialFollowStatus,
}: {
    readonly user: UserSearchResponse;
    readonly verified?: boolean;
    readonly showFollow?: boolean;
    readonly initialFollowStatus?: string; // 'FOLLOWING' | 'FRIEND' | 'NOT_FOLLOWING'
}) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [followStatus, setFollowStatus] = useState<string>(initialFollowStatus ?? 'NOT_FOLLOWING');
    const [following, setFollowing] = useState(false);
    
    // Menu state
    const [showMenu, setShowMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState<'down' | 'up'>('down');
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClick = () => {
        void navigate(`/profile/${user.userId}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
    };

    const handleFollow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (following || followStatus === 'FOLLOWING' || followStatus === 'FRIEND') return;
        setFollowing(true);
        try {
            await followApi.followUser(user.userId);
            setFollowStatus('FOLLOWING');
        } catch {
            // silently fail
        } finally {
            setFollowing(false);
        }
    };

    const getFollowLabel = () => {
        if (followStatus === 'FRIEND') return 'Bạn bè';
        if (followStatus === 'FOLLOWING') return 'Đang follow';
        return 'Theo dõi';
    };

    const handleMessage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        navigate(`/chat`);
    };

    const handleBlock = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        try {
            const res = await followApi.blockUser(user.userId);
            showToast(res.data.data?.message || 'Đã cập nhật trạng thái chặn', 'success');
        } catch {
            showToast('Có lỗi xảy ra khi chặn người dùng', 'error');
        }
    };

    const handleReport = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        showToast('Chức năng tố cáo đang được phát triển!', 'info');
    };

    const isAlreadyConnected = followStatus === 'FOLLOWING' || followStatus === 'FRIEND';

    return (
        <div
            className={styles.card}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
        >
            <div className={styles.cardAvatar}>
                {user.avatarUrl
                    ? <img src={user.avatarUrl} alt={user.fullName} />
                    : <span>{user.fullName?.charAt(0).toUpperCase()}</span>
                }
            </div>
            <div className={styles.cardInfo}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                    <p className={styles.cardName}>{user.fullName}</p>
                    {verified && <CheckCircle size={14} color="#3B82F6" style={{ flexShrink: 0 }} />}
                </div>
            </div>
            {showFollow && (
                <div className={styles.cardAction} onClick={e => e.stopPropagation()}>
                    <button
                        onClick={handleFollow}
                        disabled={following || isAlreadyConnected}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: (following || isAlreadyConnected) ? 'default' : 'pointer',
                            backgroundColor: isAlreadyConnected ? '#F3F4F6' : '#EBF5FF',
                            color: isAlreadyConnected ? '#6B7280' : '#2563EB',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            opacity: following ? 0.6 : 1,
                        }}
                    >
                        {following ? '...' : getFollowLabel()}
                    </button>
                </div>
            )}
            
            <div 
                ref={menuRef} 
                style={{ position: 'relative', marginLeft: 'auto', paddingLeft: showFollow ? 4 : 0 }} 
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={() => {
                        if (!showMenu && menuRef.current) {
                            const rect = menuRef.current.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            if (spaceBelow < 150 && rect.top > 150) {
                                setMenuPosition('up');
                            } else {
                                setMenuPosition('down');
                            }
                        }
                        setShowMenu(p => !p);
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    style={{
                        background: 'transparent', border: 'none', padding: '6px', 
                        cursor: 'pointer', color: '#6B7280', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background-color 0.2s',
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                    </svg>
                </button>
                {showMenu && (
                    <div style={{
                        position: 'absolute', right: 0, 
                        ...(menuPosition === 'up' ? { bottom: '100%', marginBottom: '4px' } : { top: '100%', marginTop: '4px' }),
                        background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                        width: '180px', zIndex: 10, padding: '4px 0',
                    }}>
                        <button onClick={handleMessage} 
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        style={{
                            width: '100%', textAlign: 'left', padding: '8px 16px', background: 'transparent', border: 'none', 
                            fontSize: '13px', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'background-color 0.1s'
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            Nhắn tin
                        </button>
                        <button onClick={handleBlock} 
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        style={{
                            width: '100%', textAlign: 'left', padding: '8px 16px', background: 'transparent', border: 'none', 
                            fontSize: '13px', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'background-color 0.1s'
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                            Chặn / Bỏ chặn
                        </button>
                        <button onClick={handleReport} 
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        style={{
                            width: '100%', textAlign: 'left', padding: '8px 16px', background: 'transparent', border: 'none', 
                            fontSize: '13px', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'background-color 0.1s'
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                            Tố cáo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

import { groupApi } from '../../../api/user-service/groupApi';

export function GroupCard({ group }: { group: GroupSearchResponse }) {
    const navigate = useNavigate();
    const [joinStatus, setJoinStatus] = useState<string | null | undefined>(group.joinStatus);
    const [joining, setJoining] = useState(false);

    const handleClick = () => {
        void navigate(`/groups/${group.id}`, { state: { group: { ...group, joinStatus } } });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
    };

    const handleJoin = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (joining || joinStatus === 'PENDING' || joinStatus === 'APPROVED') return;
        setJoining(true);
        try {
            await groupApi.joinGroup(group.id);
            setJoinStatus('PENDING'); // Automatically assumes PENDING or APPROVED, UI shows "Đã gửi yêu cầu" as a fallback
        } catch (error: any) {
            if (error?.response?.data?.message === 'USER_ALREADY_IN_GROUP') {
                setJoinStatus('APPROVED');
            }
        } finally {
            setJoining(false);
        }
    };

    return (
        <div
            className={styles.card}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
        >
            <div className={styles.cardAvatar}>
                {group.coverImage
                    ? <img src={group.coverImage} alt={group.name} />
                    : <span>{group.name?.charAt(0).toUpperCase()}</span>
                }
            </div>
            <div className={styles.cardInfo} style={{ flex: 1, minWidth: 0 }}>
                <p className={styles.cardName} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{group.memberCount} thành viên</p>
                {group.description && (
                    <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0 0', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {group.description}
                    </p>
                )}
            </div>
            <div className={styles.cardAction} style={{ paddingLeft: 12, flexShrink: 0 }}>
                {joinStatus === 'APPROVED' ? null : (
                    <button
                        onClick={handleJoin}
                        disabled={joinStatus === 'PENDING' || joining}
                        className={`${styles.joinBtn} ${joinStatus === 'PENDING' ? styles.pendingBtn : ''}`}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: (joinStatus === 'PENDING' || joining) ? 'default' : 'pointer',
                            backgroundColor: joinStatus === 'PENDING' ? '#F3F4F6' : '#EBF5FF',
                            color: joinStatus === 'PENDING' ? '#6B7280' : '#2563EB',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {joinStatus === 'PENDING' ? 'Đã gửi yêu cầu' : 'Tham gia'}
                    </button>
                )}
            </div>
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className={`${styles.card} ${styles.skeleton}`}>
            <div className={styles.skeletonAvatar} />
            <div className={styles.skeletonInfo}>
                <div className={styles.skeletonLine} />
            </div>
        </div>
    );
}
