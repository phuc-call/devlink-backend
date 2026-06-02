export interface CreateTemplateRequest {
    title: string;
    description?: string;
    language: string;
    difficulty: string;
    fileType: string;
    tags?: string[];
    topics?: string[];
}

export interface TemplateResponse {
    id: number;
    title: string;
    description?: string;
    language: string;
    difficulty: string;
    fileType: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    aiSummary?: string;
    tags?: string[];
    topics?: string[];
    viewCount: number;
    forkCount: number;
    status: string;
    createdBy: number;
    createdAt: string;
}

export interface TemplateMetaOptions {
    difficultly: string[];
    fileType: string[];
}

export interface LanguageOptions {
    languages: string[];
}

export interface MyTemplateResponse extends TemplateResponse {
    isFork: boolean;
}

export interface MyTemplateListResponse {
    content: MyTemplateResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hint: string | null;
}

export interface GetMyTemplatesParams {
    page?: number;
    size?: number;
    difficulty?: string;
    tag?: string;
}

export interface TemplateCardResponse {
    id: number;
    title: string;
    language: string;
    difficulty: string;   // BEGINNER | INTERMEDIATE | ADVANCED
    fileType: string;     // CODE | PDF | DOCX | XLSX | VIDEO
    fileUrl: string;
    fileName: string;
    aiSummary: string | null;
    viewCount: number;
    forkCount: number;
    status: string;       // ACTIVE | HIDDEN | DELETED
    createdAt: string;    // ISO string
    isFork: boolean;
}

export interface AdminTemplateListResponse {
    content: TemplateCardResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hint: string | null;
}

export interface GetAdminTemplatesParams {
    page?: number;
    size?: number;
    difficulty?: string;
    tag?: string;
}

export interface TemplateDetailResponse {
    id: number;
    title: string;
    description: string | null;
    language: string;
    difficulty: string;   // từ meta API — BEGINNER | INTERMEDIATE | ADVANCED
    fileType: string;     // từ meta API — CODE | PDF | DOCX | XLSX | VIDEO
    fileUrl: string;
    fileName: string;
    fileSize: number;
    content: string | null;
    aiSummary: string | null;
    tags: string;         // JSON string "[\"oop\"]" — parse khi dùng
    topics: string;       // JSON string "[\"d\"]"   — parse khi dùng
    viewCount: number;
    forkCount: number;
    createdBy: number;    // userId — dùng để fetch name/avatar
    createdAt: string;
    updatedAt: string;
    forkInfo: null | unknown;
    status?: string;
}

/** Author info fetch từ /internal/users/{id}/name */
export interface TemplateAuthorInfo {
    userName: string;
    avatar: string | null;
}
