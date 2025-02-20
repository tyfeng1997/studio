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

// Helper function: safely get a substring from text
function safeString(text: any): string {
  if (typeof text === "string") {
    return text;
  }
  try {
    return JSON.stringify(text);
  } catch (error) {
    return "";
  }
}

// Define research state types
type Finding = {
  source: string;
  text: any; // allow non-string types
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
  vectorQuery?: string;
  extractionPrompt?: string;
};

// Optimized analysis prompt in English
const ANALYSIS_PROMPT = `You are an advanced research agent tasked with conducting in-depth research on: {topic}

Current Research Status:
- Time remaining: {timeRemaining} minutes
- Current iteration: {iteration} / {maxIterations}
- Current phase: {currentPhase}

Available Information Sources:
- Vector Database: {vectorAvailable}
- Web Search: Always available
- URL Content Extraction: Available for detailed analysis

Research State Details:
{vectorContext}
{webContext}

Recent Findings:
{findings}

Research Progress Analysis:
1. What have we learned so far:
   - Key findings and insights
   - Emerging main themes
   - Any conflicting information (if any)

2. Knowledge Assessment:
   - What facts can we be confident about?
   - Which aspects remain unclear or require verification?
   - Which areas need further investigation?

3. Strategic Direction:
   - Should we delve deeper into existing findings?
   - Should we explore new angles?
   - Is there a need to verify or cross-reference information?

4. Resource Allocation:
   - Can vector search provide relevant results?
   - Is web search more appropriate for the next step?
   - Should we extract detailed information from specific sources?

Please provide an in-depth and critical analysis, explaining your reasoning, identifying potential research gaps, and offering specific improvement recommendations. Be sure to clearly outline specific next steps in your response.

Output in the exact JSON format:
{
  "analysis": {
    "summary": "Summary of current research understanding",
    "confidence": {
      "highConfidence": ["fact 1", "fact 2"],
      "needsVerification": ["aspect 1", "aspect 2"]
    },
    "gaps": ["specific gap 1", "specific gap 2"],
    "nextSteps": ["detailed step 1", "detailed step 2"],
    "shouldContinue": true/false,
    "strategy": {
      "nextSearchTopic": "optional specific search query",
      "urlToSearch": "optional specific URL to analyze",
      "vectorQuery": "optional specific query for vector search",
      "extractionPrompt": "optional prompt for content extraction"
    }
  }
}`;

// Optimized extraction prompt in English
const EXTRACTION_PROMPT = `Please extract the most relevant information about {topic} from the content provided below. Focus on:
1. Key facts and research findings
2. Unique insights and details
3. Supporting evidence and data
4. Quantitative data and statistics
5. Expert opinions and explanations
Ignore irrelevant content and generalities, ensuring that the extracted information is detailed and accurate.`;

// Optimized final synthesis prompt in English
const FINAL_SYNTHESIS_PROMPT = `You are synthesizing all research findings on the topic: {topic}

Research Statistics:
- Total iterations: {totalIterations}
- Number of vector sources used: {vectorSources}
- Number of web sources analyzed: {webSources}
- Total research time: {researchTime} minutes

All Findings:
{allFindings}

Please create a comprehensive research synthesis that includes:
1. A summary of key findings
2. Emerging main themes
3. Important breakthroughs and discoveries
4. Unresolved uncertainties and controversies
5. Specific recommendations for future research directions

Output in the exact JSON format:
{
  "synthesis": {
    "summary": "Comprehensive summary",
    "keyFindings": ["key finding 1", "key finding 2"],
    "mainThemes": ["theme 1", "theme 2"],
    "uncertainties": ["uncertainty 1", "uncertainty 2"],
    "futureDirections": ["future direction 1", "future direction 2"]
  }
}`;

// Parameter schema
const DeepResearchParams = z.object({
  topic: z.string().describe("The topic or question to research deeply"),
  useVectorDB: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to enable vector database search"),
  workspace: z
    .string()
    .optional()
    .describe("Workspace ID to use for vector search when enabled"),
  maxIterations: z
    .number()
    .optional()
    .default(15)
    .describe("Maximum number of research iterations"),
  timeLimit: z
    .number()
    .optional()
    .default(10)
    .describe("Time limit in minutes"),
});

export const deepResearchTool: ToolDefinition<typeof DeepResearchParams> = {
  name: "deep_research",
  description:
    "Conduct comprehensive research using LLM-guided analysis of multiple information sources, including vector database and web content",
  parameters: DeepResearchParams,
  execute: async (
    { topic, useVectorDB, workspace, maxIterations = 15, timeLimit = 10 },
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

      // Perform initial vector search if enabled
      if (useVectorDB && workspace) {
        state.phase = "vector_search";
        dataStream?.writeData({
          tool: "deep_research",
          content: {
            phase: state.phase,
            message: "Executing initial vector search",
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

      // Research iterations
      while (state.iteration < maxIterations && state.timeRemaining > 120000) {
        state.iteration++;
        state.timeRemaining =
          timeLimit * 60 * 1000 - (Date.now() - state.startTime);

        // Prepare context for LLM using only the most recent findings to control token usage
        const timeRemainingMinutes = Math.floor(state.timeRemaining / 60000);
        const recentFindings = state.findings;

        const prompt = ANALYSIS_PROMPT.replace("{topic}", topic)
          .replace("{timeRemaining}", timeRemainingMinutes.toString())
          .replace("{iteration}", state.iteration.toString())
          .replace("{maxIterations}", maxIterations.toString())
          .replace("{currentPhase}", state.phase)
          .replace(
            "{vectorAvailable}",
            useVectorDB ? "Enabled and available" : "Not enabled"
          )
          .replace(
            "{vectorContext}",
            useVectorDB
              ? `Vector database has provided ${
                  state.findings.filter((f) => f.type === "vector").length
                } relevant documents`
              : "Vector database search is not enabled"
          )
          .replace(
            "{webContext}",
            `Web search has found ${
              state.findings.filter((f) => f.type === "web").length
            } sources`
          )
          .replace(
            "{findings}",
            recentFindings
              .map(
                (f) =>
                  `[${f.type.toUpperCase()} | ${f.source}]: ${safeString(
                    f.text
                  )}`
              )
              .join("\n\n")
          );

        console.log("Prompt:", prompt);

        // Get LLM analysis
        const { text: analysisResult } = await generateText({
          model: anthropic("claude-3-5-sonnet-20241022"),
          prompt,
        });

        let analysis;
        try {
          analysis = JSON.parse(analysisResult).analysis;
          state.currentAnalysis = analysis;
          console.log("Analysis:", analysis);
        } catch (error) {
          console.error("Failed to parse LLM response:", error);
          continue;
        }

        // Log analysis
        dataStream?.writeData({
          tool: "deep_research",
          content: {
            phase: state.phase,
            iteration: state.iteration,
            timeRemaining: timeRemainingMinutes,
            analysis: analysis,
            timestamp: new Date().toISOString(),
          },
        });

        if (!analysis.shouldContinue) break;

        // Execute next steps based on LLM guidance
        state.phase = "web_search";
        if (analysis.strategy.nextSearchTopic) {
          const searchResult = await app.search(
            analysis.strategy.nextSearchTopic
          );

          if (searchResult.success && searchResult.data?.length > 0) {
            const topUrls = searchResult.data.slice(0, 2).map((r) => r.url); // Get top 2 URLs

            // Use extraction API with custom prompt
            const extractPrompt = EXTRACTION_PROMPT.replace("{topic}", topic);
            const extractResult = await app.extract(topUrls, {
              prompt: analysis.strategy.extractionPrompt || extractPrompt,
            });

            if (extractResult.success) {
              state.findings.push({
                source: topUrls.join(", "),
                text: extractResult.data || "No content extracted",
                type: "web",
                timestamp: new Date().toISOString(),
              });
            }
          }
        } else if (analysis.strategy.urlToSearch) {
          const extractPrompt = EXTRACTION_PROMPT.replace("{topic}", topic);
          const extractResult = await app.extract(
            [analysis.strategy.urlToSearch],
            {
              prompt: analysis.strategy.extractionPrompt || extractPrompt,
            }
          );

          if (extractResult.success) {
            state.findings.push({
              source: analysis.strategy.urlToSearch,
              text: extractResult.data || "No content extracted",
              type: "web",
              timestamp: new Date().toISOString(),
            });
          }
        } else if (analysis.strategy.vectorQuery && useVectorDB && workspace) {
          const vectorResults = await vectorSearchTool.execute({
            query: analysis.strategy.vectorQuery,
            workspace,
            topK: 5,
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

      // Final synthesis phase
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
            .map((f) => `[From ${f.source}]: ${safeString(f.text)}`)
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
                  .map((f) => safeString(f.text)),
              }
            : undefined,
          webInsights: {
            sourcesExamined: state.findings.filter((f) => f.type === "web")
              .length,
            keyFindings: state.findings
              .filter((f) => f.type === "web")
              .map((f) => safeString(f.text)),
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
