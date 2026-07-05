"use client";

import { useQuery } from "@tanstack/react-query";
import { getGuideByPageKey } from "@/utils/api";
import GuideContentRenderer from "./guide-content-renderer";

export default function GuideModal({
  pageKey,
  onClose,
}: {
  pageKey: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["guide", pageKey],
    queryFn: async () => (await getGuideByPageKey(pageKey)).data.data,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isLoading ? "Loading..." : data?.heading || "Guide"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        {isLoading && <p className="text-sm text-gray-500">Guide load ho raha hai...</p>}
        {isError && <p className="text-sm text-red-500">Guide load nahi ho saka.</p>}

        {data && (
          <>
            {data.description?.length > 0 && (
              <div className="mb-4">
                <GuideContentRenderer blocks={data.description} />
              </div>
            )}
            <video
              src={data.videoUrl}
              controls
              className="w-full rounded-lg"
              controlsList="nodownload"
            />
          </>
        )}
      </div>
    </div>
  );
}