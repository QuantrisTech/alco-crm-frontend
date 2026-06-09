// app/component/dashboard/collapsed-cell.tsx
"use client";
import { useState, useRef } from "react";

interface CollapsedCellProps {
  items: React.ReactNode[];   // pre-rendered JSX for each item
  maxVisible?: number;         // how many to show before collapsing (default 1)
  tooltipWidth?: string;       // e.g. "w-56" (default "w-52")
  minWidth?: string;
}

export default function CollapsedCell({
  items,
  maxVisible = 1,
  tooltipWidth = "w-52",
  minWidth,
}: CollapsedCellProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = items.slice(0, maxVisible);
  const hidden = items.slice(maxVisible);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${minWidth}`}>
      {/* Visible items */}
      {visible.map((item, i) => (
        <div key={i}>{item}</div>
      ))}

      {/* +N badge with tooltip */}
      {hidden.length > 0 && (
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Badge */}
          <button
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium
                       bg-gray-100 text-gray-500 hover:bg-yellow-100 hover:text-yellow-700
                       transition-colors duration-150 cursor-default select-none"
          >
            +{hidden.length}
          </button>

          {/* Tooltip */}
          <div
            className={`
              absolute left-0 top-full mt-1.5 z-50
              ${tooltipWidth}
              bg-white border border-gray-100 rounded-xl shadow-lg
              transition-all duration-200 ease-out origin-top-left
              ${open
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }
            `}
          >
            {/* Arrow */}
            <div className="absolute -top-1.5 left-3 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45" />

            <div className="relative p-2 flex flex-col gap-1">
              {hidden.map((item, i) => (
                <div
                  key={i}
                  className="px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}