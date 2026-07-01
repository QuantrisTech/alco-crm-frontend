"use client";
import { useState, useEffect } from "react";
import { Pencil, Eye, X } from "lucide-react";
import ContractPDFGenerator from "@/app/component/dashboard/contract-pdf-generator";

interface ViewContractModalProps {
  lead: any;
  onClose: () => void;
  onSave?: (leadId: string, contractDetails: any) => void;
  isSaving?: boolean;
}

export default function ViewContractModal({ lead, onClose, onSave, isSaving }: ViewContractModalProps) {
  const [mode, setMode] = useState<"preview" | "edit">("preview");

  // Jab modal naya lead khole to reset back to preview
  useEffect(() => {
    setMode("preview");
  }, [lead?._id]);

  if (!lead) return null;

  // Lead convert ho chuki ho to edit allowed nahi — sirf preview
  const isConverted = lead.status === "converted";
  const canEdit = !isConverted && !!onSave;

  const contractData = {
    fullName: lead.contractDetails?.fullName,
    email: lead.email,
    phone: lead.phone,
    programName:
      lead.contractDetails?.programName ||
      lead.program_id?.name ||
      lead.program_name ||
      "",
    fatherHusbandName: lead.contractDetails?.fatherHusbandName,
    cnic: lead.contractDetails?.cnic,
    bankAccountNumber: lead.contractDetails?.bankAccountNumber,
    currentAddress: lead.contractDetails?.currentAddress,
    emergencyContactName: lead.contractDetails?.emergencyContactName,
    occupation: lead.contractDetails?.occupation,
    participationAgreement: lead.contractDetails?.participationAgreement,
    photoVideoRelease: lead.contractDetails?.photoVideoRelease,
    signatureData: lead.contractDetails?.signatureData,
    signedAt: lead.contractDetails?.signedAt,
    paymentPlan: lead.paymentPlan,
    invoiceNumber: lead.invoiceNumber || "",
  };

  const handleSubmit = (updatedContractDetails: any) => {
    if (!onSave) return;
    onSave(lead._id, { ...lead.contractDetails, ...updatedContractDetails });
    setMode("preview");
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-800">
              Contract — {lead.contractDetails?.fullName || lead.first_name + " " + lead.last_name}
            </h3>
            {isConverted && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                Lead converted ho chuki hai — contract ab edit nahi ho sakta.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => setMode((m) => (m === "preview" ? "edit" : "preview"))}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
              >
                {mode === "preview" ? (
                  <>
                    <Pencil size={12} /> Edit
                  </>
                ) : (
                  <>
                    <Eye size={12} /> Preview
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <ContractPDFGenerator
          mode={mode === "edit" ? "edit" : "preview"}
          contractData={contractData}
          onSubmit={canEdit ? (handleSubmit as any) : undefined}
          isSubmitting={isSaving}
        />
      </div>
    </div>
  );
}