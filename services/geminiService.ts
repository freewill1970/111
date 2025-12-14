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
    [Concise English Summary. If Music Video: Story of the video & Song Meaning.]
    
    [Chinese Translation]

    ## Key Highlights / 关键亮点
    * **[English Point]** - [Chinese Translation]
    * **[English Point]** - [Chinese Translation]
    * **[English Point]** - [Chinese Translation]

    ## Detailed Overview / 详细概览
    [English explanation of the content/plot]
    
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

export async function summarizeVideo(videoUrl: string, videoTitle?: string, authorName?: string): Promise<SummaryResult> {
  // Robust regex to extract YouTube Video ID
  const videoIdMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  
  // High Quality Search Queries
  // If we have the Title (from oEmbed), we search for the specific content topic.
  const searchQueries = [];
  
  if (videoTitle) {
      searchQueries.push(`"${videoTitle}" youtube video summary`);
      searchQueries.push(`"${videoTitle}" ${authorName || ''} lyrics meaning plot`);
      searchQueries.push(`"${videoTitle}" review analysis`);
  } else if (videoId) {
      searchQueries.push(`site:youtube.com "${videoId}"`);
      searchQueries.push(`"${videoId}" video content`);
  }
  searchQueries.push(videoUrl);

  const prompt = `
    You are an expert video content analyst.
    
    TARGET VIDEO:
    URL: ${videoUrl}
    ${videoId ? `ID: ${videoId}` : ''}
    ${videoTitle ? `TITLE: "${videoTitle}"` : ''}
    ${authorName ? `CHANNEL/ARTIST: "${authorName}"` : ''}
    
    TASK: Generate a comprehensive summary document of the video content.
    
    CRITICAL INSTRUCTION - CONTENT RECOGNITION:
    1.  **SEARCH**: Use the 'googleSearch' tool to gather details. Queries: ${searchQueries.join(', ')}
    2.  **VERIFY TITLE**: 
        ${videoTitle ? `We know the video title is "${videoTitle}". ensure your summary matches this specific topic.` : 'First, identify the exact video title from the search results.'}
    3.  **HANDLE CONTENT TYPES**:
        - **Music Video (MV)**: If the video is a song (e.g., Jay Chou, Pop Music), you **MUST** summarize the **Story/Plot told in the visual music video** AND the **Meaning/Lyrics** of the song. Do not complain about missing transcripts.
        - **Vlog/News/Tech**: Summarize the spoken content and visual demonstrations.
    4.  **FALLBACK**: If you find the video title/artist in search results, use that information to construct the summary even if you cannot "watch" the video directly.

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

    // Check for failure patterns
    const lowerText = text.toLowerCase();
    if (lowerText.includes("error: video_not_found") || (lowerText.includes("unable to") && text.length < 100)) {
         throw new Error("Unable to identify the video content. It might be private or blocked.");
    }
    
    // Extract sources
    const chunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as any[];
    const sources: string[] = chunks
      .map((chunk: any) => chunk.web?.uri)
      .filter((uri: any): uri is string => typeof uri === 'string');

    const uniqueSources = [...new Set(sources)];

    return { text, sources: uniqueSources };
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    throw new Error(error.message || "The AI service failed to generate a summary.");
  }
}