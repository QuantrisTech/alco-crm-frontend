"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Users, ArrowUpRight, Search, Pencil, X } from "lucide-react";
import ProtectedRoute from "@/app/component/protected-route";
import {
  getAllVisitors,
  promoteVisitorToLead,
  updateVisitor,
  getNamesPrograms,
  assignVisitor,
  unassignVisitor,
} from "@/utils/api";

// Fields the Lead model requires. Extend this if your Lead schema needs more
// than email (per the "required email field" blocker you flagged earlier).
const REQUIRED_FIELDS = ["email"] as const;

function getFieldStatus(visitor: any) {
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  if (!visitor?.email || String(visitor.email).trim() === "")
    missingRequired.push("email");
  if (
    (!visitor?.first_name || String(visitor.first_name).trim() === "") &&
    (!visitor?.last_name || String(visitor.last_name).trim() === "")
  )
    missingOptional.push("name");
  if (!visitor?.phone || String(visitor.phone).trim() === "")
    missingOptional.push("phone");
  if (
    !visitor?.program_interest ||
    String(visitor.program_interest).trim() === ""
  )
    missingOptional.push("program interest");

  return { missingRequired, missingOptional };
}

const statusBadge = (status: string) => {
  if (status === "promoted") {
    return "bg-teal-50 text-teal-600";
  }
  return "bg-gray-100 text-gray-600";
};

function EditVisitorModal({
  visitor,
  onClose,
  onSave,
  isSaving,
}: {
  visitor: any;
  onClose: () => void;
  onSave: (payload: any) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    first_name: visitor.first_name || "",
    last_name: visitor.last_name || "",
    email: visitor.email || "",
    phone: visitor.phone || "",
    program_interest: visitor.program_interest || "",
  });

  const { data: programs } = useQuery({
    queryKey: ["program-names"],
    queryFn: getNamesPrograms,
  });

  const field = (key: keyof typeof form, label: string) => (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <input
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 text-gray-900 placeholder:text-gray-400"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Edit visitor details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {field("first_name", "First name")}
        {field("last_name", "Last name")}
        {field("email", "Email")}
        {field("phone", "Phone")}

        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Program interest
          </label>
          <select
            value={form.program_interest}
            onChange={(e) =>
              setForm((f) => ({ ...f, program_interest: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 text-gray-900 bg-white"
          >
            <option value="">Select a program</option>
            {(programs || []).map((p: any) => (
              <option key={p._id || p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={isSaving}
            className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VisitorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingVisitor, setEditingVisitor] = useState<any>(null);

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

  const {
    mutate: promote,
    isPending: isPromoting,
    variables: promotingId,
  } = useMutation({
    mutationFn: (id: string) =>
      promoteVisitorToLead(id, {
        promoted_by: "admin",
        promotion_reason: "manual_admin_review",
      }),
    onSuccess: () => {
      toast.success("Visitor converted to lead! 🎉");
      queryClient.invalidateQueries({ queryKey: ["visitors"] });
    },
    // No toast on error by design — the disabled button should make this
    // unreachable. Kept as a silent invalidate so nothing gets stuck if the
    // backend rejects something the frontend check missed.
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["visitors"] });
    },
  });

  const { mutate: saveEdit, isPending: isSavingEdit } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateVisitor(id, payload),
    onSuccess: () => {
      toast.success("Visitor details updated");
      queryClient.invalidateQueries({ queryKey: ["visitors"] });
      setEditingVisitor(null);
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error || "Failed to update visitor");
    },
  });
  const {
    mutate: assign,
    isPending: isAssigning,
    variables: assigningId,
  } = useMutation({
    mutationFn: (id: string) => assignVisitor(id),
    onSuccess: () => {
      toast.success("Visitor assigned to you");
      queryClient.invalidateQueries({ queryKey: ["visitors"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error || "Failed to assign visitor");
    },
  });
  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <div>
        {/* Header — matches Users page pattern: icon+title+subtitle left, Total + search right */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-gray-700" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Visitors</h1>
              <p className="text-sm text-gray-500">
                Website chatbot conversations, not yet converted to leads
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-500 whitespace-nowrap">
              Total:{" "}
              <span className="font-semibold text-gray-800">
                {visitors.length}
              </span>
            </div>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search name, email, phone, program..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 w-64 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Program Interest</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">First Seen</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    Loading visitors...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-red-400"
                  >
                    Failed to load visitors.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && filteredVisitors.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    No visitors found.
                  </td>
                </tr>
              )}

              {filteredVisitors.map((visitor: any) => {
                const { missingRequired, missingOptional } =
                  getFieldStatus(visitor);
                const isComplete = missingRequired.length === 0;

                return (
                  <tr
                    key={visitor._id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {visitor.first_name || visitor.last_name ? (
                        `${visitor.first_name || ""} ${visitor.last_name || ""}`.trim()
                      ) : (
                        <span className="text-gray-400 font-normal">
                          Not provided
                        </span>
                      )}
                      {visitor.is_existing_student && (
                        <div className="mt-1">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-600">
                            Already Registered
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>
                        {visitor.email || (
                          <span className="text-gray-400">Not provided</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {visitor.phone || "Not provided"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {visitor.program_interest || (
                        <span className="text-gray-400">Not provided</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(visitor.status)}`}
                      >
                        {visitor.status}
</span>
</td>
                        <td className="px-4 py-3 text-gray-600">
                          {visitor.assigned_to ? (
                            <span className="text-xs font-medium text-gray-700">
                              {visitor.assigned_to.name}
                            </span>
                          ) : (
                            <button
                              onClick={() => assign(visitor.visitor_id)}
                              disabled={
                                isAssigning &&
                                assigningId === visitor.visitor_id
                              }
                              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                            >
                              {isAssigning && assigningId === visitor.visitor_id
                                ? "Claiming..."
                                : "Claim"}
                            </button>
                          )}
                        </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {visitor.createdAt
                        ? new Date(visitor.createdAt).toLocaleDateString(
                            "en-PK",
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {visitor.status === "promoted" ? (
                        <span className="text-xs text-teal-600 font-medium">
                          Converted
                        </span>
                      ) : visitor.is_existing_student ? (
                        <span className="text-xs text-blue-600 font-medium">
                          Already{" "}
                          {visitor.existing_source === "lead"
                            ? "a lead"
                            : "enrolled"}
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingVisitor(visitor)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50"
                          >
                            <Pencil size={12} />
                            Edit
                          </button>

                          <div className="flex flex-col items-end">
                            <button
                              onClick={() => promote(visitor.visitor_id)}
                              disabled={
                                !isComplete ||
                                (isPromoting &&
                                  promotingId === visitor.visitor_id)
                              }
                              title={
                                !isComplete
                                  ? `Missing: ${missingRequired.join(", ")}`
                                  : undefined
                              }
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                                isComplete
                                  ? "bg-gray-900 text-white hover:bg-gray-700"
                                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                              } disabled:opacity-50`}
                            >
                              <ArrowUpRight size={12} />
                              {isPromoting && promotingId === visitor.visitor_id
                                ? "Converting..."
                                : "Convert to Lead"}
                            </button>
                            {missingRequired.length > 0 && (
                              <span className="text-[11px] text-red-500 mt-1">
                                Required: {missingRequired.join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {editingVisitor && (
          <EditVisitorModal
            visitor={editingVisitor}
            isSaving={isSavingEdit}
            onClose={() => setEditingVisitor(null)}
            onSave={(payload) =>
              saveEdit({ id: editingVisitor.visitor_id, payload })
            }
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
