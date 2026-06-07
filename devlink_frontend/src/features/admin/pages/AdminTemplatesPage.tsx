import { useState } from 'react';
import { BookOpen, Plus, X } from 'lucide-react';
import { SectionPlaceholder } from '../components/PagePlaceholder.tsx';
import CreateTemplateForm from '../components/CreateTemplateForm.tsx';
import TemplateList from '../components/TemplateList.tsx';
import SuggestionList from '../components/SuggestionList/SuggestionList.tsx';
import SuggestionDetailModal from '../components/SuggestionDetailModal/SuggestionDetailModal.tsx';

export default function AdminTemplatesPage() {
    const [showUploadModal, setShowUploadModal]     = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
    const [refreshKey, setRefreshKey]               = useState(0);

    const handleActionDone = () => setRefreshKey(k => k + 1);

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Template học tập</h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Upload, quản lý file học tập theo ngôn ngữ lập trình</p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    aria-label="Mở modal upload template mới"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        height: 40, padding: '0 20px', borderRadius: 8,
                        background: '#3B82F6', color: '#FFFFFF', border: 'none',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    <Plus size={16} aria-hidden="true" />
                    Upload Template mới
                </button>
            </div>

            {/* Danh sách template */}
            <TemplateList />

            {/* Bottom section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>

                {/* Đề xuất chờ duyệt — thay SectionPlaceholder */}
                <SuggestionList
                    key={refreshKey}
                    onSelect={id => setSelectedSuggestion(id)}
                />

                <SectionPlaceholder
                    tag="Chi tiết template"
                    title="Modal xem / chỉnh sửa template"
                    description="Hiển thị toàn bộ metadata, AI summary, extractedText, danh sách fork. Cho phép chỉnh sửa + upload file mới (3.11)."
                    height={200}
                    icon={<BookOpen size={24} aria-hidden="true" />}
                />
            </div>

            {/* Modal upload */}
            {showUploadModal && (
                <>
                    <button
                        type="button"
                        aria-label="Đóng modal"
                        onClick={() => setShowUploadModal(false)}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.45)',
                            border: 'none', cursor: 'default',
                            zIndex: 1000,
                        }}
                    />
                    <dialog
                        open
                        aria-label="Upload template mới"
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
                            aria-label="Đóng modal"
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

            {/* Modal chi tiết suggestion */}
            {selectedSuggestion !== null && (
                <SuggestionDetailModal
                    suggestionId={selectedSuggestion}
                    onClose={() => setSelectedSuggestion(null)}
                    onActionDone={handleActionDone}
                />
            )}
        </div>
    );
}