"use client";

interface Installment {
  label: string;
  dueDate?: string;
  amount: number;
  status: "paid" | "pending";
}

interface ViewPaymentPlanModalProps {
  lead: any;
  onClose: () => void;
}

export default function ViewPaymentPlanModal({ lead, onClose }: ViewPaymentPlanModalProps) {
  if (!lead) return null;

  const plan = lead.paymentPlan;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Payment Plan</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Amount</span>
            <span className="font-semibold text-gray-400">
              Rs {plan?.totalAmount?.toLocaleString() || "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Advance</span>
            <span className="font-semibold text-gray-400">
              Rs {plan?.advanceAmount?.toLocaleString() || "—"}
            </span>
          </div>
          {plan?.advanceDueDate && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Advance Due</span>
              <span className="text-gray-500">
                {new Date(plan.advanceDueDate).toLocaleDateString("en-PK")}
              </span>
            </div>
          )}
        </div>

        {plan?.installments?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Installments</p>
            {plan.installments.map((inst: Installment, i: number) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                  inst.status === "paid"
                    ? "bg-green-50 border border-green-100"
                    : "bg-gray-50 border border-gray-100"
                }`}
              >
                <div>
                  <p className="text-xs font-medium text-gray-700">{inst.label}</p>
                  {inst.dueDate && (
                    <p className="text-[10px] text-gray-400">
                      {new Date(inst.dueDate).toLocaleDateString("en-PK")}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-700">
                    Rs {inst.amount?.toLocaleString()}
                  </p>
                  <p
                    className={`text-[10px] font-medium ${
                      inst.status === "paid" ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {inst.status === "paid" ? "✓ Paid" : "Pending"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {plan?.notes && (
          <p className="text-xs text-gray-400 mt-3 italic">{plan.notes}</p>
        )}
      </div>
    </div>
  );
}