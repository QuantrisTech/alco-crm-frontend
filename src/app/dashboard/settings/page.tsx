"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/app/component/dashboard/page-header";
import ProtectedRoute from "@/app/component/protected-route";
import InputField from "@/app/component/ui/inputField";
import { Settings, Save, Loader2 } from "lucide-react";
import { getProfile, updateProfile } from "@/utils/api";
import toast from "react-hot-toast";

export default function Setting() {
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile().then((res) => res.data.user),
  });

  const [form, setForm] = useState({
    fatherHusbandName: "",
    cnic: "",
    bankAccountNumber: "",
    currentAddress: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    occupation: "",
  });

  useEffect(() => {
    if (profileData) {
      setForm({
        fatherHusbandName: profileData.fatherHusbandName || "",
        cnic: profileData.cnic || "",
        bankAccountNumber: profileData.bankAccountNumber || "",
        currentAddress: profileData.currentAddress || "",
        emergencyContactName: profileData.emergencyContactName || "",
        emergencyContactPhone: profileData.emergencyContactPhone || "",
        occupation: profileData.occupation || "",
      });
    }
  }, [profileData]);

  const { mutate: saveProfile, isPending: isSaving } = useMutation({
    mutationFn: (data: any) => updateProfile(data),
    onSuccess: () => {
      toast.success("Details saved! ✅");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Failed to save!"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile(form);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-yellow-400" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageHeader
        title="Settings"
        subtitle="Manage system settings"
        titleIcon={<Settings size={24} />}
        totalCount={6}
      />

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm max-w-2xl">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
          Personal Details
        </p>
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Father / Husband Name"
            value={form.fatherHusbandName}
            onChange={(e) => setForm((p) => ({ ...p, fatherHusbandName: e.target.value }))}
            placeholder="Enter name"
          />
          <InputField
            label="CNIC Number"
            value={form.cnic}
            onChange={(e) => setForm((p) => ({ ...p, cnic: e.target.value }))}
            placeholder="XXXXX-XXXXXXX-X"
          />
          <div className="col-span-2">
            <InputField
              label="Current Address"
              value={form.currentAddress}
              onChange={(e) => setForm((p) => ({ ...p, currentAddress: e.target.value }))}
              placeholder="Enter your full address"
            />
          </div>
          <div className="col-span-2">
            <InputField
              label="Bank Account Number"
              value={form.bankAccountNumber}
              onChange={(e) => setForm((p) => ({ ...p, bankAccountNumber: e.target.value }))}
              placeholder="Account number"
            />
          </div>
          <InputField
            label="Emergency Contact Name"
            value={form.emergencyContactName}
            onChange={(e) => setForm((p) => ({ ...p, emergencyContactName: e.target.value }))}
            placeholder="Name"
          />
          <InputField
            label="Emergency Contact Number"
            value={form.emergencyContactPhone}
            onChange={(e) => setForm((p) => ({ ...p, emergencyContactPhone: e.target.value }))}
            placeholder="Phone"
          />
          <div className="col-span-2">
            <InputField
              label="Occupation / Company"
              value={form.occupation}
              onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))}
              placeholder="e.g. Software Engineer at XYZ"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isSaving ? "Saving..." : "Save Details"}
        </button>
      </form>
    </ProtectedRoute>
  );
}