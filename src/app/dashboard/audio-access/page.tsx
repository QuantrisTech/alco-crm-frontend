"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Headphones, Eye, KeyRound } from "lucide-react";
import ProtectedRoute from "@/app/component/protected-route";
import PageHeader from "@/app/component/dashboard/page-header";
import DynamicTable from "@/app/component/dashboard/dynamic-table";
import Modal from "@/app/component/ui/model/modal";
import {
  adminGetAudioAccessRequests,
  // adminUpdateAudioPin,
  adminGetBatches,
  adminEnrollAudioProgram,
  adminRejectAudioProgram,
} from "@/utils/api";
import Select from "@/app/component/ui/select";

// ── Batch select modal (per-program enroll) ────────────────────
function EnrollBatchModal({ program, onConfirm, onClose, isLoading }: {
  program: { id: string; name: string };
  onConfirm: (batchId: string) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [selectedBatch, setSelectedBatch] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading: batchesLoading } = useQuery({
    queryKey: ["admin-batches-active"],
    queryFn: () => adminGetBatches({ status: "active" }).then((r) => r.data),
  });

  const batchOptions =
    data?.data?.map((b: any) => ({
      label: `${b.name}${b.start_date ? ` (${new Date(b.start_date).toLocaleDateString()})` : ""}`,
      value: b._id,
    })) || [];

  const handleConfirm = () => {
    if (!selectedBatch) {
      setError("Please select a batch");
      return;
    }
    onConfirm(selectedBatch);
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 min-h-[350px]">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Enroll in {program.name}</h3>
        <p className="text-[11px] text-gray-400 mb-4">Select an active batch to enroll this user.</p>

        {batchesLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Select
            label="Batch"
            placeholder="— Select Batch —"
            options={batchOptions}
            value={selectedBatch}
            onChange={(e: any) => { setSelectedBatch(e.target.value); setError(""); }}
            error={error}
          />
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} disabled={isLoading}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isLoading || !selectedBatch}
            className="flex-1 py-2 rounded-lg bg-teal-500 text-white text-sm hover:bg-teal-600 disabled:opacity-40 flex items-center justify-center gap-1.5">
            {isLoading
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enrolling...</>
              : "Enroll"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject reason modal (per-program reject) ───────────────────
function RejectReasonModal({ program, onConfirm, onClose, isLoading }: {
  program: { id: string; name: string };
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Please enter a reason");
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Reject {program.name}</h3>
        <p className="text-[11px] text-gray-400 mb-4">
          Provide a reason for rejecting this program request.
        </p>

        <textarea
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(""); }}
          placeholder="Reason for rejection..."
          rows={3}
          className="w-full border border-gray-200 text-gray-600 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-rose-400"
        />
        {error && <p className="text-[11px] text-rose-500 mt-2">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} disabled={isLoading}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isLoading}
            className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-sm hover:bg-rose-600 disabled:opacity-40 flex items-center justify-center gap-1.5">
            {isLoading
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Rejecting...</>
              : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AudioAccessAdminPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  // const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const [viewingRequest, setViewingRequest] = useState<any | null>(null);
  const [enrollingProgram, setEnrollingProgram] = useState<{ id: string; name: string } | null>(null);
  const [rejectingProgram, setRejectingProgram] = useState<{ id: string; name: string } | null>(null);

  // ── Fetch requests ──
  const { data, isLoading, isError } = useQuery({
    queryKey: ["audio-access-requests", statusFilter],
    queryFn: () =>
      adminGetAudioAccessRequests(statusFilter ? { status: statusFilter } : {}).then((r) => r.data),
  });

  // ── Update pin ──
  // const { mutate: updatePin, isPending: isUpdatingPin } = useMutation({
  //   mutationFn: (pin: string) => adminUpdateAudioPin(pin),
  //   onSuccess: () => {
  //     toast.success("Pin updated!");
  //     setIsPinModalOpen(false);
  //   },
  //   onError: (error: any) =>
  //     toast.error(error?.response?.data?.message || "Failed to update pin"),
  // });

  // ── Enroll in one program ──
  const { mutate: enrollProgram, isPending: isEnrolling } = useMutation({
    mutationFn: ({ recordId, programId, batchId }: any) =>
      adminEnrollAudioProgram(recordId, { programId, batchId }),
    onSuccess: (res) => {
      toast.success(res.data.message || "Enrolled successfully!");
      queryClient.invalidateQueries({ queryKey: ["audio-access-requests"] });
      setEnrollingProgram(null);

      setViewingRequest((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          programsRequested: prev.programsRequested.map((p: any) =>
            (typeof p.program === "object" ? p.program._id : p.program) === enrollingProgram?.id
              ? { ...p, isAlready: true, status: "enrolled" }
              : p
          ),
        };
      });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Enrollment failed"),
  });

  // ── Reject one program ──
  const { mutate: rejectProgram, isPending: isRejectingProgram } = useMutation({
    mutationFn: ({ recordId, programId, reason }: any) =>
      adminRejectAudioProgram(recordId, { programId, reason }),
    onSuccess: (res) => {
      toast.success(res.data.message || "Program rejected");
      queryClient.invalidateQueries({ queryKey: ["audio-access-requests"] });
      setRejectingProgram(null);

      setViewingRequest((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          programsRequested: prev.programsRequested.map((p: any) =>
            (typeof p.program === "object" ? p.program._id : p.program) === rejectingProgram?.id
              ? { ...p, status: "rejected" }
              : p
          ),
        };
      });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Failed to reject program"),
  });

  return (
    <ProtectedRoute>
      <PageHeader
        title="Audio File Access"
        subtitle="Review and manage audio access requests"
        titleIcon={<Headphones size={24} />}
        totalCount={data?.data?.length ?? 0}
        filters={{ status: statusFilter }}
        setFilters={(f: any) => setStatusFilter(f.status || "")}
        filterFields={[
          {
            type: "select",
            name: "status",
            placeholder: "All Status",
            options: [
              { label: "Pending", value: "pending" },
              { label: "Granted", value: "granted" },
              { label: "Rejected", value: "rejected" },
            ],
          },
        ]}
        // exportBtn={
        //   <button
        //     onClick={() => setIsPinModalOpen(true)}
        //     className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-400 text-sm text-gray-800 hover:bg-gray-50"
        //   >
        //     <KeyRound size={14} /> Change Pin
        //   </button>
        // }
      />

      <DynamicTable
        data={data?.data || []}
        isLoading={isLoading}
        isError={isError}
        columns={[
          {
            key: "name",
            label: "Name",
            render: (r) => (
              <div>
                <p className="font-medium text-gray-800">
                  {r.first_name} {r.last_name}
                </p>
                <p className="text-xs text-gray-400">{r.email}</p>
                {r.isAlready === true && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                    Already Registered
                  </span>
                )}
              </div>
            ),
          },
          {
            key: "phone",
            label: "Phone",
            render: (r) => <span className="text-gray-500">{r.phone || "—"}</span>,
          },
          {
            key: "programsRequested",
            label: "Requested",
            render: (r) => (
              <div className="flex flex-col gap-1">
                {r.programsRequested?.map((p: any) => {
                  const name = typeof p.program === "object" ? p.program?.name : p.program;
                  const id = typeof p.program === "object" ? p.program?._id : p.program;
                  return (
                    <span
                      key={id}
                      title={p.rejectReason || undefined}
                      className={`px-2 py-0.5 rounded-full text-xs w-fit ${p.status === "enrolled" || p.isAlready === true ? "bg-blue-100 text-blue-700"
                        : p.status === "rejected" ? "bg-rose-100 text-rose-700"
                          : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {name}
                      {p.status === "enrolled" || p.isAlready === true && " (enrolled)"}
                      {p.status === "rejected" && " (rejected)"}
                    </span>
                  );
                })}
              </div>
            ),
          },
          {
            key: "createdAt",
            label: "Requested On",
            render: (r) => (
              <span className="text-gray-400 text-sm">
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            ),
          },
        ]}
        actions={[
          {
            icon: <Eye size={14} />,
            label: "View",
            onClick: (r) => setViewingRequest(r),
            className: "hover:bg-teal-50 hover:text-teal-600",
          },
        ]}
      />

      {/* Program access modal — per-program Enroll / Reject */}
      {viewingRequest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Program Access</h2>
            <p className="text-sm text-gray-400 mb-4">
              {viewingRequest.first_name} {viewingRequest.last_name} — {viewingRequest.email}
            </p>

            <div className="space-y-2 mb-6">
              {viewingRequest.programsRequested.map((p: any) => {
                const programId = typeof p.program === "object" ? p.program._id : p.program;
                const programName = typeof p.program === "object" ? p.program.name : programId;

                return (
                  <div key={programId} className="flex flex-col  gap-2 border rounded-lg px-3 py-2">
                    <div className="flex flex-col gap-1">
                      {p.isAlready === true && (
                        <p className="px-2 py-0.5 w-16 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                          Enrolled
                        </p>
                      )}
                      <p className="text-sm text-gray-700">{programName}</p>
                    </div>
                    {!p.isAlready && (
                      <div className="flex items-center gap-1.5 ms-auto">
                        <button
                          type="button"
                          onClick={() => setEnrollingProgram({ id: programId, name: programName })}
                          className="px-3 py-1 rounded-md text-xs font-medium bg-teal-500 text-white hover:bg-teal-600"
                        >
                          Access
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingProgram({ id: programId, name: programName })}
                          className="px-3 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {/* {p.isAlready ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                        Already Enrolled
                      </span>
                    ) : p.status === "rejected" ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-700"
                        title={p.rejectReason}
                      >
                        Rejected
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEnrollingProgram({ id: programId, name: programName })}
                          className="px-3 py-1 rounded-md text-xs font-medium bg-teal-500 text-white hover:bg-teal-600"
                        >
                          Access
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingProgram({ id: programId, name: programName })}
                          className="px-3 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100"
                        >
                          Reject
                        </button>
                      </div>
                    )} */}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setViewingRequest(null)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Batch select popup */}
      {enrollingProgram && (
        <EnrollBatchModal
          program={enrollingProgram}
          isLoading={isEnrolling}
          onClose={() => setEnrollingProgram(null)}
          onConfirm={(batchId) =>
            enrollProgram({ recordId: viewingRequest!._id, programId: enrollingProgram.id, batchId })
          }
        />
      )}

      {/* Reject reason popup */}
      {rejectingProgram && (
        <RejectReasonModal
          program={rejectingProgram}
          isLoading={isRejectingProgram}
          onClose={() => setRejectingProgram(null)}
          onConfirm={(reason) =>
            rejectProgram({ recordId: viewingRequest!._id, programId: rejectingProgram.id, reason })
          }
        />
      )}

      {/* Change Pin Modal */}
      {/* <Modal
        key={isPinModalOpen ? "open" : "closed"}
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Change Access Pin"
        fields={[
          { name: "pin", label: "New Pin", type: "input", inputType: "text", placeholder: "Enter new pin (min 4 digits)" },
        ]}
        onSubmit={(data) => updatePin(data.pin as string)}
        isLoading={isUpdatingPin}
        mode="add"
      /> */}
    </ProtectedRoute>
  );
}

