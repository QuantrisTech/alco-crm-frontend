// app/verify-success/page.tsx
"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";
import toast from "react-hot-toast";

export default function VerifySuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      // JWT decode karke user set kar sakte ho, ya /me call kar lo
      toast.success("Email verified! Welcome 🎉");
      router.push("/dashboard");
    } else {
      router.push("/auth?verify=invalid");
    }
  }, [searchParams]);

  return <div className="flex items-center justify-center h-screen text-gray-500">Verifying...</div>;
}