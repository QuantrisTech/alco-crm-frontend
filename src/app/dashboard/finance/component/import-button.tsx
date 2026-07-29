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
import { previewBulkInvoice, confirmBulkInvoice } from "@/utils/api";
import toast from "react-hot-toast";

interface EnrollmentOption {
    enrollmentId: string;
    programId: string | null;
    programName: string;
    defaultAmount: number;
    hasInvoice: boolean;
    existingInvoiceNumber?: string | null;
}

interface PreviewRow {
    email: string;
    user: { _id: string; name: string; email: string; phone?: string } | null;
    status: "eligible" | "duplicate" | "no_enrollment" | "not_found" | "invalid_invoice_number";
    enrollmentOptions?: EnrollmentOption[];
    defaultSelectedIds?: string[];
    dueDate?: string | null;
    issueDate?: string | null;
    invoiceNumber?: string | null;
    advanceAmount?: number;
}

interface SelectionState {
    selected: boolean;
    amount: number;
    discount: number;
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

interface ConfirmItem {
    enrollmentId: string;
    programId: string | null;
    programName: string;
    amount: number;
    discount: number;
}

interface ConfirmPayloadRow {
    user: string;
    invoiceNumber?: string;
    dueDate?: string | null;
    issueDate?: string | null;
    advanceAmount?: number;
    items: ConfirmItem[];
}

// ── Badge helper ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: PreviewRow["status"] }) {
    const map = {
        eligible: { label: "Eligible", cls: "bg-green-100 text-green-700", icon: <CheckCircle2 size={12} /> },
        duplicate: { label: "Already Invoiced", cls: "bg-yellow-100 text-yellow-700", icon: <AlertTriangle size={12} /> },
        no_enrollment: { label: "No Enrollment", cls: "bg-orange-100 text-orange-700", icon: <HelpCircle size={12} /> },
        not_found: { label: "User Not Found", cls: "bg-rose-100 text-rose-700", icon: <XCircle size={12} /> },
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
    // email -> enrollmentId -> { selected, amount, discount }
    const [selectionMap, setSelectionMap] = useState<Record<string, Record<string, SelectionState>>>({});

    const queryClient = useQueryClient();

    const handleClose = () => {
        setIsOpen(false);
        setStep("upload");
        setFile(null);
        setRows([]);
        setRemovedEmails(new Set());
        setConfirmedEmails(new Set());
        setSelectionMap({});
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

    const toggleSelection = (email: string, enrollmentId: string) => {
        setSelectionMap((prev) => ({
            ...prev,
            [email]: {
                ...prev[email],
                [enrollmentId]: {
                    ...prev[email][enrollmentId],
                    selected: !prev[email][enrollmentId].selected,
                },
            },
        }));
    };

    const updateSelectionField = (
        email: string,
        enrollmentId: string,
        field: "amount" | "discount",
        value: number
    ) => {
        setSelectionMap((prev) => ({
            ...prev,
            [email]: {
                ...prev[email],
                [enrollmentId]: {
                    ...prev[email][enrollmentId],
                    [field]: value,
                },
            },
        }));
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
            const defaults: Record<string, Record<string, SelectionState>> = {};
            data.preview.forEach((r) => {
                if (r.status === "eligible") {
                    defaults[r.email] = {};
                    r.enrollmentOptions?.forEach((o) => {
                        if (!o.hasInvoice) {
                            defaults[r.email][o.enrollmentId] = {
                                selected: r.defaultSelectedIds?.includes(o.enrollmentId) ?? true,
                                amount: o.defaultAmount,
                                discount: 0,
                            };
                        }
                    });
                }
            });
            setSelectionMap(defaults);
            setStep("review");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Preview failed");
        },
    });

    // ── Confirm mutation (single row ya bulk, same endpoint) ────────────
    const confirmMutation = useMutation({
        mutationFn: async (payload: ConfirmPayloadRow[]) => {
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

    // ✅ FIXED: advanceMap wasn't declared anywhere — ab row.advanceAmount
    // (jo Excel column G se preview response mein aata hai) directly use karte hain.
    const buildRowPayload = (row: PreviewRow): ConfirmPayloadRow | null => {
        const sel = selectionMap[row.email] || {};
        const items: ConfirmItem[] = Object.entries(sel)
            .filter(([, s]) => s.selected)
            .map(([enrollmentId, s]) => {
                const opt = row.enrollmentOptions?.find((o) => o.enrollmentId === enrollmentId);
                return {
                    enrollmentId,
                    programId: opt?.programId || null,
                    programName: opt?.programName || "",
                    amount: s.amount,
                    discount: s.discount,
                };
            });

        if (items.length === 0 || !row.user) return null;

        return {
            user: row.user._id,
            invoiceNumber: row.invoiceNumber || undefined,
            dueDate: row.dueDate || undefined,
            issueDate: row.issueDate || undefined,
            advanceAmount: row.advanceAmount || 0, // ✅ fixed — pehle advanceMap[row.email] tha (undefined variable)
            items,
        };
    };

    const visibleRows = rows.filter((r) => !removedEmails.has(r.email));
    const eligibleUnconfirmedRows = visibleRows.filter(
        (r) => r.status === "eligible" && !confirmedEmails.has(r.email)
    );

    const removeRow = (email: string) => {
        setRemovedEmails((prev) => new Set(prev).add(email));
    };

    const confirmSingleRow = (row: PreviewRow) => {
        const payload = buildRowPayload(row);
        if (!payload) {
            toast.error("Select at least one program");
            return;
        }
        confirmMutation.mutate([payload]);
    };

    const confirmAll = () => {
        const payload = eligibleUnconfirmedRows
            .map((r) => buildRowPayload(r))
            .filter((p): p is ConfirmPayloadRow => p !== null);

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
                                        : "Review karein — bundle wale users ke liye multiple programs select kar sakte hain"}
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
                                        Column order: <strong>A = Name</strong>, <strong>B = Email</strong>, <strong>C = Amount (fallback)</strong>,{" "}
                                        <strong>D = Due Date</strong>, <strong>E = Issue Date</strong>,{" "}
                                        <strong>F = Invoice Number (optional)</strong>, <strong>G = Advance Amount (optional)</strong>.
                                        Bundle wale users ki EK hi invoice banegi jismein saare selected programs shamil hongay.
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
                                        {visibleRows.filter((r) =>
                                            r.status === "not_found" || r.status === "invalid_invoice_number"
                                        ).length} invalid
                                    </span>
                                </div>

                                <div className="p-6 overflow-y-auto flex-1 space-y-2">
                                    {visibleRows.map((row) => {
                                        const isConfirmed = confirmedEmails.has(row.email);
                                        const isEligible = row.status === "eligible";
                                        const rowSelections = selectionMap[row.email] || {};

                                        const selectedEntries = Object.entries(rowSelections).filter(([, s]) => s.selected);
                                        const totalAmount = selectedEntries.reduce(
                                            (sum, [, s]) => sum + Math.max(0, (s.amount || 0) - (s.discount || 0)),
                                            0
                                        );

                                        return (
                                            <div
                                                key={row.email}
                                                className={`border rounded-lg p-3 flex items-start justify-between gap-3 flex-wrap ${isConfirmed ? "bg-green-50 border-green-200" : "border-gray-200"
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
                                                    </div>
                                                    <p className="text-xs text-gray-400">{row.email}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {row.issueDate ? `issued ${new Date(row.issueDate).toLocaleDateString("en-PK")}` : ""}
                                                        {row.dueDate ? ` · due ${new Date(row.dueDate).toLocaleDateString("en-PK")}` : ""}
                                                        {row.invoiceNumber ? ` · Invoice # ${row.invoiceNumber}` : " · Invoice #: auto-generate"}
                                                        {row.advanceAmount ? ` · Advance: Rs ${row.advanceAmount.toLocaleString()}` : ""}
                                                    </p>

                                                    {isEligible && (row.enrollmentOptions?.length || 0) > 0 && (
                                                        <div className="mt-2 space-y-2">
                                                            {row.enrollmentOptions!
                                                                .filter((o) => !o.hasInvoice)
                                                                .map((opt) => {
                                                                    const sel = rowSelections[opt.enrollmentId];
                                                                    if (!sel) return null;
                                                                    const finalAmount = Math.max(0, (sel.amount || 0) - (sel.discount || 0));
                                                                    return (
                                                                        <div key={opt.enrollmentId} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={sel.selected}
                                                                                onChange={() => toggleSelection(row.email, opt.enrollmentId)}
                                                                            />
                                                                            <span className="text-xs font-medium text-gray-700 w-32 truncate">
                                                                                {opt.programName}
                                                                            </span>
                                                                            <input
                                                                                type="number"
                                                                                value={sel.amount}
                                                                                onChange={(e) =>
                                                                                    updateSelectionField(row.email, opt.enrollmentId, "amount", Number(e.target.value))
                                                                                }
                                                                                disabled={!sel.selected}
                                                                                className="w-24 text-xs border rounded px-2 py-1 text-gray-700"
                                                                                placeholder="Amount"
                                                                            />
                                                                            <input
                                                                                type="number"
                                                                                value={sel.discount}
                                                                                onChange={(e) =>
                                                                                    updateSelectionField(row.email, opt.enrollmentId, "discount", Number(e.target.value))
                                                                                }
                                                                                disabled={!sel.selected}
                                                                                className="w-20 text-xs border rounded px-2 py-1 text-gray-700"
                                                                                placeholder="Discount"
                                                                            />
                                                                            <span className="text-xs text-gray-500 ml-auto">
                                                                                Rs {finalAmount.toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}

                                                            <div className="flex items-center justify-between px-2 pt-1 border-t border-dashed">
                                                                <span className="text-xs text-gray-500">
                                                                    {selectedEntries.length} program{selectedEntries.length !== 1 ? "s" : ""} selected
                                                                </span>
                                                                <span className="text-xs font-semibold text-gray-800">
                                                                    Total: Rs {totalAmount.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {isEligible && !isConfirmed && (
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => confirmSingleRow(row)}
                                                            disabled={confirmMutation.isPending || selectedEntries.length === 0}
                                                            className="px-2.5 py-1.5 text-xs rounded bg-teal-100 text-teal-700 hover:bg-teal-200 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                        >
                                                            Confirm ({selectedEntries.length}) — Rs {totalAmount.toLocaleString()}
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