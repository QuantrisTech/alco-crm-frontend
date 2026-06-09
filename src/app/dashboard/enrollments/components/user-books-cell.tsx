// app/dashboard/enrollments/components/user-books-cell.tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { getUserBooks } from "@/utils/api";
import { BookOpen } from "lucide-react";
import CollapsedCell from "./collapsed-cell";

export function UserBooksCell({ userId, minWidth, tooltipWidth }: { userId: string, minWidth?: string, tooltipWidth?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["user-books", userId],
    queryFn: () => getUserBooks(userId).then((r) => r.data),
    enabled: !!userId,
  });

  if (isLoading) return <span className="text-xs text-gray-300">...</span>;
  if (!data?.data?.length) return <span className="text-xs text-gray-300">—</span>;

  return (
    <CollapsedCell

      minWidth={minWidth}
      tooltipWidth={tooltipWidth}
      items={data.data.map((book: any) => (
        <div key={book._id} className="flex items-center gap-1.5">
          <BookOpen size={11} className="text-yellow-500 shrink-0" />
          <span className="text-[11px] text-gray-700 leading-tight">
            {book.title}
          </span>
        </div>
      ))}
    />
  );
}