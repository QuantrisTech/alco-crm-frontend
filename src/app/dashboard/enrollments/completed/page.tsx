"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  graduateEnrollment,
  suspendEnrollment,
  reactivateEnrollment,
  getNamesPrograms,
  getAllUsersForRole,
  adminGetBatches,
  assignEnrollment,
} from "@/utils/api";
import PageHeader, { FilterField } from "@/app/component/dashboard/page-header";
import DynamicTable from "@/app/component/dashboard/dynamic-table";
import Modal from "@/app/component/ui/model/modal";
import Popup from "@/app/component/ui/popup/popup";
import { ModalField } from "@/types/ui";
import toast from "react-hot-toast";
import { BookOpen } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import ProtectedRoute from "@/app/component/protected-route";
import EnrollmentActionsPopup from "../components/enrollment-actions-popup";
import AssignLeadModal from "../../leads/components/assign-lead-modal";
import { UserBooksCell } from "../components/user-books-cell";
import { AddBookPopup } from "../components/add-book-popup";
import CollapsedCell from "../components/collapsed-cell";
import { statusColor } from "../page";
import ExportButton from "@/app/component/ui/export-button";

// ─── Badge Helpers ─────────────────────────────────────────────────────────────

const roleColor = (role: string) => {
  const map: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    super_admin: "bg-rose-100 text-rose-700",
    student: "bg-blue-100 text-blue-700",
    instructor: "bg-amber-100 text-amber-700",
    finance_manager: "bg-teal-100 text-teal-700",
  };
  return map[role] || "bg-gray-100 text-gray-600";
};

// ─── Main Content ──────────────────────────────────────────────────────────────

function ActiveEnrollmentsContent() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAppSelector((state) => state.auth);
  const isAdmin = ["admin", "super_admin"].includes(authUser?.role);
  const isSalesManager = authUser?.role === "sales_manager";
  const canAdd = isAdmin || isSalesManager;
  const canAction = isAdmin || isSalesManager;

  const [filters, setFilters] = useState<Record<string, string>>({
    status: "completed",
    search: "",
    page: "1",
    limit: "10",
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<any>(null);
  const [deletingEnrollment, setDeletingEnrollment] = useState<any>(null);
  const [graduatingEnrollment, setGraduatingEnrollment] = useState<any>(null);
  const [suspendingEnrollment, setSuspendingEnrollment] = useState<any>(null);
  const [reactivatingEnrollment, setReactivatingEnrollment] = useState<any>(null);
  const [actionsRow, setActionsRow] = useState<any>(null);
  const [assigningEnrollment, setAssigningEnrollment] = useState<any>(null);
  const [addBookUserId, setAddBookUserId] = useState<string | null>(null);

  // ── Dropdown data ─────────────────────────────────────────────────────────
  const { data: programs = [] } = useQuery({
    queryKey: ["program-names"],
    queryFn: getNamesPrograms,
  });

  const { data: usersRes } = useQuery({
    queryKey: ["all-users-role"],
    queryFn: () => getAllUsersForRole().then((r) => r.data),
  });

  const users = (usersRes?.users ?? [])
    .filter((u: any) => u.role === "user")
    .filter((u: any, idx: number, arr: any[]) =>
      arr.findIndex((x) => x._id === u._id) === idx
    );

  const { data: batchesRes } = useQuery({
    queryKey: ["batches-active"],
    queryFn: () => adminGetBatches({ status: "active" }).then((r) => r.data),
  });
  const activeBatches = batchesRes?.data ?? [];

  // ── Fields ────────────────────────────────────────────────────────────────
  const createFields: ModalField[] = [
    {
      name: "user",
      label: "Student*",
      type: "searchable-select",
      required: true,
      options: users.map((u: any) => ({
        label: `${u.name} (${u.email || u.phone || "—"})`,
        value: u._id,
      })),
    },
    {
      name: "program",
      label: "Program*",
      type: "select",
      required: true,
      options: programs.map((p: any) => ({ label: p.name, value: p._id })),
    },
    {
      name: "batch",
      label: "Batch*",
      required: true,
      type: "select",
      options: [
        { label: "— None —", value: "" },
        ...activeBatches.map((b: any) => ({ label: b.name, value: b._id })),
      ],
    },
  ];

  const editFields: ModalField[] = [
    {
      name: "progress",
      label: "Progress (%)",
      type: "input",
      inputType: "number",
      placeholder: "0-100",
    },
    {
      name: "program_id",
      label: "Program",
      type: "select",
      options: programs.map((p: any) => ({ label: p.name, value: p._id })),
    },
    {
      name: "batch_id",
      label: "Batch",
      type: "select",
      options: [
        { label: "— None —", value: "" },
        ...activeBatches.map((b: any) => ({ label: b.name, value: b._id })),
      ],
    },
  ];

  const filterFields: FilterField[] = [
    { type: "input", name: "search", placeholder: "Search..." },
  ];

  // ── Main query ────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["enrollments", filters],
    queryFn: () =>
      getAllEnrollments({
        ...filters,
        page: Number(filters.page),
        limit: Number(filters.limit),
      }).then((r) => r.data),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: addEnrollment, isPending: isAdding } = useMutation({
    mutationFn: createEnrollment,
    onSuccess: () => {
      toast.success("Enrollment created! ✅");
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed!"),
  });

  const { mutate: editEnrollment, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateEnrollment(id, data),
    onSuccess: () => {
      toast.success("Updated! ✅");
      setEditingEnrollment(null);
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: () => toast.error("Failed to update!"),
  });

  const { mutate: deleteEnroll, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteEnrollment(id),
    onSuccess: () => {
      toast.success("Deleted! 🗑️");
      setDeletingEnrollment(null);
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: () => toast.error("Failed to delete!"),
  });

  const { mutate: graduate, isPending: isGraduating } = useMutation({
    mutationFn: (id: string) => graduateEnrollment(id),
    onSuccess: () => {
      toast.success("Student graduated! 🎓");
      setGraduatingEnrollment(null);
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: () => toast.error("Failed!"),
  });

  const { mutate: suspend, isPending: isSuspending } = useMutation({
    mutationFn: (id: string) => suspendEnrollment(id),
    onSuccess: () => {
      toast.success("Enrollment suspended!");
      setSuspendingEnrollment(null);
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: () => toast.error("Failed!"),
  });

  const { mutate: reactivate, isPending: isReactivating } = useMutation({
    mutationFn: (id: string) => reactivateEnrollment(id),
    onSuccess: () => {
      toast.success("Enrollment reactivated! ✅");
      setReactivatingEnrollment(null);
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: () => toast.error("Failed!"),
  });

  const { mutate: assignEnrollmentMutate, isPending: isAssigning } = useMutation({
    mutationFn: ({ id, assigned_to }: { id: string; assigned_to: string }) =>
      assignEnrollment(id, assigned_to),
    onSuccess: () => {
      toast.success("Enrollment assigned successfully");
      setAssigningEnrollment(null);
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to assign enrollment"),
  });

  const currentPage = Number(filters.page);
  const limit = Number(filters.limit);

  const handlePageChange = (newPage: number) =>
    setFilters((prev) => ({ ...prev, page: String(newPage) }));

  const enrolledCombinations = new Set(
    (data?.data ?? []).flatMap((row: any) =>
      row.enrollments.map((e: any) => `${row.user?._id}_${e.program?._id}`)
    )
  );

  const handleAddEnrollment = (formData: any) => {
    const key = `${formData.user}_${formData.program}`;
    if (enrolledCombinations.has(key)) {
      toast.error("User is already enrolled in this program!");
      return;
    }
    addEnrollment(formData);
  };

  return (
    <>
      <PageHeader
        title="Completed Enrollments"
        subtitle="Students who have completed their programs"
        titleIcon={<BookOpen size={24} />}
        totalCount={data?.meta?.total ?? 0}
        exportBtn={
          <ExportButton
            filename="enrollments-completed"
            label="Export Excel"
            fetchData={async () => {
              const res = await getAllEnrollments({ limit: 10000, status: "completed" });
              return res.data.data;
            }}
            columns={[
              { header: "Student", key: "user.name" },
              { header: "Email", key: "user.email" },
              { header: "Phone", key: "user.phone" },
              { header: "Program", key: "program.name" },
              { header: "Batch", key: "batch.name" },
              { header: "Completed At", key: "updatedAt", format: (v) => v ? new Date(v).toLocaleDateString("en-PK") : "—" },
            ]}
          />
        }
      // onAdd={canAdd ? () => setIsAddOpen(true) : undefined}
      // filters={filters}
      // setFilters={(newFilters) =>
      //   // ✅ FIX: status: "active" preserve karo, search/page properly merge ho
      //   setFilters((prev) => ({ ...prev, ...newFilters, status: "active" }))
      // }
      // filterFields={filterFields}
      />

      <DynamicTable
        data={data?.data || []}
        currentPage={currentPage}
        pageSize={limit}
        isLoading={isLoading}
        isError={isError}
        hideToggle={false}
        totalPages={data?.meta?.totalPages}
        onPageChange={handlePageChange}
        columns={[
          {
            key: "user",
            label: "Student",
            minWidth: "180px",
            render: (row) => (
              <div>
                <p className="font-medium text-gray-800">{row.user?.name || "—"}</p>
                <p className="text-xs text-gray-400">{row.user?.email}</p>
              </div>
            ),
          },
          {
            key: "role",
            label: "Role",
            render: (row) => (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColor(row.user?.role)}`}>
                {row.user?.role || "—"}
              </span>
            ),
          },
          {
            key: "books",
            label: "Books",
            minWidth: "140px",
            render: (row) => <UserBooksCell userId={row.user?._id} />,
          },
          {
            key: "enrollments",
            label: "Programs",
            minWidth: "200px",
            render: (row) => (
              <CollapsedCell
                items={row.enrollments.map((e: any) => (
                  <div key={e._id} className="relative ">
                    <p className="text-sm font-medium text-gray-700 leading-tight">
                      {e.program?.name || "—"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {e.batch?.name || "No Batch"}
                    </p>
                    {e.assigned_to ? (
                      <div className="flex gap-2">
                        <p className="py-1 text-[10px]">
                          Assigned To
                        </p>
                        <p className="px-2 py-1 text-[10px] rounded bg-indigo-100 text-indigo-600">
                          {e.assigned_to.name}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssigningEnrollment(e)}
                        className="px-2 py-1 text-[10px] rounded bg-yellow-100 text-yellow-700"
                      >
                        not assigned
                      </button>
                    )}
                    <div
                      key={e._id}
                      className={`px-2.5 py-0.5 rounded text-[10px] font-medium w-fit ${statusColor(e.status)} mt-0.5`}
                    >
                      {e.status}
                    </div>
                  </div>

                ))}
                minWidth="w-[300px]"
                tooltipWidth="w-64"
              />
            ),
          },
          {
            key: "enrolledAt",
            label: "Enrolled",
            render: (row) => (
              <span className="text-gray-400 text-sm">
                {row.enrollments[0]?.enrolledAt
                  ? new Date(row.enrollments[0].enrolledAt).toLocaleDateString()
                  : "—"}
              </span>
            ),
          },
        ]}
        actions={canAction ? [
          {
            icon: <BookOpen size={14} />,
            label: "Actions",
            onClick: (row) => setActionsRow(row),
            className: "hover:bg-blue-50 hover:text-blue-600",
          },
        ] : []}
      />

      <Modal
        key={isAddOpen ? "open" : "closed"}
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create Enrollment"
        fields={createFields}
        onSubmit={handleAddEnrollment}
        isLoading={isAdding}
        mode="add"
      />

      {editingEnrollment && (
        <Modal
          isOpen={!!editingEnrollment}
          onClose={() => setEditingEnrollment(null)}
          title="Edit Enrollment"
          subtitle={editingEnrollment.user?.name}
          fields={editFields}
          initialValues={{
            progress: editingEnrollment.progress || 0,
            batch_id: editingEnrollment.batch?._id || editingEnrollment.batch || "",
            program_id: editingEnrollment.program?._id || editingEnrollment.program || "",
          }}
          onSubmit={(data) => editEnrollment({ id: editingEnrollment._id, data })}
          isLoading={isUpdating}
          mode="edit"
        />
      )}

      {graduatingEnrollment && (
        <Popup
          isOpen={!!graduatingEnrollment}
          onClose={() => setGraduatingEnrollment(null)}
          onConfirm={() => graduate(graduatingEnrollment._id)}
          variant="info"
          title="Graduate Student"
          description={<>Mark <span className="font-bold text-teal-600">{graduatingEnrollment.user?.name}</span> as graduated?</>}
          confirmText="Yes, Graduate 🎓"
          isLoading={isGraduating}
          loadingText="Processing..."
        />
      )}

      {suspendingEnrollment && (
        <Popup
          isOpen={!!suspendingEnrollment}
          onClose={() => setSuspendingEnrollment(null)}
          onConfirm={() => suspend(suspendingEnrollment._id)}
          variant="danger"
          title="Suspend Enrollment"
          description={<>Suspend enrollment of <span className="font-bold text-yellow-600">{suspendingEnrollment.user?.name}</span>?</>}
          confirmText="Yes, Suspend"
          isLoading={isSuspending}
          loadingText="Suspending..."
        />
      )}

      {reactivatingEnrollment && (
        <Popup
          isOpen={!!reactivatingEnrollment}
          onClose={() => setReactivatingEnrollment(null)}
          onConfirm={() => reactivate(reactivatingEnrollment._id)}
          variant="info"
          title="Reactivate Enrollment"
          description={<>Reactivate enrollment of <span className="font-bold text-green-600">{reactivatingEnrollment.user?.name}</span>?</>}
          confirmText="Yes, Reactivate"
          isLoading={isReactivating}
          loadingText="Reactivating..."
        />
      )}

      {deletingEnrollment && (
        <Popup
          isOpen={!!deletingEnrollment}
          onClose={() => setDeletingEnrollment(null)}
          onConfirm={() => deleteEnroll(deletingEnrollment._id)}
          variant="danger"
          title="Delete Enrollment"
          description={<>Delete enrollment of <span className="font-bold text-rose-500">{deletingEnrollment.user?.name}</span>? This cannot be undone.</>}
          confirmText="Yes, Delete"
          isLoading={isDeleting}
          loadingText="Deleting..."
        />
      )}

      {actionsRow && (
        <EnrollmentActionsPopup
          row={actionsRow}
          isAdmin={isAdmin}
          onGraduate={(e) => setGraduatingEnrollment(e)}
          onSuspend={(e) => setSuspendingEnrollment(e)}
          onReactivate={(e) => setReactivatingEnrollment(e)}
          onDelete={(e) => setDeletingEnrollment(e)}
          onClose={() => setActionsRow(null)}
          onEdit={(e) => setEditingEnrollment(e)}
          onAddBook={(userId) => setAddBookUserId(userId)}
        />
      )}

      {addBookUserId && (
        <AddBookPopup userId={addBookUserId} onClose={() => setAddBookUserId(null)} />
      )}

      {assigningEnrollment && (
        <AssignLeadModal
          lead={{
            assigned_to: assigningEnrollment.assigned_to,
            first_name: assigningEnrollment.user?.name,
            email: assigningEnrollment.user?.email,
          }}
          currentUserRole={authUser.role}
          isLoading={isAssigning}
          onClose={() => setAssigningEnrollment(null)}
          onAssign={(userId) =>
            assignEnrollmentMutate({ id: assigningEnrollment._id, assigned_to: userId })
          }
        />
      )}
    </>
  );
}

export default function ActiveEnrollmentsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "finance_manager", "sales_manager", "sales_rep"]}>
      <ActiveEnrollmentsContent />
    </ProtectedRoute>
  );
}
