import React, { useState } from 'react'

export default function BatchPickerModal({
  program,
  batches,
  currentBatch,
  onConfirm,
  onClose,
}: {
  program: { id: string; name: string };
  batches: any[];
  currentBatch?: string;
  onConfirm: (batchId: string) => void;
  onClose: () => void;
}) {
  const [selectedBatch, setSelectedBatch] = useState(currentBatch || "");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!selectedBatch) {
      setError("Please select a batch");
      return;
    }
    onConfirm(selectedBatch);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">
          Select Batch — {program.name}
        </h3>
        <p className="text-[11px] text-gray-400 mb-4">
          Choose the batch for this program.
        </p>

        <select
          value={selectedBatch}
          onChange={(e) => { setSelectedBatch(e.target.value); setError(""); }}
          className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
        >
          <option value="">— Select Batch —</option>
          {batches.map((b: any) => (
            <option key={b._id} value={b._id}>
              {b.name}
              {b.start_date ? ` (${new Date(b.start_date).toLocaleDateString()})` : ""}
            </option>
          ))}
        </select>
        {error && <p className="text-[11px] text-rose-500 mt-2">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleConfirm}
            className="flex-1 py-2 rounded-lg bg-indigo-500 text-white text-sm hover:bg-indigo-600">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}