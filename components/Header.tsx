
import React from 'react';
import { YouTubeIcon } from './icons/YouTubeIcon';

export const Header: React.FC = () => {
  return (
    <header className="text-center relative z-10">
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="bg-gray-800 p-2 rounded-2xl shadow-xl shadow-red-900/20 border border-gray-700">
           <YouTubeIcon className="h-10 w-10 text-red-600" />
        </div>
      </div>
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-100 via-white to-gray-300">
          Video
        </span>{' '}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
          Documentarian
        </span>
      </h1>
      <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 font-light leading-relaxed">
        Transform YouTube links into <span className="text-gray-200 font-medium">comprehensive bilingual records</span> and detailed analysis summaries.
      </p>
    </header>
  );
};
