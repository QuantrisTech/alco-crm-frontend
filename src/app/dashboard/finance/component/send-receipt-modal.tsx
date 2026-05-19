// finance/component/send-receipt-modal.tsx
"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import toast from "react-hot-toast";

export default function SendReceiptModal({ invoice, onClose, onSend, isSending }: {
  invoice: any;
  onClose: () => void;
  onSend: (body: any) => void;
  isSending: boolean;
}) {
  const [mode, setMode] = useState<"single" | "all">("single");
  const [selectedInstallmentId, setSelectedInstallmentId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Online");
  const [referenceNo, setReferenceNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  if (!invoice) return null;

  const paidInstallments = invoice.installments?.filter(
    (inst: any) => inst.status === "PAID"
  ) || [];

  const handleSubmit = () => {
    if (mode === "single" && !selectedInstallmentId) {
      toast.error("Installment select karo");
      return;
    }
    onSend({
      sendAll: mode === "all",
      installmentId: mode === "single" ? selectedInstallmentId : undefined,
      paymentMethod,
      referenceNo,
      date,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-gray-800">Send Receipt</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {invoice.invoiceNumber} — {invoice.user?.name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>

        <div className="p-5 space-y-4">

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("single")}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${
                mode === "single"
                  ? "bg-yellow-500 text-white border-yellow-500"
                  : "bg-white text-gray-500 border-gray-200 hover:border-yellow-300"
              }`}
            >
              Single Installment
            </button>
            <button
              onClick={() => setMode("all")}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${
                mode === "all"
                  ? "bg-yellow-500 text-white border-yellow-500"
                  : "bg-white text-gray-500 border-gray-200 hover:border-yellow-300"
              }`}
            >
              All Paid
            </button>
          </div>

          {/* Single installment select */}
          {mode === "single" && (
            <div>
              <label className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1.5 block">
                Installment
              </label>
              {paidInstallments.length === 0 ? (
                <p className="text-sm text-rose-500">Koi paid installment nahi</p>
              ) : (
                <select
                  value={selectedInstallmentId}
                  onChange={(e) => setSelectedInstallmentId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">-- Select --</option>
                  {paidInstallments.map((inst: any) => (
                    <option key={inst._id} value={inst._id}>
                      {inst.isAdvance ? "Advance" : inst.label} — Rs {(inst.amount || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* All paid info */}
          {mode === "all" && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3 text-sm text-yellow-800">
              {paidInstallments.length} paid installment(s) ki receipt jaayegi —{" "}
              <strong>
                Rs {paidInstallments.reduce((s: number, i: any) => s + (i.amount || 0), 0).toLocaleString()}
              </strong>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1.5 block">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option>Online</option>
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>Cheque</option>
              <option>Raast</option>
            </select>
          </div>

          {/* Reference No */}
          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1.5 block">
              Reference No
            </label>
            <input
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="SM11103257A416C0"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1.5 block">
              Receipt Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSending}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              <Send size={14} />
              {isSending ? "Sending..." : "Send Receipt"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}