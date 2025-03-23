// app/report/layout.tsx
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Company Analysis Report | AI Research Tool",
  description: "Generate detailed company analysis reports using AI",
};

export default async function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">{children}</div>
  );
}
