import axiosInstance from '../axiosInstance';
import type { CreateReportRequest, ReportResponse } from '../../types/report.types';

const BASE_URL = '/api/posts/reports';

export const reportApi = {
    report(req: CreateReportRequest) {
        return axiosInstance.post<{ data: ReportResponse }>(BASE_URL, req);
    },
};