// "use client";
// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { getWebinars, deleteWebinar } from "@/utils/api";
// import { Plus, Pencil, Trash2, Users } from "lucide-react";

// export default function WebinarsPage() {
//   const [webinars, setWebinars] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchWebinars = async () => {
//     setLoading(true);
//     try {
//       const res = await getWebinars();
//       setWebinars(res.data);
//     } catch (err) {
//       console.error("Failed to load webinars", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchWebinars();
//   }, []);

//   const handleDelete = async (id) => {
//     if (!confirm("Delete this webinar? This cannot be undone.")) return;
//     try {
//       await deleteWebinar(id);
//       setWebinars((prev) => prev.filter((w) => w._id !== id));
//     } catch (err) {
//       console.error("Delete failed", err);
//     }
//   };

//   const statusBadge = (status) => {
//     const styles = {
//       draft: "bg-gray-100 text-gray-700",
//       published: "bg-green-100 text-green-700",
//       closed: "bg-red-100 text-red-700",
//     };
//     return (
//       <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.draft}`}>
//         {status}
//       </span>
//     );
//   };

//   return (
//     <div className="p-6">
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="text-xl font-semibold text-navy-900">Webinars</h1>
//         <Link
//           href="/dashboard/webinars/create"
//           className="flex items-center gap-2 bg-navy-900 text-gold-500 px-4 py-2 rounded-md hover:opacity-90"
//         >
//           <Plus size={16} />
//           Create Webinar
//         </Link>
//       </div>

//       {loading ? (
//         <p className="text-gray-500">Loading...</p>
//       ) : webinars.length === 0 ? (
//         <p className="text-gray-500">No webinars yet. Create your first one.</p>
//       ) : (
//         <table className="w-full border-collapse bg-white rounded-lg shadow-sm overflow-hidden">
//           <thead>
//             <tr className="bg-gray-50 text-left text-sm text-gray-600">
//               <th className="p-3">Title</th>
//               <th className="p-3">Date</th>
//               <th className="p-3">Status</th>
//               <th className="p-3">Registrations</th>
//               <th className="p-3 text-right">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {webinars.map((w) => (
//               <tr key={w._id} className="border-t text-sm">
//                 <td className="p-3 font-medium">{w.title}</td>
//                 <td className="p-3">{new Date(w.date).toLocaleDateString()}</td>
//                 <td className="p-3">{statusBadge(w.status)}</td>
//                 <td className="p-3">
//                   <Link
//                     href={`/dashboard/webinars/${w._id}/registrations`}
//                     className="flex items-center gap-1 text-navy-700 hover:underline"
//                   >
//                     <Users size={14} />
//                     {w.registrationsCount ?? 0}
//                   </Link>
//                 </td>
//                 <td className="p-3 text-right space-x-3">
//                   <Link href={`/dashboard/webinars/${w._id}`} className="text-gray-600 hover:text-navy-900 inline-block">
//                     <Pencil size={16} />
//                   </Link>
//                   <button onClick={() => handleDelete(w._id)} className="text-red-500 hover:text-red-700">
//                     <Trash2 size={16} />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// }
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getWebinars, deleteWebinar } from "@/utils/api";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

type WebinarStatus = "draft" | "published" | "closed";

interface Webinar {
  _id: string;
  title: string;
  description?: string;
  date: string;
  status: WebinarStatus;
  registrationsCount?: number;
}

export default function WebinarsPage() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWebinars = async () => {
    setLoading(true);
    try {
      const res = await getWebinars();
      setWebinars(res.data);
    } catch (err) {
      console.error("Failed to load webinars", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebinars();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this webinar? This cannot be undone.")) return;
    try {
      await deleteWebinar(id);
      setWebinars((prev) => prev.filter((w) => w._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const statusBadge = (status: WebinarStatus) => {
    const styles: Record<WebinarStatus, string> = {
      draft: "bg-gray-100 text-gray-700",
      published: "bg-green-100 text-green-700",
      closed: "bg-red-100 text-red-700",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-navy-900">Webinars</h1>
        <Link
          href="/dashboard/webinars/create"
          className="flex items-center gap-2 bg-navy-900 text-gold-500 px-4 py-2 rounded-md hover:opacity-90"
        >
          <Plus size={16} />
          Create Webinar
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : webinars.length === 0 ? (
        <p className="text-gray-500">No webinars yet. Create your first one.</p>
      ) : (
        <table className="w-full border-collapse bg-white rounded-lg shadow-sm overflow-hidden">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-600">
              <th className="p-3">Title</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Registrations</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {webinars.map((w) => (
              <tr key={w._id} className="border-t text-sm">
                <td className="p-3 font-medium">{w.title}</td>
                <td className="p-3">{new Date(w.date).toLocaleDateString()}</td>
                <td className="p-3">{statusBadge(w.status)}</td>
                <td className="p-3">
                  <Link
                    href={`/dashboard/webinars/${w._id}/registrations`}
                    className="flex items-center gap-1 text-navy-700 hover:underline"
                  >
                    <Users size={14} />
                    {w.registrationsCount ?? 0}
                  </Link>
                </td>
                <td className="p-3 text-right space-x-3">
                  <Link href={`/dashboard/webinars/${w._id}`} className="text-gray-600 hover:text-navy-900 inline-block">
                    <Pencil size={16} />
                  </Link>
                  <button onClick={() => handleDelete(w._id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
