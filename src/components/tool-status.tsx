"use client";
import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Database,
  Cog,
  LineChart,
  Shield,
  Target,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useReducer } from "react";
import { JSONValue } from "ai";
import { generateId } from "../utils/id";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// 定义证券研究工具的状态类型
export type ToolState = {
  activities: Array<{
    id: string;
    tool: string;
    params?: Record<string, any>;
    result?: Record<string, any>;
    error?: string;
    timestamp: string;
    // 证券研究特定字段
    phase?: ResearchPhase;
    searchState?: {
      query: string;
      source: string;
      foundDocuments: number;
      extractedInsights: number;
    };
    progress?: {
      totalSources: number;
      processedSources: number;
      reliability: {
        high: number;
        medium: number;
        low: number;
      };
    };
    findings?: {
      competitorInsights: number;
      marketMetrics: number;
      financialData: number;
      riskFactors: number;
    };
  }>;
};

// 研究阶段类型
type ResearchPhase =
  | "data_collection"
  | "competitor_analysis"
  | "financial_analysis"
  | "market_analysis"
  | "risk_analysis";

// 初始工具状态
const initialToolState: ToolState = {
  activities: [],
};

// 工具状态更新reducer
function toolReducer(state: ToolState, action: any): ToolState {
  if (action.type === "clear") {
    return initialToolState;
  }

  const { tool, content } = action;
  if (!tool || !content) return state;

  const newActivity = {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    tool,
    ...content,
    // 提取研究特定字段
    phase: content.phase,
    searchState: content.searchState,
    progress: content.progress,
    findings: content.findings,
    timestamp: content.timestamp || new Date().toISOString(),
  };

  return {
    ...state,
    activities: [...state.activities, newActivity],
  };
}

// 阶段标签组件
const PhaseBadge = ({ phase }: { phase: ResearchPhase }) => {
  const phaseConfig: Record<
    ResearchPhase,
    {
      color: string;
      icon: LucideIcon;
      label: string;
    }
  > = {
    data_collection: {
      color: "bg-blue-500",
      icon: Search,
      label: "Data Collection",
    },
    competitor_analysis: {
      color: "bg-purple-500",
      icon: Target,
      label: "Competitor Analysis",
    },
    financial_analysis: {
      color: "bg-green-500",
      icon: LineChart,
      label: "Financial Analysis",
    },
    market_analysis: {
      color: "bg-yellow-500",
      icon: Database,
      label: "Market Analysis",
    },
    risk_analysis: {
      color: "bg-red-500",
      icon: Shield,
      label: "Risk Analysis",
    },
  };

  // 确保 phase 存在于配置中
  if (!phase || !(phase in phaseConfig)) {
    return null;
  }

  const config = phaseConfig[phase];

  return (
    <Badge
      variant="secondary"
      className={`${config.color} text-white flex items-center gap-1`}
    >
      <config.icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

// 进度指示器组件
const ProgressIndicator = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div
        className="bg-blue-600 h-2.5 rounded-full"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

// 状态记录组件
const StatusRecord = ({
  activity,
  isExpanded,
  onToggle,
  isLatest,
}: {
  activity: ToolState["activities"][0];
  isExpanded: boolean;
  onToggle: () => void;
  isLatest: boolean;
}) => {
  const isResearchTool = activity.tool === "company_research";

  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: -10 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`border border-border rounded-lg overflow-hidden ${
        isLatest ? "bg-card shadow-sm" : "bg-muted/30"
      } mb-2`}
    >
      <div className="p-3 flex items-center cursor-pointer" onClick={onToggle}>
        <div className="flex items-center flex-1 min-w-0 gap-2">
          <span className="text-sm font-medium truncate">{activity.tool}</span>
          {activity.phase && <PhaseBadge phase={activity.phase} />}
          {activity.progress && (
            <Badge variant="outline">
              {activity.progress.processedSources}/
              {activity.progress.totalSources} Sources
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(activity.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0">
              {isResearchTool && (
                <div className="mb-3 space-y-2">
                  {/* 搜索状态 */}
                  {activity.searchState && (
                    <div className="bg-muted/50 p-2 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-medium">Current Search</p>
                        <Badge variant="outline">
                          {activity.searchState.source}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">
                        {activity.searchState.query}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Documents Found
                          </p>
                          <p className="text-sm font-medium">
                            {activity.searchState.foundDocuments}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Insights Extracted
                          </p>
                          <p className="text-sm font-medium">
                            {activity.searchState.extractedInsights}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 进度统计 */}
                  {activity.progress && (
                    <div className="space-y-2">
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-xs font-medium mb-2">
                          Overall Progress
                        </p>
                        <ProgressIndicator
                          current={activity.progress.processedSources}
                          total={activity.progress.totalSources}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/50 p-2 rounded">
                          <p className="text-xs font-medium">
                            Source Reliability
                          </p>
                          <div className="space-y-1 mt-1">
                            <div className="flex justify-between">
                              <span className="text-xs">High</span>
                              <span className="text-xs font-medium">
                                {activity.progress.reliability.high}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs">Medium</span>
                              <span className="text-xs font-medium">
                                {activity.progress.reliability.medium}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs">Low</span>
                              <span className="text-xs font-medium">
                                {activity.progress.reliability.low}
                              </span>
                            </div>
                          </div>
                        </div>

                        {activity.findings && (
                          <div className="bg-muted/50 p-2 rounded">
                            <p className="text-xs font-medium">Findings</p>
                            <div className="space-y-1 mt-1">
                              <div className="flex justify-between">
                                <span className="text-xs">Competitors</span>
                                <span className="text-xs font-medium">
                                  {activity.findings.competitorInsights}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs">Market Metrics</span>
                                <span className="text-xs font-medium">
                                  {activity.findings.marketMetrics}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs">Financial Data</span>
                                <span className="text-xs font-medium">
                                  {activity.findings.financialData}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs">Risk Factors</span>
                                <span className="text-xs font-medium">
                                  {activity.findings.riskFactors}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 参数和结果显示 */}
              {activity.params && (
                <div className="mb-2">
                  <h4 className="text-sm font-medium">Parameters:</h4>
                  <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto">
                    {JSON.stringify(activity.params, null, 2)}
                  </pre>
                </div>
              )}

              {activity.result && (
                <div className="mb-2">
                  <h4 className="text-sm font-medium">Result:</h4>
                  <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto">
                    {JSON.stringify(activity.result, null, 2)}
                  </pre>
                </div>
              )}

              {activity.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{activity.error}</AlertDescription>
                </Alert>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 主工具状态组件
export function ToolStatus({ data }: { data: any[] }) {
  const [state, dispatch] = useReducer(toolReducer, initialToolState);
  const [expandedIds, setExpandedIds] = React.useState(new Set());
  const processedItems = React.useRef(new Set<string>());

  useEffect(() => {
    if (!data?.length) return;

    data.forEach((item) => {
      if (
        typeof item === "object" &&
        item !== null &&
        "tool" in item &&
        "content" in item
      ) {
        const key = `${item.tool}-${item.content.timestamp}-${JSON.stringify(
          item.content
        )}`;

        if (!processedItems.current.has(key)) {
          processedItems.current.add(key);
          dispatch(item);
        }
      }
    });
  }, [data]);

  const handleClearAll = () => {
    dispatch({ type: "clear" });
    processedItems.current.clear();
    setExpandedIds(new Set());
  };

  useEffect(() => {
    if (state.activities.length > 0) {
      const latestId = state.activities[state.activities.length - 1].id;
      setExpandedIds(new Set([latestId]));
    }
  }, [state.activities.length]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (state.activities.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No research activities yet
      </div>
    );
  }

  const sortedActivities = [...state.activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-background z-10">
        <span className="text-sm text-muted-foreground">
          {sortedActivities.length} research activities
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="h-8"
        >
          Clear All
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {sortedActivities.map((activity, index) => (
            <StatusRecord
              key={activity.id}
              activity={activity}
              isExpanded={expandedIds.has(activity.id)}
              onToggle={() => toggleExpanded(activity.id)}
              isLatest={index === 0}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
