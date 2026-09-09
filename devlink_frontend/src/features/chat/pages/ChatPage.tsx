import { useState, useEffect } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import ChatArea, { type SelectedUser } from '../components/ChatArea';
import styles from './ChatPage.module.css';

export default function ChatPage() {
    const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(() => {
        const saved = sessionStorage.getItem('chat_selectedUser');
        return saved ? JSON.parse(saved) : null;
    });
    const [showChat, setShowChat] = useState(() => {
        return sessionStorage.getItem('chat_showChat') === 'true';
    });

    useEffect(() => {
        if (selectedUser) {
            sessionStorage.setItem('chat_selectedUser', JSON.stringify(selectedUser));
        } else {
            sessionStorage.removeItem('chat_selectedUser');
        }
    }, [selectedUser]);

    useEffect(() => {
        sessionStorage.setItem('chat_showChat', String(showChat));
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