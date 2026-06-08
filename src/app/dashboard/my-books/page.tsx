// app/dashboard/my-books/page.tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/app/component/dashboard/page-header";
import ProtectedRoute from "@/app/component/protected-route";
import toast from "react-hot-toast";
import { BookOpen, FileText, ImageIcon } from "lucide-react";
import { getMyBooks } from "@/utils/api";

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

export default function MyBooksPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-books"],
    queryFn:  () => getMyBooks().then((r) => r.data),
  });

  return (
    <ProtectedRoute allowedRoles={["user", "super_admin", "admin", "sales_manager", "sales_rep", "finance_manager"]}>
      <PageHeader
        title="My Books"
        subtitle="Books you have requested"
        titleIcon={<BookOpen size={24} />}
        totalCount={data?.data?.length ?? 0}
        filters={{}}
        setFilters={() => {}}
        filterFields={[]}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-red-500">Failed to load books.</div>
      ) : data?.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <BookOpen size={48} className="text-gray-200" />
          <p className="text-gray-400 text-sm">No books yet.</p>
          <p className="text-gray-300 text-xs">
            Visit our website and request a free book — it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {data?.data?.map((book: any) => (
            <div
              key={book._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
            >
              {/* Cover */}
              <div className="relative w-full h-52 bg-gray-50">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200">
                    <ImageIcon size={40} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 border-b border-gray-50">
                <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">
                  {book.title}
                </h3>
                {book.description && (
                  <p className="text-xs text-gray-400 line-clamp-2">{book.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="px-4 py-3 flex items-center gap-2">
                <a
                  href={book.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition font-medium"
                >
                  <FileText size={12} /> View PDF
                </a>
                <button
                  onClick={() => handleDownload(book.file_url, book.title)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition font-medium"
                >
                  <FileText size={12} /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ProtectedRoute>
  );
}