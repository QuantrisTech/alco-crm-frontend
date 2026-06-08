// enrollments/page.tsx mein add karo

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminGetResources, adminAddBookToUser, getUserBooks } from "@/utils/api";
import { X } from "lucide-react";
import toast from "react-hot-toast";

// ── Add Book Popup ────────────────────────────────────────────
export function AddBookPopup({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const { data: resourcesData, isLoading: resourcesLoading } = useQuery({
    queryKey: ["all-resources"],
    queryFn:  () => adminGetResources().then((r) => r.data),
  });

  const { data: userBooksData } = useQuery({
    queryKey: ["user-books", userId],
    queryFn:  () => getUserBooks(userId).then((r) => r.data),
  });

  const alreadyHas = new Set(userBooksData?.data?.map((b: any) => b._id) || []);

  const { mutate: addBook, isPending } = useMutation({
    mutationFn: (resourceId: string) => adminAddBookToUser(userId, resourceId),
    onSuccess: () => {
      toast.success("Book added! ✅");
      queryClient.invalidateQueries({ queryKey: ["user-books", userId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed!"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Add Book to User</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {resourcesLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
            {resourcesData?.data?.map((resource: any) => {
              const has = alreadyHas.has(resource._id);
              return (
                <div
                  key={resource._id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {resource.cover_image_url && (
                      <img
                        src={resource.cover_image_url}
                        alt={resource.title}
                        className="w-10 h-12 object-contain rounded"
                      />
                    )}
                    <p className="text-sm font-medium text-gray-700 line-clamp-2">
                      {resource.title}
                    </p>
                  </div>

                  {has ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                      ✓ Added
                    </span>
                  ) : (
                    <button
                      onClick={() => addBook(resource._id)}
                      disabled={isPending}
                      className="text-xs px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium transition whitespace-nowrap disabled:opacity-50"
                    >
                      Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}