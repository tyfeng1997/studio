// app/page.tsx
import Link from "next/link";
import {
  MoveRight,
  BarChart3,
  MessageSquare,
  Search,
  TrendingUp,
  Activity,
  LineChart,
} from "lucide-react";

export default function Home() {
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
              <span className="text-xl font-bold">FinanceInsight</span>
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
                <span className="text-blue-300">Company Analyst</span>
              </h1>
              <p className="text-lg md:text-xl opacity-90 max-w-lg">
                Unlock deep insights on public companies, market sentiment, and
                real-time news with FinanceInsight's AI-powered analysis for
                smarter investment decisions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a
                  href="mailto:bofeng1997@gmail.com?subject=FinanceInsight%20MVP%20Access%20Request"
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
                      financeinsight.app
                    </div>
                  </div>
                  <div className="space-y-3 font-mono text-sm">
                    <div className="text-green-400">
                      {">"} Analyze recent performance and news sentiment for
                      Alibaba
                    </div>
                    <div className="text-gray-300 pl-2">Collecting data...</div>
                    <div className="text-gray-300 pl-2">
                      Analyzing market trends...
                    </div>
                    <div className="text-gray-300 pl-2">
                      Analyzing media sentiment...
                    </div>
                    <div className="text-gray-300 pl-2">
                      Generating report...
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
              Dual-Mode Intelligence
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our platform offers two powerful modes to meet all your needs,
              from daily inquiries to professional research
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
                Generate comprehensive research reports on public companies,
                including financial analysis, market positioning, SWOT analysis,
                competitive landscape, and future outlook. Get
                professional-grade analysis in minutes.
              </p>
              <ul className="space-y-2">
                {[
                  "Deep financial data analysis",
                  "Market competition assessment",
                  "Industry trends and company positioning",
                  "Risk evaluation and investment recommendations",
                  "Exportable PDF reports",
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
                Intelligent Finance Assistant
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Chat with your intelligent finance assistant anytime, anywhere
                to get real-time market dynamics, company news, and data
                interpretation. Simple questions, instant professional answers.
              </p>
              <ul className="space-y-2">
                {[
                  "Real-time financial news interpretation",
                  "Market sentiment and social media analysis",
                  "Stock and industry data queries",
                  "Simplified complex financial concepts",
                  "Natural language conversation experience",
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

      {/* Core Capabilities */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center">
            All-in-One Corporate Intelligence Platform
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="h-6 w-6" />,
                title: "Comprehensive Data Collection",
                desc: "Automatically collect and integrate company information from multiple sources, including financial data, news reports, social media, and analyst reports.",
              },
              {
                icon: <Activity className="h-6 w-6" />,
                title: "Sentiment Analysis",
                desc: "Analyze opinions in social media and news reports to understand the overall market sentiment and attitude changes toward companies.",
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                title: "Trend Identification",
                desc: "Discover industry trends and market changes, staying one step ahead of key developments that may impact investment decisions.",
              },
              {
                icon: <LineChart className="h-6 w-6" />,
                title: "Visual Analytics",
                desc: "Easily understand complex financial and market data through intuitive charts and data visualizations.",
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                title: "Competitive Comparison",
                desc: "Comprehensively compare key metrics and performance of companies in the same industry to discover competitive advantages and potential opportunities.",
              },
              {
                icon: <MessageSquare className="h-6 w-6" />,
                title: "Natural Language Interaction",
                desc: "Ask questions in natural language and receive accurate, easy-to-understand answers without requiring a professional financial background.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex flex-col items-start p-6 bg-gray-50 dark:bg-gray-800 rounded-xl"
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
            Join Our MVP Testing Program
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 opacity-90">
            We're recruiting test users to experience and help improve
            FinanceInsight. Get early access to this powerful financial analysis
            tool and shape its future development.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:bofeng1997@gmail.com?subject=FinanceInsight%20MVP%20Access%20Request"
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
                FinanceInsight.app
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                AI-Powered Financial & Company Analysis Platform
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
              © 2025 FinanceInsight. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
