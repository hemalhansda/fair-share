import React from 'react';
import { 
  ArrowRight, 
  Zap, 
  PieChart, 
  ChevronLeft, 
  ChevronRight, 
  Play 
} from 'lucide-react';

const LandingPage = ({ 
  handleGoogleLogin, 
  isGoogleLoading, 
  setShowLanding, 
  currentSlide, 
  setCurrentSlide, 
  featureSlides 
}) => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
    {/* Header */}
    <header className="relative z-10 px-6 py-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">FairShare</h1>
        </div>
        <button
          onClick={() => setShowLanding(false)}
          className="px-6 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-gray-600 hover:bg-white transition-all duration-200"
        >
          Skip Intro
        </button>
      </div>
    </header>

    {/* Hero Section */}
    <main className="relative px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Hero Content */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Split expenses like a pro
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Money made
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent"> simple</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Split bills, track expenses, and settle up with friends. The easiest way to manage shared expenses.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex justify-center items-center mb-16">
            {isGoogleLoading ? (
              <div className="flex items-center gap-3 px-8 py-4">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-gray-600">Signing in...</span>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="group px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-lg hover:border-gray-300 hover:shadow-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Feature Slides */}
        <div className="relative">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl p-8 md:p-12 overflow-hidden">
            {/* Slide Navigation */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex space-x-2">
                {featureSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-12 h-1.5 rounded-full transition-all duration-300 ${
                      index === currentSlide ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + featureSlides.length) % featureSlides.length)}
                  className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % featureSlides.length)}
                  className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slide Content */}
            <div className="relative h-80 overflow-hidden rounded-2xl">
              {featureSlides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-500 transform ${
                    index === currentSlide 
                      ? 'translate-x-0 opacity-100' 
                      : index < currentSlide 
                        ? '-translate-x-full opacity-0' 
                        : 'translate-x-full opacity-0'
                  }`}
                >
                  <div className={`h-full bg-gradient-to-br ${slide.gradient} rounded-2xl p-8 md:p-12 text-white relative overflow-hidden`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-10 right-10 w-32 h-32 border-2 border-white rounded-full"></div>
                      <div className="absolute bottom-10 left-10 w-20 h-20 border border-white rounded-full"></div>
                      <div className="absolute top-1/2 left-1/2 w-40 h-40 border border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col justify-center">
                      <div className="text-6xl mb-6">{slide.icon}</div>
                      <h3 className="text-3xl md:text-4xl font-bold mb-4">{slide.title}</h3>
                      <p className="text-lg md:text-xl opacity-90 leading-relaxed max-w-md">{slide.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-8">
              <p className="text-gray-600 mb-4">Ready to get started?</p>
              <button
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                {isGoogleLoading ? 'Signing in...' : 'Start Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);

export default LandingPage;