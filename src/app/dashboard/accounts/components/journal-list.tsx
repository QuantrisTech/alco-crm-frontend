"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllJournalEntries,
  createJournalEntry,
  getAllAccounts,
  getAllInvoices,
  getAllExpenses,
  getAllPayments,
} from "@/utils/api";

import {
  Plus,
  Loader2,
  X,
  BookOpen,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import PageHeader from "@/app/component/dashboard/page-header";
import ExportButton from "@/app/component/ui/export-button";
import InputField from "@/app/component/ui/inputField";
import Select from "@/app/component/ui/select";
import Textarea from "@/app/component/ui/textarea";
import AppDatePicker from "@/app/component/ui/app-date-picker";
import DateRangeFilter from "@/app/component/dashboard/date-range-filter";

// ── Helpers ───────────────────────────────────────────────────
const fmt = (n: number) =>
  `Rs ${(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const fmtDate = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "—";

const SOURCE_BADGE: Record<string, string> = {
  payment: "bg-green-50 text-green-700",
  invoice: "bg-blue-50 text-blue-700",
  expense: "bg-rose-50 text-rose-700",
  manual: "bg-purple-50 text-purple-700",
  refund: "bg-orange-50 text-orange-700",
  adjustment: "bg-gray-100 text-gray-600",
};

// ── Journal Line Row ──────────────────────────────────────────
function JournalLineRow({
  line, index, accounts, onChange, onRemove, canRemove,
}: {
  line: { account: string; type: "debit" | "credit"; amount: number; description: string };
  index: number;
  accounts: any[];
  onChange: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-4">
        <Select
          label=""
          placeholder="Select account"
          value={line.account}
          onChange={(e: any) => onChange(index, "account", e.target.value)}
          options={accounts.map((a: any) => ({
            label: `${a.code} — ${a.name}`,
            value: a._id,
          }))}
        />
      </div>
      <div className="col-span-2">
        <Select
          label=""
          value={line.type}
          onChange={(e: any) => onChange(index, "type", e.target.value)}
          options={[
            { label: "Debit", value: "debit" },
            { label: "Credit", value: "credit" },
          ]}
        />
      </div>
      <div className="col-span-2">
        <InputField
          label=""
          type="number"
          placeholder="Amount"
          value={String(line.amount || "")}
          onChange={(e: any) => onChange(index, "amount", Number(e.target.value))}
        />
      </div>
      <div className="col-span-3">
        <InputField
          label=""
          type="text"
          placeholder="Note (optional)"
          value={line.description}
          onChange={(e: any) => onChange(index, "description", e.target.value)}
        />
      </div>
      <div className="col-span-1 flex justify-center">
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="p-1 text-gray-400 hover:text-rose-500 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Create Journal Entry Modal ────────────────────────────────
function CreateJournalModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const emptyLine = () => ({
    account: "", type: "debit" as "debit" | "credit", amount: 0, description: "",
  });

  const [form, setForm] = useState({
    description: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    sourceType: "",
    sourceRef: "",
  });

  const [lines, setLines] = useState([emptyLine(), emptyLine()]);

  const { data: accountsData } = useQuery({
    queryKey: ["accounts-all-for-journal"],
    queryFn: () => getAllAccounts().then((r) => r.data.data),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ["journal-invoices"],
    queryFn: () => getAllInvoices({ limit: 1000 }).then((r) => r.data),
    enabled: form.sourceType === "invoice",
  });

  const { data: expensesData } = useQuery({
    queryKey: ["journal-expenses"],
    queryFn: () => getAllExpenses({ limit: 1000 }).then((r) => r.data),
    enabled: form.sourceType === "expense",
  });

  const { data: paymentsData } = useQuery({
    queryKey: ["journal-payments"],
    queryFn: () => getAllPayments({ limit: 1000 }).then((r) => r.data),
    enabled: form.sourceType === "payment",
  });

  const totalDebit = lines.filter(l => l.type === "debit").reduce((s, l) => s + (l.amount || 0), 0);
  const totalCredit = lines.filter(l => l.type === "credit").reduce((s, l) => s + (l.amount || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleLineChange = (index: number, field: string, value: any) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const { mutate, isPending } = useMutation({
    mutationFn: createJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-list"] });
      onClose();
    },
    onError: (err: any) =>
      alert(err?.response?.data?.message || "Error — check that debits equal credits"),
  });

  const handleSubmit = () => {
    if (!form.description) { alert("Description is required"); return; }
    if (!isBalanced) { alert("Debits must equal credits"); return; }
    const validLines = lines.filter(l => l.account && l.amount > 0);
    if (validLines.length < 2) { alert("At least 2 valid lines required"); return; }
    mutate({ ...form, lines: validLines });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-800">New Journal Entry</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <InputField
                label="Description *"
                type="text"
                placeholder="e.g. Month-end accrual adjustment"
                value={form.description}
                onChange={(e: any) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <AppDatePicker
              label="Date"
              required
              value={form.date}
              onChange={(value) => setForm({ ...form, date: value })}
            />

          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Select
                label="Source Type"
                placeholder="Select source type"
                value={form.sourceType}
                onChange={(e: any) =>
                  setForm({
                    ...form,
                    sourceType: e.target.value,
                    sourceRef: "",
                  })
                }
                options={[
                  { label: "Payment", value: "payment" },
                  { label: "Invoice", value: "invoice" },
                  { label: "Expense", value: "expense" },
                  { label: "Manual", value: "manual" },
                  { label: "Refund", value: "refund" },
                  { label: "Adjustment", value: "adjustment" },
                ]}
              />


            </div>
            {form.sourceType === "invoice" && (
              <Select
                label="Invoice"
                placeholder="Select invoice"
                value={form.sourceRef}
                onChange={(e: any) =>
                  setForm({ ...form, sourceRef: e.target.value })
                }
                options={(invoicesData?.data || []).map((invoice: any) => ({
                  label: `${invoice.invoiceNumber} — ${invoice.description || invoice.customer?.name || ""}`,
                  value: invoice._id,
                }))}
              />
            )}

            {form.sourceType === "expense" && (
              <Select
                label="Expense"
                placeholder="Select expense"
                value={form.sourceRef}
                onChange={(e: any) =>
                  setForm({ ...form, sourceRef: e.target.value })
                }
                options={(expensesData?.data || []).map((expense: any) => ({
                  label: `${expense.expenseNumber || expense._id} — ${expense.title || expense.description || ""}`,
                  value: expense._id,
                }))}
              />
            )}

            {form.sourceType === "payment" && (
              <Select
                label="Payment"
                placeholder="Select payment"
                value={form.sourceRef}
                onChange={(e: any) =>
                  setForm({ ...form, sourceRef: e.target.value })
                }
                options={(paymentsData?.data || []).map((payment: any) => ({
                  label: `${payment.paymentNumber || payment.referenceNumber || payment._id}`,
                  value: payment._id,
                }))}
              />
            )}
          </div>



          <div>
            <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 font-medium mb-2 px-1">
              <div className="col-span-4">Account</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-3">Note</div>
              <div className="col-span-1"></div>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <JournalLineRow
                  key={i}
                  line={line}
                  index={i}
                  accounts={accountsData || []}
                  onChange={handleLineChange}
                  onRemove={(idx) => setLines(prev => prev.filter((_, i) => i !== idx))}
                  canRemove={lines.length > 2}
                />
              ))}
            </div>
            <button
              onClick={() => setLines(prev => [...prev, emptyLine()])}
              className="mt-3 text-xs text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
            >
              <Plus size={12} /> Add Line
            </button>
          </div>

          <div className={`flex items-center justify-between rounded-xl p-3 text-sm ${isBalanced ? "bg-green-50" : totalDebit > 0 || totalCredit > 0 ? "bg-rose-50" : "bg-gray-50"}`}>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                Debit: <span className="font-semibold text-gray-800">{fmt(totalDebit)}</span>
              </span>
              <span className="text-gray-600">
                Credit: <span className="font-semibold text-gray-800">{fmt(totalCredit)}</span>
              </span>
            </div>
            {!isBalanced && (totalDebit > 0 || totalCredit > 0) ? (
              <div className="flex items-center gap-1 text-rose-600 text-xs font-semibold">
                <AlertCircle size={12} />
                Unbalanced ({fmt(Math.abs(totalDebit - totalCredit))} diff)
              </div>
            ) : isBalanced ? (
              <span className="text-green-600 text-xs font-semibold">✓ Balanced</span>
            ) : null}
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Notes</label>
            <Textarea
              label="Notes"
              rows={2}
              value={form.notes}
              onChange={(e: any) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !isBalanced}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg disabled:opacity-60 flex items-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Post Entry
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Entry Detail Expand ───────────────────────────────────────
function EntryDetail({ entry }: { entry: any }) {
  const totalDebit = entry.lines.filter((l: any) => l.type === "debit").reduce((s: number, l: any) => s + l.amount, 0);
  const totalCredit = entry.lines.filter((l: any) => l.type === "credit").reduce((s: number, l: any) => s + l.amount, 0);

  return (
    <tr>
      <td colSpan={6} className="px-5 pb-3">
        <div className="bg-gray-50 rounded-xl p-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left py-1">Account</th>
                <th className="text-left py-1">Note</th>
                <th className="text-right py-1">Debit</th>
                <th className="text-right py-1">Credit</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines.map((line: any, i: number) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="py-1.5 font-medium text-gray-700">
                    <span className="font-mono text-gray-400 mr-1">{line.account?.code}</span>
                    {line.account?.name}
                  </td>
                  <td className="py-1.5 text-gray-500">{line.description || "—"}</td>
                  <td className="py-1.5 text-right text-green-600 font-semibold">
                    {line.type === "debit" ? fmt(line.amount) : "—"}
                  </td>
                  <td className="py-1.5 text-right text-rose-500 font-semibold">
                    {line.type === "credit" ? fmt(line.amount) : "—"}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-gray-200 font-semibold text-gray-700">
                <td colSpan={2} className="py-1.5">Total</td>
                <td className="py-1.5 text-right text-green-600">{fmt(totalDebit)}</td>
                <td className="py-1.5 text-right text-rose-500">{fmt(totalCredit)}</td>
              </tr>
            </tbody>
          </table>
          {entry.notes && (
            <p className="text-xs text-gray-400 mt-2 italic">Note: {entry.notes}</p>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function JournalList() {
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState({
    search: "",
    sourceType: "",
    from: "",
    to: "",
    page: 1,
    limit: 10,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["journal-list", filters],
    queryFn: () =>
      getAllJournalEntries({
        search: filters.search || undefined,
        sourceType: filters.sourceType || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page: filters.page,
        limit: filters.limit,
      }).then((r) => r.data),
  });

  const entries = data?.data || [];

  const toggleRow = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <>
      {showCreate && <CreateJournalModal onClose={() => setShowCreate(false)} />}

      <PageHeader
        title="Journal Entries"
        subtitle={`${data?.meta?.total || 0} total entries`}
        titleIcon={<BookOpen size={24} className="text-purple-500" />}
        totalCount={data?.meta?.total || 0}
        onAdd={() => setShowCreate(true)}
        filters={filters}
        setFilters={setFilters}
        filterFields={[
          {
            type: "input",
            name: "search",
            placeholder: "Search description...",
          },
          {
            type: "select",
            name: "sourceType",
            placeholder: "All Sources",
            options: [
              { label: "Payment", value: "payment" },
              { label: "Invoice", value: "invoice" },
              { label: "Expense", value: "expense" },
              { label: "Manual", value: "manual" },
              { label: "Adjustment", value: "adjustment" },
            ],
          },
        ]}
        exportBtn={
          <>
            <DateRangeFilter
              from={filters.from}
              to={filters.to}
              onChange={(from, to) => setFilters((p) => ({ ...p, from, to, page: 1 }))}
            />
            <ExportButton
              filename="journal-entries"
              label="Export Excel"
              fetchData={async () => {
                const res = await getAllJournalEntries({ limit: 10000 });
                return res.data.data;
              }}
              columns={[
                { header: "Entry #", key: "entryNumber" },
                { header: "Description", key: "description" },
                { header: "Source", key: "sourceType" },
                { header: "Type", key: "entryType" },
                { header: "Status", key: "status" },
                { header: "Date", key: "date", format: (v) => v ? new Date(v).toLocaleDateString("en-PK") : "—" },
                { header: "Created By", key: "createdBy.name" },
              ]}
            />
          </>
        }
      />

      {/* Date range — PageHeader filterFields don't support date inputs,
          so these two stay as standalone inputs */}
      {/* <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-gray-400">Date range:</span>
        <AppDatePicker
          value={filters.from}
          onChange={(value) => setFilters({ ...filters, from: value })}
          max={filters.to || undefined}
        />
        <span className="text-xs text-gray-400">to</span>
        <AppDatePicker
          value={filters.to}
          onChange={(value) => setFilters({ ...filters, to: value })}
          min={filters.from || undefined}
        />
        {(filters.from || filters.to) && (
          <button
            onClick={() => setFilters((p) => ({ ...p, from: "", to: "" }))}
            className="text-xs text-rose-500 hover:text-rose-600"
          >
            Clear
          </button>
        )}
      </div> */}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-yellow-500" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No journal entries yet</p>
            <p className="text-xs mt-1">Entries are auto-created when payments are approved</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left px-5 py-3 w-8"></th>
                <th className="text-left px-3 py-3">Entry No.</th>
                <th className="text-left px-3 py-3">Description</th>
                <th className="text-left px-3 py-3 hidden md:table-cell">Date</th>
                <th className="text-left px-3 py-3 hidden md:table-cell">Source</th>
                <th className="text-right px-5 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry: any) => {
                const totalDebit = entry.lines
                  .filter((l: any) => l.type === "debit")
                  .reduce((s: number, l: any) => s + l.amount, 0);

                return (
                  <>
                    <tr
                      key={entry._id}
                      className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleRow(entry._id)}
                    >
                      <td className="px-5 py-3 text-gray-400">
                        {expanded[entry._id]
                          ? <ChevronDown size={14} />
                          : <ChevronRight size={14} />}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-500">
                        {entry.entryNumber}
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-800">
                        {entry.description}
                        {entry.entryType === "auto" && (
                          <span className="ml-2 text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">auto</span>
                        )}
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell text-xs text-gray-500">
                        {fmtDate(entry.date)}
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        {entry.sourceType ? (
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${SOURCE_BADGE[entry.sourceType] ||
                              "bg-gray-100 text-gray-500"
                              }`}
                          >
                            {entry.sourceType}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-800">
                        {fmt(totalDebit)}
                      </td>
                    </tr>
                    {expanded[entry._id] && <EntryDetail entry={entry} />}
                  </>
                );
              })}
            </tbody>
          </table>
        )}

        {/* ── Pagination bar ── */}
        {!isLoading && entries.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={filters.limit}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))
                }
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-yellow-400 bg-white text-gray-700"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span>
                Page {data?.meta?.page || filters.page} of{" "}
                {data?.meta?.totalPages || Math.max(1, Math.ceil((data?.meta?.total || 0) / filters.limit))}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={filters.page <= 1}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  onClick={() =>
                    setFilters((p) => {
                      const totalPages =
                        data?.meta?.totalPages ||
                        Math.max(1, Math.ceil((data?.meta?.total || 0) / p.limit));
                      return { ...p, page: Math.min(totalPages, p.page + 1) };
                    })
                  }
                  disabled={
                    filters.page >=
                    (data?.meta?.totalPages ||
                      Math.max(1, Math.ceil((data?.meta?.total || 0) / filters.limit)))
                  }
                  className="px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}