
import React from 'react';

interface CTAProps {
  onGetStarted: () => void;
}

const CTA: React.FC<CTAProps> = ({ onGetStarted }) => {
  return (
    <section className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-[3rem] p-12 lg:p-24 text-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl opacity-50 translate-x-1/2 translate-y-1/2"></div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8 leading-tight">
              Ready to take control of your operations?
            </h2>
            <p className="text-slate-400 text-lg mb-12 leading-relaxed">
              Join hundreds of business owners who trust Screeno for their daily stock and invoicing needs. Simple setup, zero friction.
            </p>
            <button
              onClick={onGetStarted}
              className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:bg-slate-100 hover:-translate-y-1 transition-all shadow-2xl shadow-black/20"
            >
              Access Your Dashboard
            </button>
            <p className="mt-6 text-slate-500 text-sm">
              Free 14-day trial. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
