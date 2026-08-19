import type { UniversityResponse } from '../../../../api/user-service/universityApi';
import styles from './UniversityContent.module.css';

interface Props {
    university: UniversityResponse | null;
}

export default function UniversityContent({ university }: Props) {
    if (!university) return null;

    return (
        <div className={styles.wrap}>
            <div className={styles.card}>
                <h2 className={styles.title}>Introduction</h2>
                
                <div className={styles.description}>
                    {university.description}
                </div>
                
                {university.images && university.images.length > 0 && (
                    <>
                        <h3 className={styles.galleryTitle}>Campus Photos</h3>
                        <div className={styles.galleryGrid}>
                            {university.images.map((img, idx) => (
                                <div key={idx} className={styles.imageWrap}>
                                    <img src={img} alt={`Campus photo ${idx + 1}`} className={styles.image} loading="lazy" />
                                </div>
                            ))}
                        </div>
                    </>
                )}
                
                {(!university.description || university.description.trim() === '') && (!university.images || university.images.length === 0) && (
                    <div className={styles.noInfo}>
                        No additional information available for this university.
                    </div>
                )}
            </div>
        </div>
    );
}
