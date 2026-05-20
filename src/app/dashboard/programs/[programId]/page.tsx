"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  adminGetProgramById, adminGetCourses,
  adminCreateCourse, adminUpdateCourse, adminDeleteCourse
} from "@/utils/api";
import PageHeader from "@/app/component/dashboard/page-header";
import Modal from "@/app/component/ui/model/modal";
import Popup from "@/app/component/ui/popup/popup";
import ProtectedRoute from "@/app/component/protected-route";
import { ModalField } from "@/types/ui";
import toast from "react-hot-toast";
import { BookOpen, Pencil, Trash2, ChevronRight, Layers } from "lucide-react";
import Breadcrumb from "@/app/component/ui/breadcrumb";
import { useAppSelector } from "@/store/hooks";

const courseFields: ModalField[] = [
  { name: "title", label: "Course Title*", type: "input", inputType: "text", placeholder: "Introduction to NLP" , required: true},
  { name: "description", label: "Description*", type: "textarea", placeholder: "Course description..." , required: true},
  {
    name: "status", label: "Status*", type: "select", required: true,
    options: [
      { label: "Active", value: "active" },
      { label: "Draft", value: "draft" },
      { label: "Inactive", value: "inactive" },
    ]
  },
];

export default function CoursesPage() {
  const { programId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [deletingCourse, setDeletingCourse] = useState<any>(null);
  const { user: authUser } = useAppSelector((state) => state.auth);
  const role = authUser?.role;
  const isAdmin = role === "super_admin" || role === "admin";

  // Program info for breadcrumb
  const { data: programData } = useQuery({
    queryKey: ["program", programId],
    queryFn: () => adminGetProgramById(programId as string).then(res => res.data.data),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-courses", programId],
    queryFn: () => adminGetCourses(programId as string).then(res => res.data),
  });

  const { mutate: addCourse, isPending: isAdding } = useMutation({
    mutationFn: (data: any) => adminCreateCourse(programId as string, data),
    onSuccess: () => {
      toast.success("Course created! ✅");
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-courses", programId] });
    },
    onError: () => toast.error("Failed!"),
  });

  const { mutate: updateCourse, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminUpdateCourse(id, data),
    onSuccess: () => {
      toast.success("Course updated! ✅");
      setEditingCourse(null);
      queryClient.invalidateQueries({ queryKey: ["admin-courses", programId] });
    },
    onError: () => toast.error("Failed!"),
  });

  const { mutate: deleteCourse, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => adminDeleteCourse(id),
    onSuccess: () => {
      toast.success("Course deleted! 🗑️");
      setDeletingCourse(null);
      queryClient.invalidateQueries({ queryKey: ["admin-courses", programId] });
    },
    onError: () => toast.error("Failed!"),
  });

  return (
    <ProtectedRoute>
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Programs", href: "/dashboard/programs" },
        { label: programData?.name || "..." },
      ]} />

      <PageHeader
        title={programData?.name || "Courses"}
        subtitle="Manage courses for this program"
        titleIcon={<BookOpen size={24} />}
        totalCount={data?.data?.length ?? 0}
        onAdd={() => setIsAddOpen(true)}
      />

      {/* Courses List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-red-500">Failed to load courses.</div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No courses yet — add one!</div>
      ) : (
        <div className="space-y-3">
          {data?.data?.map((course: any, index: number) => (
            <div
              key={course._id}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-sm transition"
            >
              {/* Order */}
              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0">
                {index + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{course.title}</h3>
                {course.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{course.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Layers size={11} /> {course.total_modules} modules
                  </span>
                  <span className="text-xs text-gray-400">{course.total_lessons} lessons</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${course.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {course.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => router.push(`/dashboard/programs/${programId}/${course._id}`)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition font-medium"
                >
                  Modules <ChevronRight size={12} />
                </button>
                {
                  isAdmin && (
                    <>
                      <button
                        onClick={() => setEditingCourse(course)}
                        className="p-2 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingCourse(course)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                    )
                }

              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Course" fields={courseFields} onSubmit={(data) => addCourse(data)} isLoading={isAdding} mode="add" />

      {editingCourse && (
        <Modal isOpen={!!editingCourse} onClose={() => setEditingCourse(null)} title="Edit Course" fields={courseFields}
          initialValues={{ title: editingCourse.title, description: editingCourse.description || "", status: editingCourse.status }}
          onSubmit={(data) => updateCourse({ id: editingCourse._id, data })} isLoading={isUpdating} mode="edit" />
      )}

      {deletingCourse && (
        <Popup isOpen={!!deletingCourse} onClose={() => setDeletingCourse(null)} onConfirm={() => deleteCourse(deletingCourse._id)}
          variant="danger" title="Delete Course"
          description={<>Delete <span className="font-bold text-red-500">{deletingCourse.title}</span>? All modules and lessons will be deleted.</>}
          confirmText="Yes, Delete" isLoading={isDeleting} loadingText="Deleting..." />
      )}
    </ProtectedRoute>
  );
}