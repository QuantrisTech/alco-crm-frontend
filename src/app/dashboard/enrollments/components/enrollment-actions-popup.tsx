// components/EnrollmentActionsPopup.tsx
import { GraduationCap, PauseCircle, Pencil, PlayCircle, Trash2, X } from "lucide-react";

interface Props {
    row: any; // { user, enrollments[] }
    isAdmin: boolean;
    onGraduate: (enrollment: any) => void;
    onSuspend: (enrollment: any) => void;
    onReactivate: (enrollment: any) => void;
    onDelete: (enrollment: any) => void;
    onClose: () => void;
    onEdit: (enrollment: any) => void;
}

export default function EnrollmentActionsPopup({
    row,
    isAdmin,
    onGraduate,
    onSuspend,
    onReactivate,
    onDelete,
    onClose,
    onEdit,
}: Props) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                            {row.user?.name}
                        </h2>
                        <p className="text-xs text-gray-400">{row.user?.email}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Enrollments List */}
                <div className="flex flex-col gap-3">
                    {row.enrollments.map((e: any) => (
                        <div
                            key={e._id}
                            className="border border-gray-100 rounded-xl p-4 bg-gray-50"
                        >
                            {/* Program Name + Status */}
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="font-medium text-gray-700 text-sm">
                                        {e.program?.name || "—"}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {e.batch?.name || "No Batch"}
                                    </p>
                                </div>
                                <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${e.status === "active"
                                        ? "bg-green-100 text-green-700"
                                        : e.status === "suspended"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : e.status === "completed"
                                                ? "bg-teal-100 text-teal-700"
                                                : "bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    {e.status}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Edit — har program pe */}
                                <button
                                    onClick={() => { onEdit(e); onClose(); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition"
                                >
                                    <Pencil size={13} />
                                    Edit
                                </button>

                                {/* Graduate */}
                                {!e.isGraduated && e.status === "active" && (
                                    <button
                                        onClick={() => { onGraduate(e); onClose(); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-50 text-teal-600 hover:bg-teal-100 transition"
                                    >
                                        <GraduationCap size={13} />
                                        Graduate
                                    </button>
                                )}

                                {/* Suspend */}
                                {e.status === "active" && (
                                    <button
                                        onClick={() => { onSuspend(e); onClose(); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition"
                                    >
                                        <PauseCircle size={13} />
                                        Suspend
                                    </button>
                                )}

                                {/* Reactivate */}
                                {e.status === "suspended" && (
                                    <button
                                        onClick={() => { onReactivate(e); onClose(); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 transition"
                                    >
                                        <PlayCircle size={13} />
                                        Reactivate
                                    </button>
                                )}

                                {/* Delete — sirf admin */}
                                {isAdmin && (
                                    <button
                                        onClick={() => { onDelete(e); onClose(); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
                                    >
                                        <Trash2 size={13} />
                                        Delete
                                    </button>
                                )}

                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}