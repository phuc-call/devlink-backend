import { SESSION_KEYS } from '../../../constants/storage';
import { useState, useEffect } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import ChatArea, { type SelectedUser } from '../components/ChatArea';
import styles from './ChatPage.module.css';

export default function ChatPage() {
    const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(() => {
        const saved = sessionStorage.getItem(SESSION_KEYS.CHAT_SELECTED_USER);
        return saved ? JSON.parse(saved) : null;
    });
    const [showChat, setShowChat] = useState(() => {
        return sessionStorage.getItem(SESSION_KEYS.CHAT_SHOW_CHAT) === 'true';
    });

    useEffect(() => {
        if (selectedUser) {
            sessionStorage.setItem(SESSION_KEYS.CHAT_SELECTED_USER, JSON.stringify(selectedUser));
        } else {
            sessionStorage.removeItem(SESSION_KEYS.CHAT_SELECTED_USER);
        }
    }, [selectedUser]);

    useEffect(() => {
        sessionStorage.setItem(SESSION_KEYS.CHAT_SHOW_CHAT, String(showChat));
    }, [showChat]);

    const handleSelectUser = (user: SelectedUser) => {
        setSelectedUser(user);
        setShowChat(true);
    };

    const handleBack = () => {
        setShowChat(false);
    };

    return (
        <div className={styles.container}>
            <div className={`${styles.sidebarWrapper} ${showChat ? styles.sidebarHidden : ''}`}>
                <ChatSidebar
                    selectedUserId={selectedUser?.userId ?? null}
                    onSelectUser={handleSelectUser}
                />
            </div>
            <div className={`${styles.chatAreaWrapper} ${!showChat ? styles.chatHidden : ''}`}>
                <ChatArea selectedUser={selectedUser} onBack={handleBack} />
            </div>
        </div>
    );
}