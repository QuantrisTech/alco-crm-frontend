"use client";
import { useState, useRef } from "react";
import { X, Trash2, Upload, FileText, AlertTriangle, Eye, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadUserDocument, deleteUserDocument } from "@/utils/api";
import toast from "react-hot-toast";

type Doc = {
    _id: string;
    type: string;
    label?: string;
    url: string;
    fileType: "image" | "pdf";
    uploadedAt: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    documents: Doc[];
    filterType?: string;
    queryKey: string[];
};

export default function DocumentsGalleryModal({
    isOpen, onClose, userId, documents, filterType, queryKey,
}: Props) {
    const queryClient = useQueryClient();
    const fileRef = useRef<HTMLInputElement>(null);
    const [replaceDoc, setReplaceDoc] = useState<Doc | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Doc | null>(null);
    const [uploading, setUploading] = useState(false);
    const [replacingId, setReplacingId] = useState<string | null>(null);
    const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);

    const visibleDocs = filterType
        ? documents.filter((d) => d.type === filterType)
        : documents;

    const typeLabels: Record<string, string> = {
        cnic: "CNIC",
        receipt: "Receipt",
        certificate: "Certificate",
        other: "Other",
    };

    const typeBadgeColors: Record<string, string> = {
        cnic: "bg-blue-600",
        receipt: "bg-emerald-600",
        certificate: "bg-violet-600",
        other: "bg-gray-500",
    };

    const currentIndex = visibleDocs.findIndex((d) => d._id === selectedDoc?._id);

    const { mutate: deleteDoc, isPending: isDeleting } = useMutation({
        mutationFn: (docId: string) => deleteUserDocument(userId, docId),
        onSuccess: () => {
            toast.success("Deleted!");
            queryClient.invalidateQueries({ queryKey });
            setDeleteTarget(null);
            setSelectedDoc(null);
        },
        onError: () => toast.error("Delete failed!"),
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf";
        if (!isImage && !isPdf) { toast.error("Only image or PDF files are allowed"); return; }

        setUploading(true);
        if (replaceDoc) setReplacingId(replaceDoc._id);

        try {
            if (replaceDoc) {
                await deleteUserDocument(userId, replaceDoc._id);
            }

            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!);
            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD}/upload`,
                { method: "POST", body: formData }
            );
            const data = await res.json();

            await uploadUserDocument(userId, {
                type: replaceDoc ? replaceDoc.type : (filterType || "other"),
                url: data.secure_url,
                fileType: isImage ? "image" : "pdf",
                label: file.name,
            });

            toast.success(replaceDoc ? "Document replaced!" : "Document uploaded!");
            queryClient.invalidateQueries({ queryKey });
            setReplaceDoc(null);
            setSelectedDoc(null);
        } catch {
            toast.error("Upload failed. Please try again.");
        } finally {
            setUploading(false);
            setReplacingId(null);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">

                    {/* ── Header ── */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-800">
                                {filterType ? `${typeLabels[filterType]} Documents` : "My Documents"}
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {visibleDocs.length} document{visibleDocs.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* ── Body: Gallery + Side Panel ── */}
                    <div className="flex flex-1 min-h-0">

                        {/* ── Left: Gallery ── */}
                        <div className={`flex-1 overflow-y-auto p-5 min-w-0 transition-all duration-300 ${selectedDoc ? "border-r border-gray-100" : ""}`}>
                            {visibleDocs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                                        <FileText size={24} className="text-gray-300" />
                                    </div>
                                    <p className="text-sm text-gray-400">No documents yet</p>
                                </div>
                            ) : (
                                <div
                                    className={`grid gap-3 transition-all duration-300  ${selectedDoc
                                            ? "grid-cols-2 sm:grid-cols-3"
                                            : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5"
                                        }`}
                                >
                                    {visibleDocs.map((doc) => (
                                        <div
                                            key={doc._id}
                                            onClick={() => setSelectedDoc(doc)}
                                            className={`relative group rounded-xl overflow-hidden border aspect-square cursor-pointer transition-all duration-200 ${selectedDoc?._id === doc._id
                                                    ? "border-blue-400 ring-2 ring-blue-100 shadow-sm"
                                                    : "border-gray-100 bg-gray-50 hover:border-gray-300 hover:shadow-sm"
                                                }`}
                                        >
                                            {/* Thumbnail */}
                                            {doc.fileType === "image" ? (
                                                <div className="relative w-full h-full">
                                                    <img
                                                        src={doc.url}
                                                        alt={doc.label || doc.type}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {replacingId === doc._id && (
                                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 rounded-xl">
                                                            <svg className="animate-spin" width={22} height={22} viewBox="0 0 24 24" fill="none">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                                                                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                                                            </svg>
                                                            <p className="text-white text-[10px] font-medium">Replacing...</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-red-50 relative">
                                                    <FileText size={26} className="text-red-400" />
                                                    <p className="text-[10px] text-gray-400 font-medium">PDF</p>
                                                    {replacingId === doc._id && (
                                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 rounded-xl">
                                                            <svg className="animate-spin" width={22} height={22} viewBox="0 0 24 24" fill="none">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                                                                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                                                            </svg>
                                                            <p className="text-white text-[10px] font-medium">Replacing...</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Type badge */}
                                            <div className="absolute top-1.5 left-1.5">
                                                <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide ${typeBadgeColors[doc.type] || "bg-gray-500"}`}>
                                                    {typeLabels[doc.type] || doc.type}
                                                </span>
                                            </div>

                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-xl">
                                                <div className="flex flex-col items-center gap-1 text-white">
                                                    <Eye size={18} />
                                                    <span className="text-[10px] font-semibold">View</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Right: Side Panel (~20%) ── */}
                        <div
                            className={`flex flex-col bg-white shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${selectedDoc ? "w-[280px] opacity-100" : "w-0 opacity-0"
                                }`}
                        >
                            {selectedDoc && (
                                <>
                                    {/* Panel Header */}
                                    <div className="flex items-start justify-between px-4 py-3.5 border-b border-gray-100 shrink-0">
                                        <div className="min-w-0 pr-2">
                                            <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                                                {selectedDoc.label || typeLabels[selectedDoc.type] || "Document"}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                {new Date(selectedDoc.uploadedAt).toLocaleDateString("en-PK", {
                                                    day: "numeric", month: "short", year: "numeric",
                                                })}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedDoc(null)}
                                            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {/* Image / PDF Preview */}
                                    <div className="flex-1 flex items-center justify-center overflow-hidden bg-gray-100 min-h-0">
                                        {selectedDoc.fileType === "image" ? (
                                            <img
                                                key={selectedDoc._id}
                                                src={selectedDoc.url}
                                                alt={selectedDoc.label}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 px-4 text-center">
                                                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                                                    <FileText size={30} className="text-red-400" />
                                                </div>
                                                <p className="text-xs font-medium text-gray-600">
                                                    {selectedDoc.label || "PDF Document"}
                                                </p>
                                                <a
                                                    href={selectedDoc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition"
                                                >
                                                    <ExternalLink size={12} />
                                                    Open PDF
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Type badge + Prev/Next nav */}
                                    <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between shrink-0">
                                        <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide ${typeBadgeColors[selectedDoc.type] || "bg-gray-500"}`}>
                                            {typeLabels[selectedDoc.type] || selectedDoc.type}
                                        </span>

                                        {visibleDocs.length > 1 && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => { const p = visibleDocs[currentIndex - 1]; if (p) setSelectedDoc(p); }}
                                                    disabled={currentIndex <= 0}
                                                    className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                                >
                                                    <ChevronLeft size={13} />
                                                </button>
                                                <span className="text-[10px] text-gray-400 font-medium tabular-nums">
                                                    {currentIndex + 1}/{visibleDocs.length}
                                                </span>
                                                <button
                                                    onClick={() => { const n = visibleDocs[currentIndex + 1]; if (n) setSelectedDoc(n); }}
                                                    disabled={currentIndex >= visibleDocs.length - 1}
                                                    className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                                >
                                                    <ChevronRight size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 px-4 py-3 border-t border-gray-100 shrink-0">
                                        <button
                                            onClick={() => { setReplaceDoc(selectedDoc); fileRef.current?.click(); }}
                                            disabled={uploading}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            {replacingId === selectedDoc._id ? (
                                                <>
                                                    <svg className="animate-spin" width={12} height={12} viewBox="0 0 24 24" fill="none">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                    </svg>
                                                    Replacing…
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={12} />
                                                    Replace
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(selectedDoc)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition"
                                        >
                                            <Trash2 size={12} />
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Delete Confirm ── */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle size={22} className="text-red-500" />
                            </div>
                            <h3 className="text-base font-semibold text-gray-800">Delete Document?</h3>
                            <p className="text-sm text-gray-400">
                                <span className="font-medium text-gray-600">
                                    {deleteTarget.label || typeLabels[deleteTarget.type]}
                                </span>{" "}
                                will be permanently deleted. This cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteDoc(deleteTarget._id)}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-50"
                            >
                                {isDeleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
        </>
    );
}