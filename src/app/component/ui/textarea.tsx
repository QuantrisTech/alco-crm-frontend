import { TextareaProps } from "@/types/ui";
import { TextareaHTMLAttributes } from "react";
import { FieldError } from "react-hook-form";



export default function Textarea({ label, error, ...props }: TextareaProps) {
  const errorMessage = typeof error === "string" ? error : error?.message;
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <textarea
        {...props}
        rows={4}
        className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 outline-none transition resize-none
          ${error ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-yellow-400"}`}
      />
      {errorMessage && (
        <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
}