import axiosInstance from '../axiosInstance';
import type { VideoFeedPageResponse, VideoFeedResponse } from '../../types/video.types';

export const videoFeedApi = {
    getShortVideos: (page = 0, size = 10) =>
        axiosInstance.get<{ data: VideoFeedPageResponse }>(
            '/api/videos/short',
            { params: { page, size } }
        ),

    getLongVideos: (page = 0, size = 10) =>
        axiosInstance.get<{ data: VideoFeedPageResponse }>(
            '/api/videos/long',
            { params: { page, size } }
        ),

    getVideoDetail: (id: number) =>
        axiosInstance.get<{ data: VideoFeedResponse }>(
            `/api/videos/${id}`
        ),
};
