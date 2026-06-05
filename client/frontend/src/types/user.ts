export type UserRole = "hirer" | "vendor" | "admin";

export type StoredUser = {
  userID?: number;
  accountID?: number | null;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: UserRole;
};

export type CurrentUser = StoredUser;

export type UploadedDocumentMetadata = {
  fileName: string;
  mimeType: string;
  uploaded: boolean;
  base64Data: string;
};

export type ComplianceDocuments = {
  driverLicence: UploadedDocumentMetadata | null;
  insuranceCertificate: UploadedDocumentMetadata | null;
  applyingAsBusiness: boolean;
  abnNumber: string | null;
  businessRegistrationCertificate: UploadedDocumentMetadata | null;
};
