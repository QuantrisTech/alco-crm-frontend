"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllUsersForRole } from "@/utils/api";
import { User, UsersResponse } from "@/types/apiType";
import ProtectedRoute from "@/app/component/protected-route";
import { UserCog, ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/app/component/dashboard/page-header";
import DynamicTable from "@/app/component/dashboard/dynamic-table";
import ExportButton from "@/app/component/ui/export-button";

export default function SalesManagerDashboard() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [filters, setFilters] = useState({ search: "" });

  // ── Fetch Users ──
  const { data, isLoading, isError } = useQuery<UsersResponse>({
    queryKey: ["role-users"],
    queryFn: () => getAllUsersForRole().then((res) => res.data),
  });

  // ── Sirf role === "user" + search filter ──
  const filtered = (data?.users || []).filter((user: User) => {
    const q = filters.search.toLowerCase();
    const isUser = user.role === "user";
    return (
      isUser &&
      (!q ||
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q))
    );
  });

  // ── Client-side pagination ──
  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  // ── Reset page on filter change ──
  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  return (
    <ProtectedRoute>
      {/* Header */}
      <PageHeader
        title="Users"
        subtitle="View all registered users"
        titleIcon={<UserCog size={24} />}
        totalCount={filtered.length}
        filters={filters}
        setFilters={setFilters}
        filterFields={[
          {
            type: "input",
            name: "search",
            placeholder: "Search by name or email...",
          },
        ]}
        exportBtn={
          <ExportButton
            filename="users"
            label="Export Excel"
            fetchData={async () => {
              const res = await getAllUsersForRole();
              return res?.data?.users;
            }}
            columns={[
              { header: "Name", key: "name" },
              { header: "Email", key: "email" },
              { header: "Phone", key: "phone" },
              { header: "Role", key: "role" },
              { header: "Source", key: "source" },
              { header: "Verified", key: "isVerified", format: (v) => v ? "Yes" : "No" },
              { header: "Active", key: "isActive", format: (v) => v ? "Yes" : "No" },
              { header: "Paid", key: "isPaid", format: (v) => v ? "Yes" : "No" },
              { header: "Last Login", key: "lastLogin", format: (v) => v ? new Date(v).toLocaleDateString("en-PK") : "—" },
              { header: "Created At", key: "createdAt", format: (v) => v ? new Date(v).toLocaleDateString("en-PK") : "—" },
            ]}
          />
        }
      />

      {/* Table */}
      <DynamicTable
        data={paginated}
        isLoading={isLoading}
        isError={isError}
        currentPage={page}
        pageSize={limit}
        totalPages={data?.totalPages}
        onPageChange={(newPage) => setPage(newPage)}
        columns={[
          {
            key: "name",
            label: "Name",
            render: (user) => (
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold text-xs flex-shrink-0"
                  style={{ background: user?.avatarColor, opacity: 0.85 }}
                >
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="font-medium text-gray-800">{user.name}</span>
              </div>
            ),
          },
          {
            key: "email",
            label: "Email",
            render: (user) => (
              <span className="text-gray-500">{user.email}</span>
            ),
          },
          {
            key: "createdAt",
            label: "Joined",
            render: (user) => (
              <span className="text-gray-400 text-sm">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            ),
          },
        ]}
        actions={[]}
      />

      {/* Pagination */}
      {/* {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <p className="text-xs text-gray-400">
            Page <span className="font-semibold text-gray-700">{page}</span> of{" "}
            <span className="font-semibold text-gray-700">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )} */}
    </ProtectedRoute>
  );
}