"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { adminGetSeoPages, adminGetBlogs , adminDeleteSeoPage } from "@/utils/api";
import ProtectedRoute from "@/app/component/protected-route";
import toast from "react-hot-toast";
import {
  Globe,
  Pencil,
  Trash2,
  Search,
  FileText,
  ChevronDown,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import PageHeader from "@/app/component/dashboard/page-header";

const SEO_STRUCTURE = [
  {
    group: "Static Pages",
    icon: "🌐",
    pages: [
      { slug: "home", label: "Home", url: "/" },
      // { slug: "blogs", label: "Blogs", url: "/blogs" },
      { slug: "contact", label: "Contact", url: "/contact" },
      { slug: "one-on-one-coaching-sessions", label: "One On One Coaching Sessions", url: "/one-on-one-coaching-sessions" },
    ],
  },
  {
    group: "Blog",
    icon: "📝",
    pages: [
      { slug: "blogs", label: "Main", url: "/blogs" },
      // { slug: "latest-news", label: "Latest News", url: "/blogs/latest-news" },
      // { slug: "industry-trends", label: "Industry Trends", url: "/blogs/industry-trends" },
      // { slug: "latest-news", label: "Latest News", url: "/blogs/latest-news" },
      // { slug: "industry-trends", label: "Industry Trends", url: "/blogs/industry-trends" },
      // { slug: "latest-news", label: "Latest News", url: "/blogs/latest-news" },
      // { slug: "industry-trends", label: "Industry Trends", url: "/blogs/industry-trends" },
    ],
  },
  {
    group: "Programs",
    icon: "🎓",
    pages: [
      // { slug: "programs", label: "All Programs", url: "/programs" },
      { slug: "nlp-practitioner", label: "NLP Practitioner", url: "/programs/nlp-practitioner" },
      { slug: "nlp-master-practitioner", label: "NLP Master Practitioner", url: "/programs/nlp-master-practitioner" },
      { slug: "advanced-hypnotherapy-training", label: "Advanced Hypnotherapy", url: "/programs/advanced-hypnotherapy-training" },
      { slug: "nlp-trainers-training-program", label: "NLP Trainer's Training", url: "/programs/nlp-trainers-training-program" },
      { slug: "hypnosis-trainers-training-program", label: "Hypnosis Trainer's Training", url: "/programs/hypnosis-trainers-training-program" },
      { slug: "nlp-master-trainer-program", label: "NLP Master Trainer", url: "/programs/nlp-master-trainer-program" },
    ],
  },
  {
    group: "About Us",
    icon: "👥",
    pages: [
      { slug: "who-is-arslan-larik", label: "Arslan Larik", url: "/about-us/arslan-larik" },
      { slug: "who-is-bismillah-pervez", label: "Bismillah Pervez", url: "/about-us/bismillah-pervez" },
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

const ALL_PAGES = SEO_STRUCTURE.flatMap((g) => g.pages);

function StatusBadge({ exists }: { exists: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${exists
        ? "bg-green-50 text-green-700 border border-green-200"
        : "bg-amber-50 text-amber-700 border border-amber-200"
        }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${exists ? "bg-green-500" : "bg-amber-400"}`} />
      {exists ? "SEO Set" : "Not Set"}
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
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText size={15} className="text-yellow-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 leading-tight">{page.label}</h3>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{page.url}</p>
          </div>
        </div>
        <StatusBadge exists={hasData} />
      </div>

      {hasData ? (
        <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1.5">
          <p className="text-xs font-medium text-blue-600 truncate">{seo.title}</p>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {seo.description || "No description set"}
          </p>
          {seo.keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {seo.keywords.slice(0, 3).map((kw: string) => (
                <span key={kw} className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-600">
                  {kw}
                </span>
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
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 active:scale-95 transition-all"
        >
          <Pencil size={12} />
          {hasData ? "Edit SEO" : "Add SEO"}
        </button>
        {hasData && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 border border-red-100 text-red-400 rounded-xl hover:bg-red-50 active:scale-95 transition-all disabled:opacity-40"
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
  const [filters, setFilters] = useState({
    search: "",
  });

  const { data: seoData, isLoading } = useQuery({
    queryKey: ["admin-seo"],
    queryFn: () =>
      adminGetSeoPages().then((res) => res.data?.data || res.data || []),
  });

  // ✅ pageSlug use karo — not slug
  const seoMap: Record<string, any> = {};
  if (Array.isArray(seoData)) {
    seoData.forEach((page: any) => {
      seoMap[page.pageSlug] = page;
    });
  }

  const { mutate: deletePage, isPending: isDeleting } = useMutation({
    mutationFn: (slug: string) => adminDeleteSeoPage(slug),
    onSuccess: (_, slug) => {
      toast.success(`SEO deleted for "${slug}"`);
      queryClient.invalidateQueries({ queryKey: ["admin-seo"] });
      setDeletingSlug(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete");
      setDeletingSlug(null);
    },
  });

  const toggleGroup = (group: string) =>
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  // const filteredStructure = SEO_STRUCTURE.map((group) => ({
  //   ...group,
  //   pages: group.pages.filter(
  //     (p) =>
  //       p.label.toLowerCase().includes(search.toLowerCase()) ||
  //       p.slug.toLowerCase().includes(search.toLowerCase())
  //   ),
  // })).filter((group) => group.pages.length > 0);
  const filteredStructure = SEO_STRUCTURE.map((group) => ({
    ...group,
    pages: group.pages.filter(
      (p) =>
        p.label.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.slug.toLowerCase().includes(filters.search.toLowerCase())
    ),
  })).filter((group) => group.pages.length > 0);

  const totalPages = ALL_PAGES.length;
  const donePages = ALL_PAGES.filter((p) => !!seoMap[p.slug]).length;
  const percent = Math.round((donePages / totalPages) * 100);

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin", "seo"]}>
      {/* Header */}
      <PageHeader
        title="Website SEO"
        subtitle="Manage metadata for every page of your website"
        titleIcon={<Globe size={18} className="text-gray-900" />}
        filters={filters}
        setFilters={setFilters}
        coveredCount={donePages}
        coveredLabel={`${totalPages}`}
        filterFields={[
          {
            type: "input",
            name: "search",
            placeholder: "Search pages...",
          },
        ]}
      />

      {/* Progress bar */}
      <div className="mb-6 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 font-medium">SEO Coverage</span>
          <span className={`text-xs font-bold ${percent === 100 ? "text-green-600" : percent > 50 ? "text-yellow-600" : "text-red-500"}`}>
            {percent}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${percent === 100 ? "bg-green-500" : percent > 50 ? "bg-yellow-400" : "bg-red-400"
              }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>



      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading SEO data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredStructure.map((group) => {
            const isCollapsed = !!collapsedGroups[group.group];
            const groupDone = group.pages.filter((p) => !!seoMap[p.slug]).length;

            return (
              <div key={group.group}>
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="flex items-center gap-2.5 mb-4 w-full text-left group"
                >
                  <span className="text-base">{group.icon}</span>
                  <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                    {group.group}
                  </h2>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${groupDone === group.pages.length
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-500"
                    }`}>
                    {groupDone}/{group.pages.length}
                  </span>
                  <span className="ml-auto text-gray-300 group-hover:text-gray-500 transition">
                    {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {group.pages.map((page) => (
                      <PageCard
                        key={page.slug}
                        page={page}
                        seo={seoMap[page.slug]}
                        onEdit={() => router.push(`/dashboard/seo/${page.slug}`)}
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
    </ProtectedRoute>
  );
}