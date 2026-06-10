"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getLessonContent, updateLessonProgress,
    completeLesson, getLessonComments, addLessonComment
} from "@/utils/api";
import {
    X, CheckCircle, Send, Mic, Clock,
    ChevronLeft, ChevronRight, Play, List, Layers, Lock
} from "lucide-react";
import toast from "react-hot-toast";
import formatDuration from "@/utils/func";
import { useAppSelector } from "@/store/hooks";

type Props = {
    enrollmentId: any;
    lessonId: string;
    onClose: () => void;
    onComplete?: () => void;
    allLessons?: any[];
    onLessonChange?: (lessonId: string) => void;
};

// ── Custom Audio Player ───────────────────────────────────────
function SecureAudioPlayer({
    src,
    onProgress,
    onEnded,
    savedSeconds = 0,
}: {
    src: string;
    onProgress: (pct: number, currentSeconds: number) => void;
    onEnded: () => void;
    savedSeconds?: number;
}) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onMeta = () => {
            setDuration(audio.duration);
            setLoaded(true);
            if (savedSeconds && savedSeconds > 0) audio.currentTime = savedSeconds;
        };
        audio.addEventListener("loadedmetadata", onMeta);
        return () => audio.removeEventListener("loadedmetadata", onMeta);
    }, [src]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onTime = () => {
            const ct = audio.currentTime;
            const dur = audio.duration;
            setCurrentTime(ct);
            if (dur > 0) onProgress(Math.round((ct / dur) * 100), Math.floor(ct));
        };
        const onEnd = () => { setIsPlaying(false); onEnded(); };
        audio.addEventListener("timeupdate", onTime);
        audio.addEventListener("ended", onEnd);
        return () => {
            audio.removeEventListener("timeupdate", onTime);
            audio.removeEventListener("ended", onEnd);
        };
    }, [onProgress, onEnded]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) { audio.pause(); setIsPlaying(false); }
        else { audio.play(); setIsPlaying(true); }
    };

    const fmt = (s: number) =>
        `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

    const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4">
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                controlsList="nodownload noremoteplayback"
                onContextMenu={(e) => e.preventDefault()}
                style={{ display: "none" }}
            />
            <div className="flex items-center gap-3 sm:gap-4">
                <button
                    onClick={togglePlay}
                    disabled={!loaded}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-yellow-400 hover:bg-yellow-300 flex items-center justify-center shrink-0 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-yellow-200"
                >
                    {isPlaying ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="3" y="2" width="4" height="12" rx="1" fill="#111827" />
                            <rect x="9" y="2" width="4" height="12" rx="1" fill="#111827" />
                        </svg>
                    ) : (
                        <Play size={16} className="fill-gray-900 ml-0.5" />
                    )}
                </button>
                <div className="flex-1">
                    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                        />
                        <div className="absolute inset-0 cursor-not-allowed" />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{fmt(currentTime)}</span>
                        <span>{loaded ? fmt(duration) : "--:--"}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Lock size={10} />
                <span>Seeking and downloading are disabled for this lesson</span>
            </div>
        </div>
    );
}

// ── Main Modal ────────────────────────────────────────────────
export default function LessonModal({
    enrollmentId, lessonId, onClose, onComplete,
    allLessons = [], onLessonChange,
}: Props) {
    const queryClient = useQueryClient();
    const [progress, setProgress] = useState(0);
    const [comment, setComment] = useState("");
    const [isCompleted, setIsCompleted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false); // default closed on mobile
    const [currentSeconds, setCurrentSeconds] = useState(0);
    const progressSaveTimer = useRef<NodeJS.Timeout | null>(null);
    const activeRef = useRef<HTMLDivElement>(null);
    const { user: authUser } = useAppSelector((state) => state.auth);

    const COMPLETE_THRESHOLD = 75;

    // ── Fetch lesson ──
    const { data: lessonData, isLoading } = useQuery({
        queryKey: ["lesson", enrollmentId, lessonId],
        queryFn: () => getLessonContent(enrollmentId, lessonId).then(r => r.data.data),
    });

    const lesson = lessonData?.lesson;
    const savedProgress = lessonData?.progress;
    const apiPrev = lessonData?.prev_lesson;
    const apiNext = lessonData?.next_lesson;

    const activeIndex = allLessons.findIndex(l => l._id === lessonId);
    const prevLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
    const nextLesson = activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;
    const hasSidebar = allLessons.length > 0;

    // ── Fetch comments ──
    const { data: commentsData, isLoading: isLoadingComments } = useQuery({
        queryKey: ["lesson-comments", lessonId],
        queryFn: () => getLessonComments(enrollmentId, lessonId).then(r => r.data.data),
    });

    useEffect(() => {
        if (savedProgress) {
            setProgress(savedProgress.progress_percentage || 0);
            setIsCompleted(savedProgress.is_completed || false);
        }
    }, [savedProgress]);

    useEffect(() => {
        setProgress(0);
        setIsCompleted(false);
        setCurrentSeconds(0);
    }, [lessonId]);

    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [lessonId]);

    const { mutate: saveProgress } = useMutation({
        mutationFn: (data: any) => updateLessonProgress(enrollmentId, lessonId, data),
    });

    const { mutate: markComplete, isPending: isCompleting } = useMutation({
        mutationFn: () => completeLesson(enrollmentId, lessonId),
        onSuccess: () => {
            setIsCompleted(true);
            setProgress(100);
            toast.success("Lesson completed! 🎉");
            queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
            queryClient.invalidateQueries({ queryKey: ["learn-dashboard", enrollmentId] });
            onComplete?.();
        },
        onError: () => toast.error("Failed to mark complete"),
    });

    const { mutate: postComment, isPending: isPosting } = useMutation({
        mutationFn: (text: string) => addLessonComment(enrollmentId, lessonId, {
            comment: text,
            timestamp_seconds: currentSeconds,
        }),
        onSuccess: () => {
            setComment("");
            queryClient.invalidateQueries({ queryKey: ["lesson-comments", lessonId] });
        },
        onError: () => toast.error("Failed to post comment"),
    });

    const handleProgress = (pct: number, seconds: number) => {
        setProgress(pct);
        setCurrentSeconds(seconds);
        if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current);
        progressSaveTimer.current = setTimeout(() => {
            saveProgress({ progress_percentage: pct, last_position_seconds: seconds });
        }, 10000);
    };

    const handleAudioEnded = () => {
        saveProgress({ progress_percentage: 100, last_position_seconds: 0 });
        if (!isCompleted) markComplete();
    };

    useEffect(() => {
        return () => { if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current); };
    }, []);

    const formatTime = (s: number) =>
        `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

    const goToLesson = (id: string) => {
        onLessonChange?.(id);
        setSidebarOpen(false); // close sidebar on mobile after selection
    };

    const groupedModules: { title: string; lessons: any[] }[] = [];
    if (hasSidebar) {
        allLessons.forEach(l => {
            const modName = l._moduleName || "Lessons";
            const existing = groupedModules.find(g => g.title === modName);
            if (existing) existing.lessons.push(l);
            else groupedModules.push({ title: modName, lessons: [l] });
        });
    }

    const canComplete = progress >= COMPLETE_THRESHOLD && !isCompleted;

    return (
        // Full screen on mobile, centered modal on desktop
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 sm:p-4">
            <div className="bg-white w-full sm:rounded-2xl shadow-2xl sm:max-w-4xl h-[95dvh] sm:max-h-[92vh] flex flex-col overflow-hidden rounded-t-2xl">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 shrink-0">
                    <div className="flex-1 min-w-0 mr-3">
                        {isLoading ? (
                            <div className="h-5 bg-gray-100 rounded animate-pulse w-48" />
                        ) : (
                            <>
                                <h2 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                    {lesson?.title}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5 capitalize flex items-center gap-1">
                                    <Mic size={11} />
                                    {lesson?.content_type?.replace("_", " ")}
                                    {lesson?.duration_minutes && (
                                        <span className="ml-2 flex items-center gap-1">
                                            <Clock size={11} /> {formatDuration(lesson.duration_minutes)}m
                                        </span>
                                    )}
                                </p>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {hasSidebar && (
                            <button
                                onClick={() => setSidebarOpen(s => !s)}
                                className={`p-2 rounded-lg border text-sm transition ${
                                    sidebarOpen
                                        ? "border-yellow-300 bg-yellow-50 text-yellow-600"
                                        : "border-gray-200 text-gray-400 hover:text-gray-600"
                                }`}
                            >
                                <List size={15} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex flex-1 overflow-hidden relative">

                    {/* ── Main Content ── */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Audio Player */}
                                {lesson?.content_url && (
                                    <div className="p-4 sm:p-5 border-b border-gray-100">
                                        <SecureAudioPlayer
                                            src={lesson.content_url}
                                            onProgress={handleProgress}
                                            onEnded={handleAudioEnded}
                                            savedSeconds={savedProgress?.last_position_seconds || 0}
                                        />

                                        {/* Progress bar */}
                                        <div className="mt-4">
                                            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                                                <span>Lesson Progress</span>
                                                <span className="font-medium text-gray-700">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="h-1.5 rounded-full bg-yellow-400 transition-all duration-300"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="relative mt-1">
                                                <div
                                                    className="absolute bottom-2 flex flex-col items-center"
                                                    style={{ left: `${COMPLETE_THRESHOLD}%`, transform: "translateX(-50%)" }}
                                                >
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">{COMPLETE_THRESHOLD}%</span>
                                                    <div className="w-px h-2 bg-gray-300" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mark Complete */}
                                        <div className="mt-4 flex items-center justify-between">
                                            {isCompleted ? (
                                                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                                                    <CheckCircle size={16} /> Completed
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end gap-1 w-full">
                                                    <button
                                                        onClick={() => markComplete()}
                                                        disabled={!canComplete || isCompleting}
                                                        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-xl text-sm font-medium hover:bg-yellow-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        <CheckCircle size={14} />
                                                        {isCompleting ? "Marking..." : "Mark Complete"}
                                                    </button>
                                                    {progress < COMPLETE_THRESHOLD && (
                                                        <p className="text-xs text-gray-400 mt-1 text-right">
                                                            Listen at least {COMPLETE_THRESHOLD}% to mark complete ({COMPLETE_THRESHOLD - progress}% remaining)
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {lesson?.description && (
                                    <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-2">About this lesson</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">{lesson.description}</p>
                                    </div>
                                )}

                                {/* Comments */}
                                <div className="p-4 sm:p-5">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                        Comments
                                        <span className="text-xs text-gray-400 font-normal">
                                            ({commentsData?.length || 0})
                                        </span>
                                    </h3>

                                    {/* Comment input */}
                                    <div className="flex gap-2 mb-5">
                                        <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 focus-within:ring-2 focus-within:ring-yellow-300 bg-gray-50">
                                            <input
                                                type="text"
                                                value={comment}
                                                onChange={e => setComment(e.target.value)}
                                                onKeyDown={e => e.key === "Enter" && comment.trim() && postComment(comment)}
                                                placeholder="Add a comment..."
                                                className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400 min-w-0"
                                            />
                                            {currentSeconds > 0 && (
                                                <span className="text-xs text-gray-300 shrink-0 hidden sm:inline">
                                                    @ {formatTime(currentSeconds)}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => comment.trim() && postComment(comment)}
                                            disabled={isPosting || !comment.trim()}
                                            className="p-2.5 bg-yellow-400 text-gray-900 rounded-xl hover:bg-yellow-500 transition disabled:opacity-40 shrink-0"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>

                                    {/* Comment list */}
                                    {isLoadingComments ? (
                                        <div className="text-center py-4 text-sm text-gray-400">Loading comments...</div>
                                    ) : !commentsData?.length ? (
                                        <div className="text-center py-6 text-sm text-gray-400">No comments yet — be the first!</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {commentsData.map((c: any) => (
                                                <div key={c._id} className="flex gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 shrink-0"
                                                        style={{ background: c.user_id?.avatarColor || "#FBBF24" }}
                                                    >
                                                        {c.user_id?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                                            <span className="text-xs font-semibold text-gray-800 truncate">
                                                                {c.user_id?.name}
                                                            </span>
                                                            {c.timestamp_seconds > 0 && (
                                                                <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded font-mono">
                                                                    {formatTime(c.timestamp_seconds)}
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-gray-300">
                                                                {new Date(c.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 leading-relaxed">{c.comment}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── Sidebar ──
                        Mobile: absolute overlay (slide in from right)
                        Desktop: fixed right panel
                    ── */}
                    {hasSidebar && sidebarOpen && (
                        <>
                            {/* Mobile backdrop */}
                            <div
                                className="absolute inset-0 bg-black/20 z-10 sm:hidden"
                                onClick={() => setSidebarOpen(false)}
                            />

                            <div className={`
                                absolute right-0 top-0 bottom-0 z-20
                                w-72 sm:w-64
                                sm:relative sm:z-auto
                                bg-white sm:bg-gray-50
                                border-l border-gray-100
                                flex flex-col overflow-hidden
                                shadow-xl sm:shadow-none
                            `}>
                                <div className="px-4 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <List size={12} /> Lessons · {activeIndex + 1}/{allLessons.length}
                                    </p>
                                    {/* Close on mobile */}
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="sm:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-400"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {groupedModules.map((group) => (
                                        <div key={group.title}>
                                            {groupedModules.length > 1 && (
                                                <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-100/80 sticky top-0 z-10">
                                                    <Layers size={10} className="text-gray-400 shrink-0" />
                                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
                                                        {group.title}
                                                    </p>
                                                </div>
                                            )}
                                            {group.lessons.map((l: any) => {
                                                const isActive = l._id === lessonId;
                                                return (
                                                    <div
                                                        key={l._id}
                                                        ref={isActive ? activeRef : null}
                                                        onClick={() => goToLesson(l._id)}
                                                        className={`flex items-center gap-2.5 px-4 py-3 cursor-pointer border-l-2 border-b border-gray-100 transition ${
                                                            isActive
                                                                ? "bg-yellow-50 border-l-yellow-400"
                                                                : "border-l-transparent hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        {isActive ? (
                                                            <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
                                                                <Play size={8} className="fill-gray-900 ml-0.5" />
                                                            </div>
                                                        ) : l.is_completed ? (
                                                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                                <CheckCircle size={11} className="text-green-500" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                                                <Play size={8} className="text-gray-400 ml-0.5" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-medium truncate leading-snug ${
                                                                isActive ? "text-yellow-600"
                                                                : l.is_completed ? "text-gray-400"
                                                                : "text-gray-700"
                                                            }`}>
                                                                {l.title}
                                                            </p>
                                                            {l.duration_minutes > 0 && (
                                                                <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5">
                                                                    <Clock size={9} /> {formatDuration(l.duration_minutes)}m
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Footer: Prev / Next ── */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-gray-100 bg-gray-50 shrink-0 rounded-b-2xl sm:rounded-b-2xl">
                    <button
                        onClick={() => { const t = hasSidebar ? prevLesson : apiPrev; if (t) goToLesson(t._id); }}
                        disabled={hasSidebar ? !prevLesson : !apiPrev}
                        className="flex items-center gap-1 sm:gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-30 disabled:cursor-not-allowed max-w-[38%] sm:max-w-none"
                    >
                        <ChevronLeft size={14} className="shrink-0" />
                        <span className="truncate">
                            {(hasSidebar ? prevLesson?.title : apiPrev?.title) || "Previous"}
                        </span>
                    </button>

                    <span className="text-xs text-gray-300 shrink-0">
                        {activeIndex >= 0 ? `${activeIndex + 1} / ${allLessons.length}` : ""}
                    </span>

                    <button
                        onClick={() => { const t = hasSidebar ? nextLesson : apiNext; if (t) goToLesson(t._id); }}
                        disabled={hasSidebar ? !nextLesson : !apiNext}
                        className="flex items-center gap-1 sm:gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-30 disabled:cursor-not-allowed max-w-[38%] sm:max-w-none"
                    >
                        <span className="truncate">
                            {(hasSidebar ? nextLesson?.title : apiNext?.title) || "Next"}
                        </span>
                        <ChevronRight size={14} className="shrink-0" />
                    </button>
                </div>
            </div>
        </div>
    );
}