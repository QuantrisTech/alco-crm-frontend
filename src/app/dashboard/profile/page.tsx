"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout, setCredentials } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protected-route";
import Button from "@/app/component/ui/button";
import InputField from "@/app/component/ui/inputField";
import toast from "react-hot-toast";
import { User, Lock, Trash2, Save, ShieldAlert, UserRoundCheck, ShieldCheck, Eye, EyeOff, Mail } from "lucide-react";
import { changePassword, deleteMyAccount, getProfile, selfVerifyEmail, updateProfile } from "@/utils/api";
import API from "@/utils/api";
import Popup from "@/app/component/ui/popup/popup";
import PageHeader from "@/app/component/dashboard/page-header";
import DocumentsSection from "./component/documents-section";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: authUser } = useAppSelector((state) => state.auth);
  const searchParams = useSearchParams();

  const [nameForm, setNameForm] = useState({ name: authUser?.name || "" });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: searchParams.get("password") || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // ✅ Old user setup form (is_old_user === true → email + new + confirm, NO current password)
  const [setupForm, setSetupForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const setupMode = searchParams.get("setup") === "true";

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile().then((res) => res.data.user),
  });

  // ─────────────────────────────────────────────────────────────
  // 🔑 YEH ASLI FLAG HAI JISPE BRANCH KARNA HAI — NA KE isTemporaryPassword PE
  // is_old_user === true  → legacy user, password hi nahi tha → setup flow (email + new + confirm)
  // is_old_user === false + isTemporaryPassword === true → register wala naya user,
  //    temp password already mila hua hai → normal change-password flow (current + new + confirm)
  // is_old_user === false + isTemporaryPassword === false → normal existing user → change-password flow
  // ─────────────────────────────────────────────────────────────
  const isOldUser = authUser?.is_old_user ?? data?.is_old_user;

  // ✅ Explicit verify-popup state — har baar jab profile data aaye ya refresh ho
  // (password change ke baad, ya profile screen pe pehli baar mount hone pe)
  // check karo: agar user is_old_user nahi hai, temp password nahi hai, aur isVerified false hai
  // → popup khol do. Warna band rakho.
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);

  useEffect(() => {
    if (!data) return; // profile abhi load nahi hui, kuch check mat karo

    const shouldShowVerify =
      !isOldUser && !data?.isTemporaryPassword && !data?.isVerified;

    setShowVerifyPopup(shouldShowVerify);
  }, [data, isOldUser]);

  useEffect(() => {
    if (data?.name) setNameForm({ name: data.name });
  }, [data]);

  useEffect(() => {
    if (!isOldUser && data?.isTemporaryPassword && searchParams.get("password")) {
      setPasswordForm((prev) => ({ ...prev, oldPassword: searchParams.get("password") || "" }));
    }
  }, [data, isOldUser]);

  useEffect(() => {
    if (data?.email) {
      setSetupForm((prev) => ({ ...prev, email: data.email }));
    }
  }, [data]);

  // Update Name
  const { mutate: updateName, isPending: isUpdating } = useMutation({
    mutationFn: () => updateProfile({ name: nameForm.name }),
    onSuccess: () => { toast.success("Profile updated! ✅"); queryClient.invalidateQueries({ queryKey: ["profile"] }); },
    onError: () => toast.error("Failed to update profile!"),
  });

  // Change Password — current + new + confirm (register-wala temp-password user, ya normal user)
  const { mutate: changePass, isPending: isChangingPass } = useMutation({
    mutationFn: () => changePassword({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword }),
    onSuccess: () => {
      toast.success("Password changed! 🔒");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      // ✅ Password change hote hi profile data refresh karo — taake isTemporaryPassword/isVerified
      // fresh values ke saath aayen aur verify popup ka check sahi chale
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Failed to change password!"),
  });

  // ✅ Instant self-verify — popup ke button se, koi email link ki zaroorat nahi
  const { mutate: selfVerify, isPending: isSelfVerifying } = useMutation({
    mutationFn: () => selfVerifyEmail(),
    onSuccess: () => {
      toast.success("Email verified successfully! ✅");
      setShowVerifyPopup(false); // ✅ turant band karo
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to verify!"),
  });

  // ✅ Complete Account Setup — sirf is_old_user === true ke liye (email + new + confirm, no current password)
  const { mutate: completeSetup, isPending: isSettingUp } = useMutation({
    mutationFn: () => API.post("/api/auth/complete-setup", {
      email: setupForm.email,
      password: setupForm.password,
    }),
    onSuccess: () => {
      toast.success("Account secured! Please verify your email. ✅");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed!"),
  });

  const handlePasswordSubmit = () => {
    if (!passwordForm.oldPassword.trim()) {
      toast.error("Current password is required!");
      return;
    }
    if (!passwordForm.newPassword.trim()) {
      toast.error("New password is required!");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters!");
      return;
    }
    if (!passwordForm.confirmPassword.trim()) {
      toast.error("Please confirm your new password!");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    setShowPasswordConfirm(true);
  };

  const handleSetupSubmit = () => {
    if (!setupForm.email.trim()) {
      toast.error("Email is required!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(setupForm.email)) {
      toast.error("Please enter a valid email address!");
      return;
    }

    if (!setupForm.password.trim()) {
      toast.error("Password is required!");
      return;
    }
    if (setupForm.password.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }
    if (!setupForm.confirmPassword.trim()) {
      toast.error("Please confirm your password!");
      return;
    }
    if (setupForm.password !== setupForm.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    completeSetup();
  };

  const roleColor = (role: string) => {
    switch (role) {
      case "super_admin": return "bg-purple-100 text-purple-700";
      case "admin": return "bg-yellow-100 text-yellow-700";
      case "sales_manager": return "bg-blue-100 text-blue-700";
      case "finance_manager": return "bg-teal-100 text-teal-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex-1 px-2 space-y-6 max-w-3xl">

        <PageHeader
          title="Profile"
          subtitle="Manage your profile settings"
          titleIcon={<UserRoundCheck size={24} />}
        />

        {/* ───────────────────────────────────────────────────────
            Password Section — ab sirf isOldUser pe branch hota hai
            isOldUser === true  → Setup flow (email + new + confirm), koi current password field nahi
            isOldUser === false → Normal change-password flow (current + new + confirm)
               (chahe isTemporaryPassword true ho ya false — dono case mein current password chahiye,
                kyunki inka ek password already exist karta hai jo verify hona zaroori hai)
           ─────────────────────────────────────────────────────── */}
        <div className={isOldUser
          ? "bg-amber-50 border border-amber-300 rounded-2xl shadow-sm p-6"
          : "bg-white rounded-2xl shadow-sm p-6"
        }>
          <div className="flex items-start gap-3 mb-5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isOldUser ? "bg-amber-100" : "bg-gray-100"}`}>
              {isOldUser
                ? <ShieldCheck size={18} className="text-amber-600" />
                : <Lock size={16} className="text-gray-600" />
              }
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isOldUser ? "text-amber-800" : "text-gray-700"}`}>
                {isOldUser ? "Secure Your Account" : "Change Password"}
              </h3>
              {isOldUser && (
                <p className="text-xs text-amber-600 mt-0.5">
                  Set your password to securely access your LMS account.
                </p>
              )}
              {!isOldUser && data?.isTemporaryPassword && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Enter the temporary password you received by email, then set a new one.
                </p>
              )}
            </div>
          </div>

          {isOldUser ? (
            // ── OLD USER: email (readonly/prefilled) + new + confirm — NO current password ──
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={setupForm.email}
                  onChange={(e) => setSetupForm({ ...setupForm, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 placeholder:text-gray-400 text-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <div className="relative">
                  <input
                    type={showSetupPassword ? "text" : "password"}
                    name="new-password"
                    autoComplete="new-password"
                    value={setupForm.password}
                    onChange={(e) => setSetupForm({ ...setupForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full border border-gray-200 placeholder:text-gray-400 text-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-10"
                  />
                  <button type="button" onClick={() => setShowSetupPassword(!showSetupPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showSetupPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirm-password"
                    autoComplete="new-password"
                    value={setupForm.confirmPassword}
                    onChange={(e) => setSetupForm({ ...setupForm, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    className="w-full border border-gray-200 placeholder:text-gray-400 text-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-10"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSetupSubmit}
                  isLoading={isSettingUp}
                  loadingText="Saving..."
                  variant="black"
                >
                  <ShieldCheck size={16} />
                  Secure My Account
                </Button>
                <Button variant="secondary" onClick={() => router.push("/dashboard")}>
                  Later
                </Button>
              </div>
            </div>
          ) : (
            // ── NORMAL / REGISTER-TEMP-PASSWORD USER: current + new + confirm ──
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {data?.isTemporaryPassword ? "Temporary Password" : "Current Password"}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 placeholder:text-gray-400 text-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-10"
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <div className="relative">
                  <input
                    type={showSetupPassword ? "text" : "password"}
                    name="new-password"
                    autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full border border-gray-200 placeholder:text-gray-400 text-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-10"
                  />
                  <button type="button" onClick={() => setShowSetupPassword(!showSetupPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showSetupPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirm-password"
                    autoComplete="new-password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    className="w-full border border-gray-200 placeholder:text-gray-400 text-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-10"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handlePasswordSubmit}
                  isLoading={isChangingPass}
                  loadingText="Changing..."
                  variant="black"
                >
                  <Lock size={16} />
                  Change Password
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-gray-900 font-bold text-2xl"
              style={{ background: data?.avatarColor, backdropFilter: "blur(10px)", opacity: 0.8 }}
            >
              {data?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{data?.name}</h2>
              <p className="text-gray-400 text-sm">{data?.email || data?.phone || data?.username || "—"}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColor(data?.role)}`}>
                  {data?.role}
                </span>
                {isOldUser && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    Account setup pending
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Update Name */}
          <div className="border-t pt-5">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <User size={16} />
              Update Name
            </h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <InputField
                  label="Full Name"
                  type="text"
                  placeholder="Enter your name"
                  value={nameForm.name}
                  onChange={(e) => setNameForm({ name: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button isLoading={isUpdating} loadingText="Saving..." onClick={() => updateName()} variant="black">
                  <Save size={16} />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DocumentsSection
          userId={data?._id}
          documents={data?.documents || []}
          showDropdown={true}
          queryKey={["profile"]}
          title="My Documents"
        />

        {/* ───────────────────────────────────────────────────────
            Email verify ab sirf is popup ke instant button se hoga.
            Email pe jaake link click karne ki zaroorat nahi —
            "Verify Email" dabate hi selfVerifyEmail API call hoti hai
            aur turant isVerified = true ho jata hai (no OTP, no email link).
           ─────────────────────────────────────────────────────── */}
        {showVerifyPopup && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-gray-950/20 p-4">
            <div className="bg-blue-50 border border-blue-300 rounded-2xl shadow-sm p-6 max-w-sm w-full">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-800">Verify Your Email</h3>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Click below to verify your email and unlock all features. No need to check your inbox.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => selfVerify()}
                  isLoading={isSelfVerifying}
                  loadingText="Verifying..."
                  variant="black"
                  type="button"
                >
                  <ShieldCheck size={16} />
                  Verify Email
                </Button>
              </div>
            </div>
          </div>
        )}

        <Popup
          isOpen={showPasswordConfirm}
          onClose={() => setShowPasswordConfirm(false)}
          onConfirm={() => { setShowPasswordConfirm(false); changePass(); }}
          variant="warning"
          title="Change Password"
          description="Are you sure you want to change your password?"
          confirmText="Yes, Change Password"
          cancelText="Cancel"
        />

      </div>
    </ProtectedRoute>
  );
}