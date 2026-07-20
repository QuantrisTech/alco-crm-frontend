// "use client";
// import { useState } from "react";
// import { X, ShieldAlert } from "lucide-react";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { voidInstallmentPayment } from "@/utils/api";
// import toast from "react-hot-toast";

// const VOID_REASONS = [
//   { value: "bounced", label: "Cheque Bounced" },
//   { value: "duplicate_entry", label: "Duplicate Entry" },
//   { value: "wrong_amount", label: "Wrong Amount" },
//   { value: "student_dispute", label: "Student Dispute" },
//   { value: "other", label: "Other" },
// ];

// export default function VoidInstallmentModal({ invoice, installment, onClose }: any) {
//   const queryClient = useQueryClient();
//   const [voidReason, setVoidReason] = useState("");
//   const [reason, setReason] = useState("");

//   const { mutate: voidPayment, isPending } = useMutation({
//     mutationFn: () =>
//       voidInstallmentPayment(invoice._id, installment._id, { reason, voidReason }),
//     onSuccess: () => {
//       toast.success("Payment voided — journal entries reversed ✅");
//       queryClient.invalidateQueries({ queryKey: ["invoices"] });
//       onClose();
//     },
//     onError: (e: any) => toast.error(e?.response?.data?.message || "Void failed!"),
//   });

//   if (!installment) return null;

//   return (
//     <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl w-full max-w-md p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
//             <ShieldAlert size={16} className="text-rose-500" />
//             Void Payment — {installment.label}
//           </h3>
//           <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
//         </div>

//         <p className="text-xs text-gray-500 mb-4">
//           This will reverse the journal entry, reset the installment to <strong>PENDING</strong>,
//           and mark this payment record as voided. Use this if the payment never actually landed
//           (e.g. cheque bounced) — not for correcting a wrong amount or date.
//         </p>

//         <div className="space-y-3">
//           <div>
//             <label className="text-xs font-semibold text-gray-600">
//               Void Reason <span className="text-rose-400">*</span>
//             </label>
//             <select
//               value={voidReason}
//               onChange={(e) => setVoidReason(e.target.value)}
//               className="w-full text-gray-600 border rounded-lg px-3 py-2 text-sm mt-1 bg-white"
//             >
//               <option value="">Select a reason…</option>
//               {VOID_REASONS.map((r) => (
//                 <option key={r.value} value={r.value}>{r.label}</option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="text-xs font-semibold text-gray-600">
//               Details <span className="text-rose-400">*</span>
//             </label>
//             <textarea
//               value={reason}
//               onChange={(e) => setReason(e.target.value)}
//               placeholder="e.g. Cheque #4521 bounced, bank confirmed insufficient funds on 12 Jul"
//               rows={2}
//               className="w-full placeholder:text-gray-600 text-gray-600 border rounded-lg px-3 py-2 text-sm mt-1"
//             />
//           </div>
//         </div>

//         <div className="flex gap-2 mt-5">
//           <button onClick={onClose} className="flex-1 py-2 rounded-lg border text-sm text-gray-500">
//             Cancel
//           </button>
//           <button
//             onClick={() => {
//               if (!voidReason) return toast.error("Please select a void reason");
//               if (!reason.trim()) return toast.error("Details are required");
//               voidPayment();
//             }}
//             disabled={isPending}
//             className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-sm font-semibold disabled:opacity-50"
//           >
//             {isPending ? "Voiding..." : "Confirm Void"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }