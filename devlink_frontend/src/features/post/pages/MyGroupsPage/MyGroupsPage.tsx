// src/features/post/pages/MyGroupsPage/MyGroupsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './MyGroupsPage.module.css';
import { groupApi } from '../../../../api/user-service/groupApi';
import type { GroupSearchResponse } from '../../../../types/group.types';

export default function MyGroupsPage() {
    const [groups, setGroups] = useState<GroupSearchResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Read role from URL search param (set by sidebar NavLinks)
    const roleFilter = searchParams.get('role') ?? '';

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                setLoading(true);
                const res = await groupApi.getMyGroups(roleFilter || undefined, 0, 20);
                setGroups(res.data.data.content);
            } catch (error) {
                console.error('Failed to fetch groups', error);
            } finally {
                setLoading(false);
            }
        };
        void fetchGroups();
    }, [roleFilter]);

    const getTitle = () => {
        if (roleFilter === 'ADMIN') return 'Groups You Manage';
        return 'Your Groups';
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{getTitle()}</h1>
            </div>

            {loading ? (
                <div className={styles.loading}>Loading groups...</div>
            ) : groups.length === 0 ? (
                <div className={styles.empty}>No groups found.</div>
            ) : (
                <div className={styles.grid}>
                    {groups.map(group => (
                        <div
                            key={group.id}
                            className={styles.card}
                            onClick={() => navigate(`/groups/${group.id}`, { state: { group } })}
                        >
                            <div className={styles.cardCover}>
                                {group.coverImage ? (
                                    <img src={group.coverImage} alt={group.name} />
                                ) : (
                                    <div className={styles.placeholderCover} />
                                )}
                            </div>
                            <div className={styles.cardContent}>
                                <h3 className={styles.cardTitle}>{group.name}</h3>
                                <p className={styles.cardDesc}>{group.description}</p>
                                <div className={styles.cardFooter}>
                                    <span className={styles.memberCount}>{group.memberCount} members</span>
                                    <span className={styles.roleTag} data-role={group.role || 'MEMBER'}>
                                        {group.role === 'ADMIN' ? 'Admin' :
                                         group.role === 'MODERATOR' ? 'Moderator' : 'Member'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

