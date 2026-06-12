"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface CollapsedCellProps {
  items: React.ReactNode[];
  maxVisible?: number;
  tooltipWidth?: string;
  minWidth?: string;
}

export default function CollapsedCell({
  items,
  maxVisible = 1,
  tooltipWidth = "w-52",
  minWidth,
}: CollapsedCellProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);

  const visible = items.slice(0, maxVisible);
  const hidden = items.slice(maxVisible);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
      });
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${minWidth}`}>
      {visible.map((item, i) => (
        <div key={i}>{item}</div>
      ))}

      {hidden.length > 0 && (
        <>
          <button
            ref={badgeRef}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium
                       bg-gray-100 text-gray-500 hover:bg-yellow-100 hover:text-yellow-700
                       transition-colors duration-150 cursor-default select-none"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            +{hidden.length}
          </button>

          {typeof window !== "undefined" &&
            createPortal(
              <div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ top: coords.top, left: coords.left }}
                className={`
                  fixed z-[9999]
                  ${tooltipWidth}
                  bg-white border border-gray-100 rounded-xl shadow-lg
                  transition-all duration-200 ease-out origin-top-left
                  ${open
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                  }
                `}
              >
                <div className="absolute -top-1.5 left-3 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45" />
                <div className="relative p-2 flex flex-col gap-1">
                  {hidden.map((item, i) => (
                    <div key={i} className="px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                      {item}
                    </div>
                  ))}
                </div>
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  );
}