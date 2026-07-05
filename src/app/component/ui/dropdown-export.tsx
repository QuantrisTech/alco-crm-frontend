"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, ChevronDown, Mail, Check } from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { getAdminRecipients } from "@/utils/api";

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

interface ExportDropdownProps {
  filename: string;
  fetchData: () => Promise<any[]>;
  columns: { header: string; key: string; format?: (val: any) => string }[];
  filters?: any;
  selectedIds?: string[]; // ← ye add karo
  onEmailSend: (body: { recipientMode: "specific"; recipientIds: string[]; filters?: any }) => Promise<any>;
  label?: string;
}

export default function ExportDropdown({
  filename, fetchData, columns, filters, selectedIds = [], onEmailSend, label = "Export",
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "admins">("menu");
  const [downloading, setDownloading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const { data: admins, isLoading: adminsLoading } = useQuery({
    queryKey: ["admin-recipients"],
    queryFn: () => getAdminRecipients().then((r) => r.data.data),
    enabled: open,
  });

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setView("menu");
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const data = await fetchData();
      if (!data?.length) { toast.error("No data to export"); return; }
      const rows = data.map((item) => {
        const row: Record<string, any> = {};
        columns.forEach((col) => {
          const raw = getNestedValue(item, col.key);
          row[col.header] = col.format ? col.format(raw) : (raw ?? "—");
        });
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = columns.map((col) => ({ wch: Math.max(col.header.length + 4, 16) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, filename);
      XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split("T")[0]}.xlsx`);
      setOpen(false);
    } catch {
      toast.error("Export failed");
    } finally {
      setDownloading(false);
    }
  };

  // single admin ko email bhejo
  const handleSendToAdmin = async (admin: any) => {
    setSendingId(admin._id);
    try {
      await onEmailSend({
        recipientMode: "specific",
        recipientIds: [admin._id],
        filters,
      });
      toast.success(`Report "${admin.name}" ko bhej di gayi ✅`);
      setOpen(false);
      setView("menu");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Email send nahi hui ❌");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-gray-400 text-gray-600 text-sm font-medium rounded-lg transition-colors shadow-sm"
      >
        <Download size={14} />
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">

          {/* ── Menu view ── */}
          {view === "menu" && (
            <>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Download Excel
              </button>
              <button
                onClick={() => setView("admins")}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-50"
              >
                <Mail size={14} />
                Email Report to Admin
              </button>
            </>
          )}

          {/* ── Admins list view ── */}
          {view === "admins" && (
            <div>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50">
                <button onClick={() => setView("menu")} className="text-gray-400 hover:text-gray-600">
                  ←
                </button>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Select Admin
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto">
                {adminsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  </div>
                ) : !admins?.length ? (
                  <p className="text-xs text-gray-400 text-center py-6">No admins found</p>
                ) : (
                  admins.map((a: any) => (
                    <button
                      key={a._id}
                      onClick={() => handleSendToAdmin(a)}
                      disabled={!!sendingId}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-yellow-50 border-b border-gray-50 last:border-0 disabled:opacity-60 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{a.name}</p>
                        <p className="text-[10px] text-gray-400 capitalize">
                          {a.role.replace("_", " ")} · {a.email}
                        </p>
                      </div>
                      {sendingId === a._id ? (
                        <Loader2 size={13} className="animate-spin text-yellow-500" />
                      ) : (
                        <Mail size={13} className="text-gray-300 group-hover:text-yellow-500" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}