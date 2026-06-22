// "use client";
// import {
//   Users, TrendingUp, DollarSign, Award,
// } from "lucide-react";
// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
// } from "recharts";

// const stats = [
//   { title: "Total Leads", value: "284", change: "+22.5% from last month", icon: Users, bg: "bg-gray-800", text: "text-white" },
//   { title: "Active Students", value: "142", change: "+18% from last month", icon: TrendingUp, bg: "bg-yellow-400", text: "text-gray-900" },
//   { title: "Monthly Revenue", value: "$48,350", change: "+12% from last month", icon: DollarSign, bg: "bg-blue-600", text: "text-white" },
//   { title: "Pending Certifications", value: "18", change: "-5.1% from last month", icon: Award, bg: "bg-white", text: "text-gray-900" },
// ];

// const pipeline = [
//   { label: "New Leads", count: 45, color: "bg-gray-800" },
//   { label: "Contacted", count: 32, color: "bg-yellow-400" },
//   { label: "Qualified", count: 25, color: "bg-yellow-400" },
//   { label: "Enrolled", count: 21, color: "bg-yellow-400" },
// ];

// const sessions = [
//   { student: "Sarah Mitchell", program: "NLP Certification", date: "Mar 3, 2025 at 2:00 PM", status: "scheduled" },
//   { student: "Michael Chen", program: "Timeline Therapy", date: "Mar 3, 2025 at 10:00 AM", status: "scheduled" },
//   { student: "Emma Rodriguez", program: "Transformational Coaching", date: "Mar 4, 2025 at 3:00 PM", status: "scheduled" },
//   { student: "James Wilson", program: "NLP Certification", date: "Mar 4, 2025 at 11:00 AM", status: "scheduled" },
//   { student: "Lisa Anderson", program: "Timeline Therapy", date: "Mar 5, 2025 at 1:00 PM", status: "scheduled" },
// ];

// const payments = [
//   { student: "Sarah Mitchell", amount: "$2,500", date: "Feb 28, 2026", status: "paid" },
//   { student: "Michael Chen", amount: "$3,200", date: "Feb 27, 2026", status: "paid" },
//   { student: "Emma Rodriguez", amount: "$2,500", date: "Feb 26, 2026", status: "pending" },
//   { student: "James Wilson", amount: "$2,500", date: "Feb 25, 2026", status: "paid" },
//   { student: "Lisa Anderson", amount: "$3,000", date: "Feb 24, 2026", status: "failed" },
// ];

// const chartData = [
//   { month: "Jan", revenue: 30000 },
//   { month: "Feb", revenue: 38000 },
//   { month: "Mar", revenue: 48350 },
//   { month: "Apr", revenue: 42000 },
//   { month: "May", revenue: 51000 },
//   { month: "Jun", revenue: 47000 },
// ];

// const statusColor = (status: string) => {
//   switch (status) {
//     case "paid": return "text-green-600 bg-green-100";
//     case "pending": return "text-yellow-600 bg-yellow-100";
//     case "failed": return "text-red-600 bg-red-100";
//     case "scheduled": return "text-blue-600 bg-blue-100";
//     default: return "text-gray-600 bg-gray-100";
//   }
// };

// export default function UserDashboard() {
//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
//         <p className="text-gray-500 text-sm">Welcome back! Here&apos;s what&apos;s happening with your coaching business.</p>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-4 gap-4">
//         {stats.map((stat) => {
//           const Icon = stat.icon;
//           return (
//             <div key={stat.title} className={`${stat.bg} ${stat.text} rounded-xl p-5 shadow-sm`}>
//               <div className="flex justify-between items-start">
//                 <p className="text-sm opacity-80">{stat.title}</p>
//                 <Icon size={18} className="opacity-70" />
//               </div>
//               <p className="text-3xl font-bold mt-2">{stat.value}</p>
//               <p className="text-xs opacity-70 mt-1">{stat.change}</p>
//             </div>
//           );
//         })}
//       </div>

//       {/* Lead Pipeline + Quick Stats */}
//       <div className="grid grid-cols-3 gap-4">
//         <div className="col-span-2 bg-white rounded-xl p-5 shadow-sm">
//           <h2 className="font-semibold text-gray-800">Lead Pipeline</h2>
//           <p className="text-gray-400 text-xs mb-4">Current status of your leads</p>
//           <div className="space-y-3">
//             {pipeline.map((item) => (
//               <div key={item.label}>
//                 <div className="flex justify-between text-sm mb-1">
//                   <span className="text-gray-600">{item.label}</span>
//                   <span className="text-gray-500">{item.count} leads</span>
//                 </div>
//                 <div className="w-full bg-gray-100 rounded-full h-2">
//                   <div className={`${item.color} h-2 rounded-full`} style={{ width: `${(item.count / 45) * 100}%` }}></div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className="bg-white rounded-xl p-5 shadow-sm space-y-3">
//           <h2 className="font-semibold text-gray-800">Quick Stats</h2>
//           <p className="text-gray-400 text-xs">Key metrics at a glance</p>
//           <div className="bg-gray-50 rounded-lg p-3">
//             <p className="text-xs text-gray-500">Conversion Rate</p>
//             <p className="text-xl font-bold text-green-600">32%</p>
//           </div>
//           <div className="bg-gray-50 rounded-lg p-3">
//             <p className="text-xs text-gray-500">Avg. Deal Size</p>
//             <p className="text-xl font-bold text-blue-600">$2,780</p>
//           </div>
//           <div className="bg-gray-50 rounded-lg p-3">
//             <p className="text-xs text-gray-500">Active Programs</p>
//             <p className="text-xl font-bold text-indigo-600">8</p>
//           </div>
//         </div>
//       </div>

//       {/* Chart */}
//       <div className="bg-white rounded-xl p-5 shadow-sm">
//         <h2 className="font-semibold text-gray-800 mb-4">Revenue Overview</h2>
//         <ResponsiveContainer width="100%" height={200}>
//           <BarChart data={chartData}>
//             <XAxis dataKey="month" tick={{ fontSize: 12 }} />
//             <YAxis tick={{ fontSize: 12 }} />
//             <Tooltip />
//             <Bar dataKey="revenue" fill="#FACC15" radius={[4, 4, 0, 0]} />
//           </BarChart>
//         </ResponsiveContainer>
//       </div>

//       {/* Sessions */}
//       <div className="bg-white rounded-xl p-5 shadow-sm">
//         <h2 className="font-semibold text-gray-800">Upcoming Sessions</h2>
//         <p className="text-gray-400 text-xs mb-4">Next 5 scheduled training sessions</p>
//         <table className="w-full text-sm">
//           <thead>
//             <tr className="text-gray-400 text-left border-b">
//               <th className="pb-2">Student</th>
//               <th className="pb-2">Program</th>
//               <th className="pb-2">Date & Time</th>
//               <th className="pb-2">Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {sessions.map((s, i) => (
//               <tr key={i} className="border-b last:border-0">
//                 <td className="py-2 text-gray-700">{s.student}</td>
//                 <td className="py-2 text-gray-500">{s.program}</td>
//                 <td className="py-2 text-gray-500">{s.date}</td>
//                 <td className="py-2">
//                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(s.status)}`}>{s.status}</span>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Payments */}
//       <div className="bg-white rounded-xl p-5 shadow-sm">
//         <h2 className="font-semibold text-gray-800">Recent Payments</h2>
//         <p className="text-gray-400 text-xs mb-4">Latest payment transactions</p>
//         <table className="w-full text-sm">
//           <thead>
//             <tr className="text-gray-400 text-left border-b">
//               <th className="pb-2">Student</th>
//               <th className="pb-2">Amount</th>
//               <th className="pb-2">Date</th>
//               <th className="pb-2">Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {payments.map((p, i) => (
//               <tr key={i} className="border-b last:border-0">
//                 <td className="py-2 text-gray-700">{p.student}</td>
//                 <td className="py-2 text-gray-700 font-medium">{p.amount}</td>
//                 <td className="py-2 text-gray-500">{p.date}</td>
//                 <td className="py-2">
//                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
"use client";

import { BookOpen, CreditCard, DollarSign, TrendingUp, UserCog, AlertCircle, Lock } from "lucide-react";
import { StatCarduser } from "../component/dashboard/stat-card";
import PageHeader from "../component/dashboard/page-header";
import { useAppSelector } from "@/store/hooks";
import { useQuery } from "@tanstack/react-query";
import { getMyEnrollments, getMyInvoices } from "@/utils/api";

// ── Types ────────────────────────────────────────────────────────
interface Enrollment {
  _id: string;
  status: string;
  accessStatus: "ACTIVE" | "RESTRICTED";
  program?: { name: string };
  batch?: { name: string };
}

interface Installment {
  _id: string;
  label: string;
  amount: number;
  paidAmount?: number;
  status: "PENDING" | "PAID";
  dueDate: string | null;
  isAdvance: boolean;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
  dueDate: string;
  installments: Installment[];
  enrollment?: {
    _id: string;
    program?: { name: string };
    batch?: { name: string };
  };
}

// ── Helpers ──────────────────────────────────────────────────────
const formatAmount = (n: number) =>
  `Rs ${Number(n || 0).toLocaleString("en-PK")}`;

const formatDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ── Access Guard ─────────────────────────────────────────────────
function RestrictedCard() {
  return (
    <div className="col-span-2 sm:col-span-2 lg:col-span-4 flex flex-col items-center justify-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
        <Lock size={22} className="text-amber-600" />
      </div>
      <p className="font-semibold text-amber-800 text-base">Enrollment Restricted</p>
      <p className="text-sm text-amber-700 max-w-sm">
        Your portal access is restricted. Please complete your advance payment to activate your enrollment and view course details.
      </p>
    </div>
  );
}

// ── Single Payment Schedule Card (reusable per invoice) ──────────
function PaymentScheduleCard({ invoice }: { invoice: Invoice }) {
  if (!invoice.installments || invoice.installments.length === 0) return null;

  const programName = invoice.enrollment?.program?.name;
  const batchName = invoice.enrollment?.batch?.name;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">
            Payment Schedule
            {programName ? ` — ${programName}` : ""}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {invoice.invoiceNumber}
            {batchName ? ` · ${batchName}` : ""} &nbsp;·&nbsp; Total:{" "}
            {formatAmount(invoice.totalAmount)}
          </p>
        </div>
        <span
          className={`self-start sm:self-auto text-xs font-semibold px-3 py-1 rounded-full ${
            invoice.status === "PAID"
              ? "bg-green-100 text-green-700"
              : invoice.status === "PARTIAL"
                ? "bg-yellow-100 text-yellow-700"
                : invoice.status === "OVERDUE"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-sky-100 text-sky-700"
          }`}
        >
          {invoice.status}
        </span>
      </div>

      {/* ── Mobile: card list ─── */}
      <div className="sm:hidden divide-y divide-gray-50">
        {invoice.installments.map((inst, idx) => (
          <div
            key={inst._id ?? idx}
            className={`px-4 py-3 flex items-start justify-between gap-3 ${
              inst.isAdvance ? "bg-amber-50/40" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-gray-400">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="font-medium text-gray-700 text-sm truncate">
                  {inst.label}
                </span>
                {inst.isAdvance && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">
                    Advance
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono mt-1">
                Due: {formatDate(inst.dueDate)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="font-semibold text-gray-800 font-mono text-xs">
                {formatAmount(inst.amount)}
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  inst.status === "PAID"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {inst.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop: table ─── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoice.installments.map((inst, idx) => (
              <tr
                key={inst._id ?? idx}
                className={`border-t border-gray-50 ${
                  inst.isAdvance ? "bg-amber-50/40" : ""
                }`}
              >
                <td className="px-5 py-3 text-xs font-mono text-gray-400">
                  {String(idx + 1).padStart(2, "0")}
                </td>
                <td className="px-5 py-3 font-medium text-gray-700">
                  {inst.label}
                  {inst.isAdvance && (
                    <span className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">
                      Advance
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                  {formatDate(inst.dueDate)}
                </td>
                <td className="px-5 py-3 font-semibold text-gray-800 font-mono text-xs">
                  {formatAmount(inst.amount)}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      inst.status === "PAID"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {inst.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals row */}
      <div className="px-4 sm:px-5 py-4 border-t border-gray-100 flex justify-end gap-6 sm:gap-8 text-sm">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-0.5">Paid</p>
          <p className="font-bold text-green-600 font-mono text-xs sm:text-sm">
            {formatAmount(invoice.paidAmount)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-0.5">Outstanding</p>
          <p className="font-bold text-rose-500 font-mono text-xs sm:text-sm">
            {formatAmount(invoice.remainingAmount)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-0.5">Total</p>
          <p className="font-bold text-gray-800 font-mono text-xs sm:text-sm">
            {formatAmount(invoice.totalAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function UserDashboard() {
  const { user: authUser } = useAppSelector((state) => state.auth);

  const {
    data: enrollData,
    isLoading: enrollLoading,
  } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => getMyEnrollments().then((r) => r.data),
  });

  const {
    data: invoiceData,
    isLoading: invoiceLoading,
  } = useQuery({
    queryKey: ["my-invoices"],
    queryFn: () => getMyInvoices().then((r) => r.data),
  });

  const isLoading = enrollLoading || invoiceLoading;

  const enrollments: Enrollment[] = enrollData?.data ?? enrollData ?? [];
  const invoices: Invoice[] = invoiceData?.data ?? invoiceData ?? [];

  const hasActiveEnrollment = enrollments.some((e) => e.accessStatus === "ACTIVE");
  const hasAnyEnrollment = enrollments.length > 0;

  // Aggregate totals across ALL invoices (not just the first one)
  const totalPaidAcrossInvoices = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalRemainingAcrossInvoices = invoices.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);
  const totalAmountAcrossInvoices = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  // Pending installments across ALL invoices
  const allPendingInstallments = invoices.flatMap(
    (inv) => inv.installments?.filter((i) => i.status === "PENDING") ?? []
  );

  // Sort pending by due date (nulls last) to find the next one due
  const nextDueInstallment = [...allPendingInstallments].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  })[0];

  // Advance check: has ANY invoice's advance been paid (or are there no advances pending)
  const advanceInstallments = invoices.flatMap(
    (inv) => inv.installments?.filter((i) => i.isAdvance) ?? []
  );
  const allAdvancesPaid =
    advanceInstallments.length === 0 || advanceInstallments.every((i) => i.status === "PAID");

  const activeEnrollments = enrollments.filter((e) => e.accessStatus === "ACTIVE").length;
  const restrictedCount = enrollments.filter((e) => e.accessStatus === "RESTRICTED").length;

  // Invoices that actually have a non-empty installment schedule worth rendering
  const invoicesWithSchedule = invoices.filter(
    (inv) => inv.installments && inv.installments.length > 0
  );

  const overallInvoiceStatus = invoices.length > 1 ? `${invoices.length} invoices` : (invoices[0]?.status ?? "N/A");

  const stats = [
    {
      title: "Enrollments",
      value: isLoading ? "..." : String(enrollments.length),
      sub: isLoading
        ? "Loading..."
        : activeEnrollments > 0
          ? `${activeEnrollments} active · ${restrictedCount} restricted`
          : hasAnyEnrollment
            ? `${restrictedCount} pending advance payment`
            : "No enrollments yet",
      icon: BookOpen,
      iconBg: "#EEEDFE",
      iconColor: "#534AB7",
    },
    {
      title: "Pending Installments",
      value: isLoading ? "..." : String(allPendingInstallments.length),
      sub: isLoading
        ? "Loading..."
        : nextDueInstallment
          ? `Next: ${nextDueInstallment.label} — ${formatDate(nextDueInstallment.dueDate)}`
          : invoices.length > 0
            ? "All installments paid"
            : "No invoice found",
      icon: CreditCard,
      iconBg: "#FAEEDA",
      iconColor: "#854F0B",
    },
    {
      title: "Paid Amount",
      value: isLoading ? "..." : formatAmount(totalPaidAcrossInvoices),
      sub: isLoading
        ? "Loading..."
        : invoices.length > 0
          ? `Outstanding: ${formatAmount(totalRemainingAcrossInvoices)}`
          : "No invoice found",
      icon: DollarSign,
      iconBg: "#E1F5EE",
      iconColor: "#0F6E56",
    },
    {
      title: "Invoice Status",
      value: isLoading ? "..." : overallInvoiceStatus,
      sub: isLoading
        ? "Loading..."
        : invoices.length > 0
          ? `Total: ${formatAmount(totalAmountAcrossInvoices)}`
          : "No invoice found",
      icon: TrendingUp,
      iconBg: "#E6F1FB",
      iconColor: "#185FA5",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <PageHeader
        title={`Welcome back, ${authUser?.name?.split(" ")[0] ?? "Student"}!`}
        subtitle="Here is your enrollment and payment summary."
        titleIcon={<UserCog size={24} />}
      />

      {/* ── Advance Payment Warning ───────────────────────────── */}
      {!isLoading && hasAnyEnrollment && !allAdvancesPaid && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <AlertCircle size={18} className="text-rose-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-700">Advance Payment Pending</p>
            <p className="text-xs text-rose-600 mt-0.5">
              One or more of your enrollments has a pending advance payment. Please
              clear it to activate full portal access.
            </p>
          </div>
        </div>
      )}

      {/* ── Stats Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {!isLoading && !hasAnyEnrollment ? (
          <div className="col-span-2 lg:col-span-4 flex flex-col items-center justify-center gap-3 bg-neutral-50 border border-dashed border-neutral-300 rounded-2xl p-8 sm:p-10 text-center">
            <BookOpen size={32} className="text-neutral-400" />
            <p className="font-semibold text-neutral-600">No Enrollments Yet</p>
            <p className="text-sm text-neutral-400">
              You are not enrolled in any program. Contact your sales manager.
            </p>
          </div>

        ) : !isLoading && hasAnyEnrollment && !hasActiveEnrollment ? (
          <>
            {stats.map((stat) => (
              <StatCarduser key={stat.title} {...stat} />
            ))}
            <RestrictedCard />
          </>

        ) : (
          stats.map((stat) => (
            <StatCarduser key={stat.title} {...stat} />
          ))
        )}

      </div>

      {/* ── Payment Schedule(s) — one card PER invoice ─────────── */}
      {!isLoading && hasActiveEnrollment && invoicesWithSchedule.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          {invoicesWithSchedule.map((invoice) => (
            <PaymentScheduleCard key={invoice._id} invoice={invoice} />
          ))}
        </div>
      )}

    </div>
  );
}