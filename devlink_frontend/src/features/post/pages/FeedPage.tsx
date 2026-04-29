import ProfileSetupModal from '../../profile/components/ProfileSetupModal';
import { useProfileSetup } from '../../../hooks/useProfileSetup.ts';

export default function FeedPage() {
    const { showModal, closeModal } = useProfileSetup();
    return (
        <>
            {showModal && <ProfileSetupModal onClose={closeModal} />}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '40vh',
                color: '#6B7280',
                fontSize: 14,
                gap: 8,
            }}>
                <span style={{ fontSize: 32 }}>🚧</span>
                <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>Feed — Coming soon</p>
                <p style={{ margin: 0 }}>Bài đăng sẽ hiển thị ở đây</p>
            </div>
        </>
    );
}