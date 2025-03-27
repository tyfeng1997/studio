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
import { Badge } from "@/components/ui/badge";
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
} from "recharts";

export function IncomeStatementResultRenderer({ data }) {
  const [activeTab, setActiveTab] = useState("summary");

  if (!data || !data.reports || !Array.isArray(data.reports)) {
    return (
      <ToolCard title="Income Statement Data">
        <div className="text-center text-muted-foreground text-sm py-2">
          No income statement data available
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

  // Format percentage
  const formatPercent = (value) => {
    if (value === null || value === undefined) return "N/A";
    return `${value}%`;
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

  // Prepare data for the charts
  const chartData = data.keyMetrics
    .map((metric) => ({
      name: getYear(metric.period),
      Revenue: metric.revenue,
      "Gross Profit": metric.grossProfit,
      "Operating Income": metric.operatingIncome,
      "Net Income": metric.netIncome,
    }))
    .reverse(); // Reverse to show oldest to newest

  // Prepare data for the margin chart
  const marginChartData = data.keyMetrics
    .map((metric) => ({
      name: getYear(metric.period),
      "Gross Margin": parseFloat(metric.grossMargin),
      "Operating Margin": parseFloat(metric.operatingMargin),
      "Net Margin": parseFloat(metric.netMargin),
    }))
    .reverse(); // Reverse to show oldest to newest

  return (
    <div className="space-y-4">
      <ToolCard title={`Income Statement for ${data.symbol} (${data.period})`}>
        <Tabs defaultValue="summary" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="space-y-4">
              {/* Key Financial Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatMillions(data.keyMetrics[0].revenue)}
                    </div>
                    {data.keyMetrics[0].revenueGrowth && (
                      <div className="text-xs">
                        YoY: {formatChange(data.keyMetrics[0].revenueGrowth)}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Net Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatMillions(data.keyMetrics[0].netIncome)}
                    </div>
                    {data.keyMetrics[0].incomeGrowth && (
                      <div className="text-xs">
                        YoY: {formatChange(data.keyMetrics[0].incomeGrowth)}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Gross Margin
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatPercent(data.keyMetrics[0].grossMargin)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Net Margin
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatPercent(data.keyMetrics[0].netMargin)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Table */}
              <div>
                <h4 className="text-sm font-medium mb-2">Financial Summary</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Gross Profit</TableHead>
                      <TableHead>Operating Income</TableHead>
                      <TableHead>Net Income</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.reports.map((report, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {formatDate(report.fiscalDateEnding)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(report.totalRevenue)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(report.grossProfit)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(report.operatingIncome)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(report.netIncome)}
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
              {/* Financial Metrics Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Financial Performance
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Revenue" fill="#4f46e5" />
                      <Bar dataKey="Gross Profit" fill="#0ea5e9" />
                      <Bar dataKey="Operating Income" fill="#10b981" />
                      <Bar dataKey="Net Income" fill="#f59e0b" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Margin Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Profitability Margins
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={marginChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, ""]}
                        labelFormatter={(label) => `Year: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Gross Margin"
                        stroke="#4f46e5"
                      />
                      <Line
                        type="monotone"
                        dataKey="Operating Margin"
                        stroke="#10b981"
                      />
                      <Line
                        type="monotone"
                        dataKey="Net Margin"
                        stroke="#f59e0b"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key Financial Ratios */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Financial Ratios Over Time
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Gross Margin</TableHead>
                      <TableHead>Operating Margin</TableHead>
                      <TableHead>Net Margin</TableHead>
                      {data.keyMetrics[0].revenueGrowth && (
                        <TableHead>Revenue Growth</TableHead>
                      )}
                      {data.keyMetrics[0].incomeGrowth && (
                        <TableHead>Income Growth</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.keyMetrics.map((metric, index) => (
                      <TableRow key={index}>
                        <TableCell>{getYear(metric.period)}</TableCell>
                        <TableCell>
                          {formatPercent(metric.grossMargin)}
                        </TableCell>
                        <TableCell>
                          {formatPercent(metric.operatingMargin)}
                        </TableCell>
                        <TableCell>{formatPercent(metric.netMargin)}</TableCell>
                        {metric.revenueGrowth && (
                          <TableCell>
                            {formatChange(metric.revenueGrowth)}
                          </TableCell>
                        )}
                        {metric.incomeGrowth && (
                          <TableCell>
                            {formatChange(metric.incomeGrowth)}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="space-y-4">
              {/* Detailed Income Statement */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Detailed Income Statement
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
                      <TableRow>
                        <TableCell className="font-medium">
                          Total Revenue
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.totalRevenue)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Cost of Revenue
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.costOfRevenue)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Gross Profit
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.grossProfit)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          R&D Expenses
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.researchAndDevelopment)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          SG&A Expenses
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(
                              report.sellingGeneralAndAdministrative
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Operating Expenses
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.operatingExpenses)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Operating Income
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.operatingIncome)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Interest Expense
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.interestExpense)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Income Before Tax
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.incomeBeforeTax)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Income Tax Expense
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.incomeTaxExpense)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Net Income
                        </TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.netIncome)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">EBITDA</TableCell>
                        {data.reports.map((report, index) => (
                          <TableCell key={index}>
                            {formatCurrency(report.ebitda)}
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
