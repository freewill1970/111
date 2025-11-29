import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { URLInput } from './components/URLInput';
import { SummaryDisplay } from './components/SummaryDisplay';
import { Loader } from './components/Loader';
import { summarizeVideo, summarizeText } from './services/geminiService';
import { sampleTranscript } from './constants';

const App: React.FC = () => {
  const [summary, setSummary] = useState<string>('');
  const [sources, setSources] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = useCallback(async (url: string) => {
    // Enhanced YouTube URL validation (supports mobile links)
    const youtubeRegex = /^(https?:\/\/)?((www|m)\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!url || !youtubeRegex.test(url)) {
      setError('Please enter a valid YouTube URL.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummary('');
    setSources([]);

    try {
      const result = await summarizeVideo(url);
      setSummary(result.text);
      setSources(result.sources);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to generate summary. The video might be private, very new, or inaccessible.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSampleSummarize = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSummary('');
    setSources([]);

    try {
      // Use the sample transcript from constants
      const result = await summarizeText(sampleTranscript);
      setSummary(result.text);
      setSources(result.sources);
    } catch (e: any) {
      console.error(e);
      setError('Failed to generate summary from sample.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-3xl mx-auto">
        <Header />
        <main className="mt-8">
          <p className="text-center text-gray-400 mb-6">
            Paste a YouTube video link below to get a structured summary using Gemini Search Grounding.
          </p>
          <URLInput onSubmit={handleSummarize} isLoading={isLoading} />
          
          <div className="mt-6 flex flex-col items-center gap-2">
            <span className="text-gray-500 text-sm">Don't have a URL?</span>
            <button
              onClick={handleSampleSummarize}
              disabled={isLoading}
              className="px-5 py-2.5 bg-gray-800 hover:bg-gray-750 text-gray-300 text-sm font-medium rounded-lg border border-gray-700 hover:border-gray-600 transition-all disabled:opacity-50 flex items-center gap-2 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Try with a Sample Video
            </button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg text-center animate-fade-in">
              {error}
            </div>
          )}
          {isLoading && (
            <div className="flex flex-col items-center justify-center mt-10">
              <Loader />
              <p className="mt-4 text-lg text-gray-400 animate-pulse">Researching video content...</p>
            </div>
          )}
          {summary && !isLoading && (
             <SummaryDisplay summary={summary} sources={sources} />
          )}
        </main>
      </div>
       <footer className="w-full max-w-3xl mx-auto text-center text-gray-600 mt-12 pb-4">
          <p>&copy; {new Date().getFullYear()} YouTube Summarizer. Powered by Gemini.</p>
        </footer>
    </div>
  );
};

export default App;