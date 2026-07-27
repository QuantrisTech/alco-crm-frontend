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

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWebinars, deleteWebinar } from "@/utils/api";
import PageHeader, { FilterField } from "@/app/component/dashboard/page-header";
import Popup from "@/app/component/ui/popup/popup";
import { Plus, Pencil, Trash2, Users, Video } from "lucide-react";
import toast from "react-hot-toast";
import DynamicTable from "@/app/component/dashboard/dynamic-table";

type WebinarStatus = "draft" | "published" | "closed";

interface Webinar {
  _id: string;
  title: string;
  description?: string;
  date: string;
  status: WebinarStatus;
  registrationsCount?: number;
}

const statusStyles: Record<WebinarStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  closed: "bg-red-100 text-red-700",
};

export default function WebinarsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 1,
    limit: 10,
  });

  const [deletingWebinar, setDeletingWebinar] = useState<Webinar | null>(null);

  // ── Fetch webinars ──
  const { data, isLoading, isError } = useQuery({
    queryKey: ["webinars", filters],
    queryFn: () => getWebinars().then((r) => r.data),
  });

  const webinars: Webinar[] = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const currentPage = data?.meta?.page ?? filters.page;

  // ── Delete webinar ──
  const { mutate: removeWebinar, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteWebinar(id),
    onSuccess: () => {
      toast.success("Webinar deleted ✅");
      queryClient.invalidateQueries({ queryKey: ["webinars"] });
      setDeletingWebinar(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to delete webinar"),
  });

  const filterFields: FilterField[] = [
    { type: "input", name: "search", placeholder: "Search by title..." },
    {
      type: "select",
      name: "status",
      placeholder: "All Status",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Closed", value: "closed" },
      ],
    },
  ];

  const columns = [
    {
      key: "title",
      label: "Title",
      render: (w: Webinar) => <span className="font-medium text-gray-700">{w.title}</span>,
    },
    {
      key: "date",
      label: "Date",
      render: (w: Webinar) => new Date(w.date).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      render: (w: Webinar) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[w.status] || statusStyles.draft}`}>
          {w.status}
        </span>
      ),
    },
    {
      key: "registrationsCount",
      label: "Registrations",
      render: (w: Webinar) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dashboard/webinars/${w._id}/registrations`);
          }}
          className="flex items-center gap-1 text-indigo-600 hover:underline"
        >
          <Users size={14} />
          {w.registrationsCount ?? 0}
        </button>
      ),
    },
  ];

  const actions = [
    {
      icon: <Pencil size={15} />,
      label: "Edit",
      onClick: (w: Webinar) => router.push(`/dashboard/webinars/${w._id}`),
    },
    {
      icon: <Trash2 size={15} />,
      label: "Delete",
      className: "hover:bg-red-50 hover:text-red-500",
      onClick: (w: Webinar) => setDeletingWebinar(w),
    },
  ];

  return (
    <>
      <PageHeader
        title="Webinars"
        subtitle="Manage all your webinars and registrations"
        titleIcon={<Video size={22} className="text-indigo-500" />}
        onAdd={() => router.push("/dashboard/webinars/create")}
        filters={filters}
        setFilters={setFilters}
        filterFields={filterFields}
      />

      <DynamicTable
        data={webinars}
        isLoading={isLoading}
        isError={isError}
        columns={columns}
        actions={actions}
        currentPage={currentPage}
        pageSize={filters.limit}
        totalPages={totalPages}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onRowClick={(w: Webinar) => router.push(`/dashboard/webinars/${w._id}`)}
      />

      {deletingWebinar && (
        <Popup
          isOpen={!!deletingWebinar}
          onClose={() => setDeletingWebinar(null)}
          onConfirm={() => removeWebinar(deletingWebinar._id)}
          variant="danger"
          title="Delete Webinar"
          description={
            <>
              Are you sure you want to delete{" "}
              <span className="font-bold text-red-500">{deletingWebinar.title}</span>? This cannot be undone.
            </>
          }
          confirmText="Yes, Delete"
          isLoading={isDeleting}
          loadingText="Deleting..."
        />
      )}
    </>
  );
}