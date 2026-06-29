import {useEffect, useState} from 'react';
import {userProfileApi} from '../api/user-service/userProfileApi';

export function useProfileSetup() {
    const [showModal, setShowModal] = useState(false);
    const [checked, setChecked] = useState(false);
    const [nudgeSentCount, setNudgeSentCount] = useState(0);
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

    useEffect(() => {
        userProfileApi.getProfile()
            .then(res => {
                setNudgeSentCount(res.data.data.nudgeSentCount || 0);
                setAvatarUrl(res.data.data.avatarUrl);
                if (res.data.data.shouldShowNudge) {
                    setShowModal(true);
                }
            })
            .catch(() => {})
            .finally(() => setChecked(true));
    }, []);

    return {showModal, checked, nudgeSentCount, avatarUrl, closeModal: () => setShowModal(false)};
}