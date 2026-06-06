import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Documents } from "../entity/Documents";
import { HirerAccount } from "../entity/HirerAccount";

type FileField = "driverLicence" | "insuranceCert" | "businessRegCert";

const dataColumnMap: Record<FileField, "driverLicenceData" | "insuranceCertData" | "businessRegCertData"> = {
  driverLicence: "driverLicenceData",
  insuranceCert: "insuranceCertData",
  businessRegCert: "businessRegCertData",
};

const nameColumnMap: Record<FileField, "driverLicenceName" | "insuranceCertName" | "businessRegCertName"> = {
  driverLicence: "driverLicenceName",
  insuranceCert: "insuranceCertName",
  businessRegCert: "businessRegCertName",
};

const allowedFields: FileField[] = ["driverLicence", "insuranceCert", "businessRegCert"];

function toPositiveInt(value: unknown) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function calculateComplianceScore(doc: Documents): number {
  let score = 0;
  if (doc.driverLicenceData) score += 1;
  if (doc.insuranceCertData) score += 1;
  if (doc.businessRegCertData) score += 1;
  if (doc.abnNo) score += 1;
  if (doc.isApplyAsBusiness) score += 1;
  return score;
}

function mapDocuments(doc: Documents) {
  return {
    accountID: doc.accountID,
    driverLicenceName: doc.driverLicenceName ?? null,
    insuranceCertName: doc.insuranceCertName ?? null,
    businessRegCertName: doc.businessRegCertName ?? null,
    abnNo: doc.abnNo ?? null,
    isApplyAsBusiness: doc.isApplyAsBusiness,
  };
}

async function syncComplianceScore(hireAccountID: number, doc: Documents) {
  const hirerRepo = AppDataSource.getRepository(HirerAccount);
  const hirerAccount = await hirerRepo.findOneBy({ hireAccountID });
  if (hirerAccount) {
    hirerAccount.complianceScore = calculateComplianceScore(doc);
    await hirerRepo.save(hirerAccount);
  }
}

async function getOrCreateDoc(hireAccountID: number): Promise<Documents> {
  const docRepo = AppDataSource.getRepository(Documents);
  let doc = await docRepo.findOneBy({ accountID: hireAccountID });
  if (!doc) {
    doc = docRepo.create({
      accountID: hireAccountID,
      driverLicenceData: null,
      driverLicenceName: null,
      insuranceCertData: null,
      insuranceCertName: null,
      businessRegCertData: null,
      businessRegCertName: null,
      abnNo: null,
      isApplyAsBusiness: false,
    });
  }
  return doc;
}

// GET /documents/:hireAccountID
export async function getDocuments(req: Request, res: Response): Promise<void> {
  try {
    const hireAccountID = toPositiveInt(req.params.hireAccountID);
    if (!hireAccountID) {
      res.status(400).json({ message: "Invalid hireAccountID" });
      return;
    }

    const docRepo = AppDataSource.getRepository(Documents);
    const doc = await docRepo.findOneBy({ accountID: hireAccountID });

    if (!doc) {
      res.status(200).json({
        message: "No documents found",
        documents: {
          accountID: hireAccountID,
          driverLicenceName: null,
          insuranceCertName: null,
          businessRegCertName: null,
          abnNo: null,
          isApplyAsBusiness: false,
        },
        complianceScore: 0,
      });
      return;
    }

    res.status(200).json({
      message: "Documents retrieved successfully",
      documents: mapDocuments(doc),
      complianceScore: calculateComplianceScore(doc),
    });
  } catch (error) {
    console.error("Get documents failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

// POST /documents/:hireAccountID/upload/:field
export async function uploadDocument(req: Request, res: Response): Promise<void> {
  try {
    const hireAccountID = toPositiveInt(req.params.hireAccountID);
    const field = req.params.field as FileField;

    if (!hireAccountID) {
      res.status(400).json({ message: "Invalid hireAccountID" });
      return;
    }

    if (!allowedFields.includes(field)) {
      res.status(400).json({ message: "Invalid document field" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const hirerRepo = AppDataSource.getRepository(HirerAccount);
    const hirerAccount = await hirerRepo.findOneBy({ hireAccountID });
    if (!hirerAccount) {
      res.status(404).json({ message: "Hirer account not found" });
      return;
    }

    const docRepo = AppDataSource.getRepository(Documents);
    const doc = await getOrCreateDoc(hireAccountID);

    doc[dataColumnMap[field]] = req.file.buffer;
    doc[nameColumnMap[field]] = req.file.originalname;

    const saved = await docRepo.save(doc);
    await syncComplianceScore(hireAccountID, saved);

    res.status(200).json({
      message: "Document uploaded successfully",
      documents: mapDocuments(saved),
      complianceScore: calculateComplianceScore(saved),
    });
  } catch (error) {
    console.error("Upload document failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

// DELETE /documents/:hireAccountID/remove/:field
export async function removeDocument(req: Request, res: Response): Promise<void> {
  try {
    const hireAccountID = toPositiveInt(req.params.hireAccountID);
    const field = req.params.field as FileField;

    if (!hireAccountID) {
      res.status(400).json({ message: "Invalid hireAccountID" });
      return;
    }

    if (!allowedFields.includes(field)) {
      res.status(400).json({ message: "Invalid document field" });
      return;
    }

    const docRepo = AppDataSource.getRepository(Documents);
    const doc = await docRepo.findOneBy({ accountID: hireAccountID });

    if (!doc || !doc[dataColumnMap[field]]) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    doc[dataColumnMap[field]] = null;
    doc[nameColumnMap[field]] = null;

    const saved = await docRepo.save(doc);
    await syncComplianceScore(hireAccountID, saved);

    res.status(200).json({
      message: "Document removed successfully",
      documents: mapDocuments(saved),
      complianceScore: calculateComplianceScore(saved),
    });
  } catch (error) {
    console.error("Remove document failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

// GET /documents/:hireAccountID/download/:field
export async function downloadDocument(req: Request, res: Response): Promise<void> {
  try {
    const hireAccountID = toPositiveInt(req.params.hireAccountID);
    const field = req.params.field as FileField;

    if (!hireAccountID) {
      res.status(400).json({ message: "Invalid hireAccountID" });
      return;
    }

    if (!allowedFields.includes(field)) {
      res.status(400).json({ message: "Invalid document field" });
      return;
    }

    const docRepo = AppDataSource.getRepository(Documents);
    const doc = await docRepo.findOneBy({ accountID: hireAccountID });

    if (!doc || !doc[dataColumnMap[field]]) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    const fileBuffer = doc[dataColumnMap[field]] as Buffer;
    const fileName = doc[nameColumnMap[field]] ?? "document";

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(fileBuffer);
  } catch (error) {
    console.error("Download document failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

// PATCH /documents/:hireAccountID/abn
export async function updateAbn(req: Request, res: Response): Promise<void> {
  try {
    const hireAccountID = toPositiveInt(req.params.hireAccountID);
    if (!hireAccountID) {
      res.status(400).json({ message: "Invalid hireAccountID" });
      return;
    }

    const abnNo = typeof req.body.abnNo === "string" ? req.body.abnNo.trim() : null;

    const hirerRepo = AppDataSource.getRepository(HirerAccount);
    const hirerAccount = await hirerRepo.findOneBy({ hireAccountID });
    if (!hirerAccount) {
      res.status(404).json({ message: "Hirer account not found" });
      return;
    }

    const docRepo = AppDataSource.getRepository(Documents);
    const doc = await getOrCreateDoc(hireAccountID);
    doc.abnNo = abnNo || null;

    const saved = await docRepo.save(doc);
    await syncComplianceScore(hireAccountID, saved);

    res.status(200).json({
      message: "ABN updated successfully",
      documents: mapDocuments(saved),
      complianceScore: calculateComplianceScore(saved),
    });
  } catch (error) {
    console.error("Update ABN failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

// PATCH /documents/:hireAccountID/business
export async function updateApplyAsBusiness(req: Request, res: Response): Promise<void> {
  try {
    const hireAccountID = toPositiveInt(req.params.hireAccountID);
    if (!hireAccountID) {
      res.status(400).json({ message: "Invalid hireAccountID" });
      return;
    }

    const isApplyAsBusiness =
      req.body.isApplyAsBusiness === true || req.body.isApplyAsBusiness === 1;

    const hirerRepo = AppDataSource.getRepository(HirerAccount);
    const hirerAccount = await hirerRepo.findOneBy({ hireAccountID });
    if (!hirerAccount) {
      res.status(404).json({ message: "Hirer account not found" });
      return;
    }

    const docRepo = AppDataSource.getRepository(Documents);
    const doc = await getOrCreateDoc(hireAccountID);
    doc.isApplyAsBusiness = isApplyAsBusiness;

    const saved = await docRepo.save(doc);
    await syncComplianceScore(hireAccountID, saved);

    res.status(200).json({
      message: "Business status updated successfully",
      documents: mapDocuments(saved),
      complianceScore: calculateComplianceScore(saved),
    });
  } catch (error) {
    console.error("Update business status failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}