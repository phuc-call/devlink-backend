import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupApi } from '../../../api/user-service/groupApi';
import { userProfileApi } from '../../../api/user-service/userProfileApi';
import { GroupPrivacy } from '../../../types/group.types';
import type { UserSearchResponse } from '../../../types/profile.types';
import { useToast } from '../../../context/Toastcontext';
import styles from './CreateGroupPage.module.css';

export default function CreateGroupPage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [privacy, setPrivacy] = useState<GroupPrivacy>(GroupPrivacy.PUBLIC);
    const { showToast } = useToast();

    // Image Upload State
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [friends, setFriends] = useState<UserSearchResponse[]>([]);
    const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);

    const [loadingFriends, setLoadingFriends] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const res = await userProfileApi.searchUsers({
                    name: '',
                    friendsOnly: true,
                    page: 0,
                    size: 100
                });
                setFriends(res.data.data.users.content);
            } catch (error) {
                console.error("Failed to load friends", error);
            } finally {
                setLoadingFriends(false);
            }
        };
        void fetchFriends();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const toggleFriend = (id: number) => {
        setSelectedFriendIds(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setSubmitting(true);
        try {
            let coverUrl = '';
            // 1. Upload Cover Image if selected
            if (coverFile) {
                const uploadRes = await groupApi.uploadCoverImage(coverFile);
                coverUrl = uploadRes.data.data;
            }

            // 2. Create Group with JSON payload including the returned coverUrl
            const res = await groupApi.createGroup({
                name,
                description,
                coverImage: coverUrl,
                privacy,
                memberIds: selectedFriendIds
            });

            // Navigate to group detail page
            navigate(`/groups/${res.data.data.id}`);
        } catch (e: any) {
            console.error(e);
            const errorMsg = e.response?.data?.message || e.response?.data?.error || "Tạo nhóm thất bại. Vui lòng thử lại!";
            showToast(errorMsg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div className={styles.headerInner}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                    <h1 className={styles.pageTitle}>Tạo nhóm mới</h1>
                </div>
            </div>

            <div className={styles.container}>
                <div className={styles.mainCol}>
                    {/* Cover Upload Area */}
                    <div className={styles.card}>
                        <div
                            className={`${styles.coverUploadArea} ${coverPreview ? styles.hasPreview : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {coverPreview ? (
                                <>
                                    <img src={coverPreview} alt="Cover Preview" className={styles.coverImg} />
                                    <div className={styles.coverOverlay}>
                                        <div className={styles.uploadBadge}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                                <circle cx="12" cy="13" r="4"></circle>
                                            </svg>
                                            Thay đổi ảnh bìa
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.uploadPlaceholder}>
                                    <div className={styles.uploadIconWrap}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                            <polyline points="21 15 16 10 5 21"></polyline>
                                        </svg>
                                    </div>
                                    <p className={styles.uploadText}>Thêm ảnh bìa *</p>
                                    <p className={styles.uploadSubtext}>Tỷ lệ khuyến nghị 16:9</p>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Group Details */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Thông tin cơ bản</h2>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Tên nhóm *</label>
                            <input
                                className={styles.input}
                                placeholder="Nhập tên nhóm của bạn..."
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Quyền riêng tư</label>
                            <div className={styles.privacyOptions}>
                                <label className={`${styles.privacyOption} ${privacy === GroupPrivacy.PUBLIC ? styles.privacySelected : ''}`}>
                                    <input
                                        type="radio"
                                        name="privacy"
                                        value={GroupPrivacy.PUBLIC}
                                        checked={privacy === GroupPrivacy.PUBLIC}
                                        onChange={() => setPrivacy(GroupPrivacy.PUBLIC)}
                                        className={styles.hiddenRadio}
                                    />
                                    <div className={styles.privacyIcon}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="2" y1="12" x2="22" y2="12"></line>
                                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                        </svg>
                                    </div>
                                    <div className={styles.privacyText}>
                                        <h4>Công khai</h4>
                                        <p>Bất kỳ ai cũng có thể tìm thấy nhóm và xem thành viên.</p>
                                    </div>
                                    <div className={styles.radioIndicator}></div>
                                </label>

                                <label className={`${styles.privacyOption} ${privacy === GroupPrivacy.PRIVACY ? styles.privacySelected : ''}`}>
                                    <input
                                        type="radio"
                                        name="privacy"
                                        value={GroupPrivacy.PRIVACY}
                                        checked={privacy === GroupPrivacy.PRIVACY}
                                        onChange={() => setPrivacy(GroupPrivacy.PRIVACY)}
                                        className={styles.hiddenRadio}
                                    />
                                    <div className={styles.privacyIcon}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                        </svg>
                                    </div>
                                    <div className={styles.privacyText}>
                                        <h4>Riêng tư</h4>
                                        <p>Chỉ thành viên mới được xem các bài viết trong nhóm.</p>
                                    </div>
                                    <div className={styles.radioIndicator}></div>
                                </label>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Mô tả nhóm</label>
                            <textarea
                                className={styles.textarea}
                                placeholder="Mô tả mục đích của nhóm..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.sideCol}>
                    <div className={styles.card}>
                        <div className={styles.cardHeaderFlex}>
                            <h2 className={styles.cardTitle}>Mời bạn bè</h2>
                            <span className={styles.badge}>{selectedFriendIds.length} đã chọn</span>
                        </div>
                        <p className={styles.subLabel}>Mời ít nhất vài người bạn để nhóm thêm phần sôi nổi.</p>

                        {loadingFriends ? (
                            <div className={styles.loading}>
                                <div className={styles.spinner}></div>
                                <p>Đang tải bạn bè...</p>
                            </div>
                        ) : friends.length === 0 ? (
                            <div className={styles.emptyFriends}>
                                <div className={styles.emptyAvatar}></div>
                                <p>Bạn chưa kết bạn với ai</p>
                            </div>
                        ) : (
                            <div className={styles.friendsList}>
                                {friends.map(friend => {
                                    const isSelected = selectedFriendIds.includes(friend.userId);
                                    return (
                                        <div
                                            key={friend.userId}
                                            className={`${styles.friendCard} ${isSelected ? styles.selected : ''}`}
                                            onClick={() => toggleFriend(friend.userId)}
                                        >
                                            <div className={styles.friendAvatar}>
                                                {friend.avatarUrl ? (
                                                    <img src={friend.avatarUrl} alt={friend.fullName} />
                                                ) : (
                                                    <span>{friend.fullName?.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className={styles.friendName}>{friend.fullName}</div>
                                            <div className={styles.checkbox}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                <div className={styles.footerInner}>
                    <button className={styles.btnCancel} onClick={() => navigate(-1)} disabled={submitting}>Hủy</button>
                    <button
                        className={styles.btnSubmit}
                        onClick={handleSubmit}
                        disabled={name.trim().length < 3 || !coverFile || submitting}
                    >
                        {submitting ? 'Đang tạo...' : 'Tạo nhóm mới'}
                    </button>
                </div>
            </div>
        </div>
    );
}
