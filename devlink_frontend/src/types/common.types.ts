// src/types/common.types.ts
export interface PageResponse<T> {
    content: T[];
    pageNumber: number;
    pageSize: number;
    totalPage: number;
    totalElement: number;
    hasNext: boolean;
}

export interface BlockStatusResponse {
    blocked: boolean;
    message: string;
}

export interface BlockStatusResponse {
    blocked: boolean;
}