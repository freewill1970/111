import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { URLInput } from './components/URLInput';
import { SummaryDisplay } from './components/SummaryDisplay';
import { Loader } from './components/Loader';
import { summarizeVideo, summarizeText } from './services/geminiService';
import { fetchVideoMetadata, VideoMetadata } from './services/oembedService';
import { sampleTranscript } from './constants';

const App: React.FC = () => {
  const [summary, setSummary] = useState<string>('');
  const [sources, setSources] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store full metadata for display
  const [activeMetadata, setActiveMetadata] = useState<VideoMetadata | null>(null);

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
    setActiveMetadata(null);

    try {
      // Step 1: Attempt to fetch metadata (Title/Thumbnail)
      let currentMetadata: VideoMetadata | null = null;
      
      try {
        currentMetadata = await fetchVideoMetadata(url);
        if (currentMetadata) {
          setActiveMetadata(currentMetadata);
        }
      } catch (err) {
        console.warn("Could not fetch metadata, proceeding with raw URL", err);
      }

      // Step 2: Generate Summary using the specific title if available
      const result = await summarizeVideo(
        url, 
        currentMetadata?.title, 
        currentMetadata?.author_name
      );
      
      setSummary(result.text);
      setSources(result.sources);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to generate summary. The video might be private, unlisted, or search engines haven\'t indexed it yet.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSampleSummarize = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSummary('');
    setSources([]);
    setActiveMetadata({
      title: "Sample: Stellar Phone X Review",
      author_name: "TechFlow",
      thumbnail_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop"
    });

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
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans relative overflow-x-hidden selection:bg-red-500/30">
      
      {/* Decorative Background Blobs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-900/20 blur-[100px] rounded-full pointer-events-none -z-1"></div>
      
      <div className="flex flex-col items-center p-4 sm:p-8 md:p-12 relative z-10">
        <div className="w-full max-w-4xl mx-auto">
          <Header />
          <main className="mt-10 sm:mt-14">
            
            <URLInput onSubmit={handleSummarize} isLoading={isLoading} />
            
            {/* Try Sample Button */}
            <div className="mt-8 flex justify-center">
               {!summary && !isLoading && (
                  <button
                    onClick={handleSampleSummarize}
                    className="text-gray-500 hover:text-gray-300 text-sm font-medium transition-colors flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-800/50"
                  >
                    <span>No URL?</span>
                    <span className="underline decoration-gray-600 underline-offset-4 hover:decoration-gray-400">Try with a sample video</span>
                  </button>
               )}
            </div>

            {error && (
              <div className="mt-8 p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-center animate-fade-in backdrop-blur-sm">
                <p className="font-semibold text-red-400">Generation Failed</p>
                <p className="text-sm mt-1 text-red-300/80">{error}</p>
              </div>
            )}
            
            {isLoading && (
              <div className="flex flex-col items-center justify-center mt-16 animate-fade-in">
                <Loader />
                <div className="mt-6 text-center space-y-2">
                   <p className="text-xl font-medium text-gray-200">
                      {activeMetadata ? 'Analyzing Content' : 'Fetching Video Data'}
                   </p>
                   {activeMetadata && (
                       <p className="text-sm text-gray-400 max-w-md mx-auto truncate px-4">
                         {activeMetadata.title}
                       </p>
                   )}
                   <p className="text-xs text-gray-500 pt-2">Powered by Gemini 2.5</p>
                </div>
              </div>
            )}
            
            {summary && !isLoading && (
               <SummaryDisplay 
                  summary={summary} 
                  sources={sources} 
                  metadata={activeMetadata}
               />
            )}
          </main>
        </div>
         <footer className="w-full max-w-3xl mx-auto text-center text-gray-600 mt-20 pb-6 text-sm">
            <p>&copy; {new Date().getFullYear()} AI Research Assistant. All rights reserved.</p>
          </footer>
      </div>
    </div>
  );
};

export default App;