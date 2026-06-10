"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft, BookOpen, CheckCircle, Lock,
  ChevronRight, Play, Layers, Clock,
} from "lucide-react";
import API from "@/utils/api";
import { useQueryClient } from "@tanstack/react-query";
import LessonModal from "../components/lesson-modal";
import formatDuration from "@/utils/func";
import { useAppSelector } from "@/store/hooks";

const getLearningDashboard = (enrollmentId: string) =>
  API.get(`/api/v1/learn/${enrollmentId}`).then((r) => r.data.data);

// ── Progress Bar ──────────────────────────────────────────────
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

export default function CourseLearningPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const enrollmentId = params?.slug as string;
 const { user: authUser } = useAppSelector((state) => state.auth);
  const role = authUser?.role;
  const isUserForResponsive = role === "user";

  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["learn-dashboard", enrollmentId],
    queryFn: () => getLearningDashboard(enrollmentId),
    enabled: !!enrollmentId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 text-rose-500">Failed to load course</div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border hover:bg-gray-700 bg-gray-900 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            {data?.enrollment?.program?.name || "My Courses"}
          </h1>
          <p className="text-sm text-gray-400">
            {data?.completed_lessons || 0} / {data?.total_lessons || 0} lessons completed
            {data?.overall_progress > 0 && (
              <span className="ml-2 text-yellow-600 font-medium">
                · {data.overall_progress}%
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Overall Progress ── */}
      {data?.overall_progress > 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
          <div className="flex justify-between text-xs font-medium text-yellow-700 mb-1.5">
            <span>Overall Progress</span>
            <span>{data.overall_progress}%</span>
          </div>
          <ProgressBar pct={data.overall_progress} />
        </div>
      )}

      {/* ── Courses ── */}
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
              {/* ── Course Header ── */}
              <div
                onClick={() =>
                  setExpandedCourse(expandedCourse === course._id ? null : course._id)
                }
                className={ isUserForResponsive ? "flex flex-col md:flex-row md:items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition group" : "flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition group"}
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-sm font-bold text-gray-500 group-hover:bg-yellow-100 group-hover:text-yellow-700 transition-colors">
                  {idx + 1}
                </div>
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
                <div className="flex items-center gap-2 shrink-0">
                  {course.progress_percentage >= 100 ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : null}
                  {/* <ChevronRight
                    size={15}
                    className={`text-gray-400 transition-transform duration-200 ${
                      expandedCourse === course._id ? "rotate-90 text-yellow-500" : ""
                    }`}
                  /> */}
                  <div className={isUserForResponsive ? "flex flex-col sm:flex-row gap-2 w-full sm:w-auto" : "flex gap-2 "}>
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/courses/${enrollmentId}/learn/${course._id}`
                        )
                      }
                      className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 font-semibold text-sm py-2.5 px-4 rounded-xl hover:bg-yellow-500 transition-colors"
                    >
                      <Play size={14} className="fill-gray-900" />
                      {/* {pct === 0 ? "Start Learning Course" : "Continue Learning Course"} */}
                      Start Learning Course
                    </button>
                    <button
                      className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${expandedCourse === course._id
                        ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {expandedCourse === course._id ? "Hide Course" : "Quick View"}
                    </button>
                  </div>

                </div>
              </div>

              {/* ── Modules + Lessons ── */}
              {expandedCourse === course._id && (
                <div className="border-t border-gray-100">
                  {!course.modules?.length ? (
                    <div className="px-5 py-4 text-xs text-gray-400">No modules found</div>
                  ) : (
                    course.modules.map((mod: any) => (
                      <div key={mod._id} className="border-b border-gray-50 last:border-0">
                        {/* Module Header */}
                        <div
                          onClick={() =>
                            setExpandedModule(expandedModule === mod._id ? null : mod._id)
                          }
                          className="flex items-center gap-3 px-5 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition group/mod"
                        >
                          <Layers size={13} className="text-gray-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider truncate">
                              {mod.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {mod.lessons?.length || 0} lessons
                              {mod.progress_percentage > 0 && (
                                <span className="ml-2 text-yellow-600">
                                  · {mod.progress_percentage}%
                                </span>
                              )}
                            </p>
                          </div>
                          {/* <ChevronRight
                            size={13}
                            className={`text-gray-400 transition-transform duration-200 shrink-0 ${expandedModule === mod._id ? "rotate-90 text-yellow-500" : ""
                              }`}
                          /> */}
                          <div className="flex gap-2 ">
                            <button
                              className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${expandedModule === mod._id
                                ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                                : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                              {expandedModule === mod._id ? "Hide Module" : "View Module"}
                            </button>
                          </div>
                        </div>

                        {/* Lessons */}
                        {expandedModule === mod._id && (
                          <div className="bg-white">
                            {!mod.lessons?.length ? (
                              <div className="px-8 py-3 text-xs text-gray-400">No lessons</div>
                            ) : (
                              mod.lessons.map((lesson: any, lIdx: number) => (
                                <div
                                  key={lesson._id}
                                  onClick={() => setActiveLessonId(lesson._id)}
                                  className="flex items-center gap-3 px-5 py-3.5 border-t border-gray-50 hover:bg-yellow-50 cursor-pointer transition group/lesson"
                                >
                                  {/* Status icon */}
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${lesson.is_completed
                                      ? "bg-green-100"
                                      : "bg-gray-100 group-hover/lesson:bg-yellow-100"
                                      }`}
                                  >
                                    {lesson.is_completed ? (
                                      <CheckCircle size={13} className="text-green-500" />
                                    ) : (
                                      <Play size={9} className="text-gray-400 group-hover/lesson:text-yellow-600 ml-0.5" />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-700 truncate font-medium">
                                      {lesson.title}
                                    </p>
                                    <p className="text-xs text-gray-400 capitalize mt-0.5">
                                      {lesson.content_type?.replace("_", " ")}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {lesson.duration_minutes > 0 && (
                                      <span className="flex items-center gap-1 text-xs text-gray-400">
                                        <Clock size={10} />
                                        {formatDuration(lesson.duration_minutes)}m
                                      </span>
                                    )}
                                    {lesson.progress_percentage > 0 && !lesson.is_completed && (
                                      <span className="text-xs text-yellow-600 font-medium">
                                        {lesson.progress_percentage}%
                                      </span>
                                    )}
                                    {/* <ChevronRight
                                      size={13}
                                      className="text-gray-300 group-hover/lesson:text-gray-500 transition-colors"
                                    /> */}
                                    <div className="flex gap-2 ">
                                      {/* <button
                                        onClick={() =>
                                          router.push(
                                            `/dashboard/courses/${enrollmentId}/learn/${course._id}`
                                          )
                                        }
                                        className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 font-semibold text-sm py-2.5 px-4 rounded-xl hover:bg-yellow-500 transition-colors"
                                      >
                                        <Play size={14} className="fill-gray-900" />
                                         {pct === 0 ? "Start Learning Course" : "Continue Learning Course"} 
                                        Start Learning Course
                                      </button> */}
                                      <button
                                        className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors border-gray-200 text-gray-600 hover:bg-gray-50
                                          }`}
                                      >
                                        View
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Lesson Modal ── */}
      {activeLessonId && (
        <LessonModal
          enrollmentId={enrollmentId}
          lessonId={activeLessonId}
          onClose={() => setActiveLessonId(null)}
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["learn-dashboard", enrollmentId] });
          }}
        />
      )}
    </div>
  );
}

// "use client";

// import { useParams, useRouter } from "next/navigation";
// import { useQuery } from "@tanstack/react-query";
// import { ArrowLeft, BookOpen, CheckCircle, Lock, ChevronRight } from "lucide-react";
// import API from "@/utils/api";

// const getLearningDashboard = (enrollmentId: string) =>
//   API.get(`/api/v1/learn/${enrollmentId}`).then((r) => r.data.data);

// export default function CourseLearningPage() {
//   const params = useParams();
//   const router = useRouter();

//   const enrollmentId = params?.slug as string;

//   const { data, isLoading, isError } = useQuery({
//     queryKey: ["learn-dashboard", enrollmentId],
//     queryFn: () => getLearningDashboard(enrollmentId),
//     enabled: !!enrollmentId,
//   });

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center py-20">
//         <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className="text-center py-20 text-rose-500">
//         Failed to load course
//       </div>
//     );
//   }

//   return (
//     <div className="p-2 space-y-6 ">
//       {/* Header */}
//       <div className="flex items-center gap-3">
//         <button
//           onClick={() => router.back()}
//           className="p-2 rounded-lg border hover:bg-gray-700 bg-gray-900 text-gray-400 hover:text-white transition"
//         >
//           <ArrowLeft size={16} />
//         </button>

//         <div>
//           <h1 className="text-lg font-semibold text-gray-800">
//             {data?.program?.name || "Course"}
//           </h1>
//           <p className="text-sm text-gray-400">
//             {data?.completed_lessons || 0} / {data?.total_lessons || 0} lessons completed
//           </p>
//         </div>
//       </div>

//       {/* Courses List */}
//       <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
//         {data?.courses?.length === 0 ? (
//           <div className="p-6 text-center text-gray-400">
//             No courses available
//           </div>
//         ) : (
//           <div className="divide-y">
//             {data?.courses?.map((course: any, idx: number) => (
//               <div
//                 key={course._id}
//                 onClick={() =>
//                   router.push(
//                     `/dashboard/courses/${enrollmentId}/learn/${course._id}`
//                   )
//                 }
//                 className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition"
//               >
//                 <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-200 text-xs font-bold">
//                   {idx + 1}
//                 </div>

//                 <div className="flex-1">
//                   <p className="text-sm font-medium text-gray-800">
//                     {course.title}
//                   </p>
//                   <p className="text-xs text-gray-400">
//                     {course.total_lessons || 0} lessons
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   {course.progress_percentage >= 100 ? (
//                     <CheckCircle size={16} className="text-green-500" />
//                   ) : course.progress_percentage > 0 ? (
//                     <span className="text-xs text-yellow-600 font-medium">
//                       {course.progress_percentage}%
//                     </span>
//                   ) : (
//                     <Lock size={14} className="text-gray-300" />
//                   )}
//                   <ChevronRight size={16} className="text-gray-300" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }