import axiosInstance from '../axiosInstance';

export interface UniversityDto {
    name: string;
    logo?: string;
    domains: string[];
    web_pages: string[];
    country: string;
    alpha_two_code: string;
    'state-province': string;
}

export interface University {
    id: number;
    name: string;
    logo?: string;
    description?: string;
    domain: string;
    website: string;
    country: string;
    alphaTwoCode: string;
    stateProvince: string;
}

export interface UniversityResponse {
    name: string;
    logo?: string;
    description?: string;
    domains: string[];
    webPages: string[];
    country: string;
    alphaTwoCode: string;
    stateProvince: string;
    images: string[];
}

export const universityApi = {
    search: (keyword: string) =>
        axiosInstance.get<{data: UniversityDto[]}>('/api/users/universities/search', { params: { keyword } }),

    select: (name: string) =>
        axiosInstance.post<{data: University}>('/api/users/universities/select', { name }),
        
    getByName: (name: string) =>
        axiosInstance.get<{data: UniversityResponse}>('/api/users/universities/name', { params: { name } }),
};
