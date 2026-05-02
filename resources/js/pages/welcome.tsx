import { Head, Link, usePage } from '@inertiajs/react';
import {
    Package, Users, Truck, RotateCcw, CreditCard,
    BarChart3, Shield, Zap, Globe, ArrowRight, CheckCircle2, Star, Warehouse,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';

interface Auth { user?: { name: string } }

export default function Welcome() {
    const { auth } = usePage().props as { auth: Auth };

    const features = [
        { icon: Package,    title: 'Gestion des stocks',      desc: 'Suivez votre inventaire en temps réel avec alertes de stock faible et historique des mouvements.', color: 'text-amber-500',   bg: 'bg-amber-50'   },
        { icon: Users,      title: 'Gestion clients',         desc: 'Centralisez vos données clients avec historique complet des ventes, paiements et retours.',          color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { icon: Truck,      title: 'Gestion fournisseurs',    desc: 'Gérez vos fournisseurs avec suivi des contacts et des historiques.',                                  color: 'text-violet-500',  bg: 'bg-violet-50'  },
        { icon: RotateCcw,  title: 'Retours clients',         desc: 'Traitez les retours facilement : retour en stock ou stock endommagé par article.',                    color: 'text-rose-500',    bg: 'bg-rose-50'    },
        { icon: CreditCard, title: 'Paiements & Ledger',      desc: 'Suivez les encaissements clients avec distribution FIFO automatique et soldes en temps réel.',       color: 'text-sky-500',     bg: 'bg-sky-50'     },
        { icon: BarChart3,  title: 'Tableau de bord',         desc: "Vue d'ensemble en temps réel de vos ventes, paiements, stock et activité récente.",                  color: 'text-indigo-500',  bg: 'bg-indigo-50'  },
    ];

    const advantages = [
        { icon: Zap,      label: 'Rapide et léger'  },
        { icon: Shield,   label: 'Sécurisé'          },
        { icon: Globe,    label: 'Accessible partout' },
        { icon: CreditCard, label: 'MAD intégré'     },
    ];

    return (
        <>
            <Head title="Screeno — Gestion d'entreprise moderne" />

            <div className="force-light min-h-screen bg-white font-sans">

                {/* ─── NAV ──────────────────────────────────────────── */}
                <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-white/80 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <AppLogoIcon className="h-7 w-7 text-slate-900" />
                        <span className="font-black text-slate-900 text-lg tracking-wider font-mono uppercase">Screeno</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <a href="#features" className="hover:text-slate-900 transition-colors">Fonctionnalités</a>
                        <a href="#modules" className="hover:text-slate-900 transition-colors">Modules</a>
                    </nav>
                    <div className="flex items-center gap-3">
                        {auth?.user ? (
                            <Link href="/dashboard"
                                className="rounded-xl bg-linear-to-r from-orange-500 to-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all">
                                Tableau de bord →
                            </Link>
                        ) : (
                            <Link href="/login"
                                className="rounded-xl bg-linear-to-r from-orange-500 to-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all">
                                Se connecter
                            </Link>
                        )}
                    </div>
                </header>

                {/* ─── HERO ─────────────────────────────────────────── */}
                <section className="relative pt-32 pb-24 px-6 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-linear-to-br from-orange-200 to-amber-100 blur-3xl opacity-60 pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-linear-to-tr from-orange-100 to-yellow-50 blur-3xl opacity-50 pointer-events-none" />

                    <div className="relative max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 text-xs font-semibold text-amber-700 mb-8">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            Gestion d'entreprise tout-en-un
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.08] tracking-tight mb-6">
                            Gérez votre{' '}
                            <span className="bg-linear-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
                                entreprise
                            </span>
                            <br />avec clarté
                        </h1>

                        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Screeno centralise vos stocks, vos clients, vos fournisseurs et vos paiements
                            dans une interface moderne et intuitive. Conçu pour le marché marocain.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {auth?.user ? (
                                <Link href="/dashboard"
                                    className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-amber-400 px-8 py-4 text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all">
                                    Aller au tableau de bord <ArrowRight className="h-4 w-4" />
                                </Link>
                            ) : (
                                <Link href="/login"
                                    className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-amber-400 px-8 py-4 text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all">
                                    Accéder à la plateforme <ArrowRight className="h-4 w-4" />
                                </Link>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-slate-400">
                            {['Ventes & Paiements MAD', 'Stock en temps réel', 'Impression PDF', 'Historique complet'].map(t => (
                                <span key={t} className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" /> {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── ADVANTAGES BAR ───────────────────────────────── */}
                <section className="border-y border-slate-100 bg-slate-50/50 py-8 px-6">
                    <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8">
                        {advantages.map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-2.5 text-slate-600">
                                <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                    <Icon className="h-4 w-4 text-orange-500" />
                                </div>
                                <span className="text-sm font-semibold">{label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─── FEATURES ─────────────────────────────────────── */}
                <section id="features" className="py-24 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
                                Tout ce dont vous avez besoin
                            </h2>
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                                Une suite complète d'outils conçus pour simplifier la gestion quotidienne de votre entreprise.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map(({ icon: Icon, title, desc, color, bg }) => (
                                <div key={title}
                                    className="group rounded-3xl border border-slate-100 bg-white p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center mb-5`}>
                                        <Icon className={`h-6 w-6 ${color}`} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── MODULES ──────────────────────────────────────── */}
                <section id="modules" className="py-24 px-6 bg-slate-900 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-linear-to-bl from-orange-500/20 to-amber-400/10 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-linear-to-tr from-amber-500/10 to-orange-400/5 blur-3xl pointer-events-none" />

                    <div className="relative max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Modules intégrés</h2>
                            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                                Chaque module fonctionne ensemble de manière transparente.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                {
                                    icon: Package, label: 'Inventaire',
                                    items: ['Catalogue produits avec SKU', 'Alertes stock faible (≤5)', 'Mouvements de stock automatiques', 'Vue grille et liste'],
                                    gradient: 'from-amber-600 to-amber-400',
                                },
                                {
                                    icon: Users, label: 'Clients & Ventes',
                                    items: ['Fiches clients avec ledger complet', 'Ventes multi-produits', 'Historique PDF téléchargeable', 'Export CSV'],
                                    gradient: 'from-emerald-600 to-emerald-400',
                                },
                                {
                                    icon: RotateCcw, label: 'Retours & Paiements',
                                    items: ['Retours en stock ou stock endommagé', 'Encaissements avec distribution FIFO', 'Méthodes de paiement multiples', 'Soldes en temps réel'],
                                    gradient: 'from-rose-600 to-rose-400',
                                },
                                {
                                    icon: Warehouse, label: 'Stock endommagé',
                                    items: ['Suivi des produits endommagés', 'Lié aux retours clients', 'Historique complet', "Gestion par produit"],
                                    gradient: 'from-orange-600 to-orange-400',
                                },
                            ].map(({ icon: Icon, label, items, gradient }) => (
                                <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-7 hover:bg-white/[0.08] transition-colors">
                                    <div className={`inline-flex items-center gap-2 rounded-xl bg-linear-to-r ${gradient} px-3 py-1.5 mb-5`}>
                                        <Icon className="h-4 w-4 text-white" />
                                        <span className="text-white font-bold text-sm">{label}</span>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {items.map(item => (
                                            <li key={item} className="flex items-center gap-2.5 text-slate-300 text-sm">
                                                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── CTA ──────────────────────────────────────────── */}
                <section className="py-24 px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-orange-50 via-amber-50 to-white pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-linear-to-r from-orange-200 to-amber-200 blur-3xl opacity-40 pointer-events-none" />
                    <div className="relative max-w-3xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
                            Prêt à simplifier votre gestion ?
                        </h2>
                        <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto">
                            Connectez-vous à Screeno et transformez la façon dont vous gérez votre entreprise — rapide, clair, professionnel.
                        </p>
                        <Link href={auth?.user ? '/dashboard' : '/login'}
                            className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-amber-400 px-10 py-5 text-lg font-bold text-white shadow-2xl hover:shadow-orange-200 transition-all">
                            {auth?.user ? 'Accéder à mon espace' : 'Se connecter'} <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                </section>

                {/* ─── FOOTER ───────────────────────────────────────── */}
                <footer className="border-t border-slate-100 py-8 px-6">
                    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <AppLogoIcon className="h-6 w-6 text-slate-700" />
                            <span className="font-black text-slate-700 font-mono uppercase tracking-wider">Screeno</span>
                        </div>
                        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Screeno. Tous droits réservés.</p>
                        <Link href="/login" className="text-xs text-slate-400 hover:text-slate-600">Connexion</Link>
                    </div>
                </footer>
            </div>
        </>
    );
}
