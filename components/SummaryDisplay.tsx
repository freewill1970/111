
import React, { useState, useCallback } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { VideoMetadata } from '../services/oembedService';
import { generateSpeech } from '../services/geminiService';
import { playRawPcm, stopPlayback } from '../services/audioService';

interface SummaryDisplayProps {
  summary: string;
  sources: string[];
  metadata: VideoMetadata | null;
}

export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary, sources, metadata }) => {
  const [copied, setCopied] = useState(false);
  const [isFullReading, setIsFullReading] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [readingIndex, setReadingIndex] = useState<number | null>(null);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [summary]);

  const readText = async (text: string, index: number | 'full') => {
    // Stop current playback immediately if clicking the same thing
    if (readingIndex === index || (index === 'full' && isFullReading)) {
        stopPlayback();
        setReadingIndex(null);
        setIsFullReading(false);
        return;
    }

    // Prepare for new playback
    stopPlayback();
    setReadingIndex(null);
    setIsFullReading(false);
    
    // Immediate UI feedback
    if (index === 'full') setIsTtsLoading(true);
    else setLoadingIndex(index);

    try {
      // Stripping markdown for cleaner TTS
      const cleanText = text.replace(/[*_#]/g, '');
      const audioBase64 = await generateSpeech(cleanText, index !== 'full');
      
      // Update states once audio is ready
      if (index === 'full') {
          setIsTtsLoading(false);
          setIsFullReading(true);
      } else {
          setLoadingIndex(null);
          setReadingIndex(index);
      }
      
      await playRawPcm(audioBase64);
      
      // Reset after playback ends
      if (index === 'full') setIsFullReading(false);
      else setReadingIndex(null);
    } catch (error) {
      console.error("TTS Failed:", error);
      setIsTtsLoading(false);
      setLoadingIndex(null);
      setReadingIndex(null);
      setIsFullReading(false);
    }
  };

  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-red-300 font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderSummary = (text: string) => {
    return text.split('\n').filter(line => line.trim() !== '').map((line, index) => {
      const isReading = readingIndex === index;
      const isLoading = loadingIndex === index;
      
      const commonClasses = `group relative cursor-pointer rounded-lg transition-all duration-300 px-3 -mx-3 py-1 hover:bg-white/5 border border-transparent ${
        isReading ? 'bg-red-500/10 border-red-500/30 ring-1 ring-red-500/20 shadow-lg shadow-red-500/5' : ''
      } ${isLoading ? 'opacity-70 bg-orange-500/5 border-orange-500/20' : ''}`;

      const speakerOverlay = (
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-gray-900/90 backdrop-blur px-2 py-1 rounded border border-gray-700 pointer-events-none shadow-xl z-20`}>
             {isLoading ? (
                <svg className="animate-spin h-3 w-3 text-orange-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
             ) : (
                <SpeakerIcon className={`h-3 w-3 ${isReading ? 'text-red-400 animate-pulse' : 'text-gray-400'}`} />
             )}
             <span className="text-[10px] font-bold text-gray-300 uppercase">
               {isLoading ? 'Preparing...' : isReading ? 'Playing' : 'Click to Read'}
             </span>
        </div>
      );

      if (line.startsWith('## ')) {
        const title = line.substring(3);
        const isDetailedRecord = title.includes('Detailed Content Record') || title.includes('详细内容实录');
        return (
            <div key={index} 
                 onClick={() => readText(line, index)}
                 className={`${commonClasses} mt-10 mb-6 border-l-4 ${isDetailedRecord ? 'border-orange-500' : 'border-red-500'} pl-4 py-1`}>
                <h2 className={`text-xl sm:text-2xl font-bold ${isDetailedRecord ? 'text-orange-100' : 'text-white'} tracking-wide`}>
                    {parseBold(title)}
                </h2>
                {speakerOverlay}
            </div>
        );
      }
      if (line.startsWith('# ')) {
        return (
            <div key={index} 
                 onClick={() => readText(line, index)}
                 className={commonClasses}>
                <h1 className="text-2xl sm:text-4xl font-extrabold mt-8 mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400">
                    {parseBold(line.substring(2))}
                </h1>
                {speakerOverlay}
            </div>
        );
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return (
            <li key={index} 
                onClick={() => readText(line, index)}
                className={`${commonClasses} ml-4 pl-2 list-none relative mb-3 text-gray-300`}>
                <span className="absolute left-[-1.5rem] top-[0.6rem] w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                <span className="leading-relaxed">{parseBold(line.substring(2))}</span>
                {speakerOverlay}
            </li>
        );
      }
      
      const isChinese = /[\u4e00-\u9fa5]/.test(line);
      return (
        <div key={index} 
             onClick={() => readText(line, index)}
             className={commonClasses}>
            <p className={`my-3 leading-8 ${isChinese ? 'text-gray-400 text-base font-light' : 'text-gray-200 text-lg'}`}>
                {parseBold(line)}
            </p>
            {speakerOverlay}
        </div>
      );
    });
  };

  return (
    <div className="mt-12 animate-slide-up">
      {/* Video Metadata Header */}
      {metadata && (
        <div className="mb-6 flex flex-col sm:flex-row items-center gap-6 bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
            {metadata.thumbnail_url && (
              <div className="relative group shrink-0">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                  <img 
                    src={metadata.thumbnail_url} 
                    alt="Video Thumbnail" 
                    className="relative w-40 h-24 sm:w-48 sm:h-28 object-cover rounded-lg shadow-2xl border border-gray-700"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/50 rounded-full p-2 backdrop-blur-sm border border-white/20">
                           <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                      </div>
                  </div>
              </div>
            )}
            <div className="text-center sm:text-left flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-100 truncate">{metadata.title}</h3>
                <p className="text-sm text-gray-400 mt-1 flex items-center justify-center sm:justify-start gap-2">
                    <span className="truncate">{metadata.author_name}</span>
                    <span className="w-1 h-1 bg-gray-600 rounded-full shrink-0"></span>
                    <span className="text-red-400 font-medium shrink-0">Analysis Ready</span>
                </p>
            </div>
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 bg-gray-900/50">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-red-500/80 animate-pulse"></div>
             <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
             <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
             <span className="ml-3 text-[10px] font-mono text-gray-500 uppercase tracking-widest hidden sm:inline">
                Click any paragraph to start reading
             </span>
           </div>
           
           <div className="flex items-center gap-3">
             <button
               onClick={() => readText(summary, 'full')}
               disabled={isTtsLoading}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                   isFullReading 
                   ? 'bg-red-900/30 border-red-700 text-red-400 ring-2 ring-red-500/20' 
                   : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
               } disabled:opacity-50`}
             >
               {isTtsLoading ? (
                 <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                 </svg>
               ) : (
                 <SpeakerIcon className={`h-4 w-4 ${isFullReading ? 'animate-pulse' : ''}`} />
               )}
               {isTtsLoading ? 'Generating...' : isFullReading ? 'Stop Reading' : 'Full Summary'}
             </button>

             <button
               onClick={handleCopy}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                   copied 
                   ? 'bg-green-900/30 border-green-700 text-green-400' 
                   : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
               }`}
             >
               {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
               {copied ? 'Copied' : 'Copy Text'}
             </button>
           </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-10">
            <article className="prose prose-invert max-w-none">
                {renderSummary(summary)}
            </article>
        </div>

        {/* Sources Footer */}
        {sources.length > 0 && (
          <div className="bg-gray-900/80 p-6 border-t border-gray-700/50">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Grounding Sources
            </h3>
            <div className="flex flex-wrap gap-2">
              {sources.map((url, idx) => {
                  try {
                      const domain = new URL(url).hostname.replace('www.', '');
                      return (
                        <a 
                          key={idx}
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-xs text-blue-400 hover:text-blue-300 transition-colors truncate max-w-[200px]"
                        >
                          <img src={`https://www.google.com/s2/favicons?domain=${domain}`} alt="" className="w-3 h-3 opacity-70"/>
                          <span className="truncate">{domain}</span>
                        </a>
                      );
                  } catch (e) { return null; }
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
