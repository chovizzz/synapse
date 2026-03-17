import type { Metadata } from "next";
import "./globals.css";
import { RoleProvider } from "@/lib/role-context";

export const metadata: Metadata = {
  title: "Synapse — 广告代投协作平台",
  description: "让商务和优化师像同一个大脑一样协作",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}
