import React, { useEffect, useRef, useState } from 'react';
import { X, Check, Loader2, AlertCircle, CloudUpload, FileCode, FileText, File, Table, Film } from 'lucide-react';
import type { TemplateCardResponse, TemplateMetaOptions } from '../../../types/template.types';
import type { UpdateTemplateRequest } from '../../../types/updateTemplate.types';
import { updateAdminTemplate } from '../../../api/post-service/Updatetemplateapi';
import { getSupportedLanguages } from '../../../api/post-service/learningTemplateApi';
import styles from './UpdateTemplateModal.module.css';

// ─── constants ───────────────────────────────────────────────────────────────

const DIFF_LABEL: Record<string, string> = {
    BEGINNER: 'Cơ bản',
    INTERMEDIATE: 'Trung bình',
    ADVANCED: 'Nâng cao',
};


const FILE_ACCEPT: Record<string, string> = {
    CODE: '.java,.py,.js,.ts,.cpp,.c,.go,.rs,.kt,.swift',
    PDF: '.pdf',
    DOCX: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    XLSX: '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    VIDEO: '.mp4,.mov,.avi,.mkv',
};
const FILE_ICON: Record<string, React.ReactNode> = {
    CODE: <FileCode size={16} />,
    PDF: <FileText size={16} />,
    DOCX: <File size={16} />,
    XLSX: <Table size={16} />,
    VIDEO: <Film size={16} />,
};

const MAX_TAGS = 10;

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}

// ─── TagInput ────────────────────────────────────────────────────────────────

interface TagInputProps {
    label: string;
    tags: string[];
    onChange: (tags: string[]) => void;
    disabled?: boolean;
}

function TagInput({ label, tags, onChange, disabled }: TagInputProps) {
    const [input, setInput] = useState('');

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key !== 'Enter' && e.key !== ',') return;
        e.preventDefault();
        const val = input.trim().toLowerCase();
        if (!val || tags.length >= MAX_TAGS || tags.includes(val)) return;
        onChange([...tags, val]);
        setInput('');
    }

    function remove(tag: string) {
        onChange(tags.filter((t) => t !== tag));
    }

    return (
        <div className={styles.field}>
            <label className={styles.label}>
                {label}
                <span className={styles.hint}> (tối đa {MAX_TAGS})</span>
            </label>
            <div className={styles.tagsWrap}>
                {tags.map((t) => (
                    <span key={t} className={styles.tag}>
                        {t}
                        {!disabled && (
                            <button
                                type="button"
                                className={styles.tagRemove}
                                onClick={() => remove(t)}
                                aria-label={`Xóa ${t}`}
                            >
                                <X size={10} />
                            </button>
                        )}
                    </span>
                ))}
                {tags.length < MAX_TAGS && !disabled && (
                    <input
                        className={styles.tagInput}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Nhập rồi Enter..."
                        disabled={disabled}
                    />
                )}
            </div>
        </div>
    );
}

// ─── FileUpload ───────────────────────────────────────────────────────────────

interface FileUploadProps {
    fileType: string;
    file: File | null;
    onChange: (f: File | null) => void;
    disabled?: boolean;
}

function FileUpload({ fileType, file, onChange, disabled }: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        onChange(e.target.files?.[0] ?? null);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        if (disabled) return;
        onChange(e.dataTransfer.files?.[0] ?? null);
    }

    if (file) {
        return (
            <div className={styles.fileSelected}>
                <span className={styles.fileIcon}>{FILE_ICON[fileType] ?? <File size={16} />}</span>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{formatBytes(file.size)}</span>
                {!disabled && (
                    <button
                        type="button"
                        className={styles.fileClear}
                        onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ''; }}
                        aria-label="Xóa file"
                    >
                        <X size={13} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <>
            <div
                className={styles.fileArea}
                onClick={() => !disabled && inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
                aria-label="Chọn file"
            >
                <CloudUpload size={22} strokeWidth={1.5} />
                <p>Kéo thả hoặc <span>click để chọn</span></p>
                <small>{FILE_ACCEPT[fileType] ?? '*'}</small>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept={FILE_ACCEPT[fileType]}
                style={{ display: 'none' }}
                onChange={handleChange}
                disabled={disabled}
            />
        </>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export interface UpdateTemplateModalProps {
    template: TemplateCardResponse;
    meta: TemplateMetaOptions | null;
    onClose: () => void;
    onSuccess?: (updated: TemplateCardResponse) => void;
}

export default function UpdateTemplateModal({
                                                template,
                                                meta,
                                                onClose,
                                                onSuccess,
                                            }: UpdateTemplateModalProps) {
    // form state — pre-filled từ template hiện tại
    const [title, setTitle] = useState(template.title);
    const [description, setDescription] = useState('');
    const [language, setLanguage] = useState(template.language);
    const [difficulty, setDifficulty] = useState(template.difficulty);
    const [fileType, setFileType] = useState(template.fileType);
    const [tags, setTags] = useState<string[]>([]);
    const [topics, setTopics] = useState<string[]>([]);
    const [file, setFile] = useState<File | null>(null);

    const [langOptions, setLangOptions] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // load language options
    useEffect(() => {
        getSupportedLanguages()
            .then((r) => setLangOptions(r.languages ?? []))
            .catch(() => setLangOptions([]));
    }, []);

    // close on Escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // reset file khi đổi fileType
    function handleFileTypeChange(val: string) {
        setFileType(val);
        setFile(null);
    }

    async function handleSubmit() {
        setError(null);

        if (!title.trim()) {
            setError('Tiêu đề không được để trống');
            return;
        }
        if (!language) {
            setError('Vui lòng chọn ngôn ngữ');
            return;
        }

        const request: UpdateTemplateRequest = {
            title: title.trim(),
            description: description.trim() || undefined,
            language,
            difficulty,
            fileType,
            tags: tags.length ? tags : undefined,
            topics: topics.length ? topics : undefined,
        };

        setSubmitting(true);
        try {
            const updated = await updateAdminTemplate({ templateId: template.id, request, file: file ?? undefined });
            onSuccess?.({
                ...template,
                title: updated.title,
                language: updated.language,
                difficulty: updated.difficulty,
                fileType: updated.fileType,
                fileName: updated.fileName,
                aiSummary: updated.aiSummary ?? null,
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setSubmitting(false);
        }
    }

    const difficulties = meta?.difficultly ?? ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
    const fileTypes = meta?.fileType ?? ['CODE', 'PDF', 'DOCX', 'XLSX', 'VIDEO'];

    return (
        <div
            className={styles.overlay}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            aria-hidden="true"
        >
            <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Cập nhật template">
                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.headerTitle}>Cập nhật template</span>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng" disabled={submitting}>
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {/* Error banner */}
                    {error && (
                        <div className={styles.errorBanner}>
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Title */}
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="u-title">
                            Tiêu đề <span className={styles.req}>*</span>
                        </label>
                        <input
                            id="u-title"
                            className={styles.input}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={255}
                            disabled={submitting}
                            placeholder="Nhập tiêu đề..."
                        />
                        <span className={styles.hint}>{title.length}/255</span>
                    </div>

                    {/* Description */}
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="u-desc">Mô tả</label>
                        <textarea
                            id="u-desc"
                            className={styles.textarea}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={submitting}
                            placeholder="Mô tả nội dung template..."
                            rows={3}
                        />
                    </div>

                    {/* Language + Difficulty + FileType */}
                    <div className={styles.row3}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="u-lang">
                                Ngôn ngữ <span className={styles.req}>*</span>
                            </label>
                            <select
                                id="u-lang"
                                className={styles.select}
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                disabled={submitting}
                            >
                                <option value="">Chọn ngôn ngữ</option>
                                {langOptions.map((l) => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="u-diff">Độ khó</label>
                            <select
                                id="u-diff"
                                className={styles.select}
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                disabled={submitting}
                            >
                                {difficulties.map((d) => (
                                    <option key={d} value={d}>{DIFF_LABEL[d] ?? d}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="u-ftype">Loại file</label>
                            <select
                                id="u-ftype"
                                className={styles.select}
                                value={fileType}
                                onChange={(e) => handleFileTypeChange(e.target.value)}
                                disabled={submitting}
                            >
                                {fileTypes.map((f) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tags + Topics */}
                    <div className={styles.row2}>
                        <TagInput label="Tags" tags={tags} onChange={setTags} disabled={submitting} />
                        <TagInput label="Topics" tags={topics} onChange={setTopics} disabled={submitting} />
                    </div>

                    {/* File upload */}
                    <div className={styles.field}>
                        <label className={styles.label}>
                            File đính kèm
                            <span className={styles.hint}> — không bắt buộc, chỉ chọn khi muốn thay file mới</span>
                        </label>
                        <FileUpload
                            fileType={fileType}
                            file={file}
                            onChange={setFile}
                            disabled={submitting}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button className={styles.btnCancel} onClick={onClose} disabled={submitting}>
                        Hủy
                    </button>
                    <button className={styles.btnSubmit} onClick={handleSubmit} disabled={submitting}>
                        {submitting
                            ? <><Loader2 size={13} className={styles.spin} /> Đang lưu...</>
                            : <><Check size={13} /> Lưu thay đổi</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}