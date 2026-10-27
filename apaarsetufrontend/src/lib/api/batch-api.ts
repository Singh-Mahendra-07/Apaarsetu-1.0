import { apiClient } from './api-client';
import {
  BatchResponseDTO,
  BatchDetailDTO,
  BatchErrorDTO,
  BatchRevalidateRequestDTO,
  PagedResponse,
} from '@/types/api';

export const batchApi = {
  // Download official sample CSV template
  async downloadTemplate(): Promise<Blob> {
    return apiClient.downloadBlob('/batches/template');
  },

  // Upload student enrollment batch (CSV or XLSX)
  async uploadBatch(file: File, academicYear: string = '2026-27', programCode: string = 'CS101'): Promise<BatchResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('academicYear', academicYear);
    formData.append('programCode', programCode);
    return apiClient.upload<BatchResponseDTO>('/batches/upload', formData);
  },

  // List batches submitted for the institution
  async getBatches(params?: {
    page?: number;
    size?: number;
  }): Promise<PagedResponse<BatchResponseDTO>> {
    return apiClient.get<PagedResponse<BatchResponseDTO>>('/batches', params);
  },

  // Get single batch detail
  async getBatchById(batchId: string): Promise<BatchDetailDTO> {
    return apiClient.get<BatchDetailDTO>(`/batches/${batchId}`);
  },

  // List validation error rows for spreadsheet correction
  async getBatchErrors(
    batchId: string,
    params?: { page?: number; size?: number }
  ): Promise<BatchErrorDTO[]> {
    const res = await apiClient.get<BatchErrorDTO[] | PagedResponse<BatchErrorDTO>>(`/batches/${batchId}/errors`, params);
    if (Array.isArray(res)) return res;
    return (res as PagedResponse<BatchErrorDTO>)?.content || [];
  },

  // Approve & finalize validated batch (Institution Admin exclusive)
  async approveBatch(batchId: string): Promise<BatchResponseDTO> {
    return apiClient.post<BatchResponseDTO>(`/batches/${batchId}/approve`);
  },

  // Reject batch submission (Institution Admin exclusive)
  async rejectBatch(batchId: string, reason?: string): Promise<BatchResponseDTO> {
    return apiClient.post<BatchResponseDTO>(`/batches/${batchId}/reject`, reason ? { reason } : {});
  },

  // Get student records for audit inspection (Audit Desk)
  async getBatchRecords(batchId: string): Promise<{ row: number; studentName: string; apaarId: string; seatCategory: string }[]> {
    return apiClient.get<{ row: number; studentName: string; apaarId: string; seatCategory: string }[]>(`/batches/${batchId}/records`);
  },

  // Resubmit corrected rows for revalidation
  async revalidateBatch(
    batchId: string,
    payload: BatchRevalidateRequestDTO
  ): Promise<BatchResponseDTO> {
    return apiClient.post<BatchResponseDTO>(`/batches/${batchId}/revalidate`, payload);
  },
};
