// "use client";

// import React, { useEffect, useRef, useState } from "react";

// interface AppDatePickerProps {
//   value: string; // always YYYY-MM-DD (ISO), same as before
//   onChange: (value: string) => void;
//   label?: string;
//   required?: boolean;
//   min?: string;
//   max?: string;
//   error?: string;
//   className?: string;
//   disabled?: boolean;
// }

// // Try to parse a pasted string into a YYYY-MM-DD value.
// // Supports YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, MM/DD/YYYY (ambiguous cases
// // favor DD-MM since that's the common local format), and a loose fallback
// // via the native Date parser (e.g. "23 Jul 2026").
// function parsePastedDate(raw: string): string | null {
//   const text = raw.trim();

//   // YYYY-MM-DD or YYYY/MM/DD
//   let m = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
//   if (m) {
//     const [, y, mo, d] = m;
//     return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
//   }

//   // DD-MM-YYYY or DD/MM/YYYY (also covers MM/DD/YYYY when month <= 12 by
//   // just checking bounds — if the first number is > 12 it must be the day)
//   m = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
//   if (m) {
//     const [, a, b, y] = m;
//     const first = parseInt(a, 10);
//     const second = parseInt(b, 10);
//     // If first > 12, it can only be a day -> DD-MM-YYYY
//     // Otherwise default to DD-MM-YYYY (local convention)
//     let day = a;
//     let month = b;
//     if (first > 12 && second <= 12) {
//       day = a;
//       month = b;
//     } else if (second > 12 && first <= 12) {
//       day = b;
//       month = a;
//     }
//     return `${y}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
//   }

//   // Fallback: native Date parser (e.g. "23 Jul 2026", "Jul 23, 2026")
//   const parsed = new Date(text);
//   if (!isNaN(parsed.getTime())) {
//     const y = parsed.getFullYear();
//     const mo = String(parsed.getMonth() + 1).padStart(2, "0");
//     const d = String(parsed.getDate()).padStart(2, "0");
//     return `${y}-${mo}-${d}`;
//   }

//   return null;
// }

// function toDisplay(value: string): string {
//   if (!value) return "";
//   const [y, m, d] = value.split("-");
//   if (!y || !m || !d) return "";
//   return `${m}/${d}/${y}`; // mm/dd/yyyy, matches the native date input look
// }

// export default function AppDatePicker({
//   value,
//   onChange,
//   label,
//   required = false,
//   min,
//   max,
//   error,
//   className = "",
//   disabled = false,
// }: AppDatePickerProps) {
//   const hiddenDateRef = useRef<HTMLInputElement>(null);
//   const [displayValue, setDisplayValue] = useState(toDisplay(value));

//   // Keep the visible text in sync whenever the value changes from outside
//   // (e.g. parent resets the form, or the native calendar picks a date).
//   useEffect(() => {
//     setDisplayValue(toDisplay(value));
//   }, [value]);

//   // Chrome/Edge don't support pasting into <input type="date"> at all, so we
//   // open the real native date input (for its calendar UI) whenever the
//   // visible text field is focused or clicked.
//   const openCalendar = () => {
//     const el = hiddenDateRef.current;
//     if (!el || disabled) return;
//     // .click() on a hidden input, triggered from a real user gesture on the
//     // visible field, reliably opens the native date picker across browsers.
//     el.click();
//   };

//   const applyParsedDate = (parsedValue: string) => {
//     if (min && parsedValue < min) return;
//     if (max && parsedValue > max) return;
//     onChange(parsedValue);
//     setDisplayValue(toDisplay(parsedValue));
//   };

//   const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
//     e.preventDefault();
//     const text = e.clipboardData.getData("text");
//     const parsedValue = parsePastedDate(text);
//     if (parsedValue) applyParsedDate(parsedValue);
//   };

//   return (
//     <div className={`space-y-1.5 ${className}`}>
//       {label && (
//         <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
//           {label}
//           {required && <span className="text-rose-500 ml-1">*</span>}
//         </label>
//       )}

//       <div className="relative">
//         {/* Visible field: plain text so paste always works, and shows the
//             same mm/dd/yyyy look as the native date input. */}
//         <input
//           type="text"
//           value={displayValue}
//           placeholder="mm/dd/yyyy"
//           readOnly
//           disabled={disabled}
//           onFocus={openCalendar}
//           onClick={openCalendar}
//           onPaste={handlePaste}
//           onKeyDown={(e) => {
//             // Block manual typing but keep paste (Ctrl/Cmd+V) working.
//             const isPasteShortcut =
//               (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v";
//             if (!isPasteShortcut) e.preventDefault();
//           }}
//           className={`
//             w-full
//             rounded-lg
//             border
//             px-3
//             py-2
//             text-xs
//             bg-white
//             text-slate-700
//             focus:outline-none
//             focus:ring-2
//             focus:ring-slate-300
//             ${error ? "border-rose-300 focus:ring-rose-300" : "border-slate-200"}
//             ${disabled ? "bg-slate-100 cursor-not-allowed" : "cursor-pointer"}
//           `}
//         />

//         {/* Hidden native date input: invisible, but it's the one that
//             actually opens the real calendar UI and receives the selection
//             when the user picks a date from it. */}
//         <input
//           ref={hiddenDateRef}
//           type="date"
//           value={value}
//           min={min}
//           max={max}
//           disabled={disabled}
//           tabIndex={-1}
//           onChange={(e) => applyParsedDate(e.target.value)}
//           className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
//         />
//       </div>

//       {error && <p className="text-[10px] text-rose-500 font-medium">{error}</p>}
//     </div>
//   );
// }

"use client";

import React, { useMemo } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";

interface AppDatePickerProps {
  value: string; // YYYY-MM-DD (ISO), same as before
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  min?: string;
  max?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  textFormat?: string
}

// Format a JS Date as YYYY-MM-DD without timezone shifting.
function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Parses many common formats a person might type or paste, and returns a
// real Date object (or null). Used as flatpickr's parseDate so the calendar
// updates live as soon as a recognizable date is entered, not just on a
// fixed format.
function parseFlexibleDate(raw: string): Date | null {
  const text = (raw || "").trim();
  if (!text) return null;

  // YYYY-MM-DD or YYYY/MM/DD
  let m = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d));
    return isNaN(dt.getTime()) ? null : dt;
  }

  // D-M-YYYY or D/M/YYYY (also covers M/D/YYYY — if one part is > 12 it
  // must be the day)
  m = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    const [, a, b, y] = m;
    const first = parseInt(a, 10);
    const second = parseInt(b, 10);
    let day = first;
    let month = second;
    if (first > 12 && second <= 12) {
      day = first;
      month = second;
    } else if (second > 12 && first <= 12) {
      day = second;
      month = first;
    } else {
      // Ambiguous (both <= 12): assume M-D-Y since that's this field's
      // format (mm-dd-yyyy)
      day = second;
      month = first;
    }
    const dt = new Date(Number(y), month - 1, day);
    return isNaN(dt.getTime()) ? null : dt;
  }

  // Fallback: native Date parser (e.g. "23 Jul 2026", "Jul 23, 2026")
  const dt = new Date(text);
  return isNaN(dt.getTime()) ? null : dt;
}

export default function AppDatePicker({
  value,
  onChange,
  label,
  required = false,
  min,
  max,
  error,
  className = "",
  disabled = false,
  textFormat,
}: AppDatePickerProps) {
  const inputClasses = `
    w-full
    rounded-lg
    border
    px-3
    py-2
    text-xs
    bg-white
    text-slate-700
    focus:outline-none
    focus:ring-2
    focus:ring-slate-300
    ${error ? "border-rose-300 focus:ring-rose-300" : "border-slate-200"}
    ${disabled ? "bg-slate-100 cursor-not-allowed" : ""}
  `;

  // ✅ Memoized options — sirf min/max/disabled/error/textFormat change hone par naya object banega
  const flatpickrOptions = useMemo(
    () => ({
      dateFormat: "Y-m-d",
      altInput: true,
      altInputClass: inputClasses,
      altFormat: "m-d-Y",
      allowInput: true,
      minDate: min || undefined,
      maxDate: max || undefined,
      disableMobile: true,
      static: true,
      parseDate: (datestr: string, _format: string) =>
        parseFlexibleDate(datestr) ?? new Date(NaN),
      appendTo: typeof document !== "undefined" ? document.body : undefined,
    }),
    [min, max]
  );

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className={textFormat ? textFormat : "text-[10px] font-bold uppercase tracking-wider text-slate-500"}>
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      <Flatpickr
        value={value || undefined}
        options={flatpickrOptions}
        disabled={disabled}
        onChange={(dates: Date[]) => {
          if (dates && dates[0]) onChange(toISO(dates[0]));
        }}
        className="hidden"
        placeholder="mm-dd-yyyy"
      />

      {error && <p className="text-[10px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}