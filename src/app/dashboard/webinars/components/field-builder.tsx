// "use client";
// import { Plus, Trash2 } from "lucide-react";

// const FIELD_TYPES = [
//   { value: "text", label: "Text" },
//   { value: "email", label: "Email" },
//   { value: "phone", label: "Phone" },
//   { value: "number", label: "Number" },
//   { value: "textarea", label: "Textarea" },
//   { value: "select", label: "Dropdown" },
//   { value: "checkbox", label: "Checkbox" },
//   { value: "date", label: "Date" },
// ];

// // Converts a label like "Phone Number" into a safe key "phone_number"
// function slugify(label) {
//   return label
//     .trim()
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, "_")
//     .replace(/^_|_$/g, "");
// }

// export default function FieldBuilder({ fields, onChange }) {
//   const addField = () => {
//     onChange([
//       ...fields,
//       {
//         label: "",
//         fieldKey: "",
//         type: "text",
//         required: false,
//         options: [],
//         order: fields.length,
//       },
//     ]);
//   };

//   const updateField = (index, updates) => {
//     const next = [...fields];
//     next[index] = { ...next[index], ...updates };
//     // auto-generate fieldKey from label unless user typed a custom one already
//     if (updates.label !== undefined) {
//       next[index].fieldKey = slugify(updates.label);
//     }
//     onChange(next);
//   };

//   const removeField = (index) => {
//     onChange(fields.filter((_, i) => i !== index));
//   };

//   const updateOptions = (index, rawText) => {
//     const options = rawText
//       .split(",")
//       .map((o) => o.trim())
//       .filter(Boolean);
//     updateField(index, { options });
//   };

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between">
//         <h3 className="text-sm font-semibold text-navy-900">Form Fields</h3>
//         <button
//           type="button"
//           onClick={addField}
//           className="flex items-center gap-1 text-sm text-navy-700 hover:underline"
//         >
//           <Plus size={14} />
//           Add Field
//         </button>
//       </div>

//       {fields.length === 0 && (
//         <p className="text-sm text-gray-500">No fields yet. Add at least one field for registrants to fill.</p>
//       )}

//       {fields.map((field, index) => (
//         <div key={index} className="border rounded-md p-4 space-y-3 bg-gray-50">
//           <div className="flex items-start gap-3">
//             <div className="flex-1">
//               <label className="text-xs text-gray-600">Field Label</label>
//               <input
//                 type="text"
//                 value={field.label}
//                 onChange={(e) => updateField(index, { label: e.target.value })}
//                 placeholder="e.g. Full Name"
//                 className="w-full border rounded-md px-3 py-2 text-sm mt-1"
//               />
//             </div>

//             <div className="w-40">
//               <label className="text-xs text-gray-600">Type</label>
//               <select
//                 value={field.type}
//                 onChange={(e) => updateField(index, { type: e.target.value })}
//                 className="w-full border rounded-md px-3 py-2 text-sm mt-1"
//               >
//                 {FIELD_TYPES.map((t) => (
//                   <option key={t.value} value={t.value}>
//                     {t.label}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <button
//               type="button"
//               onClick={() => removeField(index)}
//               className="text-red-500 hover:text-red-700 mt-6"
//             >
//               <Trash2 size={16} />
//             </button>
//           </div>

//           {(field.type === "select" || field.type === "checkbox") && (
//             <div>
//               <label className="text-xs text-gray-600">Options (comma separated)</label>
//               <input
//                 type="text"
//                 defaultValue={field.options.join(", ")}
//                 onChange={(e) => updateOptions(index, e.target.value)}
//                 placeholder="e.g. Morning, Afternoon, Evening"
//                 className="w-full border rounded-md px-3 py-2 text-sm mt-1"
//               />
//             </div>
//           )}

//           <label className="flex items-center gap-2 text-sm text-gray-700">
//             <input
//               type="checkbox"
//               checked={field.required}
//               onChange={(e) => updateField(index, { required: e.target.checked })}
//             />
//             Required field
//           </label>
//         </div>
//       ))}
//     </div>
//   );
// }
"use client";
import { ChangeEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import Select from "@/app/component/ui/select";

type FieldType = "text" | "email" | "phone" | "number" | "date" | "textarea" | "select" | "checkbox";

interface WebinarField {
  fieldKey: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[];
  order: number;
  allowOther?: boolean; // ✅ NEW
}

interface FieldBuilderProps {
  fields: WebinarField[];
  onChange: (fields: WebinarField[]) => void;
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
];

function slugify(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export default function FieldBuilder({ fields, onChange }: FieldBuilderProps) {
  const addField = () => {
    onChange([
      ...fields,
      { label: "", fieldKey: "", type: "text", required: false, options: [], order: fields.length, allowOther: false },
    ]);
  };

  const updateField = (index: number, updates: Partial<WebinarField>) => {
    const next = [...fields];
    next[index] = { ...next[index], ...updates };
    if (updates.label !== undefined) {
      next[index].fieldKey = slugify(updates.label);
    }
    onChange(next);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const addOption = (fieldIndex: number) => {
    const next = [...fields];
    next[fieldIndex] = { ...next[fieldIndex], options: [...next[fieldIndex].options, ""] };
    onChange(next);
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const next = [...fields];
    const newOptions = [...next[fieldIndex].options];
    newOptions[optionIndex] = value;
    next[fieldIndex] = { ...next[fieldIndex], options: newOptions };
    onChange(next);
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const next = [...fields];
    next[fieldIndex] = { ...next[fieldIndex], options: next[fieldIndex].options.filter((_, i) => i !== optionIndex) };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 mb-1 block">Form Fields</h3>
        <button
          type="button"
          onClick={addField}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors bg-green-100 text-green-700 hover:bg-green-200"
        >
          <Plus size={14} />
          Add Field
        </button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-gray-500">No fields yet. Add at least one field for registrants to fill.</p>
      )}

      {fields.map((field, index) => (
        <div key={index} className="border rounded-md p-4 space-y-3 bg-gray-50">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Field Label</label>
              <input
                type="text"
                value={field.label}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateField(index, { label: e.target.value })}
                placeholder="e.g. Full Name"
                className="w-full border rounded-md px-3 py-2 text-sm placeholder:text-gray-400 text-gray-600"
              />
            </div>

            <div className="w-44">
              <Select
                label="Type"
                value={field.type}
                options={FIELD_TYPES}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  updateField(index, { type: e.target.value as FieldType })
                }
                className="placeholder:text-gray-600 text-gray-600"
              />
            </div>

            <button
              type="button"
              onClick={() => removeField(index)}
              className="text-red-500 hover:text-red-700 mt-6"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {(field.type === "select" || field.type === "checkbox") && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-600">Options</label>
                <button
                  type="button"
                  onClick={() => addOption(index)}
                  className="flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:underline"
                >
                  <Plus size={12} />
                  Add Option
                </button>
              </div>

              {field.options.length === 0 && (
                <p className="text-xs text-gray-400 mb-2">No options yet. Click "Add Option" to add one.</p>
              )}

              <div className="space-y-2">
                {field.options.map((opt, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateOption(index, optIndex, e.target.value)}
                      placeholder={`Option ${optIndex + 1}`}
                      className="flex-1 border rounded-md px-3 py-2 text-sm placeholder:text-gray-400 text-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index, optIndex)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* ✅ NEW — "Other" option toggle */}
              <label className="flex items-center gap-2 text-xs text-gray-600 mt-3">
                <input
                  type="checkbox"
                  checked={field.allowOther || false}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField(index, { allowOther: e.target.checked })
                  }
                />
                Allow "Other" option (lets registrant type their own answer)
              </label>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateField(index, { required: e.target.checked })}
            />
            Required field
          </label>
        </div>
      ))}
    </div>
  );
}