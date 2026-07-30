"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getWebinar, getRegistrations } from "@/utils/api";
import PageHeader, { FilterField } from "@/app/component/dashboard/page-header";
import DynamicTable from "@/app/component/dashboard/dynamic-table";
import { ArrowLeft, Users } from "lucide-react";
import ExportButton from "@/app/component/ui/export-button";

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
  webinarTitleSnapshot?: string | null;  // ✅ NEW
  assignedToSnapshot?: string | null;    // ✅ NEW
  ip?: string;
  createdAt: string;
}

export default function WebinarRegistrationsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    limit: 10,
  });

  // ── Fetch webinar + registrations together ──
  const { data, isLoading, isError } = useQuery({
    queryKey: ["webinar-registrations", id, filters],
    queryFn: async () => {
      const [webinarRes, regsRes] = await Promise.all([
        getWebinar(id),
        getRegistrations(id),
      ]);
      return {
        webinar: webinarRes.data as Webinar,
        registrations: regsRes.data as Registration[],
      };
    },
  });

  const webinar = data?.webinar;
  const registrations = data?.registrations ?? [];

  // columns come from the webinar's field definitions, in the order they were built
  const fieldColumns = [...(webinar?.fields || [])].sort((a, b) => a.order - b.order);

  const filterFields: FilterField[] = [
    { type: "input", name: "search", placeholder: "Search registrations..." },
  ];

  const columns = [
    {
      key: "createdAt",
      label: "Timestamp",
      render: (reg: Registration) => new Date(reg.createdAt).toLocaleString(),
    },
    ...fieldColumns.map((col) => ({
      key: col.fieldKey,
      label: col.label,
      render: (reg: Registration) => String(reg.responses?.[col.fieldKey] ?? "-"),
    })),
    {
      key: "webinarTitleSnapshot",           
      label: "Webinar Title (at time)",
      render: (reg: Registration) => reg.webinarTitleSnapshot || "—",
    },
    // {
    //   key: "assignedToSnapshot",             
    //   label: "Team Member (at time)",
    //   render: (reg: Registration) => reg.assignedToSnapshot || "—",
    // },
  ];

  const exportColumns = [
    {
      header: "Submitted",
      key: "createdAt",
      format: (val: string) => new Date(val).toLocaleString(),
    },
    ...fieldColumns.map((col) => ({
      header: col.label,
      key: `responses.${col.fieldKey}`,
    })),
    {
      header: "Webinar Title (at time)",     
      key: "webinarTitleSnapshot",
      format: (val: string) => val || "—",
    },
    // {
    //   header: "Team Member (at time)",       
    //   key: "assignedToSnapshot",
    //   format: (val: string) => val || "—",
    // },
  ];

  return (
    <>
      <button
        onClick={() => router.push("/dashboard/webinars")}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-navy-900 mb-4"
      >
        <ArrowLeft size={14} />
        Back to Webinars
      </button>

      <PageHeader
        title={webinar?.title || "Registrations"}
        subtitle={`${registrations.length} registration${registrations.length !== 1 ? "s" : ""}`}
        titleIcon={<Users size={22} className="text-indigo-500" />}
        // filters={filters}
        // setFilters={setFilters}
        // filterFields={filterFields}
        actions={
          <ExportButton
            filename={`${webinar?.title || "registrations"}`}
            title={webinar?.title}
            fetchData={async () => registrations}
            columns={exportColumns}
          />
        }
      />

      <DynamicTable
        data={registrations}
        isLoading={isLoading}
        isError={isError}
        columns={columns}
        currentPage={filters.page}
        pageSize={filters.limit}
        totalPages={1}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
      />
    </>
  );
}


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
// "use client";
// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { getWebinar, getRegistrations } from "@/utils/api";
// import { ArrowLeft } from "lucide-react";

// type FieldType =
//   | "text"
//   | "email"
//   | "phone"
//   | "number"
//   | "date"
//   | "textarea"
//   | "select"
//   | "checkbox";

// interface WebinarField {
//   fieldKey: string;
//   label: string;
//   type: FieldType;
//   required?: boolean;
//   order: number;
//   options?: string[];
// }

// interface Webinar {
//   _id: string;
//   title: string;
//   description?: string;
//   date: string;
//   fields: WebinarField[];
// }

// interface Registration {
//   _id: string;
//   webinar: string;
//   responses: Record<string, string | string[]>;
//   ip?: string;
//   createdAt: string;
// }

// export default function WebinarRegistrationsPage() {
//   const { id } = useParams<{ id: string }>();
//   const router = useRouter();

//   const [webinar, setWebinar] = useState<Webinar | null>(null);
//   const [registrations, setRegistrations] = useState<Registration[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>("");

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
// "use client";
// import { useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { useQuery } from "@tanstack/react-query";
// import { getWebinar, getRegistrations } from "@/utils/api";
// import PageHeader, { FilterField } from "@/app/component/dashboard/page-header";
// import DynamicTable from "@/app/component/dashboard/dynamic-table";
// import { ArrowLeft, Users } from "lucide-react";
// import ExportButton from "@/app/component/ui/export-button";

// type FieldType =
//   | "text"
//   | "email"
//   | "phone"
//   | "number"
//   | "date"
//   | "textarea"
//   | "select"
//   | "checkbox";

// interface WebinarField {
//   fieldKey: string;
//   label: string;
//   type: FieldType;
//   required?: boolean;
//   order: number;
//   options?: string[];
// }

// interface Webinar {
//   _id: string;
//   title: string;
//   description?: string;
//   date: string;
//   fields: WebinarField[];
// }

// interface Registration {
//   _id: string;
//   webinar: string;
//   responses: Record<string, string | string[]>;
//   referredBy?: string | null; // ✅ NEW
//   usedTitle?: string | null;
//   ip?: string;
//   createdAt: string;
// }

// export default function WebinarRegistrationsPage() {
//   const { id } = useParams<{ id: string }>();
//   const router = useRouter();

//   const [filters, setFilters] = useState({
//     search: "",
//     page: 1,
//     limit: 10,
//   });

//   // ── Fetch webinar + registrations together ──
//   const { data, isLoading, isError } = useQuery({
//     queryKey: ["webinar-registrations", id, filters],
//     queryFn: async () => {
//       const [webinarRes, regsRes] = await Promise.all([
//         getWebinar(id),
//         getRegistrations(id),
//       ]);
//       return {
//         webinar: webinarRes.data as Webinar,
//         registrations: regsRes.data as Registration[],
//       };
//     },
//   });

//   const webinar = data?.webinar;
//   const registrations = data?.registrations ?? [];

//   // columns come from the webinar's field definitions, in the order they were built
//   const fieldColumns = [...(webinar?.fields || [])].sort((a, b) => a.order - b.order);

//   const filterFields: FilterField[] = [
//     { type: "input", name: "search", placeholder: "Search registrations..." },
//   ];

//   const columns = [
//     {
//       key: "createdAt",
//       label: "Timestamp",
//       render: (reg: Registration) => new Date(reg.createdAt).toLocaleString(),
//     },
//     ...fieldColumns.map((col) => ({
//       key: col.fieldKey,
//       label: col.label,
//       render: (reg: Registration) => String(reg.responses?.[col.fieldKey] ?? "-"),
//     })),
//     {
//       key: "usedTitle",
//       label: "Title Shown",
//       render: (reg: Registration) => reg.usedTitle || "Default",
//     },
//     {
//       key: "referredBy",
//       label: "The person in contact from Team AL&CO",
//       render: (reg: Registration) => reg.referredBy || "—",
//     },
//   ];

//   // ── Export column config (dynamic fields + Submitted date) ──
//   const exportColumns = [
//     {
//       header: "Timestamp",
//       key: "createdAt",
//       format: (val: string) => new Date(val).toLocaleString(),
//     },
//     ...fieldColumns.map((col) => ({
//       header: col.label,
//       key: `responses.${col.fieldKey}`,
//     })),
//     {
//       header: "Title",
//       key: "usedTitle",
//       format: (val: string) => val || "Default",
//     }, {
//       header: "The person in contact from Team AL&CO", // ✅ 'label' ki jagah 'header'
//       key: "referredBy",
//       format: (val: string) => val || "—", // ✅ 'render' ki jagah 'format'
//     },

//   ];

//   return (
//     <>
//       <button
//         onClick={() => router.push("/dashboard/webinars")}
//         className="flex items-center gap-1 text-sm text-gray-600 hover:text-navy-900 mb-4"
//       >
//         <ArrowLeft size={14} />
//         Back to Webinars
//       </button>

//       <PageHeader
//         title={webinar?.title || "Registrations"}
//         subtitle={`${registrations.length} registration${registrations.length !== 1 ? "s" : ""}`}
//         titleIcon={<Users size={22} className="text-indigo-500" />}
//         // filters={filters}
//         // setFilters={setFilters}
//         // filterFields={filterFields}
//         actions={
//           <ExportButton
//             filename={`${webinar?.title || "registrations"}`}
//             title={webinar?.title}
//             fetchData={async () => registrations}
//             columns={exportColumns}
//           />
//         }
//       />

//       <DynamicTable
//         data={registrations}
//         isLoading={isLoading}
//         isError={isError}
//         columns={columns}
//         currentPage={filters.page}
//         pageSize={filters.limit}
//         totalPages={1}
//         onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
//       />
//     </>
//   );
// }