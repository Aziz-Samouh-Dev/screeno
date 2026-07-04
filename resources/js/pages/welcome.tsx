import { Head, Link, usePage } from '@inertiajs/react';
import {
    Package, Users, Truck, RotateCcw, CreditCard, BarChart3,
    Warehouse, TrendingUp, Activity, ArrowRight, CheckCircle2,
    Shield, Zap, Globe, Receipt, User, ChevronRight,
    AlertTriangle, CircleCheck, FileText,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';

interface Auth { user?: { name: string } }

export default function Welcome() {
    const { auth } = usePage().props as { auth: Auth };

    const href = auth?.user ? '/dashboard' : '/login';
    const ctaLabel = auth?.user ? 'Accéder à la plateforme' : 'Se connecter';

    return (
        <>
            <Head title="Screeno · Gestion d'entreprise moderne" />
            <div className="force-light min-h-screen bg-white font-sans antialiased">

                {/* ── NAV ──────────────────────────────────────────── */}
                <header className="fixed top-0 inset-x-0 z-50 h-16 flex items-center justify-between px-6 md:px-12 backdrop-blur-xl bg-white/90 border-b border-slate-100">
                    <Link href="/" className="flex items-center gap-2.5">
                        <AppLogoIcon className="h-7 w-7 text-slate-900" />
                        <span className="font-black text-slate-900 text-lg font-mono uppercase tracking-wider">Screeno</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                        <a href="#platform" className="px-3.5 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all">Plateforme</a>
                        <a href="#analytics" className="px-3.5 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all">Analyses</a>
                        <a href="#how"       className="px-3.5 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all">Démarrage</a>
                    </nav>
                    <Link href={href}
                        className="flex items-center gap-2 rounded-xl bg-linear-to-r from-orange-500 to-amber-400 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-[1.02] transition-all">
                        {ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </header>

                {/* ── HERO ─────────────────────────────────────────── */}
                <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
                    <div className="absolute top-0 right-0 w-200 h-200 rounded-full bg-linear-to-bl from-orange-100 via-amber-50 to-transparent blur-3xl opacity-80 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-linear-to-tr from-slate-100 to-transparent blur-3xl pointer-events-none" />

                    <div className="relative w-full max-w-7xl mx-auto px-6 md:px-12 py-16">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 xl:gap-20 items-center">

                            {/* Copy */}
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 border border-orange-200 px-4 py-1.5 text-xs font-black text-orange-600 mb-8 uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                    Plateforme PME marocaine
                                </div>

                                <h1 className="text-5xl xl:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6">
                                    Gérez votre<br />
                                    <span className="bg-linear-to-r from-orange-500 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                                        entreprise
                                    </span>
                                    <br />avec clarté.
                                </h1>

                                <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-md">
                                    Stocks, clients, fournisseurs et paiements. Tout dans une seule interface.
                                    Rapide, clair, conçu pour le marché marocain.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3 mb-12">
                                    <Link href={href}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-amber-400 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-orange-200/60 hover:shadow-2xl hover:scale-[1.02] transition-all">
                                        {ctaLabel} <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <a href="#platform"
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 hover:bg-slate-200 px-7 py-3.5 text-base font-semibold text-slate-700 transition-all">
                                        Découvrir la plateforme
                                    </a>
                                </div>

                                <div className="flex flex-wrap gap-5">
                                    {[
                                        { icon: Shield, label: 'Données sécurisées' },
                                        { icon: Zap,    label: 'Interface rapide'   },
                                        { icon: Globe,  label: 'Accès partout'      },
                                    ].map(({ icon: Icon, label }) => (
                                        <div key={label} className="flex items-center gap-1.5 text-sm text-slate-500">
                                            <Icon className="h-4 w-4 text-orange-400" strokeWidth={1.5} />
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* App preview */}
                            <div className="relative hidden lg:block">
                                <div className="absolute inset-0 scale-90 rounded-3xl bg-linear-to-br from-orange-200 to-amber-100 blur-3xl opacity-50" />
                                <div className="relative rounded-3xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden">
                                    <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 border-b border-slate-100">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                                        <div className="ml-4 flex-1 bg-white rounded-md px-3 py-1 text-[11px] text-slate-400 font-mono">screeno.app/dashboard</div>
                                    </div>
                                    <div className="p-4 bg-slate-50/40">
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            {[
                                                { label: 'CA mensuel',     value: '127.4K', unit: 'MAD',     g: 'bg-linear-to-br from-blue-500 to-blue-700'       },
                                                { label: 'Encaissé',       value: '98.2K',  unit: 'MAD',     g: 'bg-linear-to-br from-emerald-500 to-emerald-700' },
                                                { label: 'Clients actifs', value: '48',     unit: 'clients', g: 'bg-linear-to-br from-violet-500 to-violet-700'   },
                                                { label: 'Marge nette',    value: '29.2K',  unit: 'MAD',     g: 'bg-linear-to-br from-orange-500 to-orange-700'   },
                                            ].map(c => (
                                                <div key={c.label} className={`${c.g} rounded-xl p-3`}>
                                                    <p className="text-[8px] font-bold uppercase tracking-widest text-white/60 mb-1">{c.label}</p>
                                                    <p className="text-xl font-black font-mono text-white leading-none">{c.value}</p>
                                                    <p className="text-[8px] text-white/50 mt-0.5">{c.unit}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="rounded-xl bg-white border border-slate-100 overflow-hidden">
                                            <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                                                <Activity className="h-3 w-3 text-slate-400" strokeWidth={1.5} />
                                                <span className="text-[10px] font-semibold text-slate-500">Activité récente</span>
                                            </div>
                                            {[
                                                { type: 'Vente',    client: 'TechMaroc SARL', amount: '31.0K', dot: 'bg-indigo-500',  time: '2min' },
                                                { type: 'Paiement', client: 'Atlas Équip.',   amount: '12.5K', dot: 'bg-emerald-500', time: '1h'   },
                                                { type: 'Retour',   client: 'SudTech',        amount: '4.2K',  dot: 'bg-red-500',     time: '3h'   },
                                            ].map((tx, i) => (
                                                <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-slate-50 last:border-0">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${tx.dot} shrink-0`} />
                                                    <span className="text-[10px] font-bold text-slate-500 w-14 shrink-0">{tx.type}</span>
                                                    <span className="text-[10px] text-slate-700 font-medium flex-1 truncate">{tx.client}</span>
                                                    <span className="text-[10px] font-mono font-bold text-slate-800 shrink-0">{tx.amount}</span>
                                                    <span className="text-[9px] text-slate-400 w-6 text-right shrink-0">{tx.time}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -top-3 -right-5 bg-white rounded-2xl shadow-xl border border-slate-100 px-3.5 py-2 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-bold text-slate-700">Stock en temps réel</span>
                                </div>
                                <div className="absolute -bottom-3 -left-5 bg-linear-to-r from-orange-500 to-amber-400 rounded-2xl shadow-lg px-3.5 py-2 flex items-center gap-2">
                                    <TrendingUp className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                                    <span className="text-xs font-bold text-white">+12% ce mois</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── STATS ────────────────────────────────────────── */}
                <section className="border-y border-slate-100 bg-slate-50 py-12 px-6">
                    <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { value: '9',    label: 'Modules intégrés'     },
                            { value: '500+', label: 'Transactions traitées' },
                            { value: '50+',  label: 'Clients actifs'        },
                            { value: '100%', label: 'Données sécurisées'   },
                        ].map(s => (
                            <div key={s.label}>
                                <p className="text-3xl md:text-4xl font-black text-slate-900 font-mono">{s.value}</p>
                                <p className="text-sm text-slate-500 mt-1.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── PLATFORM OVERVIEW ────────────────────────────── */}
                <section id="platform" className="py-28 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-20">
                            <p className="text-xs font-black uppercase tracking-widest text-orange-500 mb-3">Plateforme complète</p>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Toute votre activité,<br />un seul outil</h2>
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                                9 modules interconnectés couvrent l'ensemble des besoins d'une PME marocaine.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[
                                { icon: BarChart3,  n:'01', title: 'Tableau de bord',      desc: "Vue d'ensemble live : ventes, paiements, stock et top clients.",                     color: 'text-indigo-500',  bg: 'bg-indigo-50',  hb: 'hover:border-indigo-200'  },
                                { icon: Users,      n:'02', title: 'Clients & Ventes',      desc: 'Fiches clients, ventes multi-produits, PDF et soldes en temps réel.',               color: 'text-emerald-500', bg: 'bg-emerald-50', hb: 'hover:border-emerald-200' },
                                { icon: Truck,      n:'03', title: 'Fournisseurs',          desc: 'Gestion des contacts, achats, paiements et historiques fournisseurs.',              color: 'text-violet-500',  bg: 'bg-violet-50',  hb: 'hover:border-violet-200'  },
                                { icon: Package,    n:'04', title: 'Produits & Stock',      desc: 'Catalogue SKU, alertes stock faible, mouvements automatiques, vue grille.',         color: 'text-amber-500',   bg: 'bg-amber-50',   hb: 'hover:border-amber-200'   },
                                { icon: RotateCcw,  n:'05', title: 'Retours clients',       desc: 'Retours en stock sain ou endommagé, par article avec traçabilité complète.',        color: 'text-rose-500',    bg: 'bg-rose-50',    hb: 'hover:border-rose-200'    },
                                { icon: CreditCard, n:'06', title: 'Paiements & Ledger',    desc: 'Encaissements FIFO automatique, méthodes multiples, grand livre client.',           color: 'text-sky-500',     bg: 'bg-sky-50',     hb: 'hover:border-sky-200'     },
                                { icon: TrendingUp, n:'07', title: 'Finances',              desc: 'KPIs mensuel, CA, dépenses, marge, répartition et évolution des flux.',            color: 'text-blue-500',    bg: 'bg-blue-50',    hb: 'hover:border-blue-200'    },
                                { icon: Receipt,    n:'08', title: 'Charges',               desc: "Suivi des charges d'exploitation avec catégories, montants et historique.",        color: 'text-orange-500',  bg: 'bg-orange-50',  hb: 'hover:border-orange-200'  },
                                { icon: User,       n:'09', title: 'Employés',              desc: 'Gestion RH basique : fiches employés, postes, contacts et historique.',            color: 'text-teal-500',    bg: 'bg-teal-50',    hb: 'hover:border-teal-200'    },
                            ].map(({ icon: Icon, n, title, desc, color, bg, hb }) => (
                                <div key={n} className={`group rounded-3xl border border-slate-100 bg-white p-7 ${hb} hover:shadow-lg transition-all duration-300`}>
                                    <div className="flex items-start justify-between mb-5">
                                        <div className={`h-11 w-11 rounded-2xl ${bg} flex items-center justify-center`}>
                                            <Icon className={`h-5 w-5 ${color}`} strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[11px] font-black text-slate-200 font-mono">{n}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-base mb-2">{title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── SPOTLIGHT: ANALYTICS ─────────────────────────── */}
                <section id="analytics" className="py-28 px-6 bg-slate-50 overflow-hidden">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-blue-500 mb-3">Finances & Analyses</p>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-5 leading-tight">
                                Pilotez avec<br />des données réelles
                            </h2>
                            <p className="text-slate-500 leading-relaxed mb-8">
                                Le module Finances vous donne une vision complète de votre activité mensuelle :
                                chiffre d'affaires, dépenses, marge nette et répartition des flux.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {[
                                    'KPIs mensuels avec navigation mois par mois',
                                    'Graphique d\'évolution des flux en temps réel',
                                    'Répartition des sorties par catégorie',
                                    'Soldes clients et fournisseurs intégrés',
                                ].map(item => (
                                    <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                                        <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" strokeWidth={2} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href={href} className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                                Voir le tableau de bord <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {/* Finance mock */}
                        <div className="relative">
                            <div className="absolute inset-0 scale-95 rounded-3xl bg-linear-to-br from-blue-100 to-indigo-50 blur-2xl opacity-60" />
                            <div className="relative rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Finances · Juillet 2025</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Vue mensuelle</p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
                                        <span className="text-[10px] font-bold text-slate-500">Juil 2025</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="grid grid-cols-2 gap-2.5 mb-4">
                                        {[
                                            { label: 'Résultat net',   value: '29.2K', unit: 'MAD', g: 'bg-linear-to-br from-blue-500 to-blue-700'       },
                                            { label: "Chiffre d'aff.", value: '127K',  unit: 'MAD', g: 'bg-linear-to-br from-emerald-500 to-emerald-700' },
                                            { label: 'Dépenses',       value: '98K',   unit: 'MAD', g: 'bg-linear-to-br from-orange-500 to-orange-700'   },
                                            { label: 'Marge brute',    value: '23%',   unit: '',    g: 'bg-linear-to-br from-violet-500 to-violet-700'   },
                                        ].map(c => (
                                            <div key={c.label} className={`${c.g} rounded-xl p-3`}>
                                                <p className="text-[8px] font-bold uppercase tracking-widest text-white/60 mb-1">{c.label}</p>
                                                <p className="text-lg font-black font-mono text-white leading-none">{c.value}</p>
                                                {c.unit && <p className="text-[8px] text-white/50 mt-0.5">{c.unit}</p>}
                                            </div>
                                        ))}
                                    </div>
                                    {/* mini chart bars */}
                                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                                        <p className="text-[10px] font-bold text-slate-500 mb-2.5 uppercase tracking-wider">Évolution mensuelle</p>
                                        <div className="flex items-end gap-1.5 h-14">
                                            {[40, 65, 45, 80, 55, 90, 70, 100, 75, 85, 60, 95].map((h, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                                    <div className="w-full rounded-sm bg-linear-to-t from-blue-500 to-blue-400 opacity-80"
                                                        style={{ height: `${h}%` }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SPOTLIGHT: CLIENTS ───────────────────────────── */}
                <section className="py-28 px-6 overflow-hidden">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

                        {/* Client mock */}
                        <div className="relative order-2 lg:order-1">
                            <div className="absolute inset-0 scale-95 rounded-3xl bg-linear-to-br from-emerald-100 to-teal-50 blur-2xl opacity-60" />
                            <div className="relative rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-emerald-50">
                                            <Users className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Clients</p>
                                            <p className="text-xs text-slate-400">48 clients actifs</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">+3 ce mois</span>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {[
                                        { name: 'TechMaroc SARL',   city: 'Casablanca', balance: '31.0K', badge: 'bg-indigo-100 text-indigo-700' },
                                        { name: 'Atlas Équipement', city: 'Rabat',       balance: '12.5K', badge: 'bg-emerald-100 text-emerald-700' },
                                        { name: 'SudTech',          city: 'Marrakech',   balance: '8.2K',  badge: 'bg-violet-100 text-violet-700' },
                                        { name: 'Nord Distrib.',    city: 'Tanger',      balance: '5.9K',  badge: 'bg-amber-100 text-amber-700' },
                                    ].map((c, i) => (
                                        <div key={i} className="flex items-center gap-3 px-5 py-3">
                                            <div className={`h-8 w-8 rounded-xl ${c.badge} flex items-center justify-center text-[10px] font-black shrink-0`}>
                                                {c.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                                                <p className="text-[10px] text-slate-400">{c.city}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-mono font-bold text-slate-800">{c.balance}</p>
                                                <p className="text-[9px] text-slate-400">MAD</p>
                                            </div>
                                            <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                                        </div>
                                    ))}
                                </div>
                                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                                        <span>Solde total clients</span>
                                        <span className="font-mono font-bold text-slate-800">57.6K MAD</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <p className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-3">Clients & Ventes</p>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-5 leading-tight">
                                Votre portefeuille<br />clients, au complet
                            </h2>
                            <p className="text-slate-500 leading-relaxed mb-8">
                                Gérez l'intégralité de votre relation client : ventes, retours, paiements et soldes,
                                tout est centralisé dans une fiche client complète avec grand livre.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {[
                                    'Fiches clients avec historique complet',
                                    'Ventes multi-produits avec génération PDF',
                                    'Paiements FIFO et distribution automatique',
                                    'Export CSV pour vos comptables',
                                ].map(item => (
                                    <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href={href} className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                                Explorer la gestion clients <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── SPOTLIGHT: STOCK ─────────────────────────────── */}
                <section className="py-28 px-6 bg-slate-50 overflow-hidden">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-amber-500 mb-3">Produits & Stock</p>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-5 leading-tight">
                                Votre inventaire<br />sous contrôle
                            </h2>
                            <p className="text-slate-500 leading-relaxed mb-8">
                                Suivez chaque produit en temps réel. Les stocks se mettent à jour automatiquement
                                à chaque vente, retour ou achat fournisseur.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {[
                                    'Catalogue avec SKU, prix et stock disponible',
                                    'Alertes automatiques stock faible (≤ 5 unités)',
                                    'Mouvements traçables (ventes, retours, achats)',
                                    'Vue grille ou liste selon vos préférences',
                                ].map(item => (
                                    <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                                        <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" strokeWidth={2} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href={href} className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors">
                                Voir la gestion des stocks <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {/* Stock mock */}
                        <div className="relative">
                            <div className="absolute inset-0 scale-95 rounded-3xl bg-linear-to-br from-amber-100 to-yellow-50 blur-2xl opacity-60" />
                            <div className="relative rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-amber-50">
                                            <Package className="h-4 w-4 text-amber-600" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Produits</p>
                                            <p className="text-xs text-slate-400">20 articles actifs</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                                        <span className="text-xs font-bold text-orange-500">7 alertes</span>
                                    </div>
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-2.5">
                                    {[
                                        { name: 'Asus VivoBook 15', sku: 'ASU-LAP-004', stock: 6,  warn: false },
                                        { name: 'HP LaserJet M404', sku: 'HP-IMP-010',  stock: 5,  warn: false },
                                        { name: 'Dell Inspiron 15', sku: 'DEL-LAP-002', stock: 3,  warn: true  },
                                        { name: 'Canon iP2870',     sku: 'CAN-IMP-001', stock: 0,  warn: true  },
                                    ].map((p, i) => (
                                        <div key={i} className="rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
                                            <div className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold mb-2 ${
                                                p.warn ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                {p.warn ? <AlertTriangle className="h-2.5 w-2.5" /> : <CircleCheck className="h-2.5 w-2.5" />}
                                                {p.stock === 0 ? 'Rupture' : p.warn ? 'Faible' : 'En stock'}
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-800 leading-tight mb-0.5">{p.name}</p>
                                            <p className="text-[9px] text-slate-400 font-mono">{p.sku}</p>
                                            <p className="text-sm font-black text-slate-900 mt-1.5">{p.stock} <span className="text-[10px] font-normal text-slate-400">u.</span></p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SPOTLIGHT: FOURNISSEURS ──────────────────────── */}
                <section className="py-28 px-6 overflow-hidden">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

                        {/* Supplier mock */}
                        <div className="relative order-2 lg:order-1">
                            <div className="absolute inset-0 scale-95 rounded-3xl bg-linear-to-br from-violet-100 to-purple-50 blur-2xl opacity-60" />
                            <div className="relative rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-violet-50">
                                        <Truck className="h-4 w-4 text-violet-600" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Fournisseurs</p>
                                        <p className="text-xs text-slate-400">4 fournisseurs actifs</p>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    {[
                                        { name: 'GlobalTech Import',   ops: 12, dette: '45.2K' },
                                        { name: 'MarocDist Pro',        ops: 8,  dette: '22.8K' },
                                        { name: 'SudSupply SARL',       ops: 5,  dette: '11.5K' },
                                    ].map((s, i) => (
                                        <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3">
                                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${
                                                ['bg-violet-100 text-violet-700','bg-indigo-100 text-indigo-700','bg-blue-100 text-blue-700'][i]
                                            }`}>
                                                {s.name.split(' ').map((w:string) => w[0]).join('').slice(0,2)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate">{s.name}</p>
                                                <p className="text-[10px] text-slate-400">{s.ops} opérations</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-mono font-bold text-slate-800">{s.dette}</p>
                                                <p className="text-[9px] text-slate-400">MAD dû</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3 flex items-center justify-between">
                                        <span className="text-xs font-bold text-violet-700">Total dettes fournisseurs</span>
                                        <span className="text-sm font-black font-mono text-violet-900">79.5K MAD</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <p className="text-xs font-black uppercase tracking-widest text-violet-500 mb-3">Fournisseurs</p>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-5 leading-tight">
                                Vos fournisseurs<br />centralisés
                            </h2>
                            <p className="text-slate-500 leading-relaxed mb-8">
                                Gérez tous vos fournisseurs au même endroit : achats, paiements, retours
                                et soldes. Chaque opération est tracée et liée au stock automatiquement.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {[
                                    'Fiches fournisseurs avec grand livre',
                                    'Achats multi-produits avec mise à jour stock',
                                    'Retours fournisseurs traçables',
                                    'Suivi des dettes et paiements',
                                ].map(item => (
                                    <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                                        <CheckCircle2 className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" strokeWidth={2} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href={href} className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 transition-colors">
                                Voir la gestion fournisseurs <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── SPOTLIGHT: CHARGES & EMPLOYÉS ────────────────── */}
                <section className="py-28 px-6 bg-slate-50 overflow-hidden">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-xs font-black uppercase tracking-widest text-orange-500 mb-3">Gestion interne</p>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Charges et équipe</h2>
                            <p className="text-lg text-slate-500 max-w-xl mx-auto">Suivez vos dépenses d'exploitation et gérez votre équipe depuis la même plateforme.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Charges card */}
                            <div className="rounded-3xl border border-orange-100 bg-white p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-11 w-11 rounded-2xl bg-orange-50 flex items-center justify-center">
                                        <Receipt className="h-5 w-5 text-orange-500" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900">Charges</h3>
                                        <p className="text-xs text-slate-400">Suivi des dépenses</p>
                                    </div>
                                </div>
                                <div className="space-y-2.5 mb-6">
                                    {[
                                        { label: 'Loyer du local', amount: '8 500',  cat: 'Immobilier' },
                                        { label: 'Électricité',    amount: '1 200',  cat: 'Utilitaires' },
                                        { label: 'Transport',      amount: '3 400',  cat: 'Logistique' },
                                    ].map((c, i) => (
                                        <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50">
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{c.label}</p>
                                                <p className="text-[10px] text-slate-400">{c.cat}</p>
                                            </div>
                                            <span className="text-xs font-mono font-bold text-orange-700">{c.amount} MAD</span>
                                        </div>
                                    ))}
                                </div>
                                <ul className="space-y-2">
                                    {['Catégories personnalisables','Historique mensuel complet','Intégré aux KPIs financiers'].map(item => (
                                        <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Employees card */}
                            <div className="rounded-3xl border border-teal-100 bg-white p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-11 w-11 rounded-2xl bg-teal-50 flex items-center justify-center">
                                        <User className="h-5 w-5 text-teal-500" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900">Employés</h3>
                                        <p className="text-xs text-slate-400">Gestion de l'équipe</p>
                                    </div>
                                </div>
                                <div className="space-y-2.5 mb-6">
                                    {[
                                        { name: 'Youssef Alami',   post: 'Responsable stock',  color: 'bg-teal-100 text-teal-700'    },
                                        { name: 'Fatima Bennani',  post: 'Commerciale',         color: 'bg-indigo-100 text-indigo-700' },
                                        { name: 'Karim Chraibi',   post: 'Comptable',           color: 'bg-violet-100 text-violet-700' },
                                    ].map((e, i) => (
                                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
                                            <div className={`h-7 w-7 rounded-lg ${e.color} flex items-center justify-center text-[10px] font-black shrink-0`}>
                                                {e.name.split(' ').map((w:string) => w[0]).join('')}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-slate-800">{e.name}</p>
                                                <p className="text-[10px] text-slate-400">{e.post}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <ul className="space-y-2">
                                    {['Fiches employés avec contacts','Postes et responsabilités','Historique des modifications'].map(item => (
                                        <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── HOW IT WORKS ─────────────────────────────────── */}
                <section id="how" className="py-28 px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-20">
                            <p className="text-xs font-black uppercase tracking-widest text-orange-500 mb-3">Simple à utiliser</p>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Démarrez en 3 étapes</h2>
                            <p className="text-lg text-slate-500 max-w-xl mx-auto">Aucune formation requise. Prise en main en quelques minutes.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {[
                                { n: '1', title: 'Configurez',  desc: 'Ajoutez vos produits, clients et fournisseurs. Importez ou créez vos fiches en quelques minutes.',  icon: Package,  color: 'from-orange-500 to-amber-400', shadow: 'shadow-orange-200' },
                                { n: '2', title: 'Gérez',       desc: 'Enregistrez ventes, paiements, retours et achats. Tout est tracé et calculé automatiquement.',       icon: Activity, color: 'from-emerald-500 to-emerald-400', shadow: 'shadow-emerald-200' },
                                { n: '3', title: 'Analysez',    desc: "Suivez vos performances depuis le tableau de bord et les finances. Exportez en PDF ou CSV.",         icon: FileText, color: 'from-blue-500 to-blue-400', shadow: 'shadow-blue-200' },
                            ].map(({ n, title, desc, icon: Icon, color, shadow }, i) => (
                                <div key={n} className="relative flex flex-col items-center text-center">
                                    {i < 2 && (
                                        <div className="hidden md:block absolute top-7 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-px border-t-2 border-dashed border-slate-200" />
                                    )}
                                    <div className={`relative w-14 h-14 rounded-2xl bg-linear-to-br ${color} flex items-center justify-center shadow-lg ${shadow} mb-5`}>
                                        <Icon className="h-6 w-6 text-white" strokeWidth={1.5} />
                                        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                                            <span className="text-[9px] font-black text-white">{n}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── MODULES DARK ─────────────────────────────────── */}
                <section className="py-28 px-6 bg-slate-900 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-150 h-150 rounded-full bg-linear-to-bl from-orange-500/15 to-transparent blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-linear-to-tr from-amber-500/10 to-transparent blur-3xl pointer-events-none" />

                    <div className="relative max-w-6xl mx-auto">
                        <div className="text-center mb-20">
                            <p className="text-xs font-black uppercase tracking-widest text-orange-400 mb-3">Architecture technique</p>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Tout est connecté</h2>
                            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                                Chaque action impacte automatiquement les modules concernés. Zéro double saisie.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { icon: BarChart3,  label: 'Dashboard',        items: ['KPIs en temps réel','Top clients','Activité récente'],                  g: 'from-indigo-500 to-indigo-400',  bg: 'bg-indigo-500/10',  b: 'border-indigo-500/20'  },
                                { icon: Users,      label: 'Clients',          items: ['Grand livre complet','Ventes PDF','Export CSV'],                        g: 'from-emerald-500 to-emerald-400', bg: 'bg-emerald-500/10', b: 'border-emerald-500/20' },
                                { icon: Truck,      label: 'Fournisseurs',     items: ['Achats multi-produits','Retours tracés','Paiements fournisseurs'],       g: 'from-violet-500 to-violet-400',  bg: 'bg-violet-500/10',  b: 'border-violet-500/20'  },
                                { icon: Package,    label: 'Stock',            items: ['Alertes automatiques','Mouvements traçables','Vue grille et liste'],    g: 'from-amber-500 to-amber-400',    bg: 'bg-amber-500/10',   b: 'border-amber-500/20'   },
                                { icon: CreditCard, label: 'Paiements',        items: ['Distribution FIFO','Méthodes multiples','Historique complet'],          g: 'from-sky-500 to-sky-400',        bg: 'bg-sky-500/10',     b: 'border-sky-500/20'     },
                                { icon: TrendingUp, label: 'Finances',         items: ['CA mensuel','Dépenses et marge','Répartition flux'],                    g: 'from-blue-500 to-blue-400',      bg: 'bg-blue-500/10',    b: 'border-blue-500/20'    },
                                { icon: Receipt,    label: 'Charges',          items: ['Catégories libres','Intégré aux finances','Historique mensuel'],        g: 'from-orange-500 to-orange-400',  bg: 'bg-orange-500/10',  b: 'border-orange-500/20'  },
                                { icon: User,       label: 'Employés',         items: ['Fiches complètes','Postes et contacts','Gestion centralisée'],          g: 'from-teal-500 to-teal-400',      bg: 'bg-teal-500/10',    b: 'border-teal-500/20'    },
                                { icon: Warehouse,  label: 'Stock endommagé',  items: ['Lié aux retours','Suivi par produit','Vue dédiée'],                     g: 'from-rose-500 to-rose-400',      bg: 'bg-rose-500/10',    b: 'border-rose-500/20'    },
                            ].map(({ icon: Icon, label, items, g, bg, b }) => (
                                <div key={label} className={`rounded-2xl border ${b} ${bg} p-5 hover:bg-white/5 transition-colors`}>
                                    <div className={`inline-flex items-center gap-2 rounded-xl bg-linear-to-r ${g} px-3 py-1.5 mb-4`}>
                                        <Icon className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
                                        <span className="text-white font-bold text-xs">{label}</span>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {items.map(item => (
                                            <li key={item} className="flex items-center gap-2 text-slate-400 text-xs">
                                                <div className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA ──────────────────────────────────────────── */}
                <section className="py-28 px-6 relative overflow-hidden bg-white">
                    <div className="absolute inset-0 bg-linear-to-br from-orange-50 via-amber-50/40 to-white pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-225 h-125 rounded-full bg-linear-to-r from-orange-200/50 to-amber-200/50 blur-3xl pointer-events-none" />
                    <div className="relative max-w-3xl mx-auto">
                        <div className="rounded-3xl bg-slate-900 p-12 md:p-16 text-center shadow-2xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-amber-500/10 blur-2xl" />
                            <div className="relative">
                                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-orange-400 uppercase tracking-wider mb-8">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                                    Prêt à démarrer
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
                                    Simplifiez votre<br />
                                    <span className="bg-linear-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                                        gestion dès aujourd'hui
                                    </span>
                                </h2>
                                <p className="text-lg text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed">
                                    9 modules. Une seule interface. Conçu pour les PME marocaines.
                                </p>
                                <Link href={href}
                                    className="inline-flex items-center gap-2.5 rounded-2xl bg-linear-to-r from-orange-500 to-amber-400 px-9 py-4 text-base font-bold text-white shadow-2xl shadow-orange-900/40 hover:scale-[1.03] transition-all">
                                    {ctaLabel} <ArrowRight className="h-4 w-4" />
                                </Link>
                                <p className="text-xs text-slate-600 mt-5">Accès immédiat · Interface intuitive · MAD intégré</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── FOOTER ───────────────────────────────────────── */}
                <footer className="border-t border-slate-100 py-10 px-6">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2.5">
                            <AppLogoIcon className="h-6 w-6 text-slate-700" />
                            <span className="font-black text-slate-700 font-mono uppercase tracking-wider">Screeno</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-400">
                            <a href="#platform"  className="hover:text-slate-600 transition-colors">Plateforme</a>
                            <a href="#analytics" className="hover:text-slate-600 transition-colors">Analyses</a>
                            <a href="#how"       className="hover:text-slate-600 transition-colors">Démarrage</a>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="text-xs text-slate-400">© {new Date().getFullYear()} Screeno.</p>
                            <Link href="/login" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Connexion</Link>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
}
