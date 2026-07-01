// app/component/dashboard/documents-section.tsx
"use client";
import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadUserDocument } from "@/utils/api";
import toast from "react-hot-toast";
import DocumentsGalleryModal from "./documents-gallery-modal";

type Props = {
  userId: string;
  documents: any[];
  defaultType?: string;        // contract → "cnic", payment → "receipt"
  showDropdown?: boolean;      // profile → true, contract/payment → false
  filterType?: string;         // gallery modal filter
  queryKey: string[];
  title?: string;
  description?: string;
  required?: boolean;          // ← title ke saath * dikhata hai
  error?: string;              // ← red border + error message ke liye
};

export default function DocumentsSection({
  userId,
  documents,
  defaultType = "cnic",
  showDropdown = true,
  filterType,
  queryKey,
  title = "My Documents",
  description,
  required = false,
  error,
}: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState(defaultType);  // ← defaultType se initialize
  const [docsOpen, setDocsOpen] = useState(false);

  // docType ko capture karo upload ke waqt — closure issue fix
  const docTypeRef = useRef(docType);
  docTypeRef.current = docType;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) { toast.error("Only image or PDF files are allowed"); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD}/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();

      // ← ref use karo — always latest type milega
      await uploadUserDocument(userId, {
        type: docTypeRef.current,
        url: data.secure_url,
        fileType: isImage ? "image" : "pdf",
        label: file.name,
      });

      toast.success("Document uploaded successfully!");
      queryClient.invalidateQueries({ queryKey });
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const visibleCount = filterType
    ? documents?.filter((d) => d.type === filterType).length
    : documents?.length || 0;

  return (
    <div
      className={`bg-white border rounded-2xl p-5 shadow-sm transition-colors ${
        error ? "border-red-400" : "border-gray-100"
      }`}
    >
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
        {title}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </p>
      {description && <p className="text-xs text-gray-400 mb-4">{description}</p>}

      <div className="flex items-center gap-2 mt-3">
        {/* Dropdown — sirf profile pe */}
        {showDropdown && (
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-yellow-400"
          >
            <option value="cnic">CNIC</option>
            <option value="receipt">Receipt</option>
            <option value="certificate">Certificate</option>
            <option value="other">Other</option>
          </select>
        )}

        {/* Upload button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition disabled:opacity-50 ${
            error
              ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
              : "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
          }`}
        >
          <Upload size={14} />
          {uploading ? "Uploading..." : "Upload"}
        </button>

        {/* View button */}
        <button
          onClick={() => setDocsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition ml-auto"
        >
          <FileText size={14} />
          View ({visibleCount})
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-2">{error}</p>
      )}

      <DocumentsGalleryModal
        isOpen={docsOpen}
        onClose={() => setDocsOpen(false)}
        userId={userId}
        documents={documents || []}
        filterType={filterType}
        queryKey={queryKey}
      />
    </div>
  );
}