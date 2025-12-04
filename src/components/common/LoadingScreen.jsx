import React from 'react';
import { PieChart } from 'lucide-react';

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center z-50">
    <div className="text-center">
      {/* Logo Animation */}
      <div className="relative mb-8">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center transform animate-pulse">
          <PieChart className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce delay-75"></div>
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-pink-400 rounded-full animate-bounce delay-150"></div>
      </div>
      
      {/* Loading Text */}
      <h2 className="text-3xl font-bold text-gray-800 mb-4">FairShare</h2>
      <p className="text-gray-600 mb-8">Making money simple</p>
      
      {/* Loading Animation */}
      <div className="flex items-center justify-center space-x-2">
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce delay-75"></div>
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce delay-150"></div>
      </div>
    </div>
  </div>
);

export default LoadingScreen;