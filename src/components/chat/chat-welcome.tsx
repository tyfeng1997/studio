"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, FileSpreadsheet, TrendingUp, FileText } from "lucide-react";

type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
  prompt: string;
  gradientClass: string;
  iconClass: string;
};

export function WelcomeView({
  setPrompt,
}: {
  onStartChat?: () => void;
  setPrompt: (prompt: string) => void;
}) {
  const features: Feature[] = [
    {
      icon: (
        <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      ),
      title: "数据收集",
      description: "自动收集上市公司财务数据、公告和市场动态，无需手动搜索",
      prompt:
        "请帮我收集最近3年内阿里巴巴的财务数据，包括总收入、净利润、经营现金流以及主要业务板块的营收占比。",
      gradientClass: "from-blue-500 to-blue-600",
      iconClass: "icon-container-blue",
    },
    {
      icon: (
        <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
      ),
      title: "财务分析",
      description: "深入分析公司财务指标，揭示潜在投资机会和风险",
      prompt:
        "请分析腾讯控股最近一年的财务状况，重点关注盈利能力、偿债能力和现金流量指标，并与行业平均水平进行对比。",
      gradientClass: "from-green-500 to-green-600",
      iconClass: "icon-container-green",
    },
    {
      icon: (
        <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
      ),
      title: "市场趋势",
      description: "跟踪行业趋势和市场变化，把握投资时机",
      prompt:
        "请分析当前新能源汽车行业的市场趋势，包括政策环境、技术发展、主要玩家的市场份额变化以及未来3-5年的发展前景。",
      gradientClass: "from-amber-500 to-amber-600",
      iconClass: "icon-container-amber",
    },
    {
      icon: (
        <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
      ),
      title: "报告生成",
      description: "自动生成专业分析报告，帮助您做出明智决策",
      prompt:
        "请为我生成一份关于中国半导体产业的投资研究报告，包括行业现状、主要企业分析、技术发展趋势、投资机会与风险。",
      gradientClass: "from-purple-500 to-purple-600",
      iconClass: "icon-container-purple",
    },
  ];

  // 使用useEffect确保只在客户端渲染
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 处理功能卡片点击，将预设的prompt设置到输入框
  const handleFeatureClick = (prompt: string) => {
    setPrompt(prompt);
  };

  // 如果不是客户端，返回简单的骨架屏
  if (!mounted) {
    return (
      <div className="w-full py-8" suppressHydrationWarning>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            智能公司分析助手
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center py-8 w-full"
      suppressHydrationWarning
    >
      <div className="text-center mb-10">
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-full inline-block mb-4">
          金融洞察 · 数据驱动
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          智能公司分析助手
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          专注于上市公司数据收集与分析，为您提供专业的投资决策支持
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full mb-8">
        {features.map((feature, index) => (
          <div key={index}>
            <Card
              className="border-border hover:border-primary/20 transition-all duration-300 h-full bg-white dark:bg-zinc-800 hover:shadow-md cursor-pointer overflow-hidden"
              onClick={() => handleFeatureClick(feature.prompt)}
            >
              <div
                className={`h-1 bg-gradient-to-r ${feature.gradientClass}`}
              ></div>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`${feature.iconClass} p-3 rounded-lg`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
