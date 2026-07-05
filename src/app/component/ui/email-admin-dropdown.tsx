// components/ui/email-admin-dropdown.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Loader2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { getAdminRecipients } from "@/utils/api";

interface Props {
  filters?: any;
  selectedIds?: string[];
  onEmailSend: (body: any) => Promise<any>;
}

export default function EmailAdminDropdown({ filters, selectedIds = [], onEmailSend }: Props) {
  const [open, setOpen] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const { data: admins, isLoading } = useQuery({
    queryKey: ["admin-recipients"],
    queryFn: () => getAdminRecipients().then((r) => r.data.data),
    enabled: open,
  });

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleSend = async (admin: any) => {
    setSendingId(admin._id);
    try {
      await onEmailSend({
        recipientMode: "specific",
        recipientIds: [admin._id],
        ...(selectedIds.length > 0 ? { invoiceIds: selectedIds } : { filters }),
      });
      toast.success(`"${admin.name}" ko report bhej di ✅`);
      setOpen(false);
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
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-gray-400 text-gray-600 text-sm font-medium rounded-lg shadow-sm transition-colors"
      >
        <Mail size={14} />
        Email Report
        {selectedIds.length > 0 && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
            {selectedIds.length}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-60 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Select Admin</span>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-6"><Loader2 size={16} className="animate-spin text-gray-400" /></div>
            ) : !admins?.length ? (
              <p className="text-xs text-gray-400 text-center py-6">No admins found</p>
            ) : (
              admins.map((a: any) => (
                <button
                  key={a._id}
                  onClick={() => handleSend(a)}
                  disabled={!!sendingId}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-yellow-50 border-b border-gray-50 last:border-0 disabled:opacity-60 transition-colors"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">{a.name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{a.role.replace("_", " ")} · {a.email}</p>
                  </div>
                  {sendingId === a._id
                    ? <Loader2 size={13} className="animate-spin text-yellow-500" />
                    : <Mail size={13} className="text-gray-300" />
                  }
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}