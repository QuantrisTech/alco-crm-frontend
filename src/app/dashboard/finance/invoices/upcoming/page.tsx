"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUpcomingDues } from "@/utils/api";
import PageHeader from "@/app/component/dashboard/page-header";
import DynamicTable from "@/app/component/dashboard/dynamic-table";
import { CalendarClock } from "lucide-react";
import ExportButton from "@/app/component/ui/export-button";

export default function UpcomingDuesPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["invoices-upcoming", days],
    queryFn: () => getUpcomingDues(days).then((r) => r.data),
  });

  return (
    <>
      <PageHeader
        title="Upcoming Dues"
        subtitle={`Invoices due in next ${days} days`}
        titleIcon={<CalendarClock size={24} />}
        totalCount={data?.count ?? 0}
        exportBtn={
          <ExportButton
            filename="invoices-upcoming"
            label="Export Excel"
            fetchData={async () => {
              const res = await getUpcomingDues(30);
              return res.data.data;
            }}
            columns={[
              { header: "Invoice #", key: "invoiceNumber" },
              { header: "Student", key: "user.name" },
              { header: "Email", key: "user.email" },
              { header: "Phone", key: "user.phone" },
              { header: "Program", key: "enrollment.program.name" },
              { header: "Total (Rs)", key: "totalAmount", format: (v) => Number(v || 0).toLocaleString() },
              { header: "Remaining (Rs)", key: "remainingAmount", format: (v) => Number(v || 0).toLocaleString() },
              { header: "Due Date", key: "dueDate", format: (v) => v ? new Date(v).toLocaleDateString("en-PK") : "—" },
            ]}
          />
        } />
      <div className="flex gap-2 mb-4">
        {[7, 15, 30, 60].map((d) => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${days === d ? "bg-yellow-400 text-gray-900" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {d} days
          </button>
        ))}
      </div>
      <DynamicTable
        data={data?.data || []}
        isLoading={isLoading}
        isError={isError}
        currentPage={data?.meta?.page || 1}
        pageSize={data?.meta?.limit || 10}
        columns={[
          { key: "user", label: "Student", render: (inv) => <div><p className="font-medium text-gray-800">{inv.user?.name || "—"}</p><p className="text-xs text-gray-400">{inv.user?.email}</p></div> },
          { key: "remainingAmount", label: "Remaining", render: (inv) => <span className="font-bold text-gray-800">Rs {(inv.remainingAmount || 0).toLocaleString()}</span> },
          { key: "dueDate", label: "Due Date", render: (inv) => <span className="text-yellow-600 font-medium text-sm">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</span> },
          { key: "status", label: "Status", render: (inv) => <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700">{inv.status}</span> },
        ]}
        actions={[]}
      />
    </>
  );
}