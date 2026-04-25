export const FONT = {
    family: "'Inter', sans-serif",
    size: {
        display: "32px",
        h1: "24px",
        h2: "20px",
        h3: "18px",
        h4: "16px",
        bodyLg: "16px",
        body: "14px",
        bodySm: "13px",
        caption: "12px",
        xs: "11px",
    },
    weight: {
        light: 300,
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
} as const;

export const COLOR = {
    primary: {
        50: "#EFF6FF",
        100: "#DBEAFE",
        200: "#BFDBFE",
        500: "#3B82F6",
        600: "#2563EB",
        700: "#1D4ED8",
    },
    neutral: {
        0: "#FFFFFF",
        50: "#F9FAFB",
        100: "#F3F4F6",
        200: "#E5E7EB",
        300: "#D1D5DB",
        400: "#9CA3AF",
        500: "#6B7280",
        600: "#4B5563",
        700: "#374151",
        800: "#1F2937",
        900: "#111827",
    },
    success: {50: "#F0FDF4", 500: "#22C55E", 600: "#16A34A"},
    error: {50: "#FEF2F2", 500: "#EF4444", 600: "#DC2626"},
    warning: {50: "#FFFBEB", 500: "#F59E0B"},
    info: {50: "#EFF6FF", 500: "#3B82F6"},
    bg: {
        app: "#F0F2F5",
        card: "#FFFFFF",
        input: "#F3F4F6",
    },
    text: {
        primary: "#111827",
        secondary: "#6B7280",
        disabled: "#9CA3AF",
        link: "#3B82F6",
        white: "#FFFFFF",
    },
} as const;

export const SPACING = {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
} as const;

export const RADIUS = {
    none: "0px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
} as const;

export const SHADOW = {
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 4px 6px rgba(0,0,0,0.07)",
    lg: "0 10px 15px rgba(0,0,0,0.10)",
    xl: "0 20px 25px rgba(0,0,0,0.12)",
} as const;

export const LAYOUT = {
    headerHeight: "60px",
    sidebarLeftWidth: "280px",
    sidebarRightWidth: "320px",
    feedMaxWidth: "680px",
    containerMaxWidth: "1200px",
} as const;

export const BREAKPOINT = {
    mobile: "640px",
    tablet: "1024px",
    desktop: "1280px",
} as const;