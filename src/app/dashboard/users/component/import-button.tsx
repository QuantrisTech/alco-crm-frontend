// components/ui/ImportButton.tsx
"use client";
import { useState } from "react";
import { Upload, X, UploadCloud, FileSpreadsheet } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axiosInstance";

interface ImportResult {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  skippedEmails: string[];
}

interface ImportButtonProps {
  label?: string;
  queryKey?: string; // react-query invalidate ke liye, default "users"
}

export default function ImportButton({
  label = "Import Excel",
  queryKey = "users",
}: ImportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("file", file as File);
      const res = await axiosInstance.post("/api/admin/users/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data as ImportResult;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setFile(null);
    setResult(null);
  };

  const handleFileSelect = (selected: File | null) => {
    if (!selected) return;
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(selected.type)) {
      alert("Sirf Excel file (.xlsx/.xls) allow hai");
      return;
    }
    setFile(selected);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileSelect(dropped);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-gray-400 hover:text-gray-600 text-gray-600 text-sm font-medium rounded-lg transition-colors shadow-sm"
        title="Import users from Excel"
      >
        <Upload size={13} />
        {label}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Import Users</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Excel se name, email, phone bulk import karein
                </p>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                  dragActive ? "border-yellow-400 bg-yellow-50" : "border-gray-200"
                }`}
                onClick={() => document.getElementById("import-users-file-input")?.click()}
              >
                <input
                  id="import-users-file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                />

                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="text-green-600" size={28} />
                    <p className="text-sm font-medium text-gray-700">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <UploadCloud size={28} />
                    <p className="text-sm">Click ya drag karke file yahan drop karein</p>
                    <p className="text-xs">.xlsx ya .xls</p>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Column order: <strong>A = Name</strong>, <strong>B = Email</strong>, <strong>C = Phone</strong>.
                Pehli row header treat hogi (skip).
              </p>

              {result && (
                <div className="text-sm bg-gray-50 border rounded-lg p-3 space-y-1">
                  <p>Total rows: <strong>{result.totalRows}</strong></p>
                  <p className="text-green-700">Imported: <strong>{result.importedCount}</strong></p>
                  <p className="text-red-600">Skipped (duplicate email): <strong>{result.skippedCount}</strong></p>
                  {result.skippedEmails?.length > 0 && (
                    <p className="text-xs text-gray-500 break-words">
                      {result.skippedEmails.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {importMutation.isError && (
                <p className="text-sm text-red-600">
                  {(importMutation.error as any)?.response?.data?.message || "Import fail ho gaya"}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => importMutation.mutate()}
                disabled={!file || importMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-yellow-400 text-white text-sm font-medium hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importMutation.isPending ? "Importing..." : "Upload & Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}