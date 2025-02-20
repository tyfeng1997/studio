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

// Enhanced prompts for better research guidance
const ANALYSIS_PROMPT = `You are an advanced research agent tasked with investigating: {topic}

Current Research Status:
- Time remaining: {timeRemaining} minutes
- Current iteration: {iteration} of {maxIterations}
- Phase: {currentPhase}

Information Sources Available:
- Vector Database: {vectorAvailable}
- Web Search: Always available
- URL Content Extraction: Available for detailed analysis

Current Research State:
{vectorContext}
{webContext}

Recent Findings:
{findings}

Research Progress Analysis:
1. What we've learned so far:
   - Key discoveries and insights
   - Main themes emerging
   - Conflicting information if any

2. Knowledge Assessment:
   - What do we know with confidence?
   - What remains unclear or needs verification?
   - Which aspects need deeper investigation?

3. Strategic Direction:
   - Should we dive deeper into existing findings?
   - Do we need to explore new angles?
   - Is there a need to verify or cross-reference information?

4. Resource Allocation:
   - Is vector search likely to yield relevant results for our current needs?
   - Would web search be more appropriate for our next step?
   - Should we extract detailed information from specific sources?

Decision Making Guidelines:
- If findings are getting repetitive, explore new angles
- If information is shallow, seek detailed sources
- If concepts are unclear, look for explanatory content
- If claims need verification, search for supporting evidence

Respond in this exact JSON format:
{
  "analysis": {
    "summary": "Current state of research understanding",
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

// Content extraction prompt template
const EXTRACTION_PROMPT = `Extract the most relevant information about {topic} from this content. Focus on:
1. Key facts and findings
2. Unique insights
3. Supporting evidence
4. Quantitative data
5. Expert opinions
Ignore generic or irrelevant content.`;

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

      while (state.iteration < maxIterations && state.timeRemaining > 120000) {
        state.iteration++;
        state.timeRemaining =
          timeLimit * 60 * 1000 - (Date.now() - state.startTime);

        // Prepare context for LLM with most recent findings only
        const timeRemainingMinutes = Math.floor(state.timeRemaining / 60000);
        const recentFindings = state.findings.slice(-3); // Only use latest 3 findings to reduce token count

        const prompt = ANALYSIS_PROMPT.replace("{topic}", topic)
          .replace("{timeRemaining}", timeRemainingMinutes.toString())
          .replace("{iteration}", state.iteration.toString())
          .replace("{maxIterations}", maxIterations.toString())
          .replace("{currentPhase}", state.phase)
          .replace(
            "{vectorAvailable}",
            useVectorDB ? "Available and enabled" : "Not available"
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
                  `[${f.type.toUpperCase()} | ${f.source}]: ${f.text.substring(
                    0,
                    200
                  )}...`
              )
              .join("\n\n")
          );

        console.log("prompt , ", prompt);

        // Get LLM analysis
        const { text: analysisResult } = await generateText({
          model: anthropic("claude-3-5-sonnet-20241022"),
          prompt,
        });

        let analysis;
        try {
          analysis = JSON.parse(analysisResult).analysis;
          state.currentAnalysis = analysis;
          console.log("analysis ", analysis);
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

            // Use extract API with custom prompt
            const extractPrompt = EXTRACTION_PROMPT.replace("{topic}", topic);
            const extractResult = await app.extract(topUrls, {
              prompt: analysis.strategy.extractionPrompt || extractPrompt,
            });

            if (extractResult.success) {
              state.findings.push({
                source: topUrls.join(", "),
                text:
                  extractResult.markdown ||
                  extractResult.text ||
                  "No content extracted",
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
              text:
                extractResult.markdown ||
                extractResult.text ||
                "No content extracted",
              type: "web",
              timestamp: new Date().toISOString(),
            });
          }
        } else if (analysis.strategy.vectorQuery && useVectorDB && workspace) {
          const vectorResults = await vectorSearchTool.execute({
            query: analysis.strategy.vectorQuery,
            workspace,
            topK: 5, // Reduced from 10 to control token usage
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
