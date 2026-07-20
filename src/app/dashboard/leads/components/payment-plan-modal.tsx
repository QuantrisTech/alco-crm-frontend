// components/leads/shared/PaymentPlanModal.tsx
"use client";
import { useState } from "react";
import { X, Plus, Trash2, CreditCard } from "lucide-react";
import InputField from "@/app/component/ui/inputField";

interface Installment {
  dueDate: string;
  amount: number;
  label: string;
  status?: "pending" | "paid";
}

interface PaymentPlanData {
  invoiceNumber: string;
  issueDate: string;
  totalAmount: number;
  discount: number;
  advanceAmount: number;
  advanceDueDate: string;
  installments: Installment[];
  notes: string;
}

interface Props {
  lead: any;
  onClose: () => void;
  onSubmit: (data: PaymentPlanData) => void;
  isSubmitting?: boolean;
}

const toDateInput = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return "";
  }
};

export default function PaymentPlanModal({ lead, onClose, onSubmit, isSubmitting }: Props) {

  const existingPlan = lead?.paymentPlan;
  const isEditMode = !!existingPlan;

  const baseAmount = lead?.opportunity_value ?? 0;

  const todayStr = () => new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<PaymentPlanData>({
    invoiceNumber: existingPlan?.invoiceNumber ?? "",
    issueDate: toDateInput(existingPlan?.issueDate) || todayStr(),
    totalAmount: existingPlan?.totalAmount ?? lead?.opportunity_value ?? 0,
    discount: existingPlan?.discount ?? 0,
    advanceAmount: existingPlan?.advanceAmount ?? 0,
    advanceDueDate: toDateInput(existingPlan?.advanceDueDate) ?? "",
    installments: existingPlan?.installments?.length
      ? existingPlan.installments.map((inst: any) => ({
        label: inst.label || "Installment",
        amount: inst.amount || 0,
        dueDate: toDateInput(inst.dueDate),
        status: inst.status || "pending",
      }))
      : [{ dueDate: "", amount: 0, label: "Installment 1" }],
    notes: existingPlan?.notes ?? "",
  });

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

  const addInstallment = () => {
    setForm((prev) => ({
      ...prev,
      installments: [
        ...prev.installments,
        {
          dueDate: "",
          amount: 0,
          label: `Installment ${prev.installments.length + 1}`,
          status: "pending",
        },
      ],
    }));
  };

  const removeInstallment = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      installments: prev.installments.filter((_, i) => i !== idx),
    }));
  };

  const updateInstallment = (idx: number, field: keyof Installment, value: any) => {
    setForm((prev) => ({
      ...prev,
      installments: prev.installments.map((inst, i) =>
        i === idx ? { ...inst, [field]: value } : inst
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <CreditCard size={15} className="text-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-800">
                  {isEditMode ? "Edit Payment Plan" : "Set Payment Plan"}
                </h2>
                {isEditMode && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                    Editing
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {lead?.first_name} {lead?.last_name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── Total Amount (disabled) ── */}
          {/* <InputField
            label="Total Program Fee (Rs)"
            type="number"
            value={String(form.totalAmount)}
            onChange={() => {}}
            disabled
            className="bg-gray-50 cursor-not-allowed opacity-70"
          /> */}
          {/* ── Total Amount + Discount ── */}
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Old Invoice Number (Optional)"
              type="text"
              value={form.invoiceNumber}
              onChange={(e) => setForm((p) => ({ ...p, invoiceNumber: e.target.value }))}
              placeholder="e.g. INV-2024-0045"
            />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Issue Date</label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 text-gray-900"
              />
            </div>
          </div>

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

          {/* 👇 NAYA — Certificate fee info */}
          {existingPlan?.certificateFee > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-orange-600 font-medium">
                🎓 Certificate fee (auto-added)
              </span>
              <span className="text-xs font-bold text-orange-700">
                Rs {existingPlan.certificateFee.toLocaleString()}
              </span>
            </div>
          )}

          {/* 👇 NAYA — Manual fee info */}
          {existingPlan?.manualFee > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-orange-600 font-medium">
                🎓 Manual fee (auto-added)
              </span>
              <span className="text-xs font-bold text-orange-700">
                Rs {existingPlan.manualFee.toLocaleString()}
              </span>
            </div>
          )}


          {/* ── Advance ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Advance Amount (Rs) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                value={form.advanceAmount || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, advanceAmount: Number(e.target.value) }))
                }
                placeholder="e.g. 5000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Advance Due Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={form.advanceDueDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, advanceDueDate: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          {/* ── Remaining badge ── */}
          {isAdvanceFilled && (
            <div
              className={`text-xs font-semibold px-3 py-2 rounded-lg ${remaining < 0
                ? "bg-rose-50 text-rose-600"
                : remaining === 0
                  ? "bg-teal-50 text-teal-600"
                  : "bg-orange-50 text-orange-600"
                }`}
            >
              {remaining < 0
                ? `Over-allocated by Rs ${Math.abs(remaining).toLocaleString()}`
                : remaining === 0
                  ? "Fully allocated"
                  : `Remaining to allocate: Rs ${remaining.toLocaleString()}`}
            </div>
          )}

          {/* ── Installments (advance fill hone ke baad unlock) ── */}
          <div className={!isAdvanceFilled ? "opacity-50 pointer-events-none select-none" : ""}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">
                Installments
                {!isAdvanceFilled && (
                  <span className="ml-2 text-[10px] text-gray-400 font-normal">
                    (Fill advance first)
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={addInstallment}
                className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium"
              >
                <Plus size={12} /> Add
              </button>
            </div>

            <div className="space-y-2">
              {form.installments.map((inst, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={inst.label}
                        onChange={(e) => updateInstallment(idx, "label", e.target.value)}
                        className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none flex-1"
                        placeholder="Label e.g. Month 1"
                      />
                      {isEditMode && inst.status && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${inst.status === "paid"
                            ? "bg-teal-100 text-teal-600"
                            : "bg-yellow-100 text-yellow-600"
                            }`}
                        >
                          {inst.status}
                        </span>
                      )}
                    </div>
                    {form.installments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInstallment(idx)}
                        className="text-rose-400 hover:text-rose-600 ml-2 shrink-0"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Amount (Rs)"
                      value={inst.amount || ""}
                      onChange={(e) => updateInstallment(idx, "amount", Number(e.target.value))}
                      className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-400 bg-white text-gray-900 placeholder:text-gray-400"
                      required
                    />
                    <input
                      type="date"
                      value={inst.dueDate}
                      onChange={(e) => updateInstallment(idx, "dueDate", e.target.value)}
                      className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-400 bg-white text-gray-900 placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Notes ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any special instructions..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </form>

        {/* ── Footer ── */}
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
            className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : isEditMode ? "Update Plan" : "Save Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}