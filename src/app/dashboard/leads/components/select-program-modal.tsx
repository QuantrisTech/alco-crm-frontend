"use client";
import { useState } from "react";
import Select from "@/app/component/ui/select";

interface Program {
  _id: string;
  name: string;
}

interface SelectProgramModalProps {
  lead: any;
  programs: Program[];
  onClose: () => void;
  onConfirm: (leadId: string, programId: string) => void;
  isLoading?: boolean;
}

export default function SelectProgramModal({
  lead,
  programs,
  onClose,
  onConfirm,
  isLoading,
}: SelectProgramModalProps) {
  if (!lead) return null;

  const [selectedProgram, setSelectedProgram] = useState(lead.program_id || "");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-5 w-full max-w-sm">
        <h3 className="text-sm font-semibold mb-4 text-gray-600">Select Program</h3>

        <Select
          label="Program"
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value)}
          options={[
            { label: "Select program", value: "", disabled: true },
            ...(programs || []).map((p) => ({
              label: p.name,
              value: p._id,
            })),
          ]}
        />

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!selectedProgram || isLoading}
            onClick={() => onConfirm(lead._id, selectedProgram)}
            className={`px-3 py-1.5 text-sm rounded-md text-white transition-colors ${
              !selectedProgram || isLoading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-yellow-400 hover:bg-yellow-500"
            }`}
          >
            {isLoading ? "Saving..." : "Continue to Contacted"}
          </button>
        </div>
      </div>
    </div>
  );
}