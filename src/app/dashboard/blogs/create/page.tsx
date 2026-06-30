"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCreateBlog } from "@/utils/api";
import ProtectedRoute from "@/app/component/protected-route";
import BlockEditor, { Block } from "@/app/dashboard/blogs/component/block-editor";
import Breadcrumb from "@/app/component/ui/breadcrumb";
import toast from "react-hot-toast";
import { Save, ArrowLeft, FilePlus } from "lucide-react";

// ── Constants ──
const categories = ["nlp", "icf", "hypnotherapy", "coaching", "mindset", "general"];

const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/blogs/upload`, {
        method: "POST",
        body: formData,
    });

    const data = await res.json();
    return data.url;
};

// ── Thumbnail Uploader ──
function ThumbnailUploader({
    value,
    onChange,
}: {
    value: string;
    onChange: (url: string) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/")) return;
        setUploading(true);
        try {
            const url = await uploadToCloudinary(file);
            onChange(url);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                }}
            />

            {uploading ? (
                <div className="h-48 flex items-center justify-center">
                    <div className="w-6 h-6 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : value ? (
                <>
                    <img src={value} className="w-full h-56 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition">
                        <button
                            type="button"
                            onClick={() => {
                                if (inputRef.current) {
                                    inputRef.current.value = "";
                                    inputRef.current.click();
                                }
                            }}
                            className="px-3 py-2 bg-white text-black rounded"
                        >
                            Change
                        </button>
                        <button
                            type="button"
                            onClick={() => onChange("")}
                            className="px-3 py-2 bg-red-500 text-white rounded"
                        >
                            Remove
                        </button>
                    </div>
                </>
            ) : (
                <div
                    onClick={() => {
                        if (inputRef.current) {
                            inputRef.current.value = "";
                            inputRef.current.click();
                        }
                    }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`h-48 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition gap-2 ${isDragging ? "border-yellow-400 bg-yellow-50" : "border-gray-200 hover:border-yellow-300"
                        }`}
                >
                    <span className="text-sm text-gray-400">Click or drag to upload thumbnail</span>
                    <span className="text-xs text-gray-300">PNG, JPG, WEBP supported</span>
                </div>
            )}
        </div>
    );
}

// ── Label Helper ──
function Label({ children }: { children: React.ReactNode }) {
    return <label className="text-sm font-medium text-gray-700 mb-1.5 block">{children}</label>;
}

// ── Section Card ──
function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">{title}</h3>
            <div className="space-y-5">{children}</div>
        </div>
    );
}

// ── Main Create Page ──
export default function CreateBlogPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        thumbnail: "",
        title: "",
        excerpt: "",
        content: [] as Block[],
        category: "general",
        tags: "",
        read_time: "5",
        status: "draft",
        is_featured: false,
    });

    // ── Create Mutation ──
    const { mutate: createBlog, isPending } = useMutation({
        mutationFn: (payload: any) => adminCreateBlog(payload),
        onSuccess: () => {
            toast.success("Blog created successfully!");
            queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
            router.push("/dashboard/blogs");
        },
        onError: (error: any) => {
            console.error("Create error:", error);
            toast.error(error?.response?.data?.message || "Failed to create blog!");
        },
    });

    const isValidObjectId = (id?: string) => !!id && /^[0-9a-fA-F]{24}$/.test(id);

    const formattedContent = form.content.map((block) => {
        const isList = block.type === "ul" || block.type === "ol";

        return {
            _id: isValidObjectId(block?._id) ? block._id : undefined, // ✅ temp_ ids skip
            type: block.type,
            text: isList ? undefined : block.text,
            items: isList
                ? (block.items || []).map((item) => ({
                    _id: isValidObjectId(item._id) ? item._id : undefined, // ✅ items ke liye bhi
                    text: item.text,
                    bold: item.bold || "",
                }))
                : [],
        };
    });

    // ── handleSubmit ──
    const handleSubmit = () => {
        if (!form.title.trim()) {
            toast.error("Title is required!");
            return;
        }

        createBlog({
            ...form,
            content: formattedContent,
            tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
            read_time: Number(form.read_time),
        });
    };

    return (
        <ProtectedRoute>
            {/* Breadcrumb */}
            <Breadcrumb
                items={[
                    { label: "Blogs", href: "/dashboard/blogs" },
                    { label: "Create Blog" },
                ]}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FilePlus size={24} />
                        Create Blog
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard/blogs")}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                    >
                        <ArrowLeft size={15} />
                        Back
                    </button>
                    {/* <button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                    >
                        <Save size={15} />
                        {isPending ? "Publishing..." : "Publish Blog"}
                    </button> */}
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left — Main Content (2/3) */}
                <div className="xl:col-span-2 space-y-6">
                    <Card title="Basic Info">
                        <div>
                            <Label>Title <span className="text-red-400">*</span></Label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="Write an engaging title..."
                                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
                            />
                        </div>
                        <div>
                            <Label>Excerpt</Label>
                            <textarea
                                value={form.excerpt}
                                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                                placeholder="Short summary shown in blog cards..."
                                rows={3}
                                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800 resize-none"
                            />
                        </div>
                    </Card>

                    <Card title="Content">
                        <BlockEditor
                            value={form.content}
                            onChange={(blocks) => setForm({ ...form, content: blocks })}
                        />
                    </Card>
                </div>

                {/* Right — Sidebar (1/3) */}
                <div className="space-y-6">
                    <Card title="Thumbnail">
                        <ThumbnailUploader
                            value={form.thumbnail}
                            onChange={(url) => setForm({ ...form, thumbnail: url })}
                        />
                    </Card>

                    <Card title="Settings">
                        <div>
                            <Label>Category</Label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-700"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Read Time (mins)</Label>
                            <input
                                type="number"
                                value={form.read_time}
                                onChange={(e) => setForm({ ...form, read_time: e.target.value })}
                                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-700"
                            />
                        </div>
                        <div>
                            <Label>Tags <span className="text-gray-400 font-normal">(comma separated)</span></Label>
                            <input
                                type="text"
                                value={form.tags}
                                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                                placeholder="nlp, mindset, coaching..."
                                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-700"
                            />
                        </div>
                        <div>
                            <Label>Status</Label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-700"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                            <input
                                type="checkbox"
                                id="featured"
                                checked={form.is_featured}
                                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                                className="w-4 h-4 accent-yellow-400"
                            />
                            <label htmlFor="featured" className="text-sm text-gray-700 cursor-pointer">
                                Mark as Featured post
                            </label>
                        </div>
                    </Card>

                    <button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="fixed bottom-6 right-6 z-40 w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium shadow-xl hover:bg-gray-800 transition disabled:opacity-50"
                    >
                        <Save size={15} />
                        {isPending ? "Publishing..." : "Publish Blog"}
                    </button>
                </div>
            </div>
        </ProtectedRoute>
    );
}