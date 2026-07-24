"use client";
import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";
import AppDatePicker from "@/app/component/ui/app-date-picker";

// ── Presets ───────────────────────────────────────────────────
export function getPresetRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "this_week": {
      const day = now.getDay();
      const mon = new Date(now);
      mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      return { from: fmt(mon), to: fmt(now) };
    }
    case "this_month": {
      return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmt(now) };
    }
    case "last_month": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmt(from), to: fmt(to) };
    }
    case "this_quarter": {
      const q    = Math.floor(now.getMonth() / 3);
      const from = new Date(now.getFullYear(), q * 3, 1);
      return { from: fmt(from), to: fmt(now) };
    }
    case "this_year": {
      return { from: fmt(new Date(now.getFullYear(), 0, 1)), to: fmt(now) };
    }
    case "last_year": {
      return {
        from: fmt(new Date(now.getFullYear() - 1, 0, 1)),
        to:   fmt(new Date(now.getFullYear() - 1, 11, 31)),
      };
    }
    default:
      return { from: "", to: "" };
  }
}

const PRESETS = [
  { key: "all", label: "All Time" },
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_quarter", label: "This Quarter" },
  { key: "this_year", label: "This Year" },
  { key: "last_year", label: "Last Year" },
  { key: "custom", label: "Custom Range" },
];

interface DateRangeFilterProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export default function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const applyPreset = (key: string) => {
    setPreset(key);
    if (key === "all") {
      onChange("", "");
      setOpen(false);
    } else if (key !== "custom") {
      const range = getPresetRange(key);
      onChange(range.from, range.to);
      setOpen(false);
    }
  };

  const applyCustom = () => {
    if (customFrom && customTo) {
      onChange(customFrom, customTo);
      setOpen(false);
    }
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreset("all");
    setCustomFrom("");
    setCustomTo("");
    onChange("", "");
  };

  const hasFilter = from || to;
  const activeLabel = hasFilter
    ? preset === "custom"
      ? `${from} → ${to}`
      : PRESETS.find(p => p.key === preset)?.label || "Filtered"
    : "All Time";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${hasFilter
            ? "bg-yellow-50 border-yellow-300 text-yellow-700"
            : "bg-white border-gray-200 text-gray-600 hover:border-yellow-400"
          }`}
      >
        <Calendar size={14} />
        {activeLabel}
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        {hasFilter && (
          <span onClick={clear} className="ml-1 hover:text-rose-500">
            <X size={12} />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-xl shadow-xl z-50 w-56 overflow-hidden">
          <div className="p-2">
            {PRESETS.filter(p => p.key !== "custom").map((p) => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${preset === p.key
                    ? "bg-yellow-50 text-yellow-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom */}
          <div className="border-t border-gray-100 p-3">
            <button
              onClick={() => setPreset("custom")}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg mb-2 flex items-center gap-2 transition-colors ${preset === "custom"
                  ? "bg-yellow-50 text-yellow-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              <Calendar size={13} /> Custom Range
            </button>

            {preset === "custom" && (
              <div className="space-y-2 px-1">
                <AppDatePicker
                  label="From"
                  value={customFrom}
                  onChange={(value) => setCustomFrom(value)}
                  max={customTo || undefined}
                />
                <AppDatePicker
                  label="To"
                  value={customTo}
                  onChange={(value) => setCustomTo(value)}
                  min={customFrom || undefined}
                />
                <button
                  onClick={applyCustom}
                  disabled={!customFrom || !customTo}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-semibold py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}