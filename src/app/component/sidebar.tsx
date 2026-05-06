"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  LogOut,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  FileText,
  Receipt,
  TrendingUp,
  ClipboardList,
  ShieldCheck,
  ScrollText,
  Wallet,
  Globe,
  Monitor,
  FileVolume
} from "lucide-react";
import Image from "next/image";
import MiniLogo from "@/assets/mini-logo-white.webp";
import Popup from "@/app/component/ui/popup/popup";
import { useState } from "react";
import { useAppSelector } from "@/store/hooks";

interface MenuItem {
  label: string;
  href?: string;
  icon: any;
  roles: string[];
  children?: { label: string; href: string }[];
}

interface MenuSection {
  title?: string;
  roles: string[];
  mode: "crm" | "website" | "all";
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    // title: "CRM",
    roles: ["super_admin", "admin", "sales_manager", "sales_rep", "user", "finance_manager"],
    mode: "crm",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["super_admin", "admin", "sales_manager", "sales_rep", "user", "finance_manager"],
      },
      {
        label: "Leads",
        href: "/dashboard/leads",
        icon: Users,
        roles: ["super_admin", "admin", "sales_manager", "sales_rep"],
      },
      {
        label: "Programs",
        href: "/dashboard/programs",
        icon: GraduationCap,
        roles: ["super_admin", "admin"],
      },
      {
        label: "Courses",
        href: "/dashboard/courses",
        icon: FileVolume,
        roles: ["user"],
      },
      {
        label: "Batches",
        href: "/dashboard/batches",
        icon: ClipboardList,
        roles: ["super_admin", "admin", "sales_manager", "sales_rep"],
      },
      {
        label: "Audit Logs",
        href: "/dashboard/audit-logs",
        icon: ScrollText,
        roles: ["super_admin", "admin"],
      },
      {
        label: "Payments",
        href: "/dashboard/payments",
        icon: Receipt,
        roles: ["super_admin", "admin", "user"],
      },
      {
        label: "Contract",
        href: "/dashboard/contract",
        icon: FileText,
        roles: ["user"],
      },
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        roles: ["super_admin", "admin", "user", "sales_manager", "sales_rep", "finance_manager"],
      },
    ],
  },
  {
    title: "Enrollments",
    roles: ["super_admin", "admin", "finance_manager", "sales_manager", "sales_rep"],
    mode: "crm",
    items: [
      {
        label: "Enrollments",
        icon: ClipboardList,
        roles: ["super_admin", "admin", "finance_manager", "sales_manager", "sales_rep"],
        children: [
          { label: "All Enrollments", href: "/dashboard/enrollments" },
          { label: "Active", href: "/dashboard/enrollments?status=active" },
          { label: "Suspended", href: "/dashboard/enrollments?status=suspended" },
          { label: "Graduated", href: "/dashboard/enrollments?status=completed" },
        ],
      },
      {
        label: "Access Control",
        href: "/dashboard/access",
        icon: ShieldCheck,
        roles: ["super_admin", "admin"],
      },
    ],
  },
  {
    title: "Finance",
    roles: ["super_admin", "admin", "finance_manager", "user"],
    mode: "crm",
    items: [
      {
        label: "Overview",
        href: "/dashboard/finance",
        icon: Wallet,
        roles: ["super_admin", "admin", "finance_manager"],
      },
      {
        label: "Invoices",
        icon: FileText,
        roles: ["super_admin", "admin", "finance_manager"],
        children: [
          { label: "All Invoices", href: "/dashboard/finance/invoices" },
          { label: "Pending", href: "/dashboard/finance/invoices/pending" },
          { label: "Overdue", href: "/dashboard/finance/invoices/overdue" },
          { label: "Upcoming Dues", href: "/dashboard/finance/invoices/upcoming" },
        ],
      },
      // {
      //   label: "Payments",
      //   icon: Receipt,
      //   roles: ["super_admin", "admin", "finance_manager"],
      //   children: [
      //     { label: "All Payments", href: "/dashboard/finance/payments" },
      //     { label: "Pending Approval", href: "/dashboard/finance/payments/pending" },
      //   ],
      // },
      {
        label: "Reports",
        icon: TrendingUp,
        roles: ["super_admin", "admin", "finance_manager"],
        children: [
          { label: "Revenue", href: "/dashboard/finance/reports/revenue" },
          { label: "Monthly Collections", href: "/dashboard/finance/reports/monthly" },
          { label: "Pending Report", href: "/dashboard/finance/reports/pending" },
        ],
      },
    ],
  },
  {
    // title: "Website",
    roles: ["super_admin", "admin"],
    mode: "website",
    items: [
      {
        label: "Blogs",
        icon: BookOpen,
        roles: ["super_admin", "admin"],
        children: [
          { label: "All Blogs", href: "/dashboard/blogs" },
          { label: "Create Blog", href: "/dashboard/blogs/create" },
        ],
      },
    ],
  },
];

type SidebarMode = "crm" | "website";

export default function Sidebar() {
  const pathname = usePathname();
  const { user: authUser } = useAppSelector((state) => state.auth);
  const role = authUser?.role;

  const [showLogout, setShowLogout] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("crm");

  const isAdmin = role === "super_admin" || role === "admin";

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleModeSwitch = (mode: SidebarMode) => {
    setSidebarMode(mode);
    setOpenMenus({});
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const filteredSections = menuSections.filter((section) => {
    if (!section.roles.includes(role)) return false;
    if (isAdmin) {
      if (section.mode === "crm") return sidebarMode === "crm";
      if (section.mode === "website") return sidebarMode === "website";
      return true;
    }
    return true;
  });

  return (
    <div className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">

      {/* Logo */}
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center shrink-0">
            <Image
              src={MiniLogo}
              alt="ALCO CRM Logo"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-semibold text-sm truncate">
              Arslan Larik & Company
            </span>
            <span className="text-gray-400 text-xs">CRM of the company</span>
          </div>
        </div>
      </div>

      {/* Option 4 — stacked nav style toggle (sirf admin / super_admin) */}
      {isAdmin && (
        <div className="px-3 pt-4 pb-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">
            Mode
          </p>
          <div className="space-y-0.5">

            <button
              onClick={() => handleModeSwitch("crm")}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                sidebarMode === "crm"
                  ? "bg-yellow-400/15 border-yellow-400/40 text-yellow-300"
                  : "border-transparent text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Monitor
                size={16}
                className={sidebarMode === "crm" ? "text-yellow-400" : ""}
              />
              <span>CRM</span>
              {sidebarMode === "crm" && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400" />
              )}
            </button>

            <button
              onClick={() => handleModeSwitch("website")}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                sidebarMode === "website"
                  ? "bg-yellow-400/15 border-yellow-400/40 text-yellow-300"
                  : "border-transparent text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Globe
                size={16}
                className={sidebarMode === "website" ? "text-yellow-400" : ""}
              />
              <span>Website</span>
              {sidebarMode === "website" && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400" />
              )}
            </button>

          </div>
        </div>
      )}

      {isAdmin && <div className="mx-4 mt-3 border-t border-gray-700/60" />}

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {filteredSections.map((section) => {
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              {section.title && ( <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">
                {section.title}
              </p>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;

                  if (item.children) {
                    const isOpen = !!openMenus[item.label];
                    const isChildActive = item.children.some(
                      (child) =>
                        pathname === child.href ||
                        pathname.startsWith(child.href)
                    );

                    return (
                      <div key={item.label}>
                        <button
                          onClick={() => toggleMenu(item.label)}
                          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all ${
                            isChildActive
                              ? "text-yellow-400"
                              : "text-gray-400 hover:bg-gray-800 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={18} />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          {isOpen ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                        </button>

                        {isOpen && (
                          <div className="ml-7 mt-1 space-y-1 border-l border-gray-700 pl-3">
                            {item.children.map((child) => {
                              const isActive = pathname === child.href;
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={`block px-3 py-2 rounded-md text-sm transition-all ${
                                    isActive
                                      ? "bg-yellow-400 text-gray-900 font-semibold"
                                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (!item.href) return null;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive
                          ? "bg-yellow-400 text-gray-900 font-semibold"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => setShowLogout(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all w-full"
        >
          <LogOut size={18} />
          <span className="text-sm">Logout</span>
        </button>
      </div>

      <Popup
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
        variant="info"
        title="Log Out"
        description="Are you sure you want to log out? You will need to sign in again to access your dashboard."
        confirmText="Yes, Log Out"
        cancelText="Stay"
      />
    </div>
  );
}