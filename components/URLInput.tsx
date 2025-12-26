import React, { useState } from 'react';

interface URLInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export const URLInput: React.FC<URLInputProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(url);
  };

  return (
    <div className={`relative group transition-all duration-300 ${isFocused ? 'scale-[1.01]' : ''}`}>
      {/* Background Glow Effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 blur-lg ${isLoading ? 'animate-pulse' : ''}`}></div>
      
      <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row items-stretch gap-2 bg-gray-900 p-2 rounded-xl border border-gray-800 shadow-2xl">
        <div className="flex-grow relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            </div>
            <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Paste YouTube Link here..."
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-4 bg-gray-800/50 text-white placeholder-gray-500 rounded-lg border border-transparent focus:bg-gray-800 focus:border-red-500/50 focus:ring-0 transition-all duration-200 text-base"
                required
            />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="sm:w-auto px-8 py-3 bg-gradient-to-br from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-500 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-red-900/30 flex items-center justify-center min-w-[140px]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Thinking...
            </span>
          ) : (
            'Summarize'
          )}
        </button>
      </form>
    </div>
  );
};