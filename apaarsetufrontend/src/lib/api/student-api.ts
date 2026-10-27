import { apiClient } from './api-client';
import {
  CreateStudentDTO,
  UpdateStudentDTO,
  StudentResponseDTO,
  StudentDetailDTO,
  StudentListDTO,
  PagedResponse,
} from '@/types/api';

export const studentApi = {
  // Create single student
  async createStudent(payload: CreateStudentDTO): Promise<StudentResponseDTO> {
    return apiClient.post<StudentResponseDTO>('/students', payload);
  },

  // List students with filters
  async getStudents(params?: {
    institutionId?: string;
    programCode?: string;
    academicYear?: string;
    validationStatus?: string;
    admissionStatus?: string;
    keyword?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<StudentListDTO>> {
    return apiClient.get<PagedResponse<StudentListDTO>>('/students', params);
  },

  // Get detailed student by ID
  async getStudentById(id: string): Promise<StudentDetailDTO> {
    return apiClient.get<StudentDetailDTO>(`/students/${id}`);
  },

  // Update student details
  async updateStudent(id: string, payload: UpdateStudentDTO): Promise<StudentResponseDTO> {
    return apiClient.put<StudentResponseDTO>(`/students/${id}`, payload);
  },

  // Search by exact 12-digit APAAR ID (AICTE Admin/Officer)
  async searchByApaarId(apaarId: string): Promise<StudentResponseDTO> {
    return apiClient.get<StudentResponseDTO>('/students/search', { apaarId });
  },

  // Upload dispute evidence document (PDF/PNG/JPG)
  async uploadEvidence(studentId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload<string>(`/students/${studentId}/evidence`, formData);
  },
};
