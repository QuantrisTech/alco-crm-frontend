"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials, logout } from "@/store/authSlice";
import { getMe } from "@/utils/api";
import toast from "react-hot-toast";
import { IoMdClose } from "react-icons/io";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(true);

  // ✅ Sirf ek baar toast show hoga
  const tempToastShown = useRef(false);

  // ─────────────────────────────────────────────────────────────
  // AUTH + ROLE CHECK
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (pathname === "/auth/callback") {
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      // router.push("/login");
      router.push("/auth");
      return;
    }

    getMe()
      .then((res) => {
        const userData = res.data.user;

        dispatch(setCredentials({ user: userData, token }));

        // ✅ Role Check
        if (allowedRoles && allowedRoles.length > 0) {
          if (!allowedRoles.includes(userData?.role)) {
            toast.error("Access denied. You don't have permission.");
            router.push("/dashboard");
            return;
          }
        }

        // ✅ user temp state localStorage me save
        localStorage.setItem(
          "isTemporaryPassword",
          userData?.isTemporaryPassword ? "true" : "false"
        );

        setIsLoading(false);
      })
      .catch(() => {
        dispatch(logout());
        localStorage.removeItem("isTemporaryPassword");
        // router.push("/login");
        router.push("/auth");
      });
  }, [pathname]);

  // ─────────────────────────────────────────────────────────────
  // TEMP PASSWORD TOAST
  // pathname pe depend nahi karega
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const isTemporary =
      localStorage.getItem("isTemporaryPassword") === "true";

    // ✅ already shown hai tw dobara nahi
    if (!isTemporary || tempToastShown.current) return;

    tempToastShown.current = true;

    toast(
      (t) => (
        <div className="relative pt-4">
          <div>
            ⚠️ You are using a temporary password.
            <br />
            Please update it to continue securely.
          </div>

          <div className="flex flex-col gap-2 my-2">
            <button
              className="text-yellow-600 underline text-sm"
              onClick={() => {
                router.push("/dashboard/profile");
                toast.dismiss(t.id);
              }}
            >
              Update Password
            </button>

            <button
              className="text-gray-500 text-sm absolute -top-1 -right-2"
              onClick={() => toast.dismiss(t.id)}
            >
              <IoMdClose />
            </button>
          </div>
        </div>
      ),
      {
        id: "temporary-password-toast", // ✅ unique id
        duration: Infinity,
      }
    );
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}