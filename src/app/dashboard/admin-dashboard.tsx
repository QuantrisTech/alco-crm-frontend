// "use client";
// import { useState } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { adminGetAllUsers, adminUpdateUser, adminDeleteUser, adminDeleteAllUsers, adminCreateUser, adminAssignRole, adminUpdateUserPassword } from "@/utils/api";
// import { User, UsersResponse } from "@/types/apiType";
// import ProtectedRoute from "@/app/component/protected-route";
// import toast from "react-hot-toast";
// import { Pencil, Trash2, UserCog, Plus } from "lucide-react";
// import Modal from "../component/ui/model/modal";
// import { ModalField } from "@/types/ui";
// import Popup from "../component/ui/popup/popup";
// import PageHeader from "../component/dashboard/page-header";
// import DynamicTable from "../component/dashboard/dynamic-table";

// // Add fields
// const addUserFields: ModalField[] = [
//   { name: "name", label: "Name", type: "input", inputType: "text", placeholder: "Enter name" },
//   { name: "email", label: "Email", type: "input", inputType: "email", placeholder: "Enter email" },
//   { name: "password", label: "Password", type: "input", inputType: "password", placeholder: "Enter password" },
//   {
//     name: "role", label: "Role", type: "select",
//     options: [
//       { label: "User", value: "user" },
//       { label: "Sales Manager", value: "sales_manager" },
//       { label: "Sales Rep", value: "sales_rep" },
//       { label: "Support", value: "support" },
//       {label: "Instructor", value: "instructor"},
//       { label: "Finance Manager", value: "finance_manager" },
//     ]
//   },
// ];

// export default function AdminPage() {
//   const queryClient = useQueryClient();
//   const [editingUser, setEditingUser] = useState<User | null>(null);
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [isAddOpen, setIsAddOpen] = useState(false);
//   const [showDeleteAll, setShowDeleteAll] = useState(false);

//   // Fetch Users
//   const { data, isLoading, isError } = useQuery<UsersResponse>({
//     queryKey: ["admin-users"],
//     queryFn: () => adminGetAllUsers().then((res) => res.data),
//   });

//   // Add User
//   const { mutate: addUser, isPending: isAdding } = useMutation({
//     mutationFn: (data: any) => adminCreateUser(data),
//     onSuccess: () => {
//       toast.success("User created successfully! ✅");
//       setIsAddOpen(false);
//       queryClient.invalidateQueries({ queryKey: ["admin-users"] });
//     },
//     onError: (error: any) => toast.error(error?.response?.data?.message || "Failed to create user!"),
//   });

//   // Update User — General + Security tab
//   const { mutate: updateUser, isPending: isUpdating } = useMutation({
//     mutationFn: ({ id, data }: { id: string; data: any }) => adminUpdateUser(id, data),
//     onSuccess: () => {
//       toast.success("User updated! ✅");
//       queryClient.invalidateQueries({ queryKey: ["admin-users"] });
//       setEditingUser(null);
//     },
//     onError: () => toast.error("Failed to update user!"),
//   });

//   // Change Password
//   const { mutate: changePassword, isPending: isChangingPassword } = useMutation({
//     mutationFn: ({ id, password }: { id: string; password: string }) =>
//       adminUpdateUserPassword(id, password),
//     onSuccess: () => {
//       toast.success("Password updated! 🔐");
//       queryClient.invalidateQueries({ queryKey: ["admin-users"] });
//       setEditingUser(null);
//     },
//     onError: () => toast.error("Failed to update password!"),
//   });

//   // ✅ Assign Role — Role tab
//   const { mutate: assignRole, isPending: isAssigningRole } = useMutation({
//     mutationFn: ({ id, role }: { id: string; role: string }) => adminAssignRole(id, role),
//     onSuccess: () => {
//       toast.success("Role updated! ✅");
//       queryClient.invalidateQueries({ queryKey: ["admin-users"] });
//       setEditingUser(null);
//     },
//     onError: () => toast.error("Failed to update role!"),
//   });

//   // Delete User
//   const { mutate: deleteUser, isPending: isDeleting } = useMutation({
//     mutationFn: (id: string) => adminDeleteUser(id),
//     onSuccess: () => {
//       toast.success("User deleted! 🗑️");
//       queryClient.invalidateQueries({ queryKey: ["admin-users"] });
//       setDeletingId(null);
//     },
//     onError: () => toast.error("Failed to delete user!"),
//   });

//   // Delete All
//   const { mutate: deleteAll, isPending: isDeletingAll } = useMutation({
//     mutationFn: () => adminDeleteAllUsers(),
//     onSuccess: () => {
//       toast.success("All users deleted!");
//       setShowDeleteAll(false);
//       queryClient.invalidateQueries({ queryKey: ["admin-users"] });
//     },
//     onError: () => toast.error("Failed to delete all users!"),
//   });

//   const handleDelete = (id: string) => {
//     setDeletingId(id);
//     deleteUser(id);
//   };



//   return (
//     <ProtectedRoute>
//       {/* Header */}
//       <PageHeader
//         title="Admin Panel"
//         subtitle="Manage all users and roles"
//         titleIcon={<UserCog size={24} />}
//         totalCount={data?.count ?? 0}
//         onAdd={() => setIsAddOpen(true)}
//         onDeleteAll={() => setShowDeleteAll(true)}
//       />

//       {/* Table */}
//       <DynamicTable
//         data={data?.users || []}
//         isLoading={isLoading}
//         isError={isError}
//         columns={[
//           {
//             key: "name",
//             label: "Name",
//             render: (user) => (
//               <div className="flex items-center gap-3">
//                 <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold text-xs"
//                   style={{
//                     background: user?.avatarColor,
//                     backdropFilter: "blur(10px)",
//                     opacity: 0.8,
//                   }}>
//                   {user.name?.charAt(0)?.toUpperCase()}
//                 </div>
//                 <span className="font-medium text-gray-800">
//                   {user.name}
//                 </span>
//               </div>
//             ),
//           },

//           {
//             key: "email",
//             label: "Email",
//             render: (user) => (
//               <span className="text-gray-500">
//                 {user.email}
//               </span>
//             ),
//           },

//           {
//             key: "role",
//             label: "Role",
//             render: (user) => {
//               const roleColor = (role: string) => {
//                 switch (role) {
//                   case "super_admin":
//                     return "bg-yellow-100 text-yellow-700";

//                   case "admin":
//                     return "bg-blue-100 text-blue-700";

//                   case "sales_manager":
//                     return "bg-indigo-100 text-indigo-700";

//                   case "sales_rep":
//                     return "bg-teal-100 text-teal-700";

//                   case "support":
//                     return "bg-pink-100 text-pink-700";

//                   case "user":
//                     return "bg-gray-100 text-gray-600";

//                   default:
//                     return "bg-gray-100 text-gray-600";
//                 }
//               };

//               return (
//                 <span
//                   className={`px-3 py-1 rounded-full text-xs font-medium ${roleColor(user?.role)}`}
//                 >
//                   {user.role}
//                 </span>
//               );
//             },
//           },

//           {
//             key: "createdAt",
//             label: "Joined",
//             render: (user) => (
//               <span className="text-gray-500">
//                 {new Date(user.createdAt).toLocaleDateString()}
//               </span>
//             ),
//           },
//         ]}
//         actions={[
//           {
//             icon: <Pencil size={14} />,
//             label: "Edit",
//             onClick: (user) => setEditingUser(user),
//             disabled: (user: User) => user.role === "admin",
//             className: "hover:bg-blue-50 hover:text-blue-500",
//           },
//           {
//             icon: <Trash2 size={14} />,
//             label: "Delete",
//             onClick: (user) => handleDelete(user._id),
//             disabled: (user: User) => user.role === "admin",
//             className: "hover:bg-red-50 hover:text-red-500",
//           },
//         ]}
//       />

//       {/* Add User Modal */}
//       <Modal
//         isOpen={isAddOpen}
//         onClose={() => setIsAddOpen(false)}
//         title="Add New User"
//         fields={addUserFields}
//         onSubmit={(data) => addUser(data)}
//         isLoading={isAdding}
//         mode="add"
//       />

//       {/* Edit Modal — 3 tabs */}
//       {editingUser && (
//         <Modal
//           isOpen={!!editingUser}
//           onClose={() => setEditingUser(null)}
//           title="Edit User"
//           subtitle={editingUser.name}
//           fields={[]}
//           onSubmit={() => { }}
//           isLoading={isUpdating || isAssigningRole}
//           mode="edit"
//           initialValues={{
//             name: editingUser.name,
//             email: editingUser.email,
//             role: editingUser.role,
//             newPassword: "",
//           }}
//           tabs={[
//             {
//               key: "general",
//               label: "General",
//               fields: [
//                 { name: "name", label: "Name", type: "input", inputType: "text" },
//                 { name: "email", label: "Email", type: "input", inputType: "email", disabled: true },
//               ],
//               // ✅ mutation use karo — direct API nahi
//               onSubmit: (data) => updateUser({
//                 id: editingUser._id,
//                 data: { name: data.name as string },
//               }),
//             },
//             {
//               key: "role",
//               label: "Role",
//               fields: [
//                 { name: "name", label: "Name", type: "input", inputType: "text", disabled: true },
//                 { name: "email", label: "Email", type: "input", inputType: "email", disabled: true },
//                 {
//                   name: "role", label: "Role", type: "select",
//                   options: [
//                     { label: "Sales Manager", value: "sales_manager" },
//                     { label: "Sales Rep", value: "sales_rep" },
//                     { label: "Support", value: "support" },
//                     { label: "User", value: "user" },
//                     {label: "Instructor", value: "instructor"},
//                     { label: "Finance Manager", value: "finance_manager" },
//                   ],
//                 },
//               ],
//               // ✅ mutation use karo
//               onSubmit: (data) => assignRole({
//                 id: editingUser._id,
//                 role: data.role as string,
//               }),
//             },
//             {
//               key: "security",
//               label: "Security",
//               fields: [
//                 {
//                   name: "newPassword",
//                   label: "New Password",
//                   type: "input",
//                   inputType: "password",
//                   placeholder: "Add new password",
//                   autoComplete: "new-password"
//                 },
//               ],
//               onSubmit: (data) => changePassword({
//                 id: editingUser._id,
//                 password: data.newPassword as string,
//               }),
//             },
//           ]}
//         />
//       )}

//       {/* Delete All Danger Popup */}
//       {showDeleteAll && (
//         <Popup
//           isOpen={showDeleteAll}
//           onClose={() => setShowDeleteAll(false)}
//           onConfirm={() => deleteAll()}
//           variant="danger"
//           title="Delete All Users"
//           description={
//             <>
//               Are you sure you want to delete{" "}
//               <span className="font-bold text-red-500">all users</span>?
//               This will permanently remove every account from the system.
//             </>
//           }
//           confirmText="Yes, Delete All"
//           isLoading={isDeletingAll}
//           loadingText="Deleting..."
//         />
//       )}

//     </ProtectedRoute>
//   );
// }


"use client";

import { Users, TrendingUp, BookOpen, GraduationCap, UserCog, Wallet, AlertCircle, FileText } from "lucide-react";
import { StatCard, StatCarduser } from "../component/dashboard/stat-card";
import PageHeader from "../component/dashboard/page-header";
import LeadPipeline from "../component/dashboard/lead-pipeline";
import QuickStats from "../component/dashboard/quick-stats";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  adminGetAllUsers, adminGetPrograms,
  getLeadsStats, getAllEnrollments,
  getRevenueReport, getPendingReport, getOverdueInvoices,
  getUpcomingDues,
  getMonthlyCollections
} from "@/utils/api";
import Link from "next/link";

function MonthlyBar({ data }: { data: any[] }) {
  const max = Math.max(...data.map((d) => d.totalCollected), 1);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-4">Monthly Collections</h3>
      <div className="flex items-end gap-2 h-36">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-gray-400 font-medium">
              {d.totalCollected > 0 ? `${(d.totalCollected / 1000).toFixed(0)}k` : ""}
            </span>
            <div
              className="w-full bg-yellow-400 rounded-t-sm transition-all duration-500"
              style={{ height: `${Math.max((d.totalCollected / max) * 100, d.totalCollected > 0 ? 4 : 2)}%`, minHeight: "2px" }}
              title={`${months[i]}: Rs ${d.totalCollected.toLocaleString()}`}
            />
            <span className="text-[9px] text-gray-400">{months[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();

  // ── Queries ──
  const { data: usersData } = useQuery({
    queryKey: ["dashboard-users"],
    queryFn: () => adminGetAllUsers().then(r => r.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ["dashboard-lead-stats"],
    queryFn: () => getLeadsStats().then(r => r.data.data),
  });

  const { data: programsData } = useQuery({
    queryKey: ["dashboard-programs"],
    queryFn: () => adminGetPrograms({ limit: 1 }).then(r => r.data),
  });

  const { data: enrollmentsData } = useQuery({
    queryKey: ["dashboard-enrollments"],
    queryFn: () => getAllEnrollments({ limit: 1 }).then(r => r.data),
  });

  const { data: revenueData } = useQuery({
    queryKey: ["dashboard-revenue"],
    queryFn: () => getRevenueReport().then(r => r.data.data),
  });

  const { data: pendingData } = useQuery({
    queryKey: ["dashboard-pending"],
    queryFn: () => getPendingReport().then(r => r.data.data),
  });

  const { data: overdueData } = useQuery({
    queryKey: ["dashboard-overdue"],
    queryFn: () => getOverdueInvoices().then(r => r.data),
  });

  const { data: upcoming } = useQuery({
    queryKey: ["finance-upcoming"],
    queryFn: () => getUpcomingDues(30).then((r) => r.data),
  });

    const { data: monthly } = useQuery({
      queryKey: ["finance-monthly"],
      queryFn: () => getMonthlyCollections().then((r) => r.data.data), // r.data.data = { year, data: [] }
    });

  // ── Pipeline ──
  const pipelineData = [
     { label: "New", count: statsData?.new || 0, color: "bg-sky-500" },
    { label: "Contacted", count: statsData?.contacted || 0, color: "bg-yellow-400" },
    { label: "Qualified", count: statsData?.qualified || 0, color: "bg-indigo-500" },
    { label: "Interested", count: statsData?.interested || 0, color: "bg-orange-400" },
    { label: "Converted", count: statsData?.converted || 0, color: "bg-teal-500" },
    { label: "Lost", count: statsData?.lost || 0, color: "bg-rose-400" },
  ];

  // ── Quick Stats ──
  const quickStatsData = [
    { label: "Conversion Rate", value: `${statsData?.conversionRate || 0}%`, color: "text-teal-600" },
    { label: "Hot Leads", value: `${statsData?.hot || 0}`, color: "text-red-500" },
    { label: "Pending Invoices", value: `${pendingData?.count || 0}`, color: "text-yellow-600" },
    { label: "Overdue", value: `${overdueData?.count || 0}`, color: "text-rose-500" },
  ];

  const fmt = (n: number) => `Rs ${(n || 0).toLocaleString()}`;

  // ── Stats cards ──
  const stats = [
    {
      title: "Total Users",
      value: usersData?.count?.toString() || "0",
      change: "All roles",
      icon: Users,
      bg: "bg-gray-800",
      text: "text-white",
      onClick: () => router.push("/dashboard/users"),
    },
    {
      title: "Total Leads",
      value: statsData?.total?.toString() || "0",
      change: `${statsData?.new || 0} new`,
      icon: TrendingUp,
      bg: "bg-yellow-400",
      text: "text-gray-900",
      onClick: () => router.push("/dashboard/leads"),
    },
    {
      title: "Total Programs",
      value: programsData?.meta?.total?.toString() || "0",
      change: "Active programs",
      icon: BookOpen,
      bg: "bg-indigo-600",
      text: "text-white",
      onClick: () => router.push("/dashboard/programs"),
    },
    {
      title: "Total Enrollments",
      value: enrollmentsData?.meta?.total?.toString() || "0",
      change: "All time",
      icon: GraduationCap,
      bg: "bg-teal-500",
      text: "text-white",
      onClick: () => router.push("/dashboard/enrollments"),
    },
    // {
    //   title: "Total Revenue",
    //   value: fmt(revenueData?.summary?.totalRevenue),
    //   change: `Collected: ${fmt(revenueData?.summary?.totalCollected)}`,
    //   icon: Wallet,
    //   bg: "bg-green-600",
    //   text: "text-white",
    //   onClick: () => router.push("/dashboard/finance"),
    // },
    // {
    //   title: "Overdue Invoices",
    //   value: overdueData?.count?.toString() || "0",
    //   change: `Pending: ${pendingData?.count || 0}`,
    //   icon: AlertCircle,
    //   bg: "bg-rose-500",
    //   text: "text-white",
    //   onClick: () => router.push("/dashboard/finance/invoices/overdue"),
    // },
  ];

  const statsFinance = [
    {
      title: "Total Revenue",
      value: fmt(revenueData?.summary?.totalRevenue),
      sub: `Collected: ${fmt(revenueData?.summary?.totalCollected)}`,
      icon: Wallet,
      iconBg: "#EEEDFE",
      iconColor: "#534AB7",
      onClick: () => router.push("/dashboard/finance"),
    },
    {
      title: "Overdue Invoices",
      value: overdueData?.count?.toString() || "0",
      sub: `Pending: ${pendingData?.count || 0}`,
      icon: AlertCircle,
      iconBg: "#FAEEDA",
      iconColor: "#854F0B",
      onClick: () => router.push("/dashboard/finance/invoices/overdue"),
    },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of platform performance and user activity"
        titleIcon={<UserCog size={24} />}
      />

      {/* Stats — 6 cards, 3 per row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Pipeline + Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <LeadPipeline data={pipelineData} />
          <div className="my-4">
          {monthly && <MonthlyBar data={monthly.data || monthly} />}
        </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={16} className="text-yellow-500" />
                Upcoming Dues (Next 30 Days)
              </h3>
              <Link href="/dashboard/finance/invoices/upcoming" className="text-xs text-yellow-600 hover:underline font-medium">View All</Link>
            </div>

            {upcoming?.data?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No upcoming dues</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {(upcoming?.data || []).slice(0, 5).map((inv: any) => (
                  <div key={inv._id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{inv.user?.name || "—"}</p>
                      <p className="text-xs text-gray-400">{inv.user?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">Rs {(inv.remainingAmount || 0).toLocaleString()}</p>
                      <p className="text-xs text-rose-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <QuickStats data={quickStatsData} />
          {statsFinance.map((stat) => (
            <StatCarduser key={stat.title} {...stat} />
          ))}
        </div>
      </div>

    </div>
  );
}