// "use client";
// import { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import api from "@/utils/api"; // uses the shared axios instance directly since these are public, unauthenticated calls

// export default function PublicWebinarRegisterPage() {
//   const { id } = useParams();

//   const [webinar, setWebinar] = useState(null);
//   const [responses, setResponses] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [submitted, setSubmitted] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchWebinar = async () => {
//       try {
//         const res = await api.get(`/webinars/public/${id}`);
//         setWebinar(res.data);
//       } catch (err) {
//         setError("This webinar is not available for registration.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchWebinar();
//   }, [id]);

//   const handleChange = (fieldKey, value) => {
//     setResponses((prev) => ({ ...prev, [fieldKey]: value }));
//   };

//   const handleCheckboxChange = (fieldKey, option, checked) => {
//     setResponses((prev) => {
//       const current = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : [];
//       const next = checked ? [...current, option] : current.filter((o) => o !== option);
//       return { ...prev, [fieldKey]: next };
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     const missing = (webinar.fields || []).find(
//       (f) => f.required && !responses[f.fieldKey]
//     );
//     if (missing) {
//       setError(`Please fill in "${missing.label}".`);
//       return;
//     }

//     setSubmitting(true);
//     try {
//       await api.post(`/webinars/public/${id}/register`, { responses });
//       setSubmitted(true);
//     } catch (err) {
//       setError(err?.response?.data?.message || "Registration failed. Please try again.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (loading) {
//     return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
//   }

//   if (error && !webinar) {
//     return (
//       <div className="min-h-screen flex items-center justify-center px-4">
//         <p className="text-red-600 text-sm">{error}</p>
//       </div>
//     );
//   }

//   if (submitted) {
//     return (
//       <div className="min-h-screen flex items-center justify-center px-4">
//         <div className="text-center max-w-md">
//           <h1 className="text-xl font-semibold text-navy-900 mb-2">You're registered!</h1>
//           <p className="text-gray-600 text-sm">
//             Thanks for signing up for {webinar.title}. We'll send further details to your email.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const sortedFields = [...(webinar.fields || [])].sort((a, b) => a.order - b.order);

//   return (
//     <div className="min-h-screen flex items-center justify-center px-4 py-10">
//       <div className="w-full max-w-lg bg-white rounded-lg shadow-sm border p-8">
//         <h1 className="text-xl font-semibold text-navy-900 mb-1">{webinar.title}</h1>
//         {webinar.description && (
//           <p className="text-sm text-gray-600 mb-2">{webinar.description}</p>
//         )}
//         <p className="text-sm text-gray-500 mb-6">
//           {new Date(webinar.date).toLocaleString()}
//         </p>

//         {error && (
//           <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-2 mb-4">
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           {sortedFields.map((field) => (
//             <div key={field.fieldKey}>
//               <label className="text-sm text-gray-700">
//                 {field.label}
//                 {field.required && <span className="text-red-500 ml-0.5">*</span>}
//               </label>

//               {field.type === "textarea" && (
//                 <textarea
//                   rows={3}
//                   className="w-full border rounded-md px-3 py-2 text-sm mt-1"
//                   onChange={(e) => handleChange(field.fieldKey, e.target.value)}
//                 />
//               )}

//               {field.type === "select" && (
//                 <select
//                   className="w-full border rounded-md px-3 py-2 text-sm mt-1"
//                   onChange={(e) => handleChange(field.fieldKey, e.target.value)}
//                   defaultValue=""
//                 >
//                   <option value="" disabled>Select an option</option>
//                   {field.options.map((opt) => (
//                     <option key={opt} value={opt}>{opt}</option>
//                   ))}
//                 </select>
//               )}

//               {field.type === "checkbox" && (
//                 <div className="mt-1 space-y-1">
//                   {field.options.map((opt) => (
//                     <label key={opt} className="flex items-center gap-2 text-sm text-gray-700">
//                       <input
//                         type="checkbox"
//                         onChange={(e) => handleCheckboxChange(field.fieldKey, opt, e.target.checked)}
//                       />
//                       {opt}
//                     </label>
//                   ))}
//                 </div>
//               )}

//               {["text", "email", "phone", "number", "date"].includes(field.type) && (
//                 <input
//                   type={field.type === "phone" ? "tel" : field.type}
//                   className="w-full border rounded-md px-3 py-2 text-sm mt-1"
//                   onChange={(e) => handleChange(field.fieldKey, e.target.value)}
//                 />
//               )}
//             </div>
//           ))}

//           <button
//             type="submit"
//             disabled={submitting}
//             className="w-full bg-navy-900 text-gold-500 px-5 py-2.5 rounded-md text-sm hover:opacity-90 disabled:opacity-50 mt-2"
//           >
//             {submitting ? "Submitting..." : "Register"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }
"use client";
import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api"; // uses the shared axios instance directly since these are public, unauthenticated calls

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
  required?: boolean;
  order: number;
  options?: string[];
}

interface Webinar {
  _id: string;
  title: string;
  description?: string;
  date: string;
  fields: WebinarField[];
}

type ResponseValue = string | string[];
type Responses = Record<string, ResponseValue>;

export default function PublicWebinarRegisterPage() {
  const { id } = useParams<{ id: string }>();

  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [responses, setResponses] = useState<Responses>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchWebinar = async () => {
      try {
        const res = await api.get<Webinar>(`/webinars/public/${id}`);
        setWebinar(res.data);
      } catch (err) {
        setError("This webinar is not available for registration.");
      } finally {
        setLoading(false);
      }
    };
    fetchWebinar();
  }, [id]);

  const handleChange = (fieldKey: string, value: string) => {
    setResponses((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleCheckboxChange = (
    fieldKey: string,
    option: string,
    checked: boolean
  ) => {
    setResponses((prev) => {
      const current = Array.isArray(prev[fieldKey])
        ? (prev[fieldKey] as string[])
        : [];
      const next = checked
        ? [...current, option]
        : current.filter((o) => o !== option);
      return { ...prev, [fieldKey]: next };
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!webinar) return;

    const missing = (webinar.fields || []).find(
      (f) => f.required && !responses[f.fieldKey]
    );
    if (missing) {
      setError(`Please fill in "${missing.label}".`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/webinars/public/${id}/register`, { responses });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (error && !webinar) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (submitted && webinar) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-navy-900 mb-2">You're registered!</h1>
          <p className="text-gray-600 text-sm">
            Thanks for signing up for {webinar.title}. We'll send further details to your email.
          </p>
        </div>
      </div>
    );
  }

  if (!webinar) return null;

  const sortedFields = [...(webinar.fields || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-sm border p-8">
        <h1 className="text-xl font-semibold text-navy-900 mb-1">{webinar.title}</h1>
        {webinar.description && (
          <p className="text-sm text-gray-600 mb-2">{webinar.description}</p>
        )}
        <p className="text-sm text-gray-500 mb-6">
          {new Date(webinar.date).toLocaleString()}
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {sortedFields.map((field) => (
            <div key={field.fieldKey}>
              <label className="text-sm text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>

              {field.type === "textarea" && (
                <textarea
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    handleChange(field.fieldKey, e.target.value)
                  }
                />
              )}

              {field.type === "select" && (
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    handleChange(field.fieldKey, e.target.value)
                  }
                  defaultValue=""
                >
                  <option value="" disabled>Select an option</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {field.type === "checkbox" && (
                <div className="mt-1 space-y-1">
                  {field.options?.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleCheckboxChange(field.fieldKey, opt, e.target.checked)
                        }
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {(["text", "email", "phone", "number", "date"] as FieldType[]).includes(field.type) && (
                <input
                  type={field.type === "phone" ? "tel" : field.type}
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleChange(field.fieldKey, e.target.value)
                  }
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-navy-900 text-gold-500 px-5 py-2.5 rounded-md text-sm hover:opacity-90 disabled:opacity-50 mt-2"
          >
            {submitting ? "Submitting..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}