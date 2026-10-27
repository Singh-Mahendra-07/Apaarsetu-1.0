/**
 * APAARSetu — Master TypeScript API Contracts
 * Fully typed to match the Spring Boot 3.2.5 REST backend models & DTOs
 */

// Generic API Envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  errorCode?: string;
  timestamp?: string;
}

// Spring Data Pageable Response
export interface PagedResponse<T> {
  content: T[];
  page?: number;
  pageNumber?: number;
  size?: number;
  pageSize?: number;
  totalElements: number;
  totalPages: number;
  last?: boolean;
}

// User Roles
export type UserRole =
  | 'ROLE_AICTE_ADMIN'
  | 'ROLE_AICTE_OFFICER'
  | 'ROLE_INSTITUTION_ADMIN'
  | 'ROLE_INSTITUTION_OPERATOR'
  | 'ROLE_AUTHORIZED_VERIFIER';

// User Profile
export interface UserProfileDTO {
  id?: string;
  userId?: string;
  employeeId?: string;
  email: string;
  fullName: string;
  role: UserRole;
  institutionId?: string;
  institutionName?: string;
  region?: string;
  phone?: string;
  photoUrl?: string | null;
  mfaEnabled?: boolean;
  lastLogin?: string;
  status?: string;
  requiresPasswordChange?: boolean;
}

// Authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  expiresInMs?: number;
  user: UserProfileDTO;
  mfaRequired?: boolean;
  requiresPasswordChange?: boolean;
  userId?: string;
  mfaToken?: string;
  mfaChallengeToken?: string;
}

export interface FirstTimePasswordResetRequest {
  newPassword: string;
  confirmPassword?: string;
}

export interface MfaVerifyRequest {
  userId: string;
  otpCode: string;
  challengeToken?: string;
  mfaToken?: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCodeUri: string;
}

export interface MfaEnableRequest {
  secret: string;
  code: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// National Dashboard (AICTE Admin & Officer)
export interface InstitutionDiscrepancyRankDTO {
  aicteId?: string;
  institutionId?: string;
  name?: string;
  institutionName?: string;
  state: string;
  totalReported: number;
  totalValidated?: number;
  actionRequired?: number;
  totalActionRequired?: number;
  discrepancyRate: number;
}

export interface NationalDashboardDTO {
  participatingInstitutions: number;
  totalReported: number;
  totalValidated: number;
  validationGapPercent: number;
  violationAlerts: number;
  duplicateQueueCount: number;
  topDiscrepancies?: InstitutionDiscrepancyRankDTO[];
  discrepancyTable?: InstitutionDiscrepancyRankDTO[];
}

// Institution Dashboard (Institution Admin & Operator)
export interface ProgramCapacityProgressDTO {
  programCode: string;
  programName: string;
  regularApproved: number;
  regularFilled: number;
  supernumeraryQuota?: Record<string, number>;
  supernumeraryFilled?: Record<string, number>;
  regularCapacityExceeded: boolean;
  regularFillRatePercent?: number;
}

export interface InstitutionDashboardDTO {
  institutionId: string;
  institutionName: string;
  academicYear: string;
  kpi: {
    totalApprovedIntake: number;
    totalRegularApproved?: number;
    totalSupernumeraryApproved?: number;
    totalUploaded: number;
    validated: number;
    actionRequired: number;
    pending: number;
    complianceRate: number;
  };
  programCapacities: ProgramCapacityProgressDTO[];
}

// Capacity Violations
export interface CapacityViolationDTO {
  institutionId: string;
  institutionName: string;
  programCode: string;
  programName: string;
  approvedRegular: number;
  admittedRegular: number;
  overflow: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  academicYear: string;
}

// Statistical Anomaly
export interface AnomalyDTO {
  id: string;
  type: string;
  institutionId?: string;
  institutionName?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  detectedAt: string;
  status: string;
}

// Dispute / Duplicate Flags
export interface FlagDetailDTO {
  id?: string;
  flagId?: string;
  flagType?: string;
  type?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  apaarId: string;
  studentId: string;
  studentName?: string;
  conflictingStudentId?: string;
  primaryInstitutionId?: string;
  institutionId?: string;
  primaryInstitutionName?: string;
  institutionName?: string;
  conflictingInstitutionId?: string;
  conflictingInstitutionName?: string;
  status?: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  resolution?: string;
  notes?: string;
  remarks?: string;
  createdAt?: string;
  raisedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface FlagResolveDTO {
  resolution: 'APPROVE_TRANSFER' | 'REJECT_DUPLICATE' | 'DISMISS_FLAG' | 'ALLOW_EXCEPTION';
  notes?: string;
  remarks?: string;
}

// Student Enums
export type ValidationStatus =
  | 'VALIDATED'
  | 'NEEDS_REVIEW'
  | 'INVALID_FORMAT'
  | 'REJECTED'
  | 'UNVERIFIED_PENDING';

export type AdmissionStatus =
  | 'ADMITTED_ACTIVE'
  | 'TRANSFERRED_OUT'
  | 'CANCELLED'
  | 'PROVISIONAL'
  | 'COMPLETED';

export type SeatCategory =
  | 'REGULAR_GENERAL'
  | 'REGULAR_RESERVED'
  | 'SUPERNUMERARY_TFW'
  | 'SUPERNUMERARY_EWS'
  | 'SUPERNUMERARY_NRI'
  | 'SUPERNUMERARY_OCI_FN'
  | 'SUPERNUMERARY_PMSSS';

export type AdmissionMode =
  | 'CENTRALIZED'
  | 'MANAGEMENT'
  | 'NRI_QUOTA'
  | 'TFW';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type Nationality = 'INDIAN' | 'NRI' | 'OCI' | 'FOREIGN_NATIONAL';
export type ReservationCategory = 'GENERAL' | 'OBC' | 'SC' | 'ST' | 'EWS';
export type VerificationPurpose = 'EMPLOYMENT' | 'HIGHER_EDUCATION' | 'SCHOLARSHIP' | 'REGULATORY_AUDIT';

export interface StudentListDTO {
  id: string;
  apaarId: string;
  fullName: string;
  institutionId?: string;
  programCode: string;
  academicYear?: string;
  validationStatus: ValidationStatus;
  admissionStatus: AdmissionStatus;
  seatCategory: SeatCategory;
  hasFlags?: boolean;
  flagCount?: number;
  createdAt?: string;
  uploadedAt?: string;
}

export interface StudentDetailDTO extends StudentListDTO {
  dateOfBirth?: string;
  gender?: Gender;
  category?: ReservationCategory;
  mobile?: string;
  email?: string;
  rollNumber?: string;
  admissionDate?: string;
  admissionMode?: AdmissionMode;
  disputeEvidenceUrl?: string;
  disputeEvidenceName?: string;
  validationRemarks?: string;
  flags?: FlagDetailDTO[];
}

export interface CreateStudentDTO {
  apaarId: string;
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  nationality: Nationality;
  programCode: string;
  academicYear: string;
  seatCategory: SeatCategory;
  admissionStatus: AdmissionStatus;
  admissionDate: string; // YYYY-MM-DD
  admissionMode?: AdmissionMode;
  reservationCategory?: ReservationCategory;
  contactEmail?: string;
  contactPhone?: string;
  aadhaarLastFour?: string;
}

export interface UpdateStudentDTO {
  fullName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  reservationCategory?: ReservationCategory;
  contactPhone?: string;
  contactEmail?: string;
  programCode?: string;
  seatCategory?: SeatCategory;
  admissionStatus?: AdmissionStatus;
}

export interface StudentResponseDTO {
  id: string;
  apaarId: string;
  fullName: string;
  institutionId: string;
  programCode: string;
  academicYear: string;
  validationStatus: ValidationStatus;
  validationRemarks?: string;
}

// Batch Ingestion
export type BatchStatus = 'UPLOADED' | 'PROCESSING' | 'VALIDATED' | 'FLAGGED' | 'FAILED' | 'APPROVED' | 'REJECTED';

export interface BatchSummary {
  totalRows: number;
  validatedCount: number;
  invalidFormatCount: number;
  anomalyFlagCount: number;
  duplicateCount: number;
  capacityOverflowCount: number;
}

export interface BatchResponseDTO {
  id: string;
  institutionId: string;
  fileName: string;
  academicYear: string;
  programCode?: string;
  status: BatchStatus;
  summary: BatchSummary;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  createdAt: string;
  completedAt?: string;
  validRecordsCount?: number;
  invalidRecordsCount?: number;
}

export interface BatchErrorDTO {
  rowNumber: number;
  apaarId?: string;
  studentName?: string;
  fieldName: string;
  invalidValue?: string;
  errorMessage: string;
  ruleCode: string;
  suggestedValue?: string;
}

export interface BatchDetailDTO {
  id?: string;
  institutionId?: string;
  academicYear?: string;
  programCode?: string;
  fileName?: string;
  status?: BatchStatus;
  summary?: BatchSummary;
  errors?: BatchErrorDTO[];
  batch?: BatchResponseDTO;
}

export interface BatchRevalidateRequestDTO {
  corrections: {
    rowNumber: number;
    studentName?: string;
    apaarId?: string;
    fieldName?: string;
    invalidValue?: string;
    correctedValue?: string;
    correctedData?: Record<string, string>;
  }[];
}

// Institution & ERP
export interface SupernumeraryQuota {
  nri: number;
  ociFn: number;
  tfw: number;
  ews: number;
  pmsss: number;
}

export interface ApprovedProgram {
  programCode: string;
  programName: string;
  level: string;
  duration: number;
  approvedIntake: number;
  academicYear: string;
  supernumeraryQuota: SupernumeraryQuota;
}

export type ApprovedProgramDTO = ApprovedProgram;
export type ProgramCapacityDTO = ProgramCapacityProgressDTO;

export interface ErpApiKeyDTO {
  keyId: string;
  label: string;
  createdAt: string;
  lastUsedAt?: string;
  active: boolean;
}

export interface ApiKeyResponseDTO {
  keyId: string;
  rawSecret?: string;
  rawApiKey?: string;
  label: string;
  createdAt: string;
  lastUsed?: string;
  active?: boolean;
}

export interface InstitutionResponseDTO {
  id: string;
  aicteId: string;
  name: string;
  type: string;
  state: string;
  city: string;
  zone: string;
  universityAffiliation: string;
  status: string;
  description?: string;
  headName?: string;
  headEmail?: string;
  headPhone?: string;
  headStatus?: string;
  nodalOfficerName?: string;
  nodalOfficerEmail?: string;
  nodalOfficerPhone?: string;
  nodalOfficerPrivileges?: string;
  approvedPrograms: ApprovedProgram[];
  erpApiKeys?: ErpApiKeyDTO[];
}

export interface CreateInstitutionDTO {
  aicteId: string;
  name: string;
  type: string;
  state: string;
  city: string;
  zone: string;
  universityAffiliation: string;
  approvedPrograms: ApprovedProgram[];
}

export interface UpdateIntakeDTO {
  programCode: string;
  academicYear: string;
  approvedIntake: number;
  supernumeraryQuota: SupernumeraryQuota;
}

// Verification Portal
export interface VerifiedCredentialDTO {
  maskedApaarId: string;
  studentName: string;
  institutionName: string;
  aicteCode: string;
  degree: string;
  branch: string;
  enrollmentStatus: string;
  admissionYear: string;
  completionYear: string;
  sealStatus: string;
  demographicMatchStatus?: string;
  demographicConfidence?: string;
  verifiedAt: string;
  certificateId: string;
  consentRef: string;
  purpose: string;
}

export interface ManualVerificationRequest {
  apaarId: string;
  purpose: VerificationPurpose;
  consentRef: string;
  candidateName?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface VerificationToken {
  id: string;
  apaarId: string;
  verifierId: string;
  verifiedAt: string;
  verificationMethod: 'QR' | 'MANUAL';
  purpose: string;
  status: string;
}

// Audit Logs
export interface AuditLog {
  id: string | { timestamp?: number; date?: string; [key: string]: unknown };
  action: string;
  actor: {
    userId: string;
    email: string;
    role: string;
  };
  target: {
    targetId: string;
    targetType: string;
  };
  clientIp?: string;
  userAgent?: string;
  timestamp: string;
  changes?: {
    fieldName: string;
    oldValue?: string;
    newValue?: string;
  }[];
}

// Reference Enum Item
export interface EnumItemDTO {
  value: string;
  label: string;
  badgeColor?: string;
}
