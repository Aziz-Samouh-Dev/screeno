import { Link } from '@inertiajs/react';
import type { AuthLayoutProps } from '@/types';
import { home } from '@/routes';
import AppLogoIcon from '@/components/app-logo-icon';
import { CheckCircle2 } from 'lucide-react';

const features = [
    'Gestion clients & ventes',
    'Stocks en temps réel',
    'Paiements & ledger FIFO',
    'Impression PDF professionnelle',
];

const kpiCards = [
    { label: 'CA mensuel',     value: '127K',  unit: 'MAD',     from: 'from-blue-500/30',   to: 'to-blue-400/10'   },
    { label: 'Encaissé',       value: '98K',   unit: 'MAD',     from: 'from-emerald-500/30', to: 'to-emerald-400/10' },
    { label: 'Clients actifs', value: '48',    unit: 'clients', from: 'from-violet-500/30',  to: 'to-violet-400/10'  },
    { label: 'Marge nette',    value: '29K',   unit: 'MAD',     from: 'from-orange-500/30',  to: 'to-orange-400/10'  },
];

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex force-light">

            {/* LEFT BRAND PANEL */}
            <div className="hidden lg:flex lg:w-120 xl:w-130 flex-col relative overflow-hidden bg-slate-900">
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-orange-500/20 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl" />
                <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-orange-400/10 blur-2xl" />

                {/* logo */}
                <div className="relative z-10 p-10">
                    <Link href={home()} className="inline-flex items-center gap-3">
                        <AppLogoIcon className="h-8 w-8 text-white" />
                        <span className="font-black text-white text-2xl font-mono uppercase tracking-wider">
                            Screeno
                        </span>
                    </Link>
                </div>

                {/* hero text */}
                <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pb-10">
                    <div className="mb-8">
                        <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4">
                            Gérez votre{' '}
                            <span className="bg-linear-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                                entreprise
                            </span>
                            <br />avec clarté.
                        </h1>
                        <p className="text-slate-400 text-base leading-relaxed">
                            La plateforme tout-en-un pour les PME marocaines.
                        </p>
                    </div>

                    {/* KPI preview cards */}
                    <div className="grid grid-cols-2 gap-2.5 mb-8">
                        {kpiCards.map(card => (
                            <div key={card.label}
                                className={`rounded-2xl bg-linear-to-br ${card.from} ${card.to} border border-white/10 p-3.5`}>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-1">{card.label}</p>
                                <p className="text-lg font-black font-mono text-white leading-none">{card.value}</p>
                                <p className="text-[10px] text-white/30 mt-0.5">{card.unit}</p>
                            </div>
                        ))}
                    </div>

                    <ul className="space-y-2.5">
                        {features.map(f => (
                            <li key={f} className="flex items-center gap-3 text-slate-300">
                                <div className="h-5 w-5 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="h-3 w-3 text-orange-400" />
                                </div>
                                <span className="text-sm">{f}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* bottom bar */}
                <div className="relative z-10 px-10 py-6 border-t border-white/10">
                    <p className="text-xs text-slate-500">© {new Date().getFullYear()} Screeno. Tous droits réservés.</p>
                </div>
            </div>

            {/* RIGHT FORM PANEL */}
            <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-12">

                {/* mobile logo */}
                <div className="lg:hidden mb-10 flex items-center gap-3">
                    <AppLogoIcon className="h-8 w-8 text-foreground" />
                    <span className="font-black text-2xl font-mono uppercase tracking-wider">Screeno</span>
                </div>

                <div className="w-full max-w-sm space-y-6">
                    <div className="space-y-1 text-center lg:text-left">
                        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
