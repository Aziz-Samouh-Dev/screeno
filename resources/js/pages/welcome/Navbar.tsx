import React from 'react';
import { Link } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';

interface NavbarProps {
  auth: any;
  canRegister?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ auth, canRegister = true }) => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Screeno</span>
          </div>

          <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it Works</a>
            <a href="#benefits" className="hover:text-slate-900 transition-colors">Benefits</a>
          </div>

          <div className="flex items-center space-x-4">
            {auth.user ? (
              <Link
                href={dashboard()}
                className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href={login()}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Log In
                </Link>
                {canRegister && (
                  <Link
                    href={register()}
                    className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-all"
                  >
                    Register
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
