import { Metadata } from "next";
import { AuthForm } from "../auth/components/auth-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, LineChart, FileText, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "登录 | FinanceInsight",
  description: "登录您的金融洞察账户，获取专业的公司分析",
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
      {/* 左侧产品介绍区域 - 占 3/4 */}
      <div className="w-full md:w-3/4 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-zinc-950 p-6 md:p-12 flex items-center">
        <div className="max-w-3xl mx-auto">
          {/* Logo */}
          <div className="flex items-center mb-12">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center mr-3">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600">
                FinanceInsight
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                金融洞察·数据驱动
              </p>
            </div>
          </div>

          {/* 主标题 */}
          <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight text-gray-900 dark:text-white mb-6">
            智能金融分析
            <span className="text-blue-600 dark:text-blue-400">，</span>
            <br />
            为您的投资决策提供支持
          </h2>

          {/* 特点介绍 */}
          <div className="grid md:grid-cols-2 gap-6 mt-10">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                全面数据收集
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                自动收集并整合来自多个来源的公司信息，包括财务数据、新闻报道和分析师报告。
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                财务深度分析
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                深入分析公司财务指标和业绩表现，揭示潜在的投资机会和风险。
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
              <div className="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                <LineChart className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                市场趋势追踪
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                识别市场变化和行业趋势，让您领先一步了解可能影响投资的关键发展。
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                专业研究报告
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                生成详细的公司分析报告，包括财务状况、竞争优势和风险评估，帮助您做出明智决策。
              </p>
            </div>
          </div>

          {/* 底部信息 */}
          <div className="mt-12 pt-6 border-t border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-gray-400 text-sm">
            使用
            FinanceInsight，您可以获取专业级的金融分析工具，让投资决策更加明智、高效。
          </div>
        </div>
      </div>

      {/* 右侧登录区域 - 占 1/4 */}
      <div className="w-full md:w-1/4 bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              欢迎回来
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              登录您的账户获取专业金融分析
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
