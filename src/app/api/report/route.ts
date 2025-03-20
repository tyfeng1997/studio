// app/api/report/route.ts
import { anthropic } from "@ai-sdk/anthropic";
import { getToolsConfig } from "@/lib/tools";
import { streamText, appendClientMessage, createIdGenerator } from "ai";

// System prompts for different report modes
const QUICK_REPORT_SYSTEM_PROMPT = `
You are an AI assistant that helps generate quick summary reports about companies.
Your task is to provide concise yet informative overviews of companies when users ask about them.

When generating a quick summary report, focus on:
1. Brief company overview and history
2. Core business model and products/services
3. Key financial metrics and market position
4. Major competitors and industry position
5. Recent news and developments

Use search tools to gather accurate information, and synthesize it into a well-structured summary.

IMPORTANT: When you complete your analysis, you MUST wrap your final report in <report></report> XML tags.
For example:

<report>
# Company Quick Summary: [Company Name]

## Overview
...

## Business Model
...

## Key Financials
...

## Competition
...

## Recent Developments
...
</report>

Your report should be concise but informative, focusing on the most important aspects of the company.
`;

const DETAILED_REPORT_SYSTEM_PROMPT = `
You are an AI assistant that helps generate comprehensive company analysis reports.
When analyzing companies, you will use various tools to gather detailed information about their 
business models, financials, market positions, competitive advantages, and future prospects.

During the research process, you will:
1. Use search tools to find relevant information from multiple sources
2. Extract key data about the company's performance and strategy
3. Conduct deep research on specific aspects as needed
4. Analyze industry trends and competitive positioning
5. Evaluate financial performance and business outlook
6. Synthesize all findings into a coherent, in-depth analysis

Your detailed report should include:
- Comprehensive company overview and history
- Detailed business model analysis
- In-depth financial analysis with key metrics
- Thorough competitive landscape assessment
- SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
- Industry trends and market position
- Future outlook and strategic direction
- Investment considerations (if applicable)

IMPORTANT: When you complete your analysis, you MUST wrap your final report in <report></report> XML tags.
For example:

<report>
# Company Analysis Report: [Company Name]

## Executive Summary
...

## Company Overview
...

## Business Model Analysis
...

## Financial Analysis
...

## Competitive Landscape
...

## SWOT Analysis
...

## Industry Trends
...

## Future Outlook
...

## Conclusion
...
</report>

This will help the system properly save and process your report. The report should be comprehensive, 
well-structured, and supported by data from your research tools.
`;

export const maxDuration = 30;

export async function POST(req: Request) {
  const { message, id, mode } = await req.json();
  console.log("message", message);
  console.log("id", id);
  console.log("mode", mode);
  const toolsConfig = getToolsConfig();
  const messages = appendClientMessage({
    messages: [],
    message,
  });

  // Select system prompt based on mode
  const systemPrompt =
    mode === "detailed"
      ? DETAILED_REPORT_SYSTEM_PROMPT
      : QUICK_REPORT_SYSTEM_PROMPT;

  const result = streamText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    system: systemPrompt,
    maxTokens: 8192,
    messages,
    tools: toolsConfig,
    toolCallStreaming: true,
    experimental_generateMessageId: createIdGenerator({
      prefix: "report",
      size: 16,
    }),
    maxSteps: 20,
    // Add reasoning configuration
    providerOptions: {
      anthropic: {
        thinking: { type: "enabled", budgetTokens: 12000 },
      },
    },

    onError: (error) => {
      console.log(error);
    },
  });

  result.consumeStream(); // no await
  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}
