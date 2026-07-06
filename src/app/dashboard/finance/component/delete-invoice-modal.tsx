"use client";
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  invoice: any | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export default function DeleteInvoiceModal({ invoice, onClose, onConfirm, isLoading }: Props) {
  const [reason, setReason] = useState("");

  if (!invoice) return null;

  const handleConfirm = () => {
    onConfirm(reason.trim());
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50">
              <AlertTriangle size={18} className="text-rose-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Cancel Invoice</h2>
              <p className="text-xs text-gray-400">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-600">
            Ye invoice cancel ho jayegi, iske sab approved payments{" "}
            <span className="font-medium text-rose-600">void</span> honge aur journal entries{" "}
            <span className="font-medium text-rose-600">reverse</span> ho jayengi. Ye action undo nahi ho sakta.
          </p>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Cancellation reason <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Student requested refund, duplicate invoice..."
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {isLoading ? "Cancelling..." : "Yes, Cancel Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}