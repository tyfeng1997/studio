"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  FileSpreadsheet,
  TrendingUp,
  FileText,
  ChevronRight,
} from "lucide-react";

type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

export function WelcomeView({ onStartChat }: { onStartChat: () => void }) {
  const features: Feature[] = [
    {
      icon: <FileSpreadsheet className="h-6 w-6 text-white" />,
      title: "数据收集",
      description: "自动收集上市公司财务数据、公告和市场动态，无需手动搜索",
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-white" />,
      title: "财务分析",
      description: "深入分析公司财务指标，揭示潜在投资机会和风险",
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-white" />,
      title: "市场趋势",
      description: "跟踪行业趋势和市场变化，把握投资时机",
    },
    {
      icon: <FileText className="h-6 w-6 text-white" />,
      title: "报告生成",
      description: "自动生成专业分析报告，帮助您做出明智决策",
    },
  ];

  // 使用useEffect确保只在客户端渲染
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
          智能公司分析助手
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          专注于上市公司数据收集与分析，为您提供专业的投资决策支持
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full mb-8">
        {features.map((feature, index) => (
          <div key={index}>
            <Card className="border-border hover:border-primary/20 transition-all duration-300 h-full bg-card">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/30 p-3 rounded-lg">
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

      <div className="w-full max-w-md">
        <Button
          onClick={onStartChat}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-lg transition-all duration-300 flex items-center justify-center group"
          size="lg"
        >
          <span className="mr-2">开始分析对话</span>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
        </Button>
      </div>
    </div>
  );
}
