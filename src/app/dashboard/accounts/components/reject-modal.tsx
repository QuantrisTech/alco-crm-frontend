"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  rejectExpense,
} from "@/utils/api";
import {
  Loader2,
} from "lucide-react";

export default function RejectModal({ expenseId, onClose }: { expenseId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () => rejectExpense(expenseId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses-list"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">Reject Expense</h3>
        <textarea
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 resize-none"
          placeholder="Reason for rejection..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button
            onClick={() => mutate()}
            disabled={isPending || !reason.trim()}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-lg disabled:opacity-60 flex items-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}