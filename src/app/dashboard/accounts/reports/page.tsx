"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getProfitLoss,
  getBalanceSheet,
  getARAgingReport,
  getCashFlowReport,
  getRevenueByProgram,
} from "@/utils/api";
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Scale,
  AlertCircle,
  ArrowRightLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import PageHeader from "@/app/component/dashboard/page-header";
import DateRangeFilter from "@/app/component/dashboard/date-range-filter";
import API from "@/utils/api";


async function openOrDownloadPdf(url: string, mode: "view" | "download", filename: string) {
  try {
    const res = await API.get(url, {
      responseType: "blob", // ⬅️ zaroori — PDF binary data ke liye
    });

    const blob = new Blob([res.data], { type: "application/pdf" });
    const blobUrl = window.URL.createObjectURL(blob);

    if (mode === "view") {
      window.open(blobUrl, "_blank");
    } else {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    // thodi der baad memory clean karo
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
  } catch (err) {
    console.error("PDF fetch failed:", err);
    alert("PDF load nahi ho saka. Dobara try karein.");
  }
}

// ── Helpers ───────────────────────────────────────────────────
const fmt = (n: number) =>
  `Rs ${(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => currentYear - i);

// ── Tab type ──────────────────────────────────────────────────
type ReportTab = "pl" | "balance" | "ar-aging" | "cashflow" | "by-program";

// ── Section Row (collapsible) ─────────────────────────────────
function ReportSection({
  title, total, lines, color, bgColor,
}: {
  title: string;
  total: number;
  lines: { name: string; amount: number; code?: string }[];
  color: string;
  bgColor: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className={`rounded-xl border border-gray-100 overflow-hidden mb-4`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-5 py-3 ${bgColor}`}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          <span className={`font-semibold text-sm ${color}`}>{title}</span>
        </div>
        <span className={`font-bold text-sm ${color}`}>{fmt(total)}</span>
      </button>

      {open && (
        <table className="w-full text-sm bg-white">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-2.5 text-gray-500">
                  {line.code && (
                    <span className="font-mono text-xs text-gray-300 mr-2">{line.code}</span>
                  )}
                  {line.name}
                </td>
                <td className={`px-5 py-2.5 text-right font-semibold ${color}`}>
                  {fmt(line.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Mini Bar Chart ─────────────────────────────────────────────
function BarChart({
  data,
  valueKey,
  labelKey = "monthName",
  color = "bg-yellow-400",
}: {
  data: any[];
  valueKey: string;
  labelKey?: string;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => Math.abs(d[valueKey] || 0)), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => {
        const val = d[valueKey] || 0;
        const height = Math.max((Math.abs(val) / max) * 100, val !== 0 ? 3 : 1);
        const barColor = val < 0 ? "bg-rose-400" : color;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[8px] text-gray-400">
              {Math.abs(val) > 999 ? `${(Math.abs(val) / 1000).toFixed(0)}k` : ""}
            </span>
            <div
              className={`w-full ${barColor} rounded-t-sm`}
              style={{ height: `${height}%`, minHeight: "1px" }}
              title={`${d[labelKey]}: ${fmt(val)}`}
            />
            <span className="text-[8px] text-gray-400">{d[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Year Filter ───────────────────────────────────────────────
function YearSelect({
  year, onChange,
}: {
  year: number;
  onChange: (y: number) => void;
}) {
  return (
    <select
      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-yellow-400 placeholder:text-gray-600 text-gray-600 bg-white"
      value={year}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {YEARS.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  );
}

// ─────────────────────────────────────────────────────────────
// P&L TAB
// ─────────────────────────────────────────────────────────────
function ProfitLossTab() {
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["report-pl", dateRange],
    queryFn: () =>
      getProfitLoss({ from: dateRange.from || undefined, to: dateRange.to || undefined }).then(
        (r) => r.data.data
      ),
  });

  if (isLoading) return <Loader />;

  const netPositive = (data?.netProfit || 0) >= 0;

  const pdfQueryParams = () => {
    const params = new URLSearchParams();
    if (dateRange.from) params.set("from", dateRange.from);
    if (dateRange.to) params.set("to", dateRange.to);
    return params.toString();
  };


  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {dateRange.from || dateRange.to
            ? `Period: ${dateRange.from || "…"} — ${dateRange.to || "…"}`
            : "Period: All Time"}
        </p>
        <div className="flex items-center gap-3">
          <DateRangeFilter
            from={dateRange.from}
            to={dateRange.to}
            onChange={(from, to) => setDateRange({ from, to })}
          />
          <button
            onClick={() =>
              openOrDownloadPdf(
                `/api/v1/reports/profit-loss?format=pdf&mode=view${pdfQueryParams() ? `&${pdfQueryParams()}` : ""}`,
                "view",
                "profit-loss.pdf"
              )
            }
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            View PDF
          </button>

          <button
            onClick={() =>
              openOrDownloadPdf(
                `/api/v1/reports/profit-loss?format=pdf&mode=download${pdfQueryParams() ? `&${pdfQueryParams()}` : ""}`,
                "download",
                "profit-loss.pdf"
              )
            }
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-xs text-green-600">Total Income</p>
          <p className="text-xl font-bold text-green-700 mt-1">{fmt(data?.income?.total)}</p>
        </div>
        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
          <p className="text-xs text-rose-600">Total Expenses</p>
          <p className="text-xl font-bold text-rose-700 mt-1">{fmt(data?.expenses?.total)}</p>
        </div>
        <div className={`rounded-xl p-4 border ${netPositive ? "bg-teal-50 border-teal-100" : "bg-orange-50 border-orange-100"}`}>
          <p className={`text-xs ${netPositive ? "text-teal-600" : "text-orange-600"}`}>
            Net {netPositive ? "Profit" : "Loss"}
          </p>
          <p className={`text-xl font-bold mt-1 ${netPositive ? "text-teal-700" : "text-orange-700"}`}>
            {fmt(Math.abs(data?.netProfit || 0))}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{data?.profitMargin}% margin</p>
        </div>
      </div>

      {/* Monthly chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-3">Monthly Profit / Loss</p>
        <BarChart
          data={data?.monthlyBreakdown || []}
          valueKey="profit"
          color="bg-teal-400"
        />
      </div>

      {/* Income section */}
      <ReportSection
        title="Income"
        total={data?.income?.total || 0}
        lines={(data?.income?.lines || []).map((l: any) => ({
          code: l.code, name: l.name, amount: l.amount,
        }))}
        color="text-green-700"
        bgColor="bg-green-50"
      />

      {/* Expense section */}
      <ReportSection
        title="Expenses"
        total={data?.expenses?.total || 0}
        lines={(data?.expenses?.lines || []).map((l: any) => ({
          code: l.code, name: l.name, amount: l.amount,
        }))}
        color="text-rose-700"
        bgColor="bg-rose-50"
      />

      {/* Net line */}
      <div className={`rounded-xl p-4 flex items-center justify-between border ${netPositive ? "bg-teal-50 border-teal-200" : "bg-orange-50 border-orange-200"}`}>
        <span className="font-semibold text-gray-700">
          Net {netPositive ? "Profit" : "Loss"}
        </span>
        <span className={`text-xl font-bold ${netPositive ? "text-teal-700" : "text-orange-700"}`}>
          {fmt(Math.abs(data?.netProfit || 0))}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BALANCE SHEET TAB
// ─────────────────────────────────────────────────────────────
function BalanceSheetTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["report-balance-sheet"],
    queryFn: () => getBalanceSheet().then((r) => r.data.data),
  });

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">As of: {fmtDate(data?.asOf)}</p>
        <div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${data?.isBalanced ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}>
            {data?.isBalanced ? "✓ Balanced" : "⚠ Unbalanced"}
          </span>
          <button
            onClick={() =>
              openOrDownloadPdf(
                "/api/v1/reports/balance-sheet?format=pdf&mode=view",
                "view",
                "balance-sheet.pdf"
              )
            }
            className="text-gray-400 hover:text-gray-600"
          >
            View PDF
          </button>

          <button
            onClick={() =>
              openOrDownloadPdf(
                "/api/v1/reports/balance-sheet?format=pdf&mode=download",
                "download",
                "balance-sheet.pdf"
              )
            }
            className="text-gray-400 hover:text-gray-600"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs text-blue-600">Total Assets</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{fmt(data?.assets?.total)}</p>
        </div>
        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
          <p className="text-xs text-rose-600">Total Liabilities</p>
          <p className="text-xl font-bold text-rose-700 mt-1">{fmt(data?.liabilities?.total)}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <p className="text-xs text-purple-600">Total Equity</p>
          <p className="text-xl font-bold text-purple-700 mt-1">{fmt(data?.equity?.total)}</p>
        </div>
      </div>

      <ReportSection
        title="Assets"
        total={data?.assets?.total || 0}
        lines={(data?.assets?.lines || []).map((l: any) => ({
          code: l.code, name: l.name, amount: l.balance,
        }))}
        color="text-blue-700"
        bgColor="bg-blue-50"
      />

      <ReportSection
        title="Liabilities"
        total={data?.liabilities?.total || 0}
        lines={(data?.liabilities?.lines || []).map((l: any) => ({
          code: l.code, name: l.name, amount: l.balance,
        }))}
        color="text-rose-700"
        bgColor="bg-rose-50"
      />

      <ReportSection
        title="Equity"
        total={data?.equity?.total || 0}
        lines={(data?.equity?.lines || []).map((l: any) => ({
          code: l.code, name: l.name, amount: l.balance,
        }))}
        color="text-purple-700"
        bgColor="bg-purple-50"
      />

      {/* Equation check */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Accounting Equation: Assets = Liabilities + Equity</p>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="text-blue-700">{fmt(data?.assets?.total)}</span>
          <span className="text-gray-400">=</span>
          <span className="text-rose-700">{fmt(data?.liabilities?.total)}</span>
          <span className="text-gray-400">+</span>
          <span className="text-purple-700">{fmt(data?.equity?.total)}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AR AGING TAB
// ─────────────────────────────────────────────────────────────
const AGING_CONFIG = [
  { key: "current", label: "Current", color: "bg-green-500", text: "text-green-700", bg: "bg-green-50" },
  { key: "days_30", label: "1–30 days", color: "bg-yellow-400", text: "text-yellow-700", bg: "bg-yellow-50" },
  { key: "days_60", label: "31–60 days", color: "bg-orange-400", text: "text-orange-700", bg: "bg-orange-50" },
  { key: "days_90", label: "61–90 days", color: "bg-red-400", text: "text-red-700", bg: "bg-red-50" },
  { key: "days_90p", label: "90+ days", color: "bg-rose-600", text: "text-rose-700", bg: "bg-rose-50" },
];

function ARAgingTab() {
  const [activeBucket, setActiveBucket] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["report-ar-aging"],
    queryFn: () => getARAgingReport().then((r) => r.data.data),
  });

  if (isLoading) return <Loader />;

  const grand = data?.grandTotal || 0;

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-400">As of: {fmtDate(data?.asOf)}</p>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-2">
        {AGING_CONFIG.map((cfg) => {
          const bucket = data?.buckets?.[cfg.key];
          const pct = grand > 0 ? ((bucket?.total || 0) / grand * 100).toFixed(0) : "0";
          return (
            <button
              key={cfg.key}
              onClick={() => setActiveBucket(activeBucket === cfg.key ? null : cfg.key)}
              className={`rounded-xl p-3 border text-left transition-all ${cfg.bg} ${activeBucket === cfg.key ? "ring-2 ring-offset-1 ring-yellow-400" : "border-gray-100"}`}
            >
              <div className={`w-2 h-2 rounded-full ${cfg.color} mb-2`} />
              <p className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</p>
              <p className="text-base font-bold text-gray-800 mt-1">{fmt(bucket?.total || 0)}</p>
              <p className="text-xs text-gray-400">{bucket?.invoices?.length || 0} inv · {pct}%</p>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <p className="text-xs text-gray-500 mb-3">
          Total Outstanding: <span className="font-bold text-gray-800">{fmt(grand)}</span>
        </p>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {AGING_CONFIG.map((cfg) => {
            const bucket = data?.buckets?.[cfg.key];
            const w = grand > 0 ? ((bucket?.total || 0) / grand * 100) : 0;
            return w > 0 ? (
              <div
                key={cfg.key}
                className={cfg.color}
                style={{ width: `${w}%` }}
                title={`${cfg.label}: ${fmt(bucket?.total || 0)}`}
              />
            ) : null;
          })}
        </div>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {AGING_CONFIG.map((cfg) => (
            <div key={cfg.key} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${cfg.color}`} />
              <span className="text-xs text-gray-400">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bucket detail table */}
      {activeBucket && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">
              {AGING_CONFIG.find(c => c.key === activeBucket)?.label} — Invoices
            </h3>
            <span className="text-xs text-gray-400">
              {data?.buckets?.[activeBucket]?.invoices?.length || 0} invoices
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="text-left px-5 py-2">Invoice</th>
                <th className="text-left px-3 py-2">Student</th>
                <th className="text-left px-3 py-2 hidden md:table-cell">Program</th>
                <th className="text-right px-3 py-2 hidden md:table-cell">Due Date</th>
                <th className="text-right px-3 py-2">Days</th>
                <th className="text-right px-5 py-2">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {(data?.buckets?.[activeBucket]?.invoices || []).map((inv: any, i: number) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{inv.invoiceNumber}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-800 text-xs">{inv.studentName}</p>
                    <p className="text-xs text-gray-400">{inv.studentEmail}</p>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell text-xs text-gray-500">{inv.program}</td>
                  <td className="px-3 py-3 hidden md:table-cell text-right text-xs text-gray-500">
                    {fmtDate(inv.dueDate)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={`text-xs font-semibold ${inv.daysOverdue > 0 ? "text-rose-600" : "text-green-600"}`}>
                      {inv.daysOverdue > 0 ? `+${inv.daysOverdue}d` : "Current"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-gray-800">
                    {fmt(inv.outstanding)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CASH FLOW TAB
// ─────────────────────────────────────────────────────────────
function CashFlowTab() {
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["report-cashflow", dateRange],
    queryFn: () =>
      getCashFlowReport({ from: dateRange.from || undefined, to: dateRange.to || undefined }).then(
        (r) => r.data.data
      ),
  });

  if (isLoading) return <Loader />;

  const op = data?.operatingActivities;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {dateRange.from || dateRange.to
            ? `Period: ${dateRange.from || "…"} — ${dateRange.to || "…"}`
            : "Period: All Time"}
        </p>
        <DateRangeFilter
          from={dateRange.from}
          to={dateRange.to}
          onChange={(from, to) => setDateRange({ from, to })}
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-xs text-green-600">Cash In</p>
          <p className="text-xl font-bold text-green-700 mt-1">{fmt(op?.cashIn?.total)}</p>
        </div>
        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
          <p className="text-xs text-rose-600">Cash Out</p>
          <p className="text-xl font-bold text-rose-700 mt-1">{fmt(op?.cashOut?.total)}</p>
        </div>
        <div className={`rounded-xl p-4 border ${(op?.netCashFlow || 0) >= 0 ? "bg-teal-50 border-teal-100" : "bg-orange-50 border-orange-100"}`}>
          <p className={`text-xs ${(op?.netCashFlow || 0) >= 0 ? "text-teal-600" : "text-orange-600"}`}>Net Cash Flow</p>
          <p className={`text-xl font-bold mt-1 ${(op?.netCashFlow || 0) >= 0 ? "text-teal-700" : "text-orange-700"}`}>
            {fmt(op?.netCashFlow)}
          </p>
        </div>
      </div>

      {/* Monthly chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-3">Monthly Net Cash Flow</p>
        <BarChart
          data={data?.monthlyBreakdown || []}
          valueKey="net"
          color="bg-teal-400"
        />
      </div>

      {/* Cash In breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-green-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-green-700">Cash In — by Method</span>
            <span className="font-bold text-sm text-green-700">{fmt(op?.cashIn?.total)}</span>
          </div>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {(op?.cashIn?.lines || []).map((l: any, i: number) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-2.5 text-gray-600 capitalize">{l.method}</td>
                <td className="px-5 py-2.5 text-right text-gray-400 text-xs">{l.count} payments</td>
                <td className="px-5 py-2.5 text-right font-semibold text-green-600">{fmt(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cash Out breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-rose-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-rose-700">Cash Out — by Category</span>
            <span className="font-bold text-sm text-rose-700">{fmt(op?.cashOut?.total)}</span>
          </div>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {(op?.cashOut?.lines || []).map((l: any, i: number) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-2.5 text-gray-600 capitalize">{l.category}</td>
                <td className="px-5 py-2.5 text-right text-gray-400 text-xs">{l.count} expenses</td>
                <td className="px-5 py-2.5 text-right font-semibold text-rose-500">{fmt(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Closing balance */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs text-gray-500 mb-3">Closing Cash Balance</p>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400">Cash in Hand</p>
            <p className="font-bold text-gray-800">{fmt(data?.closingBalance?.cash)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Bank</p>
            <p className="font-bold text-gray-800">{fmt(data?.closingBalance?.bank)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total</p>
            <p className="font-bold text-yellow-600 text-base">{fmt(data?.closingBalance?.total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REVENUE BY PROGRAM TAB
// ─────────────────────────────────────────────────────────────
function RevenueByProgramTab() {
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["report-revenue-program", dateRange],
    queryFn: () =>
      getRevenueByProgram({
        from: dateRange.from || undefined,
        to: dateRange.to || undefined,
      }).then((r) => r.data.data),
  });

  if (isLoading) return <Loader />;

  const programs = data?.programs || [];
  const max = Math.max(...programs.map((p: any) => p.totalRevenue), 1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {dateRange.from || dateRange.to
            ? `Period: ${dateRange.from || "…"} — ${dateRange.to || "…"}`
            : "Period: All Time"}
        </p>
        <DateRangeFilter
          from={dateRange.from}
          to={dateRange.to}
          onChange={(from, to) => setDateRange({ from, to })}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <p className="text-xs text-gray-500 mb-1">Grand Total</p>
        <p className="text-2xl font-bold text-gray-800">{fmt(data?.grandTotal)}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
              <th className="text-left px-5 py-3">Program</th>
              <th className="text-left px-3 py-3 hidden md:table-cell">Revenue Share</th>
              <th className="text-right px-3 py-3">Payments</th>
              <th className="text-right px-5 py-3">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p: any, i: number) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{p.programName}</td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-yellow-400 h-1.5 rounded-full"
                        style={{ width: `${(p.totalRevenue / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right">{p.percent}%</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-right text-xs text-gray-400">{p.paymentCount}</td>
                <td className="px-5 py-3 text-right font-bold text-gray-800">{fmt(p.totalRevenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────
function Loader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-yellow-500" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
const TABS: { key: ReportTab; label: string; icon: any }[] = [
  { key: "pl", label: "Profit & Loss", icon: TrendingUp },
  { key: "balance", label: "Balance Sheet", icon: Scale },
  { key: "ar-aging", label: "AR Aging", icon: AlertCircle },
  { key: "cashflow", label: "Cash Flow", icon: ArrowRightLeft },
  { key: "by-program", label: "By Program", icon: BarChart2 },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("pl");

  return (
    <>
      <PageHeader
        title="Financial Reports"
        subtitle="P&L, Balance Sheet, AR Aging, Cash Flow"
        titleIcon={<BarChart2 size={24} />}
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === key
              ? "bg-white text-gray-800 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "pl" && <ProfitLossTab />}
      {activeTab === "balance" && <BalanceSheetTab />}
      {activeTab === "ar-aging" && <ARAgingTab />}
      {activeTab === "cashflow" && <CashFlowTab />}
      {activeTab === "by-program" && <RevenueByProgramTab />}
    </>
  );
}