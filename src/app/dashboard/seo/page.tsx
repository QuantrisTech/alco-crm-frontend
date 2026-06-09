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
      { slug: "contact", label: "Contact", url: "/contact" },
      { slug: "one-on-one-coaching-sessions", label: "One On One Coaching Sessions", url: "/one-on-one-coaching-sessions" },
      { slug: "our-mission", label: "Our Mission", url: "/our-mission" },
      { slug: "faqs", label: "Frequently Asked Questions", url: "/faqs" },
      { slug: "testimonial", label: "Testimonial", url: "/testimonial" },
    ],
  },
  {
    group: "Blog",
    icon: "📝",
    pages: [
      { slug: "blogs", label: "Main", url: "/blogs" },
      { slug: "pressure-comes-from-a-lack-of-preparation", label: "Pressure Comes From a Lack of Preparation", url: "/blogs/pressure-comes-from-a-lack-of-preparation" },
      { slug: "internal-pressure-awareness-reflection-and-personal-mastery", label: "Internal Pressure: Awareness, Reflection and Personal Mastery", url: "/blogs/internal-pressure-awareness-reflection-and-personal-mastery" },
      { slug: "pressure-isnt-supposed-to-break-us-its-designed-to-make-us", label: "Pressure Isn't Supposed to Break Us, It's Designed to Make Us", url: "/blogs/pressure-isnt-supposed-to-break-us-its-designed-to-make-us" },
      { slug: "understanding-the-model-of-the-world-beliefs-and-key-decisions", label: "Understanding the Model of the World: Beliefs and Key Decisions", url: "/blogs/understanding-the-model-of-the-world-beliefs-and-key-decisions" },
      { slug: "the-moment-you-accept-your-struggles-the-door-to-growth-opens", label: "The Moment You Accept Your Struggles, the Door to Growth Opens", url: "/blogs/the-moment-you-accept-your-struggles-the-door-to-growth-opens" },
      { slug: "vision-depends-on-perspective-not-just-knowledge", label: "Vision Depends on Perspective, Not Just Knowledge", url: "/blogs/vision-depends-on-perspective-not-just-knowledge" },
      { slug: "push-through-tough-times-and-inspire-others", label: "Push Through Tough Times and Inspire Others", url: "/blogs/push-through-tough-times-and-inspire-others" },
      { slug: "the-science-behind-a-positive-state-of-mind", label: "The Science Behind a Positive State of Mind", url: "/blogs/the-science-behind-a-positive-state-of-mind" },
      { slug: "the-weight-of-thoughts", label: "The Weight of Thoughts", url: "/blogs/the-weight-of-thoughts" },
      { slug: "everything-is-hard-choose-your-hard", label: "Everything Is Hard, Choose Your Hard", url: "/blogs/everything-is-hard-choose-your-hard" },
      { slug: "the-power-of-language-transform-your-mindset-with-words", label: "The Power of Language: Transform Your Mindset with Words", url: "/blogs/the-power-of-language-transform-your-mindset-with-words" },
      { slug: "the-internal-representational-system-designing-your-reality", label: "The Internal Representational System: Designing Your Reality", url: "/blogs/the-internal-representational-system-designing-your-reality" },
      { slug: "the-power-of-reframing-transforming-setbacks-into-opportunities", label: "The Power of Reframing: Transforming Setbacks into Opportunities", url: "/blogs/the-power-of-reframing-transforming-setbacks-into-opportunities" },
    ],
  },
  {
    group: "Programs",
    icon: "🎓",
    pages: [
      { slug: "nlp-practitioner", label: "NLP Practitioner", url: "/program/nlp-practitioner" },
      { slug: "nlp-master-practitioner", label: "NLP Master Practitioner", url: "/program/nlp-master-practitioner" },
      { slug: "advanced-hypnotherapy-interventionist", label: "Advanced Hypnotherapy Interventionist", url: "/program/advanced-hypnotherapy-interventionist" },
      { slug: "nlp-trainers-training-program", label: "NLP Trainer's Training Program", url: "/program/nlp-trainers-training-program" },
      { slug: "hypnosis-trainers-training-program", label: "Hypnosis Trainer's Training Program", url: "/program/hypnosis-trainers-training-program" },
      { slug: "nlp-master-trainer-program", label: "NLP Master Trainer Program", url: "/program/nlp-master-trainer-program" },
    ],
  },
  {
    group: "About Us",
    icon: "👥",
    pages: [
      { slug: "who-is-arslan-larik", label: "Arslan Larik", url: "/about-us/who-is-arslan-larik" },
      { slug: "who-is-bismillah-pervez", label: "Bismillah Pervez", url: "/about-us/who-is-bismillah-pervez" },
      { slug: "why-train-with-alco", label: "Why Train With AL&CO", url: "/about-us/why-train-with-alco" },
    ],
  },
  {
    group: "Services",
    icon: "⚙️",
    pages: [
      { slug: "four-clouds-model", label: "Four Clouds Model", url: "/services/four-clouds-model" },
      { slug: "resources", label: "Resources", url: "/services/resources" },
    ],
  },
  {
    group: "Course Outlines",
    icon: "📋",
    pages: [
      { slug: "course-outline-nlp-practitioner", label: "NLP Practitioner Outline", url: "/course-outline/nlp-practitioner" },
      { slug: "course-outline-nlp-master-practitioner", label: "NLP Master Practitioner Outline", url: "/course-outline/nlp-master-practitioner" },
      { slug: "course-outline-advanced-hypnotherapy-interventionist", label: "Advanced Hypnotherapy Outline", url: "/course-outline/advanced-hypnotherapy-interventionist" },
    ],
  },
  {
    group: "Program Details",
    icon: "📄",
    pages: [
      { slug: "benefits-of-choosing-nlp-training-course", label: "Benefits of NLP Training", url: "/program-detail/benefits-of-choosing-nlp-training-course" },
      { slug: "how-nlp-master-practitioner-training-helps-you-in-your-life", label: "How NLP Master Practitioner Helps", url: "/program-detail/how-nlp-master-practitioner-training-helps-you-in-your-life" },
      { slug: "benefits-of-advanced-hypnotherapy-interventionist-training", label: "Benefits of Advanced Hypnotherapy", url: "/program-detail/benefits-of-advanced-hypnotherapy-interventionist-training" },
    ],
  },
  {
    group: "Legal Pages",
    icon: "⚖️",
    pages: [
      { slug: "refund-policy", label: "Refund Policy", url: "/refund-policy" },
      { slug: "service-policy", label: "Service Policy", url: "/service-policy" },
      { slug: "privacy-policy", label: "Privacy Policy", url: "/privacy-policy" },
      { slug: "terms", label: "Terms & Conditions", url: "/terms" },
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