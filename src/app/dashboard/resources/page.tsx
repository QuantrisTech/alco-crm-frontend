"use client";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/app/component/dashboard/page-header";
import Popup from "@/app/component/ui/popup/popup";
import ProtectedRoute from "@/app/component/protected-route";
import toast from "react-hot-toast";
import {
  BookOpen, Pencil, Trash2, FileText,
  ExternalLink, X, ImageIcon, Upload, CheckCircle, XCircle,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import Input from "@/app/component/ui/inputField";
import Button from "@/app/component/ui/button";
import {
  adminGetResources, adminCreateResource,
  adminUpdateResource, adminDeleteResource,
} from "@/utils/api";

// ── Resource Form ─────────────────────────────────────────────
function ResourceForm({ onSubmit, onCancel, isLoading, initialValues, mode }: {
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  initialValues?: any;
  mode: "add" | "edit";
}) {
  const [title, setTitle]               = useState(initialValues?.title || "");
  const [isAvailable, setIsAvailable]   = useState(initialValues?.is_available ?? true);
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [pdfFile, setPdfFile]           = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialValues?.cover_image_url || "");
  const imageRef = useRef<HTMLInputElement>(null);
  const pdfRef   = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!title.trim()) return toast.error("Title required");
    if (mode === "add" && isAvailable && !pdfFile) return toast.error("PDF required for available resource");
    if (mode === "add" && !imageFile) return toast.error("Cover image required");

    const fd = new FormData();
    fd.append("title", title);
    fd.append("is_available", String(isAvailable));
    if (imageFile) fd.append("image", imageFile);
    if (pdfFile)   fd.append("pdf", pdfFile);
    onSubmit(fd);
  };

  return (
    <div className="space-y-4">
      {/* Available Toggle — top right style */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Available</p>
          <p className="text-xs text-gray-400">PDF required if enabled</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAvailable(!isAvailable)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isAvailable ? "bg-yellow-400" : "bg-gray-200"
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            isAvailable ? "translate-x-6" : "translate-x-1"
          }`} />
        </button>
      </div>

      <Input
        label="Title*"
        placeholder="e.g. Emotional Mastery With NLP"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Cover Image */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">
          Cover Image{mode === "add" ? "*" : " (optional)"}
        </p>
        <div
          onClick={() => imageRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-yellow-400 hover:bg-yellow-50 transition"
        >
          {imagePreview ? (
            <img src={imagePreview} alt="preview" className="h-32 object-contain rounded-lg" />
          ) : (
            <>
              <ImageIcon size={28} className="text-gray-300" />
              <p className="text-xs text-gray-400">Click to upload cover image</p>
            </>
          )}
        </div>
        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
      </div>

      {/* PDF — only show if available */}
      {isAvailable && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            PDF File{mode === "add" ? "*" : " (optional)"}
          </p>
          <div
            onClick={() => pdfRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-yellow-400 hover:bg-yellow-50 transition"
          >
            <FileText size={24} className={pdfFile ? "text-red-500" : "text-gray-300"} />
            <p className="text-xs text-gray-500">
              {pdfFile ? pdfFile.name : "Click to upload PDF"}
            </p>
            <Upload size={14} className="ml-auto text-gray-300" />
          </div>
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
          />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" fullWidth onClick={onCancel}>Cancel</Button>
        <Button fullWidth isLoading={isLoading} loadingText={mode === "edit" ? "Saving..." : "Adding..."} onClick={handleSubmit}>
          {mode === "edit" ? "Save Changes" : "Add Resource"}
        </Button>
      </div>
    </div>
  );
}

// ── Download helper ───────────────────────────────────────────
const handleDownload = async (url: string, filename: string) => {
  try {
    const toastId = toast.loading("Downloading...");
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    toast.dismiss(toastId);
    toast.success("Downloaded!");
  } catch {
    toast.error("Download failed.");
  }
};

// ── Main Page ─────────────────────────────────────────────────
export default function ResourcesPage() {
  const queryClient                             = useQueryClient();
  const [isAddOpen, setIsAddOpen]               = useState(false);
  const [editingResource, setEditingResource]   = useState<any>(null);
  const [deletingResource, setDeletingResource] = useState<any>(null);
  const [filters, setFilters]                   = useState({ search: "" });
  const { user: authUser }                      = useAppSelector((s) => s.auth);
  const isAdmin = authUser?.role === "super_admin" || authUser?.role === "admin";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-resources", filters],
    queryFn:  () => adminGetResources(filters).then((r) => r.data),
  });

  const { mutate: createResource, isPending: isCreating } = useMutation({
    mutationFn: (fd: FormData) => adminCreateResource(fd),
    onSuccess: () => { toast.success("Resource created! ✅"); setIsAddOpen(false); queryClient.invalidateQueries({ queryKey: ["admin-resources"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed!"),
  });

  const { mutate: updateResource, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, fd }: { id: string; fd: FormData }) => adminUpdateResource(id, fd),
    onSuccess: () => { toast.success("Resource updated! ✅"); setEditingResource(null); queryClient.invalidateQueries({ queryKey: ["admin-resources"] }); },
    onError: () => toast.error("Failed!"),
  });

  const { mutate: deleteResource, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => adminDeleteResource(id),
    onSuccess: () => { toast.success("Resource deleted! 🗑️"); setDeletingResource(null); queryClient.invalidateQueries({ queryKey: ["admin-resources"] }); },
    onError: () => toast.error("Failed!"),
  });

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin", "seo"]}>
      <PageHeader
        title="Resources"
        subtitle="Manage books and PDF resources"
        titleIcon={<BookOpen size={24} />}
        totalCount={data?.data?.length ?? 0}
        onAdd={isAdmin ? () => setIsAddOpen(true) : undefined}
        filters={filters}
        setFilters={setFilters}
        filterFields={[{ name: "search", type: "input", placeholder: "Search resources..." }]}
      />

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-red-500">Failed to load resources.</div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No resources found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {data?.data?.map((resource: any) => (
            <div key={resource._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              
              {/* Cover */}
              <div className="relative w-full h-52 bg-gray-50">
                {resource.cover_image_url ? (
                  <img src={resource.cover_image_url} alt={resource.title} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon size={40} />
                  </div>
                )}
                {/* Available badge — top right */}
                <div className={`absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                  resource.is_available ? "bg-green-100 text-green-600" : "bg-red-50 text-red-400"
                }`}>
                  {resource.is_available
                    ? <><CheckCircle size={11} /> Available</>
                    : <><XCircle size={11} /> Unavailable</>
                  }
                </div>
              </div>

              {/* Info */}
              <div className="p-4 border-b border-gray-50">
                <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">{resource.title}</h3>
                {resource.description && <p className="text-xs text-gray-400 line-clamp-2">{resource.description}</p>}
                {resource.uploaded_by?.name && <p className="text-xs text-gray-300 mt-2">By {resource.uploaded_by.name}</p>}
              </div>

              {/* Actions */}
              <div className="px-4 py-3 flex items-center gap-2">
                {resource.is_available && resource.file_url ? (
                  <>
                    <a
                      href={resource.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition font-medium"
                    >
                      <FileText size={12} /> View PDF
                    </a>
                    <button
                      onClick={() => handleDownload(resource.file_url, resource.title)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition font-medium"
                    >
                      <ExternalLink size={12} /> Download
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-gray-300 italic">Not available yet</span>
                )}

                {isAdmin && (
                  <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => setEditingResource(resource)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeletingResource(resource)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Add New Resource</h2>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <ResourceForm mode="add" isLoading={isCreating} onCancel={() => setIsAddOpen(false)} onSubmit={(fd) => createResource(fd)} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingResource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Edit Resource</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editingResource.title}</p>
              </div>
              <button onClick={() => setEditingResource(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <ResourceForm mode="edit" isLoading={isUpdating} initialValues={editingResource} onCancel={() => setEditingResource(null)} onSubmit={(fd) => updateResource({ id: editingResource._id, fd })} />
            </div>
          </div>
        </div>
      )}

      {/* Delete Popup */}
      {deletingResource && (
        <Popup
          isOpen={!!deletingResource}
          onClose={() => setDeletingResource(null)}
          onConfirm={() => deleteResource(deletingResource._id)}
          variant="danger"
          title="Delete Resource"
          description={<>Are you sure you want to delete <span className="font-bold text-red-500">{deletingResource.title}</span>? This will permanently remove the PDF and cover image.</>}
          confirmText="Yes, Delete"
          isLoading={isDeleting}
          loadingText="Deleting..."
        />
      )}
    </ProtectedRoute>
  );
}