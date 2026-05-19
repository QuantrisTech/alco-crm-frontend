"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getRevenueReport, getMonthlyCollections, getPendingReport, getOverdueInvoices, getUpcomingDues, sendReceivingInvoiceEmail, getAllInvoices } from "@/utils/api";
import { Wallet, TrendingUp, AlertCircle, Clock, CheckCircle, FileText, Send } from "lucide-react";
import InvoiceReceivingList from "./component/invoice-receiving-list";
import PageHeader from "@/app/component/dashboard/page-header";

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, href }: any) {
  const card = (
    <div className={`bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow ${href ? "cursor-pointer" : ""}`}>
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

// ── Bar Chart (CSS only) ───────────────────────────────────────
function MonthlyBar({ data }: { data: any[] }) {
  const max = Math.max(...data.map((d) => d.totalCollected), 1);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-4">Monthly Collections</h3>
      <div className="flex items-end gap-2 h-36">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-gray-400 font-medium">
              {d.totalCollected > 0 ? `${(d.totalCollected / 1000).toFixed(0)}k` : ""}
            </span>
            <div
              className="w-full bg-yellow-400 rounded-t-sm transition-all duration-500"
              style={{ height: `${Math.max((d.totalCollected / max) * 100, d.totalCollected > 0 ? 4 : 2)}%`, minHeight: "2px" }}
              title={`${months[i]}: Rs ${d.totalCollected.toLocaleString()}`}
            />
            <span className="text-[9px] text-gray-400">{months[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FinanceOverview() {

  const { data: revenue } = useQuery({
    queryKey: ["finance-revenue"],
    queryFn: () => getRevenueReport().then((r) => r.data.data),
  });

  const { data: monthly } = useQuery({
    queryKey: ["finance-monthly"],
    queryFn: () => getMonthlyCollections().then((r) => r.data.data), // r.data.data = { year, data: [] }
  });

  const { data: pending } = useQuery({
    queryKey: ["finance-pending-report"],
    queryFn: () => getPendingReport().then((r) => r.data.data),
  });

  const { data: overdue } = useQuery({
    queryKey: ["finance-overdue"],
    queryFn: () => getOverdueInvoices().then((r) => r.data),
  });

  const { data: upcoming } = useQuery({
    queryKey: ["finance-upcoming"],
    queryFn: () => getUpcomingDues(30).then((r) => r.data),
  });

  const fmt = (n: number) => `Rs ${(n || 0).toLocaleString()}`;

  return (
    <>
      <PageHeader
        title="Finance Overview"
        subtitle="Revenue, collections & outstanding payments"
        titleIcon={<Wallet size={24} />}
        totalCount={revenue?.summary?.totalInvoices ?? 0}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={fmt(revenue?.summary?.totalRevenue)} icon={TrendingUp} color="bg-teal-500" />
        <StatCard label="Total Collected" value={fmt(revenue?.summary?.totalCollected)} icon={CheckCircle} color="bg-green-500" />
        <StatCard label="Pending / Outstanding" value={fmt(pending?.totalOutstanding)} sub={`${pending?.count || 0} invoices`} icon={Clock} color="bg-yellow-500" href="/dashboard/finance/invoices/pending" />
        <StatCard label="Overdue" value={overdue?.count ?? 0} sub="invoices overdue" icon={AlertCircle} color="bg-rose-500" href="/dashboard/finance/invoices/overdue" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          {monthly && <MonthlyBar data={monthly.data || monthly} />}
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Invoice Status</h3>
          <div className="space-y-3">
            {(revenue?.byStatus || []).map((s: any) => (
              <div key={s._id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusDot(s._id)}`} />
                  <span className="text-sm text-gray-600 capitalize">{s._id}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-800">{s.count}</span>
                  <span className="text-xs text-gray-400 ml-2">Rs {(s.amount || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Dues */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileText size={16} className="text-yellow-500" />
            Upcoming Dues (Next 30 Days)
          </h3>
          <Link href="/dashboard/finance/invoices/upcoming" className="text-xs text-yellow-600 hover:underline font-medium">View All</Link>
        </div>

        {upcoming?.data?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No upcoming dues</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {(upcoming?.data || []).slice(0, 5).map((inv: any) => (
              <div key={inv._id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{inv.user?.name || "—"}</p>
                  <p className="text-xs text-gray-400">{inv.user?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">Rs {(inv.remainingAmount || 0).toLocaleString()}</p>
                  <p className="text-xs text-rose-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Send size={16} className="text-yellow-500" />
          Receiving Invoices
        </h3>
        <InvoiceReceivingList />
      </div>


    </>
  );
}

function statusDot(status: string) {
  const map: Record<string, string> = {
    PAID: "bg-green-500",
    PARTIAL: "bg-yellow-400",
    PENDING: "bg-sky-400",
    OVERDUE: "bg-rose-500",
    BLOCKED: "bg-gray-500",
    EXTENDED: "bg-indigo-400",
    WARNING: "bg-orange-400",
  };
  return map[status] || "bg-gray-300";
}