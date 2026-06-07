import { Eye } from 'lucide-react';
import type { SuggestionSummary, UserInfo } from '../../../../types/suggestion.types';
import styles from './SuggestionList.module.css';

interface Props {
    item: SuggestionSummary;
    userInfo: UserInfo | null;
    onView: () => void;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

const STATUS_LABEL: Record<string, string> = {
    PENDING:   'Chờ duyệt',
    REVIEWING: 'Đang xem',
};

const STATUS_CLASS: Record<string, string> = {
    PENDING:   styles.statusPending,
    REVIEWING: styles.statusReviewing,
};

export default function SuggestionRow({ item, userInfo, onView }: Props) {
    return (
        <tr className={styles.row}>
            <td>
                <div className={styles.userCell}>
                    {userInfo?.avatar
                        ? <img src={userInfo.avatar} className={styles.avatar} alt="" />
                        : (
                            <div className={styles.avatarFallback}>
                                {(userInfo?.userName ?? '?')[0].toUpperCase()}
                            </div>
                        )
                    }
                    <span className={styles.userName}>
                        {userInfo?.userName ?? `User #${item.userId}`}
                    </span>
                </div>
            </td>
            <td className={styles.idCell}>#{item.templateId}</td>
            <td className={styles.idCell}>#{item.forkId}</td>
            <td>
                <span className={`${styles.statusBadge} ${STATUS_CLASS[item.status] ?? ''}`}>
                    {STATUS_LABEL[item.status] ?? item.status}
                </span>
            </td>
            <td className={styles.dateCell}>{formatDate(item.createdAt)}</td>
            <td>
                <button className={styles.viewBtn} onClick={onView} title="Xem chi tiết">
                    <Eye size={13} /> Xem
                </button>
            </td>
        </tr>
    );
}