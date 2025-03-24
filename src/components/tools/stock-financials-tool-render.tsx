"use client";
import React, { useState } from "react";
import {
  DollarSign,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Financial metric rendering component with value formatting
const FinancialMetric = ({
  label,
  data,
  positive = true,
  showChange = false,
  prevData = null,
}) => {
  if (!data) return null;

  // Calculate percentage change if previous data is provided
  let percentChange = null;
  if (showChange && prevData && prevData.raw !== 0) {
    percentChange = ((data.raw - prevData.raw) / Math.abs(prevData.raw)) * 100;
  }

  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{data.formatted}</span>
      {percentChange !== null && (
        <div
          className={`flex items-center text-xs font-medium mt-1 ${
            percentChange > 0
              ? positive
                ? "text-green-500"
                : "text-red-500"
              : positive
              ? "text-red-500"
              : "text-green-500"
          }`}
        >
          {percentChange > 0 ? (
            <ArrowUp className="w-3 h-3 mr-1" />
          ) : (
            <ArrowDown className="w-3 h-3 mr-1" />
          )}
          {Math.abs(percentChange).toFixed(1)}%
        </div>
      )}
    </div>
  );
};

// Financial metric section component
const MetricSection = ({ title, items, icon: Icon }) => {
  // Move useState hook to the top level - always called
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border rounded-md overflow-hidden mb-3">
      <div
        className="flex items-center p-2 bg-muted/50 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
        <h4 className="text-sm font-medium flex-1">{title}</h4>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {isOpen && (
        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map(
            (item, index) =>
              item.data && (
                <FinancialMetric
                  key={index}
                  label={item.label}
                  data={item.data}
                  positive={item.positive !== undefined ? item.positive : true}
                  showChange={item.showChange}
                  prevData={item.prevData}
                />
              )
          )}
        </div>
      )}
    </div>
  );
};

// Company financials result renderer
export function StockFinancialsResultRenderer({ data }) {
  // Always initialize these hooks, regardless of data condition
  const [activeReportIndex, setActiveReportIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("income");

  // Handle empty data case separately
  if (!data || !data.reports || data.reports.length === 0) {
    return (
      <ToolCard title="Financial Data">
        <div className="text-center text-muted-foreground text-sm py-2">
          No financial data found
        </div>
      </ToolCard>
    );
  }

  const { ticker, company_name, reports } = data;
  const activeReport = reports[activeReportIndex];
  const prevReport = reports[activeReportIndex + 1]; // For comparisons

  const periodBadgeColor =
    activeReport.timeframe === "annual"
      ? "bg-blue-100 text-blue-800"
      : activeReport.timeframe === "quarterly"
      ? "bg-green-100 text-green-800"
      : "bg-purple-100 text-purple-800";

  return (
    <ToolCard title={`${company_name} (${ticker}) Financial Data`}>
      <div className="space-y-4">
        {/* Report selector */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm font-medium mr-1">Period:</span>
          {reports.map((report, index) => (
            <Button
              key={index}
              variant={activeReportIndex === index ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveReportIndex(index)}
              className="h-8"
            >
              {report.period}
              <Badge className={`ml-2 ${periodBadgeColor}`} variant="outline">
                {report.timeframe}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Filing date info */}
        <div className="text-xs text-muted-foreground">
          <span>
            Period: {activeReport.dates.start_date} to{" "}
            {activeReport.dates.end_date}
          </span>
          <span className="mx-2">•</span>
          <span>Filed: {activeReport.dates.filing_date}</span>
          <a
            href={activeReport.source_filing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center ml-2 text-primary hover:underline"
          >
            Source Filing <ExternalLink className="ml-1 w-3 h-3" />
          </a>
        </div>

        {/* Financial data tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="income" className="text-xs">
              Income Statement
            </TabsTrigger>
            <TabsTrigger value="balance" className="text-xs">
              Balance Sheet
            </TabsTrigger>
            <TabsTrigger value="cash" className="text-xs">
              Cash Flow
            </TabsTrigger>
          </TabsList>

          {/* Income Statement Tab */}
          <TabsContent value="income" className="pt-4">
            <MetricSection
              title="Revenue & Profitability"
              icon={DollarSign}
              items={[
                {
                  label: "Revenue",
                  data: activeReport.income_statement.revenue,
                  showChange: true,
                  prevData: prevReport?.income_statement.revenue,
                },
                {
                  label: "Cost of Revenue",
                  data: activeReport.income_statement.cost_of_revenue,
                  positive: false,
                  showChange: true,
                  prevData: prevReport?.income_statement.cost_of_revenue,
                },
                {
                  label: "Gross Profit",
                  data: activeReport.income_statement.gross_profit,
                  showChange: true,
                  prevData: prevReport?.income_statement.gross_profit,
                },
                {
                  label: "Operating Expenses",
                  data: activeReport.income_statement.operating_expenses,
                  positive: false,
                  showChange: true,
                  prevData: prevReport?.income_statement.operating_expenses,
                },
                {
                  label: "Operating Income",
                  data: activeReport.income_statement.operating_income,
                  showChange: true,
                  prevData: prevReport?.income_statement.operating_income,
                },
                {
                  label: "Net Income",
                  data: activeReport.income_statement.net_income,
                  showChange: true,
                  prevData: prevReport?.income_statement.net_income,
                },
              ]}
            />

            <MetricSection
              title="Per Share Data & Operating Expenses"
              icon={BarChart2}
              items={[
                {
                  label: "Basic EPS",
                  data: activeReport.income_statement.earnings_per_share.basic,
                  showChange: true,
                  prevData:
                    prevReport?.income_statement.earnings_per_share.basic,
                },
                {
                  label: "Diluted EPS",
                  data: activeReport.income_statement.earnings_per_share
                    .diluted,
                  showChange: true,
                  prevData:
                    prevReport?.income_statement.earnings_per_share.diluted,
                },
                {
                  label: "R&D Expenses",
                  data: activeReport.income_statement.research_and_development,
                  positive: false,
                  showChange: true,
                  prevData:
                    prevReport?.income_statement.research_and_development,
                },
                {
                  label: "SG&A Expenses",
                  data: activeReport.income_statement.selling_general_admin,
                  positive: false,
                  showChange: true,
                  prevData: prevReport?.income_statement.selling_general_admin,
                },
              ]}
            />
          </TabsContent>

          {/* Balance Sheet Tab */}
          <TabsContent value="balance" className="pt-4">
            <MetricSection
              title="Assets"
              icon={Layers}
              items={[
                {
                  label: "Total Assets",
                  data: activeReport.balance_sheet.assets.total,
                  showChange: true,
                  prevData: prevReport?.balance_sheet.assets.total,
                },
                {
                  label: "Current Assets",
                  data: activeReport.balance_sheet.assets.current,
                  showChange: true,
                  prevData: prevReport?.balance_sheet.assets.current,
                },
                {
                  label: "Non-current Assets",
                  data: activeReport.balance_sheet.assets.noncurrent,
                  showChange: true,
                  prevData: prevReport?.balance_sheet.assets.noncurrent,
                },
              ]}
            />

            <MetricSection
              title="Liabilities & Equity"
              icon={BarChart2}
              items={[
                {
                  label: "Total Liabilities",
                  data: activeReport.balance_sheet.liabilities.total,
                  positive: false,
                  showChange: true,
                  prevData: prevReport?.balance_sheet.liabilities.total,
                },
                {
                  label: "Current Liabilities",
                  data: activeReport.balance_sheet.liabilities.current,
                  positive: false,
                  showChange: true,
                  prevData: prevReport?.balance_sheet.liabilities.current,
                },
                {
                  label: "Non-current Liabilities",
                  data: activeReport.balance_sheet.liabilities.noncurrent,
                  positive: false,
                  showChange: true,
                  prevData: prevReport?.balance_sheet.liabilities.noncurrent,
                },
                {
                  label: "Long Term Debt",
                  data: activeReport.balance_sheet.liabilities.long_term_debt,
                  positive: false,
                  showChange: true,
                  prevData:
                    prevReport?.balance_sheet.liabilities.long_term_debt,
                },
                {
                  label: "Equity",
                  data: activeReport.balance_sheet.equity,
                  showChange: true,
                  prevData: prevReport?.balance_sheet.equity,
                },
              ]}
            />
          </TabsContent>

          {/* Cash Flow Tab */}
          <TabsContent value="cash" className="pt-4">
            <MetricSection
              title="Cash Flow"
              icon={TrendingUp}
              items={[
                {
                  label: "Operating Activities",
                  data: activeReport.cash_flow.operating,
                  showChange: true,
                  prevData: prevReport?.cash_flow.operating,
                },
                {
                  label: "Investing Activities",
                  data: activeReport.cash_flow.investing,
                  showChange: true,
                  prevData: prevReport?.cash_flow.investing,
                },
                {
                  label: "Financing Activities",
                  data: activeReport.cash_flow.financing,
                  showChange: true,
                  prevData: prevReport?.cash_flow.financing,
                },
                {
                  label: "Net Cash Flow",
                  data: activeReport.cash_flow.net_cash_flow,
                  showChange: true,
                  prevData: prevReport?.cash_flow.net_cash_flow,
                },
              ]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ToolCard>
  );
}
