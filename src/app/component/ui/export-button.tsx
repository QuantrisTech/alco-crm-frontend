// components/ui/ExportButton.tsx
"use client";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

interface ExportButtonProps {
  filename: string;           // e.g. "invoices", "expenses"
  fetchData: () => Promise<any[]>; // function jo data fetch kare
  columns: {
    header: string;           // Column heading in Excel
    key: string;              // dot notation supported e.g. "user.name"
    format?: (val: any) => string; // optional formatter
  }[];
  label?: string;
}

// Dot notation support: getNestedValue(obj, "user.name")
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

export default function ExportButton({
  filename,
  fetchData,
  columns,
  label = "Export",
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);

      const data = await fetchData();

      if (!data || data.length === 0) {
        alert("No data to export");
        return;
      }

      // Build rows
      const rows = data.map((item) => {
        const row: Record<string, any> = {};
        columns.forEach((col) => {
          const raw = getNestedValue(item, col.key);
          row[col.header] = col.format ? col.format(raw) : (raw ?? "—");
        });
        return row;
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(rows);

      // Column widths — auto based on header length
      ws["!cols"] = columns.map((col) => ({
        wch: Math.max(col.header.length + 4, 16),
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, filename);

      // Download
      const date = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `${filename}-${date}.xlsx`);
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-gray-400 hover:text-gray-600 text-gray-600 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 shadow-sm"
      title={`Export to Excel`}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Download size={14} />
      )}
      {label}
    </button>
  );
}