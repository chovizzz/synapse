import type { Metadata } from "next";
import "./globals.css";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { RoleProvider } from "@/lib/role-context";
import { ThemeProvider } from "@/lib/theme-provider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Synapse — 广告代投协作平台",
  description: "让商务和优化师像同一个大脑一样协作",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body>
        <NextAuthProvider>
          <ThemeProvider>
            <RoleProvider>{children}</RoleProvider>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
