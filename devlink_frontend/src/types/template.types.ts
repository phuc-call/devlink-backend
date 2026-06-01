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