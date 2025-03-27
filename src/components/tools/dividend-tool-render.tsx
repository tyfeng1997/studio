"use client";
import React from "react";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function DividendResultRenderer({ data }) {
  if (!data || !data.dividends || !Array.isArray(data.dividends)) {
    return (
      <ToolCard title="Dividend Data">
        <div className="text-center text-muted-foreground text-sm py-2">
          No dividend data available
        </div>
      </ToolCard>
    );
  }

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
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

  // Create year-by-year chart data
  const chartData = [...data.stats.yearlyTotals].sort((a, b) =>
    a.year.localeCompare(b.year)
  );

  // Get future dividends (those with dates in the future)
  const today = new Date();
  const futureDividends = data.dividends.filter((div) => {
    if (div.payment_date && div.payment_date !== "None") {
      return new Date(div.payment_date) > today;
    }
    if (div.ex_dividend_date && div.ex_dividend_date !== "None") {
      return new Date(div.ex_dividend_date) > today;
    }
    return false;
  });

  return (
    <div className="space-y-4">
      <ToolCard title={`Dividend Data for ${data.symbol}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">
                Total Payouts
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">
                {data.stats.totalPayouts}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">
                {formatCurrency(data.stats.totalAmount)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">
                Average Dividend
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">
                {formatCurrency(data.stats.averageAmount)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">
                Latest Dividend
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">
                {data.dividends.length > 0
                  ? formatCurrency(data.dividends[0].amount)
                  : "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dividend amount by year chart */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Yearly Dividend Totals</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(value),
                    "Total Dividends",
                  ]}
                  labelFormatter={(label) => `Year: ${label}`}
                />
                <Bar dataKey="total" fill="#3b82f6" name="Total Dividends" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Future dividends section */}
        {futureDividends.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Upcoming Dividends</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ex-Dividend Date</TableHead>
                  <TableHead>Record Date</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {futureDividends.map((dividend, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {formatDate(dividend.ex_dividend_date)}
                    </TableCell>
                    <TableCell>{formatDate(dividend.record_date)}</TableCell>
                    <TableCell>{formatDate(dividend.payment_date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatCurrency(dividend.amount)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Historical dividends table */}
        <div>
          <h4 className="text-sm font-medium mb-2">Historical Dividends</h4>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ex-Dividend Date</TableHead>
                  <TableHead>Declaration Date</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.dividends.map((dividend, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {formatDate(dividend.ex_dividend_date)}
                    </TableCell>
                    <TableCell>
                      {formatDate(dividend.declaration_date)}
                    </TableCell>
                    <TableCell>{formatDate(dividend.payment_date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatCurrency(dividend.amount)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </ToolCard>
    </div>
  );
}
