"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetSeoPageBySlug,
  adminUpsertSeoPage,
  adminDeleteSeoPage,
} from "@/utils/api";
import ProtectedRoute from "@/app/component/protected-route";
import Breadcrumb from "@/app/component/ui/breadcrumb";
import toast from "react-hot-toast";
import {
  Save,
  ArrowLeft,
  Globe,
  Eye,
  Trash2,
  Info,
  Search,
  Share2,
} from "lucide-react";

// ── Slug → display label map ──
const PAGE_LABELS: Record<string, { label: string; url: string }> = {
  home: { label: "Home", url: "/" },
  programs: { label: "Programs", url: "/programs" },
  "about-us": { label: "About Us", url: "/about-us" },
  "four-clouds-model": {
    label: "Four Clouds Model",
    url: "/four-clouds-model",
  },
  "get-1on1-coaching": {
    label: "Get 1:1 Coaching",
    url: "/get-1on1-coaching",
  },
};

// ── Helper Components ──
function Label({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <label className="text-sm font-medium text-gray-700 block">
        {children}
      </label>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function CharCount({
  value,
  min,
  max,
}: {
  value: string;
  min: number;
  max: number;
}) {
  const len = value.length;
  const color =
    len === 0
      ? "text-gray-300"
      : len < min
      ? "text-amber-500"
      : len > max
      ? "text-red-500"
      : "text-green-500";
  return (
    <span className={`text-xs font-mono ${color}`}>
      {len}/{max}
    </span>
  );
}

// ── Google Preview ──
function GooglePreview({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
        Google Search Preview
      </p>
      <div className="space-y-0.5">
        <p className="text-xs text-green-700 truncate">{url}</p>
        <p className="text-blue-600 text-base font-medium hover:underline cursor-pointer leading-snug line-clamp-1">
          {title || "Page Title — Add a title above"}
        </p>
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {description || "Add a meta description above to see how it will appear in Google search results."}
        </p>
      </div>
    </div>
  );
}

// ── Main Edit Page ──
export default function EditSeoPage() {
  const { slug } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pageSlug = slug as string;

  const pageInfo = PAGE_LABELS[pageSlug] || {
    label: pageSlug,
    url: `/${pageSlug}`,
  };

  const [form, setForm] = useState({
    title: "",
    description: "",
    keywords: "",
    og_title: "",
    og_description: "",
    og_image: "",
    canonical_url: "",
    no_index: false,
  });

  // ── Fetch existing SEO data ──
  const { data, isLoading } = useQuery({
    queryKey: ["admin-seo-page", pageSlug],
    queryFn: () =>
      adminGetSeoPageBySlug(pageSlug)
        .then((res) => res.data?.data || res.data)
        .catch(() => null), // If 404, return null (page not created yet)
    enabled: !!pageSlug,
    retry: false,
  });

  // ── Populate form when data loads ──
  useEffect(() => {
    if (data) {
      setForm({
        title: data.title || "",
        description: data.description || "",
        keywords: Array.isArray(data.keywords)
          ? data.keywords.join(", ")
          : data.keywords || "",
        og_title: data.og_title || "",
        og_description: data.og_description || "",
        og_image: data.og_image || "",
        canonical_url: data.canonical_url || "",
        no_index: data.no_index || false,
      });
    }
  }, [data]);

  // ── Upsert Mutation (PATCH — creates if not exists, updates if exists) ──
  const { mutate: savePage, isPending } = useMutation({
    mutationFn: (payload: any) => adminUpsertSeoPage(pageSlug, payload, !!data),
    onSuccess: () => {
      toast.success("SEO data saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-seo-pages"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-seo-page", pageSlug],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to save SEO data!"
      );
    },
  });

  // ── Delete Mutation ──
  const { mutate: deletePage, isPending: isDeleting } = useMutation({
    mutationFn: () => adminDeleteSeoPage(pageSlug),
    onSuccess: () => {
      toast.success("SEO data deleted!");
      queryClient.invalidateQueries({ queryKey: ["admin-seo-pages"] });
      router.push("/dashboard/seo-pages");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete SEO data!"
      );
    },
  });

  // ── Handle Submit ──
  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("Meta Title is required!");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Meta Description is required!");
      return;
    }

    savePage({
      slug: pageSlug,
      title: form.title.trim(),
      description: form.description.trim(),
      keywords: form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      og_title: form.og_title.trim() || form.title.trim(),
      og_description:
        form.og_description.trim() || form.description.trim(),
      og_image: form.og_image.trim() || undefined,
      canonical_url: form.canonical_url.trim() || undefined,
      no_index: form.no_index,
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center py-32">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://alcocrm.com";
  const fullUrl = `${siteUrl}${pageInfo.url}`;

  return (
    <ProtectedRoute>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "SEO Pages", href: "/dashboard/seo-pages" },
          { label: pageInfo.label },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Globe size={24} className="text-yellow-500" />
            SEO — {pageInfo.label}
          </h1>
          <p className="text-gray-400 text-sm mt-1 font-mono">
            {pageInfo.url}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/seo-pages")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
          >
            <ArrowLeft size={15} />
            Back
          </button>
          {data && (
            <button
              onClick={() => {
                if (confirm("Delete all SEO data for this page?"))
                  deletePage();
              }}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 border border-red-100 text-red-500 bg-white rounded-xl text-sm font-medium hover:bg-red-50 transition disabled:opacity-50"
            >
              <Trash2 size={15} />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            <Save size={15} />
            {isPending ? "Saving..." : data ? "Update" : "Create"}
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {!data && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-amber-700">
          <Info size={15} />
          No SEO data exists for this page yet. Fill in the form and click{" "}
          <strong>Create</strong> to add it.
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left — Main SEO Fields (2/3) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Core SEO */}
          <Card title="Core SEO" icon={<Search size={14} />}>
            {/* Meta Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label hint="Shown in browser tab and Google search result title.">
                  Meta Title <span className="text-red-400">*</span>
                </Label>
                <CharCount value={form.title} min={30} max={60} />
              </div>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder={`${pageInfo.label} | AL&CO Center`}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
              />
              <p className="text-xs text-gray-400 mt-1">
                Ideal: 50–60 characters
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label hint="The snippet shown under the title in search results.">
                  Meta Description <span className="text-red-400">*</span>
                </Label>
                <CharCount
                  value={form.description}
                  min={120}
                  max={160}
                />
              </div>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="A compelling one-liner about this page..."
                rows={3}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Ideal: 120–160 characters
              </p>
            </div>

            {/* Keywords */}
            <div>
              <Label hint="Comma-separated. Helps internal tracking; not directly used by Google.">
                Keywords
              </Label>
              <input
                type="text"
                value={form.keywords}
                onChange={(e) =>
                  setForm({ ...form, keywords: e.target.value })
                }
                placeholder="nlp coaching, behavioral reengineering, leadership..."
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
              />
              <p className="text-xs text-gray-400 mt-1">
                Separate with commas
              </p>
            </div>
          </Card>

          {/* Open Graph (Social) */}
          <Card title="Social Sharing (Open Graph)" icon={<Share2 size={14} />}>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
              These fields control how your page looks when shared on
              WhatsApp, Facebook, LinkedIn, etc. If left blank, falls back to
              the Core SEO fields above.
            </div>

            <div>
              <Label hint="Title shown when shared on social media.">
                OG Title
              </Label>
              <input
                type="text"
                value={form.og_title}
                onChange={(e) =>
                  setForm({ ...form, og_title: e.target.value })
                }
                placeholder={`Leave blank to use Meta Title`}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
              />
            </div>

            <div>
              <Label hint="Description shown when shared on social media.">
                OG Description
              </Label>
              <textarea
                value={form.og_description}
                onChange={(e) =>
                  setForm({ ...form, og_description: e.target.value })
                }
                placeholder="Leave blank to use Meta Description"
                rows={2}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800 resize-none"
              />
            </div>

            <div>
              <Label hint="Image URL shown as thumbnail in social shares. Use 1200×630px.">
                OG Image URL
              </Label>
              <input
                type="url"
                value={form.og_image}
                onChange={(e) =>
                  setForm({ ...form, og_image: e.target.value })
                }
                placeholder="https://yoursite.com/og-home.jpg"
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
              />
              {form.og_image && (
                <img
                  src={form.og_image}
                  alt="OG Preview"
                  className="mt-2 w-full max-w-xs h-28 object-cover rounded-lg border"
                  onError={(e) =>
                    ((e.target as HTMLImageElement).style.display = "none")
                  }
                />
              )}
            </div>
          </Card>
        </div>

        {/* Right Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Google Preview */}
          <Card title="Live Preview" icon={<Eye size={14} />}>
            <GooglePreview
              title={form.title}
              description={form.description}
              url={fullUrl}
            />
          </Card>

          {/* Advanced */}
          <Card title="Advanced">
            <div>
              <Label hint="Tells search engines the official URL for this page.">
                Canonical URL
              </Label>
              <input
                type="url"
                value={form.canonical_url}
                onChange={(e) =>
                  setForm({ ...form, canonical_url: e.target.value })
                }
                placeholder={fullUrl}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
              />
              <p className="text-xs text-gray-400 mt-1">
                Leave blank to auto-set
              </p>
            </div>

            <div className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                id="no_index"
                checked={form.no_index}
                onChange={(e) =>
                  setForm({ ...form, no_index: e.target.checked })
                }
                className="w-4 h-4 mt-0.5 accent-yellow-400"
              />
              <label
                htmlFor="no_index"
                className="text-sm text-gray-700 cursor-pointer"
              >
                <span className="font-medium">No Index</span>
                <span className="block text-xs text-gray-400 mt-0.5">
                  Hide this page from Google search results
                </span>
              </label>
            </div>
          </Card>

          {/* SEO Score Card */}
          <Card title="SEO Checklist">
            {[
              {
                label: "Meta title set",
                ok: form.title.length >= 30 && form.title.length <= 60,
                warn: form.title.length > 0,
              },
              {
                label: "Description length good",
                ok:
                  form.description.length >= 120 &&
                  form.description.length <= 160,
                warn: form.description.length > 0,
              },
              {
                label: "Keywords added",
                ok: form.keywords.trim().length > 0,
                warn: false,
              },
              {
                label: "OG image provided",
                ok: form.og_image.trim().length > 0,
                warn: false,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-sm"
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 ${
                    item.ok
                      ? "bg-green-500"
                      : item.warn
                      ? "bg-amber-400"
                      : "bg-gray-200"
                  }`}
                >
                  {item.ok ? "✓" : item.warn ? "!" : "–"}
                </span>
                <span
                  className={
                    item.ok
                      ? "text-gray-700"
                      : item.warn
                      ? "text-amber-600"
                      : "text-gray-400"
                  }
                >
                  {item.label}
                </span>
              </div>
            ))}
          </Card>

          {/* Save Button */}
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            <Save size={15} />
            {isPending ? "Saving..." : data ? "Update SEO" : "Create SEO"}
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
