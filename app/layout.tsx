import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Malayalam } from "next/font/google";
import { AppThemeProvider } from "@/components/theme-provider";
import { SupportChatLazy } from "@/components/support-chat-lazy";
import { AppToaster } from "@/components/toaster";
import { isSupabaseConfigured, supabaseUrl } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const malayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  weight: ["400", "600", "700"],
  variable: "--font-malayalam",
  display: "swap",
  preload: false,
});

function supabaseOrigin() {
  if (!isSupabaseConfigured()) return "";
  try {
    return new URL(supabaseUrl()).origin;
  } catch {
    return "";
  }
}

export const metadata: Metadata = {
  title: {
    default: "Content Studio",
    template: "%s · Content Studio",
  },
  description: "Plan YouTube and Instagram videos in a private studio: titles, captions, tags, thumbnail prompts, and a publishing calendar.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const origin = supabaseOrigin();
  return (
    <html lang="en" className={`${inter.variable} ${malayalam.variable} h-full overflow-x-clip`} suppressHydrationWarning>
      <body className="min-h-full max-w-full overflow-x-clip antialiased">
        {origin ? (
          <>
            <link rel="preconnect" href={origin} />
            <link rel="dns-prefetch" href={origin} />
          </>
        ) : null}
        <AppThemeProvider>
          <a href="#main" className="skip-link">Skip to content</a>
          {children}
          <SupportChatLazy />
          <AppToaster />
        </AppThemeProvider>
      </body>
    </html>
  );
}
