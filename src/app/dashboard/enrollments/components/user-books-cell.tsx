// enrollments/page.tsx mein import karo
import { useQuery } from "@tanstack/react-query";
import { getUserBooks } from "@/utils/api";

export function UserBooksCell({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["user-books", userId],
    queryFn:  () => getUserBooks(userId).then((r) => r.data),
    enabled:  !!userId,
  });

  if (isLoading) return <span className="text-xs text-gray-300">...</span>;
  if (!data?.data?.length) return <span className="text-xs text-gray-300">—</span>;

  return (
    <div className="flex flex-col gap-1">
      {data.data.map((book: any) => (
        <span
          key={book._id}
          className="text-xs text-gray-600 bg-yellow-50 px-2 py-0.5 rounded-full w-fit"
        >
          📖 {book.title}
        </span>
      ))}
    </div>
  );
}

