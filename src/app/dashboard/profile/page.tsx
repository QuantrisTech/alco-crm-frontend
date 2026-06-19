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
import { changePassword, deleteMyAccount, getProfile, updateProfile } from "@/utils/api";
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

  // ✅ Old user setup form
  const [setupForm, setSetupForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const isOldUser = authUser?.is_old_user || authUser?.needsAccountSetup;
  const setupMode = searchParams.get("setup") === "true";

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile().then((res) => res.data.user),
  });

  useEffect(() => {
    if (data?.name) setNameForm({ name: data.name });
  }, [data]);

  useEffect(() => {
    if (data?.isTemporaryPassword && searchParams.get("password")) {
      setPasswordForm((prev) => ({ ...prev, oldPassword: searchParams.get("password") || "" }));
    }
  }, [data]);

  // Update Name
  const { mutate: updateName, isPending: isUpdating } = useMutation({
    mutationFn: () => updateProfile({ name: nameForm.name }),
    onSuccess: () => { toast.success("Profile updated! ✅"); queryClient.invalidateQueries({ queryKey: ["profile"] }); },
    onError: () => toast.error("Failed to update profile!"),
  });

  // Change Password
  const { mutate: changePass, isPending: isChangingPass } = useMutation({
    mutationFn: () => changePassword({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword }),
    onSuccess: () => { toast.success("Password changed! 🔒"); setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" }); },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Failed to change password!"),
  });

  // Delete Account
  const { mutate: deleteAccount, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteMyAccount(),
    onSuccess: () => { toast.success("Account deleted!"); dispatch(logout()); router.push("/auth"); },
    onError: () => toast.error("Failed to delete account!"),
  });

  // ✅ Complete Account Setup (old user)
  const { mutate: completeSetup, isPending: isSettingUp } = useMutation({
    mutationFn: () => API.post("/api/auth/complete-setup", {
      email: setupForm.email,
      password: setupForm.password,
    }),
    onSuccess: () => {
      toast.success("Account secured! Please verify your email. ✅");
      // Redux update — flags hatao
      dispatch(setCredentials({
        user: { ...authUser, is_old_user: false, needsAccountSetup: false },
        token: localStorage.getItem("token") || "",
      }));
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      router.push("/dashboard");
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

  useEffect(() => {
    if (data?.email) {
      setSetupForm((prev) => ({
        ...prev,
        email: data.email,
      }));
    }
  }, [data]);

  return (
    <ProtectedRoute>
      <div className="flex-1 px-2 space-y-6 max-w-3xl">

        <PageHeader
          title="Profile"
          subtitle="Manage your profile settings"
          titleIcon={<UserRoundCheck size={24} />}
        />

        {/* ✅ OLD USER — Account Setup Section (sabse upar dikhao) */}
        {(isOldUser || setupMode) && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl shadow-sm p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-800">Secure Your Account</h3>
                <p className="text-xs text-amber-600 mt-0.5">
                  Set your email and password to securely access your LMS account.
                  You can also do this later.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    // value={setupForm.email}
                    value={setupForm.email}
                    disabled={true} // Disable if not in setup mode
                    onChange={(e) => setSetupForm({ ...setupForm, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full border border-gray-200 placeholder:text-gray-400 text-gray-600 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <div className="relative">
                  <input
                    type={showSetupPassword ? "text" : "password"}
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
                <input
                  type="password"
                  value={setupForm.confirmPassword}
                  onChange={(e) => setSetupForm({ ...setupForm, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  className="w-full border border-gray-200 placeholder:text-gray-400 text-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
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
                <Button
                  variant="secondary"
                  onClick={() => router.push("/dashboard")}
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        )}

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
                {/* ✅ old user badge */}
                {data?.is_old_user && (
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

        {/* Change Password — old user ke liye hide karo agar setup nahi kiya */}
        {!isOldUser && (
          <div className={searchParams.get("password") ? "bg-red-50 border border-red-500 rounded-2xl shadow-sm p-6" : "bg-white rounded-2xl shadow-sm p-6"}>
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <Lock size={16} />
              Change Password
            </h3>
            <div className="space-y-4">
              <InputField label="Current Password" type="password" placeholder="••••••••" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} />
              <InputField label="New Password" type="password" placeholder="••••••••" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              <InputField label="Confirm New Password" type="password" placeholder="••••••••" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              <Button isLoading={isChangingPass} loadingText="Changing..." onClick={handlePasswordSubmit} variant="black">
                <Lock size={16} />
                Change Password
              </Button>
            </div>
          </div>
        )}

        <DocumentsSection
          userId={data?._id}
          documents={data?.documents || []}
          showDropdown={true}
          queryKey={["profile"]}
          title="My Documents"
        />

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-red-100">
          <h3 className="text-sm font-semibold text-red-500 flex items-center gap-2 mb-2">
            <ShieldAlert size={16} />
            Danger Zone
          </h3>
          <p className="text-gray-400 text-xs mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={16} />
            Delete Account
          </Button>

          <Popup
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={() => deleteAccount()}
            variant="danger"
            title="Delete Account"
            description={<>Are you sure? <span className="font-semibold text-red-500">This action cannot be undone.</span></>}
            confirmText="Yes, Delete My Account"
            cancelText="Cancel"
            isLoading={isDeleting}
            loadingText="Deleting..."
          />

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

      </div>
    </ProtectedRoute>
  );
}