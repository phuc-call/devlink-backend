import { useState } from 'react';
import { BookOpen, Flag, Plus, X } from 'lucide-react';
import { SectionPlaceholder } from '../components/PagePlaceholder.tsx';
import CreateTemplateForm from '../components/CreateTemplateForm.tsx';

export default function AdminTemplatesPage() {
    const [showUploadModal, setShowUploadModal] = useState(false);

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Template hoc tap</h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Upload, quan ly file hoc tap theo ngon ngu lap trinh</p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    aria-label="Mo modal upload template moi"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        height: 40, padding: '0 20px', borderRadius: 8,
                        background: '#3B82F6', color: '#FFFFFF', border: 'none',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    <Plus size={16} aria-hidden="true" />
                    Upload Template moi
                </button>
            </div>

            {/* Filter */}
            <div style={{ marginTop: 16 }}>
                <SectionPlaceholder
                    tag="Thanh loc"
                    title="Loc template"
                    description="Filter theo: language, difficulty, fileType, status. Search theo title. Sort theo: viewCount, forkCount, createdAt."
                    height={80}
                />
            </div>

            {/* Danh sach */}
            <div style={{ marginTop: 16 }}>
                <SectionPlaceholder
                    tag="Grid / Table"
                    title="Danh sach template"
                    description="Card grid hoac table: thumbnail loai file | Title | Language | Difficulty | fileType | viewCount | forkCount | AI summary status | Status | Ngay tao | Hanh dong."
                    height={380}
                    icon={<BookOpen size={32} aria-hidden="true" />}
                />
            </div>

            {/* Bottom section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <SectionPlaceholder
                    tag="De xuat cho duyet (3.10)"
                    title="De xuat tu sinh vien"
                    description="List cac suggestion co status PENDING/REVIEWING. Nut Duyet APPROVED / Tu choi REJECTED + adminNote."
                    height={200}
                    icon={<Flag size={24} aria-hidden="true" />}
                />
                <SectionPlaceholder
                    tag="Chi tiet template"
                    title="Modal xem / chinh sua template"
                    description="Hien thi toan bo metadata, AI summary, extractedText, danh sach fork. Cho phep chinh sua + upload file moi (3.11)."
                    height={200}
                    icon={<BookOpen size={24} aria-hidden="true" />}
                />
            </div>

            {/* Modal Upload */}
            {showUploadModal && (
                <>
                    {/* Backdrop — button thực sự */}
                    <button
                        type="button"
                        aria-label="Dong modal"
                        onClick={() => setShowUploadModal(false)}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.45)',
                            border: 'none', cursor: 'default',
                            zIndex: 1000,
                        }}
                    />

                    {/* Dialog native */}
                    <dialog
                        open
                        aria-label="Upload template moi"
                        style={{
                            position: 'fixed',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            margin: 0, padding: 0, border: 'none',
                            borderRadius: 12, width: '100%', maxWidth: 720,
                            maxHeight: '90vh', overflowY: 'auto',
                            boxShadow: '0 20px 25px rgba(0,0,0,0.12)',
                            zIndex: 1001,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setShowUploadModal(false)}
                            aria-label="Dong modal"
                            style={{
                                position: 'absolute', top: 16, right: 16,
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#6B7280', padding: 4, borderRadius: 6,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <X size={20} aria-hidden="true" />
                        </button>

                        <CreateTemplateForm onSuccess={() => setShowUploadModal(false)} />
                    </dialog>
                </>
            )}

        </div>
    );
}