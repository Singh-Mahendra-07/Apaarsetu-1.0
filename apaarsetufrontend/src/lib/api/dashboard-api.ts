import { apiClient } from './api-client';
import {
  NationalDashboardDTO,
  InstitutionDashboardDTO,
  CapacityViolationDTO,
  AnomalyDTO,
  FlagDetailDTO,
  FlagResolveDTO,
  PagedResponse,
  AuditLog,
} from '@/types/api';

export const dashboardApi = {
  // National Dashboard KPI & Ranking (AICTE Admin/Officer)
  async getNational(params?: {
    academicYear?: string;
    state?: string;
    type?: string;
  }): Promise<NationalDashboardDTO> {
    return apiClient.get<NationalDashboardDTO>('/dashboard/national', params);
  },

  // Institution Dashboard KPI & Intake Progress (Institution Admin/Operator)
  async getInstitution(academicYear?: string): Promise<InstitutionDashboardDTO> {
    return apiClient.get<InstitutionDashboardDTO>('/dashboard/institution', {
      academicYear,
    });
  },

  // Capacity Violations List
  async getCapacityViolations(params?: {
    academicYear?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<CapacityViolationDTO>> {
    return apiClient.get<PagedResponse<CapacityViolationDTO>>('/dashboard/capacity-violations', params);
  },

  // Anomalies Monitor
  async getAnomalies(params?: {
    severity?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<AnomalyDTO>> {
    return apiClient.get<PagedResponse<AnomalyDTO>>('/dashboard/anomalies', params);
  },

  // List dispute / duplicate flags
  async getFlags(params?: {
    page?: number;
    size?: number;
  }): Promise<PagedResponse<FlagDetailDTO>> {
    return apiClient.get<PagedResponse<FlagDetailDTO>>('/flags', params);
  },

  // Get flag detail by ID
  async getFlagDetail(flagId: string): Promise<FlagDetailDTO> {
    return apiClient.get<FlagDetailDTO>(`/flags/${flagId}`);
  },

  // Adjudicate / Resolve flag (AICTE Officer exclusive)
  async resolveFlag(flagId: string, payload: FlagResolveDTO): Promise<string> {
    return apiClient.put<string>(`/flags/${flagId}/resolve`, payload);
  },

  // System-wide Audit Logs (AICTE Admin exclusive)
  async getAuditLogs(params?: {
    page?: number;
    size?: number;
  }): Promise<PagedResponse<AuditLog>> {
    return apiClient.get<PagedResponse<AuditLog>>('/audit-logs', params);
  },

  // Specific student audit trail
  async getStudentAuditLogs(
    studentId: string,
    params?: { page?: number; size?: number }
  ): Promise<PagedResponse<AuditLog>> {
    return apiClient.get<PagedResponse<AuditLog>>(`/audit-logs/student/${studentId}`, params);
  },

  // Export analytical CSV report
  async exportReport(reportType: 'ENROLLMENT' | 'CAPACITY' | 'DISCREPANCY'): Promise<Blob> {
    return apiClient.downloadBlob('/reports/export', { reportType });
  },
};
