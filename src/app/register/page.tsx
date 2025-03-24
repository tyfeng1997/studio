import { Metadata } from "next";
import { AuthForm } from "../auth/components/auth-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { BarChart3, MessageSquare, Zap, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Register | FinanceInsight",
  description:
    "Create your FinanceInsight account and start your intelligent financial analysis journey",
};

export default async function RegisterPage({
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

          {/* Main Heading and Description */}
          <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight text-gray-900 dark:text-white mb-4">
            Data-Driven
            <br />
            <span className="text-blue-600 dark:text-blue-400">
              Financial Analysis Tools
            </span>
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
            Join FinanceInsight to access professional company analysis and
            market insights for smarter investment decisions.
          </p>

          {/* Key Features */}
          <div className="space-y-6 mt-8">
            <div className="flex items-start space-x-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Intelligent Conversational Analysis
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Get in-depth insights on company information, financial data,
                  and market trends through natural language conversation.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Rapid Research Reports
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Generate comprehensive company research reports in minutes,
                  including financial analysis, competitive landscape, and
                  investment recommendations.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Financial Document Analysis
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Extract key insights from financial reports and SEC filings to
                  uncover hidden opportunities and potential risks.
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-10 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
            <p className="italic text-gray-600 dark:text-gray-300">
              "As an individual investor, FinanceInsight provides me with
              institutional-grade analysis capabilities, enabling me to make
              investment decisions with greater confidence."
            </p>
            <div className="mt-4 flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  JD
                </span>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900 dark:text-white">
                  John Doe
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Individual Investor
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration Form */}
      <div className="w-full md:w-1/3 bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Create Account
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Start your intelligent financial analysis journey
            </p>
          </div>
          <AuthForm
            type="register"
            error={searchParams.error}
            message={searchParams.message}
          />
        </div>
      </div>
    </div>
  );
}
