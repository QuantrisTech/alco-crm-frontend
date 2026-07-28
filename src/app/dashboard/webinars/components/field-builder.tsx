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

type FieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "checkbox";

interface WebinarField {
  fieldKey: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[];
  order: number;
}

interface FieldTypeOption {
  value: FieldType;
  label: string;
}

interface FieldBuilderProps {
  fields: WebinarField[];
  onChange: (fields: WebinarField[]) => void;
}

const FIELD_TYPES: FieldTypeOption[] = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
];

// Converts a label like "Phone Number" into a safe key "phone_number"
function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function FieldBuilder({ fields, onChange }: FieldBuilderProps) {
  const addField = () => {
    onChange([
      ...fields,
      {
        label: "",
        fieldKey: "",
        type: "text",
        required: false,
        options: [],
        order: fields.length,
      },
    ]);
  };

  const updateField = (index: number, updates: Partial<WebinarField>) => {
    const next = [...fields];
    next[index] = { ...next[index], ...updates };
    // auto-generate fieldKey from label unless user typed a custom one already
    if (updates.label !== undefined) {
      next[index].fieldKey = slugify(updates.label);
    }
    onChange(next);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const updateOptions = (index: number, rawText: string) => {
    const options = rawText
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    updateField(index, { options });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 mb-1 block">Form Fields</h3>
        <button
          type="button"
          onClick={addField}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px]  font-medium transition-colors bg-green-100 text-green-700 hover:bg-green-200"
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
              <label className="text-sm font-medium text-gray-700 mb-1 block placeholder:text-gray-400">Field Label</label>
              <input
                type="text"
                value={field.label}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updateField(index, { label: e.target.value })
                }
                placeholder="e.g. Full Name"
                className="w-full border rounded-md px-3 py-2 text-sm placeholder:text-gray-400 text-gray-600 mt-1"
              />
            </div>

            <div className="w-40">
              <label className="text-xs text-gray-600">Type</label>
              <select
                value={field.type}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  updateField(index, { type: e.target.value as FieldType })
                }
                className="w-full border rounded-md px-3 py-2 text-sm placeholder:text-gray-400 text-gray-600 mt-1"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
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
              <label className="text-xs text-gray-600">Options (comma separated)</label>
              <input
                type="text"
                defaultValue={field.options.join(", ")}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updateOptions(index, e.target.value)
                }
                placeholder="e.g. Morning, Afternoon, Evening"
                className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                updateField(index, { required: e.target.checked })
              }
            />
            Required field
          </label>
        </div>
      ))}
    </div>
  );
}
