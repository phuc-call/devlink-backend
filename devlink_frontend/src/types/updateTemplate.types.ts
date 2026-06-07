import type { TemplateResponse } from './template.types';

export interface UpdateTemplateRequest {
    title: string;
    description?: string;
    language: string;
    difficulty: string;   // BEGINNER | INTERMEDIATE | ADVANCED
    fileType: string;     // CODE | PDF | DOCX | XLSX | VIDEO
    tags?: string[];
    topics?: string[];
}

export interface UpdateTemplatePayload {
    templateId: number;
    request: UpdateTemplateRequest;
    file?: File;
}

export type UpdateTemplateResponse = TemplateResponse;