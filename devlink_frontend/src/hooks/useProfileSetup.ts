import {useEffect, useState} from 'react';
import {userProfileApi} from '../api/user-service/userProfileApi';

export function useProfileSetup() {
    const [showModal, setShowModal] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        userProfileApi.getProfile()
            .then(res => {
                if (res.data.data.shouldShowNudge) {
                    setShowModal(true);
                }
            })
            .catch(() => {})
            .finally(() => setChecked(true));
    }, []);

    return {showModal, checked, closeModal: () => setShowModal(false)};
}