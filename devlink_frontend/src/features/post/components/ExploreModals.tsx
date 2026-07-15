import { useState } from 'react';
import { groupApi } from '../../../api/user-service/groupApi';
import { GroupPrivacy } from '../../../types/group.types';
import styles from '../pages/ExplorePage.module.css';
import { useToast } from '../../../context/Toastcontext';
import { Users, Key, X, Info } from 'lucide-react';

export function CreateGroupModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [privacy, setPrivacy] = useState<GroupPrivacy>(GroupPrivacy.PUBLIC);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            await groupApi.createGroup({ 
                name, 
                description, 
                coverImage: '',
                privacy,
                memberIds: []
            });
            showToast('Tạo nhóm thành công!', 'success');
            onSuccess();
            onClose();
        } catch (e: any) {
            console.error(e);
            showToast(e.response?.data?.message || 'Tạo nhóm thất bại', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.premiumModalOverlay} onClick={onClose}>
            <div className={styles.premiumModalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.premiumModalClose} onClick={onClose}><X size={20} /></button>
                <div className={styles.premiumModalHeader}>
                    <div className={styles.premiumModalIconWrap}><Users size={24} /></div>
                    <h3 className={styles.premiumModalTitle}>Tạo nhóm mới</h3>
                    <p className={styles.premiumModalSubtitle}>Kết nối với mọi người cùng chung sở thích</p>
                </div>
                <div className={styles.premiumModalBody}>
                    <div className={styles.premiumInputGroup}>
                        <label>Tên nhóm <span style={{color: '#EF4444'}}>*</span></label>
                        <input className={styles.premiumInput} placeholder="Nhập tên nhóm..." value={name} onChange={e => setName(e.target.value)} autoFocus />
                    </div>
                    <div className={styles.premiumInputGroup}>
                        <label>Mô tả nhóm</label>
                        <textarea className={styles.premiumInput} placeholder="Mô tả ngắn gọn về nhóm của bạn..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                    </div>
                    <div className={styles.premiumInputGroup}>
                        <label>Quyền riêng tư</label>
                        <select className={styles.premiumSelect} value={privacy} onChange={e => setPrivacy(e.target.value as GroupPrivacy)}>
                            <option value={GroupPrivacy.PUBLIC}>Công khai</option>
                            <option value={GroupPrivacy.PRIVACY}>Riêng tư</option>
                        </select>
                        <p className={styles.privacyHint}>
                            <Info size={14} /> 
                            {privacy === GroupPrivacy.PUBLIC ? ' Bất kỳ ai cũng có thể tìm và xem nội dung nhóm.' : ' Chỉ thành viên mới có thể xem nội dung nhóm.'}
                        </p>
                    </div>
                </div>
                <div className={styles.premiumModalActions}>
                    <button className={styles.premiumBtnCancel} onClick={onClose}>Hủy</button>
                    <button className={styles.premiumBtnSubmit} onClick={handleSubmit} disabled={!name.trim() || loading}>
                        {loading ? 'Đang tạo...' : 'Tạo nhóm'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function JoinGroupModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async () => {
        if (!code.trim()) return;
        setLoading(true);
        try {
            await groupApi.joinGroupByCode({ code });
            showToast("Tham gia nhóm thành công!", "success");
            onSuccess();
            onClose();
        } catch (e: any) {
            console.error(e);
            let errMsg = e.response?.data?.message || "Mã mời không hợp lệ";
            
            // Dịch các lỗi từ backend sang tiếng Việt
            if (errMsg === "Invalid invite code") {
                errMsg = "Mã mời không tồn tại hoặc đã hết hạn";
            } else if (errMsg === "User is already a member of this group") {
                errMsg = "Bạn đã là thành viên của nhóm này rồi";
            }
            
            showToast(errMsg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.premiumModalOverlay} onClick={onClose}>
            <div className={styles.premiumModalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.premiumModalClose} onClick={onClose}><X size={20} /></button>
                <div className={styles.premiumModalHeader}>
                    <div className={styles.premiumModalIconWrap}><Key size={24} /></div>
                    <h3 className={styles.premiumModalTitle}>Tham gia nhóm</h3>
                    <p className={styles.premiumModalSubtitle}>Nhập mã mời được quản trị viên cung cấp</p>
                </div>
                <div className={styles.premiumModalBody}>
                    <div className={styles.premiumInputGroup}>
                        <label>Mã mời <span style={{color: '#EF4444'}}>*</span></label>
                        <input className={styles.premiumInput} placeholder="VD: 8B3A9C..." value={code} onChange={e => setCode(e.target.value)} autoFocus />
                    </div>
                </div>
                <div className={styles.premiumModalActions}>
                    <button className={styles.premiumBtnCancel} onClick={onClose}>Hủy</button>
                    <button className={styles.premiumBtnSubmit} onClick={handleSubmit} disabled={!code.trim() || loading}>
                        {loading ? 'Đang xử lý...' : 'Tham gia'}
                    </button>
                </div>
            </div>
        </div>
    );
}
