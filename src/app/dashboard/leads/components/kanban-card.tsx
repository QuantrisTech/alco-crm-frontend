"use client";
import React from 'react'
import { qualityColor } from '../shared/constants';
import { Activity, Pencil, Tag, Trash2, UserCheck, UserPlus, XCircle, CreditCard, Star, FileText, CheckCircle2, Clock, PenLine, ArrowLeftRight, ShieldCheck, Flame } from 'lucide-react';
import { MdOutlineRemoveRedEye } from "react-icons/md";

const cardStyle = (status: string) => {
  switch (status) {
    case "lost": return "bg-rose-50/70 border-rose-200";
    case "converted": return "bg-blue-50/70 border-blue-200";
    case "enrolled": return "bg-green-50/70 border-green-200";
    default: return "bg-white border-gray-100";
  }
};

// ── Contract status badge at bottom ──────────────────────────
function ContractBadge({ contractDetails, onViewContract, lead }: any) {
  const status = contractDetails?.status;
  if (!status || status === undefined) return null;

  if (status === "signed") {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();  // ← yeh bhi add karo
          console.log("Contract clicked:", lead); // ← debug ke liye
          onViewContract?.(lead);
        }}
        className="flex items-center justify-between mt-2 px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-100 cursor-pointer hover:bg-teal-100 transition-colors group/contract"
      >
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={10} className="text-teal-500 shrink-0" />
          <span className="text-[10px] font-semibold text-teal-600">Contract Signed</span>
        </div>
        <span className="text-[9px] text-teal-400 group-hover/contract:text-teal-600 transition-colors">
          View PDF →
        </span>
      </div>
    );
  }

  if (status === "filled") {
    return (
      <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
        <PenLine size={10} className="text-indigo-400 shrink-0" />
        <span className="text-[10px] font-semibold text-indigo-500">Contract Filled</span>
        <span className="text-[9px] text-indigo-300 ml-auto">Awaiting signature</span>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
        <Clock size={10} className="text-gray-400 shrink-0" />
        <span className="text-[10px] font-semibold text-gray-500">Contract Pending</span>
        <span className="text-[9px] text-gray-300 ml-auto">Not filled yet</span>
      </div>
    );
  }

  return null;
}

export default function KanbanCard({
  lead, programMap,
  onEdit, onViewContract, onActivity, onContacted, onQualified, onPaymentPlan, onInterested, onConvert, onMarkLost, onDelete, onAssign, onViewActivities, viewPaymentPlan
}: any) {

  return (
    <div className={`rounded-xl border shadow-sm p-3 hover:shadow-md transition-shadow cursor-pointer group relative ${cardStyle(lead.status)}`}>

      {/* ── Top row ── */}
      <div className="flex items-start justify-between gap-2 mb-2">
        {/* {StageIcon && (<StageIcon size={11} className="text-gray-400 shrink-0 mt-0.5" />)} */}
        <p className="font-semibold text-gray-800 text-sm leading-tight">
          {lead.first_name} {lead.last_name}
        </p>
        <div className='flex gap-1'>
          {lead.status === "converted" && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${qualityColor(lead.status)}`}>
              {lead.status}
            </span>
          )}
          {lead.quality && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${qualityColor(lead.quality)}`}>
              {lead.quality}
            </span>
          )}
        </div>
      </div>

      {/* ── Lost reason ── */}
      {lead.status === "lost" && lead.lost_reason && (
        <p className="text-[10px] text-rose-400 mb-2 italic">{lead.lost_reason}</p>
      )}

      {/* ── Source ── */}
      {lead.source && (
        <p className="text-[11px] text-gray-400 mb-2 capitalize">{lead.source}</p>
      )}

      {/* ── Program ── */}
      {lead.program_id && (
        <div className="flex items-center gap-1 mb-2">
          <Tag size={10} className="text-gray-400" />
          <span className="text-[11px] text-gray-500 truncate">
            {programMap?.[lead.program_id] || "Program"}
          </span>
        </div>
      )}

      {/* ── Opportunity value ── */}
      {lead.opportunity_value && (
        <p className={`text-[11px] font-semibold mb-2 ${lead.status === "lost" ? "text-rose-400 line-through" : "text-gray-700"}`}>
          Rs {Number(lead.opportunity_value).toLocaleString()}
        </p>
      )}

      {/* ── Contract status badge (bottom, always visible) ── */}
      {lead.contractDetails && lead.status === "interested" &&
        lead.status !== "converted" &&
        lead.status !== "lost" && (
          <ContractBadge
            contractDetails={lead.contractDetails}
            onViewContract={onViewContract}
            lead={lead}
          />
        )}

      {/* ── Assigned to ── */}
      {lead.assigned_to && (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-[8px] font-bold text-gray-900">
            {lead.assigned_to?.name?.charAt(0) || "?"}
          </div>
          <span className="text-[10px] text-gray-400">{lead.assigned_to?.name}</span>
        </div>
      )}

      {/* ── Action buttons (hover) ── */}
      <div className="flex items-center gap-1 pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">

        {/* {onEdit && (
          <button onClick={() => onEdit(lead)} title="Edit"
            className="p-1 rounded hover:bg-yellow-50 hover:text-yellow-600 text-gray-400">
            <Pencil size={11} />
          </button>
        )} */}
        {onAssign && (
          <button onClick={() => onAssign(lead)} title="Assign"
            className="p-1 rounded hover:bg-blue-50 hover:text-blue-600 text-gray-400">
            <UserPlus size={11} />
          </button>
        )}
        {onActivity && (
          <button onClick={() => onActivity(lead)} title="Activity"
            className="p-1 rounded hover:bg-indigo-50 hover:text-indigo-600 text-gray-400">
            <Activity size={11} />
          </button>
        )}
        {onViewActivities && lead.activities?.length > 0 && (
          <button onClick={() => onViewActivities(lead)} title="View Activities"
            className="p-1 rounded hover:bg-indigo-50 hover:text-indigo-600 text-gray-400">
            <MdOutlineRemoveRedEye size={11} />
          </button>
        )}
        {onContacted &&
          lead.status === "new" &&
          lead.status !== "converted" &&
          lead.status !== "lost" && (
            <button
              // onClick={() => {
              //   if (!lead.program_id) return;
              //   onContacted(lead);
              // }}
              // title={!lead.program_id ? "please click to fill program first then mark contacted" : "Mark Contacted"}
              // disabled={!lead.program_id}
              //   className={`p-1 rounded transition-colors
              //   ${!lead.program_id
              //       ? "hover:bg-gray-50 hover:text-gray-600 text-gray-400"
              //       : "hover:bg-sky-50 hover:text-sky-600 text-gray-400"
              //     }
              // `}
              onClick={() => onContacted(lead)}
              title='Mark Contacted'
              className='p-1 rounded transition-colors bg-sky-50 hover:text-sky-600 text-gray-400'
            >
              <ArrowLeftRight size={11} />
            </button>
          )}

        {onPaymentPlan &&
          lead.status === "interested" &&
          lead.status !== "converted" &&
          lead.status !== "lost" && (
            <button onClick={() => onPaymentPlan(lead)} title="Set Payment Plan"
              className="p-1 rounded hover:bg-green-50 hover:text-green-500 text-gray-400">
              <CreditCard size={11} />
            </button>
          )}
        {onQualified &&
          lead.status !== "interested" &&
          lead.status !== "qualified" &&
          lead.status !== "new" &&
          lead.status !== "converted" &&
          lead.status !== "lost" && (
            <button onClick={() => onQualified(lead)} title="Mark Qualified"
              className="p-1 rounded hover:bg-yellow-50 hover:text-yellow-500 text-gray-400">
              <ShieldCheck size={11} />
            </button>
          )}
        {onInterested &&
          lead.status !== "interested" &&
          lead.status !== "new" &&
          lead.status !== "converted" &&
          lead.status !== "lost" && (
            <button onClick={() => onInterested(lead)} title="Mark Interested"
              className="p-1 rounded hover:bg-orange-50 hover:text-orange-500 text-gray-400">
              <Flame size={11} />
            </button>
          )}
        {onConvert &&
          lead.status === "interested" &&
          lead.status !== "converted" &&
          lead.status !== "lost" && (
            <button onClick={() => onConvert(lead)} title="Convert"
              className="p-1 rounded hover:bg-teal-50 hover:text-teal-600 text-gray-400">
              <UserCheck size={11} />
            </button>
          )}
        {onMarkLost &&
          lead.status !== "converted" &&
          lead.status !== "lost" && (
            <button onClick={() => onMarkLost(lead)} title="Lost"
              className="p-1 rounded hover:bg-rose-50 hover:text-rose-500 text-gray-400">
              <XCircle size={11} />
            </button>
          )}

        {/* {onDelete && (
          <button onClick={() => onDelete(lead)} title="Delete"
            className="p-1 rounded hover:bg-rose-50 hover:text-rose-500 text-gray-400 ml-auto">
            <Trash2 size={11} />
          </button>
        )} */}
      </div>

      {viewPaymentPlan && lead.status === "converted" && (
        <button onClick={() => viewPaymentPlan(lead)} title="View Payment Plan"
          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700  flex ml-auto absolute bottom-2 right-2 ">
          view Payment plan
        </button>
      )}
    </div>
  );
}
