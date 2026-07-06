"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllInvoices,
  getMyInvoices,
  createInvoice,
  updateInvoice,
  sendReceivingInvoiceEmail,
  sendInvoiceEmail,
  getSalesRoleInvoices
} from "@/utils/api";
import PageHeader, { FilterField } from "@/app/component/dashboard/page-header";
import DynamicTable from "@/app/component/dashboard/dynamic-table";
import Modal from "@/app/component/ui/model/modal";
import { ModalField } from "@/types/ui";
import toast from "react-hot-toast";
import { FileText, CheckCircle, Pencil, ListOrdered, Eye, Send, View } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import InstallmentPaymentModal from "../component/installment-payment-modal";
import EditInstallmentsModal from "../component/edit-installments-modal";
import { InvoiceViewModal } from "../component/invoice-receiving-list";
import SendReceiptModal from "../component/send-receipt-modal";
import CreateInvoiceModal from "../component/create-invoice-modal";
import ExportButton from "@/app/component/ui/export-button";
import DateRangeFilter from "@/app/component/dashboard/date-range-filter";
import { deleteInvoice } from "@/utils/api";
import { Trash2 } from "lucide-react";
import DeleteInvoiceModal from "../component/delete-invoice-modal";

// ── Status badge colors ──────────────────────────────────────────
const statusColor = (status: string) => {
  const map: Record<string, string> = {
    PAID: "bg-green-100 text-green-700",
    PARTIAL: "bg-yellow-100 text-yellow-700",
    PENDING: "bg-sky-100 text-sky-700",
    OVERDUE: "bg-rose-100 text-rose-700",
    BLOCKED: "bg-gray-100 text-gray-600",
    EXTENDED: "bg-indigo-100 text-indigo-700",
    WARNING: "bg-orange-100 text-orange-700",
  };
  return map[status] || "bg-gray-100 text-gray-600";
};

// ── Modal Fields ─────────────────────────────────────────────────
const createFields: ModalField[] = [
  { name: "user", label: "User ID", type: "input", inputType: "text", placeholder: "MongoDB ObjectId" },
  { name: "enrollment", label: "Enrollment ID", type: "input", inputType: "text", placeholder: "MongoDB ObjectId" },
  { name: "totalAmount", label: "Total Amount (Rs)", type: "input", inputType: "number", placeholder: "50000" },
  { name: "dueDate", label: "Due Date", type: "input", inputType: "date" },
];

const editFields: ModalField[] = [
  { name: "dueDate", label: "Due Date", type: "input", inputType: "date" },
  {
    name: "status", label: "Status", type: "select",
    options: [
      { label: "Pending", value: "PENDING" },
      { label: "Partial", value: "PARTIAL" },
      { label: "Paid", value: "PAID" },
      { label: "Overdue", value: "OVERDUE" },
      { label: "Extended", value: "EXTENDED" },
      { label: "Blocked", value: "BLOCKED" },
    ],
  },
];

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAppSelector((state) => state.auth);

  const isStudent = authUser?.role === "user";
  const isAdmin = ["admin", "super_admin", "finance_manager"].includes(authUser?.role || "");
  const isSalesManager = authUser?.role === "sales_manager";
  const isSalesRep = authUser?.role === "sales_rep";
  const canDelete = ["admin", "super_admin"].includes(authUser?.role || "");
  const [deletingInvoice, setDeletingInvoice] = useState<any>(null);

  const [filters, setFilters] = useState({ status: "", search: "", page: "1", limit: "10", dateFrom: "", dateTo: "" });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [installmentInvoice, setInstallmentInvoice] = useState<any>(null);
  const [editInstallmentInvoice, setEditInstallmentInvoice] = useState<any>(null); // ← NEW

  const filterFields: FilterField[] = isAdmin
    ? [
      { type: "input", name: "search", placeholder: "Search student name, email..." },
      {
        type: "select", name: "status",
        options: [
          { label: "Pending", value: "PENDING" },
          { label: "Partial", value: "PARTIAL" },
          { label: "Paid", value: "PAID" },
          { label: "Overdue", value: "OVERDUE" },
          { label: "Extended", value: "EXTENDED" },
          { label: "Blocked", value: "BLOCKED" },
        ],
      },
    ]
    : [
      {
        type: "select", name: "status",
        options: [
          { label: "Pending", value: "PENDING" },
          { label: "Partial", value: "PARTIAL" },
          { label: "Paid", value: "PAID" },
          { label: "Overdue", value: "OVERDUE" },
        ],
      },
    ];

  // const { data, isLoading, isError } = useQuery({
  //   queryKey: isStudent ? ["my-invoices"] : ["invoices", filters],
  //   queryFn: isStudent
  //     ? () => getMyInvoices().then((r) => r.data)
  //     : () => getAllInvoices({ ...filters, page: Number(filters.page), limit: Number(filters.limit) }).then((r) => r.data),
  // });

  // const { data, isLoading, isError } = useQuery({
  //   queryKey: isStudent
  //     ? ["my-invoices"]
  //     : isSalesManager
  //       ? ["sales-manager-invoices", filters]
  //       : ["invoices", filters],
  //   queryFn: isStudent
  //     ? () => getMyInvoices().then((r) => r.data)
  //     : isSalesManager
  //       ? () => getSalesRoleInvoices({ ...filters, page: Number(filters.page), limit: Number(filters.limit) }).then((r) => r.data)
  //       : () => getAllInvoices({ ...filters, page: Number(filters.page), limit: Number(filters.limit) }).then((r) => r.data),
  // });

  const { data, isLoading, isError } = useQuery({
    queryKey: isStudent
      ? ["my-invoices"]
      : (isSalesManager || isSalesRep)
        ? ["sales-role-invoices", filters]
        : ["invoices", filters],
    queryFn: isStudent
      ? () => getMyInvoices().then((r) => r.data)
      : (isSalesManager || isSalesRep)
        ? () => getSalesRoleInvoices({ ...filters, page: Number(filters.page), limit: Number(filters.limit) }).then((r) => r.data)
        : () => getAllInvoices({ ...filters, page: Number(filters.page), limit: Number(filters.limit) }).then((r) => r.data),
  });

  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);

  const handleSendInvoice = async (invoiceId: string) => {
    setIsSendingInvoice(true);
    try {
      await sendInvoiceEmail(invoiceId);
      toast.success("Invoice email bhej diya gaya ✅");
    } catch {
      toast.error("Email send nahi hui ❌");
    } finally {
      setIsSendingInvoice(false);
    }
  };

  const { mutate: addInvoice, isPending: isAdding } = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      toast.success("Invoice created!");
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed!"),
  });

  const { mutate: editInvoice, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateInvoice(id, data),
    onSuccess: () => {
      toast.success("Invoice updated!");
      setEditingInvoice(null);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => toast.error("Failed to update!"),
  });

  const { mutate: removeInvoice, isPending: isDeleting } = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => deleteInvoice(id, reason),
    onSuccess: () => {
      toast.success("Invoice cancelled — payments voided, journal reversed");
      setDeletingInvoice(null);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Delete failed!"),
  });

  const handleDeleteInvoice = (inv: any) => {
    const reason = window.prompt("Cancellation reason (optional):") || undefined;
    if (!window.confirm(`Sure cancel invoice ${inv.invoiceNumber}? Sab payments void ho jayenge.`)) return;
    removeInvoice({ id: inv._id, reason });
  };

  const invoiceList = isStudent ? (data?.data ?? data ?? []) : (data?.data ?? []);
  const totalCount = isStudent ? invoiceList.length : (data?.meta?.total ?? 0);

  return (
    <>
      <PageHeader
        title={isStudent ? "My Invoices" : "Invoices"}
        subtitle={isStudent ? "Apni payment history aur pending dues dekhein" : "Manage all student invoices"}
        titleIcon={<FileText size={24} />}
        totalCount={totalCount}
        {...(isAdmin && { onAdd: () => setIsAddOpen(true) })}
        filters={filters}
        setFilters={setFilters}
        filterFields={filterFields}

        exportBtn={
          <div className="flex items-center gap-2">
            <DateRangeFilter
              from={filters.dateFrom}
              to={filters.dateTo}
              onChange={(from, to) =>
                setFilters((f) => ({ ...f, dateFrom: from, dateTo: to, page: "1" }))
              }
            />
            <ExportButton
              filename="invoices"
              label="Export Excel"
              fetchData={async () => {
                const res = await getAllInvoices({
                  limit: 10000,
                  status: filters.status,
                  search: filters.search,
                  dateFrom: filters.dateFrom,
                  dateTo: filters.dateTo,
                });
                return res.data.data;
              }}

              columns={[
                { header: "Invoice #", key: "invoiceNumber" },
                { header: "Student", key: "user.name" },
                { header: "Email", key: "user.email" },
                { header: "Program", key: "enrollment.program.name" },
                { header: "Total (Rs)", key: "totalAmount", format: (v) => Number(v || 0).toLocaleString() },
                { header: "Paid (Rs)", key: "paidAmount", format: (v) => Number(v || 0).toLocaleString() },
                { header: "Remaining (Rs)", key: "remainingAmount", format: (v) => Number(v || 0).toLocaleString() },
                { header: "Status", key: "status" },
                { header: "Due Date", key: "dueDate", format: (v) => v ? new Date(v).toLocaleDateString("en-PK") : "—" },
                { header: "Created At", key: "createdAt", format: (v) => v ? new Date(v).toLocaleDateString("en-PK") : "—" },
              ]}
            />
          </div>
        }
      />

      <DynamicTable
        data={invoiceList}
        isLoading={isLoading}
        isError={isError}
        currentPage={data?.meta?.page || 1}
        pageSize={data?.meta?.limit || 10}
        columns={[
          ...(isAdmin
            ? [{
              key: "user", label: "Student",
              render: (inv: any) => (
                <div>
                  <p className="font-medium text-sm text-gray-800">{inv.user?.name || "—"}</p>
                  <p className="text-xs text-gray-400">{inv.user?.email || ""}</p>
                </div>
              ),
            }]
            : []),
          {
            key: "program", label: "Program",
            render: (inv: any) => (
              <span className="text-sm text-gray-600">{inv.enrollment?.program?.name || "—"}</span>
            ),
          },
          {
            key: "totalAmount", label: "Total",
            render: (inv: any) => (
              <span className="font-semibold text-sm text-gray-800">Rs {(inv.totalAmount || 0).toLocaleString()}</span>
            ),
          },
          {
            key: "paidAmount", label: "Paid",
            render: (inv: any) => (
              <span className="text-green-600 font-medium text-sm">Rs {(inv.paidAmount || 0).toLocaleString()}</span>
            ),
          },
          {
            key: "remainingAmount", label: "Remaining",
            render: (inv: any) => (
              <span className={`font-medium text-sm ${(inv.remainingAmount || 0) > 0 ? "text-rose-500" : "text-green-600"}`}>
                Rs {(inv.remainingAmount || 0).toLocaleString()}
              </span>
            ),
          },
          {
            key: "status", label: "Status",
            render: (inv: any) => (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(inv.status)}`}>
                {inv.status}
              </span>
            ),
          },
          {
            key: "dueDate", label: "Due Date",
            render: (inv: any) => (
              <span className="text-gray-500 text-sm">
                {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-PK") : "—"}
              </span>
            ),
          },
          ...(isStudent
            ? [{
              key: "payments", label: "Payments Made",
              render: (inv: any) => (
                <span className="text-sm text-gray-600">
                  {inv.payments?.length ? `${inv.payments.length} payment(s)` : "None yet"}
                </span>
              ),
            }]
            : []),
        ]}
        // invoices/page.tsx — actions array (complete)
        // actions={
        //   isAdmin
        //     ? [
        //       {
        //         icon: <ListOrdered size={14} />,
        //         label: "Edit Installments",
        //         onClick: (inv: any) => setEditInstallmentInvoice(inv),
        //         className: "hover:bg-indigo-50 hover:text-indigo-600",
        //       },
        //       {
        //         icon: <CheckCircle size={14} />,
        //         label: "Pay Installments",
        //         onClick: (inv: any) => setInstallmentInvoice(inv),
        //         className: "hover:bg-green-50 hover:text-green-600",
        //         hidden: (inv: any) => inv.status === "PAID",
        //       },
        //       {
        //         icon: <Eye size={14} />,
        //         label: "View Invoice",
        //         onClick: (inv: any) => setViewInvoice(inv),
        //         className: "hover:bg-blue-50 hover:text-blue-600",
        //         disabled: () => isSendingInvoice,
        //       },
        //       {
        //         icon: <Send size={14} />,
        //         label: "Send Invoice",
        //         onClick: (inv: any) => handleSendInvoice(inv._id),
        //         className: "hover:bg-yellow-50 hover:text-yellow-600",
        //       },
        //     ]
        //     : []
        // }

        actions={
          isAdmin
            ? [
              {
                icon: <ListOrdered size={14} />,
                label: "Edit Installments",
                onClick: (inv: any) => setEditInstallmentInvoice(inv),
                className: "hover:bg-indigo-50 hover:text-indigo-600",
              },
              {
                icon: <CheckCircle size={14} />,
                label: "Pay Installments",
                onClick: (inv: any) => setInstallmentInvoice(inv),
                className: "hover:bg-green-50 hover:text-green-600",
                hidden: (inv: any) => inv.status === "PAID",
              },
              {
                icon: <Eye size={14} />,
                label: "View Invoice",
                onClick: (inv: any) => setViewInvoice(inv),
                className: "hover:bg-blue-50 hover:text-blue-600",
                disabled: () => isSendingInvoice,
              },
              {
                icon: <Send size={14} />,
                label: "Send Invoice",
                onClick: (inv: any) => handleSendInvoice(inv._id),
                className: "hover:bg-yellow-50 hover:text-yellow-600",
              },
              ...(canDelete
                ? [{
                  icon: <Trash2 size={14} />,
                  label: "Delete Invoice",
                  onClick: (inv: any) => setDeletingInvoice(inv),
                  className: "hover:bg-red-50 hover:text-red-600",
                  hidden: (inv: any) => inv.status === "CANCELLED",
                }]
                : []),
            ]
            : (isSalesManager || isSalesRep)
              ? [
                {
                  icon: <Eye size={14} />,
                  label: "View Invoice",
                  onClick: (inv: any) => setViewInvoice(inv),
                  className: "hover:bg-blue-50 hover:text-blue-600",
                },
              ]
              : []
        }
      />

      {isAdmin && (
        <>

          <CreateInvoiceModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

          {/* <Modal
            isOpen={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            title="Create Invoice"
            fields={createFields}
            onSubmit={addInvoice}
            isLoading={isAdding}
            mode="add"
          /> */}

          {editingInvoice && (
            <Modal
              isOpen={!!editingInvoice}
              onClose={() => setEditingInvoice(null)}
              title="Edit Invoice"
              fields={editFields}
              initialValues={{
                dueDate: editingInvoice.dueDate?.split("T")[0] || "",
                status: editingInvoice.status,
              }}
              onSubmit={(data) => editInvoice({ id: editingInvoice._id, data })}
              isLoading={isUpdating}
              mode="edit"
            />
          )}

          <InvoiceViewModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} />

          {/* Pay installments modal */}
          <InstallmentPaymentModal
            invoice={installmentInvoice}
            onClose={() => setInstallmentInvoice(null)}
          />

          {/* Edit/Add installments modal — NEW */}
          <EditInstallmentsModal
            invoice={editInstallmentInvoice}
            onClose={() => setEditInstallmentInvoice(null)}
          />

          <DeleteInvoiceModal
            invoice={deletingInvoice}
            onClose={() => setDeletingInvoice(null)}
            isLoading={isDeleting}
            onConfirm={(reason) => removeInvoice({ id: deletingInvoice._id, reason })}
          />
        </>
      )}
    </>
  );
}
