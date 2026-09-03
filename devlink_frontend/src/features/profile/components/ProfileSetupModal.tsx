import { useState } from 'react';
import '../../../../public/css/ProfileSetupModal.css';
import { userProfileApi } from '../../../api/user-service/userProfileApi';
import { universityApi, type UniversityDto } from '../../../api/user-service/universityApi';
import type { ProgrammingLanguage, UpdateProfileRequest } from '../../../types/profile.types';
import { useEffect } from 'react';

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
    initialFullName?: string;
}

export default function ProfileSetupModal({ onClose, nudgeSentCount = 0, avatarUrl, initialFullName = '' }: Props) {
    const [step, setStep] = useState<Step>(1);
    const [fullName, setFullName] = useState(initialFullName);
    const [bio, setBio] = useState('');
    const [school, setSchool] = useState('');
    const [major, setMajor] = useState('');
    const [selectedLangs, setSelectedLangs] = useState<ProgrammingLanguage[]>([]);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [uniResults, setUniResults] = useState<UniversityDto[]>([]);
    const [showUniDropdown, setShowUniDropdown] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
             try {
                 const res = await universityApi.search(school || '');
                 setUniResults(res.data.data);
             } catch (e) { console.error(e); }
        }, 300);
        return () => clearTimeout(timer);
    }, [school]);

    const handleSelectUni = (uni: UniversityDto) => {
        setSchool(uni.name);
        setShowUniDropdown(false);
    };

    const handleUniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSchool(e.target.value);
        setShowUniDropdown(true);
    };

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
        onClose();

        const processUpdate = async () => {
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
            } catch (err: unknown) {
                console.error('Update profile in background failed:', err);
            }
        };

        processUpdate();
    };

    return (
        <div className="psu-overlay">
            <div className="psu-modal">

                <div className="psu-top">
                    <div className="psu-bar">
                        <div className={`psu-seg ${step >= 1 ? 'done' : ''}`} />
                        <div className={`psu-seg ${step >= 2 ? 'done' : 'idle'}`} />
                    </div>
                    <p className="psu-hint">Step {step} / 2</p>
                    <h3 className="psu-title">
                        {step === 1 ? 'Complete your profile' : 'Favorite programming languages'}
                    </h3>
                    <p className="psu-sub">
                        {step === 1
                            ? 'Add info to easily connect with other developers'
                            : 'Choose the languages you use most'}
                    </p>
                </div>

                <div className="psu-body">
                    {error && <div className="psu-error">{error}</div>}

                    {step === 1 && (
                        <>
                            {(!avatarUrl && nudgeSentCount === 0) && (
                                <div className="psu-field psu-avatar-upload">
                                    <label>Avatar</label>
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
                                <label htmlFor="psu-fullname">Display name</label>
                                <input
                                    id="psu-fullname"
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="psu-field">
                                <label htmlFor="psu-bio">Short bio</label>
                                <textarea
                                    id="psu-bio"
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    placeholder="I'm a backend dev, love Spring Boot and Kafka..."
                                    rows={3}
                                />
                            </div>
                            <div className="psu-row">
                                <div className="psu-field">
                                    <label htmlFor="psu-school">School / Organization</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            id="psu-school"
                                            type="text"
                                            value={school}
                                            onChange={handleUniChange}
                                            onFocus={() => setShowUniDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowUniDropdown(false), 200)}
                                            placeholder="Ho Chi Minh City University of Technology"
                                            autoComplete="off"
                                            autoCorrect="off"
                                            spellCheck="false"
                                        />
                                        {showUniDropdown && uniResults.length > 0 && (
                                            <div className="psu-dropdown" style={{
                                                position: 'absolute', top: '100%', left: 0, right: 0,
                                                background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', maxHeight: '150px',
                                                overflowY: 'auto', zIndex: 50, marginTop: '4px'
                                            }}>
                                                {uniResults.map(u => (
                                                    <div key={u.name} onMouseDown={() => handleSelectUni(u)}
                                                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {u.logo ? (
                                                            <img src={u.logo} alt="logo" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: '4px', flexShrink: 0 }} />
                                                        ) : (
                                                            <div style={{ width: 24, height: 24, backgroundColor: '#E5E7EB', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#6B7280', flexShrink: 0 }}>
                                                                🏫
                                                            </div>
                                                        )}
                                                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                            <strong style={{ color: '#111827', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</strong>
                                                            {u.country && <span style={{ color: '#6B7280', fontSize: '12px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.country}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="psu-field">
                                    <label htmlFor="psu-major">Major</label>
                                    <input
                                        id="psu-major"
                                        type="text"
                                        value={major}
                                        onChange={e => setMajor(e.target.value)}
                                        placeholder="Software Engineering"
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
                        {step === 2 ? '← Back' : 'Skip'}
                    </button>
                    <button type="button" className="psu-btn-primary" onClick={handleNext} disabled={loading}>
                        {loading ? 'Saving...' : step === 1 ? 'Next' : 'Complete'}
                    </button>
                </div>
            </div>
        </div>
    );
}