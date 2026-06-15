"use client";
import { useAppSelector } from "@/store/hooks";
import AdminDashboard from "@/app/dashboard/users/component/admin-dashboard";
import UserDashboard from "@/app/dashboard/users/component/user-dashboard";
import SalesManagerDashboard from "@/app/dashboard/users/component/sales-manager-dashboard";
import SuperAdminDashboard from "@/app/dashboard/users/component/super-admin-dashboard";
import SalesRepDashboard from "@/app/dashboard/users/component/sales-rep-dashboard";
import SupportDashboard from "@/app/dashboard/users/component/support-dashboard";

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  const renderDashboard = () => {
    switch (user?.role) {
      case "super_admin":
        return <SuperAdminDashboard />;
      case "admin":
        return <AdminDashboard />;
      case "sales_manager":
        return <SalesManagerDashboard />;
      case "sales_rep":
        return <SalesRepDashboard />;
      case "support":
        return <SupportDashboard />;
      default:
        return <UserDashboard />;
    }
  };

  return <>{renderDashboard()}</>;
}