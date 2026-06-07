"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminGetLessons, adminCreateLesson, adminUpdateLesson, adminDeleteLesson } from "@/utils/api";
import Modal from "@/app/component/ui/model/modal";
import Popup from "@/app/component/ui/popup/popup";
import Button from "@/app/component/ui/button";
import { ModalField } from "@/types/ui";
import toast from "react-hot-toast";
import { X, Plus, Pencil, Trash2, Play, FileText, Mic, Video } from "lucide-react";
import formatDuration from "@/utils/func";

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
    case "video": return <Video size={13} className="text-blue-500" />;
    case "audio": return <Mic size={13} className="text-purple-500" />;
    case "document": return <FileText size={13} className="text-orange-500" />;
    case "live_session": return <Play size={13} className="text-green-500" />;
    default: return <FileText size={13} className="text-gray-400" />;
  }
};

type Props = {
  module: any;
  course: any;
  program: any;
  onClose: () => void;
  zIndex?: number;
};

export default function LessonsModal({ module, course, program, onClose, zIndex = 70 }: Props) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [deletingLesson, setDeletingLesson] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-lessons", module._id],
    queryFn: () => adminGetLessons(module._id).then(res => res.data),
  });

  const { mutate: addLesson, isPending: isAdding } = useMutation({
    mutationFn: (data: any) => adminCreateLesson(module._id, data),
    onSuccess: () => {
      toast.success("Lesson created! ✅");
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-lessons", module._id] });
      queryClient.invalidateQueries({ queryKey: ["admin-modules", course._id] });
    },
    onError: () => toast.error("Failed!"),
  });

  const { mutate: updateLesson, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminUpdateLesson(id, data),
    onSuccess: () => {
      toast.success("Lesson updated! ✅");
      setEditingLesson(null);
      queryClient.invalidateQueries({ queryKey: ["admin-lessons", module._id] });
    },
    onError: () => toast.error("Failed!"),
  });

  const { mutate: deleteLesson, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => adminDeleteLesson(id),
    onSuccess: () => {
      toast.success("Lesson deleted! 🗑️");
      setDeletingLesson(null);
      queryClient.invalidateQueries({ queryKey: ["admin-lessons", module._id] });
      queryClient.invalidateQueries({ queryKey: ["admin-modules", course._id] });
    },
    onError: () => toast.error("Failed!"),
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4" style={{ zIndex }}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[75vh] flex flex-col">

          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
            <div>
              <p className="text-xs text-gray-400">{program.name} → {course.title}</p>
              <h2 className="text-lg font-semibold text-gray-800">{module.title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Lessons</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddOpen(true)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition font-medium"
              >
                <Plus size={12} />
                Add Lesson
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : data?.data?.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Play size={32} className="mx-auto mb-2 opacity-30" />
                No lessons yet — add one!
              </div>
            ) : (
              <div className="space-y-2">
                {data?.data?.map((lesson: any, index: number) => (
                  <div key={lesson._id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center text-xs font-medium text-teal-600 flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {contentIcon(lesson.content_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{lesson.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 capitalize">{lesson.content_type}</span>
                        {lesson.duration_minutes && (
                          <span className="text-xs text-gray-400">{formatDuration(lesson.duration_minutes)}m</span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${lesson.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {lesson.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setEditingLesson(lesson)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setDeletingLesson(lesson)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t flex-shrink-0">
            <Button variant="secondary" fullWidth onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Lesson" fields={lessonFields} onSubmit={(data) => addLesson(data)} isLoading={isAdding} mode="add" zIndex={80} />

      {editingLesson && (
        <Modal isOpen={!!editingLesson} onClose={() => setEditingLesson(null)} title="Edit Lesson" fields={lessonFields}
          initialValues={{
            title: editingLesson.title, description: editingLesson.description || "",
            content_type: editingLesson.content_type, content_url: editingLesson.content_url || "",
            duration_minutes: editingLesson.duration_minutes?.toString() || "", status: editingLesson.status,
          }}
          onSubmit={(data) => updateLesson({ id: editingLesson._id, data })} isLoading={isUpdating} mode="edit" zIndex={80} />
      )}

      {deletingLesson && (
        <Popup isOpen={!!deletingLesson} onClose={() => setDeletingLesson(null)} onConfirm={() => deleteLesson(deletingLesson._id)}
          variant="danger" title="Delete Lesson"
          description={<>Delete <span className="font-bold text-red-500">{deletingLesson.title}</span>?</>}
          confirmText="Yes, Delete" isLoading={isDeleting} loadingText="Deleting..." zIndex={90} />
      )}
    </>
  );
}