"use client";

import { BookOpen, SearchCheck, UserCog } from "lucide-react";
import { StatCard } from "../component/dashboard/stat-card";
import PageHeader from "../component/dashboard/page-header";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
    adminGetResources,
    adminGetSeoPages,
    getBlogsPublic,
} from "@/utils/api";


export default function SeoDashboard() {
    const router = useRouter();

    // ── Queries ──
    const { data: getSeo, isLoading } = useQuery({
        queryKey: ["dashboard-seo"],
        queryFn: () =>
          adminGetSeoPages().then((res) => res.data?.data || res.data || []),
      });
      
    const { data: getBlogs } = useQuery({
        queryKey: ["dashboard-blogs"],
        queryFn: () => getBlogsPublic().then(r => r.data),
    });

    const { data: getResources } = useQuery({
        queryKey: ["dashboard-resources"],
        queryFn: () => adminGetResources().then((r) => r.data),
    });

    const fmt = (n: number) => `Rs ${(n || 0).toLocaleString()}`;

    // ── Stats cards ──
    const stats = [
        {
            title: "Total SEO Pages",
            value: getSeo?.length?.toString() || "0",
            change: "Active SEO pages",
            icon: SearchCheck,
            bg: "bg-blue-950",
            text: "text-white",
            onClick: () => router.push("/dashboard/seo"),
        },
        {
            title: "Total Blogs",
            value: getBlogs?.meta?.total?.toString() || "0",
            change: "Active blogs",
            icon: BookOpen,
            bg: "bg-sky-950",
            text: "text-white",
            onClick: () => router.push("/dashboard/blogs"),
        },
        {
            title: "Total Resources",
            value: getResources?.data?.length?.toString() || "0",
            change: "Active resources",
            icon: BookOpen,
            bg: "bg-mauve-900",
            text: "text-white",
            onClick: () => router.push("/dashboard/resources"),
        }

    ];



    return (
        <div className="space-y-6">

            {/* Header */}
            <PageHeader
                title="SEO Dashboard"
                subtitle="Monitor and optimize your website's SEO performance with key metrics and insights."
                titleIcon={<UserCog size={24} />}
            />

            {/* Stats — 6 cards, 3 per row */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <StatCard key={stat.title} {...stat} />
                ))}
            </div>

        </div>
    );
}