
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const benefits = [
  {
    title: 'Save time',
    description: 'Automate manual entry and focus on growing your business while we handle the arithmetic.'
  },
  {
    title: 'Reduce stock errors',
    description: 'Eliminate human error with precise barcode scanning support and automated deductions.'
  },
  {
    title: 'Financial visibility',
    description: 'Know exactly who owes you and who you owe with integrated payment tracking modules.'
  },
  {
    title: 'Intuitive workflow',
    description: 'No training required. A clean interface that feels familiar from day one for your whole team.'
  }
];

const Benefits: React.FC = () => {
  return (
    <section id="benefits" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-base font-semibold text-slate-500 uppercase tracking-widest mb-2">Why Screeno?</h2>
            <p className="text-4xl font-bold text-slate-900 mb-8 leading-tight">
              Built for businesses that <br /> demand professional clarity
            </p>

            <div className="space-y-8">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                  <div className="mt-1">
                    <CheckCircle2 className="w-6 h-6 text-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{benefit.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2 w-full">
            <div className="bg-slate-50 rounded-3xl p-8 lg:p-12 border border-slate-200 shadow-sm">
              <div className="space-y-6">
                <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-8 bg-slate-300 rounded w-full animate-pulse"></div>
                  <div className="h-8 bg-slate-300 rounded w-5/6 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>
                  <div className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>
                  <div className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>
                </div>
                <div className="h-32 bg-slate-100 rounded-xl animate-pulse"></div>
              </div>
              <p className="mt-8 text-center text-xs font-mono text-slate-400 uppercase tracking-widest">
                Optimized Interface Preview
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
