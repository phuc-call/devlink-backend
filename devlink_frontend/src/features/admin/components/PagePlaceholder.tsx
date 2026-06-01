
interface SectionPlaceholderProps {
    title: string;
    description: string;
    height?: number | string;
    icon?: React.ReactNode;
    tag?: string;
}

export function SectionPlaceholder({ title, description, height = 200, icon, tag }: Readonly<SectionPlaceholderProps>) {
    return (
        <div style={{
            height,
            border: '2px dashed #E5E7EB',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FAFAFA',
            gap: 8,
            padding: 16,
            textAlign: 'center',
        }}>
            {icon && <div style={{ color: '#D1D5DB', marginBottom: 4 }}>{icon}</div>}
            {tag && (
                <span style={{
                    background: '#EFF6FF', color: '#3B82F6',
                    fontSize: 11, fontWeight: 600,
                    padding: '2px 8px', borderRadius: 9999,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                }}>
                    {tag}
                </span>
            )}
            <div style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>{title}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', maxWidth: 300, lineHeight: 1.5 }}>{description}</div>
        </div>
    );
}

interface PagePlaceholderProps {
    pageTitle: string;
    pageDescription: string;
    sections: SectionPlaceholderProps[];
    layout?: 'single' | 'two-col' | 'three-col';
}

export function PagePlaceholder({ pageTitle, pageDescription, sections, layout = 'single' }: Readonly<PagePlaceholderProps>) {
    const gridStyle: React.CSSProperties = layout === 'two-col'
        ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }
        : layout === 'three-col'
            ? { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }
            : { display: 'flex', flexDirection: 'column', gap: 16 };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Page header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>{pageTitle}</h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>{pageDescription}</p>
            </div>

            {/* Sections */}
            <div style={gridStyle}>
                {sections.map((section) => (
                    <SectionPlaceholder key={section.title} {...section} />
                ))}
            </div>
        </div>
    );
}