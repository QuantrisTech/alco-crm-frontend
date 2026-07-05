
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
// import GuideModal from "./guide-modal";

export default function GuideButton({ pageKey }: { pageKey: string }) {
    const router = useRouter();
  // const [open, setOpen] = useState(false);

  return (
    <>
      <button
      onClick={() => router.push(`/dashboard/guide/view?pageKey=${pageKey}`)}
        // className={`text-[10px] font-medium px-4  py-0.5 rounded-full shrink-0 bg-gray-100 text-gray-600 ms-4 border border-gray-400`}
        className="inline-flex justify-center whitespace-nowrap rounded-full px-4 py-0.5 ms-4 text-sm font-medium text-gray-200 dark:text-gray-800 bg-gradient-to-r from-gray-800 to-gray-700 dark:from-gray-200 dark:to-gray-100 dark:hover:bg-gray-100 shadow focus:outline-none focus:ring focus:ring-gray-500/50 focus-visible:outline-none focus-visible:ring focus-visible:ring-gray-500/50 relative before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_25%,theme(colors.white/.5)_50%,transparent_75%,transparent_100%)] dark:before:bg-[linear-gradient(45deg,transparent_25%,theme(colors.white)_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%,100%_100%] before:bg-[position:200%_0,0_0] before:bg-no-repeat before:[transition:background-position_0s_ease] hover:before:bg-[position:-100%_0,0_0] hover:before:duration-[1500ms]"
      >
        Guide
      </button>

      {/* {open && <GuideModal pageKey={pageKey} onClose={() => setOpen(false)} />} */}
    </>
  );
}