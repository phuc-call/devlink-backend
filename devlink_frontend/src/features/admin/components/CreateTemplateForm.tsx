import { useState, useEffect, useRef } from 'react';
import {
    adminCreateTemplate,
    getTemplateMetaOptions,
    getSupportedLanguages,
} from '../../../api/post-service/learningTemplateApi';
import type {
    CreateTemplateRequest,
    TemplateMetaOptions,
    LanguageOptions,
} from '../../../types/template.types';

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
    title: string;
    description: string;
    language: string;
    difficulty: string;
    fileType: string;
    tags: string;
    topics: string;
}

const INITIAL_FORM: FormState = {
    title: '',
    description: '',
    language: '',
    difficulty: '',
    fileType: '',
    tags: '',
    topics: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface CreateTemplateFormProps {
    onSuccess?: () => void;
}

const CreateTemplateForm = ({ onSuccess }: CreateTemplateFormProps) => {
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [file, setFile] = useState<File | null>(null);
    const [meta, setMeta] = useState<TemplateMetaOptions | null>(null);
    const [langOptions, setLangOptions] = useState<LanguageOptions | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Gọi cả 2 API lấy options khi mount
    useEffect(() => {
        getTemplateMetaOptions().then(setMeta).catch(() => null);
        getSupportedLanguages().then(setLangOptions).catch(() => null);
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleReset = () => {
        setForm(INITIAL_FORM);
        setFile(null);
        setError(null);
        setSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.difficulty || !form.fileType || !file) return;

        const request: CreateTemplateRequest = {
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            language: form.language,
            difficulty: form.difficulty,
            fileType: form.fileType,
            tags: form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
            topics: form.topics ? form.topics.split(',').map((s) => s.trim()).filter(Boolean) : [],
        };

        try {
            setSubmitting(true);
            setError(null);
            await adminCreateTemplate(request, file);
            setSuccess(true);
            handleReset();
            onSuccess?.();
        } catch (err: unknown) {
            const resData = (err as { response?: { data?: { message?: string; data?: Record<string, string> } } })
                ?.response?.data;

            // Backend trả về validation errors dạng: data.data = { field: "message", ... }
            if (resData?.data && typeof resData.data === 'object') {
                const fieldErrors = Object.values(resData.data).join(' | ');
                setError(fieldErrors);
            } else {
                setError(resData?.message ?? 'Tao template that bai.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={s.wrapper}>
            <div style={s.card}>

                {/* Header */}
                <div style={s.header}>
                    <h3 style={s.title}>Tạo Learning Template</h3>
                    <p style={s.subtitle}>Upload tài liệu học tập cho học viên</p>
                </div>

                <div style={s.divider} />

                {/* Alerts */}
                {success && (
                    <div style={{ ...s.alert, ...s.alertSuccess }}>
                        ✓ &nbsp;Template đã được tạo thành công!
                    </div>
                )}
                {error && (
                    <div style={{ ...s.alert, ...s.alertError }}>
                        ! &nbsp;{error}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>

                    {/* Title */}
                    <div style={s.field}>
                        <label style={s.label}>Tiêu đề <span style={s.req}>*</span></label>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Ví dụ: Java OOP Cheatsheet"
                            style={s.input}
                            maxLength={255}
                            required
                            disabled={submitting}
                        />
                        <span style={s.hint}>{form.title.length}/255</span>
                    </div>

                    {/* Description */}
                    <div style={s.field}>
                        <label style={s.label}>Mô tả</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Mô tả ngắn về nội dung template..."
                            style={s.textarea}
                            rows={3}
                            disabled={submitting}
                        />
                    </div>

                    {/* Language + Difficulty */}
                    <div style={s.row}>
                        <div style={{ ...s.field, flex: 1 }}>
                            <label style={s.label}>Ngôn ngữ <span style={s.req}>*</span></label>
                            <select
                                name="language"
                                value={form.language}
                                onChange={handleChange}
                                style={s.select}
                                required
                                disabled={submitting || !langOptions}
                            >
                                <option value="">{langOptions ? '-- Chọn ngôn ngữ --' : 'Đang tải...'}</option>
                                {langOptions?.languages.map((lang) => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ ...s.field, flex: 1 }}>
                            <label style={s.label}>Độ khó <span style={s.req}>*</span></label>
                            <select
                                name="difficulty"
                                value={form.difficulty}
                                onChange={handleChange}
                                style={s.select}
                                required
                                disabled={submitting || !meta}
                            >
                                <option value="">{meta ? '-- Chọn độ khó --' : 'Đang tải...'}</option>
                                {meta?.difficultly.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* File Type */}
                    <div style={s.field}>
                        <label style={s.label}>Loại file <span style={s.req}>*</span></label>
                        <div style={s.fileTypeRow}>
                            {meta?.fileType.map((ft) => (
                                <label
                                    key={ft}
                                    style={{
                                        ...s.ftOption,
                                        ...(form.fileType === ft ? s.ftOptionActive : {}),
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="fileType"
                                        value={ft}
                                        checked={form.fileType === ft}
                                        onChange={handleChange}
                                        style={{ display: 'none' }}
                                        disabled={submitting}
                                    />
                                    <span style={s.ftLabel}>{ft}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* File upload */}
                    <div style={s.field}>
                        <label style={s.label}>File đính kèm <span style={s.req}>*</span></label>
                        <div
                            style={{ ...s.uploadBox, ...(file ? s.uploadBoxActive : {}) }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); }}
                                style={{ display: 'none' }}
                                disabled={submitting}
                            />
                            {file ? (
                                <div style={s.fileInfo}>
                                    <span style={{ fontSize: 24 }}>📄</span>
                                    <div style={{ flex: 1 }}>
                                        <p style={s.fileName}>{file.name}</p>
                                        <p style={s.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <button
                                        type="button"
                                        style={s.removeBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                    >✕</button>
                                </div>
                            ) : (
                                <div style={s.uploadEmpty}>
                                    <span style={s.uploadArrow}>↑</span>
                                    <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
                                        Kéo thả hoặc <span style={{ color: '#3B82F6', fontWeight: 500 }}>chọn file</span>
                                    </p>
                                    <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>Tối đa 50MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    <div style={s.field}>
                        <label style={s.label}>Tags</label>
                        <input
                            name="tags"
                            value={form.tags}
                            onChange={handleChange}
                            placeholder="oop, design-pattern, solid  (ngăn cách bằng dấu phẩy)"
                            style={s.input}
                            disabled={submitting}
                        />
                    </div>

                    {/* Topics */}
                    <div style={s.field}>
                        <label style={s.label}>Topics</label>
                        <input
                            name="topics"
                            value={form.topics}
                            onChange={handleChange}
                            placeholder="inheritance, polymorphism  (ngăn cách bằng dấu phẩy)"
                            style={s.input}
                            disabled={submitting}
                        />
                    </div>

                    <div style={s.divider} />

                    {/* Actions */}
                    <div style={s.actions}>
                        <button type="button" onClick={handleReset} style={s.btnSecondary} disabled={submitting}>
                            Làm lại
                        </button>
                        <button
                            type="submit"
                            style={{ ...s.btnPrimary, ...(submitting ? s.btnDisabled : {}) }}
                            disabled={submitting}
                        >
                            {submitting ? '⏳ Đang tạo...' : 'Tạo Template'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
    wrapper: { fontFamily: "'Inter', sans-serif", padding: '24px' },
    card: {
        background: '#FFFFFF', borderRadius: '12px',
        border: '1px solid #E5E7EB', boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        padding: '28px 32px', maxWidth: '680px', margin: '0 auto',
    },
    header: { marginBottom: '20px' },
    title: { fontSize: '20px', fontWeight: 600, color: '#111827', margin: '0 0 4px' },
    subtitle: { fontSize: '14px', color: '#6B7280', margin: 0 },
    divider: { height: '1px', background: '#E5E7EB', margin: '20px 0' },
    alert: { padding: '10px 14px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' },
    alertSuccess: { background: '#F0FDF4', color: '#16A34A', border: '1px solid #86EFAC' },
    alertError: { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' },
    field: { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '14px', fontWeight: 500, color: '#374151' },
    req: { color: '#EF4444', marginLeft: '2px' },
    hint: { fontSize: '12px', color: '#9CA3AF', textAlign: 'right' },
    input: {
        height: '38px', padding: '0 12px', borderRadius: '8px',
        border: '1px solid #D1D5DB', fontSize: '14px', color: '#111827',
        background: '#F9FAFB', outline: 'none', width: '100%', boxSizing: 'border-box',
    },
    textarea: {
        padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB',
        fontSize: '14px', color: '#111827', background: '#F9FAFB', outline: 'none',
        width: '100%', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5,
    },
    select: {
        height: '38px', padding: '0 12px', borderRadius: '8px',
        border: '1px solid #D1D5DB', fontSize: '14px', color: '#111827',
        background: '#F9FAFB', outline: 'none', width: '100%',
        cursor: 'pointer', boxSizing: 'border-box',
    },
    row: { display: 'flex', gap: '16px' },
    fileTypeRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    ftOption: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '8px 18px', borderRadius: '8px', border: '1.5px solid #E5E7EB',
        background: '#F9FAFB', cursor: 'pointer', minWidth: '64px',
    },
    ftOptionActive: { borderColor: '#3B82F6', background: '#EFF6FF' },
    ftLabel: { fontSize: '13px', color: '#374151', fontWeight: 500 },
    uploadBox: {
        border: '1.5px dashed #D1D5DB', borderRadius: '8px',
        padding: '20px', cursor: 'pointer', background: '#F9FAFB',
    },
    uploadBoxActive: { borderColor: '#3B82F6', background: '#EFF6FF' },
    uploadEmpty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
    uploadArrow: { fontSize: '24px', color: '#9CA3AF' },
    fileInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
    fileName: { fontSize: '14px', fontWeight: 500, color: '#111827', margin: 0 },
    fileSize: { fontSize: '12px', color: '#6B7280', margin: 0 },
    removeBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '16px', color: '#9CA3AF', padding: '4px',
    },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    btnPrimary: {
        height: '40px', padding: '0 24px', borderRadius: '8px',
        background: '#3B82F6', color: '#FFFFFF', border: 'none',
        fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    },
    btnSecondary: {
        height: '40px', padding: '0 20px', borderRadius: '8px',
        background: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB',
        fontSize: '14px', fontWeight: 500, cursor: 'pointer',
    },
    btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
};

export default CreateTemplateForm;