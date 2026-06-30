"use client";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminGetBlogBySlug, adminUpdateBlog } from "@/utils/api";
import ProtectedRoute from "@/app/component/protected-route";
import BlockEditor, { Block } from "@/app/dashboard/blogs/component/block-editor";
import Breadcrumb from "@/app/component/ui/breadcrumb";
import toast from "react-hot-toast";
import { Save, ArrowLeft, FileText } from "lucide-react";
import normalizeContentBlocks from "@/helper/helper";

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
    onChange: (base64: string) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // const handleFile = (file: File) => {
    //     if (!file.type.startsWith("image/")) return;
    //     const reader = new FileReader();
    //     reader.onload = (e) => {
    //         if (e.target?.result) onChange(e.target.result as string);
    //     };
    //     reader.readAsDataURL(file);
    // };
    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/")) return;

        const url = await uploadToCloudinary(file);
        onChange(url); // 👈 ONLY URL STORE
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">

            {/* ✅ ALWAYS MOUNT INPUT */}
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

            {value ? (
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
                    className="h-48 flex items-center justify-center border-2 border-dashed"
                >
                    Click to upload thumbnail
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

// ── Main Edit Page ──
export default function EditBlogPage() {
    const { slug } = useParams();
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

    // ── Fetch Blog ──
    const { data, isLoading } = useQuery({
        queryKey: ["admin-blog-slug", slug],
        queryFn: () => adminGetBlogBySlug(slug as string).then((res) => res.data?.data),
        enabled: !!slug,
    });

    // ── Populate form when data loads ──
    useEffect(() => {
        if (data) {
            setForm({
                thumbnail: data.thumbnail || "",
                title: data.title || "",
                excerpt: data.excerpt || "",
                content: Array.isArray(data.content) ? normalizeContentBlocks(data.content) : [],
                category: data.category || "general",
                tags: data.tags?.join(", ") || "",
                read_time: data.read_time?.toString() || "5",
                status: data.status || "draft",
                is_featured: data.is_featured || false,
            });
        }
    }, [data]);

    console.log(data, "datadatadatadatadatadatadatadata")

    // ── Update Mutation ──
    // const { mutate: updateBlog, isPending } = useMutation({
    //     mutationFn: (payload: any) => {
    //         const blogId = data?._id || data?.id; // ✅ dono check karo
    //         if (!blogId) throw new Error("Blog ID not found");
    //         return adminUpdateBlog(blogId, payload);
    //     },
    //     onSuccess: () => {
    //         toast.success("Blog updated successfully!");
    //         // router.push("/dashboard/blogs");
    //     },
    //     onError: (error) => {
    //         console.error("Update error:", error);
    //         toast.error("Failed to update blog!");
    //     },
    // });
    const { mutate: updateBlog, isPending } = useMutation({
        mutationFn: (payload: any) => {
            const identifier = data?.slug;
            if (!identifier) throw new Error("Blog not found");
            return adminUpdateBlog(identifier, payload);
        },
        onSuccess: (res) => {
            toast.success("Blog updated successfully!");

            const updated = res?.data?.data;

            // ✅ form ko turant updated response se bharo — refresh ki zaroorat nahi
            if (updated) {
                setForm({
                    thumbnail: updated.thumbnail || "",
                    title: updated.title || "",
                    excerpt: updated.excerpt || "",
                    content: Array.isArray(updated.content) ? normalizeContentBlocks(updated.content) : [],
                    category: updated.category || "general",
                    tags: updated.tags?.join(", ") || "",
                    read_time: updated.read_time?.toString() || "5",
                    status: updated.status || "draft",
                    is_featured: updated.is_featured || false,
                });
            }

            // ✅ cached query bhi invalidate karo taake list/dusri jagah bhi sync rahe
            queryClient.invalidateQueries({ queryKey: ["admin-blog-slug"] });
            queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });

            const newSlug = updated?.slug;
            if (newSlug && newSlug !== slug) {
                router.replace(`/dashboard/blogs/${newSlug}`);
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to update blog!");
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

    // ── handleSubmit function ──
    const handleSubmit = () => {
        if (!form.title.trim()) {
            toast.error("Title is required!");
            return;
        }

        // const hasEmpty = form.content.some((b: Block) => {
        //     const isList = b.type === "ul" || b.type === "ol";
        //     return isList ? !b.items?.some((i) => String(i?.text || "").trim()) : !b.text?.trim();
        // });

        // if (!form.content.length || hasEmpty) {
        //     document.getElementById("block-editor-validate")?.click();
        //     toast.error("Fill all content blocks or remove empty ones!");
        //     return;
        // }

        // updateBlog({
        //     ...form,
        //     tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
        //     read_time: Number(form.read_time),
        // });

        updateBlog({
            ...form,
            content: formattedContent, // ✅ FIXED
            tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
            read_time: Number(form.read_time),
        });
    };

    // ── Loading State ──
    if (isLoading) {
        return (
            <ProtectedRoute>
                <div className="flex justify-center py-32">
                    <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            {/* Breadcrumb */}
            <Breadcrumb
                items={[
                    { label: "Blogs", href: "/dashboard/blogs" },
                    { label: data?.title || "Edit Blog" },
                ]}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText size={24} />
                        Edit Blog
                    </h1>
                    {/* <p className="text-gray-400 text-sm mt-1">
                        Editing: <span className="text-gray-600 font-medium">{data?.title}</span>
                    </p> */}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard/blogs")}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                    >
                        <ArrowLeft size={15} />
                        Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl shadow-xl hover:bg-gray-800 transition disabled:opacity-50"
                    >
                        <Save size={15} />
                        {isPending ? "Saving..." : "Save Changes"}
                    </button>
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
                            value={form?.content}
                            onChange={(blocks) => setForm({ ...form, content: blocks })}
                        />
                    </Card>
                </div>

                {/* Right — Sidebar (1/3) */}
                <div className="space-y-6">
                    <Card title="Thumbnail">
                        <ThumbnailUploader
                            value={form.thumbnail}
                            onChange={(base64) => setForm({ ...form, thumbnail: base64 })}
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

                    {/* <button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                    >
                        <Save size={15} />
                        {isPending ? "Saving..." : "Save Changes"}
                    </button> */}
                </div>
            </div>
        </ProtectedRoute>
    );
}
