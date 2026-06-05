import { Button, HStack, Icon, Input, Separator } from "@chakra-ui/react";
import { Avatar } from "@/components/ui/avatar";
import { DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster";
import {
  FaChevronRight, FaEnvelope, FaInfo,FaLock, FaPhone, FaRegQuestionCircle, FaStar,
} from "react-icons/fa";

import Layout from "@/components/layout/Layout";
import React from "react";
import router from "next/router";
import { useAuth, type CurrentUser } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { getStoredDocuments, saveDocuments } from "@/utils/documentStorage";
import { profileApi } from "@/services/profileApi";

import type { ComplianceDocuments, UploadedDocumentMetadata } from "@/types/user";

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
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${highlight ? "text-blue-600" : "text-gray-800"}`}>
          {label}
        </p>
        {values.map((v, i) => (
          <p key={i} className="text-sm text-gray-500 mt-0.5">
            {isPassword ? "••••••••" : (v || "Not set")}
          </p>
        ))}
      </div>
      <Icon as={FaChevronRight} className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
    </div>
  );
}

// My Document upload table
function DocUploadRow({ label, document, onUpload, onDelete }: {
  label: string;
  field: "driverLicence" | "insuranceCertificate" | "businessRegistrationCertificate";
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

const defaultDocs: ComplianceDocuments = {
  driverLicence: null,
  insuranceCertificate: null,
  applyingAsBusiness: false,
  abnNumber: null,
  businessRegistrationCertificate: null,
};

export default function UserProfile() {

  // Initialise the current user
  const { currentUser, isAuthReady, overrideCurrentUser } = useAuth();
  const [displayName, setDisplayName] = useState<string>(currentUser?.name ?? "User");
  const [documents, setDocuments] = useState<ComplianceDocuments>(defaultDocs);
  const [credibility, calcCredibility] = useState<number>(0.0);

  useEffect(() => {
    // Redirect only after auth has finished restoring from localStorage.
    if (!isAuthReady) {
      return;
    }

    if (!currentUser) {
      router.push("/sign_in");
    }
  }, [currentUser, isAuthReady]);

  useEffect(() => {
    if (currentUser?.name) {
      setDisplayName(currentUser.name);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const stored = getStoredDocuments(currentUser.email);
    if (stored) 
      setDocuments(stored);
    }
  }, [currentUser]);

  // Caluclate the user's credibility from file uploads
  useEffect(() => {
    let score = 0;
    if (documents.driverLicence) score += 1;
    if (documents.insuranceCertificate) score += 1;
    if (documents.businessRegistrationCertificate) score += 1;
    calcCredibility(score);
  }, [documents]);

  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  async function changeName(e: React.FormEvent<HTMLElement>) {
    e.preventDefault();
    if (!currentUser) return;

    const updatedUser = { ...currentUser, name: nameInput } as CurrentUser;
    if (nameInput === "") {
        toaster.create({
            title: "No name entered!",
            description: "Please enter a new name.",
            type: "error",
            duration: 3000,
            closable: true,
        });
      } else {
      try {
        overrideCurrentUser(updatedUser);    // updates React context/state and persists to localStorage
        setDisplayName(nameInput);           // updates local display state
        toaster.create({
            title: "Name changed successfully!",
            type: "success",
            duration: 3000,
            closable: true,
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.log(err.message);
        }
      } finally {
        onNameClose();
      }
    }
  }

  async function changePhone(e: React.FormEvent<HTMLElement>) {
    e.preventDefault();
    if (!currentUser) return;

    const updatedUser = { ...currentUser, phone: phoneInput } as CurrentUser;
      try {
        overrideCurrentUser(updatedUser);    // updates React context/state and persists to localStorage
        toaster.create({
            title: "Phone Number Successfully Updated!",
            type: "success",
            duration: 3000,
            closable: true,
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.log(err.message);
        }
      } finally {
        onPhoneClose();
      }
    
  }
  
  //
  // File Upload & Delete
  //
  function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "driverLicence" | "insuranceCertificate" | "businessRegistrationCertificate"
  ) {
      const file = e.target.files?.[0];
      if (!file || !currentUser?.email) return;

      if (file.size > 2 * 1024 * 1024) {
        toaster.create({ title: "File too large!", description: "Please choose a file under 2MB.", type: "error", duration: 3000, closable: true });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(",")[1];
        const updated: ComplianceDocuments = {
          ...documents,
          [field]: {
            fileName: file.name,
            mimeType: file.type,
            uploaded: true,
            base64Data,
          },
        };
        setDocuments(updated);
        saveDocuments(currentUser.email, updated);
        toaster.create({ title: "Document uploaded!", type: "success", duration: 3000, closable: true });
      };
      reader.readAsDataURL(file);
    }

    function handleAbnChange(value: string) {
      if (!currentUser?.email) return;
      const updated = { ...documents, abnNumber: value };
      setDocuments(updated);
      saveDocuments(currentUser.email, updated);
    }

    function handleApplyingAsBusinessToggle(checked: boolean) {
      if (!currentUser?.email) return;
      const updated = { ...documents, applyingAsBusiness: checked };
      setDocuments(updated);
      saveDocuments(currentUser.email, updated);
  }

  function handleFileDelete(field: "driverLicence" | "insuranceCertificate" | "businessRegistrationCertificate") {
      if (!currentUser?.email) return;
      const updated = { ...documents, [field]: null };
      setDocuments(updated);
      saveDocuments(currentUser.email, updated);
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
        { label: "Log In", href: "/sign_in" },
        { label: "Join", href: "/sign_up" },
      ];

  // Module element
  // Name change
  const [isNameOpen, setIsNameOpen] = useState(false);
  const onNameOpen = () => setIsNameOpen(true);
  const onNameClose = () => setIsNameOpen(false);
  // Phone num change
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const onPhoneOpen = () => setIsPhoneOpen(true);
  const onPhoneClose = () => setIsPhoneOpen(false);
  const nameInitialRef = React.useRef<HTMLInputElement>(null)
  const phoneInitialRef = React.useRef<HTMLInputElement>(null)

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
            label="Name"
            value={displayName}
            onClick={onNameOpen}
          />
          <InfoRow
            icon={FaPhone}
            label="Phone"
            value={currentUser?.phone ?? "Not set"}
            onClick={onPhoneOpen}
          />
          <InfoRow
            icon={FaEnvelope}
            label="Email"
            value={currentUser?.email ?? "No email set"}
          />
          <InfoRow
            icon={FaLock}
            label="Password"
            value={"Change current password"}
            isPassword
          />

          {/* Name change form */}
          <DialogRoot
            initialFocusEl={() => nameInitialRef.current}
            open={isNameOpen}
            onOpenChange={(details) => setIsNameOpen(details.open)}
          >
            <DialogContent>
              <form onSubmit={changeName}>
                <DialogHeader color="black">
                  <DialogTitle>Change Name</DialogTitle>
                </DialogHeader>
                <DialogCloseTrigger />
                <DialogBody pb={6}>
                <Field>
                  <Input
                    ref={nameInitialRef}
                    placeholder='Your Name'
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    color="black"
                  />
                </Field>
              </DialogBody>
              <DialogFooter>
                <Button type="submit" colorPalette='green' mr={3}>
                  Save
                </Button>
                <Button type="button" colorPalette='grey' onClick={onNameClose}>Cancel</Button>
              </DialogFooter>
              </form>
            </DialogContent>
          </DialogRoot>

          {/* Phone change form */}
          <DialogRoot
            initialFocusEl={() => phoneInitialRef.current}
            open={isPhoneOpen}
            onOpenChange={(details) => setIsPhoneOpen(details.open)}
          >
            <DialogContent>
              <form onSubmit={changePhone}>
                <DialogHeader color="black">
                  <DialogTitle>Add/Change Phone Number</DialogTitle>
                </DialogHeader>
                <DialogCloseTrigger />
                <DialogBody pb={6}>
                <Field>
                  <Input
                    ref={phoneInitialRef}
                    placeholder='Enter Phone Number'
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    color="black"
                  />
                </Field>
              </DialogBody>
              <DialogFooter>
                <Button type="submit" colorPalette='green' mr={3}>
                  Save
                </Button>
                <Button type="button" colorPalette='grey' onClick={onPhoneClose}>Cancel</Button>
              </DialogFooter>
              </form>
            </DialogContent>
          </DialogRoot>

        </div>

        {/*Only show if a hirer has logged in*/}
        {currentUser?.role === "hirer" && (
          <>
            <h1 className="text-3xl mt-10 font-bold text-gray-900 mb-6">My Documents</h1>
            <div className="flex items-center gap-3 mb-4">
              {/* Star rating based on uploaded documents */}
              <p className="text-sm text-gray-600">Profile Credibility:</p>
              <HStack gap={1}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Icon
                    as={FaStar}
                    key={index}
                    color={index < credibility ? "green.400" : "gray.300"}
                    boxSize={4}
                  />
                ))}
              </HStack>
              <p className="text-sm text-gray-500">({credibility}/5)</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 space-y-6">

              <DocUploadRow
                label="Driver Licence"
                field="driverLicence"
                document={documents.driverLicence}
                onUpload={(e) => handleFileUpload(e, "driverLicence")}
                onDelete={() => handleFileDelete("driverLicence")}
              />
              <DocUploadRow
                label="Insurance Certificate"
                field="insuranceCertificate"
                document={documents.insuranceCertificate}
                onUpload={(e) => handleFileUpload(e, "insuranceCertificate")}
                onDelete={() => handleFileDelete("insuranceCertificate")}
              />

              <Separator />
              {/*Check if applyinf for business*/}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-800 cursor-pointer">
                  <input type="checkbox"
                    checked={documents.applyingAsBusiness}
                    onChange={(e) => handleApplyingAsBusinessToggle(e.target.checked)}
                  />
                  Applying as a Business
                </label>
              </div>

              {documents.applyingAsBusiness && (
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-1">ABN Number</p>
                  <input type="text" placeholder="Enter ABN"
                    value={documents.abnNumber ?? ""}
                    onChange={(e) => handleAbnChange(e.target.value)}
                    className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
              )}

              <DocUploadRow
                label="Business Registration Certificate"
                field="businessRegistrationCertificate"
                document={documents.businessRegistrationCertificate}
                onUpload={(e) => handleFileUpload(e, "businessRegistrationCertificate")}
                onDelete={() => handleFileDelete("businessRegistrationCertificate")}
              />

            </div>
          </>
        )}
        
      </div>
    </Layout>
  );
}
