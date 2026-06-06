import apiClient from "./api";

export type DocumentRecord = {
  accountID: number;
  driverLicenceName: string | null;
  insuranceCertName: string | null;
  businessRegCertName: string | null;
  abnNo: string | null;
  isApplyAsBusiness: boolean;
};

type DocumentResponse = {
  message: string;
  documents: DocumentRecord;
  complianceScore: number;
};

export type DocumentField = "driverLicence" | "insuranceCert" | "businessRegCert";

export const documentApi = {
  getDocuments: (hireAccountID: number) =>
    apiClient.get<DocumentResponse>(`/documents/${hireAccountID}`),

  uploadDocument: (hireAccountID: number, field: DocumentField, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<DocumentResponse>(
      `/documents/${hireAccountID}/upload/${field}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  removeDocument: (hireAccountID: number, field: DocumentField) =>
    apiClient.delete<DocumentResponse>(
      `/documents/${hireAccountID}/remove/${field}`,
    ),

  downloadDocument: (hireAccountID: number, field: DocumentField) =>
    apiClient.get<Blob>(
      `/documents/${hireAccountID}/download/${field}`,
      { responseType: "blob" },
    ),

  updateAbn: (hireAccountID: number, abnNo: string | null) =>
    apiClient.patch<DocumentResponse>(`/documents/${hireAccountID}/abn`, { abnNo }),

  updateApplyAsBusiness: (hireAccountID: number, isApplyAsBusiness: boolean) =>
    apiClient.patch<DocumentResponse>(`/documents/${hireAccountID}/business`, {
      isApplyAsBusiness,
    }),
};