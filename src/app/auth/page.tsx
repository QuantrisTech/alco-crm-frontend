"use client";
import { useState, Suspense } from "react";
import LoginClient from "./loginClient";
import SignupClient from "./signupClient";
import Loader from "../component/loader/Loader";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <Suspense fallback={<Loader />}>
      {mode === "login" ? (
        <LoginClient onSwitchMode={() => setMode("signup")} />
      ) : (
        <SignupClient onSwitchMode={() => setMode("login")} />
      )}
    </Suspense>
  );
}