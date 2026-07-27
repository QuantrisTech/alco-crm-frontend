// "use client";
// import { useEffect, useState } from "react";
// import { useRouter, useParams } from "next/navigation";
// import { getWebinar, updateWebinar } from "@/utils/api";
// import FieldBuilder from "../components/field-builder";

// export default function EditWebinarPage() {
//   const router = useRouter();
//   const { id } = useParams();

//   const [form, setForm] = useState({
//     title: "",
//     description: "",
//     date: "",
//     status: "draft",
//   });
//   const [fields, setFields] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchWebinar = async () => {
//       try {
//         const res = await getWebinar(id);
//         const w = res.data;
//         setForm({
//           title: w.title || "",
//           description: w.description || "",
//           // convert ISO date to the format datetime-local input expects
//           date: w.date ? new Date(w.date).toISOString().slice(0, 16) : "",
//           status: w.status || "draft",
//         });
//         setFields(w.fields || []);
//       } catch (err) {
//         setError("Failed to load webinar.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchWebinar();
//   }, [id]);

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!form.title || !form.date) {
//       setError("Title and date are required.");
//       return;
//     }
//     if (fields.length === 0) {
//       setError("Add at least one form field.");
//       return;
//     }
//     const missingLabel = fields.some((f) => !f.label.trim());
//     if (missingLabel) {
//       setError("Every field needs a label.");
//       return;
//     }

//     setSaving(true);
//     try {
//       await updateWebinar(id, { ...form, fields });
//       router.push("/dashboard/webinars");
//     } catch (err) {
//       setError(err?.response?.data?.message || "Failed to update webinar.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) {
//     return <div className="p-6 text-gray-500 text-sm">Loading...</div>;
//   }

//   return (
//     <div className="p-6 max-w-3xl">
//       <h1 className="text-xl font-semibold text-navy-900 mb-6">Edit Webinar</h1>

//       {error && (
//         <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-2 mb-4">
//           {error}
//         </div>
//       )}

//       <form onSubmit={handleSubmit} className="space-y-6">
//         <div>
//           <label className="text-sm text-gray-700">Title</label>
//           <input
//             type="text"
//             name="title"
//             value={form.title}
//             onChange={handleChange}
//             className="w-full border rounded-md px-3 py-2 text-sm mt-1"
//           />
//         </div>

//         <div>
//           <label className="text-sm text-gray-700">Description</label>
//           <textarea
//             name="description"
//             value={form.description}
//             onChange={handleChange}
//             rows={3}
//             className="w-full border rounded-md px-3 py-2 text-sm mt-1"
//           />
//         </div>

//         <div className="flex gap-4">
//           <div className="flex-1">
//             <label className="text-sm text-gray-700">Date</label>
//             <input
//               type="datetime-local"
//               name="date"
//               value={form.date}
//               onChange={handleChange}
//               className="w-full border rounded-md px-3 py-2 text-sm mt-1"
//             />
//           </div>

//           <div className="flex-1">
//             <label className="text-sm text-gray-700">Status</label>
//             <select
//               name="status"
//               value={form.status}
//               onChange={handleChange}
//               className="w-full border rounded-md px-3 py-2 text-sm mt-1"
//             >
//               <option value="draft">Draft</option>
//               <option value="published">Published</option>
//               <option value="closed">Closed</option>
//             </select>
//           </div>
//         </div>

//         <FieldBuilder fields={fields} onChange={setFields} />

//         <div className="flex gap-3 pt-2">
//           <button
//             type="submit"
//             disabled={saving}
//             className="bg-navy-900 text-gold-500 px-5 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-50"
//           >
//             {saving ? "Saving..." : "Save Changes"}
//           </button>
//           <button
//             type="button"
//             onClick={() => router.push("/dashboard/webinars")}
//             className="px-5 py-2 rounded-md text-sm border text-gray-700 hover:bg-gray-50"
//           >
//             Cancel
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }
"use client";
import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { getWebinar, updateWebinar } from "@/utils/api";
import FieldBuilder from "../components/field-builder";

export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "checkbox";

export type WebinarStatus = "draft" | "published" | "closed";

export interface WebinarField {
  fieldKey: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[];
  order: number;
}

export interface Webinar {
  _id: string;
  title: string;
  description?: string;
  date: string;
  status: WebinarStatus;
  fields: WebinarField[];
  registrationsCount?: number;
}

export interface Registration {
  _id: string;
  webinar: string;
  responses: Record<string, string | string[]>;
  ip?: string;
  createdAt: string;
}

interface WebinarFormState {
  title: string;
  description: string;
  date: string;
  status: WebinarStatus;
}

export default function EditWebinarPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState<WebinarFormState>({
    title: "",
    description: "",
    date: "",
    status: "draft",
  });
  const [fields, setFields] = useState<WebinarField[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchWebinar = async () => {
      try {
        const res = await getWebinar(id);
        const w: Webinar = res.data;
        setForm({
          title: w.title || "",
          description: w.description || "",
          // convert ISO date to the format datetime-local input expects
          date: w.date ? new Date(w.date).toISOString().slice(0, 16) : "",
          status: w.status || "draft",
        });
        setFields(w.fields || []);
      } catch (err) {
        setError("Failed to load webinar.");
      } finally {
        setLoading(false);
      }
    };
    fetchWebinar();
  }, [id]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!form.title || !form.date) {
      setError("Title and date are required.");
      return;
    }
    if (fields.length === 0) {
      setError("Add at least one form field.");
      return;
    }
    const missingLabel = fields.some((f) => !f.label.trim());
    if (missingLabel) {
      setError("Every field needs a label.");
      return;
    }

    setSaving(true);
    try {
      await updateWebinar(id, { ...form, fields });
      router.push("/dashboard/webinars");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update webinar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500 text-sm">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-navy-900 mb-6">Edit Webinar</h1>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-2 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-sm text-gray-700">Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm mt-1"
          />
        </div>

        <div>
          <label className="text-sm text-gray-700">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm mt-1"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm text-gray-700">Date</label>
            <input
              type="datetime-local"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm mt-1"
            />
          </div>

          <div className="flex-1">
            <label className="text-sm text-gray-700">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm mt-1"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <FieldBuilder fields={fields} onChange={setFields} />

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-navy-900 text-gold-500 px-5 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/webinars")}
            className="px-5 py-2 rounded-md text-sm border text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}