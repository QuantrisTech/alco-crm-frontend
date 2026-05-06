"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllLeads, createLead, updateLead,
  addActivityLead, getActivitiesLead,
  getNamesPrograms,
} from "@/utils/api";
import PageHeader from "@/app/component/dashboard/page-header";
import toast from "react-hot-toast";
import { Users, Pencil, Activity, LayoutGrid, List } from "lucide-react";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import DynamicTable from "@/app/component/dashboard/dynamic-table";
import LeadsModals from "../shared/leads-modals";
import { simpleAddLeadFields, editLeadFieldsReadonly } from "../shared/fields";
import { statusColor, leadFilterFields, defaultLeadFilters } from "../shared/constants";
import { useAppSelector } from "@/store/hooks";
import KanbanBoard from "./kanban-board";

export default function SalesRepLeads() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAppSelector((state) => state.auth);

  const [activeView, setActiveView] = useState<"opportunities" | "list">("opportunities");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [activityLead, setActivityLead] = useState<any>(null);
  const [viewActivities, setViewActivities] = useState<any>(null);
  const [filters, setFilters] = useState(defaultLeadFilters);

  // ── Queries ──────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sales-leads", filters],
    queryFn: () => getAllLeads({ ...filters, assigned_to: authUser._id }).then((r) => r.data),
  });

  const { data: programs } = useQuery({
    queryKey: ["program-names"],
    queryFn: getNamesPrograms,
  });

  const { data: activitiesData, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["lead-activities", viewActivities?._id],
    queryFn: () => getActivitiesLead(viewActivities._id).then((r) => r.data),
    enabled: !!viewActivities,
  });

  const programMap = Object.fromEntries((programs || []).map((p: any) => [p._id, p.name]));

  // ── Mutations ────────────────────────────────────────────────
  const { mutate: addLead, isPending: isAdding } = useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      toast.success("Lead created! ✅");
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["sales-leads"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed!"),
  });

  const { mutate: updateLeadApi, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateLead(id, data),
    onSuccess: () => {
      toast.success("Lead updated! ✅");
      setEditingLead(null);
      queryClient.invalidateQueries({ queryKey: ["sales-leads"] });
    },
    onError: () => toast.error("Failed to update!"),
  });

  const { mutate: addActivity, isPending: isAddingActivity } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => addActivityLead(id, data),
    onSuccess: () => {
      toast.success("Activity added! ✅");
      setActivityLead(null);
      queryClient.invalidateQueries({ queryKey: ["sales-leads"] });
    },
    onError: () => toast.error("Failed!"),
  });

  // ── Actions — sirf edit + activity + view (no assign/convert/delete/lost) ──
  const actions = {
    onEdit: setEditingLead,
    onActivity: setActivityLead,
    onViewActivities: setViewActivities,
  };

  return (
    <>
      <PageHeader
        title="Leads" subtitle="Manage all leads" titleIcon={<Users size={24} />}
        totalCount={data?.meta?.total ?? 0} onAdd={() => setIsAddOpen(true)}
        filters={filters} setFilters={setFilters} filterFields={leadFilterFields}
      />

      {/* ── View Toggle ── */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-5">
        <button
          onClick={() => setActiveView("opportunities")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === "opportunities" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <LayoutGrid size={14} /> Opportunities
        </button>
        <button
          onClick={() => setActiveView("list")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <List size={14} /> List
        </button>
      </div>

      {/* ── Kanban View ── */}
      {activeView === "opportunities" && (
        isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <KanbanBoard leads={data?.data || []} programMap={programMap} actions={actions} />
        )
      )}

      {/* ── List View ── */}
      {activeView === "list" && (
        <DynamicTable
          data={data?.data || []} isLoading={isLoading} isError={isError}
          columns={[
            { key: "name", label: "Name", render: (lead) => <span className="font-medium text-gray-800">{lead.first_name} {lead.last_name}</span> },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "quality", label: "Quality", render: (lead) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(lead.quality)}`}>{lead.quality}</span> },
            { key: "status", label: "Status", render: (lead) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(lead.status)}`}>{lead.status}</span> },
            { key: "source", label: "Source", render: (lead) => <span className="capitalize">{lead.source || "—"}</span> },
            { key: "assigned_to", label: "Assigned To", render: (lead) => <span>{lead.assigned_to?.name || "—"}</span> },
          ]}
          actions={[
            { icon: <Pencil size={14} />, label: "Edit", onClick: setEditingLead, className: "hover:bg-yellow-50 hover:text-yellow-600" },
            { icon: <Activity size={14} />, label: "Add Activity", onClick: setActivityLead, className: "hover:bg-indigo-50 hover:text-indigo-600" },
            { icon: <MdOutlineRemoveRedEye size={14} />, label: "View Activities", onClick: setViewActivities, className: "hover:bg-indigo-50 hover:text-indigo-600", hidden: (lead) => !lead.activities?.length },
          ]}
        />
      )}

      {/* ── Modals ── */}
      <LeadsModals
        isAddOpen={isAddOpen} onAddClose={() => setIsAddOpen(false)}
        onAddSubmit={addLead} isAdding={isAdding} addFields={simpleAddLeadFields}

        editingLead={editingLead} onEditClose={() => setEditingLead(null)}
        onEditSubmit={(data) => updateLeadApi({ id: editingLead._id, data })}
        isUpdating={isUpdating} editFields={editLeadFieldsReadonly}
        editInitialValues={editingLead ? {
          first_name: editingLead.first_name || "",
          last_name: editingLead.last_name || "",
          email: editingLead.email || "",
          phone: editingLead.phone || "",
          quality: editingLead.quality || "",
          source: editingLead.source || "",
          status: editingLead.status || "",
          notes: editingLead.notes || "",
          utm_source: editingLead.utm_source || "",
          utm_campaign: editingLead.utm_campaign || "",
        } : undefined}

        activityLead={activityLead} onActivityClose={() => setActivityLead(null)}
        onActivitySubmit={(data) => addActivity({ id: activityLead._id, data })} isAddingActivity={isAddingActivity}

        viewActivities={viewActivities} onViewActivitiesClose={() => setViewActivities(null)}
        activitiesData={activitiesData} isLoadingActivities={isLoadingActivities}
      />
    </>
  );
}