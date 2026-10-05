import type { Metadata } from "next";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import StudyAgent from "@/components/agent/StudyAgent";
import RegisterServiceWorker from "@/components/pwa/RegisterServiceWorker";
import { AppProvider } from "@/context/AppProvider";
import { projectManager, themeVariablesCss } from "@/config/projectmanager";
import "./globals.css";

export const metadata: Metadata = {
  ...(projectManager.seo.siteUrl
    ? { metadataBase: new URL(projectManager.seo.siteUrl) }
    : {}),
  title: {
    default: projectManager.app.name,
    template: `%s | ${projectManager.app.name}`,
  },
  description: projectManager.app.description,
  applicationName: projectManager.app.name,
  appleWebApp: {
    capable: true,
    title: projectManager.app.name,
    statusBarStyle: "default",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/favicon_io/favicon.ico" },
      {
        url: "/favicon_io/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon_io/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/favicon_io/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/favicon_io/site.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground antialiased">
        <style dangerouslySetInnerHTML={{ __html: themeVariablesCss() }} />
        <GoogleAnalytics />
        <RegisterServiceWorker />
        <AppProvider>
          {children}
          <StudyAgent />
        </AppProvider>
      </body>
    </html>
  );
}
