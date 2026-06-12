"use client";
import ContractPDFGenerator from "@/app/component/dashboard/contract-pdf-generator";

interface ViewContractModalProps {
  lead: any;
  onClose: () => void;
}

export default function ViewContractModal({ lead, onClose }: ViewContractModalProps) {
  if (!lead) return null;

  console.log(lead, "leadleadleadleadleadlead")

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-800">
            Contract — {lead.contractDetails?.fullName || lead.first_name + " " + lead.last_name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
        <ContractPDFGenerator
          mode="preview"
          contractData={{
            fullName: lead.contractDetails?.fullName,
            email: lead.email,
            phone: lead.phone,
            programName: lead.contractDetails?.programName ||
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
          }}
        />
      </div>
    </div>
  );
}