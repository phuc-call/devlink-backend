// src/components/post/CreatePostModal/CreatePostModal.tsx
import { useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import { Globe, Users, Lock, ChevronDown, X } from 'lucide-react';
import { createPostApi } from '../../../api/post-service/createPostApi';
import type { CreatePostRequest, Visibility } from '../../../types/post.types';
import styles from './CreatePostModal.module.css';

interface CreatePostModalProps {
    onClose: () => void;
    onSuccess?: () => void;
    avatarUrl?: string;
    displayName?: string;
}

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: React.ReactNode }[] = [
    { value: 'PUBLIC',         label: 'Công khai',       icon: <Globe size={13} /> },
    { value: 'FOLLOWERS_ONLY', label: 'Người theo dõi',  icon: <Users size={13} /> },
    { value: 'PRIVATE',        label: 'Chỉ mình tôi',   icon: <Lock  size={13} /> },
];

export default function CreatePostModal({
                                            onClose,
                                            onSuccess,
                                            avatarUrl,
                                            displayName,
                                        }: CreatePostModalProps) {
    const [content, setContent] = useState('');
    const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
    const [visibilityOpen, setVisibilityOpen] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        if (mediaFiles.length + selected.length > 10) {
            setError('Tối đa 10 file mỗi bài viết');
            return;
        }
        setError(null);
        setMediaFiles((prev) => [...prev, ...selected]);
        setMediaPreviews((prev) => [
            ...prev,
            ...selected.map((f) => URL.createObjectURL(f)),
        ]);
        e.target.value = '';
    };

    const removeFile = (index: number) => {
        URL.revokeObjectURL(mediaPreviews[index]);
        setMediaFiles((prev) => prev.filter((_, i) => i !== index));
        setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const addTag = () => {
        const t = tagInput.trim().replace(/^#/, '');
        if (!t || tags.includes(t) || tags.length >= 20) return;
        setTags((prev) => [...prev, t]);
        setTagInput('');
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        }
    };

    const removeTag = (tag: string) =>
        setTags((prev) => prev.filter((t) => t !== tag));

    const canSubmit = (content.trim().length > 0 || mediaFiles.length > 0) && !loading;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        setError(null);

        const request: CreatePostRequest = {
            content: content.trim() || undefined,
            visibility,
            tags: tags.length > 0 ? tags : undefined,
            mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
        };

        try {
            await createPostApi.createPost(request);
            onSuccess?.();
            onClose();
        } catch (err) {
            const axiosErr = err as AxiosError<{ message?: string }>;
            setError(
                axiosErr?.response?.data?.message ?? 'Đã có lỗi xảy ra, vui lòng thử lại.'
            );
        } finally {
            setLoading(false);
        }
    };

    const currentVisibility = VISIBILITY_OPTIONS.find((o) => o.value === visibility)!;

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal}>

                {/* Header */}
                <div className={styles.header}>
                    <span />
                    <h2 className={styles.headerTitle}>Tạo bài viết</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.divider} />

                {/* Author */}
                <div className={styles.authorRow}>
                    <div className={styles.avatar}>
                        {avatarUrl
                            ? <img src={avatarUrl} alt={displayName} className={styles.avatarImg} />
                            : <span>{displayName?.[0]?.toUpperCase() ?? 'U'}</span>
                        }
                    </div>
                    <div className={styles.authorInfo}>
                        <span className={styles.authorName}>{displayName ?? 'Bạn'}</span>

                        {/* Custom dropdown visibility dùng lucide-react */}
                        <div className={styles.visibilityWrapper}>
                            <button
                                className={styles.visibilityBtn}
                                onClick={() => setVisibilityOpen((prev) => !prev)}
                            >
                                {currentVisibility.icon}
                                <span>{currentVisibility.label}</span>
                                <ChevronDown size={12} />
                            </button>

                            {visibilityOpen && (
                                <div className={styles.visibilityDropdown}>
                                    {VISIBILITY_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            className={`${styles.visibilityOption} ${visibility === opt.value ? styles.visibilityOptionActive : ''}`}
                                            onClick={() => {
                                                setVisibility(opt.value);
                                                setVisibilityOpen(false);
                                            }}
                                        >
                                            {opt.icon}
                                            <span>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Textarea */}
                <textarea
                    className={styles.textarea}
                    placeholder="Bạn đang nghĩ gì?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                />

                {/* Media previews */}
                {mediaPreviews.length > 0 && (
                    <div className={styles.previewGrid}>
                        {mediaPreviews.map((src, i) => (
                            <div key={i} className={styles.previewItem}>
                                {mediaFiles[i]?.type.startsWith('video/')
                                    ? <video src={src} className={styles.previewMedia} muted />
                                    : <img src={src} alt="" className={styles.previewMedia} />
                                }
                                <button
                                    className={styles.removePreview}
                                    onClick={() => removeFile(i)}
                                    aria-label="Xóa"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                    <div className={styles.tagsList}>
                        {tags.map((t) => (
                            <span key={t} className={styles.tag}>
                                #{t}
                                <button onClick={() => removeTag(t)} className={styles.tagRemove}>
                                    <X size={11} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Tag input */}
                <div className={styles.tagInputRow}>
                    <input
                        className={styles.tagInput}
                        placeholder="# Thêm tag (Enter hoặc ,)"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={addTag}
                        disabled={tags.length >= 20}
                    />
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.divider} />

                {/* Actions — SVG icon y hệt ProfileContent gốc */}
                <div className={styles.actions}>
                    <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />

                    <button className={styles.actionBtn} onClick={() => videoInputRef.current?.click()}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7"/>
                            <rect x="1" y="5" width="15" height="14" rx="2"/>
                        </svg>
                        Video
                    </button>

                    <button className={styles.actionBtn} onClick={() => imageInputRef.current?.click()}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        Ảnh / Video
                    </button>

                    <button className={styles.actionBtn} onClick={() => imageInputRef.current?.click()}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        Bài viết
                    </button>

                    <button
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                    >
                        {loading ? <span className={styles.spinner} /> : 'Đăng bài'}
                    </button>
                </div>

            </div>
        </div>
    );
}