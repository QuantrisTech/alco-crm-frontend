"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getActiveGuides, getGuideByPageKey } from "@/utils/api";
import ProtectedRoute from "@/app/component/protected-route";
import GuideContentRenderer from "../component/guide-content-renderer";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";

export default function GuideViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPageKey = searchParams.get("pageKey") || "";

  const [activeKey, setActiveKey] = useState(initialPageKey);

  const { data: guidesList, isLoading: loadingList } = useQuery({
    queryKey: ["guides-active"],
    queryFn: async () => (await getActiveGuides()).data.data,
  });

  useEffect(() => {
    if (!activeKey && guidesList?.length) setActiveKey(guidesList[0].pageKey);
  }, [guidesList, activeKey]);

  const { data: activeGuide, isLoading: loadingGuide } = useQuery({
    queryKey: ["guide", activeKey],
    queryFn: async () => (await getGuideByPageKey(activeKey)).data.data,
    enabled: !!activeKey,
  });

  return (
    <ProtectedRoute>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <BookOpen size={24} />
          Help & Guides
        </h1>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
        >
          <ArrowLeft size={15} />
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left — Titles list */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden h-fit">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              All Guides
            </h3>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loadingList && <div className="p-4 text-sm text-gray-400">Loading...</div>}

            {!loadingList && guidesList?.length === 0 && (
              <div className="p-4 text-sm text-gray-400">No guides available.</div>
            )}

            {guidesList?.map((g: any) => {
              const isActive = g.pageKey === activeKey;
              return (
                <button
                  key={g.pageKey}
                  onClick={() => setActiveKey(g.pageKey)}
                  className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between gap-2 border-b border-gray-50 transition ${
                    isActive
                      ? "bg-yellow-50 text-gray-900 font-semibold border-l-4 border-l-yellow-400"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="truncate">{g.heading}</span>
                  {isActive && <ChevronRight size={14} className="text-yellow-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right — Content */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
          {loadingGuide && (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Loading guide...
            </div>
          )}

          {!loadingGuide && !activeGuide && (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Select a guide from the left to view.
            </div>
          )}

          {activeGuide && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-4">{activeGuide.heading}</h2>

              <div className="rounded-xl overflow-hidden mb-5 bg-black">
                <video
                  key={activeGuide.videoUrl}
                  src={activeGuide.videoUrl}
                  controls
                  controlsList="nodownload"
                  className="w-full max-h-[480px]"
                />
              </div>

              {activeGuide.description?.length > 0 && (
                <div className="border-t border-gray-100 pt-5">
                  <GuideContentRenderer blocks={activeGuide.description} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}