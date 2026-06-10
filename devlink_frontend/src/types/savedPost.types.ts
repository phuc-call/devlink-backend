import type { FeedPostResponse } from './post.types';

/** Response phân trang cho danh sách bài viết đã lưu */
export interface SavedPostPageResponse {
    content: FeedPostResponse[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: unknown[];
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    totalPages: number;
    totalElements: number;
    last: boolean;
    numberOfElements: number;
    size: number;
    number: number;
    sort: unknown[];
    first: boolean;
    empty: boolean;
}