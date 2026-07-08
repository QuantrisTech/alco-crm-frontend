"use client";
import { useState } from "react";

export default function ProgramMultiSelect({
  programs,
  selected,
  onToggle,
}: {
  programs: { _id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedNames = programs
    .filter((p) => selected.includes(p._id))
    .map((p) => p.name);

  return (
    <div className="relative">
      <label className="text-sm font-medium text-gray-700">
        Programs* {selected.length > 0 && `(${selected.length} selected)`}
      </label>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full mt-1 border rounded-lg px-3 py-2 text-left text-sm bg-white"
      >
        {selected.length === 0 ? (
          <span className="text-gray-400">Select programs...</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selectedNames.map((name, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs "
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute z-20 w-full mt-1 border rounded-lg bg-white shadow-lg max-h-56 overflow-y-auto placeholder:text-gray-400">
          {programs.map((p) => (
            <label
              key={p._id}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(p._id)}
                onChange={() => onToggle(p._id)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <p className="text-gray-700">
              {p.name}
              </p>
            </label>
          ))}
        </div>
      )}

      {selected.length > 1 && (
        <p className="text-[11px] text-blue-400 mt-1">
          {selected.length} programs selected 
        </p>
      )}
    </div>
  );
}