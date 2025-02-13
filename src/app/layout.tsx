import type { Metadata } from "next";
import {
  Inter as FontDefault,
  Plus_Jakarta_Sans as FontDisplay,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

import { Navbar } from "@/components/layout/navbar";
import { MainLayout } from "@/components/layout/main-layout";

const defaultFont = FontDefault({
  subsets: ["latin"],
  variable: "--font-default",
});

const displayFont = FontDisplay({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "LLM Chat App",
  description: "A chat application with LLM and tools support",
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
          <Navbar />
          <MainLayout>{children}</MainLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
