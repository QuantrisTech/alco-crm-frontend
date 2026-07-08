"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import PageHeader from "@/app/component/dashboard/page-header";
import InputField from "@/app/component/ui/inputField";
import Button from "@/app/component/ui/button";
import { adminUpdateAudioPin } from "@/utils/api";
import ProtectedRoute from "@/app/component/protected-route";

export default function AudioAccessPinPage() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");

  const { mutate: updatePin, isPending } = useMutation({
    mutationFn: (pin: string) => adminUpdateAudioPin(pin),
    onSuccess: () => {
      toast.success("Pin updated successfully!");
      setPin("");
      setConfirmPin("");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || "Failed to update pin"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (pin.trim().length < 4) {
      setError("Pin must be at least 4 characters");
      return;
    }
    if (pin !== confirmPin) {
      setError("Pins do not match");
      return;
    }

    updatePin(pin.trim());
  };

  return (
    <ProtectedRoute>
      <PageHeader
        title="Audio Access Pin"
        subtitle="Set or change the pin required to open the audio access request form"
        titleIcon={<KeyRound size={24} />}
      />

      <div className="max-w-md">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="New Pin"
              type={showPin ? "text" : "password"}
              placeholder="Enter new pin"
              value={pin}
              onChange={(e: any) => setPin(e.target.value)}
              rightIcon={
                <button type="button" onClick={() => setShowPin(!showPin)}>
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <InputField
              label="Confirm Pin"
              type={showPin ? "text" : "password"}
              placeholder="Re-enter new pin"
              value={confirmPin}
              onChange={(e: any) => setConfirmPin(e.target.value)}
            />

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <Button fullWidth isLoading={isPending} loadingText="Updating...">
              Update Pin
            </Button>
          </form>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Yeh pin website ke Audio File Access form pe user ko chahiye hoga form open karne ke liye.
        </p>
      </div>
    </ProtectedRoute>
  );
}