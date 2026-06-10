"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CheckCircle, Play } from "lucide-react";
import API from "@/utils/api";
import { useQueryClient } from "@tanstack/react-query";
import LessonModal from "../../../components/lesson-modal";
import { useAppSelector } from "@/store/hooks";

const getLearningDashboard = (enrollmentId: string) =>
  API.get(`/api/v1/learn/${enrollmentId}`).then((r) => r.data.data);

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full bg-yellow-400 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// Flatten all lessons from modules into one array with _moduleName
function flattenLessons(course: any): any[] {
  if (course?.modules?.length) {
    return course.modules.flatMap((mod: any) =>
      (mod.lessons || []).map((l: any) => ({ ...l, _moduleName: mod.title }))
    );
  }
  return course?.lessons || [];
}

export default function CourseLearningPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const enrollmentId = params?.slug as string;
  const { user: authUser } = useAppSelector((state) => state.auth);
  const role = authUser?.role;
  const isUserForResponsive = role === "user";

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["learn-dashboard", enrollmentId],
    queryFn: () => getLearningDashboard(enrollmentId),
    enabled: !!enrollmentId,
  });

  // Active course lessons for modal sidebar
  const activeCourse = data?.courses?.find((c: any) => c._id === activeCourseId) ?? null;
  const allLessons = flattenLessons(activeCourse);

  // Open modal at first incomplete lesson of a course
  const openCourse = (course: any) => {
    const lessons = flattenLessons(course);
    const first = lessons.find((l) => !l.is_completed) || lessons[0];
    if (!first) return;
    setActiveCourseId(course._id);
    setActiveLessonId(first._id);
    setShowModal(true);
  };

  const handleLessonComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["learn-dashboard", enrollmentId] });
    // Auto-advance
    const idx = allLessons.findIndex((l) => l._id === activeLessonId);
    const next = allLessons[idx + 1];
    if (next) setActiveLessonId(next._id);
    else setShowModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <div className="text-center py-20 text-rose-500">Failed to load course</div>;
  }

  const overallPct = data?.overall_progress || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            {data?.enrollment?.program?.name || "My Courses"}
          </h1>
          <p className="text-sm text-gray-400">
            {data?.completed_lessons || 0} / {data?.total_lessons || 0} lessons completed
            {overallPct > 0 && (
              <span className="ml-2 text-yellow-600 font-medium">· {overallPct}%</span>
            )}
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      {overallPct > 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
          <div className="flex justify-between text-xs font-medium text-yellow-700 mb-1.5">
            <span>Overall Progress</span>
            <span>{overallPct}%</span>
          </div>
          <ProgressBar pct={overallPct} />
        </div>
      )}

      {/* Courses */}
      <div className="space-y-3">
        {!data?.courses?.length ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            No courses available
          </div>
        ) : (
          data.courses.map((course: any, idx: number) => (
            <div
              key={course._id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
            >
              <div className={isUserForResponsive ? "flex flex-col sm:flex-row sm:items-center gap-3 p-4" : "flex items-center gap-3 p-4"}>
                {/* Number */}
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-sm font-bold text-gray-500">
                  {idx + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{course.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">
                      {course.total_lessons || 0} lessons
                    </span>
                    {course.progress_percentage > 0 && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-yellow-600 font-medium">
                          {course.progress_percentage}% done
                        </span>
                      </>
                    )}
                  </div>
                  {course.progress_percentage > 0 && (
                    <div className="mt-2">
                      <ProgressBar pct={course.progress_percentage} />
                    </div>
                  )}
                </div>

                {/* Done badge */}
                {course.progress_percentage >= 100 && (
                  <CheckCircle size={16} className="text-green-500 shrink-0" />
                )}

                {/* Start / Continue button */}
                <button
                  onClick={() => openCourse(course)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-xs transition-colors shrink-0"
                >
                  <Play size={11} className="fill-gray-900" />
                  {course.progress_percentage > 0 ? "Continue" : "Start"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lesson Modal — with sidebar playlist + prev/next */}
      {showModal && activeLessonId && (
        <LessonModal
          enrollmentId={enrollmentId}
          lessonId={activeLessonId}
          onClose={() => setShowModal(false)}
          onComplete={handleLessonComplete}
          allLessons={allLessons}
          onLessonChange={(id) => setActiveLessonId(id)}
        />
      )}
    </div>
  );
}