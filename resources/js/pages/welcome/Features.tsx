
import React from 'react';
import {
  Package,
  FileText,
  ShoppingCart,
  Users,
  CreditCard,
  RefreshCcw
} from 'lucide-react';

const features = [
  {
    title: 'Product & Stock Management',
    description: 'Keep track of every item across multiple locations with real-time stock alerts and batch tracking.',
    icon: Package
  },
  {
    title: 'Sales Invoices',
    description: 'Generate professional PDF invoices in seconds. Automated tax calculations and multi-currency support.',
    icon: FileText
  },
  {
    title: 'Purchase Invoices',
    description: 'Streamline procurement by converting purchase orders into invoices and tracking supplier debts.',
    icon: ShoppingCart
  },
  {
    title: 'Client & Supplier Management',
    description: 'Centralized directory for all your business relationships with transaction history and credit limits.',
    icon: Users
  },
  {
    title: 'Payments Tracking',
    description: 'Monitor cash flow with automated payment status tracking for both sales and purchases.',
    icon: CreditCard
  },
  {
    title: 'Returns & History',
    description: 'Easily handle product returns and access a complete audit trail of every stock movement.',
    icon: RefreshCcw
  }
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-base font-semibold text-slate-500 uppercase tracking-widest mb-2">Capabilities</h2>
          <p className="text-3xl lg:text-4xl font-bold text-slate-900">Powerful tools for serious growth</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="group p-8 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
