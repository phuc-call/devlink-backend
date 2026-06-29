import {useState} from 'react';
import '../../../../public/css/ProfileSetupModal.css';
import {userProfileApi} from '../../../api/user-service/userProfileApi';
import type {ProgrammingLanguage, UpdateProfileRequest} from '../../../types/profile.types';

const LANGUAGES: ProgrammingLanguage[] = [
    'JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'GO', 'CSHARP', 'PHP'
];

const LANG_LABELS: Record<ProgrammingLanguage, string> = {
    JAVASCRIPT: 'JavaScript', TYPESCRIPT: 'TypeScript', PYTHON: 'Python',
    JAVA: 'Java', GO: 'Go', CSHARP: 'C#', PHP: 'PHP',
    RUST: 'Rust', CPP: 'C++', KOTLIN: 'Kotlin', SWIFT: 'Swift', RUBY: 'Ruby'
};

type Step = 1 | 2;

interface Props {
    onClose: () => void;
    nudgeSentCount?: number;
    avatarUrl?: string;
}

export default function ProfileSetupModal({onClose, nudgeSentCount = 0, avatarUrl}: Props) {
    const [step, setStep] = useState<Step>(1);
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [school, setSchool] = useState('');
    const [major, setMajor] = useState('');
    const [selectedLangs, setSelectedLangs] = useState<ProgrammingLanguage[]>([]);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const toggleLang = (lang: ProgrammingLanguage) => {
        setSelectedLangs(prev =>
            prev.includes(lang)
                ? prev.filter(l => l !== lang)
                : [...prev, lang]
        );
    };

    const handleSkip = async () => {
        if (step === 2) {
            setStep(1);
            return;
        }
        try {
            await userProfileApi.dismissNudge(false);
        } catch {
            // bỏ qua lỗi, vẫn đóng modal
        }
        onClose();
    };

    const handleNext = async () => {
        if (step === 1) {
            setError('');
            setStep(2);
            return;
        }
        setLoading(true);
        setError('');
        try {
            if (avatarFile) {
                const formData = new FormData();
                formData.append('file', avatarFile);
                await userProfileApi.updateAvatar(formData);
            }

            const payload: UpdateProfileRequest = {
                fullName,
                bio: bio || undefined,
                school: school || undefined,
                major: major || undefined,
                favoriteLanguage: selectedLangs.length > 0 ? selectedLangs : undefined,
            };
            await userProfileApi.updateProfile(payload);
            onClose();
        } catch (err: unknown) {
            const e = err as {response?: {data?: {message?: string}}};
            setError(e.response?.data?.message ?? 'Cập nhật thất bại, thử lại nhé');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="psu-overlay">
            <div className="psu-modal">

                <div className="psu-top">
                    <div className="psu-bar">
                        <div className={`psu-seg ${step >= 1 ? 'done' : ''}`}/>
                        <div className={`psu-seg ${step >= 2 ? 'done' : 'idle'}`}/>
                    </div>
                    <p className="psu-hint">Bước {step} / 2</p>
                    <h3 className="psu-title">
                        {step === 1 ? 'Hoàn thiện hồ sơ của bạn' : 'Ngôn ngữ lập trình yêu thích'}
                    </h3>
                    <p className="psu-sub">
                        {step === 1
                            ? 'Thêm thông tin để dễ kết nối với lập trình viên khác'
                            : 'Chọn ngôn ngữ bạn hay dùng nhất'}
                    </p>
                </div>

                <div className="psu-body">
                    {error && <div className="psu-error">{error}</div>}

                    {step === 1 && (
                        <>
                            {(!avatarUrl && nudgeSentCount === 0) && (
                                <div className="psu-field psu-avatar-upload">
                                    <label>Ảnh đại diện</label>
                                    <div className="psu-avatar-preview" onClick={() => document.getElementById('psu-avatar-input')?.click()}>
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar Preview" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                <span style={{ fontSize: '24px', color: '#999' }}>+</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        id="psu-avatar-input"
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setAvatarFile(file);
                                                setAvatarPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                </div>
                            )}
                            <div className="psu-field">
                                <label htmlFor="psu-fullname">Tên hiển thị</label>
                                <input
                                    id="psu-fullname"
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                            <div className="psu-field">
                                <label htmlFor="psu-bio">Giới thiệu ngắn</label>
                                <textarea
                                    id="psu-bio"
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    placeholder="Mình là backend dev, thích Spring Boot và Kafka..."
                                    rows={3}
                                />
                            </div>
                            <div className="psu-row">
                                <div className="psu-field">
                                    <label htmlFor="psu-school">Trường / Tổ chức</label>
                                    <input
                                        id="psu-school"
                                        type="text"
                                        value={school}
                                        onChange={e => setSchool(e.target.value)}
                                        placeholder="Đại học Bách Khoa TP.HCM"
                                    />
                                </div>
                                <div className="psu-field">
                                    <label htmlFor="psu-major">Chuyên ngành</label>
                                    <input
                                        id="psu-major"
                                        type="text"
                                        value={major}
                                        onChange={e => setMajor(e.target.value)}
                                        placeholder="Kỹ thuật phần mềm"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div className="psu-chips">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang}
                                    type="button"
                                    className={`psu-chip ${selectedLangs.includes(lang) ? 'on' : ''}`}
                                    onClick={() => toggleLang(lang)}
                                >
                                    {LANG_LABELS[lang]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="psu-footer">
                    <button type="button" className="psu-btn-skip" onClick={handleSkip} disabled={loading}>
                        {step === 2 ? '← Quay lại' : 'Bỏ qua'}
                    </button>
                    <button type="button" className="psu-btn-primary" onClick={handleNext} disabled={loading}>
                        {loading ? 'Đang lưu...' : step === 1 ? 'Tiếp theo →' : 'Hoàn tất'}
                    </button>
                </div>
            </div>
        </div>
    );
}