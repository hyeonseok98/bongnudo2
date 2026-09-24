import { Footer } from "@/components/layouts/footer";
import { Header } from "@/components/layouts/header";
import { HeaderWithCurrentUser } from "@/components/layouts/header-with-current-user";
import { MainContainer } from "@/components/layouts/main-container";
import { Sidebar } from "@/components/layouts/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SIDEBAR_COOKIE_NAME } from "@/constants/sidebar";
import {
  getRpModeSettings,
  MEDIA_PREVIEW_BLUR_COOKIE_NAME,
  RP_MODE_COOKIE_NAME,
} from "@/features/rp-mode/rp-mode";
import { getSiteOrigin } from "@/features/seo/site-origin";
import { QueryProvider } from "@/providers/query-provider";
import { RpModeProvider } from "@/providers/rp-mode-provider";
import { SidebarProvider } from "@/providers/sidebar-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";

import "./globals.css";

const pretendard = localFont({
  src: "../styles/fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: "봉누록 | 봉누도2의 모든 기록",
    template: "%s | 봉누록",
  },
  icons: {
    icon: "/logo/bongnurok_favicon_small.png",
  },
  description:
    "봉누도2의 인물과 조직, 실시간 현황, 다시보기와 클립을 한곳에서 확인할 수 있는 봉누도2 정보 사이트입니다.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();

  const initialIsOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";
  const initialRpModeSettings = getRpModeSettings(
    cookieStore.get(RP_MODE_COOKIE_NAME)?.value,
    cookieStore.get(MEDIA_PREVIEW_BLUR_COOKIE_NAME)?.value,
  );

  return (
    <html
      lang="ko"
      className={`${pretendard.className} ${pretendard.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <ThemeProvider>
          <TooltipProvider>
            <RpModeProvider initialSettings={initialRpModeSettings}>
              <SidebarProvider initialIsOpen={initialIsOpen}>
                <div className="flex h-dvh flex-col overflow-hidden bg-background">
                  <Suspense fallback={<Header currentUser={null} />}>
                    <HeaderWithCurrentUser />
                  </Suspense>

                  <div className="flex min-h-0 flex-1">
                    <Sidebar />

                    <div
                      className="@container flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-background"
                      data-app-scroll-container
                    >
                      <NuqsAdapter>
                        <QueryProvider>
                          <MainContainer className="flex min-h-full flex-col">
                            <div className="flex-1">{children}</div>
                            <Footer />
                          </MainContainer>
                        </QueryProvider>
                      </NuqsAdapter>
                    </div>
                  </div>
                </div>
              </SidebarProvider>
            </RpModeProvider>
          </TooltipProvider>
        </ThemeProvider>

        <Analytics />

        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
      </body>
    </html>
  );
}
