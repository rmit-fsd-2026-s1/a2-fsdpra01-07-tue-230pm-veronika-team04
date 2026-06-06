import { Button, HStack, Icon, Input, Separator } from "@chakra-ui/react";
import { Avatar } from "@/components/ui/avatar";
import { DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster";
import {
  FaChevronRight, FaEnvelope, FaInfo,FaLock, FaPhone, FaRegQuestionCircle, FaStar, FaCalendar
} from "react-icons/fa";

import Layout from "@/components/layout/Layout";
import React from "react";
import router from "next/router";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { profileApi } from "@/services/profileApi";

import { documentApi } from "@/services/documentApi";
import type { DocumentRecord } from "@/services/documentApi";

import type { UploadedDocumentMetadata } from "@/types/user";

type InfoRowProps = {
  icon: React.ElementType;
  label: string;
  value: string | string[];
  highlight?: boolean;
  isPassword?: boolean;
  onClick?: () => void;
};

// Peronsal Info table
function InfoRow({ icon, label, value, highlight, isPassword, onClick }: InfoRowProps) {
  const values = Array.isArray(value) ? value : [value];
  return (
    <div 
      onClick={onClick}
      className="flex items-start gap-4 px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer group">
      <Icon as={icon} className="mt-1 text-gray-500 shrink-0 w-5 h-5" />
      <div className="flex-1 min-w-0 flex flex-col">
        <span className={`text-sm font-semibold ${highlight ? "text-blue-600" : "text-gray-800"}`}>
          {label}
        </span>
        {values.map((v, i) => (
          <span key={i} className="text-sm text-gray-500 mt-0.5">
            {isPassword ? "••••••••" : (v || "Not set")}
          </span>
        ))}
      </div>
      <Icon as={FaChevronRight} className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
    </div>
  );
}

// My Document upload table
function DocUploadRow({ label, document, onUpload, onDelete }: {
  label: string;
  field: "driverLicence" | "insuranceCert" | "businessRegCert";
  document: UploadedDocumentMetadata | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
      document ? "border-emerald-400 bg-emerald-50" : "border-gray-200 bg-white"
    }`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        document ? "bg-emerald-100" : "bg-gray-100"}`}>
        <Icon as={FaRegQuestionCircle} color={document ? "green.600" : "gray.400"} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 truncate">
          {document ? document.fileName : "No file uploaded"}
        </p>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
        document ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
        {document ? "Uploaded" : "Not uploaded"}
      </span>
      <input ref={inputRef} type="file" accept="image/*,application/pdf"
        onChange={onUpload} className="hidden" />
      {document && (
        <button onClick={onDelete}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-red-600 hover:bg-red-50 flex-shrink-0">
          Remove
        </button>
      )}
      <button onClick={() => inputRef.current?.click()}
        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 flex-shrink-0">
        Upload
      </button>
    </div>
  );
}
// TODO: This is a bit hacky - Ideally should have an endpoint to fetch the user's uploaded documents instead of relying on localStorage.
// Change later to fetch from backend and store in context if needed across multiple pages

// const defaultDocs: ComplianceDocuments = {
//   driverLicence: null,
//   insuranceCertificate: null,
//   applyingAsBusiness: false,
//   abnNumber: null,
//   businessRegistrationCertificate: null,
// };

export default function UserProfile() {

  // Initialise the current user
  const { currentUser, isAuthReady, overrideCurrentUser } = useAuth();
  const displayName = currentUser?.name ?? "User";

  const [documents, setDocuments] = useState<DocumentRecord | null>(null);
  const [complianceScore, setComplianceScore] = useState(0);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);

  const [hirerReputation, setHirerReputation] = useState<number | null>(null);
  const [credibility, calcCredibility] = useState<number>(0.0);

  // Form inputs
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");

  // Dialog open states
  const [isNameOpen, setIsNameOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  useEffect(() => {
    // Redirect only after auth has finished restoring from localStorage.
    if (!isAuthReady) {
      return;
    }

    if (!currentUser) {
      router.push("/login");
    }
  }, [currentUser, isAuthReady]);

  useEffect(() => {
  if (!currentUser?.accountID || currentUser.role !== "hirer") return;

  let isMounted = true;
  const accountID = currentUser.accountID;

  async function fetchDocuments() {
    setIsDocumentsLoading(true);
    try {
      const response = await documentApi.getDocuments(accountID);
      if (isMounted) {
        setDocuments(response.data.documents);
        setComplianceScore(response.data.complianceScore);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      if (isMounted) setIsDocumentsLoading(false);
    }
  }

  fetchDocuments();
  return () => { isMounted = false; };
}, [currentUser]);



  useEffect(() => {
  console.log("Current User in Profile:", currentUser);
}, [currentUser]);

  useEffect(() => {
    if (!currentUser?.userID || currentUser.role !== "hirer") {
      return;
    }

    let isMounted = true;
    const userID = currentUser.userID;

    async function loadProfileReputation() {
      try {
        const response = await profileApi.getProfile(userID);

        if (isMounted) {
          setHirerReputation(response.data.profile.reputation ?? 0);
        }
      } catch (error) {
        console.error("Failed to load hirer reputation:", error);

        if (isMounted) {
          setHirerReputation(null);
        }
      }
    }

    loadProfileReputation();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);




  async function handleUpdateName(e: React.FormEvent<HTMLElement>) {
    e.preventDefault();
    if (!currentUser?.userID) return;

    const firstName = firstNameInput.trim();
    const lastName = lastNameInput.trim();

    setNameError("");

    if (!firstName || !lastName) {
      setNameError("Both first and last name are required.");
      return;
    }

    try {
      await profileApi.updateProfile(currentUser.userID, { firstName, lastName, phone: currentUser.phone });
      overrideCurrentUser({
        ...currentUser,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
      });
      setIsNameOpen(false);
      toaster.create({ title: "Name updated successfully!", type: "success", duration: 3000, closable: true });
    } catch {
      setNameError("Failed to update name. Please try again.");
    }
  }

    function splitName(name: string) {
      const parts = name.trim().split(/\s+/).filter(Boolean);
      const [firstName = "", ...lastNameParts] = parts;
      return { firstName, lastName: lastNameParts.join(" ") };
  }

  async function handleUpdatePhone(e: React.FormEvent<HTMLElement>) {
    e.preventDefault();
    if (!currentUser?.userID) return;

    setPhoneError("");

    const firstName = currentUser.firstName || splitName(currentUser.name).firstName;
    const lastName = currentUser.lastName || splitName(currentUser.name).lastName;

    if (!phoneInput.trim()) {
      setPhoneError("Phone number is required.");
      return;
    }

    try {
      await profileApi.updateProfile(currentUser.userID, {
        firstName,
        lastName,
        phone: phoneInput.trim(),
      });
      overrideCurrentUser({ ...currentUser, phone: phoneInput.trim() });
      setIsPhoneOpen(false);
      toaster.create({ title: "Phone number updated!", type: "success", duration: 3000, closable: true });
    } catch {
      setPhoneError("Failed to update phone. Please try again.");
    }
  }

  async function handleUpdateEmail(e: React.FormEvent<HTMLElement>) {
    e.preventDefault();
    if (!currentUser?.userID) return;

    setEmailError("");

    if (!emailInput.trim()) {
      setEmailError("Email is required.");
      return;
    }

    try {
      await profileApi.updateEmail(currentUser.userID, emailInput.trim());
      overrideCurrentUser({ ...currentUser, email: emailInput.trim() });
      toaster.create({ title: "Email updated successfully!", type: "success", duration: 3000, closable: true });
      setIsEmailOpen(false);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message ?? "Failed to update email."
        : "Failed to update email.";
      setEmailError(message);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent<HTMLElement>) {
    e.preventDefault();
    if (!currentUser?.userID) return;

    setPasswordError("");

    if (!currentPasswordInput || !newPasswordInput) {
      setPasswordError("Both fields are required.");
      return;
    }

    try {
      await profileApi.updatePassword(currentUser.userID, {
        currentPassword: currentPasswordInput,
        newPassword: newPasswordInput,
      });
      toaster.create({ title: "Password updated successfully!", type: "success", duration: 3000, closable: true });
      setCurrentPasswordInput("");
      setNewPasswordInput("");
      setIsPasswordOpen(false);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message ?? "Failed to update password."
        : "Failed to update password.";
      setPasswordError(message);
    }
  }
  
  //
  // File Upload & Delete
  //
  async function handleFileUpload(
  e: React.ChangeEvent<HTMLInputElement>,
  field: "driverLicence" | "insuranceCert" | "businessRegCert",
) {
  const file = e.target.files?.[0];
  if (!file || !currentUser?.accountID) return;

  if (file.size > 5 * 1024 * 1024) {
    toaster.create({
      title: "File too large!",
      description: "Please choose a file under 5MB.",
      type: "error",
      duration: 3000,
      closable: true,
    });
    return;
  }

  try {
    const response = await documentApi.uploadDocument(currentUser.accountID, field, file);
    setDocuments(response.data.documents);
    setComplianceScore(response.data.complianceScore);
    toaster.create({ title: "Document uploaded!", type: "success", duration: 3000, closable: true });
  } catch {
    toaster.create({ title: "Failed to upload document.", type: "error", duration: 3000, closable: true });
  }
}

  async function handleFileDelete(
    field: "driverLicence" | "insuranceCert" | "businessRegCert",
  ) {
    if (!currentUser?.accountID) return;
    try {
      const response = await documentApi.removeDocument(currentUser.accountID, field);
      setDocuments(response.data.documents);
      setComplianceScore(response.data.complianceScore);
      toaster.create({ title: "Document removed.", type: "success", duration: 3000, closable: true });
    } catch {
      toaster.create({ title: "Failed to remove document.", type: "error", duration: 3000, closable: true });
    }
  }

  async function handleAbnChange(value: string) {
    if (!currentUser?.accountID) return;
    try {
      const response = await documentApi.updateAbn(currentUser.accountID, value || null);
      setDocuments(response.data.documents);
      setComplianceScore(response.data.complianceScore);
    } catch {
      console.error("Failed to update ABN");
    }
  }

  async function handleApplyingAsBusinessToggle(checked: boolean) {
    if (!currentUser?.accountID) return;
    try {
      const response = await documentApi.updateApplyAsBusiness(currentUser.accountID, checked);
      setDocuments(response.data.documents);
      setComplianceScore(response.data.complianceScore);
    } catch {
      console.error("Failed to update business status");
    }
  }
  //
  // File Upload & Delete
  //

  const navItems = currentUser
    ? [
        { label: "Home", href: "/" },
        {
          label: "My Dashboard",
          href: currentUser.role === "hirer" ? "/hirer" : "/vendor",
        },
      ]
    : [
        { label: "Log In", href: "/login" },
        { label: "Join", href: "/sign_up" },
      ];

      
  return (
    <Layout
      headerTitle="Venue Vendors"
      footerText="Student project footer"
      navItems={navItems}
    >
      <div className="max-w-2xl mx-auto px-4 py-8">

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Personal info</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <Icon as={FaStar} className="text-gray-500 w-5 h-5" />
              <p className="text-sm font-semibold text-gray-800">Profile picture</p>
            </div>
            <div className="flex items-center gap-3">
              <Avatar
                name={displayName}
                size="md"
                bg="blue.500"
                color="white"
              />
              <Icon as={FaChevronRight} className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Info rows */}
          <InfoRow
            icon={FaInfo}
            label="First Name"
            value={currentUser?.firstName || splitName(displayName).firstName}
            onClick={() => {
              setFirstNameInput(currentUser?.firstName || splitName(displayName).firstName);
              setLastNameInput(currentUser?.lastName || splitName(displayName).lastName);
              setNameError("");
              setIsNameOpen(true);
            }}
          />
          <InfoRow
            icon={FaInfo}
            label="Last Name"
            value={currentUser?.lastName || splitName(displayName).lastName}
            onClick={() => {
              setFirstNameInput(currentUser?.firstName || splitName(displayName).firstName);
              setLastNameInput(currentUser?.lastName || splitName(displayName).lastName);
              setNameError("");
              setIsNameOpen(true);
            }}
          />
          <InfoRow
            icon={FaPhone}
            label="Phone"
            value={currentUser?.phone || "Not set"}
            onClick={() => {
              setPhoneInput(currentUser?.phone ?? "");
              setPhoneError("");
              setIsPhoneOpen(true);
            }}
          />
          <InfoRow
            icon={FaEnvelope}
            label="Email"
            value={currentUser?.email ?? "No email set"}
            onClick={() => {
              setEmailInput(currentUser?.email ?? "");
              setEmailError("");
              setIsEmailOpen(true);
            }}
          />
          <InfoRow
            icon={FaLock}
            label="Password"
            value="Change current password"
            isPassword
            onClick={() => {
              setCurrentPasswordInput("");
              setNewPasswordInput("");
              setPasswordError("");
              setIsPasswordOpen(true);
            }}
          />
          <InfoRow
            icon={FaCalendar}
            label="Member Since"
            value={
              currentUser?.createdAt 
                ? new Date(currentUser.createdAt).toLocaleDateString(undefined, { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  }) 
                : "Unknown"
            }
          />
          {/* Info rows */}

          </div>

          {/* Name change dialog */}
          <DialogRoot
            open={isNameOpen}
            onOpenChange={(details) => {
              setIsNameOpen(details.open);
              if (!details.open) setNameError("");
            }}
          >
            <DialogContent>
              <form onSubmit={handleUpdateName}>
                <DialogHeader color="black">
                  <DialogTitle>Change Name</DialogTitle>
                </DialogHeader>
                <DialogCloseTrigger />
                <DialogBody pb={6} className="space-y-3">
                  {nameError && (
                    <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {nameError}
                    </p>
                  )}
                  <Field label="First Name" color="black">
                    <Input
                      placeholder="First name"
                      value={firstNameInput}
                      onChange={(e) => setFirstNameInput(e.target.value)}
                      color="black"
                    />
                  </Field>
                  <Field label="Last Name" color="black">
                    <Input
                      placeholder="Last name"
                      value={lastNameInput}
                      onChange={(e) => setLastNameInput(e.target.value)}
                      color="black"
                    />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button type="submit" colorPalette="green" mr={3}>Save</Button>
                  <Button type="button" onClick={() => setIsNameOpen(false)}>Cancel</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </DialogRoot>
          {/* Name change dialog */}

          {/* Phone change dialog */}
          <DialogRoot
            open={isPhoneOpen}
            onOpenChange={(details) => {
              setIsPhoneOpen(details.open);
              if (!details.open) setPhoneError("");
            }}
          >
            <DialogContent>
              <form onSubmit={handleUpdatePhone}>
                <DialogHeader color="black">
                  <DialogTitle>Add/Change Phone Number</DialogTitle>
                </DialogHeader>
                <DialogCloseTrigger />
                <DialogBody pb={6} className="space-y-3">
                  {phoneError && (
                    <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {phoneError}
                    </p>
                  )}
                  <Field color="black">
                    <Input
                      placeholder="Enter Phone Number"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      color="black"
                    />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button type="submit" colorPalette="green" mr={3}>Save</Button>
                  <Button type="button" onClick={() => setIsPhoneOpen(false)}>Cancel</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </DialogRoot>
          {/* Phone change dialog */}

          {/* Email change dialog */}
          <DialogRoot
            open={isEmailOpen}
            onOpenChange={(details) => setIsEmailOpen(details.open)}
          >
            <DialogContent>
              <form onSubmit={handleUpdateEmail}>
                <DialogHeader color="black">
                  <DialogTitle>Change Email</DialogTitle>
                </DialogHeader>
                <DialogCloseTrigger />
                <DialogBody pb={6} className="space-y-3">
                  {emailError && (
                    <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {emailError}
                    </p>
                  )}
                  <Field label="New Email" color="black">
                    <Input
                      type="email"
                      placeholder="Enter new email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      color="black"
                    />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button type="submit" colorPalette="green" mr={3}>Save</Button>
                  <Button type="button" onClick={() => setIsEmailOpen(false)}>Cancel</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </DialogRoot>
          {/* Email change dialog */}

          {/* Password change dialog */}
          <DialogRoot
            open={isPasswordOpen}
            onOpenChange={(details) => setIsPasswordOpen(details.open)}
          >
            <DialogContent>
              <form onSubmit={handleUpdatePassword}>
                <DialogHeader color="black">
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <DialogCloseTrigger />
                <DialogBody pb={6} className="space-y-3">
                  {passwordError && (
                    <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {passwordError}
                    </p>
                  )}
                  <Field label="Current Password" color="black">
                    <Input
                      type="password"
                      placeholder="Current password"
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      color="black"
                    />
                  </Field>
                  <Field label="New Password" color="black">
                    <Input
                      type="password"
                      placeholder="New password"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      color="black"
                    />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button type="submit" colorPalette="green" mr={3}>Save</Button>
                  <Button type="button" onClick={() => setIsPasswordOpen(false)}>Cancel</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </DialogRoot>
          {/* Password change dialog */}

        {/*Only show if a hirer has logged in*/}
        {currentUser?.role === "hirer" && (
        <>
          <h1 className="text-3xl mt-10 font-bold text-gray-900 mb-6">My Reputation</h1>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 mb-8">
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600">Average reputation:</p>
              <HStack gap={1}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Icon
                    as={FaStar}
                    key={index}
                    color={index < Math.round(hirerReputation ?? 0) ? "yellow.400" : "gray.300"}
                    boxSize={4}
                  />
                ))}
              </HStack>
              <p className="text-sm text-gray-500">({hirerReputation ?? 0}/5)</p>
            </div>
          </div>

          <h1 className="text-3xl mt-10 font-bold text-gray-900 mb-6">My Documents</h1>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-gray-600">Compliance Score:</p>
            <HStack gap={1}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Icon
                  as={FaStar}
                  key={index}
                  color={index < complianceScore ? "green.400" : "gray.300"}
                  boxSize={4}
                />
              ))}
            </HStack>
            <p className="text-sm text-gray-500">({complianceScore}/5)</p>
          </div>

          {isDocumentsLoading ? (
            <p className="text-sm text-zinc-600">Loading documents...</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 space-y-6">
              <DocUploadRow
                label="Driver Licence"
                field="driverLicence"
                document={documents?.driverLicence ? { fileName: documents.driverLicence, mimeType: "", uploaded: true, base64Data: "" } : null}
                onUpload={(e) => handleFileUpload(e, "driverLicence")}
                onDelete={() => handleFileDelete("driverLicence")}
              />
              <DocUploadRow
                label="Insurance Certificate"
                field="insuranceCert"
                document={documents?.insuranceCert ? { fileName: documents.insuranceCert, mimeType: "", uploaded: true, base64Data: "" } : null}
                onUpload={(e) => handleFileUpload(e, "insuranceCert")}
                onDelete={() => handleFileDelete("insuranceCert")}
              />

              <Separator />

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={documents?.isApplyAsBusiness ?? false}
                    onChange={(e) => handleApplyingAsBusinessToggle(e.target.checked)}
                  />
                  Applying as a Business
                </label>
              </div>

              {documents?.isApplyAsBusiness && (
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-1">ABN Number</p>
                  <input
                    type="text"
                    placeholder="Enter ABN"
                    value={documents?.abnNo ?? ""}
                    onChange={(e) => handleAbnChange(e.target.value)}
                    className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
              )}

              <DocUploadRow
                label="Business Registration Certificate"
                field="businessRegCert"
                document={documents?.businessRegCert ? { fileName: documents.businessRegCert, mimeType: "", uploaded: true, base64Data: "" } : null}
                onUpload={(e) => handleFileUpload(e, "businessRegCert")}
                onDelete={() => handleFileDelete("businessRegCert")}
              />
            </div>
          )}
        </>
      )}
        
      </div>
    </Layout>
  );
}
