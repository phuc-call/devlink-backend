// src/components/post/CreatePostModal/CreatePostModal.tsx
import { useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import { Globe, Users, Lock, ChevronDown, X, FileText, FileSpreadsheet, Presentation, File } from 'lucide-react';
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
    { value: 'PUBLIC',         label: 'Công khai',      icon: <Globe size={13} /> },
    { value: 'FOLLOWERS_ONLY', label: 'Người theo dõi', icon: <Users size={13} /> },
    { value: 'PRIVATE',        label: 'Chỉ mình tôi',  icon: <Lock  size={13} /> },
];

// ─── File type helpers ────────────────────────────────────────────────────────

type DocFileType = 'word' | 'pdf' | 'excel' | 'powerpoint' | 'other';

function getDocFileType(file: File): DocFileType {
    const name = file.name.toLowerCase();
    const mime = file.type;
    if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
    if (
        mime === 'application/msword' ||
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        name.endsWith('.doc') || name.endsWith('.docx')
    ) return 'word';
    if (
        mime === 'application/vnd.ms-excel' ||
        mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')
    ) return 'excel';
    if (
        mime === 'application/vnd.ms-powerpoint' ||
        mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        name.endsWith('.ppt') || name.endsWith('.pptx')
    ) return 'powerpoint';
    return 'other';
}

const DOC_TYPE_META: Record<DocFileType, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
    word:        { color: '#2563EB', bg: '#EFF6FF', icon: <FileText size={18} />,        label: 'Word' },
    pdf:         { color: '#DC2626', bg: '#FEF2F2', icon: <FileText size={18} />,        label: 'PDF' },
    excel:       { color: '#16A34A', bg: '#F0FDF4', icon: <FileSpreadsheet size={18} />, label: 'Excel' },
    powerpoint:  { color: '#EA580C', bg: '#FFF7ED', icon: <Presentation size={18} />,   label: 'PowerPoint' },
    other:       { color: '#6B7280', bg: '#F9FAFB', icon: <File size={18} />,            label: 'File' },
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreatePostModal({
                                            onClose, onSuccess, avatarUrl, displayName,
                                        }: CreatePostModalProps) {
    const [content, setContent]             = useState('');
    const [visibility, setVisibility]       = useState<Visibility>('PUBLIC');
    const [visibilityOpen, setVisibilityOpen] = useState(false);

    // Media (images / videos)
    const [mediaFiles, setMediaFiles]       = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

    // Document files (word, pdf, excel, pptx, ...)
    const [docFiles, setDocFiles]           = useState<File[]>([]);

    const [tags, setTags]                   = useState<string[]>([]);
    const [tagInput, setTagInput]           = useState('');
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState<string | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const docInputRef   = useRef<HTMLInputElement>(null);

    // ── Media handlers ──
    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        if (mediaFiles.length + selected.length > 10) {
            setError('Tối đa 10 file ảnh/video mỗi bài viết');
            return;
        }
        setError(null);
        setMediaFiles((prev) => [...prev, ...selected]);
        setMediaPreviews((prev) => [...prev, ...selected.map((f) => URL.createObjectURL(f))]);
        e.target.value = '';
    };

    const removeMedia = (index: number) => {
        URL.revokeObjectURL(mediaPreviews[index]);
        setMediaFiles((prev) => prev.filter((_, i) => i !== index));
        setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    // ── Document handlers ──
    const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        const totalDocs = docFiles.length + selected.length;
        if (totalDocs > 5) {
            setError('Tối đa 5 file tài liệu mỗi bài viết');
            return;
        }
        // Check 20MB per file
        const oversized = selected.find((f) => f.size > 20 * 1024 * 1024);
        if (oversized) {
            setError(`File "${oversized.name}" vượt quá 20MB`);
            return;
        }
        setError(null);
        setDocFiles((prev) => [...prev, ...selected]);
        e.target.value = '';
    };

    const removeDoc = (index: number) => {
        setDocFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // ── Tag handlers ──
    const addTag = () => {
        const t = tagInput.trim().replace(/^#/, '');
        if (!t || tags.includes(t) || tags.length >= 20) return;
        setTags((prev) => [...prev, t]);
        setTagInput('');
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    };

    const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

    // ── Submit ──
    const allFiles = [...mediaFiles, ...docFiles];
    const canSubmit = (content.trim().length > 0 || allFiles.length > 0) && !loading;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        setError(null);

        const request: CreatePostRequest = {
            content:    content.trim() || undefined,
            visibility,
            tags:       tags.length > 0 ? tags : undefined,
            mediaFiles: allFiles.length > 0 ? allFiles : undefined,
        };

        try {
            await createPostApi.createPost(request);
            onSuccess?.();
            onClose();
        } catch (err) {
            const axiosErr = err as AxiosError<{ message?: string }>;
            setError(axiosErr?.response?.data?.message ?? 'Đã có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const currentVisibility = VISIBILITY_OPTIONS.find((o) => o.value === visibility)!;

    return (
        <div
            className={styles.overlay}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className={styles.modal}>

                {/* Header */}
                <div className={styles.header}>
                    <span />
                    <h2 className={styles.headerTitle}>Tạo bài viết</h2>
                    <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
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
                        <div className={styles.visibilityWrapper}>
                            <button
                                type="button"
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
                                            type="button"
                                            className={`${styles.visibilityOption} ${visibility === opt.value ? styles.visibilityOptionActive : ''}`}
                                            onClick={() => { setVisibility(opt.value); setVisibilityOpen(false); }}
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

                {/* Media previews (images / videos) */}
                {mediaPreviews.length > 0 && (
                    <div className={styles.previewGrid}>
                        {mediaPreviews.map((src, i) => (
                            <div key={src} className={styles.previewItem}>
                                {mediaFiles[i]?.type.startsWith('video/')
                                    ? <video src={src} className={styles.previewMedia} muted />
                                    : <img src={src} alt="" className={styles.previewMedia} />
                                }
                                <button
                                    type="button"
                                    className={styles.removePreview}
                                    onClick={() => removeMedia(i)}
                                    aria-label="Xóa"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Document file list */}
                {docFiles.length > 0 && (
                    <div style={{
                        margin: '0 0 10px',
                        display: 'flex', flexDirection: 'column', gap: 6,
                    }}>
                        {docFiles.map((file, i) => {
                            const type = getDocFileType(file);
                            const meta = DOC_TYPE_META[type];
                            return (
                                <div
                                    key={`${file.name}-${file.size}`}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '8px 12px', borderRadius: 8,
                                        background: meta.bg,
                                        border: `1px solid ${meta.color}22`,
                                    }}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 6,
                                        background: '#fff', border: `1px solid ${meta.color}33`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: meta.color, flexShrink: 0,
                                    }}>
                                        {meta.icon}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 13, fontWeight: 500, color: '#111827',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {file.name}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                                            {meta.label} · {formatFileSize(file.size)}
                                        </div>
                                    </div>

                                    {/* Remove */}
                                    <button
                                        type="button"
                                        onClick={() => removeDoc(i)}
                                        aria-label="Xóa file"
                                        style={{
                                            width: 22, height: 22, borderRadius: '50%',
                                            background: '#E5E7EB', border: 'none',
                                            cursor: 'pointer', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, color: '#6B7280',
                                        }}
                                    >
                                        <X size={11} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Tags list */}
                {tags.length > 0 && (
                    <div className={styles.tagsList}>
                        {tags.map((t) => (
                            <span key={t} className={styles.tag}>
                                #{t}
                                <button type="button" onClick={() => removeTag(t)} className={styles.tagRemove}>
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

                {/* Actions */}
                <div className={styles.actions}>
                    {/* Hidden inputs */}
                    <input ref={videoInputRef} type="file" accept="video/*" multiple style={{ display: 'none' }} onChange={handleMediaChange} />
                    <input ref={imageInputRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={handleMediaChange} />
                    <input
                        ref={docInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.zip,.rar"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleDocChange}
                    />

                    {/* Video */}
                    <button type="button" className={styles.actionBtn} onClick={() => videoInputRef.current?.click()}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7"/>
                            <rect x="1" y="5" width="15" height="14" rx="2"/>
                        </svg>
                        Video
                    </button>

                    {/* Image */}
                    <button type="button" className={styles.actionBtn} onClick={() => imageInputRef.current?.click()}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        Ảnh / Video
                    </button>

                    {/* Document / File — NEW */}
                    <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => docInputRef.current?.click()}
                        title="Tải lên Word, PDF, Excel, PowerPoint..."
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        Tài liệu
                        {docFiles.length > 0 && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 16, height: 16, borderRadius: '50%',
                                background: '#8B5CF6', color: '#fff',
                                fontSize: 10, fontWeight: 700, marginLeft: 2,
                            }}>
                                {docFiles.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        className={styles.submitBtn}
                        onClick={() => { void handleSubmit(); }}
                        disabled={!canSubmit}
                    >
                        {loading ? <span className={styles.spinner} /> : 'Đăng bài'}
                    </button>
                </div>

            </div>
        </div>
    );
}