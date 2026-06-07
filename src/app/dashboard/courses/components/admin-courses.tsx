"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetPrograms,
  adminGetCourses,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  adminGetBatches,
  adminCreateBatch,
  adminUpdateBatch,
  adminDeleteBatch,
} from "@/utils/api";
import PageHeader, { FilterField } from "@/app/component/dashboard/page-header";
import DynamicTable from "@/app/component/dashboard/dynamic-table";
import Modal from "@/app/component/ui/model/modal";
import Popup from "@/app/component/ui/popup/popup";
import { ModalField } from "@/types/ui";
import toast from "react-hot-toast";
import {
  FileVolume, BookOpen, Pencil, Trash2,
  ChevronRight, ChevronDown, Users, Calendar, Plus,
} from "lucide-react";

// ── Status badge ──────────────────────────────────────────────
const statusColor = (status: string) => {
  const map: Record<string, string> = {
    active:   "bg-green-100 text-green-700",
    draft:    "bg-yellow-100 text-yellow-700",
    inactive: "bg-gray-100 text-gray-500",
  };
  return map[status] || "bg-gray-100 text-gray-500";
};

// ── Modal Fields ──────────────────────────────────────────────
const courseFields: ModalField[] = [
  { name: "title",       label: "Course Title",   type: "input",    inputType: "text",   placeholder: "e.g. NLP Foundations" },
  { name: "description", label: "Description",    type: "textarea", placeholder: "Course overview..." },
  {
    name: "status", label: "Status", type: "select",
    options: [
      { label: "Active",   value: "active"   },
      { label: "Draft",    value: "draft"    },
      { label: "Inactive", value: "inactive" },
    ],
  },
];

const batchFields: ModalField[] = [
  { name: "name",         label: "Batch Name",     type: "input", inputType: "text", placeholder: "Batch 2026-A" },
  { name: "start_date",   label: "Start Date",     type: "input", inputType: "date" },
  { name: "end_date",     label: "End Date",        type: "input", inputType: "date" },
  { name: "max_students", label: "Max Students",   type: "input", inputType: "number", placeholder: "30" },
  {
    name: "status", label: "Status", type: "select",
    options: [
      { label: "Upcoming",  value: "upcoming"  },
      { label: "Active",    value: "active"    },
      { label: "Completed", value: "completed" },
      { label: "Cancelled", value: "cancelled" },
    ],
  },
];

// ── Program Card with expandable courses ─────────────────────
function ProgramCard({ program }: { program: any }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded]             = useState(false);
  const [isAddCourse, setIsAddCourse]       = useState(false);
  const [editingCourse, setEditingCourse]   = useState<any>(null);
  const [deletingCourse, setDeletingCourse] = useState<any>(null);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["admin-courses", program._id],
    queryFn:  () => adminGetCourses(program._id).then((r) => r.data.data),
    enabled:  expanded,
  });

  const { mutate: addCourse, isPending: isAdding } = useMutation({
    mutationFn: (data: any) => adminCreateCourse(program._id, data),
    onSuccess:  () => { toast.success("Course created! ✅"); setIsAddCourse(false); queryClient.invalidateQueries({ queryKey: ["admin-courses", program._id] }); },
    onError:    (e: any) => toast.error(e?.response?.data?.message || "Failed!"),
  });

  const { mutate: editCourse, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminUpdateCourse(id, data),
    onSuccess:  () => { toast.success("Course updated! ✅"); setEditingCourse(null); queryClient.invalidateQueries({ queryKey: ["admin-courses", program._id] }); },
    onError:    () => toast.error("Failed!"),
  });

  const { mutate: deleteCourse, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => adminDeleteCourse(id),
    onSuccess:  () => { toast.success("Course deleted! 🗑️"); setDeletingCourse(null); queryClient.invalidateQueries({ queryKey: ["admin-courses", program._id] }); },
    onError:    () => toast.error("Failed!"),
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Program Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-yellow-400 flex items-center justify-center shrink-0">
            <FileVolume size={16} className="text-gray-900" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800 text-sm">{program.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {program.total_courses || 0} courses · {program.category} · {program.level}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(program.status)}`}>
            {program.status}
          </span>
          {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Courses List */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between px-5 py-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</p>
            <button
              onClick={() => setIsAddCourse(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={12} />
              Add Course
            </button>
          </div>

          {isLoading ? (
            <div className="px-5 py-6 text-center text-sm text-gray-400">Loading courses...</div>
          ) : !courses?.length ? (
            <div className="px-5 py-6 text-center text-sm text-gray-400">No courses yet — add one above</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {courses.map((course: any) => (
                <div key={course._id} className="flex items-center justify-between px-5 py-3 hover:bg-white transition-colors">
                  <div className="flex items-center gap-3">
                    <BookOpen size={14} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{course.title}</p>
                      <p className="text-xs text-gray-400">
                        {course.total_modules || 0} modules · {course.total_lessons || 0} lessons
                        {course.duration_minutes ? ` · ${course.duration_minutes} min` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(course.status)}`}>
                      {course.status}
                    </span>
                    <button onClick={() => setEditingCourse(course)} className="p-1.5 rounded hover:bg-yellow-50 hover:text-yellow-600 text-gray-400 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeletingCourse(course)} className="p-1.5 rounded hover:bg-rose-50 hover:text-rose-500 text-gray-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Course Modal */}
      <Modal isOpen={isAddCourse} onClose={() => setIsAddCourse(false)} title="Add Course" subtitle={program.name} fields={courseFields} onSubmit={addCourse} isLoading={isAdding} mode="add" />

      {/* Edit Course Modal */}
      {editingCourse && (
        <Modal
          isOpen={!!editingCourse} onClose={() => setEditingCourse(null)}
          title="Edit Course" subtitle={editingCourse.title}
          fields={courseFields}
          initialValues={{ title: editingCourse.title, description: editingCourse.description || "", status: editingCourse.status }}
          onSubmit={(data) => editCourse({ id: editingCourse._id, data })}
          isLoading={isUpdating} mode="edit"
        />
      )}

      {/* Delete Course Popup */}
      {deletingCourse && (
        <Popup
          isOpen={!!deletingCourse} onClose={() => setDeletingCourse(null)}
          onConfirm={() => deleteCourse(deletingCourse._id)}
          variant="danger" title="Delete Course"
          description={<>Delete <span className="font-bold text-rose-500">{deletingCourse.title}</span>? All modules and lessons will be removed.</>}
          confirmText="Yes, Delete" isLoading={isDeleting} loadingText="Deleting..."
        />
      )}
    </div>
  );
}

// ── Main Admin Courses Component ──────────────────────────────
export default function AdminCourses() {
  const queryClient = useQueryClient();
  const [filters, setFilters]           = useState({ status: "", category: "", search: "" });
  const [activeTab, setActiveTab]       = useState<"courses" | "batches">("courses");
  const [isAddBatch, setIsAddBatch]     = useState(false);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [deletingBatch, setDeletingBatch] = useState<any>(null);
  const [batchProgramId, setBatchProgramId] = useState("");

  const filterFields: FilterField[] = [
    { type: "input", name: "search", placeholder: "Search programs..." },
    {
      type: "select", name: "status",
      options: [
        { label: "Active",   value: "active"   },
        { label: "Draft",    value: "draft"    },
        { label: "Inactive", value: "inactive" },
      ],
    },
    {
      type: "select", name: "category",
      options: [
        { label: "NLP",          value: "nlp"          },
        { label: "ICF",          value: "icf"          },
        { label: "Hypnotherapy", value: "hypnotherapy" },
        { label: "Trainer",      value: "trainer"      },
      ],
    },
  ];

  const { data: programs, isLoading, isError } = useQuery({
    queryKey: ["admin-programs", filters],
    queryFn:  () => adminGetPrograms(filters).then((r) => r.data.data),
  });

  const { data: batches, isLoading: batchLoading } = useQuery({
    queryKey: ["admin-batches"],
    queryFn:  () => adminGetBatches().then((r) => r.data.data),
    enabled:  activeTab === "batches",
  });

  const { data: programList } = useQuery({
    queryKey: ["programs-list"],
    queryFn:  () => adminGetPrograms({}).then((r) => r.data.data),
  });

  const batchFieldsWithProgram: ModalField[] = [
    {
      name: "program_id", label: "Program", type: "select",
      options: (programList || []).map((p: any) => ({ label: p.name, value: p._id })),
    },
    ...batchFields,
  ];

  const { mutate: addBatch, isPending: isAddingBatch } = useMutation({
    mutationFn: adminCreateBatch,
    onSuccess:  () => { toast.success("Batch created! ✅"); setIsAddBatch(false); queryClient.invalidateQueries({ queryKey: ["admin-batches"] }); },
    onError:    (e: any) => toast.error(e?.response?.data?.message || "Failed!"),
  });

  const { mutate: editBatch, isPending: isUpdatingBatch } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminUpdateBatch(id, data),
    onSuccess:  () => { toast.success("Batch updated! ✅"); setEditingBatch(null); queryClient.invalidateQueries({ queryKey: ["admin-batches"] }); },
    onError:    () => toast.error("Failed!"),
  });

  const { mutate: deleteBatch, isPending: isDeletingBatch } = useMutation({
    mutationFn: (id: string) => adminDeleteBatch(id),
    onSuccess:  () => { toast.success("Batch deleted! 🗑️"); setDeletingBatch(null); queryClient.invalidateQueries({ queryKey: ["admin-batches"] }); },
    onError:    () => toast.error("Failed!"),
  });

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle="Manage programs, courses and batches"
        titleIcon={<FileVolume size={24} />}
        totalCount={programs?.length ?? 0}
        filters={filters}
        setFilters={setFilters}
        filterFields={filterFields}
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-5">
        {(["courses", "batches"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "courses" ? <><BookOpen size={13} className="inline mr-1.5" />Programs & Courses</> : <><Calendar size={13} className="inline mr-1.5" />Batches</>}
          </button>
        ))}
      </div>

      {/* Programs & Courses Tab */}
      {activeTab === "courses" && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Loading programs...</div>
          ) : isError ? (
            <div className="text-center py-12 text-rose-500 text-sm">Failed to load</div>
          ) : !programs?.length ? (
            <div className="text-center py-12 text-gray-400 text-sm">No programs found</div>
          ) : (
            programs.map((program: any) => <ProgramCard key={program._id} program={program} />)
          )}
        </div>
      )}

      {/* Batches Tab */}
      {activeTab === "batches" && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsAddBatch(true)}
              className="flex items-center gap-2 bg-yellow-400 text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
            >
              <Plus size={14} />
              Add Batch
            </button>
          </div>

          <DynamicTable
            data={batches || []}
            isLoading={batchLoading}
            isError={false}
            currentPage={batches?.meta?.page || 1}
            pageSize={batches?.meta?.limit || 10}
            columns={[
              { key: "name",         label: "Batch Name", render: (b) => <span className="font-medium text-gray-800">{b.name}</span> },
              { key: "program_id",   label: "Program",    render: (b) => <span className="text-gray-600">{b.program_id?.name || "—"}</span> },
              { key: "start_date",   label: "Start Date", render: (b) => <span className="text-gray-500 text-sm">{b.start_date ? new Date(b.start_date).toLocaleDateString() : "—"}</span> },
              { key: "end_date",     label: "End Date",   render: (b) => <span className="text-gray-500 text-sm">{b.end_date ? new Date(b.end_date).toLocaleDateString() : "—"}</span> },
              { key: "current_students", label: "Students", render: (b) => <span className="text-gray-600">{b.current_students || 0} / {b.max_students || 30}</span> },
              { key: "status", label: "Status", render: (b) => <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(b.status)}`}>{b.status}</span> },
            ]}
            actions={[
              { icon: <Pencil size={14} />, label: "Edit",   onClick: (b) => setEditingBatch(b),   className: "hover:bg-yellow-50 hover:text-yellow-600" },
              { icon: <Trash2 size={14} />, label: "Delete", onClick: (b) => setDeletingBatch(b),  className: "hover:bg-rose-50 hover:text-rose-500"    },
            ]}
          />
        </>
      )}

      {/* Add Batch Modal */}
      <Modal isOpen={isAddBatch} onClose={() => setIsAddBatch(false)} title="Add Batch" fields={batchFieldsWithProgram} onSubmit={addBatch} isLoading={isAddingBatch} mode="add" />

      {/* Edit Batch Modal */}
      {editingBatch && (
        <Modal
          isOpen={!!editingBatch} onClose={() => setEditingBatch(null)}
          title="Edit Batch" subtitle={editingBatch.name}
          fields={batchFields}
          initialValues={{ name: editingBatch.name, start_date: editingBatch.start_date?.split("T")[0] || "", end_date: editingBatch.end_date?.split("T")[0] || "", max_students: editingBatch.max_students, status: editingBatch.status }}
          onSubmit={(data) => editBatch({ id: editingBatch._id, data })}
          isLoading={isUpdatingBatch} mode="edit"
        />
      )}

      {/* Delete Batch Popup */}
      {deletingBatch && (
        <Popup
          isOpen={!!deletingBatch} onClose={() => setDeletingBatch(null)}
          onConfirm={() => deleteBatch(deletingBatch._id)}
          variant="danger" title="Delete Batch"
          description={<>Delete batch <span className="font-bold text-rose-500">{deletingBatch.name}</span>?</>}
          confirmText="Yes, Delete" isLoading={isDeletingBatch} loadingText="Deleting..."
        />
      )}
    </>
  );
}