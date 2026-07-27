// "use client";
// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { getWebinar, getRegistrations } from "@/utils/api";
// import { ArrowLeft } from "lucide-react";

// export default function WebinarRegistrationsPage() {
//   const { id } = useParams();
//   const router = useRouter();

//   const [webinar, setWebinar] = useState(null);
//   const [registrations, setRegistrations] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [webinarRes, regsRes] = await Promise.all([
//           getWebinar(id),
//           getRegistrations(id),
//         ]);
//         setWebinar(webinarRes.data);
//         setRegistrations(regsRes.data);
//       } catch (err) {
//         setError("Failed to load registrations.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [id]);

//   if (loading) {
//     return <div className="p-6 text-gray-500 text-sm">Loading...</div>;
//   }

//   if (error) {
//     return <div className="p-6 text-red-600 text-sm">{error}</div>;
//   }

//   // columns come from the webinar's field definitions, in the order they were built
//   const columns = [...(webinar?.fields || [])].sort((a, b) => a.order - b.order);

//   return (
//     <div className="p-6">
//       <button
//         onClick={() => router.push("/dashboard/webinars")}
//         className="flex items-center gap-1 text-sm text-gray-600 hover:text-navy-900 mb-4"
//       >
//         <ArrowLeft size={14} />
//         Back to Webinars
//       </button>

//       <h1 className="text-xl font-semibold text-navy-900 mb-1">{webinar?.title}</h1>
//       <p className="text-sm text-gray-500 mb-6">
//         {registrations.length} registration{registrations.length !== 1 ? "s" : ""}
//       </p>

//       {registrations.length === 0 ? (
//         <p className="text-gray-500 text-sm">No registrations yet.</p>
//       ) : (
//         <div className="overflow-x-auto">
//           <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
//             <thead>
//               <tr className="bg-gray-50 text-left text-sm text-gray-600">
//                 {columns.map((col) => (
//                   <th key={col.fieldKey} className="p-3 whitespace-nowrap">
//                     {col.label}
//                   </th>
//                 ))}
//                 <th className="p-3 whitespace-nowrap">Submitted</th>
//               </tr>
//             </thead>
//             <tbody>
//               {registrations.map((reg) => (
//                 <tr key={reg._id} className="border-t text-sm">
//                   {columns.map((col) => (
//                     <td key={col.fieldKey} className="p-3 whitespace-nowrap">
//                       {String(reg.responses?.[col.fieldKey] ?? "-")}
//                     </td>
//                   ))}
//                   <td className="p-3 whitespace-nowrap text-gray-500">
//                     {new Date(reg.createdAt).toLocaleString()}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getWebinar, getRegistrations } from "@/utils/api";
import { ArrowLeft } from "lucide-react";

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

interface Registration {
  _id: string;
  webinar: string;
  responses: Record<string, string | string[]>;
  ip?: string;
  createdAt: string;
}

export default function WebinarRegistrationsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [webinarRes, regsRes] = await Promise.all([
          getWebinar(id),
          getRegistrations(id),
        ]);
        setWebinar(webinarRes.data);
        setRegistrations(regsRes.data);
      } catch (err) {
        setError("Failed to load registrations.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-gray-500 text-sm">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600 text-sm">{error}</div>;
  }

  // columns come from the webinar's field definitions, in the order they were built
  const columns = [...(webinar?.fields || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="p-6">
      <button
        onClick={() => router.push("/dashboard/webinars")}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-navy-900 mb-4"
      >
        <ArrowLeft size={14} />
        Back to Webinars
      </button>

      <h1 className="text-xl font-semibold text-navy-900 mb-1">{webinar?.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {registrations.length} registration{registrations.length !== 1 ? "s" : ""}
      </p>

      {registrations.length === 0 ? (
        <p className="text-gray-500 text-sm">No registrations yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-600">
                {columns.map((col) => (
                  <th key={col.fieldKey} className="p-3 whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                <th className="p-3 whitespace-nowrap">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr key={reg._id} className="border-t text-sm">
                  {columns.map((col) => (
                    <td key={col.fieldKey} className="p-3 whitespace-nowrap">
                      {String(reg.responses?.[col.fieldKey] ?? "-")}
                    </td>
                  ))}
                  <td className="p-3 whitespace-nowrap text-gray-500">
                    {new Date(reg.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}