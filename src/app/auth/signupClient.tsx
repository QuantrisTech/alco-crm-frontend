"use client";
import React, { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Turnstile } from "@marsidev/react-turnstile";
import { registerUser } from "@/utils/api";
import toast from "react-hot-toast";
import InputField from "../component/ui/inputField";
import Button from "../component/ui/button";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/logo.webp"

export default function SignupClient({ onSwitchMode }: { onSwitchMode?: () => void }) {
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<any>(null);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: { name: "", email: "", phone: "" },
  });

  const onSubmit = async (data: any) => {
    if (!turnstileToken) {
      toast.error("Please complete the security check.");
      return;
    }

    try {
      const res = await registerUser({ ...data, turnstileToken });
      toast.success(
        res.data.duplicate
          ? "You're already registered! Check your email for login details. 😊"
          : "Account created! Check your email for login details. 📧"
      );
      reset();
      setTurnstileToken("");
      turnstileRef.current?.reset();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Something went wrong. Try again.";
      toast.error(msg);
      setTurnstileToken("");
      turnstileRef.current?.reset();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">

        {/* Logo */}
        {/* <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-gray-900 font-bold">A</span>
          </div>
          <span className="text-gray-900 font-bold text-xl">ALCO CRM</span>
        </div> */}
        <div className="flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 mb-4 ">
          <Image
            src={Logo}
            alt="logo"
            className="h-10 md:h-11 xl:h-12 2xl:h-13  w-auto "
            priority
          />
        </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">Create your account</h1>
        <p className="text-gray-400 text-sm mb-6">Sign up to get started</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="name"
            control={control}
            rules={{ required: "Name is required" }}
            render={({ field }) => (
              <InputField label="Full Name*" {...field} error={errors.name?.message} />
            )}
          />

          <Controller
            name="email"
            control={control}
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email address",
              },
            }}
            render={({ field, fieldState }) => (
              <InputField label="Email*" type="email" {...field} error={fieldState.error?.message} />
            )}
          />

          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <InputField label="Phone (optional)" type="tel" {...field} error={errors.phone?.message} />
            )}
          />

          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            options={{ appearance: "always" }}
            onSuccess={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken("")}
            onError={() => setTurnstileToken("")}
          />

          <Button fullWidth isLoading={isSubmitting} loadingText="Signing up...">
            Sign Up
          </Button>
        </form>

        {/* Toggle to Login */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchMode}
            className="text-yellow-600 font-medium hover:text-yellow-700 transition"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}