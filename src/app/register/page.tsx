import { Metadata } from "next";
import { AuthForm } from "../auth/components/auth-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, MessageSquare, Zap, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "注册 | FinanceInsight",
  description: "创建您的金融洞察账户，开始智能公司分析之旅",
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

          {/* 主标题和描述 */}
          <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight text-gray-900 dark:text-white mb-6">
            数据驱动的
            <br />
            <span className="text-blue-600 dark:text-blue-400">
              金融分析工具
            </span>
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
            加入
            FinanceInsight，获取专业的公司分析和市场洞察，轻松做出更明智的投资决策。
          </p>

          {/* 功能亮点 */}
          <div className="space-y-8 mt-8">
            <div className="flex items-start space-x-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  智能对话分析
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  通过自然语言对话，获取公司信息、财务数据和市场趋势的深度解析，无需复杂操作。
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  快速研究报告
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  在几分钟内生成全面的公司研究报告，包括财务分析、竞争格局和投资建议，节省您的研究时间。
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  市场情绪分析
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  实时追踪社交媒体和新闻来源，分析市场对公司的情绪变化，捕捉投资机会。
                </p>
              </div>
            </div>
          </div>

          {/* 用户反馈 */}
          <div className="mt-12 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
            <p className="italic text-gray-600 dark:text-gray-300">
              "作为个人投资者，FinanceInsight
              为我提供了机构级的分析能力，让我能够更自信地做出投资决策，强烈推荐！"
            </p>
            <div className="mt-4 flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  LX
                </span>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900 dark:text-white">
                  李小明
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  个人投资者
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧注册区域 - 占 1/4 */}
      <div className="w-full md:w-1/4 bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              创建账户
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              开始您的智能金融分析之旅
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
