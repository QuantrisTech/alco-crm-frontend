"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllGuides, deleteGuide } from "@/utils/api";
import ProtectedRoute from "@/app/component/protected-route";
import Breadcrumb from "@/app/component/ui/breadcrumb";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, PlayCircle, BookOpen } from "lucide-react";

export default function GuideListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["guides"],
    queryFn: async () => (await getAllGuides()).data.data,
  });

  const { mutate: removeGuide } = useMutation({
    mutationFn: (id: string) => deleteGuide(id),
    onSuccess: () => {
      toast.success("Guide deleted");
      queryClient.invalidateQueries({ queryKey: ["guides"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Delete failed"),
    onSettled: () => setDeletingId(null),
  });

  const handleDelete = (id: string) => {
    if (!confirm("Ye guide delete karni hai?")) return;
    setDeletingId(id);
    removeGuide(id);
  };

  return (
    <ProtectedRoute>
      <Breadcrumb items={[{ label: "Guides" }]} />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen size={24} />
          Page Guides
        </h1>
        <button
          onClick={() => router.push("/dashboard/guide/create")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition"
        >
          <Plus size={15} />
          Add Guide
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-5 py-3">Page Key</th>
              <th className="text-left px-5 py-3">Heading</th>
              <th className="text-left px-5 py-3">Video</th>
              <th className="text-left px-5 py-3">Updated</th>
              <th className="text-right px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  Loading...
                </td>
              </tr>
            )}

            {!isLoading && data?.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  Koi guide nahi mili. "Add Guide" se nayi banao.
                </td>
              </tr>
            )}

            {data?.map((guide: any) => (
              <tr key={guide._id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-5 py-3 font-mono text-gray-600">{guide.pageKey}</td>
                <td className="px-5 py-3 text-gray-800">{guide.heading}</td>
                <td className="px-5 py-3">
                  <a
                    href={guide.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <PlayCircle size={15} /> Preview
                  </a>
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {new Date(guide.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/guide/create?pageKey=${guide.pageKey}`)
                      }
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(guide._id)}
                      disabled={deletingId === guide._id}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProtectedRoute>
  );
}