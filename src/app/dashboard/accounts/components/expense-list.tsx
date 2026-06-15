"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllExpenses,
  createExpense,
  approveExpense,
  rejectExpense,
  getAllAccounts,
} from "@/utils/api";
import {
  Plus,
  Loader2,
  X,
  CheckCircle,
  XCircle,
  Clock,
  TrendingDown,
} from "lucide-react";
import PageHeader from "@/app/component/dashboard/page-header";
import CreateExpenseModal from "./create-expense-modal";
import RejectModal from "./reject-modal";
import ExportButton from "@/app/component/ui/export-button";

// ── Constants ─────────────────────────────────────────────────
const CATEGORIES = [
  "salary", "marketing", "utilities", "rent",
  "software", "travel", "equipment", "training", "other",
];

const PAYMENT_METHODS = ["cash", "bank", "cheque", "online"];

const STATUS_STYLES: Record<string, string> = {
  pending_approval: "bg-yellow-50 text-yellow-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-rose-50 text-rose-700",
  draft: "bg-gray-100 text-gray-500",
};

const STATUS_ICONS: Record<string, any> = {
  pending_approval: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  draft: Clock,
};

const fmt = (n: number) =>
  `Rs ${(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Main Component ────────────────────────────────────────────
export default function ExpenseList() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "", category: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["expenses-list", filters],
    queryFn: () =>
      getAllExpenses({
        status: filters.status || undefined,
        category: filters.category || undefined,
      }).then((r) => r.data),
  });

  const { mutate: approve } = useMutation({
    mutationFn: approveExpense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses-list"] }),
    onError: (err: any) => alert(err?.response?.data?.message || "Error"),
  });

  const expenses = data?.data || [];
  const totalApproved = data?.meta?.totalApprovedAmount || 0;
  const pendingCount = expenses.filter((e: any) => e.status === "pending_approval").length;

  return (
    <>
      {showCreate && <CreateExpenseModal onClose={() => setShowCreate(false)} />}
      {rejectId && <RejectModal expenseId={rejectId} onClose={() => setRejectId(null)} />}

      <PageHeader
        title="Expenses"
        subtitle={`${data?.meta?.total || 0} total · ${pendingCount} pending approval`}
        titleIcon={<TrendingDown size={24} className="text-rose-500" />}
        totalCount={data?.meta?.total || 0}
        onAdd={() => setShowCreate(true)}
        filters={filters}
        setFilters={setFilters}
        filterFields={[
          {
            type: "select",
            name: "status",
            placeholder: "All Status",
            options: [
              { label: "Pending", value: "pending_approval" },
              { label: "Approved", value: "approved" },
              { label: "Rejected", value: "rejected" },
            ],
          },
          {
            type: "select",
            name: "category",
            placeholder: "All Categories",
            options: CATEGORIES.map((c) => ({
              label: c.charAt(0).toUpperCase() + c.slice(1),
              value: c,
            })),
          },
        ]}
        exportBtn={
          <ExportButton
            filename="expenses"
            label="Export Excel"
            fetchData={async () => {
              const res = await getAllExpenses({ limit: 10000 });
              return res.data.data;
            }}
            columns={[
              { header: "Expense #", key: "expenseNumber" },
              { header: "Title", key: "title" },
              { header: "Category", key: "category" },
              { header: "Amount (Rs)", key: "amount", format: (v) => Number(v || 0).toLocaleString() },
              { header: "Method", key: "paymentMethod" },
              { header: "Vendor", key: "vendor.name" },
              { header: "Status", key: "status" },
              { header: "Date", key: "date", format: (v) => v ? new Date(v).toLocaleDateString("en-PK") : "—" },
              { header: "Created By", key: "createdBy.name" },
              { header: "Reference #", key: "referenceNumber" },
            ]}
          />
        }
      />

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total Approved</p>
          <p className="text-lg font-bold text-gray-800 mt-1">{fmt(totalApproved)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Pending Approval</p>
          <p className="text-lg font-bold text-yellow-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total Entries</p>
          <p className="text-lg font-bold text-gray-800 mt-1">{data?.meta?.total || 0}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-yellow-500" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <TrendingDown size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No expenses found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left px-5 py-3">Expense</th>
                <th className="text-left px-3 py-3 hidden md:table-cell">Category</th>
                <th className="text-left px-3 py-3 hidden md:table-cell">Date</th>
                <th className="text-left px-3 py-3 hidden lg:table-cell">Method</th>
                <th className="text-right px-3 py-3">Amount</th>
                <th className="text-center px-3 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp: any) => {
                const StatusIcon = STATUS_ICONS[exp.status] || Clock;
                return (
                  <tr key={exp._id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{exp.title}</p>
                      {exp.vendor?.name && (
                        <p className="text-xs text-gray-400">{exp.vendor.name}</p>
                      )}
                      {exp.isRecurring && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                          recurring
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell text-xs text-gray-500 capitalize">
                      {exp.category}
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell text-xs text-gray-500">
                      {fmtDate(exp.date)}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell text-xs text-gray-500 capitalize">
                      {exp.paymentMethod}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-gray-800">
                      {fmt(exp.amount)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[exp.status]}`}>
                        <StatusIcon size={10} />
                        {exp.status === "pending_approval" ? "Pending" : exp.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {exp.status === "pending_approval" && (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => approve(exp._id)}
                            className="p-1.5 hover:bg-green-50 rounded-lg text-green-500 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            onClick={() => setRejectId(exp._id)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors"
                            title="Reject"
                          >
                            <XCircle size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}