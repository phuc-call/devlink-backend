import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  Send,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Flag,
  Check,
} from "lucide-react";
import { getCurrentUserId, getCurrentUserInfo } from "../../../utils/auth";
import { commentApi } from "../../../api/post-service/commentApi";
import ReportModal from '../../../components/common/ReportModal'
import type {
  CommentSummaryResponse,
  CommentReplySummaryResponse,
} from "../../../types/comment.types";

const PAGE_SIZE = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAvatar(
  name: string | null | undefined,
  avatarUrl: string | null | undefined,
): string {
  if (avatarUrl) return avatarUrl;
  const display = name ?? "U";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(display)}&background=3B82F6&color=fff&size=64`;
}

function timeAgo(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    const diffWk = Math.floor(diffDay / 7);
    if (diffWk < 5) return `${diffWk}w ago`;
    const diffMo = Math.floor(diffDay / 30);
    if (diffMo < 12) return `${diffMo}mo ago`;
    return `${Math.floor(diffMo / 12)}y ago`;
  } catch {
    return "";
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [msg, setMsg] = useState("");
  const [type, setType] = useState<"success" | "error">("success");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback(
    (message: string, t: "success" | "error" = "success") => {
      clearTimeout(timerRef.current);
      setMsg(message);
      setType(t);
      timerRef.current = setTimeout(() => setMsg(""), 2800);
    },
    [],
  );

  return { msg, type, show };
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

interface DeleteModalProps {
  open: boolean;
  label: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteModal({
  open,
  label,
  loading,
  onConfirm,
  onCancel,
}: Readonly<DeleteModalProps>) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "22px 24px",
          width: 320,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <Trash2 size={18} color="#EF4444" />
          <span style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>
            Confirm delete
          </span>
        </div>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 18 }}>
          Are you sure you want to delete {label}? This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "1px solid #E5E7EB",
              background: "#fff",
              fontSize: 13,
              cursor: "pointer",
              color: "#6B7280",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "none",
              background: "#EF4444",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: loading ? 0.7 : 1,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {loading && (
              <Loader2
                size={13}
                style={{ animation: "spin .8s linear infinite" }}
              />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── More Menu ────────────────────────────────────────────────────────────────

interface MoreMenuProps {
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
}

function menuItemStyle(color: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "9px 14px",
    border: "none",
    background: "none",
    fontSize: 13,
    cursor: "pointer",
    color,
    fontFamily: "Inter, sans-serif",
    transition: "background .12s",
    textAlign: "left",
  };
}

function MoreMenu({
  isOwner,
  onEdit,
  onDelete,
  onReport,
}: Readonly<MoreMenuProps>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      ref={ref}
      style={{ position: "relative", flexShrink: 0, opacity: 0 }}
      className="more-menu-wrapper"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "none",
          background: open ? "#E4E6EB" : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#65676B",
          transition: "background .15s",
        }}
        aria-label="Options"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "110%",
            zIndex: 200,
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            border: "1px solid #E4E6EB",
            minWidth: 160,
            overflow: "hidden",
          }}
        >
          {isOwner ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
                style={menuItemStyle("#1C1E21")}
              >
                <Pencil size={14} color="#65676B" /> Edit
              </button>
              <div style={{ height: 1, background: "#E4E6EB" }} />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
                style={menuItemStyle("#EF4444")}
              >
                <Trash2 size={14} color="#EF4444" /> Delete
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onReport();
              }}
              style={menuItemStyle("#EF4444")}
            >
              <Flag size={14} color="#EF4444" /> Report
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Inline Edit ──────────────────────────────────────────────────────────────

interface InlineEditProps {
  defaultValue: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
  compact?: boolean;
}

function InlineEditInput({
  defaultValue,
  onSave,
  onCancel,
  compact,
}: Readonly<InlineEditProps>) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Content cannot be empty");
      return;
    }
    if (trimmed.length > 2000) {
      setError("Maximum 2000 characters");
      return;
    }
    setLoading(true);
    try {
      await onSave(trimmed);
    } catch {
      setError("Failed to save. Please try again.");
      setLoading(false);
    }
  }, [value, onSave]);

  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          background: "#F0F2F5",
          borderRadius: 18,
          padding: "8px 14px",
          border: error ? "1.5px solid #EF4444" : "1.5px solid #3B82F6",
        }}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSave();
            }
            if (e.key === "Escape") onCancel();
          }}
          rows={1}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            resize: "none",
            background: "transparent",
            fontSize: compact === true ? 13 : 14,
            fontFamily: "Inter, sans-serif",
            color: "#1C1E21",
            lineHeight: 1.5,
            overflow: "hidden",
          }}
        />
      </div>
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            color: "#EF4444",
            marginTop: 3,
          }}
        >
          <AlertCircle size={11} />
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 12px",
            borderRadius: 6,
            border: "none",
            background: loading ? "#93C5FD" : "#3B82F6",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {loading ? (
            <Loader2
              size={11}
              style={{ animation: "spin .8s linear infinite" }}
            />
          ) : (
            <Check size={11} />
          )}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid #E5E7EB",
            background: "#fff",
            fontSize: 12,
            cursor: "pointer",
            color: "#65676B",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Comment Input ─────────────────────────────────────────────────────────────

interface CommentInputProps {
  postId: number;
  commentId?: number;
  parentReplyId?: number | null;
  placeholder?: string;
  autoFocus?: boolean;
  onSuccess: (
    item: CommentSummaryResponse | CommentReplySummaryResponse,
  ) => void;
  onCancel?: () => void;
  compact?: boolean;
  isReplyMode?: boolean;
  currentUserAvatar?: string | null;
  currentUserName?: string | null;
}

function CommentInput({
  postId,
  commentId,
  parentReplyId = null,
  placeholder = "Write a comment…",
  autoFocus = false,
  onSuccess,
  onCancel,
  compact = false,
  isReplyMode = false,
  currentUserAvatar = null,
  currentUserName = null,
}: Readonly<CommentInputProps>) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setError("");
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      setError("Maximum 2000 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (isReplyMode && commentId !== undefined) {
        const res = await commentApi.createReply({
          postId,
          commentId,
          parentReplyId: parentReplyId ?? null,
          content: trimmed,
        });
        const created = res.data.data;
        const optimistic: CommentReplySummaryResponse = {
          ...created,
          fullName: currentUserName ?? null,
          avatarUrl: currentUserAvatar ?? null,
          type: "REPLY",
          mentionedName: null,
        };
        onSuccess(optimistic);
      } else {
        const res = await commentApi.createComment({
          postId,
          content: trimmed,
        });
        const created = res.data.data;
        const optimistic: CommentSummaryResponse = {
          id: created.id,
          postId: created.postId,
          authorId: created.authorId,
          content: created.content,
          status: created.status,
          likeCount: 0,
          replyCount: 0,
          createdAt: created.createdAt,
          fullName: currentUserName ?? null,
          avatarUrl: currentUserAvatar ?? null,
          type: "COMMENT",
          mentionedName: null,
        };
        onSuccess(optimistic);
      }
      setContent("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch {
      setError("Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    content,
    isReplyMode,
    commentId,
    postId,
    parentReplyId,
    currentUserName,
    currentUserAvatar,
    onSuccess,
  ]);

  const avatarSize = compact ? 28 : 32;

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <img
        src={getAvatar(currentUserName, currentUserAvatar)}
        alt="me"
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          marginTop: 2,
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            background: "#F0F2F5",
            borderRadius: 20,
            padding: "7px 10px 7px 14px",
            border: error ? "1.5px solid #EF4444" : "1.5px solid transparent",
            transition: "border-color .15s",
          }}
        >
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder={placeholder}
            rows={1}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              resize: "none",
              background: "transparent",
              fontSize: compact ? 13 : 14,
              fontFamily: "Inter, sans-serif",
              color: "#1C1E21",
              lineHeight: 1.5,
              minHeight: 20,
              maxHeight: 120,
              overflow: "auto",
              paddingTop: 1,
            }}
          />
          <button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={loading || !content.trim()}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              cursor: loading || !content.trim() ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: content.trim() ? "#3B82F6" : "#BCC0C4",
              transition: "color .15s",
            }}
          >
            {loading ? (
              <Loader2
                size={16}
                style={{ animation: "spin 0.8s linear infinite" }}
              />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 4,
              fontSize: 12,
              color: "#EF4444",
            }}
          >
            <AlertCircle size={12} />
            {error}
          </div>
        )}
        {onCancel !== undefined && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              marginTop: 4,
              fontSize: 12,
              color: "#65676B",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Cancel
          </button>
        )}
        {!compact && (
          <span
            style={{
              fontSize: 11,
              color: "#BCC0C4",
              marginTop: 2,
              display: "block",
            }}
          >
            Press Enter to send · Shift+Enter for new line
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Reply Item ───────────────────────────────────────────────────────────────

interface ReplyItemProps {
  reply: CommentReplySummaryResponse;
  postId: number;
  commentId: number;
  currentUserId: number | null;
  currentUserAvatar?: string | null;
  currentUserName?: string | null;
  onReplySuccess: (reply: CommentReplySummaryResponse) => void;
  onDeleteSuccess: (replyId: number) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

function ReplyItem({
  reply,
  postId,
  commentId,
  currentUserId,
  currentUserAvatar,
  currentUserName,
  onReplySuccess,
  onDeleteSuccess,
  showToast,
}: Readonly<ReplyItemProps>) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reply.likeCount ?? 0);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(reply.content);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const isOwner = currentUserId !== null && reply.authorId === currentUserId;

  if (deleted) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await commentApi.deleteComment(reply.id, "REPLY");
      setShowDeleteModal(false);
      setDeleted(true);
      onDeleteSuccess(reply.id);
      showToast("Reply deleted.");
    } catch {
      showToast("Failed to delete. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveEdit = async (newContent: string) => {
    await commentApi.updateComment(reply.id, {
      type: "REPLY",
      content: newContent,
    });
    setContent(newContent);
    setEditing(false);
    showToast("Changes saved.");
  };

  const handleLike = () => {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  return (
    <div
      style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
      className="comment-row"
    >
      <img
        src={getAvatar(reply.fullName, reply.avatarUrl)}
        alt={reply.fullName ?? "User"}
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          marginTop: 2,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div style={{ display: "flex", gap: 8 }}>
            <InlineEditInput
              defaultValue={content}
              onSave={handleSaveEdit}
              onCancel={() => setEditing(false)}
              compact
            />
          </div>
        ) : (
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: 4 }}
            className="comment-bubble-row"
          >
            <div
              style={{
                background: "#F0F2F5",
                borderRadius: 18,
                padding: "7px 12px",
                display: "inline-block",
                maxWidth: "100%",
                wordBreak: "break-word",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#1C1E21",
                  display: "block",
                }}
              >
                {reply.fullName ?? "User"}
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#1C1E21",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {reply.mentionedName !== null &&
                  reply.mentionedName !== undefined && (
                    <span
                      style={{
                        color: "#3B82F6",
                        fontWeight: 600,
                        marginRight: 4,
                      }}
                    >
                      @{reply.mentionedName}
                    </span>
                  )}
                {content}
              </p>
            </div>
            <div
              className="more-menu-wrapper"
              style={{ opacity: 0, transition: "opacity .15s", marginTop: 4 }}
            >
              <MoreMenu
                isOwner={isOwner}
                onEdit={() => setEditing(true)}
                onDelete={() => setShowDeleteModal(true)}
                onReport={() => setShowReportModal(true)}
              />
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            marginTop: 3,
            paddingLeft: 4,
          }}
        >
          <span style={{ fontSize: 12, color: "#65676B", marginRight: 6 }}>
            {timeAgo(reply.createdAt)}
          </span>
          <button
            type="button"
            onClick={handleLike}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              color: liked ? "#3B82F6" : "#65676B",
              padding: "2px 6px",
              borderRadius: 4,
              fontFamily: "Inter, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {liked ? "💙 Like" : "Like"}
            {likeCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 400, color: "#65676B" }}>
                {" "}
                · {likeCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowReplyInput((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              color: showReplyInput ? "#3B82F6" : "#65676B",
              padding: "2px 6px",
              borderRadius: 4,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Reply
          </button>
        </div>

        {showReplyInput && (
          <div style={{ marginTop: 8 }}>
            <CommentInput
              postId={postId}
              commentId={commentId}
              parentReplyId={reply.id}
              placeholder={`Reply to ${reply.fullName ?? "user"}…`}
              autoFocus
              compact
              isReplyMode
              currentUserAvatar={currentUserAvatar}
              currentUserName={currentUserName}
              onSuccess={(r) => {
                onReplySuccess(r as CommentReplySummaryResponse);
                setShowReplyInput(false);
              }}
              onCancel={() => setShowReplyInput(false)}
            />
          </div>
        )}

        <DeleteModal
          open={showDeleteModal}
          label="this reply"
          loading={deleting}
          onConfirm={() => {
            void handleDelete();
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
        <ReportModal
    open={showReportModal}
    targetId={reply.id}
    targetType="COMMENT_REPLY"
    targetName={reply.fullName ?? 'user'}
    onClose={() => setShowReportModal(false)}
    onSuccess={() => { setShowReportModal(false); showToast('Đã gửi tố cáo thành công.'); }}
/>
      </div>
    </div>
  );
}

// ─── Comment Item ─────────────────────────────────────────────────────────────

interface CommentItemProps {
  comment: CommentSummaryResponse;
  postId: number;
  currentUserId: number | null;
  currentUserAvatar?: string | null;
  currentUserName?: string | null;
  onDeleteSuccess: (commentId: number) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

function CommentItem({
  comment,
  postId,
  currentUserId,
  currentUserAvatar,
  currentUserName,
  onDeleteSuccess,
  showToast,
}: Readonly<CommentItemProps>) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount ?? 0);
  const [replies, setReplies] = useState<CommentReplySummaryResponse[]>([]);
  const [replyPage, setReplyPage] = useState(0);
  const [hasMoreReplies, setHasMoreReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [replyCount, setReplyCount] = useState(comment.replyCount ?? 0);
  const isOwner = currentUserId !== null && comment.authorId === currentUserId;

  if (deleted) return null;

  const loadReplies = async (page: number) => {
    setLoadingReplies(true);
    try {
      const res = await commentApi.getReplies(comment.id, page);
      const pageData = res.data.data;
      setReplies((prev) =>
        page === 0 ? pageData.content : [...prev, ...pageData.content],
      );
      setHasMoreReplies(!pageData.last);
      setReplyPage(page);
      setRepliesLoaded(true);
    } catch {
      showToast("Failed to load replies.", "error");
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleShowReplies = () => {
    if (!repliesLoaded) void loadReplies(0);
    setShowReplies((v) => !v);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await commentApi.deleteComment(comment.id, "COMMENT");
      setShowDeleteModal(false);
      setDeleted(true);
      onDeleteSuccess(comment.id);
      showToast("Comment deleted.");
    } catch {
      showToast("Failed to delete. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveEdit = async (newContent: string) => {
    await commentApi.updateComment(comment.id, {
      type: "COMMENT",
      content: newContent,
    });
    setContent(newContent);
    setEditing(false);
    showToast("Changes saved.");
  };

  const handleReplySuccess = (reply: CommentReplySummaryResponse) => {
    setReplies((prev) => [...prev, reply]);
    setReplyCount((c) => c + 1);
    setShowReplyInput(false);
    setRepliesLoaded(true);
    setShowReplies(true);
  };

  const handleReplyDeleted = (replyId: number) => {
    setReplies((prev) => prev.filter((r) => r.id !== replyId));
    setReplyCount((c) => Math.max(0, c - 1));
  };

  const handleLike = () => {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  return (
    <div
      style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
      className="comment-row"
    >
      <img
        src={getAvatar(comment.fullName, comment.avatarUrl)}
        alt={comment.fullName ?? "User"}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          marginTop: 2,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div style={{ display: "flex", gap: 8 }}>
            <InlineEditInput
              defaultValue={content}
              onSave={handleSaveEdit}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: 4 }}
            className="comment-bubble-row"
          >
            <div
              style={{
                background: "#F0F2F5",
                borderRadius: 18,
                padding: "8px 14px",
                display: "inline-block",
                maxWidth: "100%",
                wordBreak: "break-word",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#1C1E21",
                  display: "block",
                }}
              >
                {comment.fullName ?? "User"}
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "#1C1E21",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {content}
              </p>
            </div>
            <div
              className="more-menu-wrapper"
              style={{ opacity: 0, transition: "opacity .15s", marginTop: 6 }}
            >
              <MoreMenu
                isOwner={isOwner}
                onEdit={() => setEditing(true)}
                onDelete={() => setShowDeleteModal(true)}
                onReport={() => setShowReportModal(true)}
              />
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            marginTop: 3,
            paddingLeft: 4,
          }}
        >
          <span style={{ fontSize: 12, color: "#65676B", marginRight: 6 }}>
            {timeAgo(comment.createdAt)}
          </span>
          <button
            type="button"
            onClick={handleLike}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              color: liked ? "#3B82F6" : "#65676B",
              padding: "2px 6px",
              borderRadius: 4,
              fontFamily: "Inter, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {liked ? "💙 Like" : "Like"}
            {likeCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 400, color: "#65676B" }}>
                {" "}
                · {likeCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowReplyInput((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              color: showReplyInput ? "#3B82F6" : "#65676B",
              padding: "2px 6px",
              borderRadius: 4,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Reply
          </button>
        </div>

        {showReplyInput && (
          <div style={{ marginTop: 8 }}>
            <CommentInput
              postId={postId}
              commentId={comment.id}
              placeholder={`Reply to ${comment.fullName ?? "user"}…`}
              autoFocus
              compact
              isReplyMode
              currentUserAvatar={currentUserAvatar}
              currentUserName={currentUserName}
              onSuccess={(r) =>
                handleReplySuccess(r as CommentReplySummaryResponse)
              }
              onCancel={() => setShowReplyInput(false)}
            />
          </div>
        )}

        {replyCount > 0 && (
          <button
            type="button"
            onClick={handleShowReplies}
            style={{
              marginTop: 6,
              fontSize: 13,
              fontWeight: 600,
              color: "#65676B",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 0",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "Inter, sans-serif",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 24,
                height: 2,
                background: "#CED0D4",
                borderRadius: 2,
              }}
            />
            {loadingReplies ? (
              <Loader2
                size={13}
                color="#3B82F6"
                style={{ animation: "spin .8s linear infinite" }}
              />
            ) : showReplies ? (
              "Hide replies"
            ) : (
              `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
            )}
          </button>
        )}

        {showReplies && replies.length > 0 && (
          <div
            style={{
              marginTop: 8,
              marginLeft: 4,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {replies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                postId={postId}
                commentId={comment.id}
                currentUserId={currentUserId}
                currentUserAvatar={currentUserAvatar}
                currentUserName={currentUserName}
                onReplySuccess={handleReplySuccess}
                onDeleteSuccess={handleReplyDeleted}
                showToast={showToast}
              />
            ))}
            {hasMoreReplies && (
              <button
                type="button"
                onClick={() => {
                  void loadReplies(replyPage + 1);
                }}
                disabled={loadingReplies}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#65676B",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  alignSelf: "flex-start",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 24,
                    height: 2,
                    background: "#CED0D4",
                    borderRadius: 2,
                  }}
                />
                {loadingReplies ? "Loading…" : "View more replies"}
              </button>
            )}
          </div>
        )}

        <DeleteModal
          open={showDeleteModal}
          label="this comment (including all replies)"
          loading={deleting}
          onConfirm={() => {
            void handleDelete();
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
        <ReportModal
    open={showReportModal}
    targetId={comment.id}
    targetType="COMMENT"
    targetName={comment.fullName ?? 'user'}
    onClose={() => setShowReportModal(false)}
    onSuccess={() => { setShowReportModal(false); showToast('Đã gửi tố cáo thành công.'); }}
/>
      </div>
    </div>
  );
}

// ─── Comment Section ──────────────────────────────────────────────────────────

interface Props {
  postId: number;
  commentCount?: number;
}

export default function CommentSection({ postId }: Readonly<Props>) {
  const [comments, setComments] = useState<CommentSummaryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId] = useState<number | null>(() => getCurrentUserId());
  const [currentUser, setCurrentUser] = useState<{
    userName: string;
    avatar: string | null;
  } | null>(null);

  const toast = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreBtnRef = useRef<HTMLButtonElement>(null);
  const isLoadingRef = useRef(false);

  // Load current user info
  useEffect(() => {
    getCurrentUserInfo()
      .then(setCurrentUser)
      .catch(() => {
        /* silently ignore */
      });
  }, []);

  const currentUserAvatar = currentUser?.avatar ?? null;
  const currentUserName = currentUser?.userName ?? null;

  // Core fetch — does NOT call setState synchronously; all setState inside async callback
  const fetchComments = useCallback(
    (pageNum: number) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      commentApi
        .getComments(postId, pageNum)
        .then((res) => {
          const pageData = res.data.data;
          setComments((prev) =>
            pageNum === 0 ? pageData.content : [...prev, ...pageData.content],
          );
          setHasMore(!pageData.last);
          setPage(pageNum);
          setInitialLoaded(true);
          setError("");
        })
        .catch(() => {
          setError("Unable to load comments. Please try again.");
          setInitialLoaded(true);
        })
        .finally(() => {
          setLoading(false);
          isLoadingRef.current = false;
        });

      // setLoading is intentionally called here BEFORE the async operation
      // to show the spinner immediately — this is valid because it's in a
      // .then/.catch chain, not blocking the render cycle.
      setLoading(true);
    },
    [postId],
  );

  // Initial load — effect only triggers fetchComments, no direct setState
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchComments(0);
  }, [fetchComments]);

  // Auto-scroll "load more" button into view after new comments render
  useEffect(() => {
    if (initialLoaded && hasMore && !loading) {
      loadMoreBtnRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [comments.length, initialLoaded, hasMore, loading]);

  const handleLoadMore = () => {
    fetchComments(page + 1);
  };

  const handleNewComment = (comment: CommentSummaryResponse) =>
    setComments((prev) => [comment, ...prev]);

  const handleCommentDeleted = (commentId: number) =>
    setComments((prev) => prev.filter((c) => c.id !== commentId));

  return (
    <div
      ref={containerRef}
      style={{
        fontFamily: "Inter, sans-serif",
        borderTop: "1px solid #E4E6EB",
        // Fixed-height scrollable container — shows ~5 comments then scrolls
        maxHeight: 480,
        overflowY: "auto",
        padding: "12px 16px 16px",
        scrollBehavior: "smooth",
      }}
    >
      {/* ── Write comment input ── */}
      <div style={{ marginBottom: 16 }}>
        <CommentInput
          postId={postId}
          currentUserAvatar={currentUserAvatar}
          currentUserName={currentUserName}
          onSuccess={(c) => handleNewComment(c as CommentSummaryResponse)}
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 12px",
            borderRadius: 8,
            background: "#FEF2F2",
            color: "#EF4444",
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* ── Initial loading spinner ── */}
      {loading && !initialLoaded && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "16px 0",
          }}
        >
          <Loader2
            size={20}
            color="#3B82F6"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
        </div>
      )}

      {/* ── Comment list ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            currentUserId={currentUserId}
            currentUserAvatar={currentUserAvatar}
            currentUserName={currentUserName}
            onDeleteSuccess={handleCommentDeleted}
            showToast={toast.show}
          />
        ))}
      </div>

      {/* ── Load more spinner (pagination loading) ── */}
      {loading && initialLoaded && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px 0",
          }}
        >
          <Loader2
            size={18}
            color="#3B82F6"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
        </div>
      )}

      {/* ── Load more button — like FB "View X more comments" ── */}
      {!loading && hasMore && (
        <button
          ref={loadMoreBtnRef}
          type="button"
          onClick={handleLoadMore}
          style={{
            marginTop: 10,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px 0",
            border: "none",
            borderRadius: 8,
            background: "#F0F2F5",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: "#65676B",
            fontFamily: "Inter, sans-serif",
            transition: "background .12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#E4E6EB";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#F0F2F5";
          }}
        >
          Xem thêm bình luận ({PAGE_SIZE} mỗi trang)
        </button>
      )}

      {/* ── All loaded ── */}
      {!hasMore && comments.length > 0 && (
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#BCC0C4",
            margin: "12px 0 0",
          }}
        >
          Đã tải hết bình luận
        </p>
      )}

      {/* ── Empty state ── */}
      {!loading && initialLoaded && comments.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <MessageCircle
            size={28}
            color="#CED0D4"
            style={{ margin: "0 auto 8px", display: "block" }}
          />
          <p style={{ fontSize: 13, color: "#BCC0C4", margin: 0 }}>
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </p>
        </div>
      )}

      {/* ── Toast ── */}
      {toast.msg && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: toast.type === "error" ? "#FEF2F2" : "#ECFDF5",
            color: toast.type === "error" ? "#DC2626" : "#065F46",
            border: `1px solid ${toast.type === "error" ? "#FECACA" : "#6EE7B7"}`,
            padding: "9px 20px",
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 2000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            animation: "fadeInUp .2s ease",
            whiteSpace: "nowrap",
          }}
        >
          {toast.type === "error" ? (
            <AlertCircle size={14} />
          ) : (
            <Check size={14} />
          )}
          {toast.msg}
        </div>
      )}

      <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
                .comment-bubble-row:hover .more-menu-wrapper,
                .comment-row:hover > div > .comment-bubble-row .more-menu-wrapper { opacity: 1 !important; }
                .more-menu-wrapper button:hover { background: #E4E6EB !important; }
            `}</style>
    </div>
  );
}
