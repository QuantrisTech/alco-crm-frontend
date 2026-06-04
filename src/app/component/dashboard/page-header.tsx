import React from "react";
// component
import InputField from "@/app/component/ui/inputField";
import Select from "@/app/component/ui/select";
// icon
import { Plus, Trash2, TrendingUp } from "lucide-react";

export type FilterField = {
  type: "input" | "select";
  name: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
};

type HeaderProps = {
  title?: string;
  subtitle?: string;
  titleIcon?: React.ReactNode;
  totalCount?: any;
  coveredCount?: number;
  coveredLabel?: string;
  onAdd?: () => void;
  onDeleteAll?: () => void;
  filters?: Record<string, string>;
  setFilters?: React.Dispatch<React.SetStateAction<any>>;
  filterFields?: FilterField[];
};

export default function PageHeader({
  title = "Admin Panel",
  subtitle = "Manage all users and their roles",
  titleIcon,
  totalCount,
  coveredCount,
  coveredLabel = "Covered",
  onAdd,
  onDeleteAll,
  filters = { search: "", status: "", quality: "", source: "" },
  setFilters,
  filterFields,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left Side */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          {titleIcon && <span className="flex items-center">{titleIcon}</span>}
          {title}
        </h1>
        {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {onAdd && (
          <button
            onClick={onAdd}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:opacity-80 transition"
            style={{ background: "#EEEDFE" }}
            title="Add"
          >
            <Plus size={16} color="#534AB7" />
          </button>
        )}

        {onDeleteAll && (
          <button
            onClick={onDeleteAll}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:opacity-80 transition"
            style={{ background: "#FAEEDA" }}
            title="Delete All"
          >
            <Trash2 size={16} color="#854F0B" />
          </button>
        )}

        {totalCount && (
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm text-sm text-gray-600">
            Total: <span className="font-bold text-gray-900">{totalCount}</span>
          </div>
        )}

        {coveredCount && coveredCount !== undefined && (
          // <div className="bg-white rounded-lg px-4 py-2 shadow-sm text-sm text-gray-600">
          //   <span className="font-bold text-gray-900">{coveredCount}</span>
          //   <span className="ml-1">{coveredLabel || "Items Covered"}</span>
          // </div>
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-2.5 shadow-sm">
            <TrendingUp size={15} className="text-yellow-500" />
            <span className="text-sm font-semibold text-gray-700">{coveredCount}/{coveredLabel}</span>
            <span className="text-xs text-gray-400">pages covered</span>
          </div>
        )}

        {filterFields && (
          <div className="flex flex-wrap gap-3 items-end">
            {filterFields.map((field) => {
              if (field.type === "input") {
                return (
                  <div key={field.name} className="w-52">
                    <InputField
                      label=""
                      placeholder={field.placeholder}
                      value={filters?.[field.name] || ""}
                      onChange={(e) =>
                        setFilters?.((prev: any) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
                      bg="bg-white"
                    />
                  </div>
                );
              }

              if (field.type === "select") {
                return (
                  <div key={field.name} className="w-40">
                    <Select
                      label=""
                      options={field.options || []}
                      value={filters?.[field.name] || ""}
                      placeholder={field.placeholder || `All ${field.name}`}
                      onChange={(e) =>
                        setFilters?.((prev: any) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      bg="bg-white"
                    />
                  </div>
                );
              }

              return null;
            })}

            {/* Reset button */}
            {Object.values(filters || {}).some((v) => v) && (
              <button
                onClick={() => setFilters?.({})}
                className="bg-red-50 rounded-lg px-4 py-2 my-auto text-sm text-red-600"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}