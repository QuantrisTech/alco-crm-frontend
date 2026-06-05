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
  Code,
} from "lucide-react";

// ── Slug → display label map (ALL PAGES) ──
const PAGE_LABELS: Record<string, { label: string; url: string }> = {
  "home": { label: "Home", url: "/" },
  "get-1on1-coaching": { label: "Get 1:1 Coaching", url: "/get-1on1-coaching" },
  "blogs": { label: "Blogs", url: "/blogs" },
  "contact": { label: "Contact", url: "/contact" },
  "programs": { label: "Programs", url: "/programs" },
  "nlp-practitioner": { label: "NLP Practitioner", url: "/programs/nlp-practitioner" },
  "nlp-master-practitioner": { label: "NLP Master Practitioner", url: "/programs/nlp-master-practitioner" },
  "advanced-hypnotherapy-training": { label: "Advanced Hypnotherapy Training", url: "/programs/advanced-hypnotherapy-training" },
  "nlp-trainers-training-program": { label: "NLP Trainer's Training Program", url: "/programs/nlp-trainers-training-program" },
  "hypnosis-trainers-training-program": { label: "Hypnosis Trainer's Training Program", url: "/programs/hypnosis-trainers-training-program" },
  "nlp-master-trainer-program": { label: "NLP Master Trainer Program", url: "/programs/nlp-master-trainer-program" },
  "who-is-arslan-larik": { label: "Arslan Larik", url: "/about-us/arslan-larik" },
  "who-is-bismillah-pervez": { label: "Bismillah Pervez", url: "/about-us/bismillah-pervez" },
  "why-train-with-alco": { label: "Why Train With AL&CO", url: "/about-us/why-train-with-alco" },
  "four-clouds-model": { label: "Four Clouds Model", url: "/four-clouds-model" },
  "resource": { label: "Resource", url: "/resource" },
};

// ── Helper Components ──
function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="text-sm font-medium text-gray-700 block">{children}</label>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
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

function CharCount({ value, min, max }: { value: string; min: number; max: number }) {
  const len = value.length;
  const color =
    len === 0 ? "text-gray-300"
    : len < min ? "text-amber-500"
    : len > max ? "text-red-500"
    : "text-green-500";
  return <span className={`text-xs font-mono ${color}`}>{len}/{max}</span>;
}

function GooglePreview({ title, description, url }: { title: string; description: string; url: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Google Search Preview</p>
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

  const pageInfo = PAGE_LABELS[pageSlug] || { label: pageSlug, url: `/${pageSlug}` };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://arslanlarik.com";
  const fullUrl = `${siteUrl}${pageInfo.url}`;

  const [form, setForm] = useState({
    title: "",
    description: "",
    keywords: "",
    og_title: "",
    og_description: "",
    og_image: "",
    og_url: "",
    og_site_name: "AL&CO",
    og_locale: "en_US",
    og_type: "website",
    twitter_card: "summary_large_image",
    twitter_title: "",
    twitter_description: "",
    twitter_image: "",
    canonical_url: "",
    no_index: false,
    structured_data: "",  // ✅
  });

  // ── Fetch existing SEO data ──
  const { data, isLoading } = useQuery({
    queryKey: ["admin-seo-page", pageSlug],
    queryFn: () =>
      adminGetSeoPageBySlug(pageSlug)
        .then((res) => res.data?.data || res.data)
        .catch(() => null),
    enabled: !!pageSlug,
    retry: false,
  });

  // ── Populate form when data loads ──
  useEffect(() => {
    if (data) {
      setForm({
        title: data.title || "",
        description: data.description || "",
        keywords: Array.isArray(data.keywords) ? data.keywords.join(", ") : "",
        og_title: data.openGraph?.title || "",
        og_description: data.openGraph?.description || "",
        og_image: data.openGraph?.image || "",
        og_url: data.openGraph?.url || "",
        og_site_name: data.openGraph?.siteName || "AL&CO",
        og_locale: data.openGraph?.locale || "en_US",
        og_type: data.openGraph?.type || "website",
        twitter_card: data.twitter?.card || "summary_large_image",
        twitter_title: data.twitter?.title || "",
        twitter_description: data.twitter?.description || "",
        twitter_image: data.twitter?.image || "",
        canonical_url: data.canonical || "",
        no_index: data.robots?.index === false,
        structured_data: data.structuredData || "",  // ✅
      });
    }
  }, [data]);

  // ── Upsert Mutation ──
  const { mutate: savePage, isPending } = useMutation({
    mutationFn: (payload: any) => adminUpsertSeoPage(pageSlug, pageInfo.label, payload), // ✅ pageLabel pass
    onSuccess: () => {
      toast.success("SEO data saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-seo"] });
      queryClient.invalidateQueries({ queryKey: ["admin-seo-page", pageSlug] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to save SEO data!");
    },
  });

  // ── Delete Mutation ──
  const { mutate: deletePage, isPending: isDeleting } = useMutation({
    mutationFn: () => adminDeleteSeoPage(pageSlug),
    onSuccess: () => {
      toast.success("SEO data deleted!");
      queryClient.invalidateQueries({ queryKey: ["admin-seo"] });
      router.push("/dashboard/seo");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete SEO data!");
    },
  });

  // ── Handle Submit ──
  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("Meta Title is required!"); return; }
    if (!form.description.trim()) { toast.error("Meta Description is required!"); return; }

    // ✅ JSON validate karo
    if (form.structured_data.trim()) {
      try {
        JSON.parse(form.structured_data);
      } catch {
        toast.error("Structured Data mein invalid JSON hai — fix karo pehle!");
        return;
      }
    }

    savePage({
      title: form.title.trim(),
      description: form.description.trim(),
      keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      openGraph: {
        title: form.og_title.trim() || form.title.trim(),
        description: form.og_description.trim() || form.description.trim(),
        image: form.og_image.trim() || "",
        url: form.og_url.trim() || fullUrl,
        siteName: form.og_site_name.trim() || "AL&CO",
        locale: form.og_locale || "en_US",
        type: form.og_type || "website",
      },
      twitter: {
        card: form.twitter_card || "summary_large_image",
        title: form.twitter_title.trim() || form.og_title.trim() || form.title.trim(),
        description: form.twitter_description.trim() || form.og_description.trim() || form.description.trim(),
        image: form.twitter_image.trim() || form.og_image.trim() || "",
      },
      canonical: form.canonical_url.trim() || fullUrl,
      robots: {
        index: !form.no_index,
        follow: true,
      },
      structuredData: form.structured_data.trim(), // ✅
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

  // ── JSON valid check for UI ──
  const isJsonValid = (() => {
    if (!form.structured_data.trim()) return null; // empty — no check
    try { JSON.parse(form.structured_data); return true; }
    catch { return false; }
  })();

  return (
    <ProtectedRoute>
      <Breadcrumb
        items={[
          { label: "SEO Pages", href: "/dashboard/seo" },
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
          <p className="text-gray-400 text-sm mt-1 font-mono">{pageInfo.url}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/seo")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
          >
            <ArrowLeft size={15} /> Back
          </button>
          {data && (
            <button
              onClick={() => { if (confirm("Delete all SEO data for this page?")) deletePage(); }}
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
          No SEO data exists for this page yet. Fill in the form and click <strong>Create</strong> to add it.
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left Column (2/3) ── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Core SEO */}
          <Card title="Core SEO" icon={<Search size={14} />}>
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
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={`${pageInfo.label} | AL&CO`}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
              />
              <p className="text-xs text-gray-400 mt-1">Ideal: 50–60 characters</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label hint="The snippet shown under the title in search results.">
                  Meta Description <span className="text-red-400">*</span>
                </Label>
                <CharCount value={form.description} min={120} max={160} />
              </div>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="A compelling description of this page..."
                rows={3}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">Ideal: 120–160 characters</p>
            </div>

            <div>
              <Label hint="Comma-separated. Helps internal tracking; not directly used by Google.">
                Keywords
              </Label>
              <input
                type="text"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="nlp coaching, hypnotherapy, behavioral reengineering..."
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
              />
              <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
            </div>
          </Card>

          {/* Social Sharing */}
          <Card title="Social Sharing (Open Graph)" icon={<Share2 size={14} />}>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
              Controls how your page looks when shared on social platforms. If left blank, falls back to Core SEO fields.
            </div>

            <div>
              <Label hint="Title shown when shared on social media.">OG Title</Label>
              <input type="text" value={form.og_title}
                onChange={(e) => setForm({ ...form, og_title: e.target.value })}
                placeholder="Leave blank to use Meta Title"
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
              />
            </div>

            <div>
              <Label hint="Description shown when shared on social media.">OG Description</Label>
              <textarea value={form.og_description}
                onChange={(e) => setForm({ ...form, og_description: e.target.value })}
                placeholder="Leave blank to use Meta Description"
                rows={2}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800 resize-none"
              />
            </div>

            <div>
              <Label hint="Thumbnail shown in social shares. Recommended: 1200×630px.">OG Image URL</Label>
              <input type="url" value={form.og_image}
                onChange={(e) => setForm({ ...form, og_image: e.target.value })}
                placeholder="https://arslanlarik.com/og-home.jpg"
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
              />
              {form.og_image && (
                <img src={form.og_image} alt="OG Preview"
                  className="mt-2 w-full max-w-xs h-28 object-contain rounded-lg border"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              )}
              {form.og_image.includes("picsum") && (
                <p className="text-xs text-red-500 mt-1">⚠ Placeholder image — replace with real OG image</p>
              )}
            </div>

            <div>
              <Label hint="The page URL attached to the share card.">OG URL</Label>
              <input type="url" value={form.og_url}
                onChange={(e) => setForm({ ...form, og_url: e.target.value })}
                placeholder={fullUrl}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label hint="Your brand name.">Site Name</Label>
                <input type="text" value={form.og_site_name}
                  onChange={(e) => setForm({ ...form, og_site_name: e.target.value })}
                  placeholder="AL&CO"
                  className="w-full border rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
                />
              </div>
              <div>
                <Label hint="Language locale.">Locale</Label>
                <select value={form.og_locale}
                  onChange={(e) => setForm({ ...form, og_locale: e.target.value })}
                  className="w-full border rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800 bg-white"
                >
                  <option value="en_US">en_US</option>
                  <option value="en_GB">en_GB</option>
                  <option value="ar_AR">ar_AR</option>
                  <option value="ur_PK">ur_PK</option>
                </select>
              </div>
              <div>
                <Label hint="OG content type.">Type</Label>
                <select value={form.og_type}
                  onChange={(e) => setForm({ ...form, og_type: e.target.value })}
                  className="w-full border rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800 bg-white"
                >
                  <option value="website">website</option>
                  <option value="article">article</option>
                  <option value="profile">profile</option>
                </select>
              </div>
            </div>

            {/* Twitter / X */}
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                🐦 Twitter / X Card
              </p>
              <div className="space-y-3">
                <div>
                  <Label hint="How the card looks on Twitter/X.">Card Type</Label>
                  <select value={form.twitter_card}
                    onChange={(e) => setForm({ ...form, twitter_card: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800 bg-white"
                  >
                    <option value="summary_large_image">Summary Large Image (Recommended)</option>
                    <option value="summary">Summary (Small thumbnail)</option>
                    <option value="app">App Card</option>
                  </select>
                </div>
                <div>
                  <Label hint="Overrides OG title for Twitter. Leave blank to use OG Title.">Twitter Title</Label>
                  <input type="text" value={form.twitter_title}
                    onChange={(e) => setForm({ ...form, twitter_title: e.target.value })}
                    placeholder="Leave blank to use OG Title"
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
                  />
                </div>
                <div>
                  <Label hint="Overrides OG description for Twitter.">Twitter Description</Label>
                  <textarea value={form.twitter_description}
                    onChange={(e) => setForm({ ...form, twitter_description: e.target.value })}
                    placeholder="Leave blank to use OG Description"
                    rows={2}
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800 resize-none"
                  />
                </div>
                <div>
                  <Label hint="Overrides OG image for Twitter. Leave blank to use OG Image.">Twitter Image URL</Label>
                  <input type="url" value={form.twitter_image}
                    onChange={(e) => setForm({ ...form, twitter_image: e.target.value })}
                    placeholder="Leave blank to use OG Image"
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Platform Badges */}
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">These tags affect</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Facebook", color: "bg-blue-100 text-blue-700" },
                  { label: "WhatsApp", color: "bg-green-100 text-green-700" },
                  { label: "LinkedIn", color: "bg-sky-100 text-sky-700" },
                  { label: "Twitter / X", color: "bg-gray-100 text-gray-700" },
                  { label: "Instagram DM", color: "bg-pink-100 text-pink-700" },
                  { label: "Telegram", color: "bg-cyan-100 text-cyan-700" },
                ].map((p) => (
                  <span key={p.label} className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.color}`}>
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Structured Data */}
          <Card title="Structured Data (JSON-LD)" icon={<Code size={14} />}>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
              Paste your Schema.org JSON-LD here. Helps Google understand your page type (Organization, Course, Article, etc.)
            </div>
            <textarea
              value={form.structured_data}
              onChange={(e) => setForm({ ...form, structured_data: e.target.value })}
              placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "AL&CO"\n}`}
              rows={12}
              spellCheck={false}
              className="w-full border rounded-xl px-4 py-3 text-xs font-mono outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800 resize-none"
            />
            {isJsonValid === true && (
              <p className="text-xs text-green-600 flex items-center gap-1">✓ Valid JSON</p>
            )}
            {isJsonValid === false && (
              <p className="text-xs text-red-500 flex items-center gap-1">✗ Invalid JSON — fix before saving</p>
            )}
          </Card>
        </div>

        {/* ── Right Sidebar (1/3) ── */}
        <div className="space-y-6">

          {/* Google Preview */}
          <Card title="Live Preview" icon={<Eye size={14} />}>
            <GooglePreview title={form.title} description={form.description} url={fullUrl} />
          </Card>

          {/* Advanced */}
          <Card title="Advanced">
            <div>
              <Label hint="Tells search engines the official URL for this page.">Canonical URL</Label>
              <input type="url" value={form.canonical_url}
                onChange={(e) => setForm({ ...form, canonical_url: e.target.value })}
                placeholder={fullUrl}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800"
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank to auto-set</p>
            </div>
            <div className="flex items-start gap-3 pt-1">
              <input type="checkbox" id="no_index" checked={form.no_index}
                onChange={(e) => setForm({ ...form, no_index: e.target.checked })}
                className="w-4 h-4 mt-0.5 accent-yellow-400"
              />
              <label htmlFor="no_index" className="text-sm text-gray-700 cursor-pointer">
                <span className="font-medium">No Index</span>
                <span className="block text-xs text-gray-400 mt-0.5">Hide this page from Google search results</span>
              </label>
            </div>
          </Card>

          {/* SEO Checklist */}
          <Card title="SEO Checklist">
            {[
              {
                label: "Meta title set",
                ok: form.title.length >= 30 && form.title.length <= 60,
                warn: form.title.length > 0,
              },
              {
                label: "Description length good",
                ok: form.description.length >= 120 && form.description.length <= 160,
                warn: form.description.length > 0,
              },
              {
                label: "Keywords added",
                ok: form.keywords.trim().length > 0,
                warn: false,
              },
              {
                label: "OG image provided",
                ok: form.og_image.trim().length > 0 && !form.og_image.includes("picsum"),
                warn: form.og_image.trim().length > 0,
              },
              {
                label: "Structured data added",
                ok: isJsonValid === true,
                warn: false,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 ${
                  item.ok ? "bg-green-500" : item.warn ? "bg-amber-400" : "bg-gray-200"
                }`}>
                  {item.ok ? "✓" : item.warn ? "!" : "–"}
                </span>
                <span className={item.ok ? "text-gray-700" : item.warn ? "text-amber-600" : "text-gray-400"}>
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