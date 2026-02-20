
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">Screeno</span>
            </div>
            <p className="text-slate-500 max-w-xs text-sm leading-relaxed mb-6">
              Empowering small and medium businesses with professional stock control and invoicing software. Modern tools for modern trade.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="hover:text-slate-900 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Updates</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Integrations</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="hover:text-slate-900 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Legal</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} Screeno Inc. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600">Terms of Service</a>
            <a href="#" className="hover:text-slate-600">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
