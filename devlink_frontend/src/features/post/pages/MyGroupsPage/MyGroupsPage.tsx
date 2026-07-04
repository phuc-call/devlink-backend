// src/features/post/pages/MyGroupsPage/MyGroupsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MyGroupsPage.module.css';
import { groupApi } from '../../../../api/user-service/groupApi';
import type { GroupSearchResponse, GroupRole } from '../../../../types/group.types';

export default function MyGroupsPage() {
    const [groups, setGroups] = useState<GroupSearchResponse[]>([]);
    const [roleFilter, setRoleFilter] = useState<GroupRole | ''>('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const res = await groupApi.getMyGroups(roleFilter || undefined, 0, 100);
            setGroups(res.data.data.content);
        } catch (error) {
            console.error('Failed to fetch groups', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, [roleFilter]);

    const getGroupBorderStyle = (role?: string | null) => {
        if (role === 'ADMIN') return { border: '3px solid red' };
        if (role === 'MODERATOR') return { border: '3px solid blue' };
        return {};
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Nhóm của tôi</h1>
                
                <div className={styles.filters}>
                    <span className={styles.filterLabel}>Lọc theo vai trò:</span>
                    <select 
                        className={styles.filterSelect}
                        value={roleFilter} 
                        onChange={(e) => setRoleFilter(e.target.value as GroupRole | '')}
                    >
                        <option value="">Tất cả</option>
                        <option value="ADMIN">Quản trị viên (Admin)</option>
                        <option value="MODERATOR">Người kiểm duyệt (Moderator)</option>
                        <option value="MEMBER">Thành viên (Member)</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className={styles.loading}>Đang tải danh sách nhóm...</div>
            ) : groups.length === 0 ? (
                <div className={styles.empty}>Bạn chưa tham gia nhóm nào.</div>
            ) : (
                <div className={styles.grid}>
                    {groups.map(group => (
                        <div 
                            key={group.id} 
                            className={styles.card}
                            style={getGroupBorderStyle(group.role)}
                            onClick={() => navigate(`/groups/${group.id}`)}
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
                                    <span className={styles.memberCount}>{group.memberCount} thành viên</span>
                                    <span className={styles.roleTag} data-role={group.role || 'MEMBER'}>
                                        {group.role === 'ADMIN' ? 'Quản trị viên' : 
                                         group.role === 'MODERATOR' ? 'Người kiểm duyệt' : 'Thành viên'}
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
