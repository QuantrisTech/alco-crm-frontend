import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "@/app/styles/globals.css";
import { Toaster } from "react-hot-toast";
import Providers from "./providers";
import ConditionLayout from "./condition-layout/condition-layout";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AL&CO CRM",
    template: "%s | AL&CO CRM",
  },
  icons: {
    icon: "/mini-logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-linear-to-br from-[#e7e7fc] via-[#fdfcf2] to-[#e0f2fe]`}>
        <Providers>
          <Toaster
            position="bottom-right" />
          <ConditionLayout>
            {children}
          </ConditionLayout>
        </Providers>
      </body>
    </html>
  );
}