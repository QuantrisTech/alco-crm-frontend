"use client";
import { useState, useRef, useEffect } from "react";
import { SelectProps } from "@/types/ui";

export default function Select({ label, options, error, value, bg, placeholder = "Select option", onChange }: SelectProps & { bg?: string; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const errorMessage = typeof error === "string" ? error : error?.message;

  return (
    <div ref={ref}>
      {label && (
      <label className="text-sm font-medium text-gray-700 mb-1 block">
        {label}
      </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full px-4 py-2.5 rounded-lg border text-sm text-left transition
            ${!value ? "text-gray-400" : "text-gray-700"}
            ${errorMessage ? "border-red-400" : "border-gray-200 focus:border-yellow-400"} ${bg}
          `}
        >
          {selectedLabel}
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange?.({ target: { value: opt.value } } as any);
                  setOpen(false);
                }}
                className={`px-4 py-2 text-sm cursor-pointer text-gray-500 hover:bg-yellow-50
                  ${opt.disabled ? "opacity-50 cursor-not-allowed" : ""}
                  ${value === opt.value ? "bg-yellow-50 text-yellow-600 font-medium" : ""}
                `}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
}