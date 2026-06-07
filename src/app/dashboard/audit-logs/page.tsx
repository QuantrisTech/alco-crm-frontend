"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllAuditLogs, getAuditLogById } from "@/utils/api";
import PageHeader, { FilterField } from "@/app/component/dashboard/page-header";
import DynamicTable from "@/app/component/dashboard/dynamic-table";
import { ScrollText, Eye, X } from "lucide-react";

const moduleColor = (module: string) => {
  const map: Record<string, string> = {
    finance: "bg-teal-100 text-teal-700",
    enrollment: "bg-indigo-100 text-indigo-700",
    access: "bg-yellow-100 text-yellow-700",
    admin: "bg-rose-100 text-rose-700",
    auth: "bg-gray-100 text-gray-600",
  };
  return map[module] || "bg-gray-100 text-gray-600";
};

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({ module: "", action: "", from: "", to: "", page: 1, limit: 20 });
  const [viewingLog, setViewingLog] = useState<any>(null);

  const filterFields: FilterField[] = [
    { type: "input", name: "action", placeholder: "Filter by action..." },
    {
      type: "select", name: "module",
      options: [
        { label: "Finance", value: "finance_manager" },
        { label: "Enrollment", value: "enrollment" },
        { label: "Access", value: "access" },
        { label: "Admin", value: "admin" },
        { label: "Auth", value: "auth" },
      ],
    },
    { type: "input", name: "from", placeholder: "From date (YYYY-MM-DD)" },
    { type: "input", name: "to", placeholder: "To date (YYYY-MM-DD)" },
  ];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => getAllAuditLogs(filters).then((r) => r.data),
  });

  return (
    <>
      <PageHeader
        title="Audit Logs"
        subtitle="All system actions — security & accountability"
        titleIcon={<ScrollText size={24} />}
        totalCount={data?.meta?.total ?? 0}
        filters={{
          module: filters.module,
          action: filters.action,
          from: filters.from,
          to: filters.to,
          page: filters.page.toString(),
          limit: filters.limit.toString(),
        }}
        setFilters={setFilters}
        filterFields={filterFields}
      />

      <DynamicTable
        data={data?.data || []}
        isLoading={isLoading}
        isError={isError}
        currentPage={data?.meta?.page || 1}
        pageSize={data?.meta?.limit || 10}
        columns={[
          {
            key: "user", label: "Performed By",
            render: (log) => (
              <div>
                <p className="font-medium text-gray-800">{log.user?.name || "System"}</p>
                <p className="text-xs text-gray-400">{log.user?.role || "—"}</p>
              </div>
            ),
          },
          {
            key: "action", label: "Action",
            render: (log) => (
              <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded font-medium">{log.action}</span>
            ),
          },
          {
            key: "module", label: "Module",
            render: (log) => (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${moduleColor(log.module)}`}>{log.module}</span>
            ),
          },
          { key: "targetId", label: "Target ID", render: (log) => <span className="font-mono text-xs text-gray-400">{log.targetId ? `${log.targetId.slice(0, 8)}...` : "—"}</span> },
          { key: "ip", label: "IP", render: (log) => <span className="text-xs text-gray-500 font-mono">{log.ip || "—"}</span> },
          {
            key: "createdAt", label: "Date & Time",
            render: (log) => (
              <div>
                <p className="text-sm text-gray-700">{new Date(log.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleTimeString()}</p>
              </div>
            ),
          },
        ]}
        actions={[
          {
            icon: <Eye size={14} />, label: "View Details",
            onClick: (log) => setViewingLog(log),
            className: "hover:bg-indigo-50 hover:text-indigo-600",
          },
        ]}
      />

      {/* Detail Drawer/Modal */}
      {viewingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Audit Log Detail</h2>
                <p className="text-sm text-gray-400 font-mono">{viewingLog.action}</p>
              </div>
              <button onClick={() => setViewingLog(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-400 text-xs mb-1">Performed By</p><p className="font-medium text-gray-800">{viewingLog.user?.name || "System"}</p></div>
                <div><p className="text-gray-400 text-xs mb-1">Role</p><p className="font-medium text-gray-800">{viewingLog.user?.role || "—"}</p></div>
                <div><p className="text-gray-400 text-xs mb-1">Module</p><p className="font-medium text-gray-800 capitalize">{viewingLog.module}</p></div>
                <div><p className="text-gray-400 text-xs mb-1">IP Address</p><p className="font-mono text-gray-800">{viewingLog.ip}</p></div>
                <div><p className="text-gray-400 text-xs mb-1">Date</p><p className="font-medium text-gray-800">{new Date(viewingLog.createdAt).toLocaleDateString()}</p></div>
                <div><p className="text-gray-400 text-xs mb-1">Time</p><p className="font-medium text-gray-800">{new Date(viewingLog.createdAt).toLocaleTimeString()}</p></div>
                <div className="col-span-2"><p className="text-gray-400 text-xs mb-1">Target ID</p><p className="font-mono text-gray-800 text-xs">{viewingLog.targetId || "—"}</p></div>
              </div>

              {viewingLog.before && (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-2">BEFORE</p>
                  <pre className="text-xs bg-rose-50 border border-rose-100 rounded-lg p-3 overflow-x-auto text-rose-800">{JSON.stringify(viewingLog.before, null, 2)}</pre>
                </div>
              )}

              {viewingLog.after && (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-2">AFTER</p>
                  <pre className="text-xs bg-green-50 border border-green-100 rounded-lg p-3 overflow-x-auto text-green-800">{JSON.stringify(viewingLog.after, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}