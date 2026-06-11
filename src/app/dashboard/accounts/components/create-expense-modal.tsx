"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createExpense, getAllAccounts } from "@/utils/api";
import { Loader2, X } from "lucide-react";
import InputField from "@/app/component/ui/inputField";
import Select from "@/app/component/ui/select";

// ── Constants ─────────────────────────────────────────────────
const CATEGORIES = [
  "salary", "marketing", "utilities", "rent",
  "software", "travel", "equipment", "training", "other",
];

const PAYMENT_METHODS = ["cash", "bank", "cheque", "online"];

const RECURRING_INTERVALS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export default function CreateExpenseModal({ onClose }: { onClose: () => void }) {
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
    queryFn: () => getAllAccounts({ type: "expense" }).then((r) => r.data.data),
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

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

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

  // Build option arrays for Select
  const categoryOptions = CATEGORIES.map((c) => ({
    value: c,
    label: c.charAt(0).toUpperCase() + c.slice(1),
  }));

  const paymentOptions = PAYMENT_METHODS.map((m) => ({
    value: m,
    label: m.charAt(0).toUpperCase() + m.slice(1),
  }));

  const accountOptions = (accountsData || []).map((a: any) => ({
    value: a._id,
    label: `${a.code} — ${a.name}`,
  }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-800">New Expense</h2>
          <button onClick={onClose}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">

          {/* Row 1 — Title */}
          <InputField
            label="Title *"
            placeholder="e.g. Office Rent - June"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />

          {/* Row 2 — Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Amount (Rs) *"
              type="number"
              placeholder="0"
              value={form.amount || ""}
              onChange={(e) => set("amount", e.target.value)}
            />
            <InputField
              label="Date *"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>

          {/* Row 3 — Category + Account */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category *"
              options={categoryOptions}
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            />
            <Select
              label="Expense Account *"
              options={accountOptions}
              value={form.account}
              placeholder="Select account..."
              onChange={(e) => set("account", e.target.value)}
            />
          </div>

          {/* Row 4 — Payment Method + Reference No */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Payment Method *"
              options={paymentOptions}
              value={form.paymentMethod}
              onChange={(e) => set("paymentMethod", e.target.value)}
            />
            <InputField
              label="Reference No."
              placeholder="Cheque / transfer ref"
              value={form.referenceNumber}
              onChange={(e) => set("referenceNumber", e.target.value)}
            />
          </div>

          {/* Row 5 — Vendor */}
          <InputField
            label="Vendor Name"
            placeholder="Optional"
            value={form.vendorName}
            onChange={(e) => set("vendorName", e.target.value)}
          />

          {/* Row 6 — Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Description
            </label>
            <textarea
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none transition
                text-gray-900 placeholder:text-gray-400 resize-none focus:border-yellow-400"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {/* Row 7 — Recurring */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="recurring"
              checked={form.isRecurring}
              onChange={(e) => set("isRecurring", e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="recurring" className="text-sm text-gray-600">
              Recurring Expense
            </label>

            {form.isRecurring && (
              <div className="ml-auto w-40">
                <Select
                  label=""
                  options={RECURRING_INTERVALS}
                  value={form.recurringInterval}
                  placeholder="Select interval"
                  onChange={(e) => set("recurringInterval", e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
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