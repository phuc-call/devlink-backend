import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllPendingSuggestions } from '../../../../api/post-service/suggestionApi';
import type { SuggestionSummary } from '../../../../types/suggestion.types';
import { getUserInfoById } from '../../../../api/post-service/suggestionApi';
import type { UserInfo } from '../../../../types/suggestion.types';
import SuggestionRow from './SuggestionRow';
import styles from './SuggestionList.module.css';

interface Props {
    onSelect: (id: number) => void;
}

export default function SuggestionList({ onSelect }: Props) {
    const [items, setItems]       = useState<SuggestionSummary[]>([]);
    const [userMap, setUserMap]   = useState<Record<number, UserInfo>>({});
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);
    const [page, setPage]         = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal]       = useState(0);
    const PAGE_SIZE = 10;

    const fetchData = useCallback(async (p: number) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllPendingSuggestions(p, PAGE_SIZE);
            setItems(data.content);
            setTotalPages(data.totalPages);
            setTotal(data.totalElements);

            // fetch avatar + tên cho từng userId unique
            const uniqueIds = [...new Set(data.content.map(s => s.userId))];
            const entries = await Promise.all(
                uniqueIds.map(async id => {
                    const info = await getUserInfoById(id).catch(() => null);
                    return [id, info ?? { userName: `User #${id}`, avatar: null }] as const;
                }),
            );
            setUserMap(prev => ({ ...prev, ...Object.fromEntries(entries) }));
        } catch {
            setError('Không thể tải danh sách đề xuất. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void fetchData(page); }, [fetchData, page]);

    return (
        <div className={styles.wrap}>
            <div className={styles.header}>
                <div>
                    <span className={styles.title}>Đề xuất chờ duyệt</span>
                    {!loading && (
                        <span className={styles.badge}>{total}</span>
                    )}
                </div>
                <button
                    className={styles.refreshBtn}
                    onClick={() => fetchData(page)}
                    disabled={loading}
                    title="Tải lại"
                >
                    <RefreshCw size={14} className={loading ? styles.spin : ''} />
                </button>
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                    <button onClick={() => fetchData(page)}>Thử lại</button>
                </div>
            )}

            {loading && (
                <div className={styles.skeletonWrap}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={styles.skeletonRow} />
                    ))}
                </div>
            )}

            {!loading && !error && items.length === 0 && (
                <div className={styles.empty}>Không có đề xuất nào đang chờ duyệt.</div>
            )}

            {!loading && !error && items.length > 0 && (
                <>
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Người đề xuất</th>
                                <th>Template ID</th>
                                <th>Fork ID</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {items.map(item => (
                                <SuggestionRow
                                    key={item.id}
                                    item={item}
                                    userInfo={userMap[item.userId] ?? null}
                                    onView={() => onSelect(item.id)}
                                />
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                className={styles.pageBtn}
                                onClick={() => setPage(p => p - 1)}
                                disabled={page === 0}
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className={styles.pageInfo}>
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                className={styles.pageBtn}
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= totalPages - 1}
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}