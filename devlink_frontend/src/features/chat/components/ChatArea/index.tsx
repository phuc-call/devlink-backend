import { Paperclip, Image as ImageIcon, Smile, Send, ArrowLeft, MoreHorizontal } from 'lucide-react';
import styles from './ChatArea.module.css';

export interface SelectedUser {
    userId: number;
    fullName: string;
    avatar?: string;
}

interface ChatAreaProps {
    selectedUser: SelectedUser | null;
    onBack?: () => void;
}

export default function ChatArea({ selectedUser, onBack }: ChatAreaProps) {
    const initials = selectedUser?.fullName
        ? selectedUser.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
        : '?';

    if (!selectedUser) {
        return (
            <div className={styles.chatArea} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#6B7280', fontSize: '1.125rem' }}>Select a conversation to start chatting</div>
            </div>
        );
    }

    return (
        <div className={styles.chatArea}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.userInfo}>
                    {onBack && (
                        <button className={styles.backBtn} onClick={onBack} title="Quay lại">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    {selectedUser.avatar ? (
                        <img
                            src={selectedUser.avatar}
                            alt="User Avatar"
                            className={styles.avatar}
                        />
                    ) : (
                        <div className={styles.avatar} style={{ backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#4B5563' }}>
                            {initials}
                        </div>
                    )}
                    <div>
                        <div className={styles.userName}>{selectedUser.fullName}</div>
                        <div className={styles.status}>Active now</div>
                    </div>
                </div>
                <div className={styles.actions}>
                    {/* Đã loại bỏ các nút chức năng chưa có API */}
                </div>
            </div>

            {/* Vùng tin nhắn */}
            <div className={styles.messageListWrapper}>
                <div className={styles.messageListContent}>
                    {/* Tin nhắn thật sẽ được gọi API đổ vào đây */}
                </div>
            </div>

            {/* Input Area */}
            <div className={styles.inputArea}>
                <div className={styles.inputContainer}>
                    <div className={styles.inputActions}>
                        {/* 3 chấm: chỉ hiện trên mobile, thay thế cho 2 icon ẩn */}
                        <button className={`${styles.iconBtn} ${styles.moreBtn}`} title="More">
                            <MoreHorizontal size={20} />
                        </button>
                        <button className={`${styles.iconBtn} ${styles.desktopOnly}`} title="Attach file">
                            <Paperclip size={20} />
                        </button>
                        <button className={`${styles.iconBtn} ${styles.desktopOnly}`} title="Send image">
                            <ImageIcon size={20} />
                        </button>
                        <button className={styles.iconBtn} title="Send emoji">
                            <Smile size={20} />
                        </button>
                    </div>

                    <input
                        type="text"
                        className={styles.inputBox}
                        placeholder="Type a message..."
                    />

                    <button className={styles.sendBtn} title="Send message">
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
