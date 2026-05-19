"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  adminGetProgramById, adminGetCourseById,
  adminGetModules, adminCreateModule,
  adminUpdateModule, adminDeleteModule
} from "@/utils/api";
import PageHeader from "@/app/component/dashboard/page-header";
import Modal from "@/app/component/ui/model/modal";
import Popup from "@/app/component/ui/popup/popup";
import ProtectedRoute from "@/app/component/protected-route";
import { ModalField } from "@/types/ui";
import toast from "react-hot-toast";
import { Layers, Pencil, Trash2, ChevronRight, Play } from "lucide-react";
import Breadcrumb from "@/app/component/ui/breadcrumb";
import { useAppSelector } from "@/store/hooks";

const moduleFields: ModalField[] = [
  { name: "title", label: "Module Title", type: "input", inputType: "text", placeholder: "What is NLP?" },
  { name: "description", label: "Description (optional)", type: "textarea", placeholder: "Module description..." },
];

export default function ModulesPage() {
  const { programId, courseId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [deletingModule, setDeletingModule] = useState<any>(null);
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

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-modules", courseId],
    queryFn: () => adminGetModules(courseId as string).then(res => res.data),
  });

  const { mutate: addModule, isPending: isAdding } = useMutation({
    mutationFn: (data: any) => adminCreateModule(courseId as string, data),
    onSuccess: () => {
      toast.success("Module created! ✅");
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-modules", courseId] });
    },
    onError: () => toast.error("Failed!"),
  });

  const { mutate: updateModule, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminUpdateModule(id, data),
    onSuccess: () => {
      toast.success("Module updated! ✅");
      setEditingModule(null);
      queryClient.invalidateQueries({ queryKey: ["admin-modules", courseId] });
    },
    onError: () => toast.error("Failed!"),
  });

  const { mutate: deleteModule, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => adminDeleteModule(id),
    onSuccess: () => {
      toast.success("Module deleted! 🗑️");
      setDeletingModule(null);
      queryClient.invalidateQueries({ queryKey: ["admin-modules", courseId] });
    },
    onError: () => toast.error("Failed!"),
  });

  return (
    <ProtectedRoute>
      <Breadcrumb items={[
        { label: "Programs", href: "/dashboard/programs" },
        { label: programData?.name || "...", href: `/dashboard/programs/${programId}` },
        { label: courseData?.title || "..." },
      ]} />

      <PageHeader
        title={courseData?.title || "Modules"}
        subtitle="Manage modules for this course"
        titleIcon={<Layers size={24} />}
        totalCount={data?.data?.length ?? 0}
        onAdd={() => setIsAddOpen(true)}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-red-500">Failed to load modules.</div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No modules yet — add one!</div>
      ) : (
        <div className="space-y-3">
          {data?.data?.map((module: any, index: number) => (
            <div key={module._id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-sm transition">
              <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600 flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{module.title}</h3>
                {module.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{module.description}</p>
                )}
                <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Play size={11} /> {module.total_lessons} lessons
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => router.push(`/dashboard/programs/${programId}/${courseId}/${module._id}`)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition font-medium"
                >
                  Lessons <ChevronRight size={12} />
                </button>
                {isAdmin && (<>
                  <button onClick={() => setEditingModule(module)} className="p-2 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeletingModule(module)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                    <Trash2 size={14} />
                  </button>
                </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Module" fields={moduleFields} onSubmit={(data) => addModule(data)} isLoading={isAdding} mode="add" />

      {editingModule && (
        <Modal isOpen={!!editingModule} onClose={() => setEditingModule(null)} title="Edit Module" fields={moduleFields}
          initialValues={{ title: editingModule.title, description: editingModule.description || "" }}
          onSubmit={(data) => updateModule({ id: editingModule._id, data })} isLoading={isUpdating} mode="edit" />
      )}

      {deletingModule && (
        <Popup isOpen={!!deletingModule} onClose={() => setDeletingModule(null)} onConfirm={() => deleteModule(deletingModule._id)}
          variant="danger" title="Delete Module"
          description={<>Delete <span className="font-bold text-red-500">{deletingModule.title}</span>? All lessons will be deleted.</>}
          confirmText="Yes, Delete" isLoading={isDeleting} loadingText="Deleting..." />
      )}
    </ProtectedRoute>
  );
}