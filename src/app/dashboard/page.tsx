"use client";
import { useAppSelector } from "@/store/hooks";
import AdminDashboard from "./admin-dashboard";
import UserDashboard from "./user-dashboard";
import SalesManagerDashboard from "./sales-manager-dashboard";
import SuperAdminDashboard from "./super-admin-dashboard";
import SalesRepDashboard from "./sales-rep-dashboard";
import FinanceManagerDashboard from "./finance-manager";
import SupportDashboard from "./support-dashboard";
import SeoDashboard from "./seo-dashboard";

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
      case "finance_manager":
        return <FinanceManagerDashboard />;
        case "seo":
        return <SeoDashboard />;
      default:
        return <UserDashboard />;
    }
  };

  return <>{renderDashboard()}</>;
}