"use client";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/store/hooks";
import ProtectedRoute from "@/app/component/protected-route";
import PageHeader from "@/app/component/dashboard/page-header";
import { CreditCard, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Download, FileText } from "lucide-react";
import { useState } from "react";
import { getMe, getMyInvoices } from "@/utils/api";
import DownloadInvoice from "./component/download-invoice";
import DocumentsGalleryModal from "../profile/component/documents-gallery-modal";
import DocumentsSection from "../profile/component/documents-section";
import ExportButton from "@/app/component/ui/export-button";

// ── API ───────────────────────────────────────────────────────


// ── Helpers ───────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PAID: { label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle },
  PARTIAL: { label: "Partial", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  PENDING: { label: "Pending", color: "bg-sky-100 text-sky-700", icon: Clock },
  OVERDUE: { label: "Overdue", color: "bg-rose-100 text-rose-700", icon: AlertCircle },
  EXTENDED: { label: "Extended", color: "bg-indigo-100 text-indigo-700", icon: Clock },
  BLOCKED: { label: "Blocked", color: "bg-gray-100 text-gray-600", icon: AlertCircle },
};

const installmentStatus: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-sky-100 text-sky-700",
  OVERDUE: "bg-rose-100 text-rose-700",
};

function fmt(n: number) {
  return `Rs ${(n || 0).toLocaleString()}`;
}

function daysLeft(date: string) {
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: `${Math.abs(diff)} days overdue`, overdue: true };
  if (diff === 0) return { text: "Due today", overdue: true };
  return { text: `${diff} days left`, overdue: false };
}

// function handleDownload(invoice: any) {
//   const rows = invoice.installments?.map((inst: any, i: number) =>
//     `<tr>
//       <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${inst.label}</td>
//       <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${new Date(inst.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</td>
//       <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">Rs ${inst.amount?.toLocaleString()}</td>
//       <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;">
//         <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${inst.status === "PAID" ? "#dcfce7" : "#f1f5f9"};color:${inst.status === "PAID" ? "#16a34a" : "#64748b"}">
//           ${inst.status === "PAID" ? "✓ Paid" : "Pending"}
//         </span>
//       </td>
//     </tr>`
//   ).join("") || "";

//   const html = `<!DOCTYPE html>
// <html>
// <head>
//   <meta charset="UTF-8"/>
//   <style>
//     * { margin:0; padding:0; box-sizing:border-box; }
//     body { font-family:'Segoe UI',Arial,sans-serif; background:#f8fafc; padding:40px; color:#1a1a2e; }
//     .card { background:#fff; border-radius:16px; max-width:700px; margin:0 auto; padding:40px; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
//     .header { border-bottom:3px solid #c8a84b; padding-bottom:24px; margin-bottom:28px; }
//     .badge { display:inline-block; font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; }
//     table { width:100%; border-collapse:collapse; }
//     th { background:#f8fafc; padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:#64748b; text-align:left; }
//     .summary { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:28px; }
//     .stat { background:#f8fafc; border-radius:10px; padding:16px; text-align:center; }
//     .stat label { font-size:11px; color:#94a3b8; text-transform:uppercase; display:block; margin-bottom:6px; }
//     .stat value { font-size:20px; font-weight:700; }
//     @media print { body { background:#fff; padding:0; } .card { box-shadow:none; } }
//   </style>
// </head>
// <body>
// <div class="card">
//   <div class="header">
//     <div style="display:flex;justify-content:space-between;align-items:flex-start;">
//       <div>
//         <h1 style="font-size:22px;font-weight:700;margin-bottom:4px;">Invoice</h1>
//         <p style="font-size:13px;color:#64748b;">#${invoice.invoiceNumber || invoice._id?.slice(-6).toUpperCase()}</p>
//       </div>
//       <span class="badge" style="background:${invoice.status === "PAID" ? "#dcfce7" : invoice.status === "OVERDUE" ? "#fee2e2" : "#fef9c3"};color:${invoice.status === "PAID" ? "#16a34a" : invoice.status === "OVERDUE" ? "#dc2626" : "#92400e"}">
//         ${invoice.status}
//       </span>
//     </div>
//   </div>

//   <div style="margin-bottom:24px;">
//     <p style="font-size:13px;color:#64748b;margin-bottom:4px;">Program</p>
//     <p style="font-size:16px;font-weight:600;">${invoice.enrollment?.program?.name || "—"}</p>
//   </div>

//   <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:28px;">
//     <div style="background:#f8fafc;border-radius:10px;padding:16px;text-align:center;">
//       <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;margin-bottom:6px;">Total Amount</div>
//       <div style="font-size:18px;font-weight:700;">Rs ${invoice.totalAmount?.toLocaleString()}</div>
//     </div>
//     <div style="background:#f0fdf4;border-radius:10px;padding:16px;text-align:center;">
//       <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;margin-bottom:6px;">Paid</div>
//       <div style="font-size:18px;font-weight:700;color:#16a34a;">Rs ${invoice.paidAmount?.toLocaleString()}</div>
//     </div>
//     <div style="background:${invoice.remainingAmount > 0 ? "#fff1f2" : "#f8fafc"};border-radius:10px;padding:16px;text-align:center;">
//       <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;margin-bottom:6px;">Remaining</div>
//       <div style="font-size:18px;font-weight:700;color:${invoice.remainingAmount > 0 ? "#dc2626" : "#94a3b8"};">Rs ${invoice.remainingAmount?.toLocaleString()}</div>
//     </div>
//   </div>

//   ${invoice.installments?.length ? `
//   <p style="font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:0.05em;margin-bottom:12px;">Installment Schedule</p>
//   <table>
//     <thead><tr>
//       <th>Description</th><th>Due Date</th><th style="text-align:right;">Amount</th><th style="text-align:center;">Status</th>
//     </tr></thead>
//     <tbody>${rows}</tbody>
//   </table>` : ""}

//   ${invoice.payments?.length ? `
//   <p style="font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:0.05em;margin:24px 0 12px;">Payment History</p>
//   <table>
//     <thead><tr><th>Method</th><th>Date</th><th>Reference</th><th style="text-align:right;">Amount</th></tr></thead>
//     <tbody>
//       ${invoice.payments.map((p: any) => `
//       <tr>
//         <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-transform:capitalize;">${p.method}</td>
//         <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
//         <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${p.referenceNumber || "—"}</td>
//         <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;color:#16a34a;font-weight:600;">Rs ${p.amount?.toLocaleString()}</td>
//       </tr>`).join("")}
//     </tbody>
//   </table>` : ""}

//   <div style="margin-top:32px;padding-top:20px;border-top:1px solid #f1f5f9;text-align:center;">
//     <p style="font-size:11px;color:#94a3b8;">Center for Human Brilliance & Behavioral Reengineering</p>
//     <p style="font-size:11px;color:#94a3b8;margin-top:4px;">Generated on ${new Date().toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}</p>
//   </div>
// </div>
// </body></html>`;

//   const blob = new Blob([html], { type: "text/html" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = `Invoice-${invoice.invoiceNumber || invoice._id?.slice(-6)}.html`;
//   a.click();
//   URL.revokeObjectURL(url);
// }

// ── Invoice Card ──────────────────────────────────────────────
function InvoiceCard({ invoice }: { invoice: any }) {
  // const { user } = useAppSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [receiptsOpen, setReceiptsOpen] = useState(false);

  const user = invoice.user || {};
  const contractDetails = invoice.enrollment?.leadSnapshot?.contractDetails || {};

  const userForInvoice = {
    name: user.name || contractDetails.fullName,
    email: user.email || contractDetails.email,
    phone: user.phone || contractDetails.phone,
    cnic: contractDetails.cnic,
    address: contractDetails.currentAddress,
  };

  const cfg = statusConfig[invoice.status] || statusConfig.PENDING;
  const Icon = cfg.icon;
  const paid = invoice.paidAmount || 0;
  const total = invoice.totalAmount || 0;
  const remaining = invoice.remainingAmount || 0;
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
  const due = invoice.dueDate ? daysLeft(invoice.dueDate) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── Card Header ── */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="font-semibold text-gray-800 text-base">
              {invoice.enrollment?.program?.name || "Program"}
            </p>
            {(invoice.enrollment?.program?.short_description || invoice.enrollment?.program?.shortDescription) && (
              <p className="text-xs text-gray-400 mt-0.5 italic">
                {invoice.enrollment?.program?.short_description || invoice.enrollment?.program?.shortDescription}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">
              Invoice #{invoice._id?.slice(-6).toUpperCase()}
              {invoice.dueDate && ` · Due: ${new Date(invoice.dueDate).toLocaleDateString()}`}
            </p>
            {due && (
              <p className={`text-xs font-medium mt-1 ${due.overdue ? "text-rose-500" : "text-gray-400"}`}>
                {due.text}
              </p>
            )}
          </div>
          <div>
            {/* Download Button */}
            <div className="flex items-center justify-end gap-2 ">
              <button
                onClick={() => DownloadInvoice(invoice, userForInvoice)}
                className="w-full flex items-center justify-center gap-2 px-2.5 py-1 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Download size={14} />
                Download Invoice
              </button>
              <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full shrink-0 ${cfg.color}`}>
                <Icon size={12} />
                {cfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* Amount row */}
        {/* <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Total</p>
            <p className="font-bold text-gray-800 text-sm">{fmt(total)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Paid</p>
            <p className="font-bold text-green-600 text-sm">{fmt(paid)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${remaining > 0 ? "bg-rose-50" : "bg-gray-50"}`}>
            <p className="text-xs text-gray-400 mb-1">Remaining</p>
            <p className={`font-bold text-sm ${remaining > 0 ? "text-rose-500" : "text-gray-400"}`}>
              {fmt(remaining)}
            </p>
          </div>
        </div> */}

        {/* Progress bar */}
        <div className="mb-1">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Payment progress</span>
            <span className="font-medium text-gray-600">{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${pct >= 100 ? "bg-green-400" : pct > 0 ? "bg-yellow-400" : "bg-gray-200"
                }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Installments toggle */}
        {invoice.installments?.length > 0 && (
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 text-xs text-yellow-700 font-medium mt-3 hover:text-yellow-800 transition-colors"
          >
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {open ? "Hide" : "Show"} installments ({invoice.installments.length})
          </button>
        )}
      </div>

      {/* ── Installments ── */}
      {open && invoice.installments?.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="px-5 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Installment Plan
            </p>
            <div className="space-y-2">
              {invoice.installments.map((inst: any, idx: number) => {
                const instDue = inst.dueDate ? daysLeft(inst.dueDate) : null;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border ${inst.status === "PAID"
                      ? "bg-green-50 border-green-100"
                      : inst.status === "OVERDUE"
                        ? "bg-rose-50 border-rose-100"
                        : "bg-white border-gray-100"
                      }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Installment {idx + 1}
                      </p>
                      <p className="text-xs text-gray-400">
                        {inst.dueDate
                          ? new Date(inst.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </p>
                      {instDue && inst.status !== "PAID" && (
                        <p className={`text-[11px] font-medium mt-0.5 ${instDue.overdue ? "text-rose-500" : "text-gray-400"}`}>
                          {instDue.text}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800 mb-1">{fmt(inst.amount)}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${installmentStatus[inst.status] || "bg-gray-100 text-gray-500"}`}>
                        {inst.status === "PAID" ? "✓ Paid" : inst.status === "OVERDUE" ? "Overdue" : "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Payment History ── */}
      {invoice.payments?.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Payment History
          </p>
          <div className="space-y-2">
            {invoice.payments.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium capitalize">{p.method}</p>
                    <p className="text-xs text-gray-400">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                      {p.referenceNumber ? ` · Ref: ${p.referenceNumber}` : ""}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-green-600">{fmt(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {invoice.user?.documents?.filter((d: any) => d.type === "receipt").length > 0 && (
        <div className="px-5 pb-4">
          {/* <button
            onClick={() => setReceiptsOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <FileText size={14} />
            View Receipts ({invoice.user.documents.filter((d: any) => d.type === "receipt").length})
          </button>

          <DocumentsGalleryModal
            isOpen={receiptsOpen}
            onClose={() => setReceiptsOpen(false)}
            userId={invoice.user._id}
            documents={invoice.user.documents}
            filterType="receipt"
            queryKey={["my-invoices"]}
          /> */}
          <DocumentsSection
            userId={invoice.user?._id}
            documents={invoice.user?.documents || []}
            defaultType="receipt"
            showDropdown={false}
            filterType="receipt"
            queryKey={["my-invoices"]}
            title="Payment Receipts"
            description="Upload your payment receipt for verification"
          />
        </div>
      )}

      {/* Notice */}
      {invoice.status !== "PAID" && (
        <div className="px-5 pb-4">
          <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            💡 Please contact your finance manager to make a payment
          </p>
        </div>
      )}
    </div>
  );
}

// ── Summary Stats ─────────────────────────────────────────────
function SummaryStats({ invoices }: { invoices: any[] }) {
  const total = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const paid = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
  const remaining = invoices.reduce((s, i) => s + (i.remainingAmount || 0), 0);
  const overdue = invoices.filter((i) => i.status === "OVERDUE").length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {[
        { label: "Total Amount", value: fmt(total), color: "text-gray-800", bg: "bg-gray-50" },
        { label: "Total Paid", value: fmt(paid), color: "text-green-600", bg: "bg-green-50" },
        { label: "Remaining", value: fmt(remaining), color: "text-rose-500", bg: "bg-rose-50" },
        { label: "Overdue", value: `${overdue} invoice${overdue !== 1 ? "s" : ""}`, color: overdue > 0 ? "text-rose-500" : "text-gray-400", bg: overdue > 0 ? "bg-rose-50" : "bg-gray-50" },
      ].map((s) => (
        <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
          <p className="text-xs text-gray-400 mb-1">{s.label}</p>
          <p className={`font-bold text-base ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
function PaymentsContent() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-invoices"],
    queryFn: getMyInvoices,
  });

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe().then((r) => r.data.data),
  });

  const isStudent = me?.role === "user";

  const invoices = data?.data?.data || [];
  const active = invoices.filter((i: any) => i.status !== "PAID");
  const paid = invoices.filter((i: any) => i.status === "PAID");

  return (
    <>
      <PageHeader
        title="My Payments"
        subtitle="View your invoices and payment history"
        titleIcon={<CreditCard size={24} />}
        totalCount={invoices.length}
        exportBtn={
          invoices.length > 0 ? (
            <ExportButton
              filename="my-payments"
              label="Export Excel"
              fetchData={async () => invoices}
              columns={[
                { header: "Invoice #", key: "invoiceNumber" },
                { header: "Program", key: "enrollment.program.name" },
                { header: "Total (Rs)", key: "totalAmount", format: (v) => Number(v || 0).toLocaleString() },
                { header: "Paid (Rs)", key: "paidAmount", format: (v) => Number(v || 0).toLocaleString() },
                { header: "Remaining (Rs)", key: "remainingAmount", format: (v) => Number(v || 0).toLocaleString() },
                { header: "Status", key: "status" },
                { header: "Due Date", key: "dueDate", format: (v) => v ? new Date(v).toLocaleDateString("en-PK") : "—" },
                { header: "Batch", key: "enrollment.batch.name" },
                { header: "Created At", key: "createdAt", format: (v) => v ? new Date(v).toLocaleDateString("en-PK") : "—" },
              ]}
            />
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading payments...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-rose-500 text-sm">Failed to load payments</div>
      ) : !invoices.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center">
            <CreditCard size={28} className="text-yellow-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700">No invoices found</p>
            <p className="text-sm text-gray-400 mt-1">Please contact your finance manager</p>
          </div>
        </div>
      ) : (
        <>
          <SummaryStats invoices={invoices} />

          {/* Active / Pending invoices */}
          {active.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock size={14} />
                Pending ({active.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {active.map((inv: any) => <InvoiceCard key={inv._id} invoice={inv} />)}
              </div>
            </div>
          )}

          {/* Paid invoices */}
          {paid.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle size={14} />
                Paid ({paid.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {paid.map((inv: any) => <InvoiceCard key={inv._id} invoice={inv} />)}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function PaymentsPage() {
  return (
    <ProtectedRoute allowedRoles={["user", "admin", "super_admin"]}>
      <PaymentsContent />
    </ProtectedRoute>
  );
}