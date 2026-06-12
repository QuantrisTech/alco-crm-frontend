"use client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyLeadContract, getProfile, submitLeadContract } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FileText, CheckCircle, PenLine, Type, RotateCcw,
  Loader2, Clock, ChevronRight, Lock, AlertCircle,
  ArrowLeft, Edit3, Save,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import PageHeader from "@/app/component/dashboard/page-header";
import ContractPDFGenerator from "@/app/component/dashboard/contract-pdf-generator";
import DocumentsSection from "../profile/component/documents-section";
import InputField from "@/app/component/ui/inputField";

const formatPhone = (phone?: string) => {
  if (!phone) return "—";

  // Trim and remove non-digit characters
  const digits = phone.trim().replace(/\D/g, "");

  // Normalize the number
  let normalized = digits;

  // Handle leading zeros and international formats
  if (normalized.startsWith("0")) {
    normalized = normalized.slice(1); // Remove leading zero
  } else if (normalized.startsWith("0092")) {
    normalized = normalized.slice(4); // Remove '0092'
  } else if (normalized.startsWith("92")) {
    normalized = normalized.slice(2); // Remove '92'
  }

  // Ensure it has the correct number of digits
  if (normalized.length === 10) {
    return `+92 ${normalized.slice(0, 3)} ${normalized.slice(3)}`;
  } else if (normalized.length === 11 && normalized.startsWith("3")) {
    // Handle cases where the number starts with 3 (mobile numbers)
    return `+92 ${normalized.slice(0, 3)} ${normalized.slice(3)}`;
  }

  return phone; // Return original if it doesn't match expected patterns
};


// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type Installment = { label: string; amount: number; dueDate: string; status: string };
type PaymentPlan = {
  totalAmount: number;
  advanceAmount: number;
  advanceDueDate: string;
  installments: Installment[];
  notes?: string;
};
type ContractDetails = {
  fullName?: string;
  email?: string;
  phone?: string;
  programName?: string;
  fatherHusbandName?: string;
  cnic?: string;
  bankAccountNumber?: string;
  currentAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  occupation?: string;
  participationAgreement?: boolean;
  photoVideoRelease?: boolean;
  signatureType?: "draw" | "type";
  signatureData?: string;
  status?: "pending" | "filled" | "signed";
  signedAt?: string;
  submittedAt?: string;
};
type Lead = {
  _id: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  program_name?: string;
  program_id?: { _id: string; name: string };
  contractDetails?: ContractDetails;
  paymentPlan?: PaymentPlan;
  status: string;
  updatedAt: string;
  createdAt: string;
  invoiceNumber?: string;
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const formatAmount = (n?: number) => `Rs ${Number(n || 0).toLocaleString("en-PK")}`;

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-400" },
  filled: { label: "Filled", color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-400" },
  signed: { label: "Signed", color: "text-teal-700", bg: "bg-teal-50", dot: "bg-teal-400" },
};

const leadStatusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "text-gray-500" },
  contacted: { label: "Contacted", color: "text-blue-600" },
  qualified: { label: "Qualified", color: "text-violet-600" },
  interested: { label: "Interested", color: "text-amber-600" },
  converted: { label: "Converted", color: "text-teal-600" },
  lost: { label: "Lost", color: "text-red-500" },
};

// ─────────────────────────────────────────────────────────────
// Signature Canvas
// ─────────────────────────────────────────────────────────────
function SignatureCanvas({ onSave }: { onSave: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true); setIsEmpty(false);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#1a1a2e";
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
  };
  const stopDraw = () => setIsDrawing(false);
  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };
  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div>
      <canvas
        ref={canvasRef} width={460} height={140}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        className="w-full border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 cursor-crosshair touch-none"
        style={{ height: 140 }}
      />
      <div className="flex gap-2 mt-2">
        <button type="button" onClick={clear}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
          <RotateCcw size={11} /> Clear
        </button>
        <button type="button" onClick={save} disabled={isEmpty}
          className="flex items-center gap-1.5 text-xs text-teal-600 font-semibold px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-50 disabled:opacity-40">
          <CheckCircle size={11} /> Use This Signature
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Contract Form (fill / edit)
// ─────────────────────────────────────────────────────────────
function ContractForm({ lead, onBack }: { lead: Lead; onBack: () => void }) {
  const queryClient = useQueryClient();
  const { user: authUser } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const contract = lead.contractDetails;
  const paymentPlan = lead.paymentPlan;
  const isConverted = lead.status === "converted";

  // ── Helper: build fresh form from lead ──
  const buildForm = useCallback((c: ContractDetails | undefined) => ({
    fatherHusbandName: c?.fatherHusbandName || "",
    cnic: c?.cnic || "",
    bankAccountNumber: c?.bankAccountNumber || "",
    currentAddress: c?.currentAddress || "",
    emergencyContactName: c?.emergencyContactName || "",
    emergencyContactPhone: c?.emergencyContactPhone || "",
    occupation: c?.occupation || "",
    participationAgreement: c?.participationAgreement || false,
    photoVideoRelease: c?.photoVideoRelease || false,
  }), []);

  const [form, setForm] = useState(() => buildForm(contract));
  const [savedForm, setSavedForm] = useState(() => buildForm(contract));

  const [signatureType, setSignatureType] = useState<"draw" | "type">(contract?.signatureType || "draw");
  const [typedSignature, setTypedSignature] = useState(
    contract?.signatureType === "type" ? contract.signatureData || "" : ""
  );
  const [drawnSignature, setDrawnSignature] = useState(
    contract?.signatureType === "draw" ? contract?.signatureData || "" : ""
  );
  const [signatureSaved, setSignatureSaved] = useState(!!contract?.signatureData);
  const [savedSignatureType, setSavedSignatureType] = useState<"draw" | "type">(contract?.signatureType || "draw");
  const [savedSignatureData, setSavedSignatureData] = useState(contract?.signatureData || "");

  // ✅ Lead prop update honay par form sync karo (image upload/delete ke baad bhi)
  useEffect(() => {
    const fresh = buildForm(lead.contractDetails);
    setForm(fresh);
    setSavedForm(fresh);
    setSignatureType(lead.contractDetails?.signatureType || "draw");
    setSavedSignatureType(lead.contractDetails?.signatureType || "draw");
    const sigData = lead.contractDetails?.signatureData || "";
    setSavedSignatureData(sigData);
    if (lead.contractDetails?.signatureType === "type") {
      setTypedSignature(sigData);
    } else {
      setDrawnSignature(sigData);
    }
    setSignatureSaved(!!sigData);
  }, [lead, buildForm]);

  // ✅ Dirty check — koi bhi change hua?
  const currentSignatureData = signatureType === "type" ? typedSignature : drawnSignature;
  const isDirty =
    JSON.stringify(form) !== JSON.stringify(savedForm) ||
    signatureType !== savedSignatureType ||
    currentSignatureData !== savedSignatureData;

  const { mutate: submitContract, isPending: isSubmitting } = useMutation({
    mutationFn: (data: any) => submitLeadContract(lead._id, data),
    onSuccess: () => {
      toast.success("Contract submitted successfully! ✅");
      queryClient.invalidateQueries({ queryKey: ["my-contract"] });
      // saved state update (optimistic)
      setSavedForm({ ...form });
      setSavedSignatureType(signatureType);
      setSavedSignatureData(currentSignatureData);
      onBack();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to submit!"),
  });

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile().then((res) => res.data.user),
  });

  const isValidPhone = (phone: string) => {
    const digits = phone.trim().replace(/\D/g, "");

    // Valid Pakistani phone formats:
    // 1. 03XX-XXXXXXX (11 digits, starts with 0)
    // 2. +923XX-XXXXXXX (92 prefix, 12 digits)
    // 3. 923XX-XXXXXXX (92 prefix without +, 12 digits)

    return (
      /^03\d{9}$/.test(digits) ||           // 03XX-XXXXXXX (11 digits)
      /^923\d{9}$/.test(digits) ||          // 923XX-XXXXXXX (12 digits)
      /^92\d{10}$/.test(digits)             // 92XXXXXXXXXX (12 digits)
    );
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Required field validation — correct order
    if (!form.fatherHusbandName.trim()) {
      toast.error("Father / Husband Name is required");
      return;
    }
    if (!form.cnic.trim()) {
      toast.error("CNIC Number is required");
      return;
    }
    if (!form.currentAddress.trim()) {
      toast.error("Current Address is required");
      return;
    }
    if (!form.emergencyContactName.trim()) {
      toast.error("Emergency Contact Name is required");
      return;
    }
    // ✅ Phone field pe phone validation — name field pe nahi
    if (!form.emergencyContactPhone.trim()) {
      toast.error("Emergency Contact Phone is required");
      return;
    }
    if (!isValidPhone(form.emergencyContactPhone)) {
      toast.error("Please enter a valid phone number (e.g. 03XX-XXXXXXX)");
      return;
    }
    if (!form.participationAgreement || !form.photoVideoRelease) {
      toast.error("Please agree to both agreements");
      return;
    }

    const signatureData = signatureType === "type" ? typedSignature : drawnSignature;
    if (!signatureData) {
      toast.error("Please provide your signature");
      return;
    }

    submitContract({ ...form, signatureType, signatureData });
  };

  const alreadySigned = contract?.status === "signed";

  // ✅ PDF mein naam — authUser se fallback
  const displayName = contract?.fullName || `${lead.first_name || ""} ${lead.last_name || ""}`.trim() || authUser?.name || "—";

  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const handleBack = () => {
    if (isDirty) {
      setShowLeaveModal(true); // popup dikhao
    } else {
      onBack();
    }
  };

  // useEffect(() => {
  //   const handler = (e: BeforeUnloadEvent) => {
  //     if (isDirty) {
  //       e.preventDefault();
  //       e.returnValue = ""; // browser apna default popup dikhayega
  //     }
  //   };
  //   window.addEventListener("beforeunload", handler);
  //   return () => window.removeEventListener("beforeunload", handler);
  // }, [isDirty]);
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (!isDirty) return;

      // browser ko current page par wapas rakho
      window.history.pushState(null, "", window.location.href);

      setShowLeaveModal(true);
    };

    // history entry add karo
    window.history.pushState(null, "", window.location.href);

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirty]);

  return (
    <div className="space-y-5 relative">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button onClick={handleBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition font-medium">
          <ArrowLeft size={16} /> Back to Contracts
        </button>

        {/* ✅ Floating Save button — top right */}
        {!isConverted && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isDirty || isSubmitting}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm
              ${isDirty
                ? "bg-yellow-400 hover:bg-yellow-500 text-gray-900 cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
              } disabled:opacity-60`}
          >
            {isSubmitting
              ? <Loader2 size={14} className="animate-spin" />
              : <Save size={14} />
            }
            {isSubmitting ? "Saving..." : isDirty ? "Save Changes" : "Saved"}
          </button>
        )}

        {/* ── Unsaved Changes Modal ── */}
        {showLeaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertCircle size={18} className="text-amber-500" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">Unsaved Changes</p>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                You have unsaved changes in your contract. If you leave now, your changes will be lost.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Stay on page
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveModal(false);
                    onBack();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition"
                >
                  Leave anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Program + status header */}
      <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Program</p>
          <p className="font-semibold text-gray-800">{lead.program_id?.name || lead.program_name || "—"}</p>
        </div>
        <div className="text-right">
          {(() => {
            const cs = statusConfig[contract?.status || "pending"];
            return (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cs.bg} ${cs.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cs.dot}`} />
                {cs.label}
              </span>
            );
          })()}
          {isConverted && (
            <div className="flex items-center gap-1 mt-1 text-xs text-teal-600 justify-end">
              <Lock size={11} /> Converted — read only
            </div>
          )}
        </div>
      </div>

      {/* Signed banner */}
      {alreadySigned && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-teal-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-teal-700">Contract Signed</p>
            <p className="text-xs text-teal-600">Signed on {formatDate(contract?.signedAt)}</p>
          </div>
          {!isConverted && (
            <span className="ml-auto text-xs text-teal-600 bg-teal-100 px-2 py-1 rounded-lg font-medium">
              Editable until converted
            </span>
          )}
        </div>
      )}

      {/* Converted banner */}
      {isConverted && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
          <Lock size={18} className="text-gray-400 shrink-0" />
          <p className="text-sm text-gray-500">This lead has been converted. Contract is now locked.</p>
        </div>
      )}

      {/* Payment Plan */}
      {paymentPlan && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3">Payment Plan</p>
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div className="bg-white rounded-xl py-3 px-2">
              <p className="text-xs text-gray-400 mb-1">Total Fee</p>
              <p className="font-bold text-gray-800 text-sm">{formatAmount(paymentPlan.totalAmount)}</p>
            </div>
            <div className="bg-white rounded-xl py-3 px-2">
              <p className="text-xs text-gray-400 mb-1">Advance</p>
              <p className="font-bold text-amber-600 text-sm">{formatAmount(paymentPlan.advanceAmount)}</p>
            </div>
            <div className="bg-white rounded-xl py-3 px-2">
              <p className="text-xs text-gray-400 mb-1">Installments</p>
              <p className="font-bold text-gray-800 text-sm">{paymentPlan.installments?.length || 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl overflow-hidden border border-amber-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-amber-50/60">
                  <th className="px-3 py-2 text-left text-gray-500 font-semibold">#</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-semibold">Description</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-semibold">Due Date</th>
                  <th className="px-3 py-2 text-right text-gray-500 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-amber-50 bg-amber-50/30">
                  <td className="px-3 py-2 font-mono text-gray-400">00</td>
                  <td className="px-3 py-2 font-medium text-gray-700">
                    Advance Payment
                    <span className="ml-1.5 text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase">Advance</span>
                  </td>
                  <td className="px-3 py-2 text-gray-400 font-mono">{formatDate(paymentPlan.advanceDueDate)}</td>
                  <td className="px-3 py-2 text-right font-semibold font-mono">{formatAmount(paymentPlan.advanceAmount)}</td>
                </tr>
                {paymentPlan.installments?.map((inst, idx) => (
                  <tr key={idx} className="border-t border-gray-50">
                    <td className="px-3 py-2 font-mono text-gray-400">{String(idx + 1).padStart(2, "0")}</td>
                    <td className="px-3 py-2 font-medium text-gray-700">{inst.label}</td>
                    <td className="px-3 py-2 text-gray-400 font-mono">{formatDate(inst.dueDate)}</td>
                    <td className="px-3 py-2 text-right font-semibold font-mono">{formatAmount(inst.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!paymentPlan && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <Clock size={18} className="text-sky-500 shrink-0" />
          <p className="text-sm text-sky-700">Your payment plan is being prepared. You can still fill in your details now.</p>
        </div>
      )}

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Auto-filled Info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Program Information</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Full Name", value: displayName },
              { label: "Email", value: lead.email || authUser?.email || "—" },
              { label: "Phone", value: formatPhone(lead.phone) },
              { label: "Program", value: lead.program_id?.name || contract?.programName || "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                <p className="text-sm font-medium text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ CNIC Documents — queryKey sirf "profile" rakho taake image upload/delete par sirf yeh section refresh ho, poori form nahi */}
        <DocumentsSection
          userId={authUser?._id!}
          documents={profileData?.documents || []}
          defaultType="cnic"
          showDropdown={false}
          filterType="cnic"
          queryKey={["profile"]}
          title="CNIC Documents"
          description="Upload a clear photo or scan of your CNIC (front & back)"
        />

        {/* Personal Details */}
        {/* <fieldset disabled={isConverted} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm disabled:opacity-70">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Personal Details</p>
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Father / Husband Name <span className="text-rose-400">*</span>
              </label>
              <input type="text" value={form.fatherHusbandName}
                onChange={(e) => setForm((p) => ({ ...p, fatherHusbandName: e.target.value }))}
                placeholder="Enter name" required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 text-gray-900 placeholder:text-gray-400" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                CNIC Number <span className="text-rose-400">*</span>
              </label>
              <input type="text" value={form.cnic}
                onChange={(e) => setForm((p) => ({ ...p, cnic: e.target.value }))}
                placeholder="XXXXX-XXXXXXX-X" required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 text-gray-900 placeholder:text-gray-400" />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Current Address <span className="text-rose-400">*</span>
              </label>
              <input type="text" value={form.currentAddress}
                onChange={(e) => setForm((p) => ({ ...p, currentAddress: e.target.value }))}
                placeholder="Enter your full address" required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 text-gray-900 placeholder:text-gray-400" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Bank Account Number</label>
              <input type="text" value={form.bankAccountNumber}
                onChange={(e) => setForm((p) => ({ ...p, bankAccountNumber: e.target.value }))}
                placeholder="Account number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 text-gray-900 placeholder:text-gray-400" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Emergency Contact <span className="text-rose-400">*</span>
              </label>
              <input type="text" value={form.emergencyContactName}
                onChange={(e) => setForm((p) => ({ ...p, emergencyContactName: e.target.value }))}
                placeholder="Name (next of kin)" required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 text-gray-900 placeholder:text-gray-400" />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Occupation / Company</label>
              <input type="text" value={form.occupation}
                onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))}
                placeholder="e.g. Software Engineer at XYZ, Student at ABC"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 text-gray-900 placeholder:text-gray-400" />
            </div>
          </div>
        </fieldset> */}
        <fieldset disabled={isConverted} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm disabled:opacity-70">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Personal Details</p>
          <div className="grid grid-cols-2 gap-4">

            <InputField
              label="Father / Husband Name *"
              value={form.fatherHusbandName}
              onChange={(e) => setForm((p) => ({ ...p, fatherHusbandName: e.target.value }))}
              placeholder="Enter name"
              disabled={isConverted}
            />

            <InputField
              label="CNIC Number *"
              value={form.cnic}
              onChange={(e) => setForm((p) => ({ ...p, cnic: e.target.value }))}
              placeholder="XXXXX-XXXXXXX-X"
              disabled={isConverted}
            />

            <div className="col-span-2">
              <InputField
                label="Current Address *"
                value={form.currentAddress}
                onChange={(e) => setForm((p) => ({ ...p, currentAddress: e.target.value }))}
                placeholder="Enter your full address"
                disabled={isConverted}
              />
            </div>
            <div className="col-span-2">
              <InputField
                label="Bank Account Number"
                value={form.bankAccountNumber}
                onChange={(e) => setForm((p) => ({ ...p, bankAccountNumber: e.target.value }))}
                placeholder="Account number"
                disabled={isConverted}
              />
            </div>
            <InputField
              label="Emergency Contact Name*"
              value={form.emergencyContactName}
              onChange={(e) => setForm((p) => ({ ...p, emergencyContactName: e.target.value }))}
              placeholder="Name"
              disabled={isConverted}
            />
            <InputField
              label="Emergency Contact Number*"
              value={form.emergencyContactPhone}
              onChange={(e) => setForm((p) => ({ ...p, emergencyContactPhone: e.target.value }))}
              placeholder="Phone"
              disabled={isConverted}
            />

            <div className="col-span-2">
              <InputField
                label="Occupation / Company"
                value={form.occupation}
                onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))}
                placeholder="e.g. Software Engineer at XYZ, Student at ABC"
                disabled={isConverted}
              />
            </div>

          </div>
        </fieldset>

        {/* Agreements */}
        <fieldset disabled={isConverted} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm disabled:opacity-70">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Agreements</p>
          <div className="space-y-4">
            {[
              {
                id: "participation", key: "participationAgreement" as const,
                title: "Participation Agreement",
                text: "I understand that the information contained in this training is useful in creating rapid and lasting change. I hereby agree to use this information only for the purpose of self-improvement and to achieve a positive outcome. I certify that my participation is of my own free will and I accept complete responsibility for my well-being.",
              },
              {
                id: "photoRelease", key: "photoVideoRelease" as const,
                title: "Photo / Video Release",
                text: "I understand that portions of this training may be photographed and/or recorded on video or audio. I agree that no compensation will be paid to me for any products or revenue derived from these photographs or recordings. I waive all rights I may be entitled to from the use of such images or recordings.",
              },
            ].map(({ id, key, title, text }) => (
              <div key={id}
                className={`border rounded-xl p-4 transition-colors ${form[key] ? "border-teal-200 bg-teal-50/40" : "border-gray-100 bg-gray-50"}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id={id} checked={form[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-teal-500" />
                  <label htmlFor={id} className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                    <span className="font-semibold block mb-1">{title}</span>
                    {text}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        {/* Signature */}
        <fieldset disabled={isConverted} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm disabled:opacity-70">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
            Signature <span className="text-rose-400">*</span>
          </p>

          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-4">
            {(["draw", "type"] as const).map((t) => (
              <button key={t} type="button"
                onClick={() => { setSignatureType(t); setSignatureSaved(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${signatureType === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {t === "draw" ? <><PenLine size={12} /> Draw</> : <><Type size={12} /> Type</>}
              </button>
            ))}
          </div>

          {signatureType === "draw" && (
            drawnSignature && signatureSaved ? (
              <div className="relative">
                <img src={drawnSignature} alt="Signature"
                  className="w-full rounded-xl border border-teal-200 bg-gray-50" style={{ height: 140, objectFit: "contain" }} />
                <div className="absolute top-2 right-2 bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={10} /> Saved
                </div>
                {!isConverted && (
                  <button type="button" onClick={() => { setDrawnSignature(""); setSignatureSaved(false); }}
                    className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    <RotateCcw size={11} /> Redo signature
                  </button>
                )}
              </div>
            ) : (
              <SignatureCanvas onSave={(data) => { setDrawnSignature(data); setSignatureSaved(true); }} />
            )
          )}

          {signatureType === "type" && (
            <div>
              <input type="text" value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Type your full name as signature"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-yellow-400 text-gray-800 placeholder:text-gray-300"
                style={{ fontFamily: "'Dancing Script', cursive, serif" }} />
              {typedSignature && (
                <p className="text-xs text-teal-600 mt-1.5 flex items-center gap-1">
                  <CheckCircle size={11} /> Typed signature ready
                </p>
              )}
            </div>
          )}
        </fieldset>

        {/* PDF Preview (if signed) */}
        {alreadySigned && (
          <ContractPDFGenerator
            mode="preview"
            contractData={{
              fullName: displayName, // ✅ fixed
              email: lead.email,
              phone: lead.phone,
              programName: lead.program_id?.name || contract?.programName,
              fatherHusbandName: contract?.fatherHusbandName,
              cnic: contract?.cnic,
              bankAccountNumber: contract?.bankAccountNumber,
              currentAddress: contract?.currentAddress,
              emergencyContactName: contract?.emergencyContactName,
              occupation: contract?.occupation,
              participationAgreement: contract?.participationAgreement,
              photoVideoRelease: contract?.photoVideoRelease,
              signatureData: contract?.signatureData,
              signedAt: contract?.signedAt,
              paymentPlan,
              invoiceNumber: lead.invoiceNumber || "",
            }}
          />
        )}

        {/* Submit button (bottom) — still kept for convenience */}
        {!isConverted && (
          <>
            <button type="submit"
              disabled={isSubmitting || !form.participationAgreement || !form.photoVideoRelease}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold text-sm hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm">
              {isSubmitting
                ? <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                : <><FileText size={16} /> {alreadySigned ? "Re-submit Contract" : "Submit Signed Contract"}</>}
            </button>
            <p className="text-xs text-gray-400 text-center pb-4">
              By submitting, you confirm that all information is accurate and you agree to the terms above.
            </p>
          </>
        )}
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Contract Card (list item)  — unchanged
// ─────────────────────────────────────────────────────────────
function ContractCard({ lead, onOpen, onViewPDF }: { lead: Lead; onOpen: () => void, onViewPDF: () => void; }) {
  const contract = lead.contractDetails;
  const isConverted = lead.status === "converted";
  const cs = statusConfig[contract?.status || "pending"];
  const ls = leadStatusConfig[lead.status] || { label: lead.status, color: "text-gray-500" };

  return (
    <button onClick={onOpen}
      className="w-full text-left bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isConverted ? "bg-teal-50" : "bg-yellow-50"}`}>
            {isConverted
              ? <CheckCircle size={20} className="text-teal-500" />
              : <FileText size={20} className="text-yellow-500" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">
              {lead.program_id?.name || lead.program_name || "Program"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Applied {formatDate(lead.createdAt)}
              {contract?.signedAt && ` · Signed ${formatDate(contract.signedAt)}`}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${cs.bg} ${cs.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cs.dot}`} />
                {cs.label}
              </span>
              <span className={`text-[10px] font-semibold ${ls.color}`}>{ls.label}</span>
              {!isConverted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  <Edit3 size={9} /> Editable
                </span>
              )}
              {isConverted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                  <Lock size={9} /> Locked
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition shrink-0 mt-1" />
      </div>
      {lead.paymentPlan && (
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-500">
          <span>Total: <span className="font-semibold text-gray-700">{formatAmount(lead.paymentPlan.totalAmount)}</span></span>
          <span>Advance: <span className="font-semibold text-amber-600">{formatAmount(lead.paymentPlan.advanceAmount)}</span></span>
          <span>{lead.paymentPlan.installments?.length || 0} installments</span>
        </div>
      )}

      {contract?.status === "signed" && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onViewPDF(); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition"
          >
            <FileText size={12} /> View Contract
          </button>
        </div>
      )}
    </button>
  );
}

function ContractPDFModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const contract = lead.contractDetails;
  const paymentPlan = lead.paymentPlan;
  const displayName = contract?.fullName ||
    `${lead.first_name || ""} ${lead.last_name || ""}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
              <FileText size={18} className="text-teal-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">
                {lead.program_id?.name || lead.program_name || "Contract"}
              </p>
              <p className="text-xs text-gray-400">
                Signed {formatDate(contract?.signedAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition text-gray-500 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* PDF Generator */}
        <div className="p-5">
          <ContractPDFGenerator
            mode="preview"
            contractData={{
              fullName: displayName,
              email: lead.email,
              phone: lead.phone,
              programName: lead.program_id?.name || contract?.programName,
              fatherHusbandName: contract?.fatherHusbandName,
              cnic: contract?.cnic,
              bankAccountNumber: contract?.bankAccountNumber,
              currentAddress: contract?.currentAddress,
              emergencyContactName: contract?.emergencyContactName,
              occupation: contract?.occupation,
              participationAgreement: contract?.participationAgreement,
              photoVideoRelease: contract?.photoVideoRelease,
              signatureData: contract?.signatureData,
              signedAt: contract?.signedAt,
              paymentPlan,
              invoiceNumber: lead.invoiceNumber || "",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page — unchanged
// ─────────────────────────────────────────────────────────────
export default function MyContractsPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [pdfLeadId, setPdfLeadId] = useState<string | null>(null);


  const { data, isLoading } = useQuery({
    queryKey: ["my-contract"],
    queryFn: () => getMyLeadContract().then((r) => r.data),
  });

  const leads: Lead[] = data?.data || [];
  const selectedLead = selectedLeadId
    ? leads.find((l) => l._id === selectedLeadId) ?? null
    : null;

  const pdfLead = pdfLeadId ? leads.find((l) => l._id === pdfLeadId) ?? null : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-yellow-400" />
      </div>
    );
  }



  if (selectedLead) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Contract Details"
          subtitle={selectedLead.program_id?.name || selectedLead.program_name || ""}
          titleIcon={<FileText size={24} />}
        />
        <div className="max-w-3xl">
          <ContractForm lead={selectedLead} onBack={() => setSelectedLeadId(null)} />
        </div>


      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pdfLead && (
        <ContractPDFModal
          lead={pdfLead}
          onClose={() => setPdfLeadId(null)}
        />
      )}

      <PageHeader
        title="My Contracts"
        subtitle="Your enrollment agreements across all programs"
        titleIcon={<FileText size={24} />}
      />
      <div className="max-w-3xl space-y-4">
        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <Clock size={24} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-600">No Contracts Yet</p>
            <p className="text-sm text-gray-400 text-center max-w-sm">
              Your contract will appear here once your application has been shortlisted.
              Please wait for our team to contact you.
            </p>
          </div>
        )}
        {leads.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: leads.length, color: "text-gray-800" },
              { label: "Signed", value: leads.filter((l) => l.contractDetails?.status === "signed").length, color: "text-teal-600" },
              { label: "Editable", value: leads.filter((l) => l.status !== "converted").length, color: "text-blue-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm text-center">
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
        {leads.some((l) => l.status !== "converted") && (
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Contracts marked <span className="font-semibold">Editable</span> can be updated until your lead is converted by our team.
            </p>
          </div>
        )}
        {leads.map((lead) => (
          <ContractCard key={lead._id} lead={lead} onOpen={() => setSelectedLeadId(lead._id)} onViewPDF={() => setPdfLeadId(lead._id)} />
        ))}
      </div>
    </div>
  );
}