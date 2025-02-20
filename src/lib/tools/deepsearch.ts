import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import type { DataStreamWriter } from "ai";
import FirecrawlApp from "@mendable/firecrawl-js";
import { vectorSearchTool } from "./vector-query";

import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const app = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || "",
});

// Define research state types
type Finding = {
  source: string;
  text: string;
  type: "vector" | "web";
  timestamp: string;
  similarity?: number;
};

type ResearchState = {
  findings: Finding[];
  iteration: number;
  startTime: number;
  timeRemaining: number;
  phase:
    | "initialization"
    | "vector_search"
    | "web_search"
    | "analysis"
    | "synthesis";
  currentAnalysis?: LLMAnalysis;
};

type LLMAnalysis = {
  summary: string;
  gaps: string[];
  nextSteps: string[];
  shouldContinue: boolean;
  nextSearchTopic?: string;
  urlToSearch?: string;
};

// Research prompts
const ANALYSIS_PROMPT = `You are a research agent analyzing findings about: {topic}

Time Status:
- Time remaining: {timeRemaining} minutes
- Current iteration: {iteration}

Current Research State:
{vectorContext}
{webContext}

Current findings:
{findings}

Your task is to:
1. Analyze current findings
2. Identify knowledge gaps
3. Determine next research steps
4. Decide if more research is needed

If you need more information, you can:
- Specify a search topic for web search
- Provide a URL to extract detailed information
- Request vector database search with a specific query

Important:
- If less than 2 minutes remain, set shouldContinue to false to allow time for final synthesis
- If findings are sufficient, set shouldContinue to false
- Ensure progressive exploration of the topic

Respond in this exact JSON format:
{
  "analysis": {
    "summary": "Comprehensive summary of current findings",
    "gaps": ["Specific gap 1", "Specific gap 2"],
    "nextSteps": ["Detailed next step 1", "Detailed next step 2"],
    "shouldContinue": true/false,
    "nextSearchTopic": "optional specific search query",
    "urlToSearch": "optional specific URL to analyze",
    "vectorQuery": "optional specific query for vector search"
  }
}`;

const FINAL_SYNTHESIS_PROMPT = `You are synthesizing research findings about: {topic}

Research Statistics:
- Total iterations: {totalIterations}
- Vector sources used: {vectorSources}
- Web sources analyzed: {webSources}
- Total research time: {researchTime} minutes

All findings:
{allFindings}

Create a comprehensive research synthesis that:
1. Summarizes key findings
2. Identifies main themes
3. Highlights important discoveries
4. Notes remaining uncertainties
5. Suggests potential future research directions

Respond in this exact JSON format:
{
  "synthesis": {
    "summary": "comprehensive summary",
    "keyFindings": ["key finding 1", "key finding 2"],
    "mainThemes": ["theme 1", "theme 2"],
    "uncertainties": ["uncertainty 1", "uncertainty 2"],
    "futureDirections": ["direction 1", "direction 2"]
  }
}`;

// Parameter schema
const DeepResearchParams = z.object({
  topic: z.string().describe("The topic or question to research deeply"),
  useVectorDB: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to include vector database search"),
  workspace: z
    .string()
    .optional()
    .describe("Workspace ID for vector search when useVectorDB is true"),
  maxIterations: z
    .number()
    .optional()
    .default(5)
    .describe("Maximum research iterations"),
  timeLimit: z.number().optional().default(3).describe("Time limit in minutes"),
});

export const deepResearchTool: ToolDefinition<typeof DeepResearchParams> = {
  name: "deep_research",
  description:
    "Perform comprehensive research using LLM-guided analysis of multiple information sources, including vector database and web content",
  parameters: DeepResearchParams,
  execute: async (
    { topic, useVectorDB, workspace, maxIterations = 5, timeLimit = 3 },
    dataStream?: DataStreamWriter
  ): Promise<ToolExecuteResult> => {
    try {
      // Initialize research state
      const state: ResearchState = {
        findings: [],
        iteration: 0,
        startTime: Date.now(),
        timeRemaining: timeLimit * 60 * 1000,
        phase: "initialization",
      };
      dataStream?.writeData({
        tool: "deep_research",
        content: {
          params: {
            topic,
            useVectorDB,
            workspace,
            maxIterations,
            timeLimit,
          },
          timestamp: new Date().toISOString(),
        },
      });

      // Log initialization
      dataStream?.writeData({
        tool: "deep_research",
        content: {
          phase: state.phase,
          topic,
          useVectorDB,
          workspace: workspace || "none",
          timestamp: new Date().toISOString(),
        },
      });

      // Initial vector search if enabled
      if (useVectorDB && workspace) {
        state.phase = "vector_search";
        dataStream?.writeData({
          tool: "deep_research",
          content: {
            phase: state.phase,
            message: "Performing initial vector search",
            timestamp: new Date().toISOString(),
          },
        });

        const vectorResults = await vectorSearchTool.execute({
          query: topic,
          workspace,
          topK: 20,
        });

        if (vectorResults.success && vectorResults.data.results) {
          state.findings.push(
            ...vectorResults.data.results.map((result) => ({
              source: `Vector DB - ${result.filename}`,
              text: result.chunk_content,
              type: "vector" as const,
              timestamp: new Date().toISOString(),
              similarity: result.similarity,
            }))
          );
        }
      }

      // Research loop
      while (state.iteration < maxIterations && state.timeRemaining > 120000) {
        // 2 minutes minimum
        state.iteration++;
        state.timeRemaining =
          timeLimit * 60 * 1000 - (Date.now() - state.startTime);

        // Prepare context for LLM
        const timeRemainingMinutes = Math.floor(state.timeRemaining / 60000);
        const vectorContext = useVectorDB
          ? `Vector database search has found ${
              state.findings.filter((f) => f.type === "vector").length
            } relevant documents.`
          : "Vector database search is not enabled.";
        const webContext = `Web search has found ${
          state.findings.filter((f) => f.type === "web").length
        } relevant sources.`;

        // Get LLM analysis
        state.phase = "analysis";
        dataStream?.writeData({
          tool: "deep_research",
          content: {
            phase: state.phase,
            iteration: state.iteration,
            timeRemaining: timeRemainingMinutes,
            timestamp: new Date().toISOString(),
          },
        });

        const prompt = ANALYSIS_PROMPT.replace("{topic}", topic)
          .replace("{timeRemaining}", timeRemainingMinutes.toString())
          .replace("{iteration}", state.iteration.toString())
          .replace("{vectorContext}", vectorContext)
          .replace("{webContext}", webContext)
          .replace(
            "{findings}",
            state.findings
              .map((f) => `[From ${f.source}]: ${f.text.substring(0, 500)}...`)
              .join("\n\n")
          );

        const { text } = await generateText({
          model: anthropic("claude-3-5-sonnet-20241022"),
          prompt: prompt,
        });
        const analysisResult = text;
        console.log("analysisResult", analysisResult);

        try {
          state.currentAnalysis = JSON.parse(analysisResult).analysis;
        } catch (error) {
          console.error("Failed to parse LLM response:", error);
          continue;
        }

        // Log analysis
        dataStream?.writeData({
          tool: "deep_research",
          content: {
            phase: state.phase,
            analysis: state.currentAnalysis,
            timestamp: new Date().toISOString(),
          },
        });

        if (!state.currentAnalysis.shouldContinue) {
          break;
        }

        // Execute next steps based on LLM guidance
        state.phase = "web_search";
        if (state.currentAnalysis.nextSearchTopic) {
          const searchResult = await app.search(
            state.currentAnalysis.nextSearchTopic
          );
          if (searchResult.success && searchResult.data?.length > 0) {
            const topUrl = searchResult.data[0].url;
            const extractResult = await app.scrapeUrl(topUrl);

            if (extractResult.success) {
              state.findings.push({
                source: topUrl,
                text:
                  extractResult.markdown ||
                  extractResult.text ||
                  "No content extracted",
                type: "web",
                timestamp: new Date().toISOString(),
              });
            }
          }
        } else if (state.currentAnalysis.urlToSearch) {
          const extractResult = await app.scrapeUrl(
            state.currentAnalysis.urlToSearch
          );
          if (extractResult.success) {
            state.findings.push({
              source: state.currentAnalysis.urlToSearch,
              text:
                extractResult.markdown ||
                extractResult.text ||
                "No content extracted",
              type: "web",
              timestamp: new Date().toISOString(),
            });
          }
        } else if (
          state.currentAnalysis.vectorQuery &&
          useVectorDB &&
          workspace
        ) {
          const vectorResults = await vectorSearchTool.execute({
            query: state.currentAnalysis.vectorQuery,
            workspace,
            topK: 10,
          });

          if (vectorResults.success && vectorResults.data.results) {
            state.findings.push(
              ...vectorResults.data.results.map((result) => ({
                source: `Vector DB - ${result.filename}`,
                text: result.chunk_content,
                type: "vector" as const,
                timestamp: new Date().toISOString(),
                similarity: result.similarity,
              }))
            );
          }
        }
      }

      // Final synthesis
      state.phase = "synthesis";
      dataStream?.writeData({
        tool: "deep_research",
        content: {
          phase: state.phase,
          message: "Generating final synthesis",
          timestamp: new Date().toISOString(),
        },
      });

      const synthesisPrompt = FINAL_SYNTHESIS_PROMPT.replace("{topic}", topic)
        .replace("{totalIterations}", state.iteration.toString())
        .replace(
          "{vectorSources}",
          state.findings.filter((f) => f.type === "vector").length.toString()
        )
        .replace(
          "{webSources}",
          state.findings.filter((f) => f.type === "web").length.toString()
        )
        .replace(
          "{researchTime}",
          ((Date.now() - state.startTime) / 60000).toFixed(1)
        )
        .replace(
          "{allFindings}",
          state.findings
            .map((f) => `[From ${f.source}]: ${f.text.substring(0, 300)}...`)
            .join("\n\n")
        );

      const { text } = await generateText({
        model: anthropic("claude-3-5-sonnet-20241022"),
        prompt: synthesisPrompt,
      });
      const synthesisResult = text;

      let synthesis;
      try {
        synthesis = JSON.parse(synthesisResult).synthesis;
      } catch (error) {
        console.error("Failed to parse synthesis:", error);
        synthesis = {
          summary: "Failed to generate synthesis",
          keyFindings: [],
          mainThemes: [],
          uncertainties: [],
          futureDirections: [],
        };
      }

      return {
        success: true,
        data: {
          summary: synthesis.summary,
          findings: state.findings,
          vectorInsights: useVectorDB
            ? {
                relevantDocuments: state.findings.filter(
                  (f) => f.type === "vector"
                ).length,
                keyFindings: state.findings
                  .filter((f) => f.type === "vector")
                  .map((f) => f.text.substring(0, 200) + "..."),
              }
            : undefined,
          webInsights: {
            sourcesExamined: state.findings.filter((f) => f.type === "web")
              .length,
            keyFindings: state.findings
              .filter((f) => f.type === "web")
              .map((f) => f.text.substring(0, 200) + "..."),
          },
          synthesis: {
            keyFindings: synthesis.keyFindings,
            mainThemes: synthesis.mainThemes,
            uncertainties: synthesis.uncertainties,
            futureDirections: synthesis.futureDirections,
          },
          researchStats: {
            totalIterations: state.iteration,
            timeSpent: (Date.now() - state.startTime) / 1000 / 60,
          },
        },
      };
    } catch (error) {
      console.error("Deep research error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? `Research failed: ${error.message}`
            : "Failed to complete research",
      };
    }
  },
};
