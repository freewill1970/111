import React, { useState, useCallback } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

interface SummaryDisplayProps {
  summary: string;
  sources: string[];
}

export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary, sources }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [summary]);
  
  // Helper to parse bold markdown syntax (**text**) into React elements
  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-gray-100">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderSummary = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-bold mt-4 mb-2 text-red-400">{parseBold(line.substring(3))}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold mt-6 mb-3 text-red-500">{parseBold(line.substring(2))}</h1>;
      }
      if (line.startsWith('* ')) {
        return <li key={index} className="ml-6 list-disc mb-1">{parseBold(line.substring(2))}</li>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-6 list-disc mb-1">{parseBold(line.substring(2))}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="my-2">{parseBold(line)}</p>;
    });
  };

  return (
    <div className="mt-8 bg-gray-800/50 border border-gray-700 rounded-xl shadow-lg relative flex flex-col overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/80">
        <h2 className="text-xl font-bold text-gray-200">Generated Summary (Bilingual)</h2>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-all text-sm flex items-center gap-2"
        >
          {copied ? <CheckIcon className="h-4 w-4 text-green-400" /> : <CopyIcon className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      
      <div className="p-4 sm:p-6 text-gray-300 leading-relaxed prose prose-invert max-w-none">
        {renderSummary(summary)}
      </div>

      {sources.length > 0 && (
        <div className="bg-gray-900/50 border-t border-gray-700 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Sources & Citations</h3>
          <ul className="space-y-1">
            {sources.map((url, idx) => (
              <li key={idx}>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-red-400 hover:text-red-300 hover:underline truncate block"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};