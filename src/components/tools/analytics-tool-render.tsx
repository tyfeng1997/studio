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
  ScatterChart,
  Scatter,
  Cell,
  ZAxis,
  ReferenceLine,
} from "recharts";
import { Badge } from "@/components/ui/badge";

export function AdvancedAnalyticsResultRenderer({ data }) {
  const [activeTab, setActiveTab] = useState("summary");

  if (!data || !data.results) {
    return (
      <ToolCard title="Advanced Analytics">
        <div className="text-center text-muted-foreground text-sm py-2">
          No analytics data available
        </div>
      </ToolCard>
    );
  }

  // Extract metadata
  const metadata = data.metadata || {};
  const symbols = metadata.symbols ? metadata.symbols.split(",") : [];
  const dateRange =
    metadata.min_dt && metadata.max_dt
      ? `${metadata.min_dt} to ${metadata.max_dt}`
      : "N/A";
  const interval = metadata.interval || "DAILY";
  const ohlc = metadata.ohlc || "close";

  // Extract calculation results
  const results = data.results || {};
  const calculationTypes = Object.keys(results);

  // Format number as percentage
  const formatPercent = (value) => {
    if (value === null || value === undefined) return "N/A";
    return `${(value * 100).toFixed(2)}%`;
  };

  // Format number with precision
  const formatNumber = (value, precision = 4) => {
    if (value === null || value === undefined) return "N/A";
    return value.toFixed(precision);
  };

  // Generate color scale for correlation matrix
  const getCorrelationColor = (value) => {
    // Blue for strong negative, white for neutral, red for strong positive
    if (value === 1) return "#ef4444"; // Perfect positive correlation (diagonal)
    if (value > 0.5) return "#f87171";
    if (value > 0) return "#fca5a5";
    if (value === 0) return "#f3f4f6";
    if (value > -0.5) return "#93c5fd";
    return "#3b82f6";
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${
                typeof entry.value === "number"
                  ? formatNumber(entry.value)
                  : entry.value
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render correlation matrix
  const renderCorrelationMatrix = () => {
    if (!results.CORRELATION) return null;

    const correlationData = data.processedResults.CORRELATION;
    if (!correlationData || correlationData.length === 0) return null;

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              {correlationData[0].symbolLabels.map((symbol, index) => (
                <TableHead key={index}>{symbol}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {correlationData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell className="font-medium">{row.symbol}</TableCell>
                {row.values.map((value, colIndex) => (
                  <TableCell key={colIndex} className="text-center">
                    <span
                      className="px-2 py-1 rounded"
                      style={{ backgroundColor: getCorrelationColor(value) }}
                    >
                      {formatNumber(value)}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Render histogram charts
  const renderHistograms = () => {
    if (!results.HISTOGRAM) return null;

    const histogramData = data.processedResults.HISTOGRAM;
    if (!histogramData || histogramData.length === 0) return null;

    return (
      <div className="space-y-6">
        {histogramData.map((item, index) => (
          <div key={index}>
            <h4 className="text-sm font-medium mb-2">
              Return Distribution: {item.symbol}
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={item.histogramData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="binLabel" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} observations`,
                      "Count",
                    ]}
                    labelFormatter={(label) => `Range: ${label}`}
                  />
                  <Bar dataKey="count" fill="#4f46e5" name="Frequency" />
                  <ReferenceLine x={0} stroke="#000" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render simple metrics as bar charts
  const renderMetricBarChart = (metricType, title, description) => {
    if (!results[metricType]) return null;

    const chartData = data.processedResults[metricType];
    if (!chartData || chartData.length === 0) return null;

    // Determine if values are percentages or not
    const isPercentage = [
      "CUMULATIVE_RETURN",
      "MIN",
      "MAX",
      "MEAN",
      "MEDIAN",
    ].includes(metricType);

    return (
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium">{title}</h4>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="symbol" />
              <YAxis
                tickFormatter={(value) =>
                  isPercentage ? formatPercent(value) : formatNumber(value)
                }
              />
              <Tooltip
                formatter={(value) => [
                  isPercentage ? formatPercent(value) : formatNumber(value),
                  "",
                ]}
                labelFormatter={(label) => `Symbol: ${label}`}
              />
              <Bar dataKey="value" fill="#4f46e5" name={title}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      isPercentage && entry.value < 0 ? "#ef4444" : "#4f46e5"
                    }
                  />
                ))}
              </Bar>
              {isPercentage && <ReferenceLine y={0} stroke="#000" />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render volatility metrics as bar charts
  const renderVolatilityChart = (metricType, title, description) => {
    if (!results[metricType]) return null;

    const chartData = data.processedResults[metricType];
    if (!chartData || chartData.length === 0) return null;

    // For volatility metrics, we'll use a different color scale
    return (
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium">{title}</h4>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="symbol" />
              <YAxis />
              <Tooltip
                formatter={(value) => [formatNumber(value), title]}
                labelFormatter={(label) => `Symbol: ${label}`}
              />
              <Bar dataKey="value" fill="#f59e0b" name={title} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Generate tabs based on available calculations
  const generateTabs = () => {
    const tabs = [{ id: "summary", label: "Summary" }];

    if (results.CORRELATION || results.COVARIANCE) {
      tabs.push({ id: "correlation", label: "Correlation" });
    }

    if (results.VARIANCE || results.STDDEV || results.MAX_DRAWDOWN) {
      tabs.push({ id: "volatility", label: "Volatility" });
    }

    if (
      results.MIN ||
      results.MAX ||
      results.MEAN ||
      results.MEDIAN ||
      results.CUMULATIVE_RETURN
    ) {
      tabs.push({ id: "returns", label: "Returns" });
    }

    if (results.HISTOGRAM) {
      tabs.push({ id: "distribution", label: "Distribution" });
    }

    return tabs;
  };

  const tabs = generateTabs();

  return (
    <div className="space-y-4">
      <ToolCard title="Advanced Analytics">
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline">{`Symbols: ${symbols.join(", ")}`}</Badge>
            <Badge variant="outline">{`Range: ${dateRange}`}</Badge>
            <Badge variant="outline">{`Interval: ${interval}`}</Badge>
            <Badge variant="outline">{`OHLC: ${ohlc}`}</Badge>
          </div>
        </div>

        <Tabs defaultValue="summary" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="summary">
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.MEAN && (
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm font-medium">
                        Average Daily Return
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <Table>
                        <TableBody>
                          {symbols.map((symbol, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {symbol}
                              </TableCell>
                              <TableCell
                                className={
                                  results.MEAN[symbol] >= 0
                                    ? "text-green-500"
                                    : "text-red-500"
                                }
                              >
                                {formatPercent(results.MEAN[symbol])}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {results.STDDEV && (
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm font-medium">
                        Volatility (Std. Dev.)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <Table>
                        <TableBody>
                          {symbols.map((symbol, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {symbol}
                              </TableCell>
                              <TableCell>
                                {formatPercent(results.STDDEV[symbol])}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {results.CUMULATIVE_RETURN && (
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm font-medium">
                        Total Return
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <Table>
                        <TableBody>
                          {symbols.map((symbol, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {symbol}
                              </TableCell>
                              <TableCell
                                className={
                                  results.CUMULATIVE_RETURN[symbol] >= 0
                                    ? "text-green-500"
                                    : "text-red-500"
                                }
                              >
                                {formatPercent(
                                  results.CUMULATIVE_RETURN[symbol]
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Correlation Matrix */}
              {results.CORRELATION && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Correlation Matrix</h4>
                  {renderCorrelationMatrix()}
                </div>
              )}

              {/* Performance Chart */}
              {results.MEAN && results.STDDEV && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Risk/Return Profile</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid />
                        <XAxis
                          type="number"
                          dataKey="volatility"
                          name="Volatility"
                          domain={["auto", "auto"]}
                          label={{
                            value: "Volatility (Std Dev)",
                            position: "bottom",
                          }}
                        />
                        <YAxis
                          type="number"
                          dataKey="return"
                          name="Return"
                          domain={["auto", "auto"]}
                          label={{
                            value: "Average Return",
                            angle: -90,
                            position: "left",
                          }}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          formatter={(value) => formatPercent(value)}
                        />
                        <Legend />
                        <ReferenceLine x={0} stroke="#666" />
                        <ReferenceLine y={0} stroke="#666" />
                        <Scatter
                          name="Symbols"
                          data={symbols.map((symbol) => ({
                            symbol,
                            volatility: results.STDDEV[symbol],
                            return: results.MEAN[symbol],
                          }))}
                          fill="#4f46e5"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="correlation">
            <div className="space-y-6">
              {results.CORRELATION && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Correlation Matrix</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Correlation shows how the returns of different assets move
                    in relation to each other. Values close to 1 indicate strong
                    positive correlation, values close to -1 indicate strong
                    negative correlation, and values close to 0 indicate little
                    to no correlation.
                  </p>
                  {renderCorrelationMatrix()}
                </div>
              )}

              {results.COVARIANCE && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Covariance Matrix</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Covariance measures the directional relationship between the
                    returns of two assets. A positive value indicates that
                    returns move together, and a negative value indicates that
                    returns move inversely.
                  </p>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          {data.processedResults.COVARIANCE[0].symbolLabels.map(
                            (symbol, index) => (
                              <TableHead key={index}>{symbol}</TableHead>
                            )
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.processedResults.COVARIANCE.map(
                          (row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              <TableCell className="font-medium">
                                {row.symbol}
                              </TableCell>
                              {row.values.map((value, colIndex) => (
                                <TableCell key={colIndex}>
                                  {formatNumber(value)}
                                </TableCell>
                              ))}
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {results.AUTOCORRELATION && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Autocorrelation</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Autocorrelation measures the relationship between a
                    variable's current value and its past values. High
                    autocorrelation may indicate momentum in price movements.
                  </p>
                  {renderMetricBarChart("AUTOCORRELATION", "Autocorrelation")}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="volatility">
            <div className="space-y-6">
              {results.STDDEV &&
                renderVolatilityChart(
                  "STDDEV",
                  "Standard Deviation",
                  "Standard deviation measures the dispersion of returns around the mean, indicating volatility."
                )}

              {results.VARIANCE &&
                renderVolatilityChart(
                  "VARIANCE",
                  "Variance",
                  "Variance is the square of standard deviation, measuring the spread of returns."
                )}

              {results.MAX_DRAWDOWN &&
                renderVolatilityChart(
                  "MAX_DRAWDOWN",
                  "Maximum Drawdown",
                  "Maximum drawdown measures the largest peak-to-trough decline, indicating downside risk."
                )}

              {/* Volatility Comparison Table */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  Volatility Metrics Comparison
                </h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        {results.STDDEV && (
                          <TableHead>Standard Deviation</TableHead>
                        )}
                        {results.VARIANCE && <TableHead>Variance</TableHead>}
                        {results.MAX_DRAWDOWN && (
                          <TableHead>Max Drawdown</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {symbols.map((symbol, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {symbol}
                          </TableCell>
                          {results.STDDEV && (
                            <TableCell>
                              {formatPercent(results.STDDEV[symbol])}
                            </TableCell>
                          )}
                          {results.VARIANCE && (
                            <TableCell>
                              {formatNumber(results.VARIANCE[symbol])}
                            </TableCell>
                          )}
                          {results.MAX_DRAWDOWN && (
                            <TableCell>
                              {formatPercent(results.MAX_DRAWDOWN[symbol])}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="returns">
            <div className="space-y-6">
              {results.MEAN &&
                renderMetricBarChart(
                  "MEAN",
                  "Average Return",
                  "The arithmetic mean of daily returns over the period."
                )}

              {results.MEDIAN &&
                renderMetricBarChart(
                  "MEDIAN",
                  "Median Return",
                  "The median (middle value) of all returns, less affected by outliers than the mean."
                )}

              {results.MIN &&
                renderMetricBarChart(
                  "MIN",
                  "Minimum Return",
                  "The worst single-period return during the timeframe."
                )}

              {results.MAX &&
                renderMetricBarChart(
                  "MAX",
                  "Maximum Return",
                  "The best single-period return during the timeframe."
                )}

              {results.CUMULATIVE_RETURN &&
                renderMetricBarChart(
                  "CUMULATIVE_RETURN",
                  "Total Return",
                  "The total return over the entire period."
                )}

              {/* Returns Comparison Table */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  Return Metrics Comparison
                </h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        {results.MEAN && <TableHead>Average</TableHead>}
                        {results.MEDIAN && <TableHead>Median</TableHead>}
                        {results.MIN && <TableHead>Minimum</TableHead>}
                        {results.MAX && <TableHead>Maximum</TableHead>}
                        {results.CUMULATIVE_RETURN && (
                          <TableHead>Total Return</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {symbols.map((symbol, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {symbol}
                          </TableCell>
                          {results.MEAN && (
                            <TableCell
                              className={
                                results.MEAN[symbol] >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            >
                              {formatPercent(results.MEAN[symbol])}
                            </TableCell>
                          )}
                          {results.MEDIAN && (
                            <TableCell
                              className={
                                results.MEDIAN[symbol] >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            >
                              {formatPercent(results.MEDIAN[symbol])}
                            </TableCell>
                          )}
                          {results.MIN && (
                            <TableCell className="text-red-500">
                              {formatPercent(results.MIN[symbol])}
                            </TableCell>
                          )}
                          {results.MAX && (
                            <TableCell className="text-green-500">
                              {formatPercent(results.MAX[symbol])}
                            </TableCell>
                          )}
                          {results.CUMULATIVE_RETURN && (
                            <TableCell
                              className={
                                results.CUMULATIVE_RETURN[symbol] >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            >
                              {formatPercent(results.CUMULATIVE_RETURN[symbol])}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="distribution">
            <div className="space-y-6">
              {/* Histogram explanation */}
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Histograms show the distribution of returns, helping to
                  visualize volatility, skewness, and outliers. A normal
                  distribution would appear as a symmetrical bell curve, while
                  skewed distributions indicate asymmetric return patterns.
                </p>
              </div>

              {/* Histogram Charts */}
              {renderHistograms()}
            </div>
          </TabsContent>
        </Tabs>
      </ToolCard>
    </div>
  );
}
