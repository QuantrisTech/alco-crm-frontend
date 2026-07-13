"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllVisitors, promoteVisitorToLead } from "@/utils/api";
import toast from "react-hot-toast";
import { Users, ArrowUpRight, Search } from "lucide-react";
import ProtectedRoute from "@/app/component/protected-route";

const statusBadge = (status: string) => {
  if (status === "promoted") {
    return "bg-teal-50 text-teal-600";
  }
  return "bg-gray-100 text-gray-600";
};

export default function VisitorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["visitors"],
    queryFn: () => getAllVisitors().then((r) => r.data),
  });

  const visitors = data?.data || [];

  const filteredVisitors = visitors.filter((v: any) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      v.first_name?.toLowerCase().includes(term) ||
      v.last_name?.toLowerCase().includes(term) ||
      v.email?.toLowerCase().includes(term) ||
      v.phone?.toLowerCase().includes(term) ||
      v.program_interest?.toLowerCase().includes(term)
    );
  });

  const { mutate: promote, isPending: isPromoting, variables: promotingId } = useMutation({
    mutationFn: (id: string) =>
      promoteVisitorToLead(id, { promoted_by: "admin", promotion_reason: "manual_admin_review" }),
    onSuccess: () => {
      toast.success("Visitor converted to lead! 🎉");
      queryClient.invalidateQueries({ queryKey: ["visitors"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error || "Failed to convert visitor");
    },
  });

  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-gray-700" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Visitors</h1>
              <p className="text-sm text-gray-500">
                Website chatbot conversations, not yet converted to leads
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Total: <span className="font-semibold text-gray-800">{visitors.length}</span>
          </div>
        </div>

        <div className="relative mb-5 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, phone, program..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Program Interest</th>
                {/* <th className="px-4 py-3">Source</th> */}
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">First Seen</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    Loading visitors...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-red-400">
                    Failed to load visitors.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && filteredVisitors.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    No visitors found.
                  </td>
                </tr>
              )}

              {filteredVisitors.map((visitor: any) => (
                <tr key={visitor._id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {visitor.first_name || visitor.last_name
                      ? `${visitor.first_name || ""} ${visitor.last_name || ""}`.trim()
                      : <span className="text-gray-400 font-normal">Not provided</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{visitor.email || <span className="text-gray-400">Not provided</span>}</div>
                    <div className="text-xs text-gray-400">{visitor.phone || "Not provided"}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {visitor.program_interest || <span className="text-gray-400">Not provided</span>}
                  </td>
                  {/* <td className="px-4 py-3 text-gray-600 capitalize">{visitor.source || "—"}</td> */}
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(visitor.status)}`}>
                      {visitor.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {visitor.createdAt ? new Date(visitor.createdAt).toLocaleDateString("en-PK") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {visitor.status === "promoted" ? (
                      <span className="text-xs text-teal-600 font-medium">Converted</span>
                    ) : (
                      <button
                        onClick={() => promote(visitor.visitor_id)}
                        disabled={isPromoting && promotingId === visitor.visitor_id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 disabled:opacity-50"
                      >
                        <ArrowUpRight size={12} />
                        {isPromoting && promotingId === visitor.visitor_id ? "Converting..." : "Convert to Lead"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}