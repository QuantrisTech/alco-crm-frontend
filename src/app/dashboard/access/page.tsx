// app/dashboard/access/page.tsx
"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
// import { RootState } from "@/store";
import {
  getAllEnrollments,
  grantAccess,
  grantFinanceAccess,
  getGracePoolStatus,
} from "@/utils/api";
import PageHeader, { FilterField } from "@/app/component/dashboard/page-header";
import DynamicTable from "@/app/component/dashboard/dynamic-table";
import Modal from "@/app/component/ui/model/modal";
import { ModalField } from "@/types/ui";
import toast from "react-hot-toast";
import { ShieldCheck, KeyRound } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

// ── Access status badge color ─────────────────────────────────
const accessColor = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    GRACE: "bg-yellow-100 text-yellow-700",
    EXTENDED: "bg-indigo-100 text-indigo-700",
    RESTRICTED: "bg-orange-100 text-orange-700",
    BLOCKED: "bg-rose-100 text-rose-700",
  };
  return map[status] || "bg-gray-100 text-gray-600";
};

// ── Modal fields ──────────────────────────────────────────────
const adminGrantFields: ModalField[] = [
  {
    name: "days",
    label: "Days to Grant",
    type: "input",
    inputType: "number",
    placeholder: "30",
  },
  {
    name: "reason",
    label: "Reason",
    type: "input",
    inputType: "text",
    placeholder: "Reason for extension...",
  },
];

const financeGrantFields: ModalField[] = [
  {
    name: "days",
    label: "Days to Grant (Max pool: 90)",
    type: "input",
    inputType: "number",
    placeholder: "e.g. 30",
  },
  {
    name: "reason",
    label: "Reason",
    type: "input",
    inputType: "text",
    placeholder: "Reason for extension...",
  },
];

// ── Pool Status Badge ─────────────────────────────────────────
const PoolBadge = ({ remaining, total }: { remaining: number; total: number }) => {
  const pct = Math.round((remaining / total) * 100);
  const color =
    pct === 0
      ? "bg-rose-100 text-rose-700"
      : pct <= 33
        ? "bg-orange-100 text-orange-700"
        : "bg-green-100 text-green-700";

  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color}`}>
      {remaining}/{total} days left
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
export default function AccessControlPage() {
  const queryClient = useQueryClient();
  // const user = useSelector((state: RootState) => state.auth.user);
  const { user: authUser } = useAppSelector((state) => state.auth);

  const isAdmin = authUser?.role === "admin" || authUser?.role === "super_admin";
  const isFinance = authUser?.role === "finance_manager";

  const [filters, setFilters] = useState({
    status: "",
    search: "",
    page: 1,
    limit: 10,
  });

  // Grant modal state
  const [grantingAccess, setGrantingAccess] = useState<any>(null);

  // Pool status for selected enrollment (finance only)
  const { data: poolData, isLoading: poolLoading } = useQuery({
    queryKey: ["pool-status", grantingAccess?._id],
    queryFn: () =>
      getGracePoolStatus(grantingAccess._id).then((r) => r.data.data),
    enabled: !!grantingAccess && isFinance,
  });

  const filterFields: FilterField[] = [
    { type: "input", name: "search", placeholder: "Search..." },
    {
      type: "select",
      name: "status",
      options: [
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" },
        { label: "Completed", value: "completed" },
      ],
    },
  ];

  // ── Enrollments fetch ───────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["enrollments-access", filters],
    queryFn: () => getAllEnrollments(filters).then((r) => r.data),
  });

  // ── Admin grant mutation ────────────────────────────────────
  const { mutate: adminGrant, isPending: isAdminGranting } = useMutation({
    mutationFn: (formData: any) =>
      grantAccess({
        enrollmentId: grantingAccess._id,
        days: Number(formData.days),
        reason: formData.reason || "",
        installmentIds: [],
      }),
    onSuccess: () => {
      toast.success("Access granted! ✅");
      setGrantingAccess(null);
      queryClient.invalidateQueries({ queryKey: ["enrollments-access"] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Failed!"),
  });

  // ── Finance grant mutation ──────────────────────────────────
  const { mutate: financeGrant, isPending: isFinanceGranting } = useMutation({
    mutationFn: (formData: any) =>
      grantFinanceAccess({
        enrollmentId: grantingAccess._id,
        days: Number(formData.days),
        reason: formData.reason || "",
        installmentIds: [],
      }),
    onSuccess: (res) => {
      const remaining = res.data?.remainingPool ?? 0;
      toast.success(
        remaining === 0
          ? "Access granted! Pool khatam — Admin ko notify kar diya gaya ⚠️"
          : `Access granted! Pool remaining: ${remaining} days ✅`
      );
      setGrantingAccess(null);
      queryClient.invalidateQueries({ queryKey: ["enrollments-access"] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Failed!"),
  });

  // ── Grant button click ──────────────────────────────────────
  // handleGrantClick modify karo
  const handleGrantClick = async (enrollment: any) => {
    if (isFinance) {
      // Pool status pehle check karo
      try {
        const res = await getGracePoolStatus(enrollment._id);
        const pool = res.data.data;
        if (pool.poolExhausted) {
          toast.error("Finance grace pool khatam ho gaya ⚠️ — Admin se contact karo");
          return; // Modal mat kholo
        }
      } catch (e) {
        toast.error("Pool status check nahi ho saka");
        return;
      }
    }
    setGrantingAccess(enrollment);
  };

  // ── Finance pool exhausted check ────────────────────────────
  const financePoolExhausted = isFinance && poolData?.poolExhausted === true;

  return (
    <>
      <PageHeader
        title="Access Control"
        subtitle="Grant or manage student access"
        titleIcon={<ShieldCheck size={24} />}
        totalCount={data?.meta?.total ?? 0}
        filters={{
          ...filters,
          page: String(filters.page),
          limit: String(filters.limit),
        }}
        setFilters={setFilters}
        filterFields={filterFields}
      />

      <DynamicTable
        data={data?.data || []}
        isLoading={isLoading}
        isError={isError}
        columns={[
          {
            key: "user",
            label: "Student",
            render: (e) => (
              <div>
                <p className="font-medium text-gray-800">{e.user?.name || "—"}</p>
                <p className="text-xs text-gray-400">{e.user?.email}</p>
              </div>
            ),
          },
          {
            key: "program",
            label: "Program",
            render: (e) => <span>{e.program?.name || "—"}</span>,
          },
          {
            key: "accessStatus",
            label: "Access Status",
            render: (e) => (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${accessColor(e.accessStatus)}`}
              >
                {e.accessStatus || "—"}
              </span>
            ),
          },
          {
            key: "accessOverride",
            label: "Override Active",
            render: (e) => {
              if (!e.accessOverride?.endDate)
                return <span className="text-gray-400 text-sm">None</span>;
              const isActive = new Date(e.accessOverride.endDate) > new Date();
              return (
                <div>
                  <span
                    className={`text-xs font-medium ${isActive ? "text-green-600" : "text-gray-400"
                      }`}
                  >
                    {isActive ? "Active" : "Expired"}
                  </span>
                  <p className="text-xs text-gray-400">
                    Until:{" "}
                    {new Date(e.accessOverride.endDate).toLocaleDateString()}
                  </p>
                </div>
              );
            },
          },
          // Finance column — sirf admin dekhe
          ...(isAdmin
            ? [
              {
                key: "financeGraceDaysUsed",
                label: "Finance Pool Used",
                render: (e: any) => (
                  <PoolBadge
                    remaining={90 - (e.financeGraceDaysUsed || 0)}
                    total={90}
                  />
                ),
              },
            ]
            : []),
          {
            key: "enrolledAt",
            label: "Enrolled",
            render: (e) => (
              <span className="text-gray-400 text-sm">
                {e.enrolledAt
                  ? new Date(e.enrolledAt).toLocaleDateString()
                  : "—"}
              </span>
            ),
          },
        ]}
        actions={[
          {
            icon: <KeyRound size={14} />,
            label: isFinance ? "Finance Grant" : "Grant Access",
            onClick: handleGrantClick,
            className: "hover:bg-teal-50 hover:text-teal-600",
            // Finance pool exhausted hogi tab row level pe disable nahi kar sakte
            // Modal mein handle kiya hai
          },
        ]}
      />

      {/* ── Grant Modal ─────────────────────────────────────── */}
      {grantingAccess && (
        <>
          {/* Admin modal */}
          {isAdmin && (
            <Modal
              isOpen={!!grantingAccess}
              onClose={() => setGrantingAccess(null)}
              title="Grant Free Access"
              subtitle={grantingAccess.user?.name}
              fields={adminGrantFields}
              initialValues={{ days: "30", reason: "" }}
              onSubmit={adminGrant}
              isLoading={isAdminGranting}
              mode="add"
            />
          )}

          {/* Finance modal */}
          {isFinance && (
            <Modal
              isOpen={!!grantingAccess}
              onClose={() => setGrantingAccess(null)}
              title="Grant Finance Access"
              subtitle={grantingAccess.user?.name}
              fields={financeGrantFields}
              initialValues={{ days: "", reason: "" }}
              onSubmit={financeGrant}
              isLoading={isFinanceGranting}
              mode="add"
            />
          )}
        </>
      )}
    </>
  );
}