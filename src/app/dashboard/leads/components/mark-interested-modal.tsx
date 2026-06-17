"use client";
import { useState } from "react";
import { X, Plus, Trash2, Star } from "lucide-react";
import InputField from "@/app/component/ui/inputField";

interface Installment {
  dueDate: string;
  amount: number;
  label: string;
}

interface FormState {
  totalAmount: number;
  discount: number;
  advanceAmount: number;
  advanceDueDate: string;
  installments: Installment[];
  notes: string;
}

interface FormErrors {
  advanceAmount?: string;
  advanceDueDate?: string;
  installments?: { amount?: string; dueDate?: string }[];
}

interface Props {
  lead: any;
  onClose: () => void;
  onSubmit: (data: { paymentPlan: FormState }) => void;
  isSubmitting?: boolean;
}

const toDateInput = (dateStr?: string) => {
  if (!dateStr) return "";
  try { return new Date(dateStr).toISOString().split("T")[0]; } catch { return ""; }
};

export default function MarkInterestedModal({ lead, onClose, onSubmit, isSubmitting }: Props) {
  const baseAmount = lead?.opportunity_value ?? 0;

  const [form, setForm] = useState<FormState>({
    totalAmount: baseAmount,
    discount: 0,
    advanceAmount: 0,
    advanceDueDate: "",
    installments: [{ label: "Installment 1", amount: 0, dueDate: "" }],
    notes: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleDiscountChange = (value: number) => {
    const safeValue = Math.max(0, value);
    setForm((p) => ({
      ...p,
      discount: safeValue,
      totalAmount: Math.max(0, baseAmount - safeValue),
    }));
  };

  // ── Advance fill check ──────────────────────────────────────────
  const isAdvanceFilled = form.advanceAmount > 0 && form.advanceDueDate !== "";

  const remaining =
    form.totalAmount -
    form.advanceAmount -
    form.installments.reduce((s, i) => s + Number(i.amount), 0);

  // ── Validation ─────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.advanceAmount || form.advanceAmount <= 0) {
      newErrors.advanceAmount = "Advance amount is required";
    }
    if (!form.advanceDueDate) {
      newErrors.advanceDueDate = "Advance due date is required";
    }

    const instErrors = form.installments.map((inst) => ({
      amount: !inst.amount || inst.amount <= 0 ? "Amount is required" : undefined,
      dueDate: !inst.dueDate ? "Due date is required" : undefined,
    }));

    const hasInstErrors = instErrors.some((e) => e.amount || e.dueDate);
    if (hasInstErrors) newErrors.installments = instErrors;

    if (remaining < 0) {
      // over-allocation — block submit (badge already shows the warning)
    }

    setErrors(newErrors);
    return (
      !newErrors.advanceAmount &&
      !newErrors.advanceDueDate &&
      !hasInstErrors &&
      remaining >= 0
    );
  };

  const addInstallment = () =>
    setForm((p) => ({
      ...p,
      installments: [
        ...p.installments,
        { label: `Installment ${p.installments.length + 1}`, amount: 0, dueDate: "" },
      ],
    }));

  const removeInstallment = (idx: number) =>
    setForm((p) => ({ ...p, installments: p.installments.filter((_, i) => i !== idx) }));

  const updateInstallment = (idx: number, field: keyof Installment, value: any) => {
    setForm((p) => ({
      ...p,
      installments: p.installments.map((inst, i) =>
        i === idx ? { ...inst, [field]: value } : inst
      ),
    }));
    // clear that installment's error on change
    setErrors((prev) => {
      const instErrors = [...(prev.installments ?? [])];
      if (instErrors[idx]) instErrors[idx] = { ...instErrors[idx], [field === "amount" ? "amount" : "dueDate"]: undefined };
      return { ...prev, installments: instErrors };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ paymentPlan: form });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Star size={15} className="text-yellow-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Mark as Interested</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {lead?.first_name} {lead?.last_name} — Set payment plan
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Info box */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
            <p className="text-xs text-yellow-700 font-medium">
              The lead status will be updated to <strong>Interested</strong>, and the user will receive
              an email and notification. The payment plan will also be attached automatically.
            </p>
          </div>

          {/* Total Amount — disabled, read-only */}
          {/* <InputField
            label="Total Program Fee (Rs)"
            type="number"
            value={String(form.totalAmount)}
            onChange={() => { }}
            disabled
            className="bg-gray-50 cursor-not-allowed opacity-70"
          /> */}
          {/* Total Amount + Discount */}
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Total Program Fee (Rs)"
              type="number"
              value={String(form.totalAmount)}
              onChange={(e) =>
                setForm((p) => ({ ...p, totalAmount: Number(e.target.value) }))
              }
              placeholder="e.g. 50000"
            />
            <InputField
              label="Discount (Rs) — optional"
              type="number"
              value={String(form.discount || "")}
              onChange={(e) => handleDiscountChange(Number(e.target.value))}
              placeholder="0"
            />
          </div>

          {/* Advance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Advance Amount (Rs) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                value={form.advanceAmount || ""}
                onChange={(e) => {
                  setForm((p) => ({ ...p, advanceAmount: Number(e.target.value) }));
                  setErrors((p) => ({ ...p, advanceAmount: undefined }));
                }}
                placeholder="e.g. 5000"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none text-gray-900 placeholder:text-gray-400 ${errors.advanceAmount
                  ? "border-rose-400 focus:border-rose-400"
                  : "border-gray-200 focus:border-yellow-400"
                  }`}
              />
              {errors.advanceAmount && (
                <p className="text-xs text-rose-500 mt-1">{errors.advanceAmount}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Advance Due Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={form.advanceDueDate}
                onChange={(e) => {
                  setForm((p) => ({ ...p, advanceDueDate: e.target.value }));
                  setErrors((p) => ({ ...p, advanceDueDate: undefined }));
                }}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none text-gray-900 ${errors.advanceDueDate
                  ? "border-rose-400 focus:border-rose-400"
                  : "border-gray-200 focus:border-yellow-400"
                  }`}
              />
              {errors.advanceDueDate && (
                <p className="text-xs text-rose-500 mt-1">{errors.advanceDueDate}</p>
              )}
            </div>
          </div>

          {/* Remaining badge */}
          {isAdvanceFilled && (
            <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${remaining < 0
              ? "bg-rose-50 text-rose-600"
              : remaining === 0
                ? "bg-teal-50 text-teal-600"
                : "bg-yellow-50 text-yellow-600"
              }`}>
              {remaining < 0
                ? `Over-allocated by Rs ${Math.abs(remaining).toLocaleString()}`
                : remaining === 0
                  ? "✓ Fully allocated"
                  : `Remaining to allocate: Rs ${remaining.toLocaleString()}`}
            </div>
          )}

          {/* Installments — locked until advance is filled */}
          <div className={!isAdvanceFilled ? "opacity-50 pointer-events-none select-none" : ""}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">
                Installments
                {!isAdvanceFilled && (
                  <span className="ml-2 text-[10px] text-gray-400 font-normal">(Fill advance first)</span>
                )}
              </label>
              <button
                type="button"
                onClick={addInstallment}
                className="flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-600 font-medium"
              >
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {form.installments.map((inst, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="text"
                      value={inst.label}
                      onChange={(e) => updateInstallment(idx, "label", e.target.value)}
                      className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none flex-1"
                      placeholder="Label e.g. Month 1"
                    />
                    {form.installments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInstallment(idx)}
                        className="text-rose-400 hover:text-rose-600 ml-2"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="number"
                        placeholder="Amount (Rs)"
                        value={inst.amount || ""}
                        onChange={(e) => updateInstallment(idx, "amount", Number(e.target.value))}
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none bg-white text-gray-900 placeholder:text-gray-400 ${errors.installments?.[idx]?.amount
                          ? "border-rose-400"
                          : "border-gray-200 focus:border-yellow-400"
                          }`}
                      />
                      {errors.installments?.[idx]?.amount && (
                        <p className="text-xs text-rose-500 mt-1">{errors.installments[idx].amount}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="date"
                        value={inst.dueDate}
                        onChange={(e) => updateInstallment(idx, "dueDate", e.target.value)}
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none bg-white text-gray-900 ${errors.installments?.[idx]?.dueDate
                          ? "border-rose-400"
                          : "border-gray-200 focus:border-yellow-400"
                          }`}
                      />
                      {errors.installments?.[idx]?.dueDate && (
                        <p className="text-xs text-rose-500 mt-1">{errors.installments[idx].dueDate}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any special instructions..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 resize-none text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || remaining < 0 || !isAdvanceFilled}
            className="flex-1 py-2 rounded-xl bg-yellow-400 text-gray-900 text-sm font-semibold hover:bg-yellow-500 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Mark as Interested & Save Payment Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}