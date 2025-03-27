// app/page.tsx
"use client";

import Link from "next/link";
import {
  MoveRight,
  BarChart3,
  MessageSquare,
  Search,
  TrendingUp,
  Activity,
  LineChart,
  Database,
  Clock,
  Users,
  Layers,
  PenTool,
} from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTools, setShowTools] = useState(false);

  // List of available tools for display
  const availableTools = [
    { name: "search", description: "Web search for relevant information" },
    { name: "extract", description: "Extract structured data from webpages" },
    { name: "deepsearch", description: "Perplexity AI-powered deep research" },
    {
      name: "companyNews",
      description: "Latest news articles by stock ticker",
    },
    {
      name: "stockFinancials",
      description: "Historical financial data from SEC filings",
    },
    {
      name: "marketMovers",
      description: "Top gainers, losers, and active stocks",
    },
    {
      name: "advancedAnalytics",
      description: "Advanced stock analysis metrics",
    },
    {
      name: "companyOverview",
      description: "Comprehensive company information",
    },
    { name: "etfAnalytics", description: "ETF profiles and holdings analysis" },
    {
      name: "dividends",
      description: "Historical and announced dividend distributions",
    },
    {
      name: "incomeStatement",
      description: "Annual/quarterly income statement data",
    },
    {
      name: "balanceSheet",
      description: "Annual/quarterly balance sheet data",
    },
    {
      name: "cashFlow",
      description: "Annual/quarterly cash flow statement data",
    },
    { name: "earnings", description: "Annual/quarterly EPS data" },
  ];

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/user");
        if (response.ok) {
          const data = await response.json();
          setEmail(data.email);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <main className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center mr-2">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">FinancialInsights</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link
                href="/chat"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Chat
              </Link>
              <Link
                href="/research"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center"
              >
                <Search className="h-4 w-4 mr-1" />
                Research
              </Link>

              {isLoading ? (
                // Show loading skeleton
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
              ) : isAuthenticated ? (
                // Show welcome message and user menu when logged in
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 dark:text-gray-300">
                    Welcome, {email && email.split("@")[0]}
                  </span>
                  <UserMenu />
                </div>
              ) : (
                // Show login and signup buttons when not logged in
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}

              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-900 text-white py-16 px-4 md:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-1/2 space-y-6">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-500/30 text-sm font-medium mb-2">
                MVP Access Available
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
                Your Intelligent
                <br />
                <span className="text-blue-300">Financial Analyst</span>
              </h1>
              <p className="text-lg md:text-xl opacity-90 max-w-lg">
                Unlock Bloomberg-level insights at a fraction of the cost.
                Transform hours of financial research into minutes with
                professional-grade analytics that anyone can use.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="flex items-start space-x-2">
                  <Database className="h-5 w-5 text-blue-300 flex-shrink-0 mt-1" />
                  <p className="text-sm">
                    Access professional-grade financial data at a fraction of
                    the cost
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock className="h-5 w-5 text-blue-300 flex-shrink-0 mt-1" />
                  <p className="text-sm">
                    Compress hours of financial research into minutes
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <Users className="h-5 w-5 text-blue-300 flex-shrink-0 mt-1" />
                  <p className="text-sm">
                    Professional investment data now accessible to everyone
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <Layers className="h-5 w-5 text-blue-300 flex-shrink-0 mt-1" />
                  <p className="text-sm">
                    Deep analysis for informed investment decisions, not just
                    answers
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a
                  href="mailto:bofeng1997@gmail.com?subject=FinancialInsights%20MVP%20Access%20Request"
                  className="px-6 py-3 bg-white text-blue-900 rounded-lg font-medium hover:shadow-lg transition-all inline-flex items-center justify-center"
                >
                  Request Test Access <MoveRight className="ml-2 h-4 w-4" />
                </a>
                <div className="flex gap-2">
                  <Link
                    href="/chat"
                    className="px-6 py-3 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-600 transition-all flex items-center"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" /> Try Chat
                  </Link>
                  <Link
                    href="/research"
                    className="px-6 py-3 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-600 transition-all flex items-center"
                  >
                    <Search className="h-4 w-4 mr-1" /> Try Research
                  </Link>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-blue-800/50 to-indigo-900/50 backdrop-blur-sm">
              <div className="p-1">
                <div className="rounded-lg bg-gray-900/70 p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <div className="ml-2 text-sm text-gray-400">
                      financialinsights.app
                    </div>
                  </div>
                  <div className="space-y-3 font-mono text-sm">
                    <div className="text-green-400">
                      {">"} Analyze recent performance and news sentiment for
                      Alibaba
                    </div>
                    <div className="text-gray-300 pl-2">
                      Collecting data from premium financial sources...
                    </div>
                    <div className="text-gray-300 pl-2">
                      Analyzing SEC filings and insider transactions...
                    </div>
                    <div className="text-gray-300 pl-2">
                      Quantifying media sentiment across 500+ sources...
                    </div>
                    <div className="text-gray-300 pl-2">
                      Generating investment-grade report...
                    </div>
                    <div className="bg-blue-800/30 rounded p-3 text-white">
                      <p>
                        <span className="text-blue-300 font-bold">
                          Alibaba (BABA) Analysis Brief:
                        </span>
                      </p>
                      <p className="mt-2">
                        Price Performance: Up 8.2% over 30 days, outperforming
                        market by 4.1%
                      </p>
                      <p className="mt-1">
                        Media Sentiment: Positive (62%), Neutral (31%), Negative
                        (7%)
                      </p>
                      <p className="mt-1">
                        Trading Volume: 18% above 90-day average
                      </p>
                      <p className="mt-1">
                        Key News: Cloud business growth, international expansion
                        plans, new AI product launch
                      </p>
                      <p className="mt-1">
                        Institutional Holdings: 3.2% increase in last quarter
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Bloomberg-Quality Research, Without the Bloomberg Price
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our platform offers investment-grade analytics through two
              powerful modes, combining the best of AI with
              institutional-quality financial data
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                Professional Research Reports
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Generate comprehensive research reports that would take analysts
                hours to compile. Access the same quality of data that
                professional investors rely on, analyzing financial metrics,
                market positioning, and future outlook in minutes, not days.
              </p>
              <ul className="space-y-2">
                {[
                  "Institutional-grade financial data analysis",
                  "Market competition assessment with proprietary metrics",
                  "Industry trends with predictive indicators",
                  "Risk evaluation matching professional standards",
                  "Investment-ready PDF reports for decision-making",
                ].map((item, i) => (
                  <li key={i} className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href="/research"
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  Try Research <MoveRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                Intelligent Finance Agent
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Go beyond basic AI answers with a finance agent that delivers
                investment-quality insights on demand. Access the same level of
                analysis that powers Wall Street decisions through a simple
                conversation interface.
              </p>
              <ul className="space-y-2">
                {[
                  "Real-time financial analysis previously only available to professionals",
                  "Multi-source sentiment analysis across news and social media",
                  "Quantitative metrics that match institutional standards",
                  "Actionable insights, not just informational answers",
                  "Deep financial expertise in a conversational format",
                ].map((item, i) => (
                  <li key={i} className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 mr-2"></div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href="/chat"
                  className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  Try Chat <MoveRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Tools Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Professional-Grade Financial Tools
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Access the same financial data tools used by professional
              analysts, now available through our AI platform
            </p>
            <button
              onClick={() => setShowTools(!showTools)}
              className="mt-4 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors inline-flex items-center"
            >
              {showTools ? "Hide Tools" : "View Available Tools"}
              <PenTool className="ml-2 h-4 w-4" />
            </button>
          </div>

          {showTools && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTools.map((tool, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-100 dark:border-gray-600"
                >
                  <div className="font-mono text-sm text-blue-600 dark:text-blue-400 mb-1">
                    {tool.name}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {tool.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center">
            Beyond Basic AI: Financial Intelligence That Delivers Results
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Database className="h-6 w-6" />,
                title: "Premium Financial Data Sources",
                desc: "Access the same financial data that powers Wall Street decisions, with comprehensive coverage across global markets and instruments.",
              },
              {
                icon: <Activity className="h-6 w-6" />,
                title: "Professional-Grade Sentiment Analysis",
                desc: "Quantify market sentiment with the same precision used by institutional investors, tracking opinion shifts across thousands of sources.",
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                title: "Predictive Trend Identification",
                desc: "Identify emerging market trends before they become obvious, using the same leading indicators that professional analysts rely on.",
              },
              {
                icon: <LineChart className="h-6 w-6" />,
                title: "Investment-Quality Visualizations",
                desc: "Visualize complex financial data through professional-grade charts that match what you'd see on a trading desk.",
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                title: "Institutional Competitive Analysis",
                desc: "Compare companies using the same proprietary metrics and frameworks employed by top-tier investment research firms.",
              },
              {
                icon: <MessageSquare className="h-6 w-6" />,
                title: "Decision-Ready Insights",
                desc: "Receive actionable investment insights, not just information, with the depth and rigor needed for confident financial decisions.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex flex-col items-start p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
              >
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-600 to-indigo-900 text-white">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
            Experience Bloomberg-Level Insights at a Fraction of the Cost
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 opacity-90">
            Join our MVP program today and compress hours of professional
            financial research into minutes. Access the data tools previously
            available only to Wall Street professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:bofeng1997@gmail.com?subject=FinancialInsights%20MVP%20Access%20Request"
              className="px-8 py-4 bg-white text-blue-900 rounded-lg font-medium hover:shadow-lg transition-all inline-flex items-center justify-center text-lg"
            >
              Request Test Access <MoveRight className="ml-2 h-5 w-5" />
            </a>
            <div className="flex gap-4">
              <Link
                href="/chat"
                className="px-6 py-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-all flex items-center justify-center text-lg"
              >
                <MessageSquare className="h-5 w-5 mr-2" /> Try Chat
              </Link>
              <Link
                href="/research"
                className="px-6 py-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-all flex items-center justify-center text-lg"
              >
                <Search className="h-5 w-5 mr-2" /> Try Research
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="text-2xl font-display font-bold text-blue-600 dark:text-blue-400">
                FinancialInsights.app
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Professional-Grade Financial Analysis for Everyone
              </p>
            </div>
            <div className="flex gap-6 mb-4 md:mb-0">
              <Link
                href="/chat"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Chat
              </Link>
              <Link
                href="/research"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Research
              </Link>
              <Link
                href="/login"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Sign Up
              </Link>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 FinancialInsights. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
