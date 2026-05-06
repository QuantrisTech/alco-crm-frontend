"use client";
import { useRef, useState } from "react";
import { PIPELINE_STAGES, toStageKey } from '../shared/constants';
import KanbanCard from './kanban-card';

export default function KanbanBoard({ leads, programMap, actions }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // ── Grouping ──
  const grouped: Record<string, any[]> = {};
  PIPELINE_STAGES.forEach((s) => { grouped[s.key] = []; });

  // (leads || []).forEach((lead: any) => {
  //   const key = toStageKey(lead.status);
  //   if (grouped[key]) grouped[key].push(lead);
  // });

  (leads || []).forEach((lead: any) => {
  if (lead.status === "lost") {
    // lost lead ko uske PREVIOUS stage column mein daalo
    const prevStage = lead.previous_status || "new";
    if (grouped[prevStage]) grouped[prevStage].push(lead);
    return;
  }
  const key = toStageKey(lead);
  if (grouped[key]) grouped[key].push(lead);
});

  const colValue = (key: string) =>
    grouped[key].reduce((sum: number, l: any) => sum + (Number(l.opportunity_value) || 0), 0);

  // ── Drag Scroll Logic ──
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDown(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDown(false);
  const handleMouseUp = () => setIsDown(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
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
      <div className="flex gap-3 w-max ">
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage.key} className="w-64 shrink-0 flex flex-col">

            {/* ── Column Header ── */}
            <div className={`rounded-xl border-t-4 ${stage.color} ${stage.bg} px-3 py-2.5 mb-2`}>
              <div className="flex items-center justify-between">

                {/* Icon + Label */}
                <div className="flex items-center gap-1">
                  <stage.icon size={13} className="text-gray-500 shrink-0" />
                  <p className="text-xs font-semibold text-gray-700">{stage.label}</p>
                </div>

                <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full">
                  {grouped[stage.key].length}
                </span>
              </div>
              {colValue(stage.key) > 0 && (
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Rs {colValue(stage.key).toLocaleString()}
                </p>
              )}
            </div>


            {/* ── Cards (Vertical Scroll) ── */}
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto h-full pr-1 kanban-mini-scroll">
              {grouped[stage.key].length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500 border-2 border-dashed border-gray-100 rounded-xl">
                  No leads
                </div>
              ) : (
                grouped[stage.key].map((lead: any) => (
                  <KanbanCard
                    key={lead._id}
                    lead={lead}
                    programMap={programMap}
                    isLost={lead.status === "lost"}
                    {...actions}
                  />
                ))
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}