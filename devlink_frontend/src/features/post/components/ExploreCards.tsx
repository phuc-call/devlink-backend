import { useNavigate } from 'react-router-dom';
import type { UserSearchResponse } from '../../../types/profile.types';
import type { GroupSearchResponse } from '../../../types/group.types';
import styles from '../pages/ExplorePage.module.css';

export function UserCard({ user }: { readonly user: UserSearchResponse }) {
    const navigate = useNavigate();

    const handleClick = () => {
        void navigate(`/profile/${user.userId}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
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
                {user.avatarUrl
                    ? <img src={user.avatarUrl} alt={user.fullName} />
                    : <span>{user.fullName?.charAt(0).toUpperCase()}</span>
                }
            </div>
            <div className={styles.cardInfo}>
                <p className={styles.cardName}>{user.fullName}</p>
            </div>
        </div>
    );
}

import { useState } from 'react';
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
            <div className={styles.cardInfo} style={{ flex: 1 }}>
                <p className={styles.cardName}>{group.name}</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{group.memberCount} thành viên</p>
                {group.description && (
                    <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                        {group.description.length > 50 ? group.description.substring(0, 50) + '...' : group.description}
                    </p>
                )}
            </div>
            <div className={styles.cardAction} style={{ paddingLeft: 12 }}>
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
