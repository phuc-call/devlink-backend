import axiosInstance from '../axiosInstance';
import type {
    CreateGroupRequest,
    GroupResponse,
    GroupSearchPageResponse,
    InviteCodeGroupRequest,
    UpdateGroupRequest,
    GroupMemberResponse,
    GroupCandidateResponse,
    PageResponse
} from '../../types/group.types';
import type { UserSearchResponse } from '../../types/profile.types';

export const groupApi = {
    createGroup: (data: CreateGroupRequest) =>
        axiosInstance.post<{ data: GroupResponse }>('/api/v1/groups', data),

    uploadCoverImage: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return axiosInstance.post<{ data: string }>('/api/v1/groups/cover-image', formData);
    },

    searchGroups: (name: string, page: number = 0, size: number = 20) =>
        axiosInstance.get<{ data: GroupSearchPageResponse }>('/api/v1/groups/search', {
            params: { name, page, size }
        }),

    getMyGroups: (role?: string, page: number = 0, size: number = 20) =>
        axiosInstance.get<{ data: GroupSearchPageResponse }>('/api/v1/groups/my-groups', {
            params: { role, page, size }
        }),


    getRecommendedGroups: (page: number = 0, size: number = 20) =>
        axiosInstance.get<{ data: GroupSearchPageResponse }>('/api/v1/groups/recommend', {
            params: { page, size }
        }),

    joinGroup: (groupId: number) =>
        axiosInstance.post<{ data: null }>(`/api/v1/groups/${groupId}/join`),

    joinGroupByCode: (data: InviteCodeGroupRequest) =>
        axiosInstance.post<{ data: string }>('/api/v1/groups/join-by-code', data),

    createNewInviteCode: (groupId: number, data: InviteCodeGroupRequest) =>
        axiosInstance.post<{ data: string }>(`/api/v1/groups/${groupId}/new-invite-code`, data),

    updateGroup: (groupId: number, data: UpdateGroupRequest) =>
        axiosInstance.put<{ data: GroupResponse }>(`/api/v1/groups/${groupId}`, data),

    leaveGroup: (groupId: number) =>
        axiosInstance.post<{ data: null }>(`/api/v1/groups/${groupId}/leave`),

    leaveAdminGroup: (groupId: number, newAdminId?: number) =>
        axiosInstance.post<{ data: null }>(`/api/v1/groups/${groupId}/leave-admin`, null, {
            params: { newAdminId }
        }),

    kickMember: (groupId: number, memberId: number) =>
        axiosInstance.delete<{ data: null }>(`/api/v1/groups/${groupId}/members/${memberId}`),

    approveMember: (groupId: number, memberId: number) =>
        axiosInstance.post<{ data: null }>(`/api/v1/groups/${groupId}/members/${memberId}/approve`),

    rejectMember: (groupId: number, memberId: number) =>
        axiosInstance.post<{ data: null }>(`/api/v1/groups/${groupId}/members/${memberId}/reject`),

    getPendingMembers: (groupId: number, page: number = 0, size: number = 20) =>
        axiosInstance.get<{ data: PageResponse<UserSearchResponse> }>(`/api/v1/groups/${groupId}/pending-members`, {
            params: { page, size }
        }),

    getGroupMembers: (groupId: number, page: number = 0, size: number = 20) =>
        axiosInstance.get<{ data: PageResponse<GroupMemberResponse> }>(`/api/v1/groups/${groupId}/members`, {
            params: { page, size }
        }),

    getReplacementCandidates: (groupId: number, page: number = 0, size: number = 20) =>
        axiosInstance.get<{ data: PageResponse<GroupCandidateResponse> }>(`/api/v1/groups/${groupId}/replacement-candidates`, {
            params: { page, size }
        }),

    getGroupById: (groupId: number) =>
        axiosInstance.get<{ data: GroupResponse }>(`/api/v1/groups/${groupId}`),

    getGroupBasicInfo: (groupId: number) =>
        axiosInstance.get<{ data: { id: number; name: string; coverImage: string; } }>(`/api/v1/groups/${groupId}/basic`),
};
