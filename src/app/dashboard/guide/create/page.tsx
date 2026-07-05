// // components/admin/GuideUploadForm.tsx
// "use client";

// import { useState } from "react";
// import BlockEditor, { Block } from "@/app/dashboard/blogs/component/block-editor";
// import GuideVideoUpload from "../component/guide-video-upload";
// import { useMutation } from "@tanstack/react-query";
// import { adminUpsertGuide } from "@/utils/api";
// import toast from "react-hot-toast";


// export default function GuideUploadForm({ pageKey }: { pageKey: string }) {
//   const [heading, setHeading] = useState("");
//   const [description, setDescription] = useState<Block[]>([]);
//   const [videoUrl, setVideoUrl] = useState("");
//   const [videoPublicId, setVideoPublicId] = useState("");
// //   const [saving, setSaving] = useState(false);

//   const formattedDescription = description.map((block) => {
//     const isList = block.type === "ul" || block.type === "ol";
//     return {
//       type: block.type,
//       text: isList ? undefined : block.text,
//       items: isList
//         ? (block.items || []).map((item) => ({ text: item.text, bold: item.bold || "" }))
//         : [],
//     };
//   });


// const { mutate: saveGuide, isPending: saving } = useMutation({
//   mutationFn: (payload: any) => adminUpsertGuide(payload),
//   onSuccess: () => toast.success("Guide saved successfully!"),
//   onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save guide"),
// });

// const handleSave = () => {
//   if (!heading || !videoUrl) {
//     toast.error("Heading aur video required hain");
//     return;
//   }

//   saveGuide({
//     pageKey,
//     heading,
//     description: formattedDescription,
//     videoUrl,
//     videoPublicId,
//   });
// };

//   return (
//     <div className="space-y-4 rounded-lg border p-4">
//       <div>
//         <label className="mb-1 block text-sm font-medium">Heading</label>
//         <input
//           value={heading}
//           onChange={(e) => setHeading(e.target.value)}
//           className="w-full rounded-md border px-3 py-2 text-sm"
//         />
//       </div>

//       <div>
//         <label className="mb-1 block text-sm font-medium">Description</label>
//         <BlockEditor value={description} onChange={setDescription} />
//       </div>

//       <div>
//         <label className="mb-1 block text-sm font-medium">Video</label>
//         <GuideVideoUpload pageKey={pageKey} onUploaded={(url, id) => { setVideoUrl(url); setVideoPublicId(id); }} />
//       </div>

//       <button onClick={handleSave} disabled={saving} className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
//         {saving ? "Saving..." : "Save Guide"}
//       </button>
//     </div>
//   );
// }
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminUpsertGuide, getGuideByPageKey } from "@/utils/api";
import ProtectedRoute from "@/app/component/protected-route";
import Breadcrumb from "@/app/component/ui/breadcrumb";
import BlockEditor, { Block } from "@/app/dashboard/blogs/component/block-editor";
import GuideVideoUpload from "../component/guide-video-upload";
import toast from "react-hot-toast";
import { Save, ArrowLeft, FilePlus } from "lucide-react";

const genId = () => "temp_" + Math.random().toString(36).slice(2, 9);

export default function CreateGuidePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPageKey = searchParams.get("pageKey");
  const isEditMode = !!editPageKey;

  const [pageKey, setPageKey] = useState("");
  const [heading, setHeading] = useState("");
  const [description, setDescription] = useState<Block[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPublicId, setVideoPublicId] = useState("");

  // ── Fetch existing guide if editing ──
  const { data: existingGuide, isLoading: loadingGuide } = useQuery({
    queryKey: ["guide", editPageKey],
    queryFn: async () => (await getGuideByPageKey(editPageKey!)).data.data,
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingGuide) {
      setPageKey(existingGuide.pageKey);
      setHeading(existingGuide.heading);
      setVideoUrl(existingGuide.videoUrl);
      setVideoPublicId(existingGuide.videoPublicId || "");
      setDescription(
        (existingGuide.description || []).map((b: any) => ({ ...b, _id: genId() }))
      );
    }
  }, [existingGuide]);

  const formattedDescription = description.map((block) => {
    const isList = block.type === "ul" || block.type === "ol";
    return {
      type: block.type,
      text: isList ? undefined : block.text,
      items: isList
        ? (block.items || []).map((item) => ({ text: item.text, bold: item.bold || "" }))
        : [],
    };
  });

  const { mutate: saveGuide, isPending: saving } = useMutation({
    mutationFn: (payload: any) => adminUpsertGuide(payload),
    onSuccess: () => {
      toast.success(isEditMode ? "Guide updated!" : "Guide created!");
      router.push("/dashboard/guide");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save guide"),
  });

  const handleSubmit = () => {
    if (!pageKey.trim()) return toast.error("Page Key required hai");
    if (!heading.trim()) return toast.error("Heading required hai");
    if (!videoUrl) return toast.error("Video upload karo");

    saveGuide({
      pageKey: pageKey.trim(),
      heading,
      description: formattedDescription,
      videoUrl,
      videoPublicId,
    });
  };

  if (isEditMode && loadingGuide) {
    return (
      <ProtectedRoute>
        <p className="text-gray-400 text-sm">Loading guide...</p>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Breadcrumb
        items={[
          { label: "Guides", href: "/dashboard/guide" },
          { label: isEditMode ? "Edit Guide" : "Create Guide" },
        ]}
      />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FilePlus size={24} />
          {isEditMode ? "Edit Guide" : "Create Guide"}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/guide")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? "Saving..." : "Save Guide"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Basic Info
            </h3>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Page Key <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={pageKey}
                onChange={(e) => setPageKey(e.target.value)}
                disabled={isEditMode}
                placeholder="e.g. dashboard-enrollments"
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">
                Unique identifier — wahi page py GuideButton me use hoga.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Heading <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="e.g. How to manage Enrollments"
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
              Description
            </h3>
            <BlockEditor value={description} onChange={setDescription} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
              Guide Video <span className="text-red-400">*</span>
            </h3>
            <GuideVideoUpload
              pageKey={pageKey || "untitled"}
              onUploaded={(url, id) => {
                setVideoUrl(url);
                setVideoPublicId(id);
              }}
            />
            {videoUrl && (
              <video src={videoUrl} controls className="mt-3 w-full rounded-md" />
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? "Saving..." : "Save Guide"}
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}