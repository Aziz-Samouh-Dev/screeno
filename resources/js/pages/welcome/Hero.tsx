
import React from 'react';
import { ChevronRight } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold text-slate-600 mb-8 animate-fade-in">
          <span>v2.0 is now live</span>
          <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
          <span className="flex items-center hover:text-slate-900 cursor-pointer">
            Check what's new <ChevronRight className="w-3 h-3 ml-1" />
          </span>
        </div>

        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 gradient-text">
          Smart Stock & <br className="hidden md:block" /> Invoice Management
        </h1>

        <p className="max-w-2xl mx-auto text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed">
          The all-in-one platform for modern businesses to manage inventory, track invoices, and streamline operations with professional precision.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 hover:-translate-y-1 transition-all shadow-xl shadow-slate-200"
          >
            Login to Dashboard
          </button>
          <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-all">
            Learn More
          </button>
        </div>

        <div className="mt-16 relative">
          <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-2xl">
            <img
              src="https://picsum.photos/id/180/1200/600"
              alt="Screeno Dashboard Mockup"
              className="rounded-xl w-full grayscale opacity-80 mix-blend-multiply"
            />
            {/* Visual overlay for premium look */}
            <div className="absolute inset-0 bg-linear-to-t from-white/20 to-transparent rounded-xl pointer-events-none"></div>
          </div>

          {/* Background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full h-full max-w-4xl opacity-10 bg-linear-to-r from-slate-400 to-slate-100 blur-3xl rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
