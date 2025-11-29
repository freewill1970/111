import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface SummaryResult {
  text: string;
  sources: string[];
}

const COMMON_PROMPT_INSTRUCTIONS = `
    3.  **FORMAT (BILINGUAL)**:
        - Output strictly in **English** followed by **Chinese**.
        - Use Markdown.

    OUTPUT TEMPLATE:

    # [English Video Title]
    # [Chinese Video Title]

    ## Executive Summary / 内容摘要
    [Concise English Summary of the video content]
    
    [Chinese Translation]

    ## Key Highlights / 关键亮点
    * **[English Point]** - [Chinese Translation]
    * **[English Point]** - [Chinese Translation]
    * **[English Point]** - [Chinese Translation]

    ## Detailed Overview / 详细概览
    [English explanation of the content]
    
    [Chinese Translation]
`;

export async function summarizeText(text: string): Promise<SummaryResult> {
  const prompt = `
    You are a professional research assistant.
    
    SOURCE TEXT (TRANSCRIPT/CONTENT):
    ${text}
    
    GOAL: Summarize the provided text as if it were a video transcript.
    
    ${COMMON_PROMPT_INSTRUCTIONS}
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return { text: response.text || "No summary generated.", sources: ["Provided Transcript"] };
  } catch (error: any) {
    console.error("Error summarizing text:", error);
    throw new Error("Failed to summarize the transcript.");
  }
}

export async function summarizeVideo(videoUrl: string): Promise<SummaryResult> {
  // Robust regex to extract YouTube Video ID
  const videoIdMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  
  // Improved search strategy: 
  // 1. Full URL is often the best single token to find the specific page.
  // 2. "site:youtube.com" + ID is very specific.
  // 3. Keywords like "transcript" help hint the intent.
  const searchQueries = videoId 
    ? [
        videoUrl,
        `site:youtube.com "${videoId}"`,
        `"${videoId}" video transcript`,
        `"${videoId}" youtube`
      ]
    : [videoUrl, "youtube video summary"];

  const prompt = `
    You are a professional research assistant.
    
    TARGET VIDEO:
    URL: ${videoUrl}
    ${videoId ? `ID: ${videoId}` : ''}
    
    GOAL: Summarize the content of the YouTube video found at this URL.
    
    STRICT INSTRUCTIONS:
    1.  **SEARCH & IDENTIFY**: 
        - Use the 'googleSearch' tool to gather information.
        - Prioritize finding the **Video Title**, **Channel Name**, and **Description**.
        - Look for transcript fragments, captions, or detailed reviews if the video page itself is not fully readable.

    2.  **EXTRACT & SYNTHESIZE**:
        - Synthesize a summary from the search results.
        - **VERIFICATION**: Ensure the summary matches the video identified by the ID/URL.
        - **FALLBACK**: If you cannot find a full transcript, use the video description, snippets, and any external coverage (reviews, blogs) to construct the best possible summary. 
        - Explicitly state if the summary is based on limited metadata (e.g., "Based on the video title and description...").
        - **DO NOT** return an error unless you absolutely cannot find ANY trace of the video existence.

    ${COMMON_PROMPT_INSTRUCTIONS}
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
    });

    const text = response.text || "No summary generated.";

    // Check for "I can't" responses which indicate failure despite instructions
    const lowerText = text.toLowerCase();
    if (text.length < 100 && (lowerText.includes("unable to") || lowerText.includes("sorry") || lowerText.includes("cannot find"))) {
         throw new Error("Unable to identify the video. It might be private, deleted, or valid search results were not found.");
    }
    
    // Extract sources from grounding metadata
    const chunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as any[];
    const sources: string[] = chunks
      .map((chunk: any) => chunk.web?.uri)
      .filter((uri: any): uri is string => typeof uri === 'string');

    const uniqueSources = [...new Set(sources)];

    return { text, sources: uniqueSources };
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    if (error.message.includes("Unable to identify")) {
        throw error;
    }
    throw new Error(error.message || "The AI service failed to generate a summary.");
  }
}