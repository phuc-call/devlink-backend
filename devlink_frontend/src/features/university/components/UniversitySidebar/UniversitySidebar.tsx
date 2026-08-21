import type { UniversityResponse } from '../../../../api/user-service/universityApi';
import styles from './UniversitySidebar.module.css';

interface Props {
    university: UniversityResponse | null;
}

export default function UniversitySidebar({ university }: Props) {
    if (!university) return null;

    const decodedName = decodeURIComponent(university.name);

    const displayDomain = university.domains && university.domains.length > 0 
        ? university.domains[0] 
        : null;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                {university.logo && (
                    <div className={styles.avatarWrap}>
                        <img src={university.logo} alt={`${decodedName} logo`} className={styles.avatar} />
                    </div>
                )}
                <h1 className={styles.name}>{decodedName}</h1>
                <p className={styles.bio}>Educational Institution</p>
            </div>

            <div className={styles.divider} />

            <div className={styles.infoList}>
                {displayDomain && (
                    <div className={styles.infoRow}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                        <a href={`http://${displayDomain}`} target="_blank" rel="noopener noreferrer">
                            {displayDomain}
                        </a>
                    </div>
                )}
                
                {university.country && (
                    <div className={styles.infoRow}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>
                            {university.stateProvince ? `${university.stateProvince}, ` : ''}
                            {university.country}
                            {university.alphaTwoCode ? ` (${university.alphaTwoCode})` : ''}
                        </span>
                    </div>
                )}
            </div>
            
            {university.webPages && university.webPages.length > 0 && (
                <>
                    <div className={styles.divider} />
                    <div className={styles.infoList}>
                        <p className={styles.sectionTitle}>Official Web Pages</p>
                        {university.webPages.map((page, index) => (
                            <div key={index} className={styles.infoRow}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                </svg>
                                <a href={page} target="_blank" rel="noopener noreferrer">
                                    {page.replace(/^https?:\/\//, '')}
                                </a>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
