"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllLeads, createLead, updateLead,
  assignLead, convertLead, markLostLead, addActivityLead,
  getActivitiesLead, getLeadsStats, getNamesPrograms,
  markLeadInterested, updateLeadPaymentPlan, adminGetBatches,
  getAllEnrollments,
} from "@/utils/api";
import PageHeader from "@/app/component/dashboard/page-header";
import toast from "react-hot-toast";
import { Users, Pencil, UserCheck, XCircle, Activity, UserPlus, LayoutGrid, List } from "lucide-react";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import DynamicTable from "@/app/component/dashboard/dynamic-table";
import LeadPipeline from "@/app/component/dashboard/lead-pipeline";
import QuickStats from "@/app/component/dashboard/quick-stats";
import LeadsModals from "../shared/leads-modals";
import { simpleAddLeadFields, editLeadFields } from "../shared/fields";
import { statusColor, leadFilterFields, defaultLeadFilters } from "../shared/constants";
import { useAppSelector } from "@/store/hooks";
import { ModalField } from "@/types/ui";
import KanbanBoard from "./kanban-board";
import PaymentPlanModal from "./payment-plan-modal";
import MarkInterestedModal from "./mark-interested-modal";
import ContractPDFGenerator from "@/app/component/dashboard/contract-pdf-generator";
import ViewContractModal from "./view-contract-modal";
import ViewPaymentPlanModal from "./view-payment-plan-modal";
import SelectProgramModal from "./select-program-modal";

export default function SalesManagerLeads() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAppSelector((state) => state.auth);

  const [activeView, setActiveView] = useState<"opportunities" | "list">("opportunities");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [activityLead, setActivityLead] = useState<any>(null);
  const [lostLead, setLostLead] = useState<any>(null);
  const [assigningLead, setAssigningLead] = useState<any>(null);
  const [viewActivities, setViewActivities] = useState<any>(null);
  const [interestedLead, setInterestedLead] = useState<any>(null);
  const [paymentPlanLead, setPaymentPlanLead] = useState<any>(null);
  const [viewContractLead, setViewContractLead] = useState<any>(null);
  const [filters, setFilters] = useState(defaultLeadFilters);
  const [selectProgramLead, setSelectProgramLead] = useState<any>(null);
  const [viewingPaymentPlan, setViewingPaymentPlan] = useState<any>(null);
  const [filtersPage, setFiltersPage] = useState({
    page: "1",
    limit: "10",
  });

  const currentPage = Number(filtersPage.page);
  const limit = Number(filtersPage.limit);

  // ── Queries ──────────────────────────────────────────────────
  const { data: leadsData, isLoading, isError } = useQuery({
    // queryKey: ["admin-leads", filters],
    // queryFn: () => getAllLeads(filters).then((r) => r.data),
    queryKey: ["admin-leads", filters, filtersPage],  // 👈 filtersPage bhi add karo
    queryFn: () => getAllLeads({ ...filters, ...filtersPage }).then((r) => r.data),
  });

  const { data: allLeadsData, isLoading: isKanbanLoading } = useQuery({
    queryKey: ["admin-leads-kanban", filters],
    queryFn: () => getAllLeads({ ...filters, page: "1", limit: "1000" }).then((r) => r.data),
    enabled: activeView === "opportunities",  // sirf tab fetch karo jab kanban open ho
  });

  const { data: enrollmentsData } = useQuery({
    queryKey: ["enrollments-kanban"],
    queryFn: () =>
      getAllEnrollments({
        page: 1,
        limit: 1000, // saari enrollments
        search: filters.search || "",
      }).then((r) => r.data),
  });

  const { data: activitiesData, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["lead-activities", viewActivities?._id],
    queryFn: () => getActivitiesLead(viewActivities._id).then((r) => r.data),
    enabled: !!viewActivities,
  });

  const { data: statsData } = useQuery({
    queryKey: ["sales-leads-stats", authUser?._id],
    queryFn: () => getLeadsStats(authUser?._id).then((r) => r.data.data),
    enabled: !!authUser?._id,
  });

  const { data: programs } = useQuery({
    queryKey: ["program-names"],
    queryFn: getNamesPrograms,
  });

  const { data: batches } = useQuery({
    queryKey: ["batches-active"],
    queryFn: () => adminGetBatches({ status: "active" }).then((r) => r.data),
  });

  // ── Inject programs + batches into fields ─────────────────────
  const injectPrograms = (fields: ModalField[]) =>
    fields.map((f) =>
      f.name === "program_id"
        ? { ...f, options: (programs || []).map((p: any) => ({ label: p.name, value: p._id })) }
        : f
    );

  const injectBatches = (fields: ModalField[]) =>
    fields.map((f) =>
      f.name === "batch_id"
        ? {
          ...f,
          options: [
            { label: "— None —", value: "" },
            ...(batches?.data || []).map((b: any) => ({ label: b.name, value: b._id })),
          ],
        }
        : f
    );

  const injectAll = (fields: ModalField[]) => injectBatches(injectPrograms(fields));

  const programMap = Object.fromEntries((programs || []).map((p: any) => [p._id, p.name]));

  const pipelineData = [
    { label: "New", count: statsData?.new || 0, color: "bg-sky-500" },
    { label: "Contacted", count: statsData?.contacted || 0, color: "bg-yellow-400" },
    { label: "Qualified", count: statsData?.qualified || 0, color: "bg-indigo-500" },
    { label: "Interested", count: statsData?.interested || 0, color: "bg-orange-400" },
    { label: "Converted", count: statsData?.converted || 0, color: "bg-teal-500" },
    { label: "Lost", count: statsData?.lost || 0, color: "bg-rose-400" },
  ];

  const quickStatsData = [
    { label: "Conversion Rate", value: `${statsData?.conversionRate || 0}%`, color: "text-teal-600" },
    { label: "Hot Leads", value: `${statsData?.hot || 0}`, color: "text-red-500" },
    { label: "Assigned", value: `${statsData?.assigned || 0}`, color: "text-blue-600" },
    { label: "Lost", value: `${statsData?.lost || 0}`, color: "text-rose-500" },
  ];

  // ── Mutations ────────────────────────────────────────────────
  const { mutate: addLead, isPending: isAdding } = useMutation({
    mutationFn: createLead,
    onSuccess: () => { toast.success("Lead created! ✅"); setIsAddOpen(false); queryClient.invalidateQueries({ queryKey: ["sales-leads"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed!"),
  });

  const { mutate: updateLeadApi, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateLead(id, data),
    onSuccess: () => { toast.success("Lead updated! ✅"); setEditingLead(null); queryClient.invalidateQueries({ queryKey: ["sales-leads"] }); },
    onError: () => toast.error("Failed to update!"),
  });

  const { mutate: assignLeadApi, isPending: isAssigning } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assignLead(id, data),
    onSuccess: () => { toast.success("Lead assigned! ✅"); setAssigningLead(null); queryClient.invalidateQueries({ queryKey: ["sales-leads"] }); },
    onError: () => toast.error("Failed to assign!"),
  });

  const { mutate: convertLeadApi } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => convertLead(id, data),
    onSuccess: () => { toast.success("Lead converted! 🎉"); queryClient.invalidateQueries({ queryKey: ["sales-leads"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to convert!"),
  });

  const { mutate: markLost, isPending: isMarkingLost } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => markLostLead(id, data),
    onSuccess: () => { toast.success("Marked as lost!"); setLostLead(null); queryClient.invalidateQueries({ queryKey: ["sales-leads"] }); },
    onError: () => toast.error("Failed!"),
  });

  const { mutate: addActivity, isPending: isAddingActivity } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => addActivityLead(id, data),
    onSuccess: () => { toast.success("Activity added! ✅"); setActivityLead(null); queryClient.invalidateQueries({ queryKey: ["sales-leads"] }); },
    onError: () => toast.error("Failed!"),
  });

  const { mutate: savePaymentPlan, isPending: isSavingPlan } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateLeadPaymentPlan(id, data),
    onSuccess: () => {
      toast.success(paymentPlanLead?.paymentPlan ? "Payment plan updated!" : "Payment plan saved!");
      setPaymentPlanLead(null);
      queryClient.invalidateQueries({ queryKey: ["sales-leads"] });
    },
  });

  const { mutate: markInterested, isPending: isMarkingInterested } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => markLeadInterested(id, data),
    onSuccess: () => {
      toast.success("Lead marked as interested! ⭐");
      setInterestedLead(null);
      queryClient.invalidateQueries({ queryKey: ["sales-leads"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed!"),
  });

  // ── Actions — delete nahi hai manager ke paas ─────────────────
  const actions = {
    onEdit: setEditingLead,
    onAssign: setAssigningLead,
    onActivity: setActivityLead,
    onViewActivities: setViewActivities,
    onConvert: (lead: any) => convertLeadApi({ id: lead._id, data: { program_id: lead.program_id, batch_id: lead.batch_id, payment_plan_id: lead.payment_plan_id } }),
    onMarkLost: setLostLead,
    onPaymentPlan: setPaymentPlanLead,
    onInterested: setInterestedLead,
    onQualified: (lead: any) => updateLeadApi({ id: lead._id, data: { status: "qualified" } }),
    onContacted: (lead: any) => {
      if (!lead.program_id) {
        setSelectProgramLead(lead); // modal open
      } else {
        updateLeadApi({ id: lead._id, data: { status: "contacted" } });
      }
    },
    onViewContract: setViewContractLead,
    viewPaymentPlan: setViewingPaymentPlan,
  };

    const handlePageChange = (newPage: number) => {
    setFiltersPage((prev) => ({ ...prev, page: String(newPage) }));
  };

  return (
    <>
      <PageHeader
        title="Leads" subtitle="Manage all leads" titleIcon={<Users size={24} />}
        totalCount={leadsData?.meta?.total ?? 0} onAdd={() => setIsAddOpen(true)}
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
          <List size={14} /> List View
        </button>
      </div>

      {/* ── Kanban View ── */}
      {activeView === "opportunities" && (
        isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <KanbanBoard 
            leads={allLeadsData?.data || []}
            enrollments={enrollmentsData?.data || []}
            programMap={programMap}
            actions={actions}
            filters={filters} />
        )
      )}

      {/* ── List View ── */}
      {activeView === "list" && (
        <>
          <DynamicTable
            data={leadsData?.data || []} isLoading={isLoading} isError={isError}
            currentPage={currentPage} pageSize={limit}
            totalPages={Math.ceil((leadsData?.meta?.total ?? 0) / limit)}
            onPageChange={handlePageChange}
            columns={[
              { key: "name", label: "Name", render: (lead) => <span className="font-medium text-gray-800">{lead.first_name} {lead.last_name}</span> },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone" },
              { key: "quality", label: "Quality", render: (lead) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(lead.quality)}`}>{lead.quality}</span> },
              { key: "status", label: "Status", render: (lead) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(lead.status)}`}>{lead.status}</span> },
              { key: "program_id", label: "Program", render: (lead) => <span>{programMap?.[lead.program_id] || "—"}</span> },
              { key: "source", label: "Source", render: (lead) => <span className="capitalize">{lead.source || "—"}</span> },
              { key: "assigned_to", label: "Assigned To", render: (lead) => <span>{lead.assigned_to?.name || "—"}</span> },
            ]}
            actions={[
              { icon: <Pencil size={14} />, label: "Edit", onClick: setEditingLead, className: "hover:bg-yellow-50 hover:text-yellow-600" },
              // { icon: <UserPlus size={14} />, label: "Assign", onClick: setAssigningLead, className: "hover:bg-blue-50 hover:text-blue-600" },
              // { icon: <Activity size={14} />, label: "Add Activity", onClick: setActivityLead, className: "hover:bg-indigo-50 hover:text-indigo-600" },
              // { icon: <MdOutlineRemoveRedEye size={14} />, label: "View Activities", onClick: setViewActivities, className: "hover:bg-indigo-50 hover:text-indigo-600", hidden: (lead) => !lead.activities?.length },
              // { icon: <UserCheck size={14} />, label: "Convert", onClick: (lead) => convertLeadApi({ id: lead._id, data: { program_id: lead.program_id, batch_id: lead.batch_id, payment_plan_id: lead.payment_plan_id } }), className: "hover:bg-teal-50 hover:text-teal-600", hidden: (lead) => lead.status === "converted" || lead.status === "lost" },
              // { icon: <XCircle size={14} />, label: "Mark Lost", onClick: setLostLead, className: "hover:bg-red-50 hover:text-red-500", hidden: (lead) => lead.status === "converted" || lead.status === "lost" },
            ]}
          />
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="col-span-2"><LeadPipeline data={pipelineData} /></div>
            <QuickStats data={quickStatsData} />
          </div>
        </>
      )}

      {/* ── All Modals ── */}
      <LeadsModals
        isAddOpen={isAddOpen} onAddClose={() => setIsAddOpen(false)}
        onAddSubmit={addLead} isAdding={isAdding} addFields={injectAll(simpleAddLeadFields)}

        editingLead={editingLead} onEditClose={() => setEditingLead(null)}
        onEditSubmit={(data) => updateLeadApi({ id: editingLead._id, data })}
        isUpdating={isUpdating} editFields={injectAll(editLeadFields)}
        editInitialValues={editingLead ? {
          first_name: editingLead.first_name || "",
          last_name: editingLead.last_name || "",
          email: editingLead.email || "",
          phone: editingLead.phone || "",
          nationality: editingLead.nationality || "",
          profession: editingLead.profession || "",
          opportunity_value: editingLead.opportunity_value || "",
          batch_id: editingLead.batch_id?._id || editingLead.batch_id || "",
          program_id: editingLead.program_id?._id || editingLead.program_id || "",
          status: editingLead.status || "",
          quality: editingLead.quality || "",
          source: editingLead.source || "",
          query: editingLead.query || "",
          message: editingLead.message || "",
          notes: editingLead.notes || "",
          utm_source: editingLead.utm_source || "",
          utm_medium: editingLead.utm_medium || "",
          utm_campaign: editingLead.utm_campaign || "",
        } : undefined}

        activityLead={activityLead} onActivityClose={() => setActivityLead(null)}
        onActivitySubmit={(data) => addActivity({ id: activityLead._id, data })} isAddingActivity={isAddingActivity}

        viewActivities={viewActivities} onViewActivitiesClose={() => setViewActivities(null)}
        activitiesData={activitiesData} isLoadingActivities={isLoadingActivities}

        lostLead={lostLead} onLostClose={() => setLostLead(null)}
        onLostSubmit={(data) => markLost({ id: lostLead._id, data })} isMarkingLost={isMarkingLost}

        assigningLead={assigningLead} onAssignClose={() => setAssigningLead(null)}
        onAssign={(userId) => assignLeadApi({ id: assigningLead._id, data: { assigned_to: userId } })}
        isAssigning={isAssigning} currentUserRole={authUser?.role}
      />

      {/* ── Payment Plan Modal ── */}
      {paymentPlanLead && (
        <PaymentPlanModal
          lead={paymentPlanLead}
          onClose={() => setPaymentPlanLead(null)}
          onSubmit={(data) => savePaymentPlan({ id: paymentPlanLead._id, data })}
          isSubmitting={isSavingPlan}
        />
      )}

      {/* ── Mark Interested Modal ── */}
      {interestedLead && (
        <MarkInterestedModal
          lead={interestedLead}
          onClose={() => setInterestedLead(null)}
          onSubmit={(data) => markInterested({ id: interestedLead._id, data })}
          isSubmitting={isMarkingInterested}
        />
      )}
      <ViewContractModal lead={viewContractLead} onClose={() => setViewContractLead(null)} />

      <ViewPaymentPlanModal lead={viewingPaymentPlan} onClose={() => setViewingPaymentPlan(null)} />

      <SelectProgramModal
        lead={selectProgramLead}
        programs={programs || []}
        onClose={() => setSelectProgramLead(null)}
        onConfirm={(leadId, programId) => {
          updateLeadApi({ id: leadId, data: { program_id: programId, status: "contacted" } });
          setSelectProgramLead(null);
        }}
        isLoading={isUpdating}
      />

      {/* ── Contract View Modal ── */}
      {/* {viewContractLead && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-800">
                Contract — {viewContractLead.contractDetails?.fullName || `${viewContractLead.first_name} ${viewContractLead.last_name}`}
              </h3>
              <button onClick={() => setViewContractLead(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <ContractPDFGenerator
              mode="preview"
              contractData={{
                fullName: viewContractLead.contractDetails?.fullName,
                email: viewContractLead.email,
                phone: viewContractLead.phone,
                programName: viewContractLead.program_id?.name || viewContractLead.program_name,
                fatherHusbandName: viewContractLead.contractDetails?.fatherHusbandName,
                cnic: viewContractLead.contractDetails?.cnic,
                bankAccountNumber: viewContractLead.contractDetails?.bankAccountNumber,
                currentAddress: viewContractLead.contractDetails?.currentAddress,
                emergencyContactName: viewContractLead.contractDetails?.emergencyContactName,
                occupation: viewContractLead.contractDetails?.occupation,
                participationAgreement: viewContractLead.contractDetails?.participationAgreement,
                photoVideoRelease: viewContractLead.contractDetails?.photoVideoRelease,
                signatureData: viewContractLead.contractDetails?.signatureData,
                signedAt: viewContractLead.contractDetails?.signedAt,
                paymentPlan: viewContractLead.paymentPlan,
              }}
            />
          </div>
        </div>
      )} */}
    </>
  );
}