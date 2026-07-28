"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Upload,
    X,
    UploadCloud,
    FileSpreadsheet,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    HelpCircle,
} from "lucide-react";
import Select from "@/app/component/ui/select";
import { previewBulkInvoice, confirmBulkInvoice } from "@/utils/api";
import toast from "react-hot-toast";

// ── Types ────────────────────────────────────────────────────────────────
interface EnrollmentOption {
    enrollmentId: string;
    programName: string;
    hasInvoice: boolean;
    existingInvoiceNumber?: string | null;
}

// ── Types (updated) ──────────────────────────────────────────────────────
interface PreviewRow {
    email: string;
    user: { _id: string; name: string; email: string; phone?: string } | null;
    status:
    | "eligible"
    | "duplicate"
    | "no_enrollment"
    | "not_found"
    | "invalid_amount"
    | "invalid_invoice_number"; // ✅ naya status
    enrollmentOptions?: EnrollmentOption[];
    selectedEnrollmentId?: string;
    amount?: number;
    dueDate?: string | null;
    issueDate?: string | null;         // ✅ naya field
    invoiceNumber?: string | null;      // ✅ naya field (custom number agar Excel mein diya ho)
    requestedInvoiceNumber?: string;    // ✅ jab clash ho
}

interface PreviewResponse {
    totalRows: number;
    eligibleCount: number;
    duplicateCount: number;
    noEnrollmentCount: number;
    notFoundCount: number;
    invalidCount: number;
    preview: PreviewRow[];
}

// ── Badge helper ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: PreviewRow["status"] }) {
    const map = {
        eligible: { label: "Eligible", cls: "bg-green-100 text-green-700", icon: <CheckCircle2 size={12} /> },
        duplicate: { label: "Already Invoiced", cls: "bg-yellow-100 text-yellow-700", icon: <AlertTriangle size={12} /> },
        no_enrollment: { label: "No Enrollment", cls: "bg-orange-100 text-orange-700", icon: <HelpCircle size={12} /> },
        not_found: { label: "User Not Found", cls: "bg-rose-100 text-rose-700", icon: <XCircle size={12} /> },
        invalid_amount: { label: "Invalid Amount", cls: "bg-rose-100 text-rose-700", icon: <XCircle size={12} /> },
        invalid_invoice_number: { label: "Invoice # Taken", cls: "bg-rose-100 text-rose-700", icon: <XCircle size={12} /> },
    };
    const conf = map[status];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${conf.cls}`}>
            {conf.icon}
            {conf.label}
        </span>
    );
}

export default function InvoiceImportButton({ queryKey = "invoices" }: { queryKey?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<"upload" | "review">("upload");

    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const [rows, setRows] = useState<PreviewRow[]>([]);
    const [removedEmails, setRemovedEmails] = useState<Set<string>>(new Set());
    const [confirmedEmails, setConfirmedEmails] = useState<Set<string>>(new Set());
    // ✅ email -> admin ne kaunsi enrollment choose ki (bundle wale users ke liye)
    const [enrollmentChoiceMap, setEnrollmentChoiceMap] = useState<Record<string, string>>({});

    const queryClient = useQueryClient();

    const handleClose = () => {
        setIsOpen(false);
        setStep("upload");
        setFile(null);
        setRows([]);
        setRemovedEmails(new Set());
        setConfirmedEmails(new Set());
        setEnrollmentChoiceMap({});
    };

    const handleFileSelect = (selected: File | null) => {
        if (!selected) return;
        const validTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
        ];
        if (!validTypes.includes(selected.type)) {
            alert("Sirf Excel file (.xlsx/.xls) allow hai");
            return;
        }
        setFile(selected);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) handleFileSelect(dropped);
    };

    // ── Preview mutation ─────────────────────────────────────────────────
    const previewMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append("file", file as File);
            const res = await previewBulkInvoice(formData);
            return res.data as PreviewResponse;
        },
        onSuccess: (data) => {
            setRows(data.preview);
            // ✅ default enrollment choice — backend ke suggested selectedEnrollmentId se
            const defaults: Record<string, string> = {};
            data.preview.forEach((r) => {
                if (r.status === "eligible" && r.selectedEnrollmentId) {
                    defaults[r.email] = r.selectedEnrollmentId;
                }
            });
            setEnrollmentChoiceMap(defaults);
            setStep("review");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Preview failed");
        },
    });

    // ── Confirm mutation (single row ya bulk, same endpoint) ────────────
    const confirmMutation = useMutation({
        mutationFn: async (
            payload: {
                user: string;
                enrollmentId: string;
                amount: number;
                dueDate?: string | null;
                issueDate?: string | null;     // ✅
                invoiceNumber?: string | null; // ✅
            }[]
        ) => {
            const res = await confirmBulkInvoice(payload);
            return res.data;
        },
        onSuccess: (data, variables) => {
            const confirmedNow = new Set(confirmedEmails);
            rows.forEach((r) => {
                if (r.user && variables.some((v) => v.user === r.user!._id)) {
                    confirmedNow.add(r.email);
                }
            });
            setConfirmedEmails(confirmedNow);
            toast.success(`${data.createdCount} invoice(s) created, ${data.skippedCount} skipped`);
            queryClient.invalidateQueries({ queryKey: [queryKey] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Invoice creation failed");
        },
    });



    //   const confirmMutation = useMutation({
    //     mutationFn: async (payload: { user: string; enrollmentId: string; amount: number; dueDate?: string | null }[]) => {
    //       const res = await confirmBulkInvoice(payload);
    //       return res.data;
    //     },
    //     onSuccess: (data, variables) => {
    //       const confirmedNow = new Set(confirmedEmails);
    //       rows.forEach((r) => {
    //         if (r.user && variables.some((v) => v.user === r.user!._id)) {
    //           confirmedNow.add(r.email);
    //         }
    //       });
    //       setConfirmedEmails(confirmedNow);
    //       toast.success(`${data.createdCount} invoice(s) created, ${data.skippedCount} skipped`);
    //       queryClient.invalidateQueries({ queryKey: [queryKey] });
    //     },
    //     onError: (err: any) => {
    //       toast.error(err?.response?.data?.message || "Invoice creation failed");
    //     },
    //   });

    const visibleRows = rows.filter((r) => !removedEmails.has(r.email));
    const eligibleUnconfirmedRows = visibleRows.filter(
        (r) => r.status === "eligible" && !confirmedEmails.has(r.email)
    );

    const removeRow = (email: string) => {
        setRemovedEmails((prev) => new Set(prev).add(email));
    };

    // ✅ Row ke liye currently chosen enrollment ka option object nikalo
    const getChosenOption = (row: PreviewRow): EnrollmentOption | undefined => {
        const chosenId = enrollmentChoiceMap[row.email];
        return row.enrollmentOptions?.find((o) => o.enrollmentId === chosenId);
    };

    //   const confirmSingleRow = (row: PreviewRow) => {
    //     const chosen = getChosenOption(row);
    //     if (!row.user || !chosen || chosen.hasInvoice || !row.amount) return;
    //     confirmMutation.mutate([
    //       {
    //         user: row.user._id,
    //         enrollmentId: chosen.enrollmentId,
    //         amount: row.amount,
    //         dueDate: row.dueDate || undefined,
    //       },
    //     ]);
    //   };


    const confirmSingleRow = (row: PreviewRow) => {
        const chosen = getChosenOption(row);
        if (!row.user || !chosen || chosen.hasInvoice || !row.amount) return;
        confirmMutation.mutate([
            {
                user: row.user._id,
                enrollmentId: chosen.enrollmentId,
                amount: row.amount,
                dueDate: row.dueDate || undefined,
                issueDate: row.issueDate || undefined,       // ✅
                invoiceNumber: row.invoiceNumber || undefined, // ✅
            },
        ]);
    };

    //   const confirmAll = () => {
    //     const payload = eligibleUnconfirmedRows
    //       .map((r) => {
    //         const chosen = getChosenOption(r);
    //         if (!r.user || !chosen || chosen.hasInvoice || !r.amount) return null;
    //         return {
    //           user: r.user._id,
    //           enrollmentId: chosen.enrollmentId,
    //           amount: r.amount,
    //           dueDate: r.dueDate || undefined,
    //         };
    //       })
    //       .filter(Boolean) as { user: string; enrollmentId: string; amount: number; dueDate?: string | null }[];

    //     if (payload.length === 0) {
    //       toast.error("No eligible rows to confirm");
    //       return;
    //     }
    //     confirmMutation.mutate(payload);
    //   };

    const confirmAll = () => {
        const payload = eligibleUnconfirmedRows
            .map((r) => {
                const chosen = getChosenOption(r);
                if (!r.user || !chosen || chosen.hasInvoice || !r.amount) return null;
                return {
                    user: r.user._id,
                    enrollmentId: chosen.enrollmentId,
                    amount: r.amount,
                    dueDate: r.dueDate || undefined,
                    issueDate: r.issueDate || undefined,        // ✅
                    invoiceNumber: r.invoiceNumber || undefined,  // ✅
                };
            })
            .filter(Boolean) as {
                user: string;
                enrollmentId: string;
                amount: number;
                dueDate?: string | null;
                issueDate?: string | null;
                invoiceNumber?: string | null;
            }[];

        if (payload.length === 0) {
            toast.error("No eligible rows to confirm");
            return;
        }
        confirmMutation.mutate(payload);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-gray-400 hover:text-gray-600 text-gray-600 text-sm font-medium rounded-lg transition-colors shadow-sm"
                title="Bulk create invoices from Excel"
            >
                <Upload size={14} />
                Import Invoices
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b shrink-0">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Bulk Create Invoices</h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {step === "upload"
                                        ? "Excel se naye invoices banayein (payments alag se)"
                                        : "Review karein — agar user ki 2+ programs hain to program choose karein"}
                                </p>
                            </div>
                            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
                                <X size={20} />
                            </button>
                        </div>

                        {/* ── STEP 1: UPLOAD ─────────────────────────────────────── */}
                        {step === "upload" && (
                            <>
                                <div className="p-6 space-y-4 overflow-y-auto">
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                        onDragLeave={() => setDragActive(false)}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${dragActive ? "border-yellow-400 bg-yellow-50" : "border-gray-200"
                                            }`}
                                        onClick={() => document.getElementById("invoice-import-file-input")?.click()}
                                    >
                                        <input
                                            id="invoice-import-file-input"
                                            type="file"
                                            accept=".xlsx,.xls"
                                            className="hidden"
                                            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                                        />
                                        {file ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <FileSpreadsheet className="text-green-600" size={28} />
                                                <p className="text-sm font-medium text-gray-700">{file.name}</p>
                                                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <UploadCloud size={28} />
                                                <p className="text-sm">Click ya drag karke file yahan drop karein</p>
                                                <p className="text-xs">.xlsx ya .xls</p>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        Column order: <strong>A = Name</strong>, <strong>B = Email</strong>, <strong>C = Amount</strong>,{" "}
                                        <strong>D = Due Date (optional)</strong>, <strong>E = Issue Date (optional, default aaj)</strong>,{" "}
                                        <strong>F = Invoice Number (optional, blank chhorne par auto-generate hoga)</strong>. Matching sirf{" "}
                                        <strong>Email</strong> se hoti hai...
                                    </p>
                                </div>

                                <div className="flex gap-3 p-6 border-t shrink-0">
                                    <button
                                        onClick={handleClose}
                                        className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => previewMutation.mutate()}
                                        disabled={!file || previewMutation.isPending}
                                        className="flex-1 py-2.5 rounded-lg bg-yellow-400 text-white text-sm font-medium hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {previewMutation.isPending ? "Checking..." : "Preview"}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ── STEP 2: REVIEW ─────────────────────────────────────── */}
                        {step === "review" && (
                            <>
                                <div className="px-6 pt-4 flex flex-wrap gap-2 shrink-0">
                                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                        {eligibleUnconfirmedRows.length} eligible
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                        {visibleRows.filter((r) => r.status === "duplicate").length} already invoiced
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                                        {visibleRows.filter((r) => r.status === "no_enrollment").length} no enrollment
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-700">
                                        {visibleRows.filter((r) => r.status === "not_found" || r.status === "invalid_amount").length} invalid
                                    </span>
                                </div>

                                <div className="p-6 overflow-y-auto flex-1 space-y-2">
                                    {visibleRows.map((row) => {
                                        const isConfirmed = confirmedEmails.has(row.email);
                                        const isEligible = row.status === "eligible";
                                        const hasMultiplePrograms = (row.enrollmentOptions?.length || 0) > 1;
                                        const chosen = getChosenOption(row);
                                        const chosenIsDuplicate = isEligible && chosen?.hasInvoice;

                                        return (
                                            <div
                                                key={row.email}
                                                className={`border rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap ${isConfirmed ? "bg-green-50 border-green-200" : "border-gray-200"
                                                    }`}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-medium text-gray-800 truncate">
                                                            {row.user?.name || row.email}
                                                        </p>
                                                        <StatusBadge status={isConfirmed ? "eligible" : row.status} />
                                                        {isConfirmed && (
                                                            <span className="text-[10px] text-green-700 font-medium">Confirmed ✓</span>
                                                        )}
                                                        {isEligible && (
                                                            <span className="text-xs text-gray-500">
                                                                Rs {row.amount?.toLocaleString()}
                                                                {row.issueDate ? ` · issued ${new Date(row.issueDate).toLocaleDateString("en-PK")}` : ""}
                                                                {row.dueDate ? ` · due ${new Date(row.dueDate).toLocaleDateString("en-PK")}` : ""}
                                                                {row.invoiceNumber ? ` · #${row.invoiceNumber}` : ""}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400">{row.email}</p>

                                                    {/* ✅ Program picker — sirf jab 1+ enrollments hain aur row eligible/duplicate hai */}
                                                    {(isEligible || row.status === "duplicate") && (row.enrollmentOptions?.length || 0) > 0 && (
                                                        <div className="mt-2 max-w-xs">
                                                            {hasMultiplePrograms ? (
                                                                <Select
                                                                    label={undefined}
                                                                    placeholder="Program choose karein"
                                                                    value={enrollmentChoiceMap[row.email] || ""}
                                                                    options={row.enrollmentOptions!.map((o) => ({
                                                                        label: `${o.programName}${o.hasInvoice ? " (already invoiced)" : ""}`,
                                                                        value: o.enrollmentId,
                                                                    }))}
                                                                    onChange={(e) =>
                                                                        setEnrollmentChoiceMap((prev) => ({ ...prev, [row.email]: e.target.value }))
                                                                    }
                                                                />
                                                            ) : (
                                                                <span className="text-xs text-gray-500">
                                                                    Program: <span className="font-medium">{row.enrollmentOptions![0].programName}</span>
                                                                </span>
                                                            )}
                                                            {chosenIsDuplicate && (
                                                                <p className="text-[10px] text-yellow-700 mt-1">
                                                                    Is program ki invoice already exist karti hai — Confirm disabled.
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {isEligible && !isConfirmed && (
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => confirmSingleRow(row)}
                                                            disabled={confirmMutation.isPending || chosenIsDuplicate || !chosen}
                                                            className="px-2.5 py-1.5 text-xs rounded bg-teal-100 text-teal-700 hover:bg-teal-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => removeRow(row.email)}
                                                            className="px-2.5 py-1.5 text-xs rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                )}

                                                {!isEligible && (
                                                    <button
                                                        onClick={() => removeRow(row.email)}
                                                        className="px-2.5 py-1.5 text-xs rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition shrink-0"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {visibleRows.length === 0 && (
                                        <p className="text-sm text-gray-400 text-center py-6">Koi rows nahi bachi.</p>
                                    )}
                                </div>

                                <div className="flex gap-3 p-6 border-t shrink-0">
                                    <button
                                        onClick={() => setStep("upload")}
                                        className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={confirmAll}
                                        disabled={eligibleUnconfirmedRows.length === 0 || confirmMutation.isPending}
                                        className="flex-1 py-2.5 rounded-lg bg-yellow-400 text-white text-sm font-medium hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {confirmMutation.isPending
                                            ? "Creating..."
                                            : `Confirm All (${eligibleUnconfirmedRows.length})`}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}