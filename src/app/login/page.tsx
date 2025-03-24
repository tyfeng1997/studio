import { Metadata } from "next";
import { AuthForm } from "../auth/components/auth-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { BarChart3, FileText, Search, LineChart } from "lucide-react";

export const metadata: Metadata = {
  title: "Login | FinanceInsight",
  description:
    "Log in to your FinanceInsight account for professional company analysis",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { message: string; error: string };
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data?.user) {
    redirect("/chat");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-zinc-950">
      {/* Left side - App Introduction */}
      <div className="w-full md:w-2/3 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-zinc-950 p-6 md:p-12 flex items-center">
        <div className="max-w-2xl mx-auto">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center mr-3">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600">
                FinanceInsight
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Financial Intelligence · Data-Driven
              </p>
            </div>
          </div>

          {/* Main Heading */}
          <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight text-gray-900 dark:text-white mb-6">
            Intelligent Financial Analysis
            <span className="text-blue-600 dark:text-blue-400">,</span>
            <br />
            Supporting Your Investment Decisions
          </h2>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-5 mt-8">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-1">
                Deep Company Research
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Comprehensive analysis of public companies with financial
                metrics and investment outlook.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-1">
                Financial Report Analysis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Extract and analyze data from financial reports (10-K, 10-Q) for
                deeper insights.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 md:col-span-2">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                <LineChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-1">
                AI-Powered Investment Intelligence
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Make informed investment decisions with professional-grade
                financial analysis tools.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full md:w-1/3 bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Log in to access professional financial analysis
            </p>
          </div>
          <AuthForm
            type="login"
            error={searchParams.error}
            message={searchParams.message}
          />
        </div>
      </div>
    </div>
  );
}
