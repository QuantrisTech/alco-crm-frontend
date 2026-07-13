"use client";
import { useQuery } from "@tanstack/react-query";
import { adminGetAllAssignRoles, adminGetAllUsers, getAllUsersForRole } from "@/utils/api";
import { useAppSelector } from "@/store/hooks";
import Button from "@/app/component/ui/button";
import { X, Search } from "lucide-react";
import { useState } from "react";

type Props = {
  lead: any;
  onClose: () => void;
  onAssign: (userId: string) => void;
  isLoading: boolean;
  currentUserRole: "super_admin" | "admin" | "sales_manager" | "sales_rep";
};

export default function AssignLeadModal({ lead, onClose, onAssign, isLoading, currentUserRole }: Props) {
  const [selectedUser, setSelectedUser] = useState(lead.assigned_to?._id || "");
  const [search, setSearch] = useState("");
  const { user: authUser } = useAppSelector((state) => state.auth);

  const { data, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users-for-assign"],
    queryFn: () =>
      (authUser.role === "admin" || authUser.role === "super_admin" || authUser.role === "sales_manager" || authUser.role === "finance_manager"
        ? adminGetAllAssignRoles({
          page: 1,
          limit: 5000,
        })
        : getAllUsersForRole()
      ).then((res) => res.data),
  });

  // ✅ Sirf sales_manager aur sales_rep
  // const assignableUsers = data?.users?.filter((user: any) =>
  //   ["sales_manager", "sales_rep"].includes(user.role)
  // );

  console.log("All users:", data?.users);
  console.log("Current user role:", currentUserRole);
  //   const assignableUsers = data?.users?.filter((user: any) => {
  //   if (authUser.role === "super_admin") {
  //     // super_admin → admin, sales_manager, sales_rep sab dekhe
  //     return ["admin", "sales_manager", "sales_rep"].includes(user.role);
  //   }
  //   if (authUser.role === "admin") {
  //     // admin → sales_manager, sales_rep
  //     return ["sales_manager", "sales_rep"].includes(user.role);
  //   }
  //   if (authUser.role === "sales_manager") {
  //     // sales_manager → sirf sales_rep
  //     // return user.role === "sales_rep";
  //      return ["sales_manager", "sales_rep"].includes(user.role);
  //   }
  //   return false;
  // });
  const assignableUsers = data?.users || [];

  // ✅ Search filter
  const filteredUsers = assignableUsers?.filter((user: any) =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleLabel = (role: string) => {
    switch (role) {
      case "sales_manager": return "Sales Manager";
      case "sales_rep": return "Sales Rep";
      default: return role;
    }
  };

const roleColor = (role: string) => {
  switch (role) {
    case "super_admin":
      return "bg-red-100 text-red-700";

    case "admin":
      return "bg-purple-100 text-purple-700";

    case "sales_manager":
      return "bg-indigo-100 text-indigo-700";

    case "sales_rep":
      return "bg-blue-100 text-blue-700";

    case "finance_manager":
      return "bg-emerald-100 text-emerald-700";

    case "user":
      return "bg-gray-100 text-gray-700";

    default:
      return "bg-gray-100 text-gray-600";
  }
};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Assign Lead</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {lead.first_name} {lead.last_name} — {lead.email}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Currently assigned + Search bar */}
        <div className="flex items-center justify-between gap-4 px-6 pt-4">
          {lead.assigned_to && (
            <div className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700 whitespace-nowrap min-w-sm">
              Currently: <span className="font-medium">{lead.assigned_to?.name}</span>
            </div>
          )}

          {/* ✅ Search bar */}
          <div className="flex-1 flex items-center gap-2 border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-neutral-300 max-w-sm">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-gray-300 hover:text-gray-500 transition text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="p-6">
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            Select Sales Rep or Manager
            {filteredUsers && (
              <span className="ml-2 text-xs text-gray-400 font-normal">
                ({filteredUsers.length} found)
              </span>
            )}
          </label>

          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredUsers?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              {search ? `No results for "${search}"` : "No sales reps or managers found"}
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto pr-1 flex flex-wrap gap-3">
              {filteredUsers?.map((user: any) => (
                <div
                  key={user._id}
                  onClick={() => setSelectedUser(user._id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition min-w-xs ${selectedUser === user._id
                    ? "border-neutral-400 bg-neutral-50"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center text-gray-900 font-bold text-sm flex-shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>

                  {/* Role badge */}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${roleColor(user.role)}`}>
                    {roleLabel(user.role)}
                  </span>

                  {/* Selected indicator */}
                  {selectedUser === user._id && (
                    <div className="w-4 h-4 bg-neutral-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex p-6 border-t justify-end">
          <div className="flex gap-3">
            <Button variant="secondary" className="px-6" onClick={onClose}>
              Cancel
            </Button>
            <Button
              isLoading={isLoading}
              loadingText="Assigning..."
              onClick={() => selectedUser && onAssign(selectedUser)}
              disabled={!selectedUser}
              className="px-6"
            >
              Assign
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}