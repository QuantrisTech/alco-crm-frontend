"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Megaphone,
} from "lucide-react";
import Select from "@/app/component/ui/select";
import { getNamesPrograms, previewBulkLeads, confirmBulkLeads } from "@/utils/api";
import toast from "react-hot-toast";

interface Program {
  _id: string;
  name: string;
  price: number;
}

interface AdSource {
  platform?: string;
  externalLeadId?: string | null;
  adId?: string | null;
  adName?: string | null;
  adsetId?: string | null;
  adsetName?: string | null;
  campaignId?: string | null;
  campaignName?: string | null;
  formId?: string | null;
  formName?: string | null;
  isOrganic?: boolean;
  createdTime?: string | null;
}

interface PreviewRow {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string | null;
  status: "eligible" | "duplicate" | "program_not_found";
  programId?: string | null;
  programName?: string | null;
  requestedProgramName?: string;
  opportunityValue?: number;
  nationality?: string;
  profession?: string;
  city?: string;
  source?: string;
  quality?: string;
  adSource?: AdSource | null;
  existingUser?: { name: string } | null;
  existingLeadId?: string;
}

interface PreviewResponse {
  isFacebookFormat: boolean;
  totalRows: number;
  eligibleCount: number;
  duplicateCount: number;
  programNotFoundCount: number;
  preview: PreviewRow[];
  availablePrograms: Program[];
}

function StatusBadge({ status }: { status: PreviewRow["status"] }) {
  const map = {
    eligible: { label: "Eligible", cls: "bg-green-100 text-green-700", icon: <CheckCircle2 size={12} /> },
    duplicate: { label: "Already Exists", cls: "bg-yellow-100 text-yellow-700", icon: <AlertTriangle size={12} /> },
    program_not_found: { label: "Program Not Found", cls: "bg-rose-100 text-rose-700", icon: <XCircle size={12} /> },
  };
  const conf = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${conf.cls}`}>
      {conf.icon}
      {conf.label}
    </span>
  );
}

export default function LeadImportButton({ queryKey = "admin-leads" }: { queryKey?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "review">("upload");

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [defaultProgramId, setDefaultProgramId] = useState("");

  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [isFacebookFormat, setIsFacebookFormat] = useState(false);
  const [availablePrograms, setAvailablePrograms] = useState<Program[]>([]);
  const [removedEmails, setRemovedEmails] = useState<Set<string>>(new Set());
  const [confirmedEmails, setConfirmedEmails] = useState<Set<string>>(new Set());
  const [programChoiceMap, setProgramChoiceMap] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  const { data: programs = [] } = useQuery({
    queryKey: ["program-names"],
    queryFn: getNamesPrograms,
  });

  const handleClose = () => {
    setIsOpen(false);
    setStep("upload");
    setFile(null);
    setDefaultProgramId("");
    setRows([]);
    setAvailablePrograms([]);
    setRemovedEmails(new Set());
    setConfirmedEmails(new Set());
    setProgramChoiceMap({});
  };

  const handleFileSelect = (selected: File | null) => {
    if (!selected) return;
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(selected.type)) {
      alert("Sirf Excel file (.xlsx/.xls) allow hai");
      return;
    }
    setFile(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileSelect(dropped);
  };

  const previewMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("file", file as File);
      if (defaultProgramId) formData.append("defaultProgramId", defaultProgramId);
      const res = await previewBulkLeads(formData);
      return res.data as PreviewResponse;
    },
    onSuccess: (data) => {
      setRows(data.preview);
      setIsFacebookFormat(data.isFacebookFormat);
      setAvailablePrograms(data.availablePrograms);
      const defaults: Record<string, string> = {};
      data.preview.forEach((r) => {
        if (r.programId) defaults[r.email] = r.programId;
      });
      setProgramChoiceMap(defaults);
      setStep("review");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Preview failed");
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (
      payload: {
        firstName: string; lastName?: string; email: string; phone?: string | null;
        programId?: string | null; nationality?: string; profession?: string; city?: string;
        source?: string; quality?: string; adSource?: AdSource | null;
      }[]
    ) => {
      const res = await confirmBulkLeads(payload);
      return res.data;
    },
    onSuccess: (data, variables) => {
      const confirmedNow = new Set(confirmedEmails);
      variables.forEach((v) => confirmedNow.add(v.email));
      setConfirmedEmails(confirmedNow);
      toast.success(`${data.createdCount} lead(s) created, ${data.skippedCount} skipped`);
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ["admin-leads-kanban"] });
      queryClient.invalidateQueries({ queryKey: ["admin-leads-stats"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Lead creation failed");
    },
  });

  const visibleRows = rows.filter((r) => !removedEmails.has(r.email));
  const isRowReady = (row: PreviewRow) => {
    if (row.status === "duplicate") return false;
    if (row.status === "program_not_found") return !!programChoiceMap[row.email];
    return true;
  };
  const readyUnconfirmedRows = visibleRows.filter((r) => isRowReady(r) && !confirmedEmails.has(r.email));

  const removeRow = (email: string) => {
    setRemovedEmails((prev) => new Set(prev).add(email));
  };

  const buildRowPayload = (row: PreviewRow) => ({
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    programId: programChoiceMap[row.email] || row.programId || null,
    nationality: row.nationality,
    profession: row.profession,
    city: row.city,
    source: row.source,
    quality: row.quality,
    adSource: row.adSource || null,
  });

  const confirmSingleRow = (row: PreviewRow) => {
    if (!isRowReady(row)) {
      toast.error("Pehle program select karein");
      return;
    }
    confirmMutation.mutate([buildRowPayload(row)]);
  };

  const confirmAll = () => {
    const payload = readyUnconfirmedRows.map((r) => buildRowPayload(r));
    if (payload.length === 0) {
      toast.error("No ready rows to confirm");
      return;
    }
    confirmMutation.mutate(payload);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-gray-400 hover:text-gray-600 text-gray-600 text-sm font-medium rounded-lg transition-colors shadow-sm"
        title="Bulk import leads from Excel"
      >
        <Upload size={14} />
        Import Leads
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Bulk Import Leads</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {step === "upload"
                    ? "Excel se naye leads bulk mein banayein — Facebook ad-export ya manual list, dono support hain"
                    : "Review karein — agar program match nahi hua to manually select karein"}
                </p>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>

            {/* ── STEP 1: UPLOAD ─────────────────────────────────────── */}
            {step === "upload" && (
              <>
                <div className="p-6 space-y-4 overflow-y-auto">
                  <Select
                    label="Program (agar file mein per-row Program column na ho, ye sabpar apply hoga)"
                    placeholder="— Select Program —"
                    value={defaultProgramId}
                    options={programs.map((p: any) => ({ label: p.name, value: p._id }))}
                    onChange={(e) => setDefaultProgramId(e.target.value)}
                  />

                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${dragActive ? "border-yellow-400 bg-yellow-50" : "border-gray-200"
                      }`}
                    onClick={() => document.getElementById("lead-import-file-input")?.click()}
                  >
                    <input
                      id="lead-import-file-input"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    />
                    {file ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileSpreadsheet className="text-green-600" size={28} />
                        <p className="text-sm font-medium text-gray-700">{file.name}</p>
                        <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <UploadCloud size={28} />
                        <p className="text-sm">Click ya drag karke file yahan drop karein</p>
                        <p className="text-xs">.xlsx ya .xls</p>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 space-y-2">
                    <p>
                      <strong>Do formats support hain</strong> — automatically detect ho jayega:
                    </p>
                    <p className="font-mono text-[11px] bg-gray-50 p-2 rounded border border-gray-200 leading-relaxed">
                      <strong>Facebook/Meta ad export:</strong> id, created_time, ad_id, ad_name, adset_id,
                      adset_name, campaign_id, campaign_name, form_id, form_name, is_organic, platform,
                      full_name, job_title, email, phone_number, city
                    </p>
                    <p className="font-mono text-[11px] bg-gray-50 p-2 rounded border border-gray-200 leading-relaxed">
                      <strong>Manual list:</strong> First Name, Last Name, Email, Phone, Program, Nationality,
                      Profession, Source, Quality
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-6 border-t shrink-0">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => previewMutation.mutate()}
                    disabled={!file || previewMutation.isPending}
                    className="flex-1 py-2.5 rounded-lg bg-yellow-400 text-white text-sm font-medium hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {previewMutation.isPending ? "Checking..." : "Preview"}
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 2: REVIEW ─────────────────────────────────────── */}
            {step === "review" && (
              <>
                <div className="px-6 pt-4 flex flex-wrap gap-2 shrink-0">
                  {isFacebookFormat && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                      <Megaphone size={11} /> Facebook Ad Export
                    </span>
                  )}
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                    {readyUnconfirmedRows.length} ready
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                    {visibleRows.filter((r) => r.status === "duplicate").length} already exist
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-700">
                    {visibleRows.filter((r) => r.status === "program_not_found").length} program not matched
                  </span>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-2">
                  {visibleRows.map((row) => {
                    const isConfirmed = confirmedEmails.has(row.email);
                    const ready = isRowReady(row);

                    return (
                      <div
                        key={row.email}
                        className={`border rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap ${isConfirmed ? "bg-green-50 border-green-200" : "border-gray-200"
                          }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {row.firstName} {row.lastName}
                            </p>
                            <StatusBadge status={isConfirmed ? "eligible" : row.status} />
                            {isConfirmed && (
                              <span className="text-[10px] text-green-700 font-medium">Confirmed ✓</span>
                            )}
                            {row.existingUser && (
                              <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                Existing user: {row.existingUser.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            {row.email} {row.phone ? `· ${row.phone}` : ""} {row.city ? `· ${row.city}` : ""}
                          </p>

                          {row.status === "eligible" && row.programName && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Program: <span className="font-medium">{row.programName}</span>
                              {row.opportunityValue ? ` · Rs ${row.opportunityValue.toLocaleString()}` : ""}
                            </p>
                          )}

                          {row.status === "duplicate" && (
                            <p className="text-xs text-yellow-700 mt-0.5">
                              {row.programName} ke liye lead already exist karti hai
                            </p>
                          )}

                          {row.status === "program_not_found" && (
                            <div className="mt-2 max-w-xs">
                              <p className="text-[10px] text-rose-600 mb-1">
                                {row.requestedProgramName ? `"${row.requestedProgramName}" match nahi hua` : "Program nahi mila"} — manually select karein:
                              </p>
                              <Select
                                placeholder="Program choose karein"
                                value={programChoiceMap[row.email] || ""}
                                options={availablePrograms.map((p) => ({ label: p.name, value: p._id }))}
                                onChange={(e) =>
                                  setProgramChoiceMap((prev) => ({ ...prev, [row.email]: e.target.value }))
                                }
                              />
                            </div>
                          )}

                          {row.adSource && (
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                {row.adSource.campaignName || "Campaign"}
                              </span>
                              <span className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">
                                {row.adSource.adName || row.adSource.formName}
                              </span>
                            </div>
                          )}
                        </div>

                        {ready && !isConfirmed && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => confirmSingleRow(row)}
                              disabled={confirmMutation.isPending}
                              className="px-2.5 py-1.5 text-xs rounded bg-teal-100 text-teal-700 hover:bg-teal-200 transition disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => removeRow(row.email)}
                              className="px-2.5 py-1.5 text-xs rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        {!ready && (
                          <button
                            onClick={() => removeRow(row.email)}
                            className="px-2.5 py-1.5 text-xs rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition shrink-0"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {visibleRows.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">Koi rows nahi bachi.</p>
                  )}
                </div>

                <div className="flex gap-3 p-6 border-t shrink-0">
                  <button
                    onClick={() => setStep("upload")}
                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={confirmAll}
                    disabled={readyUnconfirmedRows.length === 0 || confirmMutation.isPending}
                    className="flex-1 py-2.5 rounded-lg bg-yellow-400 text-white text-sm font-medium hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {confirmMutation.isPending
                      ? "Creating..."
                      : `Confirm All (${readyUnconfirmedRows.length})`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}