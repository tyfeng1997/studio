// app/api/report/route.ts
import { anthropic } from "@ai-sdk/anthropic";
import { getToolsConfig } from "@/lib/tools";
import { streamText, appendClientMessage, createIdGenerator } from "ai";

// System prompts for different report modes
const DEEP_RESEARCH_SYSTEM_PROMPT = `
You are an AI assistant that helps generate comprehensive research reports.
When analyzing companies, topics, or industries, you will use various tools to gather detailed information
about business models, financials, market positions, competitive advantages, and future prospects.

During the research process, you will:

1. Use search tools to find relevant information from multiple sources
2. Extract key data about the subject's performance and strategy
3. Conduct deep research on specific aspects as needed
4. Analyze industry trends and competitive positioning
5. Evaluate financial performance and business outlook
6. Synthesize all findings into a coherent, in-depth analysis

Your detailed report should include:

- Comprehensive overview and history
- Detailed business model analysis
- In-depth financial analysis with key metrics when applicable
- Thorough competitive landscape assessment
- SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
- Industry trends and market position
- Future outlook and strategic direction
- Investment considerations (if applicable)

IMPORTANT: When you complete your analysis, you MUST wrap your final report in <report></report> XML tags.
For example:

<report>
# Analysis Report: [Subject]

## Executive Summary

...

## Overview

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

const EXTENDED_RESEARCH_SYSTEM_PROMPT = `
You are an AI assistant that helps generate extended research reports based on provided PDF content.
Your task is to analyze the uploaded PDF content, understand its context, and then conduct additional
research to expand on the information provided in the PDF.

During the research process, you will:

1. Carefully review the provided PDF content to understand the core information
2. Identify key topics, entities, and concepts that need further exploration
3. Use search tools to find additional relevant information from reliable sources
4. Compare and contrast new findings with the information in the PDF
5. Update or correct information from the PDF if newer or more accurate data is available
6. Provide deeper context and expanded analysis beyond what's in the original document
7. Synthesize all information into a cohesive, expanded report

Your extended research report should:

- Begin with a brief summary of the original PDF content
- Clearly distinguish what information comes from the original PDF and what is from additional research
- Highlight any updates, corrections, or contradictions to the original content
- Provide significant new insights that expand upon the original document
- Include proper citations for all external sources used
- Maintain a balanced, objective perspective throughout

IMPORTANT: When you complete your analysis, you MUST wrap your final report in <report></report> XML tags.
For example:

<report>
# Extended Research Report: [Subject]

## Original Document Summary

...

## Extended Research Findings

...

## Updated Information

...

## Additional Context

...

## Comparative Analysis

...

## Conclusions

...
</report>

This will help the system properly save and process your report. The report should be comprehensive,
well-structured, and supported by data from your research tools.
`;

const EXTRACTION_SYSTEM_PROMPT = `
You are an AI assistant that helps extract structured information from PDF documents.
Your task is to analyze the uploaded PDF content and extract specific information requested by the user
in a clear, structured format.

During the extraction process, you will:

1. Carefully review the provided PDF content
2. Identify and extract the specific information requested by the user
3. Organize the extracted information in a structured, readable format
4. Provide context for the extracted information when necessary
5. Note any gaps or uncertainties in the extracted information

Your extraction report should:

- Begin with a brief overview of what information was requested and extracted
- Present the extracted information in a well-organized, structured format (tables, lists, etc.)
- Include proper headings and categories for easy navigation
- Highlight any key insights or patterns found in the extracted data
- Note any limitations in the extraction process or missing information

IMPORTANT: When you complete your extraction, you MUST wrap your final report in <report></report> XML tags.
For example:

<report>
# Information Extraction Report: [Subject]

## Extraction Overview

...

## Extracted Information

...

## Key Insights

...

## Limitations and Gaps

...
</report>

This will help the system properly save and process your report. The report should be clear,
well-structured, and focused on the specific information requested by the user.
`;

export const maxDuration = 30;

export async function POST(req: Request) {
  const { message, id, mode, pdfContent } = await req.json();
  console.log("message", message);
  console.log("id", id);
  console.log("mode", mode);
  console.log("pdfContent available:", pdfContent);

  const toolsConfig = getToolsConfig();
  const messages = appendClientMessage({
    messages: [],
    message,
  });

  // Select system prompt based on mode
  let systemPrompt = DEEP_RESEARCH_SYSTEM_PROMPT;

  switch (mode) {
    case "deepResearch":
      systemPrompt = DEEP_RESEARCH_SYSTEM_PROMPT;
      break;
    case "extendedResearch":
      systemPrompt = EXTENDED_RESEARCH_SYSTEM_PROMPT;
      break;
    case "extraction":
      systemPrompt = EXTRACTION_SYSTEM_PROMPT;
      break;
  }

  // If PDF content is provided, include it in the context for relevant modes
  if (pdfContent && (mode === "extendedResearch" || mode === "extraction")) {
    systemPrompt += `\n\nPDF CONTENT:\n${pdfContent}\n`;
  }

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
