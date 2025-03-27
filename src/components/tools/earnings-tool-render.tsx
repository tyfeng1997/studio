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
  Cell,
  PieChart,
  Pie,
  ReferenceLine,
} from "recharts";
import { CheckCircle, XCircle } from "lucide-react";

export function EarningsResultRenderer({ data }) {
  const [activeTab, setActiveTab] = useState("summary");

  if (!data) {
    return (
      <ToolCard title="Earnings Data">
        <div className="text-center text-muted-foreground text-sm py-2">
          No earnings data available
        </div>
      </ToolCard>
    );
  }

  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

  // Beat/Miss indicator
  const BeatMissIndicator = ({ result }) => {
    if (result === "Beat") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (result === "Missed") {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}:{" "}
              {entry.name.includes("Growth")
                ? `${entry.value}%`
                : formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for the surprise chart
  const SurpriseTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name === "Surprise"
                ? `Surprise: ${formatCurrency(entry.value)}`
                : entry.name === "Surprise%"
                ? `Surprise: ${entry.value}%`
                : `${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare data for annual EPS chart
  const annualEPSData = data.annualMetrics?.reverse() || [];

  // Prepare data for quarterly EPS chart
  const quarterlyEPSData = data.quarterlyMetrics?.reverse() || [];

  // Prepare data for beat/miss pie chart
  const beatMissData = [
    { name: "Beat", value: data.statistics.beatCount, color: "#10b981" },
    { name: "Missed", value: data.statistics.missCount, color: "#ef4444" },
  ];

  // Prepare data for quarterly surprise chart
  const surpriseData =
    data.quarterlyMetrics
      ?.map((metric) => ({
        quarter: metric.fiscalQuarter,
        "Reported EPS": metric.eps,
        "Estimated EPS": metric.estimatedEPS,
        Surprise: metric.surprise,
        "Surprise%": metric.surprisePercentage,
        beatMissed: metric.beatMissed,
      }))
      .reverse() || [];

  // Colors for charts
  const BEAT_MISS_COLORS = ["#10b981", "#ef4444"];

  return (
    <div className="space-y-4">
      <ToolCard title={`EPS (Earnings Per Share) for ${data.symbol}`}>
        <Tabs defaultValue="summary" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            <TabsTrigger value="annual">Annual</TabsTrigger>
            <TabsTrigger value="surprise">Analyst Surprise</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="space-y-4">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Latest Annual EPS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatCurrency(data.statistics.latestAnnualEPS)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Latest Quarterly EPS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatCurrency(data.statistics.latestQuarterlyEPS)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Beat Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatPercent(data.statistics.beatRate)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">
                      Avg Surprise %
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">
                      {formatPercent(data.statistics.avgSurprisePercentage)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Annual EPS Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">Annual EPS Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={annualEPSData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fiscalYear" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[-30, 30]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="eps"
                        fill="#4f46e5"
                        name="EPS"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="epsGrowth"
                        stroke="#10b981"
                        name="EPS Growth"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <ReferenceLine yAxisId="right" y={0} stroke="#666" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quarterly EPS Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Quarterly EPS Trend
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={quarterlyEPSData.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fiscalQuarter" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[-30, 30]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="eps"
                        fill="#4f46e5"
                        name="EPS"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="epsYoYGrowth"
                        stroke="#10b981"
                        name="YoY Growth"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <ReferenceLine yAxisId="right" y={0} stroke="#666" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Beat/Miss Pie Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Analyst Estimates: Beat vs Miss
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={beatMissData}
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
                          {beatMissData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                BEAT_MISS_COLORS[
                                  index % BEAT_MISS_COLORS.length
                                ]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Recent Performance vs Expectations
                  </h4>
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quarter</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Reported</TableHead>
                          <TableHead>Estimated</TableHead>
                          <TableHead>Surprise %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.quarterlyMetrics
                          .slice(0, 8)
                          .map((metric, index) => (
                            <TableRow key={index}>
                              <TableCell>{metric.fiscalQuarter}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <BeatMissIndicator
                                    result={metric.beatMissed}
                                  />
                                  <span className="ml-1">
                                    {metric.beatMissed || "N/A"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatCurrency(metric.eps)}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(metric.estimatedEPS)}
                              </TableCell>
                              <TableCell>
                                {metric.surprisePercentage !== null
                                  ? `${metric.surprisePercentage}%`
                                  : "N/A"}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quarterly">
            <div className="space-y-6">
              {/* Quarterly EPS Chart - All Available Data */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Quarterly EPS (Last 3 Years)
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={quarterlyEPSData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fiscalQuarter" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="eps" fill="#4f46e5" name="EPS">
                        {quarterlyEPSData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.beatMissed === "Beat"
                                ? "#10b981"
                                : entry.beatMissed === "Missed"
                                ? "#ef4444"
                                : "#4f46e5"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quarter-over-Quarter Growth */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Quarter-over-Quarter EPS Growth
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={quarterlyEPSData.filter(
                        (d) => d.epsQoQGrowth !== null
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fiscalQuarter" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, "QoQ Growth"]}
                      />
                      <Legend />
                      <Bar
                        dataKey="epsQoQGrowth"
                        fill="#4f46e5"
                        name="QoQ Growth"
                      >
                        {quarterlyEPSData
                          .filter((d) => d.epsQoQGrowth !== null)
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.epsQoQGrowth >= 0 ? "#10b981" : "#ef4444"
                              }
                            />
                          ))}
                      </Bar>
                      <ReferenceLine y={0} stroke="#666" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Year-over-Year Growth */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Year-over-Year EPS Growth
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={quarterlyEPSData.filter(
                        (d) => d.epsYoYGrowth !== null
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fiscalQuarter" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, "YoY Growth"]}
                      />
                      <Legend />
                      <Bar
                        dataKey="epsYoYGrowth"
                        fill="#4f46e5"
                        name="YoY Growth"
                      >
                        {quarterlyEPSData
                          .filter((d) => d.epsYoYGrowth !== null)
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.epsYoYGrowth >= 0 ? "#10b981" : "#ef4444"
                              }
                            />
                          ))}
                      </Bar>
                      <ReferenceLine y={0} stroke="#666" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quarterly Earnings Table */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Quarterly Earnings Data
                </h4>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quarter</TableHead>
                        <TableHead>Report Date</TableHead>
                        <TableHead>EPS</TableHead>
                        <TableHead>QoQ Growth</TableHead>
                        <TableHead>YoY Growth</TableHead>
                        <TableHead>Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.quarterlyMetrics.map((metric, index) => (
                        <TableRow key={index}>
                          <TableCell>{metric.fiscalQuarter}</TableCell>
                          <TableCell>
                            {formatDate(metric.reportedDate)}
                          </TableCell>
                          <TableCell>{formatCurrency(metric.eps)}</TableCell>
                          <TableCell>
                            {metric.epsQoQGrowth !== null
                              ? formatChange(metric.epsQoQGrowth)
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {metric.epsYoYGrowth !== null
                              ? formatChange(metric.epsYoYGrowth)
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <BeatMissIndicator result={metric.beatMissed} />
                              <span className="ml-1">
                                {metric.beatMissed || "N/A"}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="annual">
            <div className="space-y-6">
              {/* Annual EPS Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">Annual EPS Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={annualEPSData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fiscalYear" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="eps" fill="#4f46e5" name="EPS" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Annual EPS Growth Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">Annual EPS Growth</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={annualEPSData.filter((d) => d.epsGrowth !== null)}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fiscalYear" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Annual Growth"]}
                      />
                      <Legend />
                      <Bar
                        dataKey="epsGrowth"
                        fill="#4f46e5"
                        name="Annual Growth"
                      >
                        {annualEPSData
                          .filter((d) => d.epsGrowth !== null)
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.epsGrowth >= 0 ? "#10b981" : "#ef4444"
                              }
                            />
                          ))}
                      </Bar>
                      <ReferenceLine y={0} stroke="#666" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Annual Earnings Table */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Annual Earnings Data
                </h4>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fiscal Year</TableHead>
                        <TableHead>EPS</TableHead>
                        <TableHead>Annual Growth</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.annualMetrics.map((metric, index) => (
                        <TableRow key={index}>
                          <TableCell>{metric.fiscalYear}</TableCell>
                          <TableCell>{formatCurrency(metric.eps)}</TableCell>
                          <TableCell>
                            {metric.epsGrowth !== null
                              ? formatChange(metric.epsGrowth)
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="surprise">
            <div className="space-y-6">
              {/* Actual vs Expected EPS */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Reported vs Estimated EPS
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={surpriseData.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="Reported EPS"
                        fill="#10b981"
                        name="Reported EPS"
                      />
                      <Bar
                        dataKey="Estimated EPS"
                        fill="#4f46e5"
                        name="Estimated EPS"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Earnings Surprise */}
              <div>
                <h4 className="text-sm font-medium mb-2">Earnings Surprise</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={surpriseData.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis />
                      <Tooltip content={<SurpriseTooltip />} />
                      <Legend />
                      <Bar dataKey="Surprise" fill="#4f46e5" name="Surprise">
                        {surpriseData.slice(0, 8).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.Surprise >= 0 ? "#10b981" : "#ef4444"}
                          />
                        ))}
                      </Bar>
                      <ReferenceLine y={0} stroke="#666" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Surprise Percentage */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Surprise Percentage
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={surpriseData.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Surprise %"]}
                      />
                      <Legend />
                      <Bar dataKey="Surprise%" fill="#4f46e5" name="Surprise %">
                        {surpriseData.slice(0, 8).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry["Surprise%"] >= 0 ? "#10b981" : "#ef4444"
                            }
                          />
                        ))}
                      </Bar>
                      <ReferenceLine y={0} stroke="#666" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Surprise Detail Table */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Earnings Surprise Details
                </h4>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quarter</TableHead>
                        <TableHead>Report Date</TableHead>
                        <TableHead>Reported</TableHead>
                        <TableHead>Estimated</TableHead>
                        <TableHead>Surprise</TableHead>
                        <TableHead>Surprise %</TableHead>
                        <TableHead>Report Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.quarterlyMetrics.map((metric, index) => (
                        <TableRow key={index}>
                          <TableCell>{metric.fiscalQuarter}</TableCell>
                          <TableCell>
                            {formatDate(metric.reportedDate)}
                          </TableCell>
                          <TableCell>{formatCurrency(metric.eps)}</TableCell>
                          <TableCell>
                            {formatCurrency(metric.estimatedEPS)}
                          </TableCell>
                          <TableCell>
                            {metric.surprise !== null
                              ? formatCurrency(metric.surprise)
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {metric.surprisePercentage !== null
                              ? `${metric.surprisePercentage}%`
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {metric.reportTime === "post-market"
                              ? "After Close"
                              : metric.reportTime === "pre-market"
                              ? "Before Open"
                              : metric.reportTime || "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
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
