import { apiClient } from './api-client';
import {
  VerifiedCredentialDTO,
  ManualVerificationRequest,
  VerificationToken,
} from '@/types/api';

export const verificationApi = {
  // Scan and verify cryptographic QR code payload (Public / Verifier)
  async verifyQr(payload: string): Promise<VerifiedCredentialDTO> {
    return apiClient.get<VerifiedCredentialDTO>(`/verify/qr/${encodeURIComponent(payload)}`);
  },

  // Manual APAAR ID verification lookup with DPDP consent reference
  async verifyManual(request: ManualVerificationRequest): Promise<VerifiedCredentialDTO> {
    return apiClient.post<VerifiedCredentialDTO>('/verify/manual', request);
  },

  // Retrieve verifier verification history
  async getHistory(): Promise<VerificationToken[]> {
    return apiClient.get<VerificationToken[]>('/verify/history');
  },
};
