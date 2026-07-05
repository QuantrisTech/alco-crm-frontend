"use client";
import { useState } from "react";
import { Pencil, Trash2, Plus, Check, X, Loader2 } from "lucide-react";

type TitleOption = { _id: string; title: string };
type OptionInput = string | TitleOption;

// Normalized internal shape
type NormalizedOption = { id: string | null; label: string };

function normalize(options: OptionInput[]): NormalizedOption[] {
  return options.map((o) =>
    typeof o === "string" ? { id: null, label: o } : { id: o._id, label: o.title }
  );
}

export default function InputWithSelect({
  value,
  onChange,
  options,
  onAdd,
  onEdit,
  onDelete,
  isSaving = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: OptionInput[];
  // Only relevant when options are {_id, title} objects (e.g. Expense Titles).
  // Omit these for plain string[] lists like Category / SubType — edit/delete/add UI won't show.
  onAdd?: (title: string) => Promise<any>;
  onEdit?: (id: string, title: string) => Promise<any>;
  onDelete?: (id: string) => Promise<any>;
  isSaving?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState("");

  const normalized = normalize(options);

  const filtered = normalized.filter((o) =>
    o.label.toLowerCase().includes(value.toLowerCase())
  );

  const exactMatch = normalized.find(
    (o) => o.label.trim().toLowerCase() === value.trim().toLowerCase()
  );

  const canManage = !!(onAdd || onEdit || onDelete); // only for {_id,title} lists
  const canAdd = onAdd && value.trim().length > 0 && !exactMatch;

  const handleAdd = async () => {
    setError("");
    const title = value.trim();
    if (!title) return;

    const dup = normalized.find((o) => o.label.trim().toLowerCase() === title.toLowerCase());
    if (dup) {
      setError(`"${title}" already exists`);
      return;
    }

    try {
      await onAdd!(title);
      setOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not add title");
    }
  };

  const startEdit = (o: NormalizedOption) => {
    if (!o.id) return;
    setEditingId(o.id);
    setEditValue(o.label);
    setError("");
  };

  const submitEdit = async (id: string) => {
    setError("");
    const title = editValue.trim();
    if (!title) return;

    const dup = normalized.find(
      (o) => o.id !== id && o.label.trim().toLowerCase() === title.toLowerCase()
    );
    if (dup) {
      setError(`"${title}" already exists`);
      return;
    }

    try {
      await onEdit!(id, title);
      setEditingId(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not update title");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this title?")) return;
    try {
      await onDelete!(id);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not delete title");
    }
  };

  return (
    <div className="relative">
      <input
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 text-gray-900 placeholder:text-gray-400"
        placeholder="Select or type custom..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setError("");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {filtered.map((o) => (
            <div
              key={o.id ?? o.label}
              className="flex items-center justify-between px-2 py-1.5 hover:bg-yellow-50 group"
            >
              {editingId === o.id && o.id ? (
                <div className="flex items-center gap-1 w-full">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-yellow-400"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      submitEdit(o.id!);
                    }}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setEditingId(null);
                    }}
                    className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onMouseDown={() => {
                      onChange(o.label);
                      setOpen(false);
                    }}
                    className="flex-1 text-left text-sm capitalize text-gray-700"
                  >
                    {o.label.replace(/_/g, " ")}
                  </button>
                  {canManage && o.id && (
                    <div className="hidden group-hover:flex items-center gap-1">
                      {onEdit && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            startEdit(o);
                          }}
                          className="p-1 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleDelete(o.id!);
                          }}
                          className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-xs text-gray-400 px-3 py-2">No matches</p>
          )}

          {canAdd && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleAdd();
              }}
              disabled={isSaving}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-700 border-t border-gray-100 hover:bg-yellow-50 disabled:opacity-60"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Add "{value.trim()}"
            </button>
          )}

          {error && (
            <p className="text-[11px] text-rose-500 px-3 py-1.5 border-t border-gray-100">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}