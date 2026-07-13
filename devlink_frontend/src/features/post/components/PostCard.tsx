import { useState, useRef, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { vi } from 'date-fns/locale';
import {
    MoreHorizontal, Pencil, Trash2, Flag, Bookmark, Bell,
    Eye, Heart, MessageCircle, Share2, Check, X,
    ImagePlus, Globe, Users, Lock, FileText, Play,
} from 'lucide-react';
import type { FeedPostResponse, MediaResponse, Visibility } from '../../../types/post.types';
import { getCurrentUserId } from '../../../utils/auth';
import { postApi } from '../../../api/post-service/postApi';
import { groupApi } from '../../../api/user-service/groupApi';
import CommentSection from './CommentSection';
import { savedPostApi } from '../../../api/post-service/savedPostApi';
import ReportModal from '../../../components/common/ReportModal.tsx';
import { reactionApi } from '../../../api/post-service/reactionApi';
import type { ReactionType } from '../../../types/reaction.types';

const REACTION_ICONS = {
    LIKE: <svg viewBox="0 0 24 24" width="18" height="18" fill="#2563EB"><path d="M2 10h4v10H2v-10zm20 2c0-1.1-.9-2-2-2h-5.3l.8-3.9v-.4c0-.4-.1-.8-.4-1l-1-1-4.7 4.8c-.3.3-.5.7-.5 1.1v8c0 1.1.9 2 2 2h6.5c.8 0 1.5-.5 1.8-1.2l3-7c.1-.2.2-.5.2-.8v-1.6z" /></svg>,
    LOVE: <svg viewBox="0 0 24 24" width="18" height="18" fill="#EF4444"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>,
    HAHA: <svg viewBox="0 0 24 24" width="18" height="18" fill="#F59E0B"><circle cx="12" cy="12" r="10" /><path fill="#fff" d="M12 16.5c-2.3 0-4.3-1.4-5.2-3.5h10.4c-.9 2.1-2.9 3.5-5.2 3.5z" /><circle fill="#fff" cx="8.5" cy="9.5" r="1.5" /><circle fill="#fff" cx="15.5" cy="9.5" r="1.5" /></svg>,
    WOW: <svg viewBox="0 0 24 24" width="18" height="18" fill="#F59E0B"><circle cx="12" cy="12" r="10" /><circle fill="#fff" cx="8.5" cy="9.5" r="1.5" /><circle fill="#fff" cx="15.5" cy="9.5" r="1.5" /><circle fill="#fff" cx="12" cy="16" r="2.5" /></svg>,
    SAD: <svg viewBox="0 0 24 24" width="18" height="18" fill="#F59E0B"><circle cx="12" cy="12" r="10" /><path fill="#fff" d="M12 13.5c-2 0-3.8 1.1-4.7 2.8l1.7.9c.6-1 1.6-1.7 3-1.7s2.4.7 3 1.7l1.7-.9c-.9-1.7-2.7-2.8-4.7-2.8z" /><circle fill="#fff" cx="8.5" cy="9.5" r="1.5" /><circle fill="#fff" cx="15.5" cy="9.5" r="1.5" /></svg>,
    ANGRY: <svg viewBox="0 0 24 24" width="18" height="18" fill="#EA580C"><circle cx="12" cy="12" r="10" /><path fill="#fff" d="M8.5 11c.8 0 1.5-.7 1.5-1.5S9.3 8 8.5 8 7 8.7 7 9.5 7.7 11 8.5 11zm7 0c.8 0 1.5-.7 1.5-1.5S16.3 8 15.5 8 14 8.7 14 9.5 14.7 11 15.5 11zm-3.5 3c-2.3 0-4.3 1.4-5.2 3.5h10.4c-.9-2.1-2.9-3.5-5.2-3.5z" /><path stroke="#fff" strokeWidth="2" strokeLinecap="round" d="M6 7l3 1.5M18 7l-3 1.5" /></svg>,
};

const REACTION_DETAILS: Record<ReactionType, { icon: React.ReactNode; label: string; color: string }> = {
    LIKE: { icon: REACTION_ICONS.LIKE, label: 'Thích', color: '#2563EB' },
    LOVE: { icon: REACTION_ICONS.LOVE, label: 'Yêu thích', color: '#EF4444' },
    HAHA: { icon: REACTION_ICONS.HAHA, label: 'Haha', color: '#F59E0B' },
    WOW: { icon: REACTION_ICONS.WOW, label: 'Wow', color: '#F59E0B' },
    SAD: { icon: REACTION_ICONS.SAD, label: 'Buồn', color: '#F59E0B' },
    ANGRY: { icon: REACTION_ICONS.ANGRY, label: 'Phẫn nộ', color: '#EA580C' },
};

function getTopReactionIcons(counts: Record<ReactionType, number>): React.ReactNode[] {
    if (!counts) return [];
    return Object.entries(counts)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => REACTION_DETAILS[type as ReactionType].icon);
}



interface Props {
    post: FeedPostResponse;
    onDeleted?: (postId: number) => void;
    onUpdated?: (post: FeedPostResponse) => void;
    openCommentPostId: number | null;
    onToggleComment: (id: number | null) => void;
    isSaved?: boolean;
    hideGroupInfo?: boolean;
}

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
    { value: 'PUBLIC', label: 'Công khai' },
    { value: 'FOLLOWERS_ONLY', label: 'Người theo dõi' },
    { value: 'PRIVATE', label: 'Chỉ mình tôi' },
];

function visibilityLabel(v: string): { icon: React.ReactNode; text: string } {
    switch (v) {
        case 'PUBLIC': return { icon: <Globe size={12} />, text: 'Công khai' };
        case 'FOLLOWERS_ONLY': return { icon: <Users size={12} />, text: 'Người theo dõi' };
        case 'PRIVATE': return { icon: <Lock size={12} />, text: 'Chỉ mình tôi' };
        default: return { icon: <Globe size={12} />, text: v };
    }
}

// ─── Inline Edit Form ─────────────────────────────────────────────────────────
interface InlineEditFormProps {
    post: FeedPostResponse;
    onCancel: () => void;
    onSaved: (updated: FeedPostResponse) => void;
}

function InlineEditForm({ post, onCancel, onSaved }: InlineEditFormProps) {
    const [content, setContent] = useState(post.content ?? '');
    const [visibility, setVisibility] = useState<Visibility>(post.visibility as Visibility);
    const [existingMedia, setExistingMedia] = useState<MediaResponse[]>(post.mediaList ?? []);
    const [removeIds, setRemoveIds] = useState<number[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [newPreviews, setNewPreviews] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState((post.tags ?? []).map(t => t.tag).join(', '));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        setNewFiles(prev => [...prev, ...files]);
        files.forEach(f => {
            const url = URL.createObjectURL(f);
            setNewPreviews(prev => [...prev, url]);
        });
        e.target.value = '';
    };

    const removeExisting = (id: number) => {
        setExistingMedia(prev => prev.filter(m => m.id !== id));
        setRemoveIds(prev => [...prev, id]);
    };

    const removeNew = (idx: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== idx));
        setNewPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = useCallback(async () => {
        if (!content.trim() && existingMedia.length === 0 && newFiles.length === 0) {
            setError('Bài viết phải có nội dung hoặc media');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
            const res = await postApi.updatePost(post.id, {
                content,
                visibility,
                tags,
                removeMediaIds: removeIds,
                newMediaFiles: newFiles,
            });
            const saved = res.data.data;
            const updated: FeedPostResponse = {
                ...post,
                content: saved?.content ?? content,
                visibility,
                tags: tags.map((t, i) => ({ id: i, postId: post.id, tag: t })),
                mediaList: saved?.mediaList ?? existingMedia,
            };
            onSaved(updated);
        } catch {
            setError('Cập nhật thất bại, thử lại sau.');
        } finally {
            setLoading(false);
        }
    }, [content, existingMedia, newFiles, tagInput, post, visibility, removeIds, onSaved]);

    return (
        <div style={{
            margin: '0 16px 12px',
            border: '1.5px solid #3B82F6',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#F9FAFB',
        }}>
            <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={4}
                placeholder="Nội dung bài viết..."
                style={{
                    width: '100%', border: 'none', outline: 'none',
                    resize: 'vertical', padding: '12px',
                    fontSize: 14, fontFamily: 'Inter, sans-serif',
                    background: 'transparent', color: '#111827',
                    boxSizing: 'border-box',
                }}
            />

            <div style={{ padding: '0 12px 8px' }}>
                <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    placeholder="Tags (phân cách bằng dấu phẩy): react, java, ..."
                    style={{
                        width: '100%', border: '1px solid #E5E7EB',
                        borderRadius: 4, padding: '6px 8px',
                        fontSize: 12, color: '#374151', background: '#fff',
                        boxSizing: 'border-box', outline: 'none',
                        fontFamily: 'Inter, sans-serif',
                    }}
                />
            </div>

            {existingMedia.length > 0 && (
                <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {existingMedia.map(m => (
                        <div key={m.id} style={{ position: 'relative', display: 'inline-block' }}>
                            {m.mediaType === 'IMAGE' ? (
                                <img src={m.url} alt={m.originalName}
                                    style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6 }} />
                            ) : (
                                <div style={{
                                    width: 72, height: 72, borderRadius: 6,
                                    background: '#EFF6FF', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    flexDirection: 'column', gap: 2,
                                }}>
                                    <FileText size={20} color="#3B82F6" />
                                    <span style={{ fontSize: 9, color: '#3B82F6', textAlign: 'center', padding: '0 2px' }}>
                                        {m.originalName?.split('.').pop()?.toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => removeExisting(m.id)}
                                style={{
                                    position: 'absolute', top: -6, right: -6,
                                    width: 18, height: 18, borderRadius: '50%',
                                    background: '#EF4444', border: '2px solid #fff',
                                    cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', padding: 0,
                                }}
                            >
                                <X size={10} color="#fff" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {newPreviews.length > 0 && (
                <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {newPreviews.map((url, idx) => (
                        <div key={url} style={{ position: 'relative', display: 'inline-block' }}>
                            {newFiles[idx]?.type.startsWith('image/') ? (
                                <img src={url} alt=""
                                    style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, border: '2px solid #3B82F6' }} />
                            ) : (
                                <div style={{
                                    width: 72, height: 72, borderRadius: 6,
                                    background: '#EFF6FF', border: '2px solid #3B82F6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexDirection: 'column', gap: 2,
                                }}>
                                    <FileText size={20} color="#3B82F6" />
                                    <span style={{ fontSize: 9, color: '#3B82F6', textAlign: 'center', padding: '0 2px' }}>
                                        {newFiles[idx]?.name.split('.').pop()?.toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => removeNew(idx)}
                                style={{
                                    position: 'absolute', top: -6, right: -6,
                                    width: 18, height: 18, borderRadius: '50%',
                                    background: '#EF4444', border: '2px solid #fff',
                                    cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', padding: 0,
                                }}
                            >
                                <X size={10} color="#fff" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div style={{
                padding: '8px 12px',
                display: 'flex', alignItems: 'center', gap: 8,
                borderTop: '1px solid #E5E7EB', background: '#fff',
            }}>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '5px 10px', borderRadius: 6,
                        border: '1px solid #E5E7EB', background: '#F9FAFB',
                        cursor: 'pointer', fontSize: 12, color: '#374151',
                        fontFamily: 'Inter, sans-serif',
                    }}
                >
                    <ImagePlus size={14} />
                    Thêm ảnh/file
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />

                <select
                    value={visibility}
                    onChange={e => setVisibility(e.target.value as Visibility)}
                    style={{
                        fontSize: 12, border: '1px solid #E5E7EB',
                        borderRadius: 6, padding: '5px 8px',
                        background: '#F9FAFB', color: '#374151',
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    }}
                >
                    {VISIBILITY_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    {error && (
                        <span style={{ fontSize: 12, color: '#EF4444', alignSelf: 'center' }}>{error}</span>
                    )}
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            padding: '6px 14px', borderRadius: 6,
                            border: '1px solid #E5E7EB', background: '#fff',
                            fontSize: 13, cursor: 'pointer', color: '#374151',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        Huỷ
                    </button>
                    <button
                        type="button"
                        onClick={() => { void handleSave(); }}
                        disabled={loading}
                        style={{
                            padding: '6px 14px', borderRadius: 6, border: 'none',
                            background: loading ? '#93C5FD' : '#3B82F6',
                            color: '#fff', fontSize: 13,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontFamily: 'Inter, sans-serif', fontWeight: 500,
                        }}
                    >
                        <Check size={13} />
                        {loading ? 'Đang lưu...' : 'Lưu'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
interface DeleteConfirmDialogProps {
    onCancel: () => void;
    onConfirm: () => void;
    loading: boolean;
}

function DeleteConfirmDialog({ onCancel, onConfirm, loading }: DeleteConfirmDialogProps) {
    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
        }}>
            <div style={{
                background: '#fff', borderRadius: 12,
                padding: '24px', width: 340,
                boxShadow: '0 20px 25px rgba(0,0,0,0.12)',
                textAlign: 'center',
            }}>
                <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: '#FEF2F2', margin: '0 auto 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Trash2 size={22} color="#EF4444" />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#111827' }}>
                    Xoá bài viết?
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>
                    Bài viết sẽ bị xoá và không thể khôi phục.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            flex: 1, padding: '10px', borderRadius: 8,
                            border: '1px solid #E5E7EB', background: '#fff',
                            fontSize: 14, cursor: 'pointer', fontWeight: 500, color: '#374151',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        Huỷ
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                            background: loading ? '#FCA5A5' : '#EF4444',
                            color: '#fff', fontSize: 14,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 500, fontFamily: 'Inter, sans-serif',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                    >
                        <Trash2 size={14} />
                        {loading ? 'Đang xoá...' : 'Xoá'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── MenuItem ─────────────────────────────────────────────────────────────────
interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color: string;
    danger?: boolean;
}

function MenuItem({ icon, label, onClick, color, danger }: MenuItemProps) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', border: 'none', cursor: 'pointer',
                background: hovered ? (danger === true ? '#FEF2F2' : '#F9FAFB') : '#fff',
                color, fontSize: 13, fontWeight: 500, textAlign: 'left',
                transition: 'background 0.12s', fontFamily: 'Inter, sans-serif',
            }}
        >
            {icon}{label}
        </button>
    );
}

// ─── FooterBtn ────────────────────────────────────────────────────────────────
interface FooterBtnProps {
    icon: React.ReactNode;
    label: string;
}

function FooterBtn({ icon, label }: FooterBtnProps) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            type="button"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '6px 8px', borderRadius: 6, border: 'none',
                background: hovered ? '#F3F4F6' : 'transparent',
                cursor: 'pointer', fontSize: 13, color: '#6B7280',
                fontFamily: 'Inter, sans-serif', fontWeight: 500,
                transition: 'background 0.12s',
                whiteSpace: 'nowrap',
                flex: 1,
            }}
        >
            {icon}{label}
        </button>
    );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────
export default function PostCard({
    post: initialPost, onDeleted, onUpdated,
    openCommentPostId, onToggleComment, isSaved = false, hideGroupInfo = false,
}: Props) {
    const navigate = useNavigate();
    const [post, setPost] = useState(initialPost);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<'down' | 'up'>('down');
    const [editing, setEditing] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const safeTags = post.tags ?? [];
    const safeMediaList = post.mediaList ?? [];
    const authorId = post.author?.id ?? post.authorId;
    const authorName = post.author?.fullName ?? 'Người dùng';
    const authorAvatar = post.author?.avatarUrl
        ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=3B82F6&color=fff`;

    const [saved, setSaved] = useState(isSaved);
    const [saveLoading, setSaveLoading] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [selectedMediaIdx, setSelectedMediaIdx] = useState<number | null>(null);

    const [groupInfo, setGroupInfo] = useState<{ id: number; name: string; coverImage: string; } | null>(null);

    const visualMedia = safeMediaList.filter(m => m.mediaType === 'IMAGE' || m.mediaType === 'VIDEO');
    const fileMedia = safeMediaList.filter(m => m.mediaType === 'FILE');

    // Reactions States
    const [currentUserReaction, setCurrentUserReaction] = useState<ReactionType | null>(null);
    const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
        LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0
    });
    const [totalReactions, setTotalReactions] = useState(post.likeCount ?? 0);
    const [showReactionsPopover, setShowReactionsPopover] = useState(false);
    const popoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentUserId = getCurrentUserId();
    const isOwner = currentUserId !== null && authorId === currentUserId;
    const commentOpen = openCommentPostId === post.id;

    useEffect(() => {
        let isMounted = true;
        reactionApi.getSummary(post.id, 'POST')
            .then(res => {
                if (isMounted && res.data.success && res.data.data) {
                    setCurrentUserReaction(res.data.data.currentUserReaction);
                    setReactionCounts(res.data.data.counts || {
                        LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0
                    });
                    setTotalReactions(res.data.data.totalCount);
                }
            })
            .catch(err => {
                console.error("Failed to load post reaction summary", err);
            });
            
        if (post.groupId && !hideGroupInfo) {
            groupApi.getGroupBasicInfo(post.groupId)
                .then(res => {
                    if (isMounted && res.data.success) {
                        setGroupInfo(res.data.data);
                    }
                })
                .catch(err => console.error("Failed to load group info", err));
        }
            
        return () => {
            isMounted = false;
        };
    }, [post.id, post.groupId, hideGroupInfo]);

    useEffect(() => {
        return () => {
            if (popoverTimeoutRef.current) clearTimeout(popoverTimeoutRef.current);
        };
    }, []);

    const handleMouseEnter = () => {
        if (popoverTimeoutRef.current) clearTimeout(popoverTimeoutRef.current);
        popoverTimeoutRef.current = setTimeout(() => {
            setShowReactionsPopover(true);
        }, 500);
    };

    const handleMouseLeave = () => {
        if (popoverTimeoutRef.current) clearTimeout(popoverTimeoutRef.current);
        popoverTimeoutRef.current = setTimeout(() => {
            setShowReactionsPopover(false);
        }, 400);
    };

    const handleReactClick = async () => {
        const typeToReact = currentUserReaction ? currentUserReaction : 'LIKE';
        const isRemoving = !!currentUserReaction;

        // Optimistic UI updates
        const nextReaction = isRemoving ? null : 'LIKE';
        const nextCounts = { ...reactionCounts };
        if (currentUserReaction) {
            nextCounts[currentUserReaction] = Math.max(0, (nextCounts[currentUserReaction] || 0) - 1);
        }
        if (nextReaction) {
            nextCounts[nextReaction] = (nextCounts[nextReaction] || 0) + 1;
        }
        const nextTotal = isRemoving ? Math.max(0, totalReactions - 1) : totalReactions + 1;

        setCurrentUserReaction(nextReaction);
        setReactionCounts(nextCounts);
        setTotalReactions(nextTotal);

        try {
            const res = await reactionApi.react({
                targetId: post.id,
                targetType: 'POST',
                reactionType: typeToReact
            });
            if (res.data.success && res.data.data) {
                setCurrentUserReaction(res.data.data.currentUserReaction);
                setReactionCounts(res.data.data.counts);
                setTotalReactions(res.data.data.totalCount);
            }
        } catch (err) {
            setCurrentUserReaction(currentUserReaction);
            setReactionCounts(reactionCounts);
            setTotalReactions(totalReactions);
            console.error("Failed to react to post", err);
        }
    };

    const handleSelectReaction = async (type: ReactionType) => {
        setShowReactionsPopover(false);
        if (popoverTimeoutRef.current) clearTimeout(popoverTimeoutRef.current);

        const prevReaction = currentUserReaction;
        const nextReaction = type;

        // Optimistic UI updates
        const nextCounts = { ...reactionCounts };
        let diff = 0;
        if (!prevReaction) {
            diff = 1;
        } else if (prevReaction === type) {
            nextCounts[type] = Math.max(0, (nextCounts[type] || 0) - 1);
            setCurrentUserReaction(null);
            setReactionCounts(nextCounts);
            setTotalReactions(Math.max(0, totalReactions - 1));
            try {
                const res = await reactionApi.react({
                    targetId: post.id,
                    targetType: 'POST',
                    reactionType: type
                });
                if (res.data.success && res.data.data) {
                    setCurrentUserReaction(res.data.data.currentUserReaction);
                    setReactionCounts(res.data.data.counts);
                    setTotalReactions(res.data.data.totalCount);
                }
            } catch (err) {
                setCurrentUserReaction(prevReaction);
                setReactionCounts(reactionCounts);
                setTotalReactions(totalReactions);
                console.error("Failed to toggle reaction", err);
            }
            return;
        } else {
            nextCounts[prevReaction] = Math.max(0, (nextCounts[prevReaction] || 0) - 1);
        }
        nextCounts[type] = (nextCounts[type] || 0) + 1;

        setCurrentUserReaction(nextReaction);
        setReactionCounts(nextCounts);
        setTotalReactions(totalReactions + diff);

        try {
            const res = await reactionApi.react({
                targetId: post.id,
                targetType: 'POST',
                reactionType: type
            });
            if (res.data.success && res.data.data) {
                setCurrentUserReaction(res.data.data.currentUserReaction);
                setReactionCounts(res.data.data.counts);
                setTotalReactions(res.data.data.totalCount);
            }
        } catch (err) {
            setCurrentUserReaction(prevReaction);
            setReactionCounts(reactionCounts);
            setTotalReactions(totalReactions);
            console.error("Failed to select reaction", err);
        }
    };


    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi });
    const vis = visibilityLabel(post.visibility);


    const handleDelete = useCallback(async () => {
        setDeleteLoading(true);
        try {
            await postApi.deletePost(post.id);
            setShowDeleteDialog(false);
            onDeleted?.(post.id);
        } catch {
            setDeleteLoading(false);
        }
    }, [post.id, onDeleted]);

    const handleSave = useCallback(async () => {
        if (saveLoading) return;
        setSaveLoading(true);
        try {
            if (saved) {
                await savedPostApi.unsavePost(post.id);
                setSaved(false);
                onDeleted?.(post.id);   // ← THÊM: xóa khỏi danh sách SavedPage ngay
            } else {
                await savedPostApi.savePost(post.id);
                setSaved(true);
            }
        } catch {
            // giữ nguyên state nếu lỗi
        } finally {
            setSaveLoading(false);
            setMenuOpen(false);
        }
    }, [saved, saveLoading, post.id, onDeleted]);

    const handleUpdated = useCallback((updated: FeedPostResponse) => {
        setPost(updated);
        setEditing(false);
        onUpdated?.(updated);
    }, [onUpdated]);

    const handleToggleComment = useCallback(() => {
        onToggleComment(commentOpen ? null : post.id);
    }, [commentOpen, onToggleComment, post.id]);

    const handleOpenAuthorProfile = useCallback(() => {
        if (!authorId) return;

        if (currentUserId !== null && authorId === currentUserId) {
            navigate('/profile/me');
            return;
        }

        navigate(`/profile/${authorId}`);
    }, [authorId, currentUserId, navigate]);

    return (
        <>
            {showDeleteDialog && (
                <DeleteConfirmDialog
                    onCancel={() => setShowDeleteDialog(false)}
                    onConfirm={() => { void handleDelete(); }}
                    loading={deleteLoading}
                />

            )}
            <ReportModal
                open={showReport}
                targetId={post.id}
                targetType="POST"
                targetName={post.author?.fullName ?? undefined}
                onClose={() => setShowReport(false)}
            />

            {selectedMediaIdx !== null && (
                <div className="post-modal-overlay" style={{
                    position: 'fixed', inset: 0, zIndex: 9999, background: '#000', fontFamily: 'Inter, sans-serif'
                }}>
                    <style>{`
                        .post-modal-overlay {
                            display: flex;
                            flex-direction: row;
                        }
                        .post-modal-media {
                            flex: 1;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: #000;
                            position: relative;
                            height: 100vh;
                        }
                        .post-modal-sidebar {
                            width: 360px;
                            background: #fff;
                            display: flex;
                            flex-direction: column;
                            height: 100vh;
                            border-left: 1px solid #374151;
                            box-shadow: -10px 0 30px rgba(0,0,0,0.6);
                            z-index: 10;
                        }
                        .post-modal-close {
                            position: fixed; top: 16px; left: 16px; z-index: 10000;
                            background: rgba(255,255,255,0.2); border: none; border-radius: 50%;
                            width: 40px; height: 40px; color: #fff; cursor: pointer;
                            display: flex; align-items: center; justify-content: center;
                        }
                        
                        @media (max-width: 768px) {
                            .post-modal-overlay {
                                flex-direction: column;
                                overflow-y: auto;
                                background: #fff !important;
                            }
                            .post-modal-sidebar, .post-modal-scrollable {
                                display: contents;
                            }
                            
                            .post-modal-close {
                                top: 12px; right: 12px; left: auto;
                                background: rgba(0,0,0,0.1); color: #374151;
                            }

                            .post-modal-header { order: 1; }
                            .post-modal-content { order: 2; }
                            .post-modal-media { 
                                order: 3; 
                                width: 100%; 
                                height: auto; 
                                min-height: 40vh; 
                                max-height: 60vh; 
                            }
                            .post-modal-media img, .post-modal-media video {
                                max-height: 60vh !important;
                            }
                            .post-modal-stats { order: 4; }
                            .post-modal-actions { order: 5; }
                            .post-modal-comments { order: 6; }
                        }
                    `}</style>

                    <button 
                        type="button"
                        className="post-modal-close"
                        onClick={() => setSelectedMediaIdx(null)}
                    >
                        <X size={24} />
                    </button>

                    {/* Left: Media Area */}
                    <div className="post-modal-media">
                        {(() => {
                            const media = visualMedia[selectedMediaIdx];
                            if (!media) return null;
                            if (media.mediaType === 'IMAGE') {
                                return <img src={media.url} alt={media.originalName} style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain' }} />;
                            } else {
                                return <video controls autoPlay src={media.url} style={{ maxWidth: '100%', maxHeight: '100vh', outline: 'none' }} />;
                            }
                        })()}
                    </div>

                    {/* Right: Sidebar */}
                    <div className="post-modal-sidebar">
                        <div className="post-modal-header" style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={authorAvatar} alt={authorName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{authorName}</div>
                                <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {timeAgo} · {vis.icon}
                                </div>
                            </div>
                        </div>

                        <div className="post-modal-scrollable" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            {post.content && (
                                <div className="post-modal-content" style={{ padding: '16px', fontSize: 14, color: '#111827', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                    {post.content}
                                </div>
                            )}
                            
                            {(totalReactions > 0 || (post.commentCount != null && post.commentCount > 0)) && (
                                <div className="post-modal-stats" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6', fontSize: 13, color: '#6B7280' }}>
                                    {totalReactions > 0 ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <span style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 2 }}>
                                                {getTopReactionIcons(reactionCounts).map((icon, idx) => (
                                                    <span key={idx} style={{ display: 'flex' }}>{icon}</span>
                                                ))}
                                            </span>
                                            <span style={{ fontWeight: 500 }}>{totalReactions}</span>
                                        </div>
                                    ) : <div />}
                                    <div>{post.commentCount && post.commentCount > 0 ? `${post.commentCount} bình luận` : ''}</div>
                                </div>
                            )}

                            <div className="post-modal-actions" style={{ padding: '8px 12px', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 4 }}>
                                <div
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                    style={{ position: 'relative', display: 'flex', flex: 1, justifyContent: 'center' }}
                                >
                                    {/* Popover */}
                                    {showReactionsPopover && (
                                        <div
                                            className="reaction-popover-animate"
                                            onMouseEnter={() => {
                                                if (popoverTimeoutRef.current) clearTimeout(popoverTimeoutRef.current);
                                            }}
                                            onMouseLeave={handleMouseLeave}
                                            style={{
                                                position: 'absolute',
                                                bottom: '100%',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                marginBottom: 8,
                                                background: '#ffffff',
                                                borderRadius: 30,
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                                                border: '1px solid #E5E7EB',
                                                display: 'flex',
                                                gap: 6,
                                                padding: '4px 6px',
                                                zIndex: 100,
                                            }}
                                        >
                                            {(['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'] as ReactionType[]).map((type) => {
                                                const detail = REACTION_DETAILS[type];
                                                return (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => { void handleSelectReaction(type); }}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            fontSize: 20,
                                                            cursor: 'pointer',
                                                            transition: 'transform 0.1s ease',
                                                            padding: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.3)'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                                        title={detail.label}
                                                    >
                                                        {detail.icon}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => { void handleReactClick(); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6,
                                            border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13,
                                            color: currentUserReaction ? REACTION_DETAILS[currentUserReaction].color : '#6B7280',
                                            fontFamily: 'Inter, sans-serif', fontWeight: 600, flex: 1, justifyContent: 'center'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        {currentUserReaction ? (
                                            <span style={{ fontSize: 14, display: 'flex', alignItems: 'center' }}>
                                                {REACTION_DETAILS[currentUserReaction].icon}
                                            </span>
                                        ) : <Heart size={14} color="#6B7280" />}
                                        {currentUserReaction ? REACTION_DETAILS[currentUserReaction].label : 'Thích'}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px', borderRadius: 6,
                                        border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13,
                                        color: '#6B7280', fontFamily: 'Inter, sans-serif', fontWeight: 500, flex: 1, justifyContent: 'center'
                                    }}
                                >
                                    <MessageCircle size={14} /> Bình luận
                                </button>
                            </div>

                            <div className="post-modal-comments" style={{ flex: 1, minHeight: 0 }}>
                                <CommentSection postId={post.id} commentCount={post.commentCount} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                background: '#FFFFFF', borderRadius: 8,
                boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                marginBottom: 12,
                fontFamily: 'Inter, sans-serif',
            }}>
                {/* ── Header ── */}
                <div style={{
                    padding: '16px 16px 12px',
                    display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <button
                            type="button"
                            onClick={handleOpenAuthorProfile}
                            aria-label={`Xem profile ${authorName}`}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                padding: 0,
                                cursor: 'pointer',
                                borderRadius: '50%',
                                display: 'flex',
                            }}
                        >
                            <img
                                src={authorAvatar}
                                alt={authorName}
                                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                            />
                        </button>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', overflow: 'hidden' }}>
                                <button
                                    type="button"
                                    onClick={handleOpenAuthorProfile}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        padding: 0,
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: 14,
                                        color: '#111827',
                                        fontFamily: 'Inter, sans-serif',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        flexShrink: 1,
                                        display: 'block'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
                                    onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
                                    title={authorName}
                                >
                                    {authorName}
                                </button>
                                {groupInfo && (
                                    <>
                                        <span style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>▶</span>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/groups/${groupInfo.id}`)}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                padding: 0,
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                fontSize: 14,
                                                color: '#111827',
                                                fontFamily: 'Inter, sans-serif',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 5,
                                                flexShrink: 1,
                                                overflow: 'hidden'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
                                            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
                                            title={groupInfo.name}
                                        >
                                            {groupInfo.coverImage && (
                                                <img 
                                                    src={groupInfo.coverImage} 
                                                    alt="group" 
                                                    style={{ width: 16, height: 16, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} 
                                                />
                                            )}
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                                {groupInfo.name}
                                            </span>
                                        </button>
                                    </>
                                )}
                                {post.author?.badge != null && post.author.badge !== 'NONE' && (
                                    <span style={{
                                        background: '#DBEAFE', color: '#2563EB',
                                        fontSize: 11, padding: '2px 6px',
                                        borderRadius: 9999, fontWeight: 500, flexShrink: 0,
                                        display: 'flex', alignItems: 'center'
                                    }}>
                                        {post.author.badge === 'POPULAR' ? '⭐ Nổi bật' : '✓ Verified'}
                                    </span>
                                )}
                            </div>
                            <div style={{
                                fontSize: 12, color: '#6B7280',
                                display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap'
                            }}>
                                <span>{timeAgo}</span>
                                <span>·</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    {vis.icon} {vis.text}
                                </span>
                                {post.viewCount != null && (
                                    <>
                                        <span>·</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }} title={`${post.viewCount} lượt xem`}>
                                            <Eye size={12} /> {post.viewCount}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ⋯ Menu */}
                    <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
                        <button
                            type="button"
                            onClick={() => {
                                if (!menuOpen && menuRef.current) {
                                    const rect = menuRef.current.getBoundingClientRect();
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    if (spaceBelow < 200 && rect.top > 200) {
                                        setMenuPosition('up');
                                    } else {
                                        setMenuPosition('down');
                                    }
                                }
                                setMenuOpen(v => !v);
                            }}
                            style={{
                                width: 32, height: 32, borderRadius: '50%',
                                border: 'none',
                                background: menuOpen ? '#F3F4F6' : 'transparent',
                                cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                color: '#6B7280',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = menuOpen ? '#F3F4F6' : 'transparent'; }}
                        >
                            <MoreHorizontal size={18} />
                        </button>

                        {menuOpen && (
                            <div style={{
                                position: 'absolute', right: 0, 
                                ...(menuPosition === 'up' ? { bottom: 36 } : { top: 36 }),
                                background: '#fff', borderRadius: 8,
                                boxShadow: '0 10px 15px rgba(0,0,0,0.10)',
                                border: '1px solid #E5E7EB',
                                minWidth: 190, zIndex: 100, overflow: 'hidden',
                            }}>
                                {isOwner ? (
                                    <>
                                        <MenuItem
                                            icon={<Pencil size={15} />}
                                            label="Chỉnh sửa bài viết"
                                            onClick={() => { setEditing(true); setMenuOpen(false); }}
                                            color="#374151"
                                        />
                                        <div style={{ height: 1, background: '#F3F4F6' }} />
                                        <MenuItem
                                            icon={<Trash2 size={15} />}
                                            label="Xoá bài viết"
                                            onClick={() => { setShowDeleteDialog(true); setMenuOpen(false); }}
                                            color="#EF4444"
                                            danger
                                        />
                                    </>
                                ) : (
                                    <>
                                        <MenuItem
                                            icon={<Bookmark size={15} />}
                                            label={saveLoading ? 'Đang xử lý...' : saved ? 'Bỏ lưu khỏi thư viện' : 'Lưu vào thư viện'}
                                            onClick={() => { void handleSave(); }}
                                            color="#374151"
                                        />
                                        <MenuItem
                                            icon={<Bell size={15} />}
                                            label="Đánh dấu theo dõi"
                                            onClick={() => setMenuOpen(false)}
                                            color="#374151"
                                        />
                                        <div style={{ height: 1, background: '#F3F4F6' }} />
                                        <MenuItem
                                            icon={<Flag size={15} />}
                                            label="Tố cáo bài viết"
                                            onClick={() => { setShowReport(true); setMenuOpen(false); }}
                                            color="#EF4444"
                                            danger
                                        />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Edit Form hoặc Content ── */}
                {editing ? (
                    <InlineEditForm
                        post={post}
                        onCancel={() => setEditing(false)}
                        onSaved={handleUpdated}
                    />
                ) : (
                    <>
                        {post.content && (
                            <div style={{ padding: '0 16px 12px', fontSize: 14, color: '#111827', lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                {post.content}
                            </div>
                        )}

                        {safeTags.length > 0 && (
                            <div style={{ padding: '0 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {safeTags.map(t => (
                                    <span key={t.id} style={{
                                        background: '#EFF6FF', color: '#3B82F6',
                                        fontSize: 12, padding: '2px 8px', borderRadius: 9999,
                                    }}>
                                        #{t.tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {safeMediaList.length > 0 && (
                            (() => {
                                const displayMedia = visualMedia.slice(0, 4);
                                const extraCount = visualMedia.length - 4;

                                return (
                                    <>
                                        {visualMedia.length > 0 && (
                                            <div style={{
                                                display: 'grid',
                                                gap: 2,
                                                gridTemplateColumns: displayMedia.length === 1 ? '1fr' : '1fr 1fr',
                                                borderRadius: 0,
                                                overflow: 'hidden'
                                            }}>
                                                {displayMedia.map((m, idx) => {
                                                    let isSpan2 = false;
                                                    if (displayMedia.length === 3 && idx === 0) isSpan2 = true;

                                                    const height = displayMedia.length === 1 ? 'auto'
                                                        : displayMedia.length === 2 ? 400
                                                            : displayMedia.length === 3 ? (idx === 0 ? 350 : 200)
                                                                : 250;

                                                    const style: React.CSSProperties = {
                                                        width: '100%',
                                                        height: height,
                                                        maxHeight: 600,
                                                        objectFit: displayMedia.length === 1 ? 'contain' : 'cover',
                                                        background: '#000',
                                                        gridColumn: isSpan2 ? 'span 2' : 'auto'
                                                    };

                                                    const isLastAndExtra = idx === 3 && extraCount > 0;

                                                    return (
                                                        <div 
                                                            key={m.id} 
                                                            onClick={() => setSelectedMediaIdx(idx)}
                                                            onMouseEnter={(e) => {
                                                                if (m.mediaType === 'VIDEO') {
                                                                    const target = e.currentTarget;
                                                                    const timerId = setTimeout(() => {
                                                                        const video = target.querySelector('video');
                                                                        if (video) {
                                                                            video.muted = true;
                                                                            video.play().catch(() => {});
                                                                        }
                                                                        const overlay = target.querySelector('.play-overlay') as HTMLElement;
                                                                        if (overlay) overlay.style.opacity = '0';
                                                                    }, 2000);
                                                                    (target as any)._playTimer = timerId;
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (m.mediaType === 'VIDEO') {
                                                                    const target = e.currentTarget;
                                                                    if ((target as any)._playTimer) {
                                                                        clearTimeout((target as any)._playTimer);
                                                                    }
                                                                    const video = target.querySelector('video');
                                                                    if (video) {
                                                                        video.pause();
                                                                    }
                                                                    const overlay = target.querySelector('.play-overlay') as HTMLElement;
                                                                    if (overlay) overlay.style.opacity = '1';
                                                                }
                                                            }}
                                                            style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', cursor: 'pointer' }}
                                                        >
                                                            {m.mediaType === 'IMAGE' ? (
                                                                <img src={m.url} alt={m.originalName} style={style} />
                                                            ) : (
                                                                <>
                                                                    <video style={{...style, pointerEvents: 'none'}} loop muted playsInline>
                                                                        <source src={m.url} />
                                                                    </video>
                                                                    <div 
                                                                        className="play-overlay"
                                                                        style={{
                                                                            position: 'absolute', inset: 0,
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            background: 'rgba(0,0,0,0.15)',
                                                                            pointerEvents: 'none',
                                                                            transition: 'opacity 0.2s ease-in-out'
                                                                        }}
                                                                    >
                                                                        <div style={{
                                                                            width: 48, height: 48, borderRadius: '50%',
                                                                            background: 'rgba(0,0,0,0.6)',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            backdropFilter: 'blur(4px)'
                                                                        }}>
                                                                            <Play size={24} color="#fff" fill="#fff" style={{ marginLeft: 4 }} />
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                            {isLastAndExtra && (
                                                                <div style={{
                                                                    position: 'absolute', inset: 0,
                                                                    background: 'rgba(0,0,0,0.5)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    color: '#fff', fontSize: 32, fontWeight: 600,
                                                                    cursor: 'pointer'
                                                                }}>
                                                                    +{extraCount}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {fileMedia.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                {fileMedia.map(m => (
                                                    <a key={m.id} href={m.url} target="_blank" rel="noreferrer"
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: 8,
                                                            padding: '10px 16px', background: '#F9FAFB',
                                                            color: '#3B82F6', fontSize: 13, textDecoration: 'none',
                                                            borderTop: '1px solid #E5E7EB',
                                                        }}>
                                                        <FileText size={16} />
                                                        {m.originalName}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                );
                            })()
                        )}
                    </>
                )}

                {/* ── Reactions & Comments Count Summary Bar ── */}
                {(totalReactions > 0 || (post.commentCount != null && post.commentCount > 0)) && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        borderTop: '1px solid #F3F4F6',
                        fontSize: 13,
                        color: '#6B7280'
                    }}>
                        {/* Left: Emojis and count */}
                        {totalReactions > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    {getTopReactionIcons(reactionCounts).map((icon, idx) => (
                                        <span key={idx} style={{ display: 'flex' }}>{icon}</span>
                                    ))}
                                </span>
                                <span style={{ fontWeight: 500 }}>
                                    {totalReactions}
                                </span>
                            </div>
                        ) : <div />}

                        {/* Right: Comment count */}
                        {post.commentCount != null && post.commentCount > 0 ? (
                            <div>
                                {post.commentCount} bình luận
                            </div>
                        ) : null}
                    </div>
                )}

                {/* ── Footer ── */}
                <div style={{
                    padding: '8px 12px',
                    borderTop: '1px solid #E5E7EB',
                    display: 'flex', 
                    gap: 4,
                }}>

                    <div
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        style={{ position: 'relative', display: 'flex', flex: 1, justifyContent: 'center' }}
                    >
                        {/* Popover */}
                        {showReactionsPopover && (
                            <div
                                className="reaction-popover-animate"
                                onMouseEnter={() => {
                                    if (popoverTimeoutRef.current) clearTimeout(popoverTimeoutRef.current);
                                }}
                                onMouseLeave={handleMouseLeave}
                                style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    marginBottom: 8,
                                    background: '#ffffff',
                                    borderRadius: 30,
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                                    border: '1px solid #E5E7EB',
                                    display: 'flex',
                                    gap: 6,
                                    padding: '4px 6px',
                                    zIndex: 100,
                                }}
                            >
                                {(['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'] as ReactionType[]).map((type) => {
                                    const detail = REACTION_DETAILS[type];
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => { void handleSelectReaction(type); }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                fontSize: 20,
                                                cursor: 'pointer',
                                                transition: 'transform 0.1s ease',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.3)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                            title={detail.label}
                                        >
                                            {detail.icon}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Like Button */}
                        <button
                            type="button"
                            onClick={() => { void handleReactClick(); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 8px',
                                borderRadius: 6,
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: 13,
                                color: currentUserReaction ? REACTION_DETAILS[currentUserReaction].color : '#6B7280',
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 600,
                                transition: 'background 0.12s, color 0.12s',
                                whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                            {currentUserReaction ? (
                                <span style={{ fontSize: 14, display: 'flex', alignItems: 'center' }}>
                                    {REACTION_DETAILS[currentUserReaction].icon}
                                </span>
                            ) : (
                                <Heart size={14} color="#6B7280" />
                            )}
                            {currentUserReaction ? REACTION_DETAILS[currentUserReaction].label : 'Thích'}
                        </button>
                    </div>


                    <button
                        type="button"
                        onClick={handleToggleComment}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '6px 8px', borderRadius: 6, border: 'none',
                            background: commentOpen ? '#EFF6FF' : 'transparent',
                            cursor: 'pointer', fontSize: 13,
                            color: commentOpen ? '#3B82F6' : '#6B7280',
                            fontFamily: 'Inter, sans-serif', fontWeight: commentOpen ? 600 : 500,
                            transition: 'background 0.12s',
                            whiteSpace: 'nowrap',
                            flex: 1, justifyContent: 'center'
                        }}
                    >
                        <MessageCircle size={14} />
                        Bình luận
                    </button>

                    <FooterBtn icon={<Share2 size={14} />} label="Chia sẻ" />
                </div>

                {commentOpen && (
                    <CommentSection postId={post.id} commentCount={post.commentCount} />
                )}
            </div>
        </>
    );
}