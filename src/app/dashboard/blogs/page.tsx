"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetBlogs,
  adminCreateBlog,
  adminUpdateBlog,
  adminDeleteBlog,
  adminPublishBlog,
} from "@/utils/api";
import ProtectedRoute from "@/app/component/protected-route";
import Popup from "@/app/component/ui/popup/popup";
import toast from "react-hot-toast";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Send,
  Clock,
  BookOpen,
  Search,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import BlogModal from "./component/blog-modal";
import { useRouter } from "next/navigation";

// ── Helpers ──
const categoryColor = (cat: string): string => {
  const map: Record<string, string> = {
    nlp: "bg-blue-100 text-blue-700",
    icf: "bg-green-100 text-green-700",
    hypnotherapy: "bg-purple-100 text-purple-700",
    coaching: "bg-yellow-100 text-yellow-700",
    mindset: "bg-pink-100 text-pink-700",
    general: "bg-gray-100 text-gray-600",
  };
  return map[cat] || "bg-gray-100 text-gray-600";
};

const categories = ["nlp", "icf", "hypnotherapy", "coaching", "mindset", "general"];

// ── Main Page ──
export default function BlogsPage() {
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [deletingBlog, setDeletingBlog] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1); // ── Pagination State 
  const router = useRouter();

  // ── Queries ──
  const { data, isLoading } = useQuery({
    queryKey: ["admin-blogs", search, statusFilter, categoryFilter, page],
    queryFn: () =>
      adminGetBlogs({
        search,
        status: statusFilter,
        category: categoryFilter,
        page, // ── Pass page to backend
      }).then((res) => res.data),
  });

  // ── Pagination from backend meta ──
  const totalPages = data?.meta?.totalPages ?? 1;

  console.log(totalPages, "totalPages totalPages")

  // ── Mutations ──
  const { mutate: addBlog, isPending: isAdding } = useMutation({
    mutationFn: (data: any) => adminCreateBlog(data),
    onSuccess: () => {
      toast.success("Blog created!");
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Failed to create blog!"),
  });

  // const { mutate: updateBlog, isPending: isUpdating } = useMutation({
  //   mutationFn: ({ id, data }: { id: string; data: any }) =>
  //     adminUpdateBlog(id, data),
  //   onSuccess: () => {
  //     toast.success("Blog updated!");
  //     setEditingBlog(null);
  //     queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
  //   },
  //   onError: () => toast.error("Failed to update blog!"),
  // });

  const { mutate: updateBlog, isPending } = useMutation({
  mutationFn: (payload: any) => {
    const identifier = data?.slug; // ✅ slug use karo
    if (!identifier) throw new Error("Blog slug not found");
    return adminUpdateBlog(identifier, payload);
  },
  onSuccess: () => {
    toast.success("Blog updated successfully!");
  },
  onError: (error) => {
    console.error("Update error:", error);
    toast.error("Failed to update blog!");
  },
});

  const { mutate: deleteBlog, isPending: isDeleting } = useMutation({
    mutationFn: (slug: string) => adminDeleteBlog(slug),
    onSuccess: () => {
      toast.success("Blog deleted!");
      setDeletingBlog(null);
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    },
    onError: () => toast.error("Failed to delete blog!"),
  });

  const { mutate: publishBlog } = useMutation({
    mutationFn: (slug: string) => adminPublishBlog(slug),
    onSuccess: () => {
      toast.success("Blog published!");
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    },
    onError: () => toast.error("Failed to publish blog!"),
  });

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "seo"]}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText size={24} />
            Blog Posts
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Create and manage blog content
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl px-4 py-2 shadow-sm text-sm text-gray-600">
            Total:{" "}
            <span className="font-bold text-gray-900">
              {data?.meta?.total ?? 0}
            </span>
          </div>
          <button
            onClick={() => router.push("/dashboard/blogs/create")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition"
          >
            <Plus size={16} />
            create Blog
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-yellow-300">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search blogs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="outline-none text-sm text-gray-700 w-48"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border bg-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-700"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="border bg-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-700"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        {(search || statusFilter || categoryFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setCategoryFilter("");
              setPage(1);
            }}
            className="text-sm text-gray-400 hover:text-red-500 transition"
          >
            Reset
          </button>
        )}
      </div>

      {/* Blog Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">No blogs yet — write your first one!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {data?.data?.map((blog: any) => {
              // const blogKey = blog._id || blog.slug || Math.random().toString(36);
              return (
                <div
                  key={blog?._id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition group"
                >
                  {/* Thumbnail */}
                  <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                    {blog.thumbnail ? (
                      <img
                        src={blog.thumbnail}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-300">
                        <FileText size={32} />
                        <span className="text-xs">No thumbnail</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${blog.status === "published"
                          ? "bg-emerald-500 text-white"
                          : "bg-yellow-400 text-gray-800"
                          }`}
                      >
                        {blog.status}
                      </span>
                    </div>
                    {blog.is_featured && (
                      <div className="absolute top-3 right-3">
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-400 text-gray-800">
                          Featured
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColor(blog.category)}`}
                      >
                        {blog.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={11} />
                        {blog.read_time} min read
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-800 text-base mb-2 line-clamp-2 leading-snug">
                      {blog.title}
                    </h3>
                    {blog.excerpt && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                        {blog.excerpt}
                      </p>
                    )}
                    {blog.tags?.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mb-3">
                        <Tag size={10} className="text-gray-300" />
                        {blog.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-xs text-gray-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Eye size={11} />
                        {blog.views} views
                      </div>
                      <div className="flex items-center gap-1">
                        {blog.status === "draft" && (
                          <button
                            onClick={() => publishBlog(blog.slug)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition"
                            title="Publish"
                          >
                            <Send size={13} />
                          </button>
                        )}
                        <button
                          // onClick={() => setEditingBlog(blog)}
                          onClick={() => router.push(`/dashboard/blogs/${blog.slug}`)}
                          className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingBlog(blog)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Pagination ── */}
          {totalPages >= 1 && (
            <div className="flex items-center justify-between mt-8">
              <p className="text-xs text-gray-400">
                Page{" "}
                <span className="font-semibold text-gray-700">{page}</span>
                {" "}of{" "}
                <span className="font-semibold text-gray-700">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}


        </>
      )}




      {/* Add Modal */}
      {isAddOpen && (
        <BlogModal
          onSubmit={(data) => addBlog(data)}
          onClose={() => setIsAddOpen(false)}
          isLoading={isAdding}
          mode="add"
        />
      )}

      {/* Edit Modal */}
      {editingBlog && (
        <BlogModal
          initialData={editingBlog}
          onSubmit={(data) => updateBlog({ id: editingBlog._id, data })}
          onClose={() => setEditingBlog(null)}
          isLoading={isPending}
          mode="edit"
        />
      )}

      {/* Delete Popup */}
      {deletingBlog && (
        <Popup
          isOpen={!!deletingBlog}
          onClose={() => setDeletingBlog(null)}
          onConfirm={() => deleteBlog(deletingBlog.slug)}
          variant="danger"
          title="Delete Blog"
          description={
            <>
              Are you sure you want to delete{" "}
              <span className="font-bold text-red-500">{deletingBlog.title}</span>?
            </>
          }
          confirmText="Yes, Delete"
          isLoading={isDeleting}
          loadingText="Deleting..."
        />
      )}
    </ProtectedRoute>
  );
}
