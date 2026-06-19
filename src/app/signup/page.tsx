"use client";
import React, { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Turnstile } from "@marsidev/react-turnstile";
import { registerUser } from "@/utils/api";
import toast from "react-hot-toast";
import InputField from "../component/ui/inputField";
import Button from "../component/ui/button";

export default function SignupForm() {
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<any>(null);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
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
      // token expire ho jata hai after use, reset karo
      setTurnstileToken("");
      turnstileRef.current?.reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
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
        onSuccess={(token) => setTurnstileToken(token)}
        onExpire={() => setTurnstileToken("")}
        onError={() => setTurnstileToken("")}
      />

       <Button fullWidth isLoading={isSubmitting} loadingText="Signing up...">
          Sign Up
        </Button>
    </form>
  );
}