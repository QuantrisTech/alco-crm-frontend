import { CheckCircle2, Clock, PenLine } from "lucide-react";

export default function ContractBadge({ contractDetails, onViewContract, lead, canEdit }: any) {
  const status = contractDetails?.status;
  if (!status) return null;

  if (status === "signed") return (
    <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); onViewContract?.(lead); }}
      className="flex items-center justify-between my-2 px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-100 cursor-pointer hover:bg-teal-100 transition-colors group/contract">
      <div className="flex items-center gap-1.5">
        <CheckCircle2 size={10} className="text-teal-500 shrink-0" />
        <span className="text-[10px] font-semibold text-teal-600">Contract Signed</span>
      </div>
      <span className="text-[9px] text-teal-400 group-hover/contract:text-teal-600 transition-colors">View PDF →</span>
    </div>
  );

  if (status === "filled") return (
    <div
      onClick={canEdit ? (e) => { e.stopPropagation(); e.preventDefault(); onViewContract?.(lead); } : undefined}
      className={`flex items-center gap-1.5 my-2 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 transition-colors group/contract ${canEdit ? "cursor-pointer hover:bg-indigo-100" : ""}`}
    >
      <PenLine size={10} className="text-indigo-400 shrink-0" />
      <span className="text-[10px] font-semibold text-indigo-500">Contract Filled</span>
      {canEdit ? (
        <span className="text-[9px] text-indigo-300 ml-auto group-hover/contract:text-indigo-500 transition-colors">Edit →</span>
      ) : (
        <span className="text-[9px] text-indigo-300 ml-auto">Awaiting signature</span>
      )}
    </div>
  );

  if (status === "pending") return (
    <div
      onClick={canEdit ? (e) => { e.stopPropagation(); e.preventDefault(); onViewContract?.(lead); } : undefined}
      className={`flex items-center gap-1.5 my-2 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 transition-colors group/contract ${canEdit ? "cursor-pointer hover:bg-gray-100" : ""}`}
    >
      <Clock size={10} className="text-gray-400 shrink-0" />
      <span className="text-[10px] font-semibold text-gray-500">Contract Pending</span>
      {canEdit ? (
        <span className="text-[9px] text-gray-400 ml-auto group-hover/contract:text-gray-600 transition-colors">Edit →</span>
      ) : (
        <span className="text-[9px] text-gray-300 ml-auto">Not filled yet</span>
      )}
    </div>
  );

  return null;
}