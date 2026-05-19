"use client";

import React, { useState } from "react";

type Column = {
  key: string;
  label: string;
  render?: (item: any, index: number) => React.ReactNode;
};

type Action = {
  icon: React.ReactNode;
  label?: string;
  onClick: (item: any) => void;
  show?: (item: any) => boolean;
  hidden?: (item: any) => boolean;
  className?: string;
  disabled?: (item: any) => boolean;
};

type Props = {
  data: any[];
  isLoading: boolean;
  isError: boolean;
  columns: Column[];
  actions?: Action[];
};

// --- Icons (SVG, no emoji) ---
const TableIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="3" y1="15" x2="21" y2="15"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
  </svg>
);

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

// --- Spinner ---
const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

// --- Card View ---
function CardView({ data, columns, actions }: { data: any[]; columns: Column[]; actions: Action[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">No data found</div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {data.map((item, index) => (
        <div
          key={item._id || index}
          className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-4 flex flex-col gap-3 group"
        >
          {/* Card Header: index badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold bg-yellow-50 text-yellow-600 border border-yellow-200 px-2 py-0.5 rounded-full">
              #{index + 1}
            </span>
            {/* Actions in top-right */}
            {actions.length > 0 && (
              <div className="flex items-center gap-1">
                {actions.map((action, i) => {
                  if (action.show && !action.show(item)) return null;
                  if (action.hidden && action.hidden(item)) return null;
                  return (
                    <div key={i} className="relative group/btn">
                      <button
                        onClick={() => {
                          if (action.disabled && action.disabled(item)) return;
                          action.onClick(item);
                        }}
                        disabled={action.disabled ? action.disabled(item) : false}
                        className={`p-1.5 rounded-lg text-gray-400 transition
                          ${action.className || "hover:bg-gray-100 hover:text-gray-600"}
                          ${action.disabled && action.disabled(item) ? "cursor-not-allowed opacity-50" : ""}
                        `}
                      >
                        {action.icon}
                      </button>
                      {action.label && (
                        <span className="absolute left-1/2 -translate-x-1/2 -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition whitespace-nowrap z-10">
                          {action.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Column Data */}
          <div className="flex flex-col gap-2">
            {columns.map((col) => (
              <div key={col.key} className="flex flex-row justify-between ">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                  {col.label}:
                </span>
                <span className="text-sm text-gray-700 font-medium leading-snug break-words min-w-60">
                  {col.render ? col.render(item, index) : item[col.key] || (
                    <span className="text-gray-300 italic">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Table View ---
function TableView({ data, columns, actions }: { data: any[]; columns: Column[]; actions: Action[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b">
        <tr className="text-gray-400 text-left">
          <th className="px-6 py-4 font-medium">#</th>
          {columns.map((col) => (
            <th key={col.key} className="px-6 py-4 font-medium">
              {col.label}
            </th>
          ))}
          {actions.length > 0 && (
            <th className="px-6 py-4 font-medium">Actions</th>
          )}
        </tr>
      </thead>
      <tbody>
        {data?.map((item, index) => (
          <tr key={item._id || index} className="border-b last:border-0 hover:bg-gray-50 transition">
            <td className="px-6 py-4 text-gray-400">{index + 1}</td>
            {columns.map((col) => (
              <td key={col.key} className="px-6 py-4 text-gray-500">
                {col.render ? col.render(item, index) : item[col.key] || "—"}
              </td>
            ))}
            {actions.length > 0 && (
              <td className="px-6 py-4">
                <div className="flex items-center gap-1">
                  {actions.map((action, i) => {
                    if (action.show && !action.show(item)) return null;
                    if (action.hidden && action.hidden(item)) return null;
                    return (
                      <div key={i} className="relative group">
                        <button
                          onClick={() => {
                            if (action.disabled && action.disabled(item)) return;
                            action.onClick(item);
                          }}
                          disabled={action.disabled ? action.disabled(item) : false}
                          className={`p-2 rounded-lg text-gray-400 transition
                            ${action.className || "hover:bg-gray-100 hover:text-gray-600"}
                            ${action.disabled && action.disabled(item) ? "cursor-not-allowed opacity-50" : ""}
                          `}
                        >
                          {action.icon}
                        </button>
                        {action.label && (
                          <span className="absolute left-1/2 -translate-x-1/2 -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                            {action.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </td>
            )}
          </tr>
        ))}
        {data?.length === 0 && (
          <tr>
            <td colSpan={columns.length + 2} className="text-center py-16 text-gray-400">
              No data found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// --- Main Export ---
export default function DynamicTable({
  data,
  isLoading,
  isError,
  columns,
  actions = [],
}: Props) {
  const [view, setView] = useState<"table" | "card">("table");

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

      {/* ---- VIEW TOGGLE HEADER ---- */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">
          {data?.length ?? 0} Records
        </span>

        {/* Toggle Buttons */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
              ${view === "table"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
              }`}
          >
            <TableIcon />
            <span>List</span>
          </button>
          <button
            onClick={() => setView("card")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
              ${view === "card"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
              }`}
          >
            <GridIcon />
            <span>Cards</span>
          </button>
        </div>
      </div>

      {/* ---- CONTENT ---- */}
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <div className="text-center py-20 text-red-500 text-sm">
          Failed to load data.
        </div>
      ) : view === "table" ? (
        <TableView data={data} columns={columns} actions={actions} />
      ) : (
        <CardView data={data} columns={columns} actions={actions} />
      )}
    </div>
  );
}
