import {useState, useEffect} from 'react';
import {userProfileApi} from '../../../../api/user-service/userProfileApi';
import type {
    UserProfileResponse,
    UpdateProfileRequest,
    ProgrammingLanguage,
    ProfileVisibility,
    VisibilitySettingResponse,
} from '../../../../types/profile.types';
import styles from './EditProfilePanel.module.css';

interface Props {
    profile: UserProfileResponse | null;
    onDone: (updated: UserProfileResponse) => void;
    onCancel: () => void;
}

type Section = 'basic' | 'language' | 'follow' | 'visibility';

const PROGRAMMING_LANGUAGES: ProgrammingLanguage[] = [
    'JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'GO',
    'RUST', 'CPP', 'CSHARP', 'KOTLIN', 'SWIFT', 'PHP', 'RUBY',
];

const LANG_LABELS: Record<ProgrammingLanguage, string> = {
    JAVASCRIPT: 'JavaScript', TYPESCRIPT: 'TypeScript', PYTHON: 'Python',
    JAVA: 'Java', GO: 'Go', RUST: 'Rust', CPP: 'C++', CSHARP: 'C#',
    KOTLIN: 'Kotlin', SWIFT: 'Swift', PHP: 'PHP', RUBY: 'Ruby',
};

const LANG_COLORS: Record<ProgrammingLanguage, string> = {
    JAVASCRIPT: '#F7DF1E', TYPESCRIPT: '#3178C6', PYTHON: '#3572A5',
    JAVA: '#B07219', GO: '#00ADD8', RUST: '#DEA584', CPP: '#F34B7D',
    CSHARP: '#178600', KOTLIN: '#A97BFF', SWIFT: '#F05138',
    PHP: '#4F5D95', RUBY: '#701516',
};

const MENU_ITEMS: { key: Section; label: string; icon: string; desc: string }[] = [
    {key: 'basic', label: 'Thông tin cơ bản', icon: '👤', desc: 'Tên, bio, trường, ngành, vị trí'},
    {key: 'language', label: 'Ngôn ngữ lập trình', icon: '💻', desc: 'Chọn tối đa 3 ngôn ngữ yêu thích'},
    {key: 'follow', label: 'Chế độ theo dõi', icon: '🔒', desc: 'Duyệt follow thủ công hay tự động'},
    {key: 'visibility', label: 'Chế độ hiển thị', icon: '👁️', desc: 'Kiểm soát ai có thể xem hồ sơ của bạn'},
];

export default function EditProfilePanel({profile, onDone, onCancel}: Props) {
    const [section, setSection] = useState<Section>('basic');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const [basic, setBasic] = useState<UpdateProfileRequest>({
        fullName: profile?.fullName ?? '',
        bio: profile?.bio ?? '',
        school: profile?.school ?? '',
        major: profile?.major ?? '',
        city: profile?.city ?? '',
        countryCode: profile?.country ?? '',
        timezone: profile?.timezone ?? '',
    });

    const [followLoading, setFollowLoading] = useState(false);
    const [followMode, setFollowMode] = useState<boolean | null>(null);

    const [langs, setLangs] = useState<ProgrammingLanguage[]>(
        profile?.favoriteLanguage ?? []
    );

    const [visibilityLoading, setVisibilityLoading] = useState(false);
    const [visibilitySetting, setVisibilitySetting] = useState<VisibilitySettingResponse | null>(null);
    const [selectedVisibility, setSelectedVisibility] = useState<ProfileVisibility | null>(null);

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({msg, type});
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (section !== 'follow') return;
        const fetchFollow = async () => {
            setFollowLoading(true);
            try {
                const res = await userProfileApi.getFollowRequestMode();
                setFollowMode(res.data.data.followRequestMode);
            } catch {
                showToast('Không thể tải trạng thái follow', 'error');
            } finally {
                setFollowLoading(false);
            }
        };
        fetchFollow();
    }, [section]);

    useEffect(() => {
        if (section !== 'visibility') return;
        const fetchVisibility = async () => {
            setVisibilityLoading(true);
            try {
                const res = await userProfileApi.getVisibilitySetting();
                setVisibilitySetting(res.data.data);
                setSelectedVisibility(res.data.data.current);
            } catch {
                showToast('Không thể tải cài đặt hiển thị', 'error');
            } finally {
                setVisibilityLoading(false);
            }
        };
        fetchVisibility();
    }, [section]);

    const handleSaveBasic = async () => {
        setSaving(true);
        try {
            const payload: UpdateProfileRequest = {};
            if (basic.fullName) payload.fullName = basic.fullName;
            if (basic.bio) payload.bio = basic.bio;
            if (basic.school) payload.school = basic.school;
            if (basic.major) payload.major = basic.major;
            if (basic.city) payload.city = basic.city;
            if (basic.countryCode) payload.countryCode = basic.countryCode;
            if (basic.timezone) payload.timezone = basic.timezone;

            const res = await userProfileApi.updateProfile(payload);
            showToast('Cập nhật thành công!', 'success');
            setTimeout(() => onDone(res.data.data), 1200);
        } catch {
            showToast('Có lỗi xảy ra, thử lại!', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveLanguage = async () => {
        setSaving(true);
        try {
            const res = await userProfileApi.updateProfile({favoriteLanguage: langs});
            showToast('Cập nhật ngôn ngữ thành công!', 'success');
            setTimeout(() => onDone(res.data.data), 1200);
        } catch {
            showToast('Có lỗi xảy ra, thử lại!', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveFollow = async () => {
        setSaving(true);
        try {
            await userProfileApi.updateFollowRequestMode(followMode ?? false);
            showToast('Cập nhật chế độ follow thành công!', 'success');
            setTimeout(() => onCancel(), 1200);
        } catch {
            showToast('Có lỗi xảy ra, thử lại!', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveVisibility = async () => {
        if (!selectedVisibility) return;
        setSaving(true);
        try {
            const res = await userProfileApi.updateVisibilitySetting(selectedVisibility);
            showToast(res.data.message ?? 'Cập nhật thành công!', 'success');
            setTimeout(() => onCancel(), 1200);
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            showToast(err.response?.data?.message ?? 'Có lỗi xảy ra, thử lại!', 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleLang = (lang: ProgrammingLanguage) =>
        setLangs(prev =>
            prev.includes(lang)
                ? prev.filter(l => l !== lang)
                : prev.length < 3 ? [...prev, lang] : prev
        );

    const setBasicField = (key: keyof UpdateProfileRequest, value: string) =>
        setBasic(b => ({...b, [key]: value}));

    const renderBasic = () => (
        <div className={styles.formWrap}>
            <div className={styles.formTitle}>
                <span>Thông tin cơ bản</span>
                <p className={styles.formSub}>Cập nhật thông tin hiển thị trên hồ sơ của bạn</p>
            </div>

            {([
                {key: 'fullName', label: 'Họ và tên', placeholder: 'Nguyễn Văn A'},
                {key: 'bio', label: 'Giới thiệu', placeholder: 'Một vài câu về bạn...'},
                {key: 'school', label: 'Trường học', placeholder: 'Đại học Bách Khoa'},
                {key: 'major', label: 'Chuyên ngành', placeholder: 'Công nghệ thông tin'},
                {key: 'city', label: 'Thành phố', placeholder: 'Hồ Chí Minh'},
                {key: 'countryCode', label: 'Mã quốc gia', placeholder: 'VN'},
                {key: 'timezone', label: 'Múi giờ', placeholder: 'Asia/Ho_Chi_Minh'},
            ] as { key: keyof UpdateProfileRequest; label: string; placeholder: string }[]).map(({
                                                                                                     key,
                                                                                                     label,
                                                                                                     placeholder
                                                                                                 }) => (
                <div key={key} className={styles.field}>
                    <label className={styles.label}>{label}</label>
                    {key === 'bio' ? (
                        <textarea
                            className={styles.textarea}
                            placeholder={placeholder}
                            value={(basic[key] as string) ?? ''}
                            onChange={e => setBasicField(key, e.target.value)}
                            rows={3}
                        />
                    ) : (
                        <input
                            className={styles.input}
                            placeholder={placeholder}
                            value={(basic[key] as string) ?? ''}
                            onChange={e => setBasicField(key, e.target.value)}
                            maxLength={key === 'countryCode' ? 5 : undefined}
                        />
                    )}
                </div>
            ))}

            <div className={styles.actions}>
                <button className={styles.btnCancel} onClick={onCancel}>Hủy</button>
                <button className={styles.btnSave} onClick={handleSaveBasic} disabled={saving}>
                    {saving ? <span className={styles.spinner}/> : 'Lưu thay đổi'}
                </button>
            </div>
        </div>
    );

    const renderLanguage = () => (
        <div className={styles.formWrap}>
            <div className={styles.formTitle}>
                <span>Ngôn ngữ lập trình yêu thích</span>
                <p className={styles.formSub}>Chọn tối đa 3 ngôn ngữ — hiển thị nổi bật trên hồ sơ</p>
            </div>

            <div className={styles.langGrid}>
                {PROGRAMMING_LANGUAGES.map(lang => {
                    const selected = langs.includes(lang);
                    const disabled = !selected && langs.length >= 3;
                    return (
                        <button
                            key={lang}
                            className={`${styles.langChip} ${selected ? styles.langSelected : ''} ${disabled ? styles.langDisabled : ''}`}
                            onClick={() => toggleLang(lang)}
                            disabled={disabled}
                            style={selected ? {
                                borderColor: LANG_COLORS[lang],
                                backgroundColor: LANG_COLORS[lang] + '18'
                            } : {}}
                        >
                            <span className={styles.langDot} style={{background: LANG_COLORS[lang]}}/>
                            {LANG_LABELS[lang]}
                            {selected && <span className={styles.langCheck}>✓</span>}
                        </button>
                    );
                })}
            </div>

            <p className={styles.langCount}>Đã chọn: {langs.length}/2</p>

            <div className={styles.actions}>
                <button className={styles.btnCancel} onClick={onCancel}>Hủy</button>
                <button className={styles.btnSave} onClick={handleSaveLanguage} disabled={saving}>
                    {saving ? <span className={styles.spinner}/> : 'Lưu ngôn ngữ'}
                </button>
            </div>
        </div>
    );

    const renderFollow = () => (
        <div className={styles.formWrap}>
            <div className={styles.formTitle}>
                <span>Chế độ theo dõi</span>
                <p className={styles.formSub}>Kiểm soát ai có thể theo dõi bạn</p>
            </div>

            {followLoading || followMode === null ? (
                <div className={styles.loadingWrap}>
                    <span className={styles.spinner}/>
                </div>
            ) : (
                <div className={styles.followCards}>
                    {([
                        {
                            value: false,
                            icon: '🌍',
                            title: 'Tự động chấp nhận',
                            desc: 'Mọi người có thể follow bạn ngay lập tức, không cần duyệt'
                        },
                        {
                            value: true,
                            icon: '🔒',
                            title: 'Duyệt thủ công',
                            desc: 'Bạn sẽ xem xét và chấp nhận từng yêu cầu theo dõi'
                        },
                    ] as { value: boolean; icon: string; title: string; desc: string }[]).map(opt => (
                        <button
                            key={String(opt.value)}
                            className={`${styles.followCard} ${followMode === opt.value ? styles.followCardActive : ''}`}
                            onClick={() => setFollowMode(opt.value)}
                        >
                            <div className={styles.followCardIcon}>{opt.icon}</div>
                            <div className={styles.followCardContent}>
                                <strong>{opt.title}</strong>
                                <p>{opt.desc}</p>
                            </div>
                            {followMode === opt.value && <span className={styles.followCheck}>✓</span>}
                        </button>
                    ))}
                </div>
            )}

            <div className={styles.actions}>
                <button className={styles.btnCancel} onClick={onCancel}>Hủy</button>
                <button className={styles.btnSave} onClick={handleSaveFollow}
                        disabled={saving || followLoading || followMode === null}>
                    {saving ? <span className={styles.spinner}/> : 'Lưu cài đặt'}
                </button>
            </div>
        </div>
    );

    const renderVisibility = () => (
        <div className={styles.formWrap}>
            <div className={styles.formTitle}>
                <span>Chế độ hiển thị hồ sơ</span>
                <p className={styles.formSub}>Kiểm soát ai có thể xem thông tin của bạn</p>
            </div>

            {visibilityLoading || !visibilitySetting ? (
                <div className={styles.loadingWrap}>
                    <span className={styles.spinner}/>
                </div>
            ) : (
                <div className={styles.followCards}>
                    {visibilitySetting.options.map(opt => (
                        <button
                            key={opt}
                            className={`${styles.followCard} ${selectedVisibility === opt ? styles.followCardActive : ''}`}
                            onClick={() => setSelectedVisibility(opt)}
                        >
                            <div className={styles.followCardIcon}>
                                {opt === 'PUBLIC' ? '🌍' : opt === 'PROTECTED' ? '🤝' : '🔒'}
                            </div>
                            <div className={styles.followCardContent}>
                                <strong>
                                    {opt === 'PUBLIC' ? 'Công khai' : opt === 'PROTECTED' ? 'Bạn chung' : 'Riêng tư'}
                                </strong>
                                <p>
                                    {opt === 'PUBLIC'
                                        ? 'Tất cả mọi người đều có thể xem hồ sơ của bạn'
                                        : opt === 'PROTECTED'
                                            ? 'Chỉ những người follow nhau mới xem được'
                                            : 'Chỉ bạn mới xem được hồ sơ của mình'}
                                </p>
                            </div>
                            {selectedVisibility === opt && <span className={styles.followCheck}>✓</span>}
                        </button>
                    ))}
                </div>
            )}

            <div className={styles.actions}>
                <button className={styles.btnCancel} onClick={onCancel}>Hủy</button>
                <button className={styles.btnSave} onClick={handleSaveVisibility}
                        disabled={saving || visibilityLoading || !selectedVisibility}>
                    {saving ? <span className={styles.spinner}/> : 'Lưu cài đặt'}
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (section) {
            case 'basic':
                return renderBasic();
            case 'language':
                return renderLanguage();
            case 'follow':
                return renderFollow();
            case 'visibility':
                return renderVisibility();
        }
    };

    return (
        <div className={styles.panel}>
            {toast && (
                <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
                    {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
                </div>
            )}

            <nav className={styles.menu}>
                <div className={styles.menuHeader}>
                    <button className={styles.backBtn} onClick={onCancel}>← Quay lại</button>
                    <span className={styles.menuTitle}>sửa hồ sơ</span>
                </div>

                {MENU_ITEMS.map(item => (
                    <button
                        key={item.key}
                        className={`${styles.menuItem} ${section === item.key ? styles.menuItemActive : ''}`}
                        onClick={() => setSection(item.key)}
                    >
                        <span className={styles.menuIcon}>{item.icon}</span>
                        <div className={styles.menuItemText}>
                            <span className={styles.menuItemLabel}>{item.label}</span>
                            <span className={styles.menuItemDesc}>{item.desc}</span>
                        </div>
                        {section === item.key && <span className={styles.menuArrow}>›</span>}
                    </button>
                ))}
            </nav>

            <div className={styles.content}>
                {renderContent()}
            </div>
        </div>
    );
}