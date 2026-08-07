"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getAccountsDashboard,
  getAllAccounts,
  getAllExpenses,
  seedAccounts,
} from "@/utils/api";
import {
  Landmark, TrendingUp, TrendingDown, DollarSign,
  BookOpen, Receipt, ChevronRight, Plus, Loader2, NotepadText
} from "lucide-react";
import PageHeader from "@/app/component/dashboard/page-header";
import AccountsList from "./components/accounts-list";
import ExpenseList from "./components/expense-list";
import JournalList from "./components/journal-list";
import ReportsPage from "./reports/page";

// ── Tab type ──────────────────────────────────────────────────
type Tab = "overview" | "accounts" | "expenses" | "journal" | "reports";

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
  children,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-start gap-4">
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon size={20} className="text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>

        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}

        {children}
      </div>
    </div>
  );
}

// ── Account type badge ────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  asset: "bg-sky-100 text-sky-700",
  liability: "bg-rose-100 text-rose-700",
  equity: "bg-purple-100 text-purple-700",
  income: "bg-green-100 text-green-700",
  expense: "bg-orange-100 text-orange-700",
};

// ── Overview Tab ──────────────────────────────────────────────
function OverviewTab() {
  const { data: dash, isLoading } = useQuery({
    queryKey: ["accounts-dashboard"],
    queryFn: () => getAccountsDashboard().then((r) => r.data.data),
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts-list"],
    queryFn: () => getAllAccounts().then((r) => r.data.data),
  });

  const fmt = (n: number) => `Rs ${(n || 0).toLocaleString("en-PK")}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-yellow-500" />
      </div>
    );
  }

  // Group accounts by type for balance summary
  const grouped = (accounts || []).reduce((acc: any, a: any) => {
    if (!acc[a.type]) acc[a.type] = { total: 0, count: 0 };
    acc[a.type].total += a.currentBalance;
    acc[a.type].count += 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Income"
          value={fmt(dash?.totalIncome)}
          icon={TrendingUp}
          color="bg-green-500"
        >
          <div className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between text-sm text-gray-500">
              <span className="font-semibold">Gross</span>
              <span className="font-semibold text-green-600">
                {fmt(dash?.grossIncome)}
              </span>
            </div>

            <div className="flex justify-between text-sm text-gray-500">
              <span className="font-semibold">Discount</span>
              <span className="font-semibold text-red-500">
                - {fmt(dash?.discounts)}
              </span>
            </div>
          </div>
        </KpiCard>

        <KpiCard
          label="Discounts"
          value={fmt(dash?.discounts)}
          icon={TrendingDown}
          color="bg-yellow-500"
        />

        {/* <KpiCard
          label="Net Income"
          value={fmt(dash?.totalIncome)}
          icon={DollarSign}
          color="bg-emerald-500"
        /> */}

        <KpiCard
          label="Total Expenses"
          value={fmt(dash?.totalExpenses)}
          icon={Receipt}
          color="bg-red-500"
        />

        <KpiCard
          label="Net Profit"
          value={fmt(dash?.netProfit)}
          icon={TrendingUp}
          color={dash?.netProfit >= 0 ? "bg-teal-500" : "bg-orange-500"}
          sub={dash?.netProfit >= 0 ? "Profit" : "Loss"}
        />

        {/* <KpiCard
          label="Total Assets"
          value={fmt(dash?.totalAssets)}
          icon={Landmark}
          color="bg-blue-500"
        /> */}
      </div>

      {/* Pending expenses alert */}
      {dash?.pendingExpenses?.count > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt size={18} className="text-yellow-600" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">
                {dash.pendingExpenses.count} expense{dash.pendingExpenses.count > 1 ? "s" : ""} pending approval
              </p>
              <p className="text-xs text-yellow-600">
                Total: {fmt(dash.pendingExpenses.amount)}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-yellow-500" />
        </div>
      )}

      {/* Accounts Balance Summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen size={16} className="text-yellow-500" />
          Account Balances by Type
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {["asset", "liability", "equity", "income", "expense"].map((type) => (
            <div key={type} className="text-center p-3 rounded-lg bg-gray-50">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[type]}`}>
                {type}
              </span>
              <p className="text-base font-bold text-gray-800 mt-2">
                {fmt(grouped[type]?.total || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {grouped[type]?.count || 0} accounts
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* This month journal entries */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">This Month</h3>
        </div>
        <p className="text-3xl font-bold text-gray-800 mt-3">
          {dash?.monthlyJournalEntries || 0}
        </p>
        <p className="text-sm text-gray-400 mt-1">Journal entries posted</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const queryClient = useQueryClient();

  const { mutate: seed, isPending: seeding } = useMutation({
    mutationFn: seedAccounts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-list"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-dashboard"] });
      alert("Default accounts seeded successfully!");
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Seed failed");
    },
  });

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: DollarSign },
    { key: "accounts", label: "Accounts", icon: BookOpen },
    { key: "expenses", label: "Expenses", icon: Receipt },
    { key: "journal", label: "Journal", icon: TrendingUp },
    { key: "reports", label: "Reports", icon: NotepadText },
  ];

  return (
    <>
      <PageHeader
        title="Accounts"
        subtitle="Chart of accounts, journal entries & expenses"
        titleIcon={<Landmark size={24} />}
        actions={
          <button
            onClick={() => seed()}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            {seeding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Seed Accounts
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === key
              ? "bg-white text-gray-800 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "accounts" && <AccountsList />}
      {activeTab === "expenses" && <ExpenseList />}
      {activeTab === "journal" && <JournalList />}
      {activeTab === "reports" && <ReportsPage />}
    </>
  );
}