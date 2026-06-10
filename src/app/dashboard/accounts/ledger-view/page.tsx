"use client";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { getAccountLedger, getAllAccounts } from "@/utils/api";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Search,
  Download,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
const fmt = (n: number) =>
  `Rs ${(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const fmtDate = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const TYPE_COLORS: Record<string, string> = {
  asset:     "bg-sky-100 text-sky-700",
  liability: "bg-rose-100 text-rose-700",
  equity:    "bg-purple-100 text-purple-700",
  income:    "bg-green-100 text-green-700",
  expense:   "bg-orange-100 text-orange-700",
};

const SOURCE_BADGE: Record<string, string> = {
  payment:    "bg-green-50 text-green-700",
  invoice:    "bg-blue-50 text-blue-700",
  expense:    "bg-rose-50 text-rose-700",
  manual:     "bg-purple-50 text-purple-700",
  refund:     "bg-orange-50 text-orange-700",
  adjustment: "bg-gray-100 text-gray-600",
};

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-800 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Mini sparkline (CSS bars) ─────────────────────────────────
function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data.map(Math.abs), 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t-sm ${v >= 0 ? "bg-green-300" : "bg-rose-300"}`}
          style={{ height: `${Math.max((Math.abs(v) / max) * 100, 4)}%` }}
        />
      ))}
    </div>
  );
}

// ── Account Selector ──────────────────────────────────────────
function AccountSelector({
  currentId,
  onSelect,
}: {
  currentId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["accounts-all"],
    queryFn: () => getAllAccounts().then((r) => r.data.data),
  });

  const filtered = (data || []).filter(
    (a: any) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.includes(search)
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:border-yellow-400 transition-colors"
      >
        <Wallet size={14} />
        Switch Account
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-xl shadow-xl z-20 w-64">
          <div className="p-2 border-b border-gray-50">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
              <Search size={13} className="text-gray-400" />
              <input
                autoFocus
                className="bg-transparent text-sm flex-1 focus:outline-none"
                placeholder="Search accounts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.map((a: any) => (
              <button
                key={a._id}
                onClick={() => { onSelect(a._id); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-yellow-50 flex items-center gap-2 ${
                  a._id === currentId ? "bg-yellow-50 text-yellow-700 font-medium" : "text-gray-700"
                }`}
              >
                <span className="font-mono text-xs text-gray-400">{a.code}</span>
                {a.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-4">No accounts found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function LedgerViewPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [accountId, setAccountId] = useState(searchParams.get("id") || "");

  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["ledger", accountId, dateFilter, page],
    queryFn: () =>
      getAccountLedger(accountId, {
        from:  dateFilter.from || undefined,
        to:    dateFilter.to   || undefined,
        page,
        limit: 30,
      }).then((r) => r.data.data),
    enabled: !!accountId,
  });

  // Client-side search on description
  const ledger = useMemo(() => {
    const rows = data?.ledger || [];
    if (!search.trim()) return rows;
    return rows.filter((r: any) =>
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.entryNumber?.toLowerCase().includes(search.toLowerCase())
    );
  }, [data?.ledger, search]);

  const account = data?.account;

  // Sparkline — last 10 balance points
  const sparkData = ledger.slice(-10).map((r: any) => r.balance);

  // Totals from filtered rows
  const totalDebit  = ledger.reduce((s: number, r: any) => s + (r.debit  || 0), 0);
  const totalCredit = ledger.reduce((s: number, r: any) => s + (r.credit || 0), 0);

  const handleAccountSwitch = (id: string) => {
    setAccountId(id);
    setPage(1);
    setSearch("");
    router.replace(`/dashboard/finance/accounts/ledger-view?id=${id}`, { scroll: false });
  };

  // No account selected
  if (!accountId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Wallet size={40} className="text-gray-300" />
        <p className="text-gray-500 text-sm">Select an account to view its ledger</p>
        <AccountSelector currentId="" onSelect={handleAccountSwitch} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            {isLoading ? (
              <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
            ) : (
              <>
                <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  {account?.name || "Ledger"}
                  {account?.type && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[account.type] || "bg-gray-100 text-gray-500"}`}>
                      {account.type}
                    </span>
                  )}
                </h1>
                <p className="text-xs text-gray-400">
                  Code: <span className="font-mono">{account?.code}</span>
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AccountSelector currentId={accountId} onSelect={handleAccountSwitch} />
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Opening Balance"
          value={fmt(data?.openingBalance ?? 0)}
          icon={Wallet}
          color="bg-gray-400"
        />
        <KpiCard
          label="Current Balance"
          value={fmt(data?.currentBalance ?? 0)}
          icon={Wallet}
          color="bg-yellow-500"
          sub={account?.type}
        />
        <KpiCard
          label="Total Debits"
          value={fmt(totalDebit)}
          icon={TrendingUp}
          color="bg-green-500"
          sub={`${ledger.filter((r: any) => r.debit > 0).length} entries`}
        />
        <KpiCard
          label="Total Credits"
          value={fmt(totalCredit)}
          icon={TrendingDown}
          color="bg-rose-500"
          sub={`${ledger.filter((r: any) => r.credit > 0).length} entries`}
        />
      </div>

      {/* ── Sparkline ───────────────────────────────────── */}
      {sparkData.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-2">Balance trend (last {sparkData.length} transactions)</p>
          <Sparkline data={sparkData} />
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[180px]">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            className="text-sm flex-1 focus:outline-none"
            placeholder="Search description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Calendar size={14} className="text-gray-400 shrink-0" />
          <input
            type="date"
            className="text-sm focus:outline-none text-gray-600"
            value={dateFilter.from}
            onChange={(e) => { setDateFilter({ ...dateFilter, from: e.target.value }); setPage(1); }}
          />
          <span className="text-gray-300 text-sm">→</span>
          <input
            type="date"
            className="text-sm focus:outline-none text-gray-600"
            value={dateFilter.to}
            onChange={(e) => { setDateFilter({ ...dateFilter, to: e.target.value }); setPage(1); }}
          />
        </div>

        {/* Clear */}
        {(dateFilter.from || dateFilter.to || search) && (
          <button
            onClick={() => { setDateFilter({ from: "", to: "" }); setSearch(""); setPage(1); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Ledger Table ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-yellow-500" />
          </div>
        ) : ledger.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Wallet size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No transactions found</p>
            <p className="text-xs mt-1">
              {search || dateFilter.from ? "Try adjusting your filters" : "Transactions will appear here once journal entries are posted"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                    <th className="text-left px-5 py-3">Date</th>
                    <th className="text-left px-3 py-3">Entry No.</th>
                    <th className="text-left px-3 py-3">Description</th>
                    <th className="text-left px-3 py-3 hidden md:table-cell">Source</th>
                    <th className="text-right px-3 py-3">Debit</th>
                    <th className="text-right px-3 py-3">Credit</th>
                    <th className="text-right px-5 py-3">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening balance row */}
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <td colSpan={6} className="px-5 py-2 text-xs text-gray-400 italic">
                      Opening Balance
                    </td>
                    <td className="px-5 py-2 text-right font-semibold text-gray-600 text-xs">
                      {fmt(data?.openingBalance ?? 0)}
                    </td>
                  </tr>

                  {ledger.map((row: any, i: number) => {
                    const isPositive = row.balance >= 0;
                    return (
                      <tr
                        key={i}
                        className="border-t border-gray-50 hover:bg-yellow-50/40 transition-colors"
                      >
                        <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {fmtDate(row.date)}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-gray-400">
                          {row.entryNumber || "—"}
                        </td>
                        <td className="px-3 py-3 text-gray-700 max-w-xs">
                          <p className="truncate">{row.description}</p>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          {row.sourceType && (
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${SOURCE_BADGE[row.sourceType] || "bg-gray-100 text-gray-500"}`}>
                              {row.sourceType}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-green-600">
                          {row.debit > 0 ? fmt(row.debit) : <span className="text-gray-200">—</span>}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-rose-500">
                          {row.credit > 0 ? fmt(row.credit) : <span className="text-gray-200">—</span>}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`font-bold text-sm ${isPositive ? "text-gray-800" : "text-rose-600"}`}>
                            {fmt(Math.abs(row.balance))}
                            {!isPositive && <span className="text-xs ml-1 font-normal">(Dr)</span>}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Totals row */}
                  <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-sm">
                    <td colSpan={4} className="px-5 py-3 text-gray-500 text-xs uppercase tracking-wide">
                      Period Total
                    </td>
                    <td className="px-3 py-3 text-right text-green-600">{fmt(totalDebit)}</td>
                    <td className="px-3 py-3 text-right text-rose-500">{fmt(totalCredit)}</td>
                    <td className="px-5 py-3 text-right text-gray-800">{fmt(data?.currentBalance ?? 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.meta && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Page {page} of {data.meta.totalPages} · {data.meta.total} entries
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= data.meta.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}