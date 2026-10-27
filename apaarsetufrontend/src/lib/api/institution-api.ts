import { apiClient } from './api-client';
import {
  InstitutionResponseDTO,
  CreateInstitutionDTO,
  UpdateIntakeDTO,
  ApiKeyResponseDTO,
  ErpApiKeyDTO,
  PagedResponse,
} from '@/types/api';

export const institutionApi = {
  // Register new institution (AICTE Admin exclusive)
  async createInstitution(payload: CreateInstitutionDTO): Promise<InstitutionResponseDTO> {
    return apiClient.post<InstitutionResponseDTO>('/institutions', payload);
  },

  // List all registered institutions across India
  async getInstitutions(params?: {
    state?: string;
    type?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<InstitutionResponseDTO>> {
    return apiClient.get<PagedResponse<InstitutionResponseDTO>>('/institutions', params);
  },

  // Fetch full institution profile
  async getInstitutionById(id: string): Promise<InstitutionResponseDTO> {
    return apiClient.get<InstitutionResponseDTO>(`/institutions/${id}`);
  },

  // Update institution metadata (AICTE Admin exclusive)
  async updateInstitution(id: string, payload: Partial<CreateInstitutionDTO>): Promise<InstitutionResponseDTO> {
    return apiClient.put<InstitutionResponseDTO>(`/institutions/${id}`, payload);
  },

  // Update approved regular & supernumerary seat limits (AICTE Admin exclusive)
  async updateIntake(id: string, payload: UpdateIntakeDTO): Promise<InstitutionResponseDTO> {
    return apiClient.put<InstitutionResponseDTO>(`/institutions/${id}/intake`, payload);
  },

  // List ERP API keys (Institution Admin exclusive)
  async getApiKeys(institutionId: string): Promise<ErpApiKeyDTO[]> {
    return apiClient.get<ErpApiKeyDTO[]>(`/institutions/${institutionId}/api-keys`);
  },

  // Generate new ERP API key (Institution Admin exclusive)
  async createApiKey(institutionId: string, label: string): Promise<ApiKeyResponseDTO> {
    return apiClient.post<ApiKeyResponseDTO>(`/institutions/${institutionId}/api-keys`, { label });
  },

  // Revoke ERP API key (Institution Admin exclusive)
  async revokeApiKey(institutionId: string, keyId: string): Promise<string> {
    return apiClient.delete<string>(`/institutions/${institutionId}/api-keys/${keyId}`);
  },
};
