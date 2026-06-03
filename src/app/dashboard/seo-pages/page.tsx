"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { adminGetSeoPages, adminDeleteSeoPage } from "@/utils/api";
import ProtectedRoute from "@/app/component/protected-route";
import toast from "react-hot-toast";
import { Globe, Pencil, Trash2, Search, FileText, ChevronDown, ChevronRight } from "lucide-react";

// ── Full SEO page structure ──
const SEO_STRUCTURE = [
  {
    group: "Static Pages",
    icon: "🌐",
    pages: [
      { slug: "home", label: "Home", url: "/" },
      { slug: "get-1on1-coaching", label: "Get 1:1 Coaching", url: "/get-1on1-coaching" },
      { slug: "blogs", label: "Blogs (Listing)", url: "/blogs" },
      { slug: "contact", label: "Contact", url: "/contact" },
    ],
  },
  {
    group: "Programs",
    icon: "🎓",
    pages: [
      { slug: "programs", label: "Main", url: "/programs" },
      { slug: "nlp-practitioner", label: "NLP Practitioner", url: "/programs/nlp-practitioner" },
      { slug: "nlp-master-practitioner", label: "NLP Master Practitioner", url: "/programs/nlp-master-practitioner" },
      { slug: "advanced-hypnotherapy-training", label: "Advanced Hypnotherapy Training", url: "/programs/advanced-hypnotherapy-training" },
      { slug: "nlp-trainers-training-program", label: "NLP Trainer's Training Program", url: "/programs/nlp-trainers-training-program" },
      { slug: "hypnosis-trainers-training-program", label: "Hypnosis Trainer's Training Program", url: "/programs/hypnosis-trainers-training-program" },
      { slug: "nlp-master-trainer-program", label: "NLP Master Trainer Program", url: "/programs/nlp-master-trainer-program" },
    ],
  },
  {
    group: "About Us",
    icon: "👥",
    pages: [
      { slug: "who-is-arslan-larik", label: "Who is Arslan Larik", url: "/about-us/arslan-larik" },
      { slug: "who-is-bismillah-pervez", label: "Who is Bismillah Pervez", url: "/about-us/bismillah-pervez" },
      { slug: "why-train-with-alco", label: "Why Train With AL&CO", url: "/about-us/why-train-with-alco" },
    ],
  },
  {
    group: "Services",
    icon: "⚙️",
    pages: [
      { slug: "four-clouds-model", label: "Four Clouds Model", url: "/four-clouds-model" },
      { slug: "resource", label: "Resource", url: "/resource" },
    ],
  },
];

// Flat list of all pages for easy lookup
const ALL_PAGES = SEO_STRUCTURE.flatMap((g) => g.pages);

function StatusBadge({ exists }: { exists: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      exists
        ? "bg-green-50 text-green-700 border border-green-200"
        : "bg-amber-50 text-amber-700 border border-amber-200"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${exists ? "bg-green-500" : "bg-amber-500"}`} />
      {exists ? "SEO Added" : "Not Set"}
    </span>
  );
}

function PageCard({
  page,
  seo,
  onEdit,
  onDelete,
  isDeleting,
}: {
  page: { slug: string; label: string; url: string };
  seo: any;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const hasData = !!seo;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-yellow-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{page.label}</h3>
            <p className="text-xs text-gray-400 font-mono">{page.url}</p>
          </div>
        </div>
        <StatusBadge exists={hasData} />
      </div>

      {hasData ? (
        <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1.5">
          <p className="text-xs font-medium text-blue-600 truncate">{seo.title}</p>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{seo.description || "No description"}</p>
          {seo.keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {seo.keywords.slice(0, 3).map((kw: string) => (
                <span key={kw} className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-600">{kw}</span>
              ))}
              {seo.keywords.length > 3 && (
                <span className="text-[10px] text-gray-400 self-center">+{seo.keywords.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
          <p className="text-xs text-amber-600">No SEO data yet. Click Add SEO to get started.</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition"
        >
          <Pencil size={12} />
          {hasData ? "Edit SEO" : "Add SEO"}
        </button>
        {hasData && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition disabled:opacity-50"
          >
            {isDeleting ? (
              <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SeoPagesDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const { data: seoData, isLoading } = useQuery({
    queryKey: ["admin-seo-pages"],
    queryFn: () => adminGetSeoPages().then((res) => res.data?.data || res.data || []),
  });

  const seoMap: Record<string, any> = {};
  if (Array.isArray(seoData)) {
    seoData.forEach((page: any) => { seoMap[page.slug] = page; });
  }

  const { mutate: deletePage, isPending: isDeleting } = useMutation({
    mutationFn: (slug: string) => adminDeleteSeoPage(slug),
    onSuccess: (_, slug) => {
      toast.success(`SEO deleted for "${slug}"!`);
      queryClient.invalidateQueries({ queryKey: ["admin-seo-pages"] });
      setDeletingSlug(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete!");
      setDeletingSlug(null);
    },
  });

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  // Filter pages based on search
  const filteredStructure = SEO_STRUCTURE.map((group) => ({
    ...group,
    pages: group.pages.filter(
      (p) =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((group) => group.pages.length > 0);

  const totalPages = ALL_PAGES.length;
  const donePages = ALL_PAGES.filter((p) => !!seoMap[p.slug]).length;

  return (
    <ProtectedRoute>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Globe size={24} className="text-yellow-500" />
            Website SEO Pages
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage SEO metadata for each page of your website
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search pages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-300 bg-white"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-32">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {filteredStructure.map((group) => {
            const isCollapsed = !!collapsedGroups[group.group];
            const groupDone = group.pages.filter((p) => !!seoMap[p.slug]).length;

            return (
              <div key={group.group}>
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="flex items-center gap-3 mb-4 w-full text-left group"
                >
                  <span className="text-lg">{group.icon}</span>
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {group.group}
                  </h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {groupDone}/{group.pages.length} done
                  </span>
                  <span className="ml-auto text-gray-400 group-hover:text-gray-600 transition">
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>

                {/* Group Pages Grid */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {group.pages.map((page) => (
                      <PageCard
                        key={page.slug}
                        page={page}
                        seo={seoMap[page.slug]}
                        onEdit={() => router.push(`/dashboard/seo-pages/${page.slug}`)}
                        onDelete={() => {
                          setDeletingSlug(page.slug);
                          deletePage(page.slug);
                        }}
                        isDeleting={isDeleting && deletingSlug === page.slug}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Footer */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            SEO Coverage:{" "}
            <span className="font-semibold text-gray-800">{donePages}/{totalPages} pages</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="w-32 bg-gray-100 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all"
                style={{ width: `${(donePages / totalPages) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">
              {Math.round((donePages / totalPages) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}