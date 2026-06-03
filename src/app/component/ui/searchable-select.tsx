"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  defaultValue?: string;
}

export default function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  error,
  defaultValue,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ target: { value: "" } });
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`
          relative flex items-center justify-between
          w-full px-3 py-2.5 rounded-lg border bg-white
          text-sm cursor-pointer transition-all
          ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-gray-400"}
          ${isOpen ? "border-yellow-400 ring-2 ring-yellow-100" : "border-gray-200"}
          ${error ? "border-rose-400 ring-2 ring-rose-100" : ""}
        `}
      >
        <span className={selectedOption ? "text-gray-800" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center gap-1 text-gray-400">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="hover:text-gray-600 transition p-0.5 rounded"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-xs text-rose-500">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          style={{ position: "fixed", width: containerRef.current?.offsetWidth, left: containerRef.current?.getBoundingClientRect().left, top: (containerRef.current?.getBoundingClientRect().bottom ?? 0) + 4 }}
        >
          {/* Search Box */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 bg-gray-50">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                No results found
              </div>
            ) : (
              filtered.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    px-4 py-2.5 text-sm cursor-pointer transition-colors
                    ${option.value === value
                      ? "bg-yellow-50 text-yellow-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}