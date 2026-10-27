import { apiClient } from './api-client';
import { EnumItemDTO } from '@/types/api';

export const enumApi = {
  getAdmissionStatuses(): Promise<EnumItemDTO[]> {
    return apiClient.get<EnumItemDTO[]>('/enums/admission-statuses');
  },
  getValidationStatuses(): Promise<EnumItemDTO[]> {
    return apiClient.get<EnumItemDTO[]>('/enums/validation-statuses');
  },
  getSeatCategories(): Promise<EnumItemDTO[]> {
    return apiClient.get<EnumItemDTO[]>('/enums/seat-categories');
  },
  getInstitutionTypes(): Promise<EnumItemDTO[]> {
    return apiClient.get<EnumItemDTO[]>('/enums/institution-types');
  },
  getCertificateTypes(): Promise<EnumItemDTO[]> {
    return apiClient.get<EnumItemDTO[]>('/enums/certificate-types');
  },
  getEntranceExams(): Promise<EnumItemDTO[]> {
    return apiClient.get<EnumItemDTO[]>('/enums/entrance-exams');
  },
};
