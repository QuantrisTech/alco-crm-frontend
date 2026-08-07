"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { previewBulkDiscount, confirmBulkDiscount } from "@/utils/api";
import { X, Loader2, Upload, CheckCircle, AlertCircle, Percent } from "lucide-react";
import toast from "react-hot-toast";

const fmt = (n: number) => `Rs ${(n || 0).toLocaleString()}`;

export default function BulkDiscountModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const { mutate: runPreview, isPending: isPreviewing } = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("file", file as File);
      return previewBulkDiscount(fd);
    },
    onSuccess: (res) => setPreview(res.data.preview),
    onError: (err: any) => toast.error(err?.response?.data?.message || "Preview failed"),
  });

  const { mutate: runConfirm, isPending: isConfirming } = useMutation({
    mutationFn: () => {
      const rows = (preview || [])
        .filter((p) => p.status === "eligible")
        .map((p) => ({ invoiceId: p.invoiceId, discountAmount: p.discountAmount, reason: p.reason }));
      return confirmBulkDiscount(rows);
    },
    onSuccess: (res) => {
      setResult(res.data);
      toast.success(`${res.data.correctedCount} invoice(s) corrected! ✅`);
      onDone();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Confirm failed"),
  });

  const eligible = (preview || []).filter((p) => p.status === "eligible");
  const notEligible = (preview || []).filter((p) => p.status !== "eligible");

  const statusLabel: Record<string, string> = {
    not_found: "Invoice not found",
    already_has_discount: "Discount already applied",
    invalid_discount: "Discount ≥ current amount",
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Percent size={18} className="text-yellow-500" />
            Bulk Discount Correction
          </h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="p-5 space-y-4">

          {!preview && !result && (
            <>
              <p className="text-sm text-gray-500">
                Excel upload karein jismein <b>Invoice Number</b> aur <b>Discount Amount</b> columns hon.
                System purani journal entry reverse kar ke, invoice ko gross amount + discount se update kar dega,
                aur nayi entry invoice ki original issue date par post karega.
              </p>

              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-10 cursor-pointer hover:border-yellow-400 transition-colors">
                <Upload size={24} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  {file ? file.name : "Excel file yahan choose karein"}
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>

              <button
                onClick={() => runPreview()}
                disabled={!file || isPreviewing}
                className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isPreviewing && <Loader2 size={14} className="animate-spin" />}
                Preview
              </button>
            </>
          )}

          {preview && !result && (
            <>
              <div className="flex gap-3 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                  {eligible.length} eligible
                </span>
                {notEligible.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 font-medium">
                    {notEligible.length} skipped
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto border border-gray-100 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2">Invoice #</th>
                      <th className="text-left px-3 py-2">Student</th>
                      <th className="text-right px-3 py-2">Net → Gross</th>
                      <th className="text-right px-3 py-2">Discount</th>
                      <th className="text-center px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((p: any, i: number) => (
                      <tr key={i} className="border-t border-gray-50">
                        <td className="px-3 py-2 text-gray-500 font-mono">{p.invoiceNumber}</td>
                        <td className="px-3 py-2 text-gray-500">{p.studentName || "—"}</td>
                        <td className="px-3 py-2 text-gray-500 text-right">
                          {p.status === "eligible"
                            ? `${fmt(p.currentNetAmount)} → ${fmt(p.newGrossAmount)}`
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-gray-500 text-right">{fmt(p.discountAmount)}</td>
                        <td className="px-3 py-2 text-center">
                          {p.status === "eligible" ? (
                            <CheckCircle size={13} className="inline text-green-500" />
                          ) : (
                            <span className="text-rose-500 flex items-center gap-1 justify-center">
                              <AlertCircle size={12} />
                              {statusLabel[p.status] || p.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setPreview(null); setFile(null); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg"
                >
                  Back
                </button>
                <button
                  onClick={() => runConfirm()}
                  disabled={eligible.length === 0 || isConfirming}
                  className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isConfirming && <Loader2 size={14} className="animate-spin" />}
                  Confirm {eligible.length} Correction{eligible.length !== 1 ? "s" : ""}
                </button>
              </div>
            </>
          )}

          {result && (
            <div className="text-center py-6">
              <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-800">
                {result.correctedCount} invoice(s) corrected
              </p>
              {result.skippedCount > 0 && (
                <p className="text-sm text-gray-400 mt-1">{result.skippedCount} skipped</p>
              )}
              <button
                onClick={onClose}
                className="mt-4 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}