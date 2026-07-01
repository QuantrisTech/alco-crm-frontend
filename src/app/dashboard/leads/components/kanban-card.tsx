"use client";
import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qualityColor } from '../shared/constants';
import {
  Activity, Tag, UserCheck, UserPlus, XCircle, CreditCard,
  CheckCircle2, Clock, PenLine, ArrowLeftRight, ShieldCheck, Flame, GraduationCap
} from 'lucide-react';
import { MdOutlineRemoveRedEye } from "react-icons/md";
import toast from "react-hot-toast";
import {
  adminGetBatches,
} from "@/utils/api";

const cardStyle = (status: string) => {
  switch (status) {
    case "lost": return "bg-rose-50/70 border-rose-200";
    case "converted": return "bg-blue-50/70 border-blue-200";
    case "enrolled": return "bg-green-50/70 border-green-200";
    default: return "bg-white border-gray-100";
  }
};

// ── Batch Select Modal ────────────────────────────────────────────
function BatchSelectModal({ lead, onConfirm, onClose }: {
  lead: any;
  onConfirm: (batchId: string) => void;
  onClose: () => void;
}) {
  const [selectedBatch, setSelectedBatch] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-batches", { status: "active" }],
    queryFn: () => adminGetBatches({ status: "active" }).then((res) => res.data),
  });

  console.log("Batch query error:", data)

  const handleConfirm = () => {
    if (!selectedBatch) {
      setError("Please select a batch to continue.");
      return;
    }
    onConfirm(selectedBatch);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <UserCheck size={16} className="text-teal-500" />
          <h3 className="text-sm font-semibold text-gray-800">Convert Lead</h3>
        </div>
        <p className="text-[11px] text-gray-400 mb-4">
          Select an active batch for <span className="font-medium text-gray-600">{lead.first_name} {lead.last_name}</span> before converting.
        </p>

        {/* Batch Dropdown */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <select
            value={selectedBatch}
            onChange={(e) => { setSelectedBatch(e.target.value); setError(""); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-gray-50"
          >
            <option value="">— Select Batch —</option>
            {data?.data?.map((batch: any) => (
              <option key={batch._id} value={batch._id}>
                {batch.name} {batch.start_date ? `(${new Date(batch.start_date).toLocaleDateString()})` : ""}
              </option>
            ))}
          </select>
        )}

        {/* Error */}
        {error && (
          <p className="text-[11px] text-rose-500 mt-2">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !selectedBatch}
            className="flex-1 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Convert
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Enroll Modal ──────────────────────────────────────────────────
function EnrollModal({ lead, onConfirm, onClose, isLoading }: {
  lead: any;
  onConfirm: (advancePaid: boolean, method: string) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [advancePaid, setAdvancePaid] = useState(false);
  const [method, setMethod] = useState("cash");
  const pp = lead.paymentPlan;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap size={16} className="text-green-500" />
          <h3 className="text-sm font-semibold text-gray-800">Enroll Student</h3>
        </div>
        <p className="text-[11px] text-gray-400 mb-4">
          <span className="font-medium text-gray-600">{lead.first_name} {lead.last_name}</span> will be moved to the Enrollment module. Lead record will be deleted.
        </p>

        {/* Payment plan summary */}
        {pp && (
          <div className="bg-gray-50 rounded-lg px-3 py-2.5 mb-4 space-y-1">
            <p className="text-[11px] font-semibold text-gray-600 mb-1.5">Payment Plan</p>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Total Amount</span>
              <span className="font-medium text-gray-700">Rs {Number(pp.totalAmount || 0).toLocaleString()}</span>
            </div>
            {pp.advanceAmount && (
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">Advance</span>
                <span className="font-medium text-amber-600">Rs {Number(pp.advanceAmount).toLocaleString()}</span>
              </div>
            )}
            {(pp.installments || []).length > 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">Installments</span>
                <span className="text-gray-600">{pp.installments.length} remaining</span>
              </div>
            )}
          </div>
        )}

        {/* Advance paid toggle */}
        {pp?.advanceAmount && (
          <div className="mb-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => setAdvancePaid(!advancePaid)}
                className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5
                  ${advancePaid ? "bg-green-500" : "bg-gray-200"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform
                  ${advancePaid ? "translate-x-4" : "translate-x-0"}`} />
              </div>
              <span className="text-[12px] text-gray-600">
                Advance payment collected now
                <span className={`ml-1.5 font-semibold ${advancePaid ? "text-green-600" : "text-gray-400"}`}>
                  {advancePaid ? "(Access will be ACTIVE)" : "(Access will be RESTRICTED)"}
                </span>
              </span>
            </label>
          </div>
        )}

        {/* Payment method — only if advance paid */}
        {advancePaid && (
          <div className="mb-4">
            <p className="text-[11px] text-gray-500 mb-1.5">Payment Method</p>
            <div className="flex gap-2">
              {["cash", "bank", "cheque"].map((m) => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition
                    ${method === m
                      ? "bg-green-50 border-green-300 text-green-700"
                      : "border-gray-200 text-gray-400 hover:border-gray-300"}`}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Warning */}
        <div className={`rounded-lg px-3 py-2 mb-5 border ${advancePaid ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"}`}>
          <p className={`text-[11px] font-medium ${advancePaid ? "text-green-600" : "text-amber-600"}`}>
            {advancePaid
              ? "✓ Student will get immediate access after enrollment."
              : "⚠ Student access will be restricted until advance is paid via Finance module."}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onClose} disabled={isLoading}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition disabled:opacity-40">
            Cancel
          </button>
          <button onClick={() => onConfirm(advancePaid, method)} disabled={isLoading}
            className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
            {isLoading
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enrolling...</>
              : "Enroll Student"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contract Badge ────────────────────────────────────────────────
// canEdit: agar true hai to "filled" aur "pending" states bhi clickable
// hongi taake admin lead convert hone se pehle contract edit/fill kar sake.
function ContractBadge({ contractDetails, onViewContract, lead, canEdit }: any) {
  const status = contractDetails?.status;
  if (!status) return null;

  if (status === "signed") return (
    <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); onViewContract?.(lead); }}
      className="flex items-center justify-between my-2 px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-100 cursor-pointer hover:bg-teal-100 transition-colors group/contract">
      <div className="flex items-center gap-1.5">
        <CheckCircle2 size={10} className="text-teal-500 shrink-0" />
        <span className="text-[10px] font-semibold text-teal-600">Contract Signed</span>
      </div>
      <span className="text-[9px] text-teal-400 group-hover/contract:text-teal-600 transition-colors">View PDF →</span>
    </div>
  );

  if (status === "filled") return (
    <div
      onClick={canEdit ? (e) => { e.stopPropagation(); e.preventDefault(); onViewContract?.(lead); } : undefined}
      className={`flex items-center gap-1.5 my-2 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 transition-colors group/contract ${canEdit ? "cursor-pointer hover:bg-indigo-100" : ""}`}
    >
      <PenLine size={10} className="text-indigo-400 shrink-0" />
      <span className="text-[10px] font-semibold text-indigo-500">Contract Filled</span>
      {canEdit ? (
        <span className="text-[9px] text-indigo-300 ml-auto group-hover/contract:text-indigo-500 transition-colors">Edit →</span>
      ) : (
        <span className="text-[9px] text-indigo-300 ml-auto">Awaiting signature</span>
      )}
    </div>
  );

  if (status === "pending") return (
    <div
      onClick={canEdit ? (e) => { e.stopPropagation(); e.preventDefault(); onViewContract?.(lead); } : undefined}
      className={`flex items-center gap-1.5 my-2 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 transition-colors group/contract ${canEdit ? "cursor-pointer hover:bg-gray-100" : ""}`}
    >
      <Clock size={10} className="text-gray-400 shrink-0" />
      <span className="text-[10px] font-semibold text-gray-500">Contract Pending</span>
      {canEdit ? (
        <span className="text-[9px] text-gray-400 ml-auto group-hover/contract:text-gray-600 transition-colors">Edit →</span>
      ) : (
        <span className="text-[9px] text-gray-300 ml-auto">Not filled yet</span>
      )}
    </div>
  );

  return null;
}

// ── Main KanbanCard ───────────────────────────────────────────────
export default function KanbanCard({
  lead, programMap,
  onEdit, onViewContract, onActivity, onContacted, onQualified,
  onPaymentPlan, onInterested, onConvert, onMarkLost, onDelete,
  onAssign, onViewActivities, viewPaymentPlan, onEnroll,
  // ── naye props ──
  loadingLeadId,       // currently loading lead ka _id
  loadingAction,       // konsa action chal raha hai
  currentUser,
}: any) {
  const isThisLoading = loadingLeadId === lead._id;

  const withLoader = (action: string, fn: () => void) => () => {
    fn();
  };

  // ── Permission check ──────────────────────────────────────────
  const isAdminOrSuper = ["admin", "super_admin"].includes(currentUser?.role);
  const isOwner = lead.assigned_to?._id === currentUser?._id || lead.created_by === currentUser?._id;
  const canAct = isAdminOrSuper || isOwner;

  // Contract edit allowed as long as lead hasn't been converted yet.
  const canEditContract = !!onViewContract && lead.status !== "converted" && canAct;

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const runAction = async (actionKey: string, fn: () => void | Promise<void>) => {
    setPendingAction(actionKey);
    try {
      await fn();
    } finally {
      setPendingAction(null);
    }
  };

  const isLoading = (key: string) => pendingAction === key;

  // ── Convert: contract + batch validation ─────────────────────
  const handleConvertClick = () => {
    if (lead.contractDetails?.status !== "signed") {
      toast.error("Please get the contract signed before converting this lead.");
      return;
    }
    if (!lead.batch_id) {
      setShowBatchModal(true);
    } else {
      onConvert(lead);
    }
  };

  const handleBatchConfirm = (batchId: string) => {
    setShowBatchModal(false);
    onConvert({ ...lead, batch_id: batchId });
  };

  // ── Enroll: POST /leads/:id/enroll-advance ────────────────────
  const handleEnrollConfirm = async (advancePaid: boolean, method: string) => {
    setEnrollLoading(true);
    try {
      const token = localStorage.getItem("access_token") || "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/leads/${lead._id}/enroll-advance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ advancePaid, method }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Enrollment failed");

      toast.success(data.message || "Student enrolled successfully!");
      setShowEnrollModal(false);
      // Notify parent to remove this lead from kanban
      onEnroll?.(lead._id);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setEnrollLoading(false);
    }
  };

  return (
    <>
      {showBatchModal && (
        <BatchSelectModal lead={lead} onConfirm={handleBatchConfirm} onClose={() => setShowBatchModal(false)} />
      )}
      {showEnrollModal && (
        <EnrollModal
          lead={lead}
          onConfirm={handleEnrollConfirm}
          onClose={() => setShowEnrollModal(false)}
          isLoading={enrollLoading}
        />
      )}

      <div className={`rounded-xl border shadow-sm p-3 hover:shadow-md transition-shadow cursor-pointer group relative ${cardStyle(lead.status)}`}>

        {/* ── Loading Overlay ── */}
        {pendingAction && (
          <div className="absolute inset-0 z-10 rounded-xl bg-olive-100/80 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-olive-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-olive-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-olive-400 animate-bounce [animation-delay:300ms]" />
            </div>
            <p className="text-[10px] font-medium text-gray-400">Applying changes...</p>
          </div>
        )}
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-semibold text-gray-800 text-sm leading-tight">
            {lead.first_name} {lead.last_name}
          </p>
          <div className="flex gap-1">
            {lead.status === "converted" && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${qualityColor(lead.status)}`}>
                {lead.status}
              </span>
            )}
            {lead.quality && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${qualityColor(lead.quality)}`}>
                {lead.quality}
              </span>
            )}
          </div>
        </div>

        {/* Lost reason */}
        {lead.status === "lost" && lead.lost_reason && (
          <p className="text-[10px] text-rose-400 mb-2 italic">{lead.lost_reason}</p>
        )}

        {/* Source */}
        {lead.source && (
          <p className="text-[11px] text-gray-400 mb-2 capitalize">{lead.source}</p>
        )}

        {/* Program */}
        {lead.program_id && (
          <div className="flex items-center gap-1 mb-2">
            <Tag size={10} className="text-gray-400" />
            <span className="text-[11px] text-gray-500 truncate">
              {typeof lead.program_id === "object"
                ? lead.program_id?.name
                : programMap?.[lead.program_id]}
            </span>
          </div>
        )}

        {/* Opportunity value */}
        {lead.opportunity_value && (
          <p className={`text-[11px] font-semibold mb-2 ${lead.status === "lost" ? "text-rose-400 line-through" : "text-gray-700"}`}>
            Rs {Number(lead.opportunity_value).toLocaleString()}
          </p>
        )}

        {/* Contract badge */}
        {lead.contractDetails && lead.status === "interested" && (
          <ContractBadge
            contractDetails={lead.contractDetails}
            onViewContract={onViewContract}
            lead={lead}
            canEdit={canEditContract}
          />
        )}

        {/* Assigned to */}
        {lead.assigned_to && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-[8px] font-bold text-gray-900">
              {lead.assigned_to?.name?.charAt(0) || "?"}
            </div>
            <span className="text-[10px] text-gray-400">{lead.assigned_to?.name}</span>
          </div>
        )}

        {/* Action buttons (visible on hover) */}
        <div className="flex items-center gap-1 pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
          {canAct ? (
            <>
              {onAssign && (
                <button
                  onClick={() => runAction("assign", () => onAssign(lead))}
                  disabled={!!pendingAction}
                  title="Assign"
                  className="p-1 rounded hover:bg-blue-50 hover:text-blue-600 text-gray-400 disabled:opacity-40"
                >
                  {isLoading("assign")
                    ? <div className="w-2.5 h-2.5 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                    : <UserPlus size={11} />}
                </button>
              )}
              {onActivity && (
                <button
                  onClick={() => runAction("activity", () => onActivity(lead))}
                  disabled={!!pendingAction}
                  title="Activity"
                  className="p-1 rounded hover:bg-indigo-50 hover:text-indigo-600 text-gray-400 disabled:opacity-40"
                >
                  {isLoading("activity")
                    ? <div className="w-2.5 h-2.5 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    : <Activity size={11} />}
                </button>
              )}
              {onViewActivities && lead.activities?.length > 0 && (
                <button onClick={() => onViewActivities(lead)} title="View Activities"
                  className="p-1 rounded hover:bg-indigo-50 hover:text-indigo-600 text-gray-400">
                  <MdOutlineRemoveRedEye size={11} />
                </button>
              )}
              {onContacted && lead.status === "new" && (
                <button
                  onClick={() => runAction("contacted", () => onContacted(lead))}
                  disabled={!!pendingAction}
                  title="Mark Contacted"
                  className="p-1 rounded transition-colors bg-sky-50 hover:text-sky-600 text-gray-400 disabled:opacity-40"
                >
                  {isLoading("contacted")
                    ? <div className="w-2.5 h-2.5 border border-sky-400 border-t-transparent rounded-full animate-spin" />
                    : <ArrowLeftRight size={11} />}
                </button>
              )}
              {onPaymentPlan && lead.status === "interested" && (
                <button onClick={() => onPaymentPlan(lead)} title="Set Payment Plan"
                  className="p-1 rounded hover:bg-green-50 hover:text-green-500 text-gray-400">
                  <CreditCard size={11} />
                </button>
              )}
              {onQualified && !["interested", "qualified", "new", "converted", "lost"].includes(lead.status) && (
                <button
                  onClick={() => runAction("qualified", () => onQualified(lead))}
                  disabled={!!pendingAction}
                  title="Mark Qualified"
                  className="p-1 rounded hover:bg-yellow-50 hover:text-yellow-500 text-gray-400 disabled:opacity-40"
                >
                  {isLoading("qualified")
                    ? <div className="w-2.5 h-2.5 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    : <ShieldCheck size={11} />}
                </button>
              )}
              {onInterested && !["interested", "new", "converted", "lost"].includes(lead.status) && (
                <button
                  onClick={() => runAction("interested", () => onInterested(lead))}
                  disabled={!!pendingAction}
                  title="Mark Interested"
                  className="p-1 rounded hover:bg-orange-50 hover:text-orange-500 text-gray-400 disabled:opacity-40"
                >
                  {isLoading("interested")
                    ? <div className="w-2.5 h-2.5 border border-orange-400 border-t-transparent rounded-full animate-spin" />
                    : <Flame size={11} />}
                </button>
              )}

              {/* Convert button (interested stage) */}
              {onConvert && lead.status === "interested" && (
                <button
                  onClick={(e) => { e.stopPropagation(); runAction("convert", handleConvertClick); }}
                  disabled={!!pendingAction}
                  title={!lead.batch_id ? "Select a batch to convert" : "Convert"}
                  className={`p-1 rounded transition-colors text-gray-400 disabled:opacity-40
      ${!lead.batch_id ? "hover:bg-gray-50 hover:text-gray-500" : "hover:bg-teal-50 hover:text-teal-600"}`}
                >
                  {isLoading("convert")
                    ? <div className="w-2.5 h-2.5 border border-teal-400 border-t-transparent rounded-full animate-spin" />
                    : <UserCheck size={11} />}
                </button>
              )}

              {/* ── Enroll button (converted stage only) ── */}
              {lead.status === "converted" && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowEnrollModal(true); }}
                  title="Enroll Student"
                  className="p-1 rounded hover:bg-green-50 hover:text-green-600 text-gray-400">
                  <GraduationCap size={11} />
                </button>
              )}

              {onMarkLost && !["converted", "lost"].includes(lead.status) && (
                <button
                  onClick={() => runAction("lost", () => onMarkLost(lead))}
                  disabled={!!pendingAction}
                  title="Lost"
                  className="p-1 rounded hover:bg-rose-50 hover:text-rose-500 text-gray-400 disabled:opacity-40"
                >
                  {isLoading("lost")
                    ? <div className="w-2.5 h-2.5 border border-rose-400 border-t-transparent rounded-full animate-spin" />
                    : <XCircle size={11} />}
                </button>
              )}
            </>
          ) : (
            <p className="text-[10px] text-gray-300 py-1">no access action</p>
          )}
        </div>

        {/* View payment plan (converted) */}
        {viewPaymentPlan && lead.status === "converted" && (
          <button onClick={() => viewPaymentPlan(lead)} title="View Payment Plan"
            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex ml-auto absolute bottom-2 right-2">
            view Payment plan
          </button>
        )}
      </div>
    </>
  );
}