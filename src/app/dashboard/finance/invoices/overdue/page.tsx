"use client";
import { useQuery } from "@tanstack/react-query";
import { getOverdueInvoices } from "@/utils/api";
import PageHeader from "@/app/component/dashboard/page-header";
import DynamicTable from "@/app/component/dashboard/dynamic-table";
import { AlertCircle } from "lucide-react";
import ExportButton from "@/app/component/ui/export-button";

export function OverdueInvoicesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["invoices-overdue"],
    queryFn: () => getOverdueInvoices().then((r) => r.data),
  });

  const daysOverdue = (dueDate: string) => {
    const diff = Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff} days overdue` : "Due today";
  };

  return (
    <>
      <PageHeader
        title="Overdue Invoices"
        subtitle="Invoices past their due date"
        titleIcon={<AlertCircle size={24} />}
        totalCount={data?.count ?? 0}
        exportBtn={
          <ExportButton
            filename="invoices-overdue"
            label="Export Excel"
            fetchData={async () => {
              const res = await getOverdueInvoices();
              return res.data.data;
            }}
            columns={[
              { header: "Invoice #", key: "invoiceNumber" },
              { header: "Student", key: "user.name" },
              { header: "Email", key: "user.email" },
              { header: "Phone", key: "user.phone" },
              { header: "Program", key: "enrollment.program.name" },
              { header: "Total (Rs)", key: "totalAmount", format: (v) => Number(v || 0).toLocaleString() },
              { header: "Paid (Rs)", key: "paidAmount", format: (v) => Number(v || 0).toLocaleString() },
              { header: "Remaining (Rs)", key: "remainingAmount", format: (v) => Number(v || 0).toLocaleString() },
              { header: "Status", key: "status" },
              { header: "Due Date", key: "dueDate", format: (v) => v ? new Date(v).toLocaleDateString("en-PK") : "—" },
            ]}
          />
        } />
      <DynamicTable
        data={data?.data || []}
        isLoading={isLoading}
        isError={isError}
        currentPage={data?.meta?.page || 1}
        pageSize={data?.meta?.limit || 10}
        columns={[
          { key: "user", label: "Student", render: (inv) => <div><p className="font-medium text-gray-800">{inv.user?.name || "—"}</p><p className="text-xs text-gray-400">{inv.user?.phone || inv.user?.email}</p></div> },
          { key: "totalAmount", label: "Total", render: (inv) => <span>Rs {(inv.totalAmount || 0).toLocaleString()}</span> },
          { key: "remainingAmount", label: "Remaining", render: (inv) => <span className="text-rose-600 font-bold">Rs {(inv.remainingAmount || 0).toLocaleString()}</span> },
          { key: "dueDate", label: "Due Date", render: (inv) => <div><p className="text-rose-500 font-medium text-sm">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</p><p className="text-xs text-rose-300">{inv.dueDate ? daysOverdue(inv.dueDate) : ""}</p></div> },
          { key: "status", label: "Status", render: (inv) => <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">{inv.status}</span> },
        ]}
        actions={[]}
      />
    </>
  );
}

export default OverdueInvoicesPage;