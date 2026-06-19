"use client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";
import { forgotPassword, loginUser, resetPassword } from "@/utils/api";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import InputField from "../component/ui/inputField";
import Button from "../component/ui/button";
import { FcGoogle } from "react-icons/fc";
import { FaLinkedin } from "react-icons/fa";
import Modal from "../component/ui/model/modal";

const loginSchema = z.object({
  identifier: z.string().min(3, "Please enter your email, phone, or username"),
  password: z.string().min(1, "Please enter your password").optional().or(z.literal("")),
});

type LoginForm = z.infer<typeof loginSchema>;

const forgotFields = [
  { name: "email", label: "Email", type: "input" as const, inputType: "email", placeholder: "you@example.com" },
];

const resetFields = [
  { name: "otp", label: "OTP Code", type: "input" as const, inputType: "text", placeholder: "Enter 6-digit OTP" },
  { name: "newPassword", label: "New Password", type: "input" as const, inputType: "password", placeholder: "••••••••" },
  { name: "confirmPassword", label: "Confirm Password", type: "input" as const, inputType: "password", placeholder: "••••••••" },
];

type ModalStep = "forgot" | "reset" | null;

export default function LoginClient({ onSwitchMode }: { onSwitchMode?: () => void }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>(null);
  const [otpEmail, setOtpEmail] = useState("");
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email");
  const passwordParam = searchParams.get("password");

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const identifierValue = watch("identifier") || "";

  const isLikelyOldUser = identifierValue.length > 2 && !identifierValue.includes("@");

  const { mutate, isPending } = useMutation({
    mutationFn: (data: LoginForm) => loginUser({ identifier: data.identifier, password: data.password }),
    onSuccess: (res) => {
      const userData = res.data.data.user;

      dispatch(setCredentials({
        user: userData,
        token: res.data.data.access_token,
      }));

      localStorage.setItem("refresh_token", res.data.data.refresh_token);
      toast.success("Login successful! 🎉");

      if (userData.is_old_user || userData.needsAccountSetup) {
        router.push("/dashboard/profile?setup=true");
      } else if (userData.isTemporaryPassword) {
        // router.push(`/dashboard/profile?password=${passwordParam}`);
        router.push(`/dashboard/profile?setup=true`);
      } else {
        router.push("/dashboard");
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Login failed. Please try again.");
    },
  });

  const { mutate: sendOtp, isPending: isSending } = useMutation({
    mutationFn: (data: Record<string, string | boolean>) =>
      forgotPassword({ email: data.email as string }),
    onSuccess: (_, variables) => {
      setOtpEmail(variables.email as string);
      toast.success("OTP has been sent to your email! 📧");
      setModalStep("reset");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Email address not found.");
    },
  });

  const { mutate: doReset, isPending: isResetting } = useMutation({
    mutationFn: (data: Record<string, string | boolean>) => {
      if (data.newPassword !== data.confirmPassword) throw new Error("Passwords do not match");
      return resetPassword({ email: otpEmail, otp: data.otp as string, newPassword: data.newPassword as string });
    },
    onSuccess: () => {
      toast.success("Password reset successfully! 🔒 Please log in.");
      setModalStep(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || error?.response?.data?.message || "OTP is incorrect or has expired.");
    },
  });

  useEffect(() => {
    if (emailParam) setValue("identifier", emailParam);
    if (passwordParam) setValue("password", passwordParam);
  }, [emailParam, passwordParam, setValue]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-gray-900 font-bold">A</span>
          </div>
          <span className="text-gray-900 font-bold text-xl">ALCO CRM</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome back!</h1>
        <p className="text-gray-400 text-sm mb-6">Login to your account to continue</p>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">

          <InputField
            label="Email Address (Login with Email Only)"
            type="text"
            placeholder="you@example.com / 03001234567 / john_doe"
            error={errors.identifier}
            {...register("identifier")}
          />

          <div>
            <InputField
              label={
                isLikelyOldUser
                  ? "Password (old account? leave empty)"
                  : "Password"
              }
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              error={errors.password}
              {...register("password")}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {/* Old user hint */}
            {isLikelyOldUser && (
              <p className="text-xs text-amber-600 mt-1">
                Have an old account? You can log in with your phone number or email — no password required.
              </p>
            )}

            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={() => setModalStep("forgot")}
                className="text-xs text-yellow-600 hover:text-yellow-700 transition"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <Button fullWidth isLoading={isPending} loadingText="Logging in...">
            Login
          </Button>
        </form>

        {/* Toggle to Signup */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchMode}
            className="text-yellow-600 font-medium hover:text-yellow-700 transition"
          >
            Sign Up
          </button>
        </p>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-sm text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_AUTH_API_URL}/auth/google`}
            className="w-full flex items-center justify-center gap-2 border rounded-lg py-2 text-gray-600 hover:bg-gray-50 transition"
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_AUTH_API_URL}/auth/linkedin`}
            className="w-full flex items-center justify-center gap-2 border rounded-lg py-2 text-gray-600 hover:bg-gray-50 transition"
          >
            <FaLinkedin size={20} className="text-blue-600" />
            Continue with LinkedIn
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {modalStep === "forgot" && (
        <Modal isOpen={true} onClose={() => setModalStep(null)} title="Forgot Password" subtitle="Enter your email — we'll send you an OTP." fields={forgotFields} onSubmit={(data) => sendOtp(data)} isLoading={isSending} step="forgot" />
      )}

      {/* Reset Password Modal */}
      {modalStep === "reset" && (
        <Modal isOpen={true} onClose={() => setModalStep(null)} title="Reset Password" subtitle={`OTP sent to: ${otpEmail}`} fields={resetFields} onSubmit={(data) => doReset(data)} isLoading={isResetting} step="reset" onBack={() => setModalStep("forgot")} />
      )}
    </div>
  );
}