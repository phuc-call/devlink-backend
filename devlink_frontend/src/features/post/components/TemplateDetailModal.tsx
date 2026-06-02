// src/features/post/components/TemplateDetailModal.tsx
import React, { useEffect, useState } from 'react';
import {
    X, Eye, GitFork, Download, FileCode, FileText,
    Film, Table, File, Tag, Layers, User,
    Calendar, HardDrive, Sparkles, Loader2, AlertCircle,
} from 'lucide-react';
import { getTemplateDetail } from '../../../api/post-service/learningTemplateApi';
import type { TemplateDetailResponse, TemplateMetaOptions, TemplateAuthorInfo } from '../../../types/template.types';
import axiosInstance from '../../../api/axiosInstance';
import styles from './TemplateDetailModal.module.css';

interface Props {
    readonly templateId: number;
    readonly meta: TemplateMetaOptions | null;
    readonly onClose: () => void;
}

function getDifficultyLabel(value: string, meta: TemplateMetaOptions | null): string {
    if (!meta) return value;
    const labelMap: Record<string, string> = {
        BEGINNER: 'Cơ bản',
        INTERMEDIATE: 'Trung bình',
        ADVANCED: 'Nâng cao',
    };
    return meta.difficultly.includes(value) ? (labelMap[value] ?? value) : value;
}

function getDiffClass(value: string): string {
    const map: Record<string, string> = {
        BEGINNER: styles.diffBeginner,
        INTERMEDIATE: styles.diffIntermediate,
        ADVANCED: styles.diffAdvanced,
    };
    return map[value] ?? '';
}

function getFileTypeIcon(fileType: string, size = 14): React.ReactNode {
    const map: Record<string, React.ReactNode> = {
        CODE:  <FileCode size={size} />,
        PDF:   <FileText size={size} />,
        DOCX:  <File     size={size} />,
        XLSX:  <Table    size={size} />,
        VIDEO: <Film     size={size} />,
    };
    return map[fileType] ?? <File size={size} />;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function formatSize(bytes: number): string {
    if (!bytes || bytes === 0) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function parseJsonArray(raw: string | null): string[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

async function fetchAuthorInfo(userId: number): Promise<TemplateAuthorInfo | null> {
    try {
        const res = await axiosInstance.get(`/internal/users/${userId}/name`);
        return res.data.data ?? null;
    } catch {
        return null;
    }
}

interface DetailRowProps {
    readonly icon: React.ReactNode;
    readonly label: string;
    readonly children: React.ReactNode;
}

function DetailRow({ icon, label, children }: DetailRowProps) {
    return (
        <div className={styles.row}>
            <div className={styles.rowIconBox}>
                {icon}
            </div>
            <div className={styles.rowCountContainer}>
                <div className={styles.rowLabel}>{label}</div>
                <div className={styles.rowValue}>{children}</div>
            </div>
        </div>
    );
}

export default function TemplateDetailModal({ templateId, meta, onClose }: Props) {
    const [detail, setDetail] = useState<TemplateDetailResponse | null>(null);
    const [author, setAuthor] = useState<TemplateAuthorInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');

        getTemplateDetail(templateId)
            .then(async data => {
                if (cancelled) return;
                setDetail(data);
                const authorInfo = await fetchAuthorInfo(data.createdBy);
                if (!cancelled) setAuthor(authorInfo);
            })
            .catch(() => {
                if (!cancelled) setError('Không thể tải chi tiết template. Vui lòng thử lại sau.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [templateId]);

    useEffect(() => {
        const handleGlobalEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleGlobalEsc);
        return () => window.removeEventListener('keydown', handleGlobalEsc);
    }, [onClose]);

    const tags = detail ? parseJsonArray(detail.tags) : [];
    const topics = detail ? parseJsonArray(detail.topics) : [];

    return (
        <div
            className={styles.overlay}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            aria-hidden="true"
        >
            <div className={styles.modal} role="dialog" aria-modal="true">
                {/* Header */}
                <div className={styles.header}>
                    <h3 className={styles.headerTitle}>Chi tiết template</h3>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {loading && (
                        <div className={styles.loaderBox}>
                            <Loader2 size={24} className={styles.spinning} />
                            <span>Đang tải thông tin...</span>
                        </div>
                    )}

                    {!loading && error && (
                        <div className={styles.errorBox}>
                            <AlertCircle size={15} />
                            <span>{error}</span>
                        </div>
                    )}

                    {!loading && detail && (
                        <>
                            {/* Title & Badges */}
                            <div className={styles.metaSection}>
                                <h2 className={styles.mainTitle}>{detail.title}</h2>
                                <div className={styles.badgeRow}>
                                    <span className={`${styles.badge} ${styles.badgeLang}`}>
                                        {detail.language}
                                    </span>

                                    <span className={`${styles.badge} ${getDiffClass(detail.difficulty)}`}>
                                        {getDifficultyLabel(detail.difficulty, meta)}
                                    </span>

                                    <span className={`${styles.badge} ${styles.badgeFile}`}>
                                        {getFileTypeIcon(detail.fileType, 12)}
                                        {detail.fileType}
                                    </span>

                                    {detail.status && (
                                        <span className={`${styles.badge} ${detail.status === 'ACTIVE' ? styles.statusActive : styles.statusDisabled}`}>
                                            {detail.status === 'ACTIVE' ? 'Hoạt động' : 'Đã ẩn'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* AI Summary Card */}
                            {detail.aiSummary ? (
                                <div className={styles.aiCard}>
                                    <div className={styles.aiHeader}>
                                        <Sparkles size={13} />
                                        <span>AI tóm tắt nội dung</span>
                                    </div>
                                    <p className={styles.aiContent}>{detail.aiSummary}</p>
                                </div>
                            ) : (
                                <div className={styles.aiEmpty}>
                                    <Sparkles size={13} />
                                    <span>Chưa có AI tóm tắt cho template này</span>
                                </div>
                            )}

                            {/* Description */}
                            {detail.description && (
                                <DetailRow icon={<FileText size={14} />} label="Mô tả mẫu học tập">
                                    <span className={styles.descText}>{detail.description}</span>
                                </DetailRow>
                            )}

                            {/* Author */}
                            <DetailRow icon={<User size={14} />} label="Người đăng tải">
                                <div className={styles.authorBox}>
                                    <img
                                        src={
                                            author?.avatar ??
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(author?.userName ?? 'U')}&background=3B82F6&color=fff&size=32`
                                        }
                                        alt={author?.userName ?? 'Avatar'}
                                        className={styles.avatarImg}
                                    />
                                    <span className={styles.authorName}>
                                        {author?.userName ?? `Thành viên #${detail.createdBy}`}
                                    </span>
                                </div>
                            </DetailRow>

                            {/* File attached */}
                            <DetailRow icon={getFileTypeIcon(detail.fileType)} label="Tệp tin đính kèm">
                                <div className={styles.fileContainer}>
                                    <span className={styles.fileName}>{detail.fileName}</span>
                                    <span className={styles.fileSizeText}>
                                        ({formatSize(detail.fileSize)})
                                    </span>
                                </div>
                            </DetailRow>

                            {/* Interaction Stats */}
                            <DetailRow icon={<Eye size={14} />} label="Chỉ số tương tác">
                                <div className={styles.statsFlex}>
                                    <span className={styles.statItem}>
                                        <Eye size={13} /> {detail.viewCount ?? 0} lượt xem
                                    </span>
                                    <span className={styles.statItem}>
                                        <GitFork size={13} /> {detail.forkCount ?? 0} lượt fork
                                    </span>
                                </div>
                            </DetailRow>

                            {/* Tags */}
                            {tags.length > 0 && (
                                <DetailRow icon={<Tag size={14} />} label="Từ khóa (Tags)">
                                    <div className={styles.tokenGroup}>
                                        {tags.map(t => (
                                            <span key={`tag-${t}`} className={styles.tagToken}>
                                                #{t}
                                            </span>
                                        ))}
                                    </div>
                                </DetailRow>
                            )}

                            {/* Topics */}
                            {topics.length > 0 && (
                                <DetailRow icon={<Layers size={14} />} label="Phân loại chủ đề">
                                    <div className={styles.tokenGroup}>
                                        {topics.map(t => (
                                            <span key={`topic-${t}`} className={styles.topicToken}>
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </DetailRow>
                            )}

                            {/* Timeline Dates */}
                            <DetailRow icon={<Calendar size={14} />} label="Thời gian hệ thống">
                                <div className={styles.dateTimeline}>
                                    <div>Ngày khởi tạo: <strong>{formatDate(detail.createdAt)}</strong></div>
                                    <div>Cập nhật cuối: <strong>{formatDate(detail.updatedAt)}</strong></div>
                                </div>
                            </DetailRow>

                            {/* Storage Info */}
                            <DetailRow icon={<HardDrive size={14} />} label="Dung lượng lưu trữ trên hệ thống">
                                <span className={styles.neutralDarkText}>{formatSize(detail.fileSize)}</span>
                            </DetailRow>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!loading && detail && (
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={onClose}>
                            Đóng cửa sổ
                        </button>
                        {detail.fileUrl && (
                            <a
                                href={detail.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.btnDownload}
                            >
                                <Download size={13} />
                                Tải xuống tài liệu
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}