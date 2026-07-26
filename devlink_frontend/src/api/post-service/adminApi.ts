import axiosInstance from '../axiosInstance';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TagGroupResponse {
  id: number;
  name: string;
  description: string | null;
  tags: string[];
  autoAssignable: boolean;
  matchKeyword: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  assignedUserCount: number;
}

export interface TagGroupRequest {
  name: string;
  description?: string;
  tags: string[];
  autoAssignable?: boolean;
  matchKeyword?: string;
}

export interface AssignTagGroupRequest {
  userIds: number[];
  tagGroupIds: number[];
}

export interface AdminUserResponse {
  userId: number;
  userName: string;
  avatarUrl: string | null;
  interestCount: number;
  topInterests: string[];
  lastActivity: string | null;
  viewedPostCount: number | null;
}

export interface AdminUserDetailResponse {
  userId: number;
  userName: string;
  avatarUrl: string | null;
  interests: UserInterestItem[];
  tagGroups: AssignedTagGroupItem[];
  viewedPostCount: number;
  totalInteractions: number;
  lastActivity: string | null;
}

export interface UserInterestItem {
  tag: string;
  score: number;
  lastInteractedAt: string | null;
}

export interface AssignedTagGroupItem {
  groupId: number;
  groupName: string;
  tags: string[];
  assignmentType: string;
  assignedAt: string;
}

export interface UserInterestSummary {
  id: number;
  tag: string;
  score: number;
  lastInteractedAt: string | null;
}

export interface AdminOverview {
  totalUsers: number;
  totalTagGroups: number;
  totalInterestRecords: number;
  totalPostViews: number;
  topTags: { tag: string; count: number }[];
}

export interface MediaItem {
  id: number;
  postId: number;
  mediaType: 'IMAGE' | 'VIDEO' | 'FILE';
  url: string;
  thumbnailUrl: string | null;
  originalName: string;
  fileExtension: string | null;
  fileSize: number | null;
  orderIndex: number;
}

export interface PostLinkItem {
  postId: number;
  url: string;
  label: string | null;
}

export interface PagedResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface TagWithCount {
  tag: string;
  count: number;
}

export interface ProposedGroupResponse {
  suggestedName: string;
  suggestedKeyword: string;
  tags: string[];
  tagCount: number;
}

// ─── Tag Group API ────────────────────────────────────────────────────────────

export const tagGroupApi = {
  list: (search?: string, page = 0, size = 20) =>
    axiosInstance.get<{ data: PagedResult<TagGroupResponse> }>('/api/posts/admin/tag-groups', {
      params: { search, page, size },
    }),

  get: (id: number) =>
    axiosInstance.get<{ data: TagGroupResponse }>(`/api/posts/admin/tag-groups/${id}`),

  create: (data: TagGroupRequest) =>
    axiosInstance.post<{ data: TagGroupResponse }>('/api/posts/admin/tag-groups', data),

  createGroupByKeyword: (keyword: string) =>
    axiosInstance.post<{ data: TagGroupResponse }>('/api/posts/admin/tag-groups/by-keyword', null, {
      params: { keyword },
    }),

  /** Analyze post_tags, cluster by prefix, returns proposed groups (nothing saved yet) */
  suggestGroups: () =>
    axiosInstance.get<{ data: ProposedGroupResponse[] }>('/api/posts/admin/tag-groups/suggest'),

  /** Save admin-reviewed proposed groups + immediately bulk-assign to users */
  confirmSuggestions: (groups: TagGroupRequest[]) =>
    axiosInstance.post<{ data: number }>('/api/posts/admin/tag-groups/confirm-suggestions', groups),

  getPopularTags: () =>
    axiosInstance.get<{ data: string[] }>('/api/posts/admin/tag-groups/tags/popular'),

  getPopularTagsWithCount: () =>
    axiosInstance.get<{ data: TagWithCount[] }>('/api/posts/admin/tag-groups/tags/popular-with-count'),

  searchTags: (keyword: string) =>
    axiosInstance.get<{ data: string[] }>('/api/posts/admin/tag-groups/tags/search', { params: { keyword } }),

  getRanking: (page = 0, size = 5) =>
    axiosInstance.get<{ data: PagedResult<TagGroupResponse> }>('/api/posts/admin/tag-groups/ranking', { params: { page, size } }),

  update: (id: number, data: TagGroupRequest) =>
    axiosInstance.put<{ data: TagGroupResponse }>(`/api/posts/admin/tag-groups/${id}`, data),

  delete: (id: number) =>
    axiosInstance.delete(`/api/posts/admin/tag-groups/${id}`),

  assignGroups: (data: AssignTagGroupRequest) =>
    axiosInstance.post('/api/posts/admin/tag-groups/assign', data),

};

// ─── Admin User API ───────────────────────────────────────────────────────────

export const adminUserApi = {
  listUsers: (search?: string, page = 0, size = 20) =>
    axiosInstance.get<{ data: PagedResult<AdminUserResponse> }>('/api/posts/admin/users', {
      params: { search, page, size },
    }),

  getOverview: () =>
    axiosInstance.get<{ data: AdminOverview }>('/api/posts/admin/users/overview'),

  getDetail: (userId: number) =>
    axiosInstance.get<{ data: AdminUserDetailResponse }>(`/api/posts/admin/users/${userId}`),

  getInterests: (userId: number, page = 0, size = 20) =>
    axiosInstance.get<{ data: PagedResult<UserInterestSummary> }>(`/api/posts/admin/users/${userId}/interests`, {
      params: { page, size },
    }),

  addInterests: (userId: number, tags: string[], score = 10.0) =>
    axiosInstance.post(`/api/posts/admin/users/${userId}/interests`, { tags, score }),

  removeInterest: (userId: number, tag: string) =>
    axiosInstance.delete(`/api/posts/admin/users/${userId}/interests/${tag}`),

  clearInterests: (userId: number) =>
    axiosInstance.delete(`/api/posts/admin/users/${userId}/interests`),

  getViewedPosts: (userId: number, page = 0, size = 10) =>
    axiosInstance.get(`/api/posts/admin/users/${userId}/viewed-posts`, { params: { page, size } }),

  getViewedImages: (userId: number, page = 0, size = 20) =>
    axiosInstance.get<{ data: PagedResult<MediaItem> }>(`/api/posts/admin/users/${userId}/viewed-images`, {
      params: { page, size },
    }),

  getViewedVideos: (userId: number, page = 0, size = 10) =>
    axiosInstance.get<{ data: PagedResult<MediaItem> }>(`/api/posts/admin/users/${userId}/viewed-videos`, {
      params: { page, size },
    }),

  getViewedFiles: (userId: number, page = 0, size = 10) =>
    axiosInstance.get<{ data: PagedResult<MediaItem> }>(`/api/posts/admin/users/${userId}/viewed-files`, {
      params: { page, size },
    }),

  getViewedLinks: (userId: number, page = 0, size = 10) =>
    axiosInstance.get<{ data: PagedResult<PostLinkItem> }>(`/api/posts/admin/users/${userId}/viewed-links`, {
      params: { page, size },
    }),
};
