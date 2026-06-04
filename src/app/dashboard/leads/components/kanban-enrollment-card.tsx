"use client";
import React, { useState } from "react";
import {
    Tag,
    CheckCircle2,
    CreditCard,
    GraduationCap,
    Eye,
    Calendar,
    BadgeCheck,
    X,
} from "lucide-react";

// ── Enrollment Detail Modal ───────────────────────────────────────
function EnrollmentDetailModal({
    enrollment,
    onClose,
}: {
    enrollment: any;
    onClose: () => void;
}) {
    const snap = enrollment.leadSnapshot;
    const pp = snap?.paymentPlan;
    const cd = snap?.contractDetails;
    const user = enrollment.user;
    const prog = enrollment.program;
    const batch = enrollment.batch;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-5 max-h-[90vh] overflow-y-auto">

                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <GraduationCap size={15} className="text-green-600" />
                        <h3 className="text-sm font-semibold text-gray-800">
                            Enrollment Details
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* ── Student Info ── */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-3 mb-4">
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{
                            background:
                                user?.avatarColor ||
                                "linear-gradient(135deg,#6366f1,#8b5cf6)",
                        }}
                    >
                        {user?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                            {user?.name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                        <p className="text-[11px] text-gray-400">{user?.phone}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full
              ${enrollment.accessStatus === "ACTIVE"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                        >
                            {enrollment.accessStatus}
                        </span>
                        {snap?.quality && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
                                {snap.quality}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Program ── */}
                {prog && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                        <Tag size={11} className="text-indigo-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-indigo-700 truncate">
                                {prog.name}
                            </p>
                            <p className="text-[10px] text-indigo-400 capitalize">
                                {prog.level} &mdash; {prog.category}
                            </p>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600 shrink-0">
                            Rs {Number(prog.price || 0).toLocaleString()}
                        </span>
                    </div>
                )}

                {/* ── Meta Grid ── */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-gray-400 mb-0.5">Enrolled At</p>
                        <p className="text-[11px] font-semibold text-gray-700">
                            {new Date(enrollment.enrolledAt).toLocaleDateString("en-PK", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-gray-400 mb-0.5">Source</p>
                        <p className="text-[11px] font-semibold text-gray-700 capitalize">
                            {snap?.source || "—"}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-gray-400 mb-0.5">Progress</p>
                        <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1 bg-gray-200 rounded-full">
                                <div
                                    className="h-1 bg-green-400 rounded-full transition-all"
                                    style={{ width: `${enrollment.progress || 0}%` }}
                                />
                            </div>
                            <span className="text-[11px] font-semibold text-gray-700">
                                {enrollment.progress || 0}%
                            </span>
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-gray-400 mb-0.5">Batch</p>
                        <p className="text-[11px] font-semibold text-gray-700">
                            {enrollment.batch?.name || "Not Assigned"}
                        </p>
                    </div>
                </div>

                {/* ── Payment Plan ── */}
                {pp && (
                    <div className="mb-4">
                        <p className="text-[11px] font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                            <CreditCard size={11} className="text-gray-400" />
                            Payment Plan
                        </p>
                        <div className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-1.5">
                            <div className="flex justify-between text-[11px]">
                                <span className="text-gray-400">Total Amount</span>
                                <span className="font-semibold text-gray-700">
                                    Rs {Number(pp.totalAmount || 0).toLocaleString()}
                                </span>
                            </div>
                            {pp.advanceAmount && (
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-gray-400">Advance Paid</span>
                                    <span className="font-medium text-green-600">
                                        Rs {Number(pp.advanceAmount).toLocaleString()}
                                    </span>
                                </div>
                            )}
                            {pp.advanceDueDate && (
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-gray-400">Advance Due</span>
                                    <span className="text-gray-600">
                                        {new Date(pp.advanceDueDate).toLocaleDateString("en-PK", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </span>
                                </div>
                            )}

                            {/* Installments */}
                            {(pp.installments || []).length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
                                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                                        Installments
                                    </p>
                                    {pp.installments.map((inst: any, i: number) => (
                                        <div
                                            key={inst._id || i}
                                            className="flex justify-between items-center text-[10px] bg-white rounded-lg px-2 py-1.5 border border-gray-100"
                                        >
                                            <span className="text-gray-600 font-medium">
                                                {inst.label}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-700 font-semibold">
                                                    Rs {Number(inst.amount).toLocaleString()}
                                                </span>
                                                <span
                                                    className={`px-1.5 py-0.5 rounded-full font-semibold capitalize
                          ${inst.status === "paid"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-amber-100 text-amber-700"
                                                        }`}
                                                >
                                                    {inst.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Remaining */}
                            {pp.advanceAmount && (
                                <div className="flex justify-between text-[11px] pt-1.5 border-t border-gray-100">
                                    <span className="text-gray-400">Remaining</span>
                                    <span className="font-semibold text-rose-500">
                                        Rs{" "}
                                        {Number(
                                            (pp.totalAmount || 0) - (pp.advanceAmount || 0)
                                        ).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Contract Status ── */}
                {cd?.status === "signed" && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-teal-50 rounded-xl border border-teal-100">
                        <CheckCircle2 size={11} className="text-teal-500 shrink-0" />
                        <div>
                            <p className="text-[11px] font-semibold text-teal-700">
                                Contract Signed
                            </p>
                            {cd.signedAt && (
                                <p className="text-[10px] text-teal-400">
                                    {new Date(cd.signedAt).toLocaleDateString("en-PK", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                            )}
                        </div>
                        <BadgeCheck size={14} className="text-teal-400 ml-auto" />
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main EnrollmentCard ───────────────────────────────────────────
export default function EnrollmentCard({
    enrollment,
    onViewEnrollment,
}: {
    enrollment: any;
    onViewEnrollment?: (enrollment: any) => void;
}) {
    const [showDetail, setShowDetail] = useState(false);

    const snap = enrollment.leadSnapshot;
    const user = enrollment.user;
    const prog = enrollment.program;
    const pp = snap?.paymentPlan;
    const cd = snap?.contractDetails;

    const handleView = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onViewEnrollment) {
            onViewEnrollment(enrollment);
        } else {
            setShowDetail(true);
        }
    };

    // Remaining amount calculation
    const remaining =
        pp?.totalAmount && pp?.advanceAmount
            ? Number(pp.totalAmount) - Number(pp.advanceAmount)
            : null;

    return (
        <>
            {showDetail && !onViewEnrollment && (
                <EnrollmentDetailModal
                    enrollment={enrollment}
                    onClose={() => setShowDetail(false)}
                />
            )}

            <div className="rounded-xl border border-gray-100 shadow-sm p-3 bg-white hover:shadow-md transition-shadow cursor-pointer group relative">

                {/* ── Top Row ── */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                            style={{
                                background:
                                    user?.avatarColor ||
                                    "linear-gradient(135deg,#22c55e,#16a34a)",
                            }}
                        >
                            {user?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <p className="font-semibold text-gray-800 text-sm leading-tight truncate">
                            {user?.name}
                        </p>
                    </div>
                    <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0
            ${enrollment.accessStatus === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                    >
                        {enrollment.accessStatus}
                    </span>
                </div>

                {/* ── Program ── */}
                {prog && (
                    <div className="flex items-center gap-1 mb-2">
                        <Tag size={10} className="text-gray-400 shrink-0" />
                        <span className="text-[11px] text-gray-500 truncate">
                            {prog.name}
                        </span>
                    </div>
                )}

                {/* ── Opportunity Value ── */}
                {snap?.opportunity_value && (
                    <p className="text-[11px] font-semibold text-gray-700 mb-2">
                        Rs {Number(snap.opportunity_value).toLocaleString()}
                    </p>
                )}

                {/* ── Payment Plan Snapshot ── */}
                {pp && (
                    <div className="bg-white/80 rounded-lg px-2.5 py-2 mb-2 border border-green-100 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-400 flex items-center gap-1">
                                <CreditCard size={9} />
                                Advance Paid
                            </span>
                            <span className="text-green-600 font-semibold">
                                Rs {Number(pp.advanceAmount || 0).toLocaleString()}
                            </span>
                        </div>
                        {remaining !== null && remaining > 0 && (
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-gray-400">Remaining</span>
                                <span className="text-amber-600 font-semibold">
                                    Rs {remaining.toLocaleString()}
                                </span>
                            </div>
                        )}
                        {(pp.installments || []).length > 0 && (
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-gray-400">Installments</span>
                                <span className="text-gray-600">
                                    {pp.installments.length} pending
                                </span>
                            </div>
                        )}
                    </div>
                )}
                <div className="flex justify-between align-bottom  mb-2">
                    {/* ── Contract Signed Badge ── */}
                    {cd?.status === "signed" && (
                        <div className="flex items-center gap-1 ">
                            <CheckCircle2 size={10} className="text-teal-500 shrink-0" />
                            <span className="text-[10px] font-semibold text-teal-600">
                                Contract Signed
                            </span>
                        </div>
                    )}


                    {/* ── Enrolled Date ── */}
                    <div className="flex items-center gap-1 ">
                        <Calendar size={10} className="text-gray-400 shrink-0" />
                        <span className="text-[10px] text-gray-400">
                            {new Date(enrollment.enrolledAt).toLocaleDateString("en-PK", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col justify-between align-center ">
                    {/* ── Batch ── */}
                    {enrollment.batch && (
                        <p className="text-[10px] text-gray-400 my-auto">
                            Batch: {enrollment.batch.name}
                        </p>
                    )}


                    <button
                        onClick={handleView}
                        title="View Enrollment Details"
                        className="flex items-center mt-2  gap-1 px-2 py-1 ml-auto rounded-lg bg-green-100 text-green-700 transition-colors"
                    >
                        <Eye size={11} />
                        <span className="text-[10px] font-medium">View Details</span>
                    </button>
                </div>

                {/* ── Action Row (on hover) ── */}
                {/* <div className="flex items-center gap-1 pt-2 border-t border-green-100 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleView}
            title="View Enrollment Details"
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-green-100 hover:text-green-700 text-gray-400 transition-colors"
          >
            <Eye size={11} />
            <span className="text-[10px] font-medium">View Details</span>
          </button>
        </div> */}
            </div>
        </>
    );
}
