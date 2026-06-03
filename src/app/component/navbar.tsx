"use client";
import { Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import NotificationBell from "./dashboard/notification-bell";

export default function Navbar() {
  const { user } = useAppSelector((state) => state.auth);
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
    } else {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserName(parsed.name || "Admin");
      }
    }
  }, [user]);

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 w-80">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none text-sm text-gray-600 w-full"
        />
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <NotificationBell />

        {/* User Avatar — Profile Link */}
        <Link href="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
          <div className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-yellow-500 transition" style={{
                                background: user?.avatarColor,
                                backdropFilter: "blur(10px)",
                                opacity: 0.8,
                            }}>
            <span className="text-gray-900 font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700">{userName}</span>
        </Link>
      </div>
    </div>
  );
}