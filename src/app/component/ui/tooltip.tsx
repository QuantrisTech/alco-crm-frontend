import React from 'react'

export default function IconTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tooltip">
      {children}
      <div className="
        pointer-events-none
        absolute left-full top-1/2 -translate-y-1/2 ml-3
        bg-gray-800 text-white text-xs font-medium
        px-2.5 py-1.5 rounded-md whitespace-nowrap
        opacity-0 group-hover/tooltip:opacity-100
        transition-opacity duration-150 z-50
        border border-gray-700
        before:content-[''] before:absolute before:right-full before:top-1/2
        before:-translate-y-1/2 before:border-4 before:border-transparent
        before:border-r-gray-800
      ">
        {label}
      </div>
    </div>
  );
}
