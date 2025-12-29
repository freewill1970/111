
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface SummaryResult {
  text: string;
  sources: string[];
}

const COMMON_PROMPT_INSTRUCTIONS = `
    FORMAT:
    - Markdown.
    - English section followed immediately by its Chinese translation for every block.
    - Title matches the video.

    STRUCTURE:
    # [Video Title]
    # [Chinese Title]
    
    ## 🎬 Visual & Content Summary / 视觉与内容概要
    [Detailed paragraph (approx 150 words).
    - If this is a Music Video, describe the Visual Plot/Story.
    - If Talk/Review/News: Summarize the main arguments and conclusions.]

    [Chinese Translation]

    ## 🗝️ Key Details / 核心细节
    * **[Point 1]** - [Chinese Translation]
    * **[Point 2]** - [Chinese Translation]
    * **[Point 3]** - [Chinese Translation]
    * **[Point 4]** - [Chinese Translation]
    * **[Point 5]** - [Chinese Translation]

    ## 📜 Detailed Content Record / 详细内容实录
    [This is a new, extremely detailed section. Reconstruct the video's content chronologically. 
    Provide a comprehensive "pseudo-transcript" or narrative record that covers all major sections, 
    demonstrations, and spoken points in the video. 
    Format this as a series of detailed paragraphs or a long bulleted list.]

    [Chinese Translation of the Detailed Content Record - provide a high-fidelity translation.]

    ## 💡 Deep Analysis / 深度解析
    [Paragraph: Cultural context, technical breakdown, or expert opinion.]
    
    [Chinese Translation]
`;

export async function summarizeText(text: string): Promise<SummaryResult> {
  const prompt = `
    You are a professional research assistant.
    
    SOURCE TEXT (TRANSCRIPT/CONTENT):
    ${text}
    
    GOAL: Provide a detailed record and summary of the provided text.
    
    ${COMMON_PROMPT_INSTRUCTIONS}
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
    });
    return { text: response.text || "No summary generated.", sources: ["Provided Transcript"] };
  } catch (error: any) {
    console.error("Error summarizing text:", error);
    throw new Error("Failed to summarize the transcript.");
  }
}

export async function summarizeVideo(videoUrl: string, videoTitle?: string, authorName?: string): Promise<SummaryResult> {
  const videoIdMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  
  const searchQueries = [];
  
  if (videoTitle) {
      searchQueries.push(`"${videoTitle}" ${authorName || ''} full content details`);
      searchQueries.push(`"${videoTitle}" step-by-step breakdown`);
      searchQueries.push(`"${videoTitle}" comprehensive review analysis`);
      searchQueries.push(`"${videoTitle}" video transcript summary`);
  }
  
  if (videoId) {
      searchQueries.push(`site:youtube.com "${videoId}"`);
      searchQueries.push(`"${videoId}" video detailed content`);
  }
  
  searchQueries.push(videoUrl);

  const prompt = `
    You are an Expert Content Analyst and Documentarian.
    
    TARGET CONTENT:
    - URL: ${videoUrl}
    - ID: ${videoId || 'Unknown'}
    - KNOWN TITLE: ${videoTitle || 'Unknown'}
    - AUTHOR: ${authorName || 'Unknown'}

    YOUR MISSION:
    Find the *actual content* of this video and record it in extreme detail. 
    I need a "Detailed Content Record" that acts like a written record of everything that happens in the video.

    INVESTIGATION PLAN (EXECUTE VIA GOOGLE SEARCH):
    1.  **EXECUTE SEARCHES**: Use queries to find transcripts, reviews, or deep-dive into this specific video.
    2.  **RECORD**: Reconstruct the video's sequence as accurately as possible.
    3.  **SYNTHESIZE**: Write a high-fidelity bilingual document.

    ${COMMON_PROMPT_INSTRUCTIONS}
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        },
    });

    const text = response.text;

    if (!text) {
        return { 
            text: "# Analysis Unavailable\n\nWe could not generate a summary at this time.", 
            sources: [] 
        };
    }
    
    const chunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as any[];
    const sources: string[] = chunks
      .map((chunk: any) => chunk.web?.uri)
      .filter((uri: any): uri is string => typeof uri === 'string');

    const uniqueSources = [...new Set(sources)];

    return { text, sources: uniqueSources };
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    throw new Error("AI analysis failed. Please ensure the link is public and accessible.");
  }
}

/**
 * Generates speech for the given text using Gemini TTS.
 * If isLiteral is true, it reads the text exactly as provided.
 */
export async function generateSpeech(text: string, isLiteral: boolean = false): Promise<string> {
  const sourceText = text.slice(0, 3000);

  const instruction = isLiteral 
    ? `Read the following text exactly as written, clearly and naturally: ${sourceText}`
    : `Read aloud a concise summary of this content in BOTH English and Chinese. Structure: First read a short English overview, then immediately read its Chinese translation. Keep the total duration under 90 seconds. Content: ${sourceText}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ 
        parts: [{ text: instruction }] 
      }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      throw new Error("No audio data returned from Gemini");
    }
    return audioData;
  } catch (error) {
    console.error("TTS Generation Error:", error);
    throw error;
  }
}
