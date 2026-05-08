"use client";
import { useRef, useState } from "react";
import { PIPELINE_STAGES, toStageKey } from "../shared/constants";
import KanbanCard from "./kanban-card";
import EnrollmentCard from "./kanban-enrollment-card";

export default function KanbanBoard({
  leads,
  enrollments,        // <-- alag prop, enrollments API se
  programMap,
  actions,
  onViewEnrollment,   // optional: parent apna custom modal open kar sakta hai
}: any) {
  const scrollRef               = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown]     = useState(false);
  const [startX, setStartX]     = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // ── Leads ko pipeline stages mein group karo ──
  const grouped: Record<string, any[]> = {};
  PIPELINE_STAGES.forEach((s) => {
    grouped[s.key] = [];
  });

  (leads || []).forEach((lead: any) => {
    if (lead.status === "lost") {
      const prevStage = lead.previous_status || "new";
      if (grouped[prevStage]) grouped[prevStage].push(lead);
      return;
    }
    const key = toStageKey(lead);
    if (grouped[key]) grouped[key].push(lead);
  });

  // ── Enrollments alag array hai — leads se independent ──
  const enrollmentList: any[] = enrollments || [];

  // ── Column value & count ──
  const colValue = (key: string) => {
    if (key === "enrolled") {
      return enrollmentList.reduce(
        (sum: number, e: any) =>
          sum + (Number(e.leadSnapshot?.opportunity_value) || 0),
        0
      );
    }
    return grouped[key]?.reduce(
      (sum: number, l: any) => sum + (Number(l.opportunity_value) || 0),
      0
    ) ?? 0;
  };

  const colCount = (key: string) => {
    if (key === "enrolled") return enrollmentList.length;
    return grouped[key]?.length ?? 0;
  };

  // ── Drag Scroll ──
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDown(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDown(false);
  const handleMouseUp    = () => setIsDown(false);
  const handleMouseMove  = (e: React.MouseEvent) => {
    if (!isDown || !scrollRef.current) return;
    e.preventDefault();
    const x    = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      className="w-full overflow-x-auto pb-3 kanban-scroll cursor-grab active:cursor-grabbing"
    >
      <div className="flex gap-3 w-max">
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage.key} className="w-64 shrink-0 flex flex-col">

            {/* ── Column Header ── */}
            <div
              className={`rounded-xl border-t-4 ${stage.color} ${stage.bg} px-3 py-2.5 mb-2`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <stage.icon size={13} className="text-gray-500 shrink-0" />
                  <p className="text-xs font-semibold text-gray-700">
                    {stage.label}
                  </p>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full">
                  {colCount(stage.key)}
                </span>
              </div>
              {colValue(stage.key) > 0 && (
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Rs {colValue(stage.key).toLocaleString()}
                </p>
              )}
            </div>

            {/* ── Cards ── */}
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto h-full pr-1 kanban-mini-scroll">

              {stage.key === "enrolled" ? (
                // ── Enrolled column: EnrollmentCards render karo ──
                enrollmentList.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                    No enrollments yet
                  </div>
                ) : (
                  enrollmentList.map((enrollment: any) => (
                    <EnrollmentCard
                      key={enrollment._id}
                      enrollment={enrollment}
                      onViewEnrollment={onViewEnrollment}
                    />
                  ))
                )
              ) : (
                // ── Baaki sab columns: KanbanCards (leads) ──
                grouped[stage.key]?.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                    No leads
                  </div>
                ) : (
                  grouped[stage.key]?.map((lead: any) => (
                    <KanbanCard
                      key={lead._id}
                      lead={lead}
                      programMap={programMap}
                      isLost={lead.status === "lost"}
                      {...actions}
                    />
                  ))
                )
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
