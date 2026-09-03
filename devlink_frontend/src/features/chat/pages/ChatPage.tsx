import { useState } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import ChatArea, { type SelectedUser } from '../components/ChatArea';
import styles from './ChatPage.module.css';

export default function ChatPage() {
    const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
    const [showChat, setShowChat] = useState(false);

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