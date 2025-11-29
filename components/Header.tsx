
import React from 'react';
import { YouTubeIcon } from './icons/YouTubeIcon';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="flex items-center justify-center gap-4">
        <YouTubeIcon className="h-12 w-12 text-red-600" />
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-400">
          YouTube Video Summarizer
        </h1>
      </div>
      <p className="mt-3 text-lg text-gray-400">
        Transform videos into concise documents with AI.
      </p>
    </header>
  );
};
