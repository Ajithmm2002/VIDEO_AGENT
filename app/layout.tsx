import type { Metadata } from "next";
import { Noto_Sans_Malayalam, Outfit } from "next/font/google";
import { AppThemeProvider } from "@/components/theme-provider";
import { AppToaster } from "@/components/toaster";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const malayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  weight: ["400", "600", "700"],
  variable: "--font-malayalam",
});

export const metadata: Metadata = {
  title: {
    default: "Content Studio",
    template: "%s · Content Studio",
  },
  description: "Plan YouTube and Instagram content, thumbnail prompts, and a publishing calendar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${malayalam.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <AppThemeProvider>
          {children}
          <AppToaster />
        </AppThemeProvider>
      </body>
    </html>
  );
}
