"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
  adminGetProgramById, adminGetCourseById, adminGetModuleById,
  adminGetLessons, adminCreateLesson,
  adminUpdateLesson, adminDeleteLesson
} from "@/utils/api";
import PageHeader from "@/app/component/dashboard/page-header";
import Modal from "@/app/component/ui/model/modal";
import Popup from "@/app/component/ui/popup/popup";
import ProtectedRoute from "@/app/component/protected-route";
import { ModalField } from "@/types/ui";
import toast from "react-hot-toast";
import { Play, Pencil, Trash2, Video, FileText, Mic } from "lucide-react";
import Breadcrumb from "@/app/component/ui/breadcrumb";
import { useAppSelector } from "@/store/hooks";

const lessonFields: ModalField[] = [
  { name: "title", label: "Lesson Title", type: "input", inputType: "text", placeholder: "NLP Basics" },
  { name: "description", label: "Description", type: "textarea", placeholder: "Lesson description..." },
  {
    name: "content_type", label: "Content Type", type: "select",
    options: [
      { label: "Video", value: "video" },
      { label: "Audio", value: "audio" },
      { label: "Document", value: "document" },
      { label: "Text", value: "text" },
      { label: "Live Session", value: "live_session" },
    ]
  },
  { name: "content_url", label: "Content URL", type: "uploadInput", inputType: "text", placeholder: "https://..." },
  { name: "duration_minutes", label: "Duration (mins)", type: "input", inputType: "text", placeholder: "45" },
  {
    name: "status", label: "Status", type: "select",
    options: [
      { label: "Active", value: "active" },
      { label: "Draft", value: "draft" },
    ]
  },
];

const contentIcon = (type: string) => {
  switch (type) {
    case "video": return <Video size={14} className="text-blue-500" />;
    case "audio": return <Mic size={14} className="text-purple-500" />;
    case "document": return <FileText size={14} className="text-orange-500" />;
    case "live_session": return <Play size={14} className="text-green-500" />;
    default: return <FileText size={14} className="text-gray-400" />;
  }
};

export default function LessonsPage() {
  const { programId, courseId, moduleId } = useParams();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [deletingLesson, setDeletingLesson] = useState<any>(null);
    const { user: authUser } = useAppSelector((state) => state.auth);
    const role = authUser?.role;
    const isAdmin = role === "super_admin" || role === "admin";

  const { data: programData } = useQuery({
    queryKey: ["program", programId],
    queryFn: () => adminGetProgramById(programId as string).then(res => res.data.data),
  });

  const { data: courseData } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => adminGetCourseById(courseId as string).then(res => res.data.data),
  });

  const { data: moduleData } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: () => adminGetModuleById(moduleId as string).then(res => res.data.data),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-lessons", moduleId],
    queryFn: () => adminGetLessons(moduleId as string).then(res => res.data),
  });

  const { mutate: addLesson, isPending: isAdding } = useMutation({
    mutationFn: (data: any) => adminCreateLesson(moduleId as string, data),
    onSuccess: () => {
      toast.success("Lesson created! ✅");
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-lessons", moduleId] });
    },
    onError: () => toast.error("Failed!"),
  });

  const { mutate: updateLesson, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminUpdateLesson(id, data),
    onSuccess: () => {
      toast.success("Lesson updated! ✅");
      setEditingLesson(null);
      queryClient.invalidateQueries({ queryKey: ["admin-lessons", moduleId] });
    },
    onError: () => toast.error("Failed!"),
  });

  const { mutate: deleteLesson, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => adminDeleteLesson(id),
    onSuccess: () => {
      toast.success("Lesson deleted! 🗑️");
      setDeletingLesson(null);
      queryClient.invalidateQueries({ queryKey: ["admin-lessons", moduleId] });
    },
    onError: () => toast.error("Failed!"),
  });

  return (
    <ProtectedRoute>
      <Breadcrumb items={[
        { label: "Programs", href: "/dashboard/programs" },
        { label: programData?.name || "...", href: `/dashboard/programs/${programId}` },
        { label: courseData?.title || "...", href: `/dashboard/programs/${programId}/${courseId}` },
        { label: moduleData?.title || "..." },
      ]} />

      <PageHeader
        title={moduleData?.title || "Lessons"}
        subtitle="Manage lessons for this module"
        titleIcon={<Play size={24} />}
        totalCount={data?.data?.length ?? 0}
        onAdd={() => setIsAddOpen(true)}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-red-500">Failed to load lessons.</div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No lessons yet — add one!</div>
      ) : (
        <div className="space-y-2">
          {data?.data?.map((lesson: any, index: number) => (
            <div key={lesson._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-xs font-bold text-teal-600 flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {contentIcon(lesson.content_type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-800 text-sm">{lesson.title}</h3>
                {lesson.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{lesson.description}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 capitalize">{lesson.content_type?.replace("_", " ")}</span>
                  {lesson.duration_minutes && (
                    <span className="text-xs text-gray-500">{lesson.duration_minutes} mins</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lesson.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {lesson.status}
                  </span>
                  {lesson.is_free_preview && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-600">
                      Free Preview
                    </span>
                  )}
                </div>
              </div>
              {isAdmin && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setEditingLesson(lesson)} className="p-2 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeletingLesson(lesson)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                  <Trash2 size={14} />
                </button>
              </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Lesson" fields={lessonFields} onSubmit={(data) => addLesson(data)} isLoading={isAdding} mode="add" />

      {editingLesson && (
        <Modal isOpen={!!editingLesson} onClose={() => setEditingLesson(null)} title="Edit Lesson" fields={lessonFields}
          initialValues={{
            title: editingLesson.title, description: editingLesson.description || "",
            content_type: editingLesson.content_type, content_url: editingLesson.content_url || "",
            duration_minutes: editingLesson.duration_minutes?.toString() || "", status: editingLesson.status,
          }}
          onSubmit={(data) => updateLesson({ id: editingLesson._id, data })} isLoading={isUpdating} mode="edit" />
      )}

      {deletingLesson && (
        <Popup isOpen={!!deletingLesson} onClose={() => setDeletingLesson(null)} onConfirm={() => deleteLesson(deletingLesson._id)}
          variant="danger" title="Delete Lesson"
          description={<>Delete <span className="font-bold text-red-500">{deletingLesson.title}</span>?</>}
          confirmText="Yes, Delete" isLoading={isDeleting} loadingText="Deleting..." />
      )}
    </ProtectedRoute>
  );
}