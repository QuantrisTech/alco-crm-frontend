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

// ── Constants ─────────────────────────────────────────────────
const CATEGORIES = [
  "salary", "marketing", "utilities", "rent",
  "software", "travel", "equipment", "training", "other",
];

const PAYMENT_METHODS = ["cash", "bank", "cheque", "online"];

const STATUS_STYLES: Record<string, string> = {
  pending_approval: "bg-yellow-50 text-yellow-700",
  approved:         "bg-green-50 text-green-700",
  rejected:         "bg-rose-50 text-rose-700",
  draft:            "bg-gray-100 text-gray-500",
};

const STATUS_ICONS: Record<string, any> = {
  pending_approval: Clock,
  approved:         CheckCircle,
  rejected:         XCircle,
  draft:            Clock,
};

const fmt = (n: number) =>
  `Rs ${(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Create Expense Modal ──────────────────────────────────────
function CreateExpenseModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: 0,
    account: "",
    category: "other",
    paymentMethod: "cash",
    referenceNumber: "",
    date: new Date().toISOString().split("T")[0],
    vendorName: "",
    notes: "",
    isRecurring: false,
    recurringInterval: "",
  });

  const { data: accountsData } = useQuery({
    queryKey: ["accounts-expense-only"],
    queryFn: () =>
      getAllAccounts({ type: "expense" }).then((r) => r.data.data),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses-list"] });
      onClose();
    },
    onError: (err: any) =>
      alert(err?.response?.data?.message || "Error creating expense"),
  });

  const handleSubmit = () => {
    if (!form.title || !form.amount || !form.account || !form.category || !form.paymentMethod) {
      alert("Please fill all required fields");
      return;
    }
    mutate({
      title:             form.title,
      description:       form.description,
      amount:            Number(form.amount),
      account:           form.account,
      category:          form.category,
      paymentMethod:     form.paymentMethod,
      referenceNumber:   form.referenceNumber || undefined,
      date:              form.date,
      vendor:            form.vendorName ? { name: form.vendorName } : undefined,
      notes:             form.notes,
      isRecurring:       form.isRecurring,
      recurringInterval: form.isRecurring ? form.recurringInterval : undefined,
    } as any);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-800">New Expense</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Title *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                placeholder="e.g. Office Rent - June"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Amount (Rs) *</label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                placeholder="0"
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date *</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Expense Account *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
              >
                <option value="">Select account...</option>
                {(accountsData || []).map((a: any) => (
                  <option key={a._id} value={a._id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Payment Method *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Reference No.</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                placeholder="Cheque / transfer ref"
                value={form.referenceNumber}
                onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Vendor Name</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
              placeholder="Optional"
              value={form.vendorName}
              onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <textarea
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="recurring"
              checked={form.isRecurring}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="recurring" className="text-sm text-gray-600">Recurring Expense</label>
            {form.isRecurring && (
              <select
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-yellow-400 ml-auto"
                value={form.recurringInterval}
                onChange={(e) => setForm({ ...form, recurringInterval: e.target.value })}
              >
                <option value="">Select interval</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold rounded-lg disabled:opacity-60 flex items-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Add Expense
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject Modal ──────────────────────────────────────────────
function RejectModal({ expenseId, onClose }: { expenseId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () => rejectExpense(expenseId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses-list"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">Reject Expense</h3>
        <textarea
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 resize-none"
          placeholder="Reason for rejection..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button
            onClick={() => mutate()}
            disabled={isPending || !reason.trim()}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-lg disabled:opacity-60 flex items-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

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
        status:   filters.status   || undefined,
        category: filters.category || undefined,
      }).then((r) => r.data),
  });

  const { mutate: approve } = useMutation({
    mutationFn: approveExpense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses-list"] }),
    onError: (err: any) => alert(err?.response?.data?.message || "Error"),
  });

  const expenses      = data?.data || [];
  const totalApproved = data?.meta?.totalApprovedAmount || 0;
  const pendingCount  = expenses.filter((e: any) => e.status === "pending_approval").length;

  return (
    <>
      {showCreate && <CreateExpenseModal onClose={() => setShowCreate(false)} />}
      {rejectId   && <RejectModal expenseId={rejectId} onClose={() => setRejectId(null)} />}

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
              { label: "Pending",  value: "pending_approval" },
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