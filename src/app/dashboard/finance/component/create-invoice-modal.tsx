// "use client";
// import { useState, useRef } from "react";
// import { X, Search, CreditCard, Plus, Trash2, ChevronLeft, User, BookOpen } from "lucide-react";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { searchEnrollments, createInvoice } from "@/utils/api";
// import toast from "react-hot-toast";

// // ── Types ────────────────────────────────────────────────────────
// interface Installment {
//   label: string;
//   amount: number;
//   dueDate: string;
//   isAdvance: boolean;
//   status: "PENDING";
// }

// interface PaymentForm {
//   totalAmount: number;
//   advanceAmount: number;
//   advanceDueDate: string;
//   installments: Installment[];
//   notes: string;
// }

// interface Props {
//   isOpen: boolean;
//   onClose: () => void;
// }

// // ── Helper ───────────────────────────────────────────────────────
// const toDateInput = (d?: string) => {
//   if (!d) return "";
//   try { return new Date(d).toISOString().split("T")[0]; } catch { return ""; }
// };

// // ── Component ────────────────────────────────────────────────────
// export default function CreateInvoiceModal({ isOpen, onClose }: Props) {
//   const queryClient = useQueryClient();

//   // Step 1 state
//   const [step, setStep] = useState<1 | 2>(1);
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState<any[]>([]);
//   const [isSearching, setIsSearching] = useState(false);
//   const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);

//   // Step 2 state
//   const [form, setForm] = useState<PaymentForm>({
//     totalAmount: 0,
//     advanceAmount: 0,
//     advanceDueDate: "",
//     installments: [{ label: "Installment 1", amount: 0, dueDate: "", isAdvance: false, status: "PENDING" }],
//     notes: "",
//   });

//   // ── Search debounce (native) ─────────────────────────────────
//   const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const val = e.target.value;
//     setQuery(val);

//     if (debounceTimer.current) clearTimeout(debounceTimer.current);

//     if (val.trim().length < 2) { setResults([]); return; }

//     debounceTimer.current = setTimeout(async () => {
//       setIsSearching(true);
//       try {
//         const res = await searchEnrollments(val);
//         setResults(res.data?.data || []);
//       } catch {
//         toast.error("Search Operation failed");
//       } finally {
//         setIsSearching(false);
//       }
//     }, 400);
//   };

//   const selectEnrollment = (enrollment: any) => {
//     setSelectedEnrollment(enrollment);
//     setStep(2);
//     setResults([]);
//     setQuery("");
//   };

//   // ── Payment form helpers ─────────────────────────────────────
//   const remaining =
//     form.totalAmount -
//     form.advanceAmount -
//     form.installments.reduce((s, i) => s + Number(i.amount), 0);

//   const addInstallment = () => {
//     setForm((p) => ({
//       ...p,
//       installments: [
//         ...p.installments,
//         { label: `Installment ${p.installments.length + 1}`, amount: 0, dueDate: "", isAdvance: false, status: "PENDING" },
//       ],
//     }));
//   };

//   const removeInstallment = (idx: number) => {
//     setForm((p) => ({ ...p, installments: p.installments.filter((_, i) => i !== idx) }));
//   };

//   const updateInstallment = (idx: number, field: string, value: any) => {
//     setForm((p) => ({
//       ...p,
//       installments: p.installments.map((inst, i) => i === idx ? { ...inst, [field]: value } : inst),
//     }));
//   };

//   // ── Submit ───────────────────────────────────────────────────
//   const { mutate: submit, isPending } = useMutation({
//     mutationFn: () => {
//       const allInstallments = [
//         {
//           label: "Advance Payment",
//           amount: form.advanceAmount,
//           dueDate: form.advanceDueDate,
//           isAdvance: true,
//           status: "PENDING",
//           paidAmount: 0,
//         },
//         ...form.installments.map((inst) => ({
//           label: inst.label,
//           amount: inst.amount,
//           dueDate: inst.dueDate,
//           isAdvance: false,
//           status: "PENDING",
//           paidAmount: 0,
//         })),
//       ];

//       return createInvoice({
//         user: selectedEnrollment.user._id,
//         enrollment: selectedEnrollment._id,
//         totalAmount: form.totalAmount,
//         dueDate: form.advanceDueDate,
//         installments: allInstallments,
//         notes: form.notes,
//       });
//     },
//     onSuccess: () => {
//       toast.success("Invoice created successfully! ✅");
//       queryClient.invalidateQueries({ queryKey: ["invoices"] });
//       handleClose();
//     },
//     onError: (e: any) => toast.error(e?.response?.data?.message || "Operation failed!"),
//   });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (remaining !== 0) {
//       toast.error("Please allocate the full amount first");
//       return;
//     }
//     submit();
//   };

//   const handleClose = () => {
//     setStep(1);
//     setQuery("");
//     setResults([]);
//     setSelectedEnrollment(null);
//     setForm({
//       totalAmount: 0,
//       advanceAmount: 0,
//       advanceDueDate: "",
//       installments: [{ label: "Installment 1", amount: 0, dueDate: "", isAdvance: false, status: "PENDING" }],
//       notes: "",
//     });
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

//         {/* ── Header ── */}
//         <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
//           <div className="flex items-center gap-2.5">
//             {step === 2 && (
//               <button
//                 onClick={() => setStep(1)}
//                 className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 mr-1"
//               >
//                 <ChevronLeft size={16} />
//               </button>
//             )}
//             <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
//               <CreditCard size={15} className="text-orange-500" />
//             </div>
//             <div>
//               <h2 className="text-sm font-bold text-gray-800">Create Invoice</h2>
//               <p className="text-xs text-gray-400 mt-0.5">
//                 {step === 1 ? "Step 1: Select Student / Enrollment" : `Step 2: Payment plan — ${selectedEnrollment?.user?.name}`}
//               </p>
//             </div>
//           </div>
//           <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
//             <X size={16} />
//           </button>
//         </div>

//         {/* ── Step indicators ── */}
//         <div className="flex px-5 pt-3 pb-1 gap-2">
//           {[1, 2].map((s) => (
//             <div
//               key={s}
//               className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? "bg-orange-400" : "bg-gray-100"}`}
//             />
//           ))}
//         </div>

//         {/* ══════════════════════════════════════════════
//             STEP 1 — Search enrollment
//         ══════════════════════════════════════════════ */}
//         {step === 1 && (
//           <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
//             {/* Search input */}
//             <div className="relative">
//               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//               <input
//                 type="text"
//                 value={query}
//                 onChange={handleQueryChange}
//                 placeholder="Enter student name or email..."
//                 className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 text-gray-900 placeholder:text-gray-400"
//                 autoFocus
//               />
//             </div>

//             {/* Loading */}
//             {isSearching && (
//               <p className="text-xs text-gray-400 text-center py-4">Searching...</p>
//             )}

//             {/* Results */}
//             {!isSearching && results.length > 0 && (
//               <div className="space-y-2">
//                 {results.map((enrollment: any) => (
//                   <button
//                     key={enrollment._id}
//                     onClick={() => selectEnrollment(enrollment)}
//                     className="w-full text-left border border-gray-100 rounded-xl p-3 hover:border-orange-300 hover:bg-orange-50 transition-all group"
//                   >
//                     <div className="flex items-start gap-3">
//                       <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
//                         <User size={14} className="text-gray-500 group-hover:text-orange-500" />
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p className="text-sm font-semibold text-gray-800 truncate">
//                           {enrollment.user?.name || "—"}
//                         </p>
//                         <p className="text-xs text-gray-400 truncate">{enrollment.user?.email}</p>
//                         <div className="flex items-center gap-1.5 mt-1.5">
//                           <BookOpen size={11} className="text-orange-400 shrink-0" />
//                           <span className="text-xs text-gray-600 truncate">
//                             {enrollment.program?.name || "—"}
//                           </span>
//                           {enrollment.batch?.name && (
//                             <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
//                               {enrollment.batch.name}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                       <span
//                         className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
//                           enrollment.accessStatus === "ACTIVE"
//                             ? "bg-green-100 text-green-600"
//                             : "bg-yellow-100 text-yellow-600"
//                         }`}
//                       >
//                         {enrollment.accessStatus}
//                       </span>
//                     </div>
//                   </button>
//                 ))}
//               </div>
//             )}

//             {/* No results */}
//             {!isSearching && query.trim().length >= 2 && results.length === 0 && (
//               <div className="text-center py-8">
//                 <p className="text-sm text-gray-400">No enrollment found</p>
//                 <p className="text-xs text-gray-300 mt-1">Please check the name or email</p>
//               </div>
//             )}

//             {/* Empty state */}
//             {query.trim().length < 2 && (
//               <div className="text-center py-8">
//                 <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
//                   <Search size={20} className="text-gray-300" />
//                 </div>
//                 <p className="text-sm text-gray-400">Type student name or email</p>
//                 <p className="text-xs text-gray-300 mt-1">Minimum 2 characters required</p>
//               </div>
//             )}
//           </div>
//         )}

//         {/* ══════════════════════════════════════════════
//             STEP 2 — Payment Plan form
//         ══════════════════════════════════════════════ */}
//         {step === 2 && (
//           <>
//             {/* Selected enrollment info */}
//             <div className="mx-5 mt-3 p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-3">
//               <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
//                 <User size={14} className="text-orange-500" />
//               </div>
//               <div className="min-w-0">
//                 <p className="text-sm font-semibold text-gray-800 truncate">{selectedEnrollment?.user?.name}</p>
//                 <p className="text-xs text-gray-500 truncate">
//                   {selectedEnrollment?.program?.name}
//                   {selectedEnrollment?.batch?.name ? ` · ${selectedEnrollment.batch.name}` : ""}
//                 </p>
//               </div>
//             </div>

//             <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
//               {/* Total Amount */}
//               <div>
//                 <label className="block text-xs font-semibold text-gray-600 mb-1">
//                   Total Program Fee (Rs)
//                 </label>
//                 <input
//                   type="number"
//                   value={form.totalAmount || ""}
//                   onChange={(e) => setForm((p) => ({ ...p, totalAmount: Number(e.target.value) }))}
//                   className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 text-gray-900 placeholder:text-gray-400"
//                   placeholder="e.g. 50000"
//                   required
//                 />
//               </div>

//               {/* Advance */}
//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="block text-xs font-semibold text-gray-600 mb-1">
//                     Advance Amount (Rs)
//                   </label>
//                   <input
//                     type="number"
//                     value={form.advanceAmount || ""}
//                     onChange={(e) => setForm((p) => ({ ...p, advanceAmount: Number(e.target.value) }))}
//                     className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 text-gray-900 placeholder:text-gray-400"
//                     placeholder="e.g. 10000"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-xs font-semibold text-gray-600 mb-1">
//                     Advance Due Date
//                   </label>
//                   <input
//                     type="date"
//                     value={form.advanceDueDate}
//                     onChange={(e) => setForm((p) => ({ ...p, advanceDueDate: e.target.value }))}
//                     className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 text-gray-900"
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Remaining badge */}
//               <div
//                 className={`text-xs font-semibold px-3 py-2 rounded-lg ${
//                   remaining < 0
//                     ? "bg-rose-50 text-rose-600"
//                     : remaining === 0
//                     ? "bg-teal-50 text-teal-600"
//                     : "bg-orange-50 text-orange-600"
//                 }`}
//               >
//                 {remaining < 0
//                   ? `Over-allocated by Rs ${Math.abs(remaining).toLocaleString()}`
//                   : remaining === 0
//                   ? "✓ Fully allocated"
//                   : `Remaining to allocate: Rs ${remaining.toLocaleString()}`}
//               </div>

//               {/* Installments */}
//               <div>
//                 <div className="flex items-center justify-between mb-2">
//                   <label className="text-xs font-semibold text-gray-600">Installments</label>
//                   <button
//                     type="button"
//                     onClick={addInstallment}
//                     className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium"
//                   >
//                     <Plus size={12} /> Add
//                   </button>
//                 </div>

//                 <div className="space-y-2">
//                   {form.installments.map((inst, idx) => (
//                     <div key={idx} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
//                       <div className="flex items-center justify-between mb-2">
//                         <input
//                           type="text"
//                           value={inst.label}
//                           onChange={(e) => updateInstallment(idx, "label", e.target.value)}
//                           className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none flex-1"
//                           placeholder="Label e.g. Month 1"
//                         />
//                         {form.installments.length > 1 && (
//                           <button
//                             type="button"
//                             onClick={() => removeInstallment(idx)}
//                             className="text-rose-400 hover:text-rose-600 ml-2"
//                           >
//                             <Trash2 size={11} />
//                           </button>
//                         )}
//                       </div>
//                       <div className="grid grid-cols-2 gap-2">
//                         <input
//                           type="number"
//                           placeholder="Amount (Rs)"
//                           value={inst.amount || ""}
//                           onChange={(e) => updateInstallment(idx, "amount", Number(e.target.value))}
//                           className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-400 bg-white text-gray-900 placeholder:text-gray-400"
//                           required
//                         />
//                         <input
//                           type="date"
//                           value={inst.dueDate}
//                           onChange={(e) => updateInstallment(idx, "dueDate", e.target.value)}
//                           className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-400 bg-white text-gray-900"
//                           required
//                         />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Notes */}
//               <div>
//                 <label className="block text-xs font-semibold text-gray-600 mb-1">
//                   Notes (Optional)
//                 </label>
//                 <textarea
//                   rows={2}
//                   value={form.notes}
//                   onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
//                   placeholder="Any special instructions..."
//                   className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none text-gray-900 placeholder:text-gray-400"
//                 />
//               </div>
//             </form>

//             {/* Footer */}
//             <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
//               <button
//                 onClick={handleClose}
//                 className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSubmit}
//                 disabled={isPending || remaining !== 0}
//                 className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
//               >
//                 {isPending ? "Saving..." : "Create Invoice"}
//               </button>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }
"use client";
import { useState, useRef } from "react";
import { X, Search, CreditCard, Plus, Trash2, ChevronLeft, User, BookOpen, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { searchEnrollments, createInvoice, addInstallment } from "@/utils/api";
import toast from "react-hot-toast";

// ── Types ────────────────────────────────────────────────────────
interface NewInstallment {
  label: string;
  amount: number;
  dueDate: string;
}

interface FreshForm {
  totalAmount: number;
  advanceAmount: number;
  advanceDueDate: string;
  installments: NewInstallment[];
  notes: string;
  invoiceNumber: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const toDateInput = (d?: string) => {
  if (!d) return "";
  try { return new Date(d).toISOString().split("T")[0]; } catch { return ""; }
};

const fmt = (n: number) => Number(n || 0).toLocaleString("en-PK");

const statusColor = (s: string) =>
  s === "PAID" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600";

// ── Component ────────────────────────────────────────────────────
export default function CreateInvoiceModal({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();

  // ── Step & search state ──────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);

  // ── Mode: "fresh" = naya invoice | "append" = existing pe add ─
  const [mode, setMode] = useState<"fresh" | "append">("fresh");

  // ── Fresh invoice form ───────────────────────────────────────
  const [freshForm, setFreshForm] = useState<FreshForm>({
    totalAmount: 0,
    advanceAmount: 0,
    advanceDueDate: "",
    installments: [],
    notes: "",
    invoiceNumber: "",
  });

  // ── Append mode: sirf New Installments ─────────────────────
  const [appendInstallments, setAppendInstallments] = useState<NewInstallment[]>([
    { label: "Installment 1", amount: 0, dueDate: "" },
  ]);

  // ── Debounce search ──────────────────────────────────────────
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (val.trim().length < 2) { setResults([]); return; }
    debounceTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchEnrollments(val);
        setResults(res.data?.data || []);
      } catch { toast.error("Search Operation failed"); }
      finally { setIsSearching(false); }
    }, 400);
  };

  // ── Select enrollment → decide mode ─────────────────────────
  const selectEnrollment = (enrollment: any) => {
    setSelectedEnrollment(enrollment);
    const inv = enrollment.invoice;
    if (inv && inv.remainingAmount > 0) {
      // Existing invoice hai, remaining bhi hai → append mode
      setMode("append");
      setAppendInstallments([{ label: "Installment 1", amount: 0, dueDate: "" }]);
    } else {
      // No invoice ya fully paid → fresh
      setMode("fresh");
      setFreshForm({
        totalAmount: 0,
        advanceAmount: 0,
        advanceDueDate: "",
        installments: [],
        notes: "",
        invoiceNumber: "",
      });
    }
    setResults([]);
    setQuery("");
    setStep(2);
  };

  // ── Fresh form helpers ───────────────────────────────────────
  // Remaining = kitna abhi tak unallocated hai (advance + installments ke baad).
  // Yeh negative nahi honi chahiye (over-allocation), lekin zero hona zaroori nahi —
  // baqi amount future me "Add Installments" (append mode) se add ho sakta hai.
  const freshRemaining =
    freshForm.totalAmount -
    freshForm.advanceAmount -
    freshForm.installments.reduce((s, i) => s + Number(i.amount), 0);

  const addFreshInstallment = () =>
    setFreshForm((p) => ({
      ...p,
      installments: [...p.installments, { label: `Installment ${p.installments.length + 1}`, amount: 0, dueDate: "" }],
    }));

  const removeFreshInstallment = (idx: number) =>
    setFreshForm((p) => ({ ...p, installments: p.installments.filter((_, i) => i !== idx) }));

  const updateFreshInstallment = (idx: number, field: string, value: any) =>
    setFreshForm((p) => ({
      ...p,
      installments: p.installments.map((inst, i) => i === idx ? { ...inst, [field]: value } : inst),
    }));

  // ── Append form helpers ──────────────────────────────────────
  const existingInvoice = selectedEnrollment?.invoice;
  const appendTotal = appendInstallments.reduce((s, i) => s + Number(i.amount), 0);
  const appendRemaining = (existingInvoice?.remainingAmount || 0) - appendTotal;

  const addAppendInstallment = () =>
    setAppendInstallments((p) => [...p, { label: `Installment ${p.length + 1}`, amount: 0, dueDate: "" }]);

  const removeAppendInstallment = (idx: number) =>
    setAppendInstallments((p) => p.filter((_, i) => i !== idx));

  const updateAppendInstallment = (idx: number, field: string, value: any) =>
    setAppendInstallments((p) => p.map((inst, i) => i === idx ? { ...inst, [field]: value } : inst));

  // ── Submit: Fresh invoice ─────────────────────────────────────
  const { mutate: submitFresh, isPending: isFreshPending } = useMutation({
    mutationFn: () => {
      const allInstallments = [
        { label: "Advance Payment", amount: freshForm.advanceAmount, dueDate: freshForm.advanceDueDate, isAdvance: true, status: "PENDING", paidAmount: 0 },
        ...freshForm.installments.map((inst) => ({ label: inst.label, amount: inst.amount, dueDate: inst.dueDate, isAdvance: false, status: "PENDING", paidAmount: 0 })),
      ];
      return createInvoice({
        user: selectedEnrollment.user._id,
        enrollment: selectedEnrollment._id,
        totalAmount: freshForm.totalAmount,
        dueDate: freshForm.advanceDueDate,
        installments: allInstallments,
        notes: freshForm.notes,
        invoiceNumber: freshForm.invoiceNumber.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Invoice created successfully! ✅");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      handleClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Operation failed!"),
  });

  // ── Submit: Append installments ──────────────────────────────
  const { mutate: submitAppend, isPending: isAppendPending } = useMutation({
    mutationFn: async () => {
      const invoiceId = existingInvoice._id;
      // Ek ek installment add karo sequentially
      for (const inst of appendInstallments) {
        await addInstallment(invoiceId, {
          label: inst.label,
          amount: inst.amount,
          dueDate: inst.dueDate,
          isAdvance: false,
        });
      }
    },
    onSuccess: () => {
      toast.success("Installments added successfully! ✅");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      handleClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Operation failed!"),
  });

  // Full allocation force nahi karte — sirf basic fields aur over-allocation check.
  // Advance-only invoice (bina installments ke) bhi valid hai; remaining baad me
  // "Add Installments" (append mode) se cover ho sakta hai.
  const handleFreshSubmit = () => {
    if (freshForm.totalAmount <= 0) { toast.error("Please enter total program fee"); return; }
    if (freshForm.advanceAmount <= 0) { toast.error("Please enter advance amount"); return; }
    if (!freshForm.advanceDueDate) { toast.error("Please select advance due date"); return; }
    if (freshRemaining < 0) { toast.error(`Over-allocated by Rs ${fmt(Math.abs(freshRemaining))}`); return; }
    submitFresh();
  };

  const handleAppendSubmit = () => {
    if (appendTotal <= 0) { toast.error("Please add at least one installment"); return; }
    if (appendTotal > (existingInvoice?.remainingAmount || 0)) {
      toast.error(`Allocated amount exceeds the remaining amount (Rs ${fmt(existingInvoice?.remainingAmount)})`);
      return;
    }
    submitAppend();
  };

  const handleClose = () => {
    setStep(1);
    setQuery("");
    setResults([]);
    setSelectedEnrollment(null);
    setMode("fresh");
    setFreshForm({ totalAmount: 0, advanceAmount: 0, advanceDueDate: "", installments: [], notes: "", invoiceNumber: "" });
    setAppendInstallments([{ label: "Installment 1", amount: 0, dueDate: "" }]);
    onClose();
  };

  if (!isOpen) return null;

  const isPending = isFreshPending || isAppendPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 mr-1">
                <ChevronLeft size={16} />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <CreditCard size={15} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">
                {step === 1 ? "Create Invoice" : mode === "append" ? "Add Installments" : "New Invoice"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {step === 1
                  ? "Step 1: Select Student / Enrollment"
                  : mode === "append"
                    ? `Add to Existing Invoice — ${selectedEnrollment?.user?.name}`
                    : `New Payment Plan — ${selectedEnrollment?.user?.name}`}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* ── Step bar ── */}
        <div className="flex px-5 pt-3 pb-1 gap-2">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? "bg-orange-400" : "bg-gray-100"}`} />
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            STEP 1 — Search
        ══════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={handleQueryChange}
                placeholder="Enter student name or email..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 text-gray-900 placeholder:text-gray-400"
                autoFocus
              />
            </div>

            {isSearching && <p className="text-xs text-gray-400 text-center py-4">Searching...</p>}

            {!isSearching && results.length > 0 && (
              <div className="space-y-2">
                {results.map((enrollment: any) => {
                  const inv = enrollment.invoice;
                  const hasInvoice = !!inv;
                  const hasRemaining = hasInvoice && inv.remainingAmount > 0;

                  return (
                    <button
                      key={enrollment._id}
                      onClick={() => selectEnrollment(enrollment)}
                      className="w-full text-left border border-gray-100 rounded-xl p-3 hover:border-orange-300 hover:bg-orange-50 transition-all group"
                    >
                      {/* ── Student info row ── */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                          <User size={14} className="text-gray-500 group-hover:text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{enrollment.user?.name || "—"}</p>
                          <p className="text-xs text-gray-400 truncate">{enrollment.user?.email}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <BookOpen size={11} className="text-orange-400 shrink-0" />
                            <span className="text-xs text-gray-600 truncate">{enrollment.program?.name || "—"}</span>
                            {enrollment.batch?.name && (
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
                                {enrollment.batch.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${enrollment.accessStatus === "ACTIVE" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                          {enrollment.accessStatus}
                        </span>
                      </div>

                      {/* ── Existing invoice summary ── */}
                      {hasInvoice && (
                        <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                              Invoice: {inv.invoiceNumber}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(inv.status)}`}>
                              {inv.status}
                            </span>
                          </div>

                          {/* Amounts row */}
                          <div className="grid grid-cols-3 gap-1.5 mb-2">
                            <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
                              <p className="text-[9px] text-gray-400 mb-0.5">Total</p>
                              <p className="text-[11px] font-bold text-gray-700">Rs {fmt(inv.totalAmount)}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg px-2 py-1.5 text-center">
                              <p className="text-[9px] text-green-500 mb-0.5">Paid</p>
                              <p className="text-[11px] font-bold text-green-600">Rs {fmt(inv.paidAmount)}</p>
                            </div>
                            <div className={`rounded-lg px-2 py-1.5 text-center ${hasRemaining ? "bg-orange-50" : "bg-teal-50"}`}>
                              <p className={`text-[9px] mb-0.5 ${hasRemaining ? "text-orange-400" : "text-teal-500"}`}>Remaining</p>
                              <p className={`text-[11px] font-bold ${hasRemaining ? "text-orange-600" : "text-teal-600"}`}>Rs {fmt(inv.remainingAmount)}</p>
                            </div>
                          </div>

                          {/* Installments list */}
                          <div className="space-y-1">
                            {inv.installments?.map((inst: any, i: number) => (
                              <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  {inst.status === "PAID"
                                    ? <CheckCircle size={10} className="text-green-500 shrink-0" />
                                    : <Clock size={10} className="text-yellow-500 shrink-0" />}
                                  <span className="text-[11px] text-gray-600">
                                    {inst.isAdvance ? "Advance" : inst.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-medium text-gray-700">Rs {fmt(inst.amount)}</span>
                                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor(inst.status)}`}>
                                    {inst.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Action hint */}
                          {hasRemaining && (
                            <div className="mt-2 flex items-center gap-1.5 text-orange-500">
                              <Plus size={10} />
                              <span className="text-[10px] font-semibold">Rs {fmt(inv.remainingAmount)} remaining — more installments can be added</span>
                            </div>
                          )}
                          {!hasRemaining && (
                            <div className="mt-2 flex items-center gap-1.5 text-teal-500">
                              <CheckCircle size={10} />
                              <span className="text-[10px] font-semibold">Fully paid — a new invoice can be created</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* No invoice yet */}
                      {!hasInvoice && (
                        <div className="mt-2 flex items-center gap-1.5 text-orange-400 pt-2 border-t border-gray-100">
                          <AlertCircle size={10} />
                          <span className="text-[10px] font-semibold">No invoice found — create a new one</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {!isSearching && query.trim().length >= 2 && results.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No enrollment found</p>
                <p className="text-xs text-gray-300 mt-1">Please check the name or email</p>
              </div>
            )}

            {query.trim().length < 2 && (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <Search size={20} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">Type student name or email</p>
                <p className="text-xs text-gray-300 mt-1">Minimum 2 characters required</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 2A — Fresh Invoice Form
        ══════════════════════════════════════════════ */}
        {step === 2 && mode === "fresh" && (
          <>
            <div className="mx-5 mt-3 p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                <User size={14} className="text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{selectedEnrollment?.user?.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {selectedEnrollment?.program?.name}
                  {selectedEnrollment?.batch?.name ? ` · ${selectedEnrollment.batch.name}` : ""}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Total */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Old Invoice Number <span className="text-gray-400 font-normal">(optional — for migrated users)</span>
                </label>
                <input
                  type="text"
                  value={freshForm.invoiceNumber}
                  onChange={(e) => setFreshForm((p) => ({ ...p, invoiceNumber: e.target.value }))}
                  placeholder="e.g. INV-2023-0045"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Total Program Fee (Rs)</label>
                <input
                  type="number"
                  value={freshForm.totalAmount || ""}
                  onChange={(e) => setFreshForm((p) => ({ ...p, totalAmount: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. 200000"
                  required
                />
              </div>

              {/* Advance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Advance Amount (Rs)</label>
                  <input
                    type="number"
                    value={freshForm.advanceAmount || ""}
                    onChange={(e) => setFreshForm((p) => ({ ...p, advanceAmount: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 text-gray-900 placeholder:text-gray-400"
                    placeholder="e.g. 50000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Advance Due Date</label>
                  <input
                    type="date"
                    value={freshForm.advanceDueDate}
                    onChange={(e) => setFreshForm((p) => ({ ...p, advanceDueDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 text-gray-900"
                    required
                  />
                </div>
              </div>

              {/* Remaining badge — informational only, doesn't block submit unless negative */}
              {freshForm.totalAmount > 0 && (
                <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${freshRemaining < 0 ? "bg-rose-50 text-rose-600" : freshRemaining === 0 ? "bg-teal-50 text-teal-600" : "bg-orange-50 text-orange-600"}`}>
                  {freshRemaining < 0
                    ? `Over-allocated by Rs ${fmt(Math.abs(freshRemaining))}`
                    : freshRemaining === 0
                      ? "✓ Fully allocated"
                      : `Rs ${fmt(freshRemaining)} not yet allocated — can be added later as installments`}
                </div>
              )}

              {/* Installments — optional */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-600">Installments (Optional)</label>
                  <button type="button" onClick={addFreshInstallment} className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium">
                    <Plus size={12} /> Add
                  </button>
                </div>

                {freshForm.installments.length === 0 && (
                  <p className="text-[11px] text-gray-400 italic px-1">No installments added — this will be an advance-only invoice. More installments can be added anytime later.</p>
                )}

                <div className="space-y-2">
                  {freshForm.installments.map((inst, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <input
                          type="text"
                          value={inst.label}
                          onChange={(e) => updateFreshInstallment(idx, "label", e.target.value)}
                          className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none flex-1"
                          placeholder="Label e.g. Month 1"
                        />
                        <button type="button" onClick={() => removeFreshInstallment(idx)} className="text-rose-400 hover:text-rose-600 ml-2">
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Amount (Rs)"
                          value={inst.amount || ""}
                          onChange={(e) => updateFreshInstallment(idx, "amount", Number(e.target.value))}
                          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-400 bg-white text-gray-900 placeholder:text-gray-400"
                          required
                        />
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) => updateFreshInstallment(idx, "dueDate", e.target.value)}
                          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-400 bg-white text-gray-900"
                          required
                        />
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
                  value={freshForm.notes}
                  onChange={(e) => setFreshForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Any special instructions..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button onClick={handleClose} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleFreshSubmit}
                disabled={isPending || freshRemaining < 0 || freshForm.totalAmount <= 0 || freshForm.advanceAmount <= 0}
                className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Create Invoice"}
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════
            STEP 2B — Append Installments Form
        ══════════════════════════════════════════════ */}
        {step === 2 && mode === "append" && (
          <>
            {/* Student + invoice summary */}
            <div className="mx-5 mt-3 space-y-2">
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                  <User size={14} className="text-orange-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">{selectedEnrollment?.user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {selectedEnrollment?.program?.name}
                    {selectedEnrollment?.batch?.name ? ` · ${selectedEnrollment.batch.name}` : ""}
                  </p>
                </div>
              </div>

              {/* Existing invoice mini summary */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Existing Invoice — {existingInvoice?.invoiceNumber}
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="text-center">
                    <p className="text-[9px] text-gray-400">Total</p>
                    <p className="text-xs font-bold text-gray-700">Rs {fmt(existingInvoice?.totalAmount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-green-500">Paid</p>
                    <p className="text-xs font-bold text-green-600">Rs {fmt(existingInvoice?.paidAmount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-orange-400">Remaining</p>
                    <p className="text-xs font-bold text-orange-600">Rs {fmt(existingInvoice?.remainingAmount)}</p>
                  </div>
                </div>

                {/* Existing installments */}
                <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                  {existingInvoice?.installments?.map((inst: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {inst.status === "PAID"
                          ? <CheckCircle size={10} className="text-green-500" />
                          : <Clock size={10} className="text-yellow-500" />}
                        <span className="text-[11px] text-gray-600">{inst.isAdvance ? "Advance" : inst.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-gray-700">Rs {fmt(inst.amount)}</span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor(inst.status)}`}>{inst.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Remaining allocation badge — informational, only blocks on over-allocation */}
              <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${appendRemaining < 0 ? "bg-rose-50 text-rose-600" : appendRemaining === 0 ? "bg-teal-50 text-teal-600" : "bg-orange-50 text-orange-600"}`}>
                {appendRemaining < 0
                  ? `Over-allocated by Rs ${fmt(Math.abs(appendRemaining))}`
                  : appendRemaining === 0
                    ? "✓ Fully allocated"
                    : `Rs ${fmt(appendRemaining)} still unallocated — can be added later too`}
              </div>

              {/* New installments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-600">New Installments</label>
                  <button type="button" onClick={addAppendInstallment} className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium">
                    <Plus size={12} /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {appendInstallments.map((inst, idx) => (
                    <div key={idx} className="border border-orange-100 rounded-xl p-3 bg-orange-50/40">
                      <div className="flex items-center justify-between mb-2">
                        <input
                          type="text"
                          value={inst.label}
                          onChange={(e) => updateAppendInstallment(idx, "label", e.target.value)}
                          className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none flex-1"
                          placeholder="Label e.g. Month 3"
                        />
                        {appendInstallments.length > 1 && (
                          <button type="button" onClick={() => removeAppendInstallment(idx)} className="text-rose-400 hover:text-rose-600 ml-2">
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Amount (Rs)"
                          value={inst.amount || ""}
                          onChange={(e) => updateAppendInstallment(idx, "amount", Number(e.target.value))}
                          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-400 bg-white text-gray-900 placeholder:text-gray-400"
                          required
                        />
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) => updateAppendInstallment(idx, "dueDate", e.target.value)}
                          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-400 bg-white text-gray-900"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button onClick={handleClose} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleAppendSubmit}
                disabled={isPending || appendRemaining < 0 || appendTotal <= 0}
                className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Add Installments"}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}