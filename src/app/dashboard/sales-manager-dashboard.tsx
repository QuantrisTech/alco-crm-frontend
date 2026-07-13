"use client";

import { Users, TrendingUp, BookOpen, GraduationCap, UserCog, Wallet, AlertCircle, FileText , Headphones } from "lucide-react";
import { StatCard, StatCarduser } from "../component/dashboard/stat-card";
import PageHeader from "../component/dashboard/page-header";
import LeadPipeline from "../component/dashboard/lead-pipeline";
import QuickStats from "../component/dashboard/quick-stats";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  adminGetAllUsers, adminGetPrograms,
  getLeadsStats, getAllEnrollments,
  getRevenueReport, getPendingReport, getOverdueInvoices,
  getUpcomingDues,
  getMonthlyCollections,
  getAllUsersForRole,
} from "@/utils/api";
import Link from "next/link";
import { adminGetAudioAccessRequests } from "@/utils/api";

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

export default function SalesManagerDashboard() {
  const router = useRouter();

  // ── Queries ──
  const { data: roleUsersData } = useQuery({
    queryKey: ["dashboard-role-users"],
    queryFn: () => getAllUsersForRole().then(r => r.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ["dashboard-users"],
    queryFn: () => adminGetAllUsers().then(r => r.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ["dashboard-lead-stats"],
    queryFn: () => getLeadsStats().then(r => r.data.data),
  });

  const { data: programsData } = useQuery({
    queryKey: ["dashboard-programs"],
    queryFn: () => adminGetPrograms({ limit: 1 }).then(r => r.data),
  });

  const { data: enrollmentsData } = useQuery({
    queryKey: ["dashboard-enrollments"],
    queryFn: () => getAllEnrollments({ limit: 1 }).then(r => r.data),
  });

  const { data: revenueData } = useQuery({
    queryKey: ["dashboard-revenue"],
    queryFn: () => getRevenueReport().then(r => r.data.data),
  });

  const { data: pendingData } = useQuery({
    queryKey: ["dashboard-pending"],
    queryFn: () => getPendingReport().then(r => r.data.data),
  });

  const { data: overdueData } = useQuery({
    queryKey: ["dashboard-overdue"],
    queryFn: () => getOverdueInvoices().then(r => r.data),
  });

  const { data: upcoming } = useQuery({
    queryKey: ["finance-upcoming"],
    queryFn: () => getUpcomingDues(30).then((r) => r.data),
  });

  const { data: monthly } = useQuery({
    queryKey: ["finance-monthly"],
    queryFn: () => getMonthlyCollections().then((r) => r.data.data), // r.data.data = { year, data: [] }
  });

  const { data: audioAccessData } = useQuery({
    queryKey: ["dashboard-audio-access"],
    queryFn: () => adminGetAudioAccessRequests({ status: "pending" }).then(r => r.data),
  });

  // ── Pipeline ──
  const pipelineData = [
    { label: "New", count: statsData?.new || 0, color: "bg-sky-500" },
    { label: "Contacted", count: statsData?.contacted || 0, color: "bg-yellow-400" },
    { label: "Qualified", count: statsData?.qualified || 0, color: "bg-indigo-500" },
    { label: "Interested", count: statsData?.interested || 0, color: "bg-orange-400" },
    { label: "Converted", count: statsData?.converted || 0, color: "bg-teal-500" },
    { label: "Lost", count: statsData?.lost || 0, color: "bg-rose-400" },
  ];

  // ── Quick Stats ──
  const quickStatsData = [
    { label: "Conversion Rate", value: `${statsData?.conversionRate || 0}%`, color: "text-teal-600" },
    { label: "Hot Leads", value: `${statsData?.hot || 0}`, color: "text-red-500" },
    { label: "Pending Invoices", value: `${pendingData?.count || 0}`, color: "text-yellow-600" },
    { label: "Overdue", value: `${overdueData?.count || 0}`, color: "text-rose-500" },
  ];

  const fmt = (n: number) => `Rs ${(n || 0).toLocaleString()}`;

  // ── Stats cards ──
  const stats = [
    {
      title: "Total Users",
      value: roleUsersData?.users?.filter((u: any) => u.role === "user").length?.toString() || "0",
      change: "Registered users",
      icon: Users,
      bg: "bg-gray-800",
      text: "text-white",
      onClick: () => router.push("/dashboard/users"),
    },
    {
      title: "Total Leads",
      value: statsData?.total?.toString() || "0",
      change: `${statsData?.new || 0} new`,
      icon: TrendingUp,
      bg: "bg-yellow-400",
      text: "text-gray-900",
      onClick: () => router.push("/dashboard/leads"),
    },
    {
      title: "Total Programs",
      value: programsData?.meta?.total?.toString() || "0",
      change: "Active programs",
      icon: BookOpen,
      bg: "bg-indigo-600",
      text: "text-white",
      onClick: () => router.push("/dashboard/programs"),
    },
    {
      title: "Total Enrollments",
      value: enrollmentsData?.meta?.total?.toString() || "0",
      change: "All time",
      icon: GraduationCap,
      bg: "bg-teal-500",
      text: "text-white",
      onClick: () => router.push("/dashboard/enrollments"),
    },
    // {
    //   title: "Total Revenue",
    //   value: fmt(revenueData?.summary?.totalRevenue),
    //   change: `Collected: ${fmt(revenueData?.summary?.totalCollected)}`,
    //   icon: Wallet,
    //   bg: "bg-green-600",
    //   text: "text-white",
    //   onClick: () => router.push("/dashboard/finance"),
    // },
    // {
    //   title: "Overdue Invoices",
    //   value: overdueData?.count?.toString() || "0",
    //   change: `Pending: ${pendingData?.count || 0}`,
    //   icon: AlertCircle,
    //   bg: "bg-rose-500",
    //   text: "text-white",
    //   onClick: () => router.push("/dashboard/finance/invoices/overdue"),
    // }, 
    {
      title: "Audio Access Requests",
      value: audioAccessData?.data?.length?.toString() || "0",
      change: "Pending review",
      icon: Headphones,
      bg: "bg-rose-500",
      text: "text-white",
      onClick: () => router.push("/dashboard/audio-access"),
    },
  ];

  const statsFinance = [
    {
      title: "Total Revenue",
      value: fmt(revenueData?.summary?.totalRevenue),
      sub: `Collected: ${fmt(revenueData?.summary?.totalCollected)}`,
      icon: Wallet,
      iconBg: "#EEEDFE",
      iconColor: "#534AB7",
      onClick: () => router.push("/dashboard/finance"),
    },
    {
      title: "Overdue Invoices",
      value: overdueData?.count?.toString() || "0",
      sub: `Pending: ${pendingData?.count || 0}`,
      icon: AlertCircle,
      iconBg: "#FAEEDA",
      iconColor: "#854F0B",
      onClick: () => router.push("/dashboard/finance/invoices/overdue"),
    },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <PageHeader
        title="Sales Manager Dashboard"
        subtitle="Overview of platform performance and user activity"
        titleIcon={<UserCog size={24} />}
      />

      {/* Stats — 6 cards, 3 per row */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Pipeline + Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <LeadPipeline data={pipelineData} />
          <div className="my-4">
            {monthly && <MonthlyBar data={monthly.data || monthly} />}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mt-4">
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
        </div>
        <div className="flex flex-col gap-4">
          <QuickStats data={quickStatsData} />
          {statsFinance.map((stat) => (
            <StatCarduser key={stat.title} {...stat} />
          ))}
        </div>
      </div>

    </div>
  );
}