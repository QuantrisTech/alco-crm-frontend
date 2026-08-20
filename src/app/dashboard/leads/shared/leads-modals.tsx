"use client";
import Modal from "@/app/component/ui/model/modal";
import AddActivityModal from "../components/add-activity-modal";
import Popup from "@/app/component/ui/popup/popup";
import { activityFields, lostFields, notNowFields } from "./fields";
import { ModalField } from "@/types/ui";
import ViewActivityModal from "../components/view-activity-modal";
import AssignLeadModal from "../components/assign-lead-modal";

interface LeadsModalsProps {
  // Add Modal
  isAddOpen: boolean;
  onAddClose: () => void;
  onAddSubmit: (data: any) => void;
  isAdding: boolean;
  addFields: ModalField[];

  // Edit Modal
  editingLead: any;
  onEditClose: () => void;
  onEditSubmit: (data: any) => void;
  isUpdating: boolean;
  editFields: ModalField[];
  editInitialValues?: Record<string, any>;

  // Activity Modal
  activityLead: any;
  onActivityClose: () => void;
  onActivitySubmit: (data: any) => void;
  isAddingActivity: boolean;

  // View Activities Modal
  viewActivities: any;
  onViewActivitiesClose: () => void;
  activitiesData: any;
  isLoadingActivities: boolean;

  // Lost Modal (optional — not in sales rep)
  lostLead?: any;
  onLostClose?: () => void;
  onLostSubmit?: (data: any) => void;
  isMarkingLost?: boolean;

  // Delete Popup (optional — only admin)
  deletingLead?: any;
  onDeleteClose?: () => void;
  onDeleteConfirm?: () => void;
  isDeleting?: boolean;

  // Assign Modal (optional — not in sales rep)
  assigningLead?: any;
  onAssignClose?: () => void;
  onAssign?: (userId: string) => void;
  isAssigning?: boolean;
  currentUserRole?: "super_admin" | "admin" | "sales_manager" | "sales_rep";

  // Not Now Modal (optional)
  notNowLead?: any;
  onNotNowClose?: () => void;
  onNotNowSubmit?: (data: any) => void;
  isMarkingNotNow?: boolean;
}

export default function LeadsModals({
  // Add
  isAddOpen, onAddClose, onAddSubmit, isAdding, addFields,
  // Edit
  editingLead, onEditClose, onEditSubmit, isUpdating, editFields, editInitialValues,
  // Activity
  activityLead, onActivityClose, onActivitySubmit, isAddingActivity,
  // View Activities
  viewActivities, onViewActivitiesClose, activitiesData, isLoadingActivities,
  // Lost
  lostLead, onLostClose, onLostSubmit, isMarkingLost,
  // Delete
  deletingLead, onDeleteClose, onDeleteConfirm, isDeleting,
  // Assign
  assigningLead, onAssignClose, onAssign, isAssigning, currentUserRole,
  // Not Now
  notNowLead, onNotNowClose, onNotNowSubmit, isMarkingNotNow,
}: LeadsModalsProps) {
  return (
    <>
      {/* ── Add Lead Modal ── */}
      <Modal
        isOpen={isAddOpen}
        onClose={onAddClose}
        title="Add New Lead"
        fields={addFields}
        onSubmit={onAddSubmit}
        isLoading={isAdding}
        mode="add"
      />

      {/* ── Edit Modal ── */}
      {editingLead && (
        <Modal
          isOpen={!!editingLead}
          onClose={onEditClose}
          title="Edit Lead"
          subtitle={`${editingLead.first_name} ${editingLead.last_name}`}
          fields={editFields}
          initialValues={editInitialValues}
          onSubmit={onEditSubmit}
          isLoading={isUpdating}
          mode="edit"
        />
      )}

      {/* ── Add Activity Modal ── */}
      {activityLead && (
        // <AddActivityModal
        //   isOpen={!!activityLead}
        //   onClose={onActivityClose}
        //   title="Add Activity"
        //   subtitle={`${activityLead.first_name} ${activityLead.last_name}`}
        //   fields={activityFields}
        //   onSubmit={onActivitySubmit}
        //   isLoading={isAddingActivity}
        //   mode="add"
        // />
        <AddActivityModal
          isOpen={!!activityLead}
          onClose={onActivityClose}
          lead={activityLead}
          onSubmit={onActivitySubmit}
          isLoading={isAddingActivity}
        />
      )}

      {/* ── View Activities Modal ── */}
      <ViewActivityModal
        isOpen={!!viewActivities}
        onClose={onViewActivitiesClose}
        lead={viewActivities}
        activitiesData={activitiesData}
        isLoading={isLoadingActivities}
      />

      {/* ── Mark Lost Modal (optional) ── */}
      {lostLead && onLostClose && onLostSubmit && (
        <Modal
          isOpen={!!lostLead}
          onClose={onLostClose}
          title="Mark as Lost"
          subtitle={`${lostLead.first_name} ${lostLead.last_name}`}
          fields={lostFields}
          onSubmit={onLostSubmit}
          isLoading={isMarkingLost}
          mode="add"
        />
      )}

      {/* ── Delete Popup (optional — admin only) ── */}
      {deletingLead && onDeleteClose && onDeleteConfirm && (
        <Popup
          isOpen={!!deletingLead}
          onClose={onDeleteClose}
          onConfirm={onDeleteConfirm}
          variant="danger"
          title="Delete Lead"
          description={
            <>
              Delete{" "}
              <span className="font-bold text-red-500">
                {deletingLead.first_name} {deletingLead.last_name}
              </span>
              ? This cannot be undone.
            </>
          }
          confirmText="Yes, Delete"
          isLoading={isDeleting}
          loadingText="Deleting..."
        />
      )}

      {/* ── Assign Modal (optional) ── */}
      {assigningLead && onAssignClose && onAssign && (
        <AssignLeadModal
          lead={assigningLead}
          onClose={onAssignClose}
          onAssign={onAssign}
          isLoading={isAssigning || false}
          currentUserRole={currentUserRole || "admin"}
        />
      )}

      {/* ── Mark Not Now Modal (optional) ── */}
      {notNowLead && onNotNowClose && onNotNowSubmit && (
        <Modal
          isOpen={!!notNowLead}
          onClose={onNotNowClose}
          title="Mark as Not Now"
          subtitle={`${notNowLead.first_name} ${notNowLead.last_name}`}
          fields={notNowFields}
          onSubmit={onNotNowSubmit}
          isLoading={isMarkingNotNow}
          mode="add"
        />
      )}
    </>
  );
}