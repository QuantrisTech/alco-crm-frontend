import React from "react";
import { Plus, Trash2 } from "lucide-react";
import InputField from "@/app/component/ui/inputField";
import Select from "@/app/component/ui/select";
import { RiResetLeftLine } from "react-icons/ri";

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
  totalCount?: number;
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
  totalCount = 0,
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
                className="bg-red-50 rounded-lg px-4 py-2 border border-red-100 shadow-sm text-sm text-red-600"
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