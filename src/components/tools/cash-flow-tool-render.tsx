"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolCard } from "@/components/tool-card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  ReferenceLine,
} from "recharts";

export function CashFlowResultRenderer({ data }) {
  const [activeTab, setActiveTab] = useState("summary");

  if (!data || !data.reports || !Array.isArray(data.reports)) {
    return (
      <ToolCard title="Cash Flow Data">
        <div className="text-center text-muted-foreground text-sm py-2">
          No cash flow data available
        </div>
      </ToolCard>
    );
  }

  // Format currency in millions
  const formatMillions = (value) => {
    if (value === null || value === undefined) return "N/A";
    return `$${Number(value).toLocaleString()} M`;
  };

  // Format currency in full
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "None") return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format ratio
  const formatRatio = (value) => {
    if (value === null || value === undefined) return "N/A";
    return value;
  };

  // Format change with arrow
  const formatChange = (value) => {
    if (value === null || value === undefined) return "N/A";
    const numValue = parseFloat(value);
    return (
      <span className={numValue >= 0 ? "text-green-500" : "text-red-500"}>
        {numValue >= 0 ? "↑" : "↓"} {Math.abs(numValue).toFixed(2)}%
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString || dateString === "None") return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get year from date string
  const getYear = (dateString) => {
    if (!dateString || dateString === "None") return "N/A";
    return new Date(dateString).getFullYear();
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatMillions(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for ratio charts
  const RatioTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare data for the cash flow sources chart
  const cashFlowSourcesData = data.keyMetrics
    .map((metric) => ({
      name: getYear(metric.period),
      Operating: metric.operatingCashflow,
      Investing: metric.investingCashflow,
      Financing: metric.financingCashflow,
    }))
    .reverse(); // Reverse to show oldest to newest

  // Prepare data for the free cash flow chart
  const freeCashFlowData = data.keyMetrics
    .map((metric) => ({
      name: getYear(metric.period),
      "Operating Cash Flow": metric.operatingCashflow,
      "Capital Expenditures": -Math.abs(metric.capEx), // Always show as negative
      "Free Cash Flow": metric.freeCashFlow,
    }))
    .reverse();

  // Prepare data for the ratios chart
  const ratiosData = data.keyMetrics
    .map((metric) => ({
      name: getYear(metric.period),
      "OCF to Net Income": parseFloat(metric.operatingCashFlowToNetIncome || 0),
      "FCF to Net Income": parseFloat(metric.freeCashFlowToNetIncome || 0),
      "Dividend Coverage": parseFloat(metric.dividendCoverageRatio || 0),
    }))
    .reverse();

  // Prepare data for the cash distribution chart
  const cashDistributionData = data.keyMetrics
    .map((metric) => ({
      name: getYear(metric.period),
      "Capital Expenditures": metric.capEx,
      "Dividend Payout": metric.dividendPayout,
      "Free Cash Flow": metric.freeCashFlow,
    }))
    .reverse();

  return (
    <div className="space-y-4">
      <ToolCard title={`Cash Flow for ${data.symbol} (${data.period})`}>
        <Tabs defaultValue="summary" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="ratios">Ratios</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="space-y-4">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Operating Cash Flow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatMillions(data.keyMetrics[0].operatingCashflow)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Free Cash Flow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatMillions(data.keyMetrics[0].freeCashFlow)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Capital Expenditures
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatMillions(data.keyMetrics[0].capEx)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Dividend Payout
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatMillions(data.keyMetrics[0].dividendPayout)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cash Flow Sources Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">Cash Flow Sources</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowSourcesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="Operating"
                        fill="#4f46e5"
                        name="Operating"
                      />
                      <Bar
                        dataKey="Investing"
                        fill="#f59e0b"
                        name="Investing"
                      />
                      <Bar
                        dataKey="Financing"
                        fill="#10b981"
                        name="Financing"
                      />
                      <ReferenceLine y={0} stroke="#666" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Free Cash Flow Calculation Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Free Cash Flow Calculation
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={freeCashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Operating Cash Flow" fill="#4f46e5" />
                      <Bar dataKey="Capital Expenditures" fill="#f59e0b" />
                      <Line
                        type="monotone"
                        dataKey="Free Cash Flow"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <ReferenceLine y={0} stroke="#666" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary Table */}
              <div>
                <h4 className="text-sm font-medium mb-2">Cash Flow Summary</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Operating Cash Flow</TableHead>
                      <TableHead>Investing Cash Flow</TableHead>
                      <TableHead>Financing Cash Flow</TableHead>
                      <TableHead>Free Cash Flow</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.reports.map((report, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {formatDate(report.fiscalDateEnding)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(report.operatingCashflow)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(report.cashflowFromInvestment)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(report.cashflowFromFinancing)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(report.freeCashFlow)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="charts">
            <div className="space-y-6">
              {/* Cash Distribution Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">Cash Distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Capital Expenditures" fill="#f59e0b" />
                      <Bar dataKey="Dividend Payout" fill="#4f46e5" />
                      <Bar dataKey="Free Cash Flow" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Net Income vs Cash Flow Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Net Income vs. Cash Flow
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={freeCashFlowData.map((item) => ({
                        name: item.name,
                        "Net Income":
                          data.keyMetrics.find(
                            (m) => getYear(m.period) == item.name
                          )?.netIncome || 0,
                        "Operating Cash Flow": item["Operating Cash Flow"],
                        "Free Cash Flow": item["Free Cash Flow"],
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Net Income" fill="#8884d8" />
                      <Bar dataKey="Operating Cash Flow" fill="#4f46e5" />
                      <Line
                        type="monotone"
                        dataKey="Free Cash Flow"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Operating Cash Flow Trend */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Operating Cash Flow Components
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.keyMetrics
                        .map((metric) => ({
                          name: getYear(metric.period),
                          "Net Income": metric.netIncome,
                          "Depreciation & Amortization":
                            data.reports.find(
                              (r) => r.fiscalDateEnding === metric.period
                            )?.depreciationDepletionAndAmortization === "None"
                              ? 0
                              : Number(
                                  data.reports.find(
                                    (r) => r.fiscalDateEnding === metric.period
                                  )?.depreciationDepletionAndAmortization || 0
                                ) / 1000000,
                          "Working Capital Changes":
                            ((data.reports.find(
                              (r) => r.fiscalDateEnding === metric.period
                            )?.changeInOperatingLiabilities === "None"
                              ? 0
                              : Number(
                                  data.reports.find(
                                    (r) => r.fiscalDateEnding === metric.period
                                  )?.changeInOperatingLiabilities || 0
                                )) +
                              (data.reports.find(
                                (r) => r.fiscalDateEnding === metric.period
                              )?.changeInOperatingAssets === "None"
                                ? 0
                                : Number(
                                    data.reports.find(
                                      (r) =>
                                        r.fiscalDateEnding === metric.period
                                    )?.changeInOperatingAssets || 0
                                  ))) /
                            1000000,
                        }))
                        .reverse()}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Net Income" fill="#8884d8" />
                      <Bar
                        dataKey="Depreciation & Amortization"
                        fill="#4f46e5"
                      />
                      <Bar dataKey="Working Capital Changes" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ratios">
            <div className="space-y-6">
              {/* Financial Ratios Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      OCF to Net Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatRatio(
                        data.keyMetrics[0].operatingCashFlowToNetIncome
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      FCF to Net Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatRatio(data.keyMetrics[0].freeCashFlowToNetIncome)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Dividend Coverage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatRatio(data.keyMetrics[0].dividendCoverageRatio)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      CapEx to OCF
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatRatio(data.keyMetrics[0].capExToOperatingCashFlow)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Ratios Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Key Financial Ratios Over Time
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ratiosData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<RatioTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="OCF to Net Income"
                        stroke="#4f46e5"
                      />
                      <Line
                        type="monotone"
                        dataKey="FCF to Net Income"
                        stroke="#f59e0b"
                      />
                      <Line
                        type="monotone"
                        dataKey="Dividend Coverage"
                        stroke="#10b981"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Financial Ratios Table */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Cash Flow Ratios Explained
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ratio</TableHead>
                      <TableHead>Formula</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>OCF to Net Income</TableCell>
                      <TableCell>Operating Cash Flow / Net Income</TableCell>
                      <TableCell>
                        Measures the company's ability to convert its profits
                        into cash. A ratio greater than 1 indicates high-quality
                        earnings.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>FCF to Net Income</TableCell>
                      <TableCell>Free Cash Flow / Net Income</TableCell>
                      <TableCell>
                        Shows how much of the reported income is actually
                        available as free cash flow. Higher ratios indicate
                        stronger cash generation.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Dividend Coverage</TableCell>
                      <TableCell>Free Cash Flow / Dividend Payout</TableCell>
                      <TableCell>
                        Indicates how many times over the company could pay its
                        dividends from free cash flow. Higher ratios suggest
                        more sustainable dividends.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>CapEx to OCF</TableCell>
                      <TableCell>
                        Capital Expenditures / Operating Cash Flow
                      </TableCell>
                      <TableCell>
                        Shows what portion of operating cash is being reinvested
                        in the business. Lower ratios indicate less capital
                        intensity.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Ratios by Period Table */}
              <div>
                <h4 className="text-sm font-medium mb-2">Ratios by Period</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>OCF to Net Income</TableHead>
                      <TableHead>FCF to Net Income</TableHead>
                      <TableHead>Dividend Coverage</TableHead>
                      <TableHead>CapEx to OCF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.reports.map((report, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {formatDate(report.fiscalDateEnding)}
                        </TableCell>
                        <TableCell>
                          {formatRatio(report.operatingCashFlowToNetIncome)}
                        </TableCell>
                        <TableCell>
                          {formatRatio(report.freeCashFlowToNetIncome)}
                        </TableCell>
                        <TableCell>
                          {formatRatio(report.dividendCoverageRatio)}
                        </TableCell>
                        <TableCell>
                          {formatRatio(report.capExToOperatingCashFlow)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="space-y-4">
              {/* Detailed Cash Flow Statement */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Detailed Cash Flow Statement
                </h4>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Line Item</TableHead>
                        {data.reports.map((report, index) => (
                          <TableHead key={index}>
                            {getYear(report.fiscalDateEnding)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="font-medium bg-muted/50">
                        <TableCell>OPERATING ACTIVITIES</TableCell>
                        {data.reports.map((_, index) => (
                          <TableCell key={index}></TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Net Income</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.netIncome)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Depreciation & Amortization
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(
                              report.depreciationDepletionAndAmortization
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Change in Operating Assets
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.changeInOperatingAssets)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Change in Operating Liabilities
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(
                              report.changeInOperatingLiabilities
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Change in Inventory
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.changeInInventory)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Change in Receivables
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.changeInReceivables)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="bg-muted/30">
                        <TableCell className="pl-4 font-medium">
                          Total Operating Cash Flow
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index} className="font-medium">
                            {formatCurrency(report.operatingCashflow)}
                          </TableCell>
                        ))}
                      </TableRow>

                      <TableRow className="font-medium bg-muted/50">
                        <TableCell>INVESTING ACTIVITIES</TableCell>
                        {data.reports.map((_, index) => (
                          <TableCell key={index}></TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Capital Expenditures
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.capitalExpenditures)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="bg-muted/30">
                        <TableCell className="pl-4 font-medium">
                          Total Investing Cash Flow
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index} className="font-medium">
                            {formatCurrency(report.cashflowFromInvestment)}
                          </TableCell>
                        ))}
                      </TableRow>

                      <TableRow className="font-medium bg-muted/50">
                        <TableCell>FINANCING ACTIVITIES</TableCell>
                        {data.reports.map((_, index) => (
                          <TableCell key={index}></TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Dividend Payout</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.dividendPayout)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Proceeds from Long-Term Debt
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(
                              report.proceedsFromIssuanceOfLongTermDebtAndCapitalSecuritiesNet
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Proceeds from Repurchase of Equity
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(
                              report.proceedsFromRepurchaseOfEquity
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="bg-muted/30">
                        <TableCell className="pl-4 font-medium">
                          Total Financing Cash Flow
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index} className="font-medium">
                            {formatCurrency(report.cashflowFromFinancing)}
                          </TableCell>
                        ))}
                      </TableRow>

                      <TableRow className="font-medium bg-muted/50">
                        <TableCell>FREE CASH FLOW</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index} className="font-bold">
                            {formatCurrency(report.freeCashFlow)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ToolCard>
    </div>
  );
}
