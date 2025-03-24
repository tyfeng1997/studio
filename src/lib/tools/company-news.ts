import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import { restClient } from "@polygon.io/client-js";

const CompanyNewsParams = z.object({
  ticker: z.string().describe("Stock ticker symbol (e.g., NVDA, AAPL)"),
});

export const companyNewsTool: ToolDefinition<typeof CompanyNewsParams> = {
  name: "companyNews",
  description:
    "Search for recent news articles about a specific company by its stock ticker symbol",
  parameters: CompanyNewsParams,
  execute: async ({ ticker }): Promise<ToolExecuteResult> => {
    try {
      // Input validation
      if (!ticker.trim()) {
        throw new Error("Ticker symbol cannot be empty");
      }

      // Create Polygon.io client
      const rest = restClient(process.env.POLYGON_API_KEY || "");

      // Fetch news for the ticker
      const response = await rest.reference.tickerNews({
        ticker: ticker.toUpperCase(),
        order: "desc",
        limit: 10,
        sort: "published_utc",
      });

      // Check if the request was successful
      if (response.status !== "OK") {
        return {
          success: false,
          error: `Failed to retrieve news: ${response.status}`,
        };
      }

      // Process the results
      const articles = response.results.map((article) => {
        // Add favicon URL for the publisher
        let favicon = article.publisher.favicon_url || null;
        if (!favicon && article.publisher.homepage_url) {
          try {
            const url = new URL(article.publisher.homepage_url);
            favicon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
          } catch (e) {
            // Use default if URL parsing fails
            favicon = null;
          }
        }

        return {
          id: article.id,
          title: article.title,
          description: article.description,
          published_utc: article.published_utc,
          article_url: article.article_url,
          publisher: {
            name: article.publisher.name,
            homepage_url: article.publisher.homepage_url,
            logo_url: article.publisher.logo_url,
            favicon_url: favicon,
          },
          tickers: article.tickers,
          image_url: article.image_url,
          author: article.author,
          insights: article.insights || [],
        };
      });

      return {
        success: true,
        data: {
          articles,
          count: articles.length,
          ticker: ticker.toUpperCase(),
        },
      };
    } catch (error) {
      console.error(`Company news tool error:`, error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch company news",
      };
    }
  },
};
