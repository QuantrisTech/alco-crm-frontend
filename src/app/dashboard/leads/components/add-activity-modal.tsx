"use client";
import { useState } from "react";
import { X, Phone, Mail, Video, FileText } from "lucide-react";
import Button from "@/app/component/ui/button";

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const ACTIVITY_TYPES = [
  { value: "call", label: "Call", icon: Phone, color: "bg-green-50 border-green-200 text-green-700" },
  { value: "email", label: "Email", icon: Mail, color: "bg-blue-50 border-blue-200 text-blue-700" },
  { value: "meeting", label: "Meeting", icon: Video, color: "bg-purple-50 border-purple-200 text-purple-700" },
  { value: "note", label: "Note", icon: FileText, color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
];

const defaultForm = {
  activity_type: "call",
  title: "",
  description: "",
  // call
  call_duration_minutes: "",
  call_outcome: "",
  // email
  email_subject: "",
  // meeting
  meeting_link: "",
  meeting_datetime: "",
  meeting_location: "",
};

export default function AddActivityModal({
  isOpen,
  onClose,
  lead,
  onSubmit,
  isLoading,
}: AddActivityModalProps) {
  const [form, setForm] = useState(defaultForm);

  if (!isOpen) return null;

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    // Sirf relevant fields bhejo based on type
    const base = {
      activity_type: form.activity_type,
      title: form.title,
      description: form.description,
    };

    const extra =
      form.activity_type === "call"
        ? { call_duration_minutes: form.call_duration_minutes, call_outcome: form.call_outcome }
        : form.activity_type === "email"
        ? { email_subject: form.email_subject }
        : form.activity_type === "meeting"
        ? { meeting_link: form.meeting_link, meeting_datetime: form.meeting_datetime, meeting_location: form.meeting_location }
        : {};

    onSubmit({ ...base, ...extra });
  };

  const handleClose = () => {
    setForm(defaultForm); // reset on close
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Add Activity</h2>
            {lead && (
              <p className="text-xs text-gray-400 mt-0.5">
                {lead.first_name} {lead.last_name}
              </p>
            )}
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">

          {/* Activity Type Toggle */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Activity Type</label>
            <div className="grid grid-cols-4 gap-2">
              {ACTIVITY_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = form.activity_type === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => set("activity_type", type.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all ${
                      isActive
                        ? type.color + " border-opacity-100"
                        : "bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200"
                    }`}
                  >
                    <Icon size={16} />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title — sab mein common */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Title</label>
            <input
              type="text"
              placeholder={
                form.activity_type === "call" ? "e.g. Follow up call"
                : form.activity_type === "email" ? "e.g. Sent program details"
                : form.activity_type === "meeting" ? "e.g. Discovery meeting"
                : "e.g. Important note"
              }
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400 transition"
            />
          </div>

          {/* Description — sab mein common */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description</label>
            <textarea
              placeholder="Details..."
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400 transition resize-none"
            />
          </div>

          {/* ── CALL fields ── */}
          {form.activity_type === "call" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Duration (mins)</label>
                <input
                  type="number"
                  placeholder="15"
                  value={form.call_duration_minutes}
                  onChange={(e) => set("call_duration_minutes", e.target.value)}
                  className="w-full border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400 transition"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Outcome</label>
                <select
                  value={form.call_outcome}
                  onChange={(e) => set("call_outcome", e.target.value)}
                  className="w-full border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400 transition bg-white"
                >
                  <option value="">Select outcome</option>
                  <option value="interested">Interested</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="callback">Callback Requested</option>
                  <option value="no_answer">No Answer</option>
                  <option value="voicemail">Voicemail</option>
                  <option value="converted">Converted</option>
                </select>
              </div>
            </div>
          )}

          {/* ── EMAIL fields ── */}
          {form.activity_type === "email" && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Email Subject</label>
              <input
                type="text"
                placeholder="e.g. NLP Program Details"
                value={form.email_subject}
                onChange={(e) => set("email_subject", e.target.value)}
                className="w-full border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400 transition"
              />
            </div>
          )}

          {/* ── MEETING fields ── */}
          {form.activity_type === "meeting" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Meeting Link</label>
                <input
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={form.meeting_link}
                  onChange={(e) => set("meeting_link", e.target.value)}
                  className="w-full border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={form.meeting_datetime}
                    onChange={(e) => set("meeting_datetime", e.target.value)}
                    className="w-full border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Location</label>
                  <select
                    value={form.meeting_location}
                    onChange={(e) => set("meeting_location", e.target.value)}
                    className="w-full border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400 transition bg-white"
                  >
                    <option value="">Select</option>
                    <option value="online">Online</option>
                    <option value="in_person">In Person</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── NOTE — sirf title + description kaafi hai ── */}
          {form.activity_type === "note" && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
              <p className="text-xs text-yellow-700">
                📝 Note activity will only save the title and description.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          <Button variant="secondary" fullWidth onClick={handleClose}>
            Cancel
          </Button>
          <Button fullWidth isLoading={isLoading} loadingText="Adding..." onClick={handleSubmit}>
            Add Activity
          </Button>
        </div>

      </div>
    </div>
  );
}