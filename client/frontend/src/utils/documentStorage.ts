import type { ComplianceDocuments } from "@/types/user";

const DOCUMENTS_KEY = "hirer_compliance_documents";

export function getStoredDocuments(email: string): ComplianceDocuments | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(`${DOCUMENTS_KEY}:${email}`);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ComplianceDocuments;
  } catch {
    return null;
  }
}

export function saveDocuments(email: string, documents: ComplianceDocuments) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${DOCUMENTS_KEY}:${email}`, JSON.stringify(documents));
}