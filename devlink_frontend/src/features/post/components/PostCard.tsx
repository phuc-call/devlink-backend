// src/features/post/components/PostCard.tsx
import {useState, useRef, useEffect} from 'react';
import {formatDistanceToNow} from 'date-fns';
import {vi} from 'date-fns/locale';
import {
    MoreHorizontal, Pencil, Trash2, Flag, Bookmark, Bell,
    Eye, Heart, MessageCircle, Share2, Check, X,
    ImagePlus, Globe, Users, Lock, FileText,
} from 'lucide-react';
import type {FeedPostResponse, MediaResponse, Visibility} from '../../../types/post.types';
import {getCurrentUserId} from '../../../utils/auth';
import {postApi} from '../../../api/post-service/postApi';
import CommentSection from './CommentSection';
interface Props {
    post: FeedPostResponse;
    onDeleted?: (postId: number) => void;
    onUpdated?: (post: FeedPostResponse) => void;
}

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: React.ReactNode }[] = [
    {value: 'PUBLIC', label: 'Công khai', icon: <Globe size={13}/>},
    {value: 'FOLLOWERS_ONLY', label: 'Người theo dõi', icon: <Users size={13}/>},
    {value: 'PRIVATE', label: 'Chỉ mình tôi', icon: <Lock size={13}/>},
];

function visibilityLabel(v: string) {
    switch (v) {
        case 'PUBLIC':
            return {icon: <Globe size={12}/>, text: 'Công khai'};
        case 'FOLLOWERS_ONLY':
            return {icon: <Users size={12}/>, text: 'Người theo dõi'};
        case 'PRIVATE':
            return {icon: <Lock size={12}/>, text: 'Chỉ mình tôi'};
        default:
            return {icon: <Globe size={12}/>, text: v};
    }
}

// ─── Inline Edit Form ─────────────────────────────────────────────────────────
function InlineEditForm({
                            post, onCancel, onSaved,
                        }: {
    post: FeedPostResponse;
    onCancel: () => void;
    onSaved: (updated: FeedPostResponse) => void;
}) {
    const [content, setContent] = useState(post.content ?? '');
    const [visibility, setVisibility] = useState<Visibility>(post.visibility as Visibility);
    const [existingMedia, setExistingMedia] = useState<MediaResponse[]>(post.mediaList ?? []);
    const [removeIds, setRemoveIds] = useState<number[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [newPreviews, setNewPreviews] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState(post.tags.map(t => t.tag).join(', '));
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

    const handleSave = async () => {
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
                tags: tags.map((t, i) => ({id: i, postId: post.id, tag: t})),
                mediaList: saved?.mediaList ?? existingMedia,
            };
            onSaved(updated);
        } catch {
            setError('Cập nhật thất bại, thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            margin: '0 16px 12px',
            border: '1.5px solid #3B82F6',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#F9FAFB',
        }}>
            {/* Content textarea */}
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

            {/* Tags */}
            <div style={{padding: '0 12px 8px'}}>
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

            {/* Existing media — có nút xoá */}
            {existingMedia.length > 0 && (
                <div style={{padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 8}}>
                    {existingMedia.map(m => (
                        <div key={m.id} style={{position: 'relative', display: 'inline-block'}}>
                            {m.mediaType === 'IMAGE' ? (
                                <img src={m.url} alt={m.originalName}
                                     style={{width: 72, height: 72, objectFit: 'cover', borderRadius: 6}}/>
                            ) : m.mediaType === 'VIDEO' ? (
                                <div style={{
                                    width: 72, height: 72, borderRadius: 6,
                                    background: '#1F2937', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <FileText size={24} color="#9CA3AF"/>
                                </div>
                            ) : (
                                <div style={{
                                    width: 72, height: 72, borderRadius: 6,
                                    background: '#EFF6FF', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    flexDirection: 'column', gap: 2,
                                }}>
                                    <FileText size={20} color="#3B82F6"/>
                                    <span
                                        style={{fontSize: 9, color: '#3B82F6', textAlign: 'center', padding: '0 2px'}}>
                                        {m.originalName?.split('.').pop()?.toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={() => removeExisting(m.id)}
                                style={{
                                    position: 'absolute', top: -6, right: -6,
                                    width: 18, height: 18, borderRadius: '50%',
                                    background: '#EF4444', border: '2px solid #fff',
                                    cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    padding: 0,
                                }}
                            >
                                <X size={10} color="#fff"/>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* New file previews */}
            {newPreviews.length > 0 && (
                <div style={{padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 8}}>
                    {newPreviews.map((url, idx) => (
                        <div key={idx} style={{position: 'relative', display: 'inline-block'}}>
                            {newFiles[idx]?.type.startsWith('image/') ? (
                                <img src={url} alt=""
                                     style={{
                                         width: 72, height: 72, objectFit: 'cover', borderRadius: 6,
                                         border: '2px solid #3B82F6'
                                     }}/>
                            ) : (
                                <div style={{
                                    width: 72, height: 72, borderRadius: 6,
                                    background: '#EFF6FF', border: '2px solid #3B82F6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexDirection: 'column', gap: 2,
                                }}>
                                    <FileText size={20} color="#3B82F6"/>
                                    <span
                                        style={{fontSize: 9, color: '#3B82F6', textAlign: 'center', padding: '0 2px'}}>
                                        {newFiles[idx]?.name.split('.').pop()?.toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={() => removeNew(idx)}
                                style={{
                                    position: 'absolute', top: -6, right: -6,
                                    width: 18, height: 18, borderRadius: '50%',
                                    background: '#EF4444', border: '2px solid #fff',
                                    cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    padding: 0,
                                }}
                            >
                                <X size={10} color="#fff"/>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Toolbar: upload + visibility */}
            <div style={{
                padding: '8px 12px',
                display: 'flex', alignItems: 'center', gap: 8,
                borderTop: '1px solid #E5E7EB', background: '#fff',
            }}>
                {/* Upload button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '5px 10px', borderRadius: 6,
                        border: '1px solid #E5E7EB', background: '#F9FAFB',
                        cursor: 'pointer', fontSize: 12, color: '#374151',
                        fontFamily: 'Inter, sans-serif',
                    }}
                >
                    <ImagePlus size={14}/>
                    Thêm ảnh/file
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt"
                    style={{display: 'none'}}
                    onChange={handleFileChange}
                />

                {/* Visibility select */}
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

                {/* Actions */}
                <div style={{marginLeft: 'auto', display: 'flex', gap: 8}}>
                    {error && (
                        <span style={{fontSize: 12, color: '#EF4444', alignSelf: 'center'}}>{error}</span>
                    )}
                    <button
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
                        onClick={handleSave}
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
                        <Check size={13}/>
                        {loading ? 'Đang lưu...' : 'Lưu'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
function DeleteConfirmDialog({
                                 onCancel, onConfirm, loading,
                             }: {
    onCancel: () => void;
    onConfirm: () => void;
    loading: boolean;
}) {
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
                    <Trash2 size={22} color="#EF4444"/>
                </div>
                <h3 style={{margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#111827'}}>
                    Xoá bài viết?
                </h3>
                <p style={{margin: '0 0 20px', fontSize: 14, color: '#6B7280', lineHeight: 1.5}}>
                    Bài viết sẽ bị xoá và không thể khôi phục.
                </p>
                <div style={{display: 'flex', gap: 10}}>
                    <button onClick={onCancel} style={{
                        flex: 1, padding: '10px', borderRadius: 8,
                        border: '1px solid #E5E7EB', background: '#fff',
                        fontSize: 14, cursor: 'pointer', fontWeight: 500, color: '#374151',
                        fontFamily: 'Inter, sans-serif',
                    }}>
                        Huỷ
                    </button>
                    <button onClick={onConfirm} disabled={loading} style={{
                        flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                        background: loading ? '#FCA5A5' : '#EF4444',
                        color: '#fff', fontSize: 14,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 500, fontFamily: 'Inter, sans-serif',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                        <Trash2 size={14}/>
                        {loading ? 'Đang xoá...' : 'Xoá'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main PostCard ────────────────────────────────────────────────────────────
export default function PostCard({post: initialPost, onDeleted, onUpdated}: Props) {
    const [post, setPost] = useState(initialPost);
    const [menuOpen, setMenuOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [commentOpen, setCommentOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const currentUserId = getCurrentUserId();
    const isOwner = currentUserId !== null && post.authorId === currentUserId;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node))
                setMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const timeAgo = formatDistanceToNow(new Date(post.createdAt), {addSuffix: true, locale: vi});
    const vis = visibilityLabel(post.visibility);

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            await postApi.deletePost(post.id);
            setShowDeleteDialog(false);
            onDeleted?.(post.id);
        } catch {
            setDeleteLoading(false);
        }
    };

    const handleUpdated = (updated: FeedPostResponse) => {
        setPost(updated);
        setEditing(false);
        onUpdated?.(updated);
    };

    return (
        <>
            {showDeleteDialog && (
                <DeleteConfirmDialog
                    onCancel={() => setShowDeleteDialog(false)}
                    onConfirm={handleDelete}
                    loading={deleteLoading}
                />
            )}

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
                    <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                        <img
                            src={post.author?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.fullName ?? 'U')}&background=3B82F6&color=fff`}
                            alt={post.author?.fullName}
                            style={{width: 40, height: 40, borderRadius: '50%', objectFit: 'cover'}}
                        />
                        <div>
                            <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                                <span style={{fontWeight: 600, fontSize: 14, color: '#111827'}}>
                                    {post.author?.fullName || 'Người dùng'}
                                </span>
                                {post.author?.badge && post.author.badge !== 'NONE' && (
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
                                <span style={{display: 'flex', alignItems: 'center', gap: 3}}>
                                    {vis.icon} {vis.text}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ⋯ Menu */}
                    <div ref={menuRef} style={{position: 'relative'}}>
                        <button
                            onClick={() => setMenuOpen(v => !v)}
                            style={{
                                width: 32, height: 32, borderRadius: '50%',
                                border: 'none',
                                background: menuOpen ? '#F3F4F6' : 'transparent',
                                cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                color: '#6B7280',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                            onMouseLeave={e => (e.currentTarget.style.background = menuOpen ? '#F3F4F6' : 'transparent')}
                        >
                            <MoreHorizontal size={18}/>
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
                                            icon={<Pencil size={15}/>}
                                            label="Chỉnh sửa bài viết"
                                            onClick={() => {
                                                setEditing(true);
                                                setMenuOpen(false);
                                            }}
                                            color="#374151"
                                        />
                                        <div style={{height: 1, background: '#F3F4F6'}}/>
                                        <MenuItem
                                            icon={<Trash2 size={15}/>}
                                            label="Xoá bài viết"
                                            onClick={() => {
                                                setShowDeleteDialog(true);
                                                setMenuOpen(false);
                                            }}
                                            color="#EF4444"
                                            danger
                                        />
                                    </>
                                ) : (
                                    <>
                                        <MenuItem
                                            icon={<Bookmark size={15}/>}
                                            label="Lưu vào thư viện"
                                            onClick={() => setMenuOpen(false)}
                                            color="#374151"
                                        />
                                        <MenuItem
                                            icon={<Bell size={15}/>}
                                            label="Đánh dấu theo dõi"
                                            onClick={() => setMenuOpen(false)}
                                            color="#374151"
                                        />
                                        <div style={{height: 1, background: '#F3F4F6'}}/>
                                        <MenuItem
                                            icon={<Flag size={15}/>}
                                            label="Tố cáo bài viết"
                                            onClick={() => setMenuOpen(false)}
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
                            <div style={{padding: '0 16px 12px', fontSize: 14, color: '#111827', lineHeight: 1.6}}>
                                {post.content}
                            </div>
                        )}

                        {/* Tags */}
                        {post.tags.length > 0 && (
                            <div style={{padding: '0 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 6}}>
                                {post.tags.map(t => (
                                    <span key={t.id} style={{
                                        background: '#EFF6FF', color: '#3B82F6',
                                        fontSize: 12, padding: '2px 8px', borderRadius: 9999,
                                    }}>
                                        #{t.tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Media */}
                        {post.mediaList.length > 0 && (
                            <div>
                                {post.mediaList.map(m => (
                                    <div key={m.id}>
                                        {m.mediaType === 'IMAGE' && (
                                            <img src={m.url} alt={m.originalName}
                                                 style={{width: '100%', maxHeight: 500, objectFit: 'cover'}}/>
                                        )}
                                        {m.mediaType === 'VIDEO' && (
                                            <video controls style={{width: '100%', maxHeight: 500, background: '#000'}}>
                                                <source src={m.url}/>
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
                                                <FileText size={16}/>
                                                {m.originalName}
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ── Footer ── */}
                <div style={{
                    padding: '10px 16px',
                    borderTop: '1px solid #E5E7EB',
                    display: 'flex', gap: 4,
                }}>
                    <FooterBtn icon={<Eye size={14}/>} label={`${post.viewCount}`}/>
                    <FooterBtn icon={<Heart size={14}/>} label="Thích"/>

                    {/* Bình luận — toggle CommentSection */}
                    <button
                        onClick={() => setCommentOpen(v => !v)}
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
                        <MessageCircle size={14}/>
                        Bình luận
                    </button>

                    <FooterBtn icon={<Share2 size={14}/>} label="Chia sẻ"/>
                </div>

                {/* ── CommentSection xổ xuống khi click ── */}
                {commentOpen && (
                    <CommentSection
                        postId={post.id}
                        commentCount={post.commentCount}
                        defaultOpen
                    />
                )}
            </div>
        </>
    );
}


function MenuItem({icon, label, onClick, color, danger}: {
    icon: React.ReactNode; label: string;
    onClick: () => void; color: string; danger?: boolean;
}) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', border: 'none', cursor: 'pointer',
                background: hovered ? (danger ? '#FEF2F2' : '#F9FAFB') : '#fff',
                color, fontSize: 13, fontWeight: 500, textAlign: 'left',
                transition: 'background 0.12s', fontFamily: 'Inter, sans-serif',
            }}
        >
            {icon}{label}
        </button>
    );
}

function FooterBtn({icon, label}: { icon: React.ReactNode; label: string }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
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