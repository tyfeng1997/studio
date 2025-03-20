// app/layout.tsx
import type { Metadata } from "next";
import {
  Inter as FontDefault,
  Plus_Jakarta_Sans as FontDisplay,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const defaultFont = FontDefault({
  subsets: ["latin"],
  variable: "--font-default",
});

const displayFont = FontDisplay({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "FinanceInsight.app | AI-Powered Financial Analysis",
  description:
    "Get instant insights on companies, markets, and financial news with our advanced AI toolkit. Research reports, sentiment analysis, and market positioning in seconds.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${defaultFont.variable} ${displayFont.variable} font-default`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
