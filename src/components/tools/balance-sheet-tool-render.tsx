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
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function BalanceSheetResultRenderer({ data }) {
  const [activeTab, setActiveTab] = useState("summary");

  if (!data || !data.reports || !Array.isArray(data.reports)) {
    return (
      <ToolCard title="Balance Sheet Data">
        <div className="text-center text-muted-foreground text-sm py-2">
          No balance sheet data available
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

  // Prepare data for the financial structure chart
  const structureChartData = data.keyMetrics
    .map((metric) => ({
      name: getYear(metric.period),
      Assets: metric.totalAssets,
      Liabilities: metric.totalLiabilities,
      Equity: metric.totalEquity,
    }))
    .reverse(); // Reverse to show oldest to newest

  // Prepare data for the assets breakdown chart
  const assetsChartData = data.keyMetrics
    .map((metric) => ({
      name: getYear(metric.period),
      "Current Assets": metric.currentAssets,
      "Non-Current Assets": metric.nonCurrentAssets,
    }))
    .reverse();

  // Prepare data for the liabilities breakdown chart
  const liabilitiesChartData = data.keyMetrics
    .map((metric) => ({
      name: getYear(metric.period),
      "Current Liabilities": metric.currentLiabilities,
      "Non-Current Liabilities": metric.nonCurrentLiabilities,
    }))
    .reverse();

  // Prepare data for the financial ratios chart
  const ratiosChartData = data.keyMetrics
    .map((metric) => ({
      name: getYear(metric.period),
      "Current Ratio": parseFloat(metric.currentRatio || 0),
      "Debt to Equity": parseFloat(metric.debtToEquityRatio || 0),
      "Cash Ratio": parseFloat(metric.cashRatio || 0),
    }))
    .reverse();

  // Prepare data for the composition pie chart (most recent period)
  const mostRecent = data.keyMetrics[0];
  const assetCompositionData = [
    { name: "Current Assets", value: mostRecent.currentAssets },
    { name: "Non-Current Assets", value: mostRecent.nonCurrentAssets },
  ];

  const liabilityEquityCompositionData = [
    { name: "Current Liabilities", value: mostRecent.currentLiabilities },
    {
      name: "Non-Current Liabilities",
      value: mostRecent.nonCurrentLiabilities,
    },
    { name: "Shareholder Equity", value: mostRecent.totalEquity },
  ];

  // Colors for pie charts
  const ASSET_COLORS = ["#4f46e5", "#0ea5e9"];
  const LIABILITY_EQUITY_COLORS = ["#f59e0b", "#10b981", "#3b82f6"];

  return (
    <div className="space-y-4">
      <ToolCard title={`Balance Sheet for ${data.symbol} (${data.period})`}>
        <Tabs defaultValue="summary" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="ratios">Financial Ratios</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="space-y-4">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Total Assets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatMillions(data.keyMetrics[0].totalAssets)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Total Liabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatMillions(data.keyMetrics[0].totalLiabilities)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Shareholder Equity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatMillions(data.keyMetrics[0].totalEquity)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Cash & Equivalents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatMillions(data.keyMetrics[0].cash)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Structure */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Financial Structure
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={structureChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="Assets"
                        fill="#4f46e5"
                        name="Total Assets"
                      />
                      <Bar
                        dataKey="Liabilities"
                        fill="#f59e0b"
                        name="Total Liabilities"
                      />
                      <Bar
                        dataKey="Equity"
                        fill="#10b981"
                        name="Shareholder Equity"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Balance Sheet Composition (Pie Charts) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Asset Composition (Latest Period)
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={assetCompositionData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {assetCompositionData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={ASSET_COLORS[index % ASSET_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatMillions(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Liabilities & Equity (Latest Period)
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={liabilityEquityCompositionData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {liabilityEquityCompositionData.map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  LIABILITY_EQUITY_COLORS[
                                    index % LIABILITY_EQUITY_COLORS.length
                                  ]
                                }
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip formatter={(value) => formatMillions(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Summary Table */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Balance Sheet Summary
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Total Assets</TableHead>
                      <TableHead>Total Liabilities</TableHead>
                      <TableHead>Shareholder Equity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.reports.map((report, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {formatDate(report.fiscalDateEnding)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(report.totalAssets)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(report.totalLiabilities)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(report.totalShareholderEquity)}
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
              {/* Assets Breakdown Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">Assets Breakdown</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assetsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Current Assets" fill="#4f46e5" />
                      <Bar dataKey="Non-Current Assets" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Liabilities Breakdown Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Liabilities Breakdown
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liabilitiesChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Current Liabilities" fill="#f59e0b" />
                      <Bar dataKey="Non-Current Liabilities" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Assets & Liabilities Table */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Assets & Liabilities Breakdown
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Current Assets</TableHead>
                      <TableHead>Non-Current Assets</TableHead>
                      <TableHead>Current Liabilities</TableHead>
                      <TableHead>Non-Current Liabilities</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.reports.map((report, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {formatDate(report.fiscalDateEnding)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(report.totalCurrentAssets)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(report.totalNonCurrentAssets)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(report.totalCurrentLiabilities)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(report.totalNonCurrentLiabilities)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ratios">
            <div className="space-y-6">
              {/* Financial Ratios Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Current Ratio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatRatio(data.keyMetrics[0].currentRatio)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Debt to Equity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatRatio(data.keyMetrics[0].debtToEquityRatio)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Debt to Assets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatRatio(data.keyMetrics[0].debtToAssetsRatio)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Cash Ratio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatRatio(data.keyMetrics[0].cashRatio)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Equity Ratio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatRatio(data.keyMetrics[0].equityRatio)}
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
                    <LineChart data={ratiosChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<RatioTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Current Ratio"
                        stroke="#4f46e5"
                      />
                      <Line
                        type="monotone"
                        dataKey="Debt to Equity"
                        stroke="#f59e0b"
                      />
                      <Line
                        type="monotone"
                        dataKey="Cash Ratio"
                        stroke="#10b981"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Financial Ratios Table */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Financial Ratios Explained
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
                      <TableCell>Current Ratio</TableCell>
                      <TableCell>
                        Current Assets / Current Liabilities
                      </TableCell>
                      <TableCell>
                        Measures a company's ability to pay short-term
                        obligations. A ratio of 2 or more is generally
                        considered good.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Debt to Equity</TableCell>
                      <TableCell>
                        Total Liabilities / Shareholder Equity
                      </TableCell>
                      <TableCell>
                        Shows the proportion of equity and debt used to finance
                        a company's assets. A high ratio indicates higher risk.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Debt to Assets</TableCell>
                      <TableCell>Total Liabilities / Total Assets</TableCell>
                      <TableCell>
                        Indicates the percentage of assets that are financed
                        with debt. Lower is generally better.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Cash Ratio</TableCell>
                      <TableCell>Cash / Current Liabilities</TableCell>
                      <TableCell>
                        Indicates a company's ability to pay off short-term debt
                        with cash. A ratio of 1 means exact coverage.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Equity Ratio</TableCell>
                      <TableCell>Shareholder Equity / Total Assets</TableCell>
                      <TableCell>
                        Measures the proportion of total assets financed by
                        shareholders. Higher values indicate financial
                        stability.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="space-y-4">
              {/* Detailed Balance Sheet */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Detailed Balance Sheet
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
                        <TableCell>ASSETS</TableCell>
                        {data.reports.map((_, index) => (
                          <TableCell key={index}></TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Cash & Cash Equivalents
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(
                              report.cashAndCashEquivalentsAtCarryingValue
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Short-Term Investments
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.shortTermInvestments)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Inventory</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.inventory)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Net Receivables</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.currentNetReceivables)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Other Current Assets
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.otherCurrentAssets)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="bg-muted/30">
                        <TableCell className="pl-4">
                          Total Current Assets
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index} className="font-medium">
                            {formatCurrency(report.totalCurrentAssets)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Property, Plant & Equipment
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.propertyPlantEquipment)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Goodwill</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.goodwill)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Intangible Assets
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(
                              report.intangibleAssetsExcludingGoodwill
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Long-Term Investments
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.longTermInvestments)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="bg-muted/30">
                        <TableCell className="pl-4">
                          Total Non-Current Assets
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index} className="font-medium">
                            {formatCurrency(report.totalNonCurrentAssets)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="font-medium bg-muted/50">
                        <TableCell>TOTAL ASSETS</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index} className="font-bold">
                            {formatCurrency(report.totalAssets)}
                          </TableCell>
                        ))}
                      </TableRow>

                      <TableRow className="font-medium bg-muted/50">
                        <TableCell>LIABILITIES</TableCell>
                        {data.reports.map((_, index) => (
                          <TableCell key={index}></TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Accounts Payable</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.currentAccountsPayable)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Short-Term Debt</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.shortTermDebt)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Deferred Revenue</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.deferredRevenue)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Other Current Liabilities
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.otherCurrentLiabilities)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="bg-muted/30">
                        <TableCell className="pl-4">
                          Total Current Liabilities
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index} className="font-medium">
                            {formatCurrency(report.totalCurrentLiabilities)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Long-Term Debt</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.longTermDebtNoncurrent)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Capital Lease Obligations
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.capitalLeaseObligations)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Other Non-Current Liabilities
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.otherNonCurrentLiabilities)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="bg-muted/30">
                        <TableCell className="pl-4">
                          Total Non-Current Liabilities
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index} className="font-medium">
                            {formatCurrency(report.totalNonCurrentLiabilities)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="font-medium bg-muted/50">
                        <TableCell>TOTAL LIABILITIES</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index} className="font-bold">
                            {formatCurrency(report.totalLiabilities)}
                          </TableCell>
                        ))}
                      </TableRow>

                      <TableRow className="font-medium bg-muted/50">
                        <TableCell>SHAREHOLDERS' EQUITY</TableCell>
                        {data.reports.map((_, index) => (
                          <TableCell key={index}></TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Common Stock</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.commonStock)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">
                          Retained Earnings
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.retainedEarnings)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Treasury Stock</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.treasuryStock)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="font-medium bg-muted/50">
                        <TableCell>TOTAL SHAREHOLDERS' EQUITY</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index} className="font-bold">
                            {formatCurrency(report.totalShareholderEquity)}
                          </TableCell>
                        ))}
                      </TableRow>

                      <TableRow className="font-medium bg-muted/50">
                        <TableCell>TOTAL LIABILITIES & EQUITY</TableCell>
                        {data.reports.map((report, index) => {
                          const totalLiabilitiesAndEquity =
                            report.totalLiabilities !== "None" &&
                            report.totalShareholderEquity !== "None"
                              ? Number(report.totalLiabilities) +
                                Number(report.totalShareholderEquity)
                              : "None";
                          return (
                            <TableCell key={index} className="font-bold">
                              {formatCurrency(totalLiabilitiesAndEquity)}
                            </TableCell>
                          );
                        })}
                      </TableRow>

                      <TableRow>
                        <TableCell className="pl-6">
                          Common Shares Outstanding
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {report.commonStockSharesOutstanding !== "None"
                              ? Number(
                                  report.commonStockSharesOutstanding
                                ).toLocaleString()
                              : "N/A"}
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
