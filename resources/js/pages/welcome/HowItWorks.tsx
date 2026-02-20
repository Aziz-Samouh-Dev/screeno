
import React from 'react';

const steps = [
  {
    number: '01',
    title: 'Add your inventory',
    description: 'Import products via CSV or add them manually. Set your initial stock levels and reorder points.'
  },
  {
    number: '02',
    title: 'Create invoices',
    description: 'Generate sales or purchase invoices. Screeno automatically updates stock quantities in real-time.'
  },
  {
    number: '03',
    title: 'Track performance',
    description: 'Monitor payments, stock aging, and profitability through clean, intuitive dashboards.'
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-slate-800 rounded-full blur-3xl opacity-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mb-16">
          <h2 className="text-base font-semibold text-slate-400 uppercase tracking-widest mb-2">The Workflow</h2>
          <p className="text-4xl lg:text-5xl font-bold">Simplify your business lifecycle in three steps</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 lg:gap-20">
          {steps.map((step, idx) => (
            <div key={idx} className="relative group">
              <div className="text-8xl font-black text-slate-800 absolute -top-10 -left-4 select-none transition-colors group-hover:text-slate-700">
                {step.number}
              </div>
              <div className="relative pt-8">
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
