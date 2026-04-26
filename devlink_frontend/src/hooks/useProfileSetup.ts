import {useEffect, useState} from 'react';
import {userProfileApi} from '../api/user-service/userProfileApi';

export function useProfileSetup() {
    const [showModal, setShowModal] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        userProfileApi.getProfile()
            .then(res => {
                const {completionPercent, nudgeDismissedForever, nextNudgeAt} = res.data.data;
                if (nudgeDismissedForever) return;
                if (nextNudgeAt && new Date(nextNudgeAt) > new Date()) return;
                if (completionPercent === 0) setShowModal(true);
            })
            .catch(() => {})
            .finally(() => setChecked(true));
    }, []);

    return {showModal, checked, closeModal: () => setShowModal(false)};
}
