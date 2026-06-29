import { useEffect, useState } from 'react';
import { userProfileApi } from '../../../../api/user-service/userProfileApi';
import styles from './ImageViewer.module.css';

interface Props {
    userId: number;
    type: 'avatar' | 'cover';
    onClose: () => void;
}

export default function ImageViewer({ userId, type, onClose }: Props) {
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        const fetchImg = type === 'avatar' 
            ? userProfileApi.getAvatarUrl(userId) 
            : userProfileApi.getCoverImageUrl(userId);
        
        fetchImg
            .then(res => {
                setImgUrl(res.data.data);
            })
            .catch(err => {
                if (err.response?.status === 404) {
                    setError('Hình ảnh không tồn tại');
                } else if (err.response?.status === 403) {
                    setError('Bạn không có quyền xem hình ảnh này');
                } else {
                    setError('Có lỗi xảy ra khi tải hình ảnh');
                }
            })
            .finally(() => setLoading(false));
    }, [userId, type]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.container} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : error ? (
                    <div className={styles.error}>{error}</div>
                ) : imgUrl ? (
                    <img src={imgUrl} alt={type} className={styles.image} />
                ) : null}
            </div>
        </div>
    );
}
