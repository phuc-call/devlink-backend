import { useState, useRef, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { vi } from 'date-fns/locale';
import {
    MoreHorizontal, Pencil, Trash2, Flag, Bookmark, Bell,
    Eye, Heart, MessageCircle, Share2, Check, X,
    ImagePlus, Globe, Users, Lock, FileText,
} from 'lucide-react';
import type { FeedPostResponse, MediaResponse, Visibility } from '../../../types/post.types';
import { getCurrentUserId } from '../../../utils/auth';
import { postApi } from '../../../api/post-service/postApi';
import CommentSection from './CommentSection';
import { savedPostApi } from '../../../api/post-service/savedPostApi';
import ReportModal from '../../../components/common/ReportModal.tsx';
import { reactionApi } from '../../../api/post-service/reactionApi';
import type { ReactionType } from '../../../types/reaction.types';

const REACTION_DETAILS: Record<ReactionType, { emoji: string; label: string; color: string }> = {
    LIKE: { emoji: '👍', label: 'Thích', color: '#2563EB' },
    LOVE: { emoji: '❤️', label: 'Yêu thích', color: '#EF4444' },
    HAHA: { emoji: '😆', label: 'Haha', color: '#F59E0B' },
    WOW: { emoji: '😮', label: 'Wow', color: '#F59E0B' },
    SAD: { emoji: '😢', label: 'Buồn', color: '#F59E0B' },
    ANGRY: { emoji: '😡', label: 'Phẫn nộ', color: '#EA580C' },
};

function getTopReactionEmojis(counts: Record<ReactionType, number>): string[] {
    if (!counts) return [];
    return Object.entries(counts)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => REACTION_DETAILS[type as ReactionType].emoji);
}



interface Props {
    post: FeedPostResponse;
    onDeleted?: (postId: number) => void;
    onUpdated?: (post: FeedPostResponse) => void;
    openCommentPostId: number | null;
    onToggleComment: (id: number | null) => void;
    isSaved?: boolean;
}

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
    { value: 'PUBLIC', label: 'Công khai' },
    { value: 'FOLLOWERS_ONLY', label: 'Người theo dõi' },
    { value: 'PRIVATE', label: 'Chỉ mình tôi' },
];

function visibilityLabel(v: string): { icon: React.ReactNode; text: string } {
    switch (v) {
        case 'PUBLIC':           return { icon: <Globe size={12} />, text: 'Công khai' };
        case 'FOLLOWERS_ONLY':   return { icon: <Users size={12} />, text: 'Người theo dõi' };
        case 'PRIVATE':          return { icon: <Lock size={12} />, text: 'Chỉ mình tôi' };
        default:                 return { icon: <Globe size={12} />, text: v };
    }
}

// ─── Inline Edit Form ─────────────────────────────────────────────────────────
interface InlineEditFormProps {
    post: FeedPostResponse;
    onCancel: () => void;
    onSaved: (updated: FeedPostResponse) => void;
}

function InlineEditForm({ post, onCancel, onSaved }: InlineEditFormProps) {
    const [content, setContent]           = useState(post.content ?? '');
    const [visibility, setVisibility]     = useState<Visibility>(post.visibility as Visibility);
    const [existingMedia, setExistingMedia] = useState<MediaResponse[]>(post.mediaList ?? []);
    const [removeIds, setRemoveIds]       = useState<number[]>([]);
    const [newFiles, setNewFiles]         = useState<File[]>([]);
    const [newPreviews, setNewPreviews]   = useState<string[]>([]);
    const [tagInput, setTagInput]         = useState((post.tags ?? []).map(t => t.tag).join(', '));
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState('');
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
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 10px', borderRadius: 6, border: 'none',
                background: hovered ? '#F3F4F6' : 'transparent',
                cursor: 'pointer', fontSize: 13, color: '#6B7280',
                fontFamily: 'Inter, sans-serif', fontWeight: 500,
                transition: 'background 0.12s',
            }}
        >
            {icon}{label}
        </button>
    );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────
export default function PostCard({
                                     post: initialPost, onDeleted, onUpdated,
                                     openCommentPostId, onToggleComment,isSaved = false,
                                 }: Props) {
    const navigate = useNavigate();
    const [post, setPost]                   = useState(initialPost);
    const [menuOpen, setMenuOpen]           = useState(false);
    const [editing, setEditing]             = useState(false);
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

    // Reactions States
    const [currentUserReaction, setCurrentUserReaction] = useState<ReactionType | null>(null);
    const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
        LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0
    });
    const [totalReactions, setTotalReactions] = useState(post.likeCount ?? 0);
    const [showReactionsPopover, setShowReactionsPopover] = useState(false);
    const popoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentUserId = getCurrentUserId();
    const isOwner       = currentUserId !== null && post.authorId === currentUserId;
    const commentOpen   = openCommentPostId === post.id;

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
        return () => {
            isMounted = false;
        };
    }, [post.id]);

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
    const vis     = visibilityLabel(post.visibility);


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

            <div style={{
                background: '#FFFFFF', borderRadius: 8,
                boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                marginBottom: 12, overflow: 'hidden',
                fontFamily: 'Inter, sans-serif',
            }}>
                {/* ── Header ── */}
                <div style={{
                    padding: '16px 16px 12px',
                    display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.textDecoration = 'underline';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.textDecoration = 'none';
                                    }}
                                >
                                    {authorName}
                                </button>
                                {post.author?.badge != null && post.author.badge !== 'NONE' && (
                                    <span style={{
                                        background: '#DBEAFE', color: '#2563EB',
                                        fontSize: 11, padding: '1px 6px',
                                        borderRadius: 9999, fontWeight: 500,
                                    }}>
                                        {post.author.badge === 'POPULAR' ? '⭐ Nổi bật' : '✓ Verified'}
                                    </span>
                                )}
                            </div>
                            <div style={{
                                fontSize: 12, color: '#6B7280',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                <span>{timeAgo}</span>
                                <span>·</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    {vis.icon} {vis.text}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ⋯ Menu */}
                    <div ref={menuRef} style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={() => setMenuOpen(v => !v)}
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
                                position: 'absolute', right: 0, top: 36,
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
                            <div style={{ padding: '0 16px 12px', fontSize: 14, color: '#111827', lineHeight: 1.6 }}>
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
                            <div>
                                {safeMediaList.map(m => (
                                    <div key={m.id}>
                                        {m.mediaType === 'IMAGE' && (
                                            <img src={m.url} alt={m.originalName}
                                                 style={{ width: '100%', maxHeight: 500, objectFit: 'cover' }} />
                                        )}
                                        {m.mediaType === 'VIDEO' && (
                                            <video controls style={{ width: '100%', maxHeight: 500, background: '#000' }}>
                                                <source src={m.url} />
                                            </video>
                                        )}
                                        {m.mediaType === 'FILE' && (
                                            <a href={m.url} target="_blank" rel="noreferrer"
                                               style={{
                                                   display: 'flex', alignItems: 'center', gap: 8,
                                                   padding: '10px 16px', background: '#F9FAFB',
                                                   color: '#3B82F6', fontSize: 13, textDecoration: 'none',
                                                   borderTop: '1px solid #E5E7EB',
                                               }}>
                                                <FileText size={16} />
                                                {m.originalName}
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
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
                                <span style={{ fontSize: 14 }}>
                                    {getTopReactionEmojis(reactionCounts).join('')}
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
                    padding: '10px 16px',
                    borderTop: '1px solid #E5E7EB',
                    display: 'flex', gap: 4,
                }}>
                    <FooterBtn icon={<Eye size={14} />} label={`${post.viewCount}`} />
                    
                    <div
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        style={{ position: 'relative', display: 'inline-block' }}
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
                                    left: 0,
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
                                            {detail.emoji}
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
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: 13,
                                color: currentUserReaction ? REACTION_DETAILS[currentUserReaction].color : '#6B7280',
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 600,
                                transition: 'background 0.12s, color 0.12s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                            {currentUserReaction ? (
                                <span style={{ fontSize: 14 }}>
                                    {REACTION_DETAILS[currentUserReaction].emoji}
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
                            padding: '6px 10px', borderRadius: 6, border: 'none',
                            background: commentOpen ? '#EFF6FF' : 'transparent',
                            cursor: 'pointer', fontSize: 13,
                            color: commentOpen ? '#3B82F6' : '#6B7280',
                            fontFamily: 'Inter, sans-serif', fontWeight: commentOpen ? 600 : 500,
                            transition: 'background 0.12s',
                        }}
                    >
                        <MessageCircle size={14} />
                        Bình luận
                        {post.commentCount != null && post.commentCount > 0 && (
                            <span style={{
                                background: commentOpen ? '#DBEAFE' : '#F3F4F6',
                                color: commentOpen ? '#3B82F6' : '#6B7280',
                                fontSize: 11, fontWeight: 600,
                                padding: '1px 7px', borderRadius: 9999, marginLeft: 2,
                            }}>
                                {post.commentCount}
                            </span>
                        )}
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