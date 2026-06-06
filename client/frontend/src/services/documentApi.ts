import apiClient from "./api";

export type DocumentRecord = {
  accountID: number;
  driverLicence: string | null;
  insuranceCert: string | null;
  businessRegCert: string | null;
  abnNo: string | null;
  isApplyAsBusiness: boolean;
};

type DocumentResponse = {
  message: string;
  documents: DocumentRecord;
  complianceScore: number;
};

export const documentApi = {
  getDocuments: (hireAccountID: number) =>
    apiClient.get<DocumentResponse>(`/documents/${hireAccountID}`),

  uploadDocument: (
    hireAccountID: number,
    field: "driverLicence" | "insuranceCert" | "businessRegCert",
    file: File,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<DocumentResponse>(
      `/documents/${hireAccountID}/upload/${field}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  removeDocument: (
    hireAccountID: number,
    field: "driverLicence" | "insuranceCert" | "businessRegCert",
  ) =>
    apiClient.delete<DocumentResponse>(
      `/documents/${hireAccountID}/remove/${field}`,
    ),

  updateAbn: (hireAccountID: number, abnNo: string | null) =>
    apiClient.patch<DocumentResponse>(`/documents/${hireAccountID}/abn`, { abnNo }),

  updateApplyAsBusiness: (hireAccountID: number, isApplyAsBusiness: boolean) =>
    apiClient.patch<DocumentResponse>(`/documents/${hireAccountID}/business`, {
      isApplyAsBusiness,
    }),
};