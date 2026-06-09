
"use client";
import ProtectedRoute from "@/app/component/protected-route";
import Sidebar from "@/app/component/sidebar";
import Navbar from "@/app/component/navbar";

import { useAppSelector } from "@/store/hooks";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "../component/loader/Loader";


export default function ConditionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // 👈 small delay only

    return () => clearTimeout(timer);
  }, [pathname]);

  if (pathname === "/login" || pathname === "/auth/callback") {
    return <>{children}</>;
  }

  return (
    <>
      {/* ✅ Overlay Loader (no layout shift) */}


      <ProtectedRoute>
        <div className="flex min-h-screen bg-gray-100">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />
            <main className="flex-1 p-6 relative min-w-0 overflow-x-auto">
              {loading ? (
                <div className="absolute inset-0 z-[999] bg-white flex items-center justify-center">
                  <Loader />
                </div>
              ) : (
                children
              )}
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </>
  );
}