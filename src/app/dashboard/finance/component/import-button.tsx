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

interface AdvanceInfo {
    amount: number;
    dueDate?: string | null;
    description?: string;
    paidDate?: string | null;
}

interface InstallmentInfo {
    number: number;
    amount: number;
    dueDate?: string | null;
    description?: string;
    paidDate?: string | null;
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
    discountAmount?: number;
    advance?: AdvanceInfo | null;
    installments?: InstallmentInfo[];
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
    items: ConfirmItem[];
    advance?: { amount: number; dueDate?: string | null; description?: string; paidDate?: string | null; paid: boolean } | null;
    installments?: { amount: number; dueDate?: string | null; description?: string; paidDate?: string | null; paid: boolean }[];
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

function fmtDate(d?: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-PK");
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
    // email -> advance "Paid" checkbox (default true)
    const [advancePaidMap, setAdvancePaidMap] = useState<Record<string, boolean>>({});
    // email -> installment number -> "Paid" checkbox (default true)
    const [installmentPaidMap, setInstallmentPaidMap] = useState<Record<string, Record<number, boolean>>>({});

    const queryClient = useQueryClient();

    const handleClose = () => {
        setIsOpen(false);
        setStep("upload");
        setFile(null);
        setRows([]);
        setRemovedEmails(new Set());
        setConfirmedEmails(new Set());
        setSelectionMap({});
        setAdvancePaidMap({});
        setInstallmentPaidMap({});
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
            const advDefaults: Record<string, boolean> = {};
            const instDefaults: Record<string, Record<number, boolean>> = {};

            data.preview.forEach((r) => {
                if (r.status === "eligible") {
                    defaults[r.email] = {};

                    // ✅ Excel se aaya discount — jitne programs select honge unme split ho jayega
                    const availableOpts = (r.enrollmentOptions || []).filter((o) => !o.hasInvoice);
                    const selectedOpts = availableOpts.filter((o) =>
                        r.defaultSelectedIds?.includes(o.enrollmentId) ?? true
                    );
                    const rowDiscount = r.discountAmount || 0;
                    const perItemDiscount = selectedOpts.length > 0 ? rowDiscount / selectedOpts.length : 0;

                    // ✅ FIXED — sirf ye ek loop rakha hai. Pehle iske baad ek doosra
                    // r.enrollmentOptions?.forEach(...) loop tha jo discount ko hamesha
                    // 0 se overwrite kar deta tha (duplicate/leftover code — bug ki wajah).
                    availableOpts.forEach((o) => {
                        const isSelected = r.defaultSelectedIds?.includes(o.enrollmentId) ?? true;
                        defaults[r.email][o.enrollmentId] = {
                            selected: isSelected,
                            amount: o.defaultAmount,
                            discount: isSelected ? Math.round(perItemDiscount) : 0,
                        };
                    });

                    // ✅ Advance/installment "Paid" checkbox — by default CHECKED (true)
                    if (r.advance) advDefaults[r.email] = true;
                    if (r.installments?.length) {
                        instDefaults[r.email] = {};
                        r.installments.forEach((inst) => {
                            instDefaults[r.email][inst.number] = true;
                        });
                    }
                }
            });

            setSelectionMap(defaults);
            setAdvancePaidMap(advDefaults);
            setInstallmentPaidMap(instDefaults);
            setStep("review");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Preview failed");
        },
    });

    // ── Confirm mutation ─────────────────────────────────────────────────
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

        const advance = row.advance
            ? {
                amount: row.advance.amount,
                dueDate: row.advance.dueDate || undefined,
                description: row.advance.description,
                paidDate: row.advance.paidDate || undefined,
                paid: advancePaidMap[row.email] ?? true,
            }
            : null;

        const installments = (row.installments || []).map((inst) => ({
            amount: inst.amount,
            dueDate: inst.dueDate || undefined,
            description: inst.description,
            paidDate: inst.paidDate || undefined,
            paid: installmentPaidMap[row.email]?.[inst.number] ?? true,
        }));

        return {
            user: row.user._id,
            invoiceNumber: row.invoiceNumber || undefined,
            dueDate: row.dueDate || undefined,
            issueDate: row.issueDate || undefined,
            items,
            advance,
            installments,
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
                                        ? "Excel se naye invoices banayein (advance/installments ke sath)"
                                        : "Review karein — Paid checkbox uncheck karke kisi installment ko unpaid rakh sakte hain"}
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

                                    <div className="text-xs text-gray-500 space-y-1">
                                        <p>
                                            <strong>Header names</strong> se columns pehchane jaate hain (order matter nahi karta):
                                        </p>
                                        <p className="font-mono text-[11px] bg-gray-50 p-2 rounded border border-gray-200 leading-relaxed">
                                            Name · Email · Amount · Discount · Due Date · Issue Date · Invoice Number ·
                                            Advance Amount · Advance Paid Date · Advance Description ·
                                            Installment 1 Amount · Installment 1 Due Date · Installment 1 Description · Installment 1 Paid Date ·
                                            Installment 2 Amount · ... (jitni installments chahiye)
                                        </p>
                                        <p>
                                            "Discount" column optional hai — agar diya, to automatically program fee se subtract hoga (review step mein edit bhi kar sakte hain).
                                        </p>
                                        <p>
                                            Agar kisi installment ki Due Date khali ho lekin Paid Date di ho, to Due Date automatically
                                            <strong> Paid Date + 7 din</strong> ban jayegi.
                                        </p>
                                    </div>
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
                                        const programTotal = selectedEntries.reduce(
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
                                                        {row.issueDate ? `issued ${fmtDate(row.issueDate)}` : ""}
                                                        {row.dueDate ? ` · due ${fmtDate(row.dueDate)}` : ""}
                                                        {row.invoiceNumber ? ` · Invoice # ${row.invoiceNumber}` : " · Invoice #: auto-generate"}
                                                        {row.discountAmount ? ` · Discount from file: Rs ${row.discountAmount.toLocaleString()}` : ""}
                                                    </p>

                                                    {/* Program checkboxes */}
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
                                                                    Programs Total: Rs {programTotal.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* ✅ Advance row */}
                                                    {isEligible && row.advance && (
                                                        <div className="mt-2 flex items-center gap-2 bg-amber-50 rounded-lg p-2 flex-wrap">
                                                            <label className="flex items-center gap-1.5 shrink-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={advancePaidMap[row.email] ?? true}
                                                                    onChange={() =>
                                                                        setAdvancePaidMap((prev) => ({
                                                                            ...prev,
                                                                            [row.email]: !(prev[row.email] ?? true),
                                                                        }))
                                                                    }
                                                                />
                                                                <span className="text-[10px] text-gray-500">Paid</span>
                                                            </label>
                                                            <span className="text-xs font-medium text-amber-800">
                                                                {row.advance.description || "Advance"}
                                                            </span>
                                                            <span className="text-xs text-gray-600">Rs {row.advance.amount.toLocaleString()}</span>
                                                            <span className="text-[11px] text-gray-500">
                                                                paid {fmtDate(row.advance.paidDate)} · due {fmtDate(row.advance.dueDate)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* ✅ Installments rows */}
                                                    {isEligible && (row.installments?.length || 0) > 0 && (
                                                        <div className="mt-2 space-y-1.5">
                                                            {row.installments!.map((inst) => (
                                                                <div key={inst.number} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 flex-wrap">
                                                                    <label className="flex items-center gap-1.5 shrink-0">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={installmentPaidMap[row.email]?.[inst.number] ?? true}
                                                                            onChange={() =>
                                                                                setInstallmentPaidMap((prev) => ({
                                                                                    ...prev,
                                                                                    [row.email]: {
                                                                                        ...prev[row.email],
                                                                                        [inst.number]: !(prev[row.email]?.[inst.number] ?? true),
                                                                                    },
                                                                                }))
                                                                            }
                                                                        />
                                                                        <span className="text-[10px] text-gray-500">Paid</span>
                                                                    </label>
                                                                    <span className="text-xs font-medium text-gray-700">
                                                                        {inst.description || `Installment ${inst.number}`}
                                                                    </span>
                                                                    <span className="text-xs text-gray-600">Rs {inst.amount.toLocaleString()}</span>
                                                                    <span className="text-[11px] text-gray-500">
                                                                        {inst.paidDate ? `paid ${fmtDate(inst.paidDate)}` : "not yet paid"} · due {fmtDate(inst.dueDate)}
                                                                    </span>
                                                                </div>
                                                            ))}
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