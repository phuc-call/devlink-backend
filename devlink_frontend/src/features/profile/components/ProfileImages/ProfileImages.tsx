import { useCallback, useEffect, useState } from 'react';
import { postApi } from '../../../../api/post-service/postApi';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import ImagePreviewModal from '../../../../components/common/ImagePreviewModal/ImagePreviewModal';
import type { MediaResponse } from '../../../../types/post.types';
import styles from './ProfileImages.module.css';

interface Props {
    userId: number | null; // null if current user
}

export default function ProfileImages({ userId }: Props) {
    const [mediaItems, setMediaItems] = useState<MediaResponse[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    const loadImages = useCallback((pageNum: number, reset = false) => {
        setLoading(true);
        postApi.getImagesDetails(userId, pageNum, 12)
            .then(res => {
                const data = res.data;
                const newItems = data.content || [];
                setMediaItems(prev => reset ? newItems : [...prev, ...newItems]);
                setHasMore(!data.last);
                setPage(pageNum);
            })
            .catch(() => {
                // Fallback to basic image URLs if needed
                postApi.getImages(userId, pageNum, 12)
                    .then(res => {
                        const data = res.data;
                        const urls = data.content || [];
                        const mapped: MediaResponse[] = urls.map((url, idx) => ({
                            id: idx,
                            postId: 0,
                            mediaType: 'IMAGE',
                            url: url,
                            thumbnailUrl: null,
                            originalName: '',
                            fileExtension: '',
                            fileSize: 0,
                            orderIndex: idx,
                        }));
                        setMediaItems(prev => reset ? mapped : [...prev, ...mapped]);
                        setHasMore(!data.last);
                        setPage(pageNum);
                    })
                    .catch(err => {
                        console.error('Lỗi tải hình ảnh:', err);
                        if (reset) setMediaItems([]);
                        setHasMore(false);
                    });
            })
            .finally(() => {
                setLoading(false);
                setInitialLoading(false);
            });
    }, [userId]);

    useEffect(() => {
        loadImages(0, true);
    }, [loadImages]);

    const handleLoadMore = useCallback(() => {
        loadImages(page + 1);
    }, [page, loadImages]);

    const triggerRef = useInfiniteScroll({
        onLoadMore: handleLoadMore,
        hasMore,
        isLoading: loading,
    });

    if (initialLoading) {
        return (
            <div className={styles.loadingWrap}>
                <div className={styles.spinner} />
            </div>
        );
    }

    if (mediaItems.length === 0) {
        return (
            <div className={styles.emptyCard}>
                <div className={styles.emptyIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                </div>
                <p className={styles.emptyTitle}>Chưa có ảnh nào</p>
                <p className={styles.emptySub}>Người dùng này chưa có hình ảnh nào.</p>
            </div>
        );
    }

    const imageUrls = mediaItems.map(item => item.url);

    return (
        <div className={styles.wrap}>
            <div className={styles.grid}>
                {mediaItems.map((item, i) => (
                    <div 
                        key={item.id || i} 
                        className={styles.imageItem}
                        onClick={() => setPreviewIndex(i)}
                        title="Bấm để phóng to xem chi tiết"
                    >
                        <img src={item.url} alt={`img-${i}`} className={styles.image} loading="lazy" />
                    </div>
                ))}
            </div>
            {hasMore && (
                <div ref={triggerRef} className={styles.loadingMore}>
                    {loading && <span style={{ color: '#9CA3AF', fontSize: 13 }}>Đang tải...</span>}
                </div>
            )}

            {previewIndex !== null && (
                <ImagePreviewModal
                    images={imageUrls}
                    currentIndex={previewIndex}
                    isOpen={true}
                    onClose={() => setPreviewIndex(null)}
                />
            )}
        </div>
    );
}
