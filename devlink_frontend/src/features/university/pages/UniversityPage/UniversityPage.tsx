import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { universityApi } from '../../../../api/user-service/universityApi';
import type { UniversityResponse } from '../../../../api/user-service/universityApi';
import UniversitySidebar from '../../components/UniversitySidebar/UniversitySidebar';
import UniversityContent from '../../components/UniversityContent/UniversityContent';
import styles from './UniversityPage.module.css';

export default function UniversityPage() {
    const { name } = useParams<{ name: string }>();
    const [university, setUniversity] = useState<UniversityResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!name) return;
        
        setLoading(true);
        universityApi.getByName(name)
            .then(res => {
                setUniversity(res.data.data);
                setError(null);
            })
            .catch(() => {
                setError("Could not load university information.");
                setUniversity(null);
            })
            .finally(() => setLoading(false));
    }, [name]);

    if (loading) {
        return (
            <div className={styles.loadingWrap}>
                <div className={styles.spinner} />
            </div>
        );
    }

    if (error || !university) {
        return (
            <div className={styles.errorWrap}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                    stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <p className={styles.errorTitle}>Không tìm thấy thông tin</p>
                <p className={styles.errorSub}>{error || "University not found"}</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.body}>
                <aside className={styles.sidebar}>
                    <UniversitySidebar university={university} />
                </aside>
                <main className={styles.content}>
                    <UniversityContent university={university} />
                </main>
            </div>
        </div>
    );
}
