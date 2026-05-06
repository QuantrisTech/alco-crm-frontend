// import { SelectProps } from "@/types/ui";


// export default function Select({ label, options, error, ...props }: SelectProps) {
//   return (
//     <div>
//       <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
//       <select
//         {...props}
//         className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 outline-none transition
//           ${error ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-yellow-400"}`}
//       >
//         {options.map((opt) => (
//           <option key={opt.value} value={opt.value} disabled={opt.disabled} className={opt.disabled ? "text-gray-400 cursor-not-allowed" : "cursor-pointer"}>
//             {opt.label}
//           </option>
//         ))}
//       </select>
//       {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
//     </div>
//   );
// }

"use client";
import { useState, useRef, useEffect } from "react";
import { SelectProps } from "@/types/ui";

export default function Select({ label, options, error, value, onChange }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Selected label find karo
  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || "Select program";

  // outside click close
  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (!ref.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref}>
      <label className="text-sm font-medium text-gray-700 mb-1 block">
        {label}
      </label>

      <div className="relative">
        {/* Button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full px-4 py-2.5 rounded-lg border text-gray-500 text-sm text-left transition
            ${error ? "border-red-400" : "border-gray-200 focus:border-yellow-400"}
          `}
        >
          {selectedLabel}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange?.({
                    target: { value: opt.value },
                  } as any); // 👈 mimic native event
                  setOpen(false);
                }}
                className={`px-4 py-2 text-sm cursor-pointer text-gray-500 hover:bg-yellow-50
                  ${opt.disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-1">{error.message}</p>
      )}
    </div>
  );
}