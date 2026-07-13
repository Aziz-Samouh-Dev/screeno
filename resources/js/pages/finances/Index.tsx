import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    TrendingUp, TrendingDown, ShoppingCart, Wallet,
    Users, Truck, ArrowUpRight, ArrowDownRight,
    ChevronLeft, ChevronRight, PiggyBank, BarChart3,
    AlertTriangle, Landmark, Package,
    Plus, X, CheckCircle2,
} from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { toast } from 'sonner';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    ArcElement, Tooltip, Legend, Filler
);

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Finances', href: '/finances' }];

const MONTHS_FR = [
    'Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

// ── Types ──────────────────────────────────────────────────────────────────

interface Account {
    name: string; initial_capital: number; balance: number; currency: string;
}
interface Global {
    total_sales: number; total_purchases: number; cogs: number;
    gross_profit: number; gross_margin_pct: number;
    total_expenses: number; total_charges: number; total_salaries: number;
    total_losses: number; net_profit: number; net_margin_pct: number;
}
interface Kpi {
    ca_brut: number; ca_net: number; retours_clients: number; encaissements: number;
    achats_nets: number; retours_four_remb: number;
    charges_total: number; salaires_payes: number; total_sorties: number;
    benefice_net: number; marge_nette: number;
}
interface Soldes { clients: number; fournisseurs: number }
interface TrendPoint { label: string; revenue: number; charges: number; gross_profit: number }
interface SortieRow  { key: string; label: string; amount: number; color: string }

// ── Formatters ─────────────────────────────────────────────────────────────

const fmtK = (n: number) => {
    const abs = Math.abs(n);
    const s = abs >= 1_000_000 ? (abs / 1_000_000).toFixed(2) + ' M'
            : abs >= 1_000     ? (abs / 1_000).toFixed(1) + ' K'
            : abs.toFixed(0);
    return (n < 0 ? '-' : '') + s;
};

const fmtFull = (n: number) =>
    Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';

// ── Sub-components ─────────────────────────────────────────────────────────

function GlobalKpiCard({
    label, value, sub, positive, icon: Icon, color,
}: {
    label: string; value: string; sub?: string;
    positive?: boolean; icon: React.ElementType; color: string;
}) {
    const isNeutral = positive === undefined;
    const ring = isNeutral ? 'border-border'
               : positive ? 'border-emerald-200 dark:border-emerald-800'
               : 'border-rose-200 dark:border-rose-800';
    const bg   = isNeutral ? 'bg-card'
               : positive ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
               : 'bg-rose-50/60 dark:bg-rose-950/20';
    const valCls = isNeutral ? 'text-foreground'
                 : positive ? 'text-emerald-600 dark:text-emerald-400'
                 : 'text-rose-600 dark:text-rose-400';

    return (
        <div className={`rounded-2xl border ${ring} ${bg} p-4 flex flex-col gap-2 shadow-sm`}>
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '22' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
            </div>
            <p className={`text-xl font-black font-mono leading-none ${valCls}`}>{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
    );
}

function FlowRow({ label, value, positive, icon: Icon }: {
    label: string; value: string; positive: boolean; icon: React.ElementType;
}) {
    return (
        <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border/40 last:border-0">
            <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    positive ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-rose-100 dark:bg-rose-950/50'
                }`}>
                    <Icon className={`w-3 h-3 ${positive ? 'text-emerald-500' : 'text-rose-500'}`} />
                </span>
                <span className="text-sm text-muted-foreground truncate">{label}</span>
            </div>
            <span className={`text-sm font-bold font-mono shrink-0 ${positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {positive ? '+' : '−'}{value} MAD
            </span>
        </div>
    );
}

// ── Capital Deposit Modal ──────────────────────────────────────────────────

function CapitalModal({ onClose }: { onClose: () => void }) {
    const [mode, setMode]   = useState<'set' | 'add'>('add');
    const [amount, setAmount] = useState('');
    const [busy, setBusy]   = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) < 0) return;
        setBusy(true);
        router.post('/finances/capital', { amount: Number(amount), mode },
            { onFinish: () => { setBusy(false); onClose(); } });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}>
            <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-foreground text-lg">Capital du compte</h2>
                        <p className="text-sm text-muted-foreground">Déposer ou définir le capital initial</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Mode selector */}
                <div className="flex gap-2 bg-muted/40 rounded-xl p-1">
                    <button type="button" onClick={() => setMode('add')}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                            mode === 'add' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'
                        }`}>
                        + Déposer un montant
                    </button>
                    <button type="button" onClick={() => setMode('set')}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                            mode === 'set' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'
                        }`}>
                        Définir le capital
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                            {mode === 'add' ? 'Montant à déposer' : 'Nouveau capital initial'}
                        </label>
                        <div className="relative">
                            <input
                                type="number" min="0" step="0.01"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 pr-16 text-lg font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                autoFocus
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">MAD</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                            {mode === 'add'
                                ? 'Ce montant sera ajouté au capital actuel.'
                                : 'Remplace le capital initial par ce montant exact.'}
                        </p>
                    </div>
                    <button type="submit" disabled={busy || !amount || Number(amount) <= 0}
                        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 transition-colors flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {busy ? 'Enregistrement…' : mode === 'add' ? 'Déposer' : 'Définir le capital'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function FinancesIndex() {
    const {
        account, global: g, monthLabel, selectedMonth, selectedYear,
        kpis, soldes, monthlyTrend, repartitionSorties,
    } = usePage().props as unknown as {
        account: Account; global: Global;
        monthLabel: string; selectedMonth: number; selectedYear: number;
        kpis: Kpi; soldes: Soldes;
        monthlyTrend: TrendPoint[]; repartitionSorties: SortieRow[];
    };

    const { props } = usePage<{ flash?: { success?: string } }>();
    const { resolvedAppearance } = useAppearance();
    const isDark    = resolvedAppearance === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    const tickColor = isDark ? '#64748b' : '#94a3b8';

    const [showCapitalModal, setShowCapitalModal] = useState(false);
    const isProfit  = g.net_profit >= 0;
    const balanceOk = account.balance > 0;

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
    }, [props.flash?.success]);

    function navigate(delta: number) {
        let m = selectedMonth + delta;
        let y = selectedYear;
        if (m > 12) { m = 1;  y++; }
        if (m < 1)  { m = 12; y--; }
        router.get('/finances', { month: m, year: y }, { preserveScroll: true });
    }

    /* ── Line chart — revenue vs charges vs gross profit ── */
    const lineData = {
        labels: monthlyTrend.map(m => m.label),
        datasets: [
            {
                label: 'Ventes nettes',
                data: monthlyTrend.map(m => m.revenue),
                borderColor: '#22c55e',
                backgroundColor: (ctx: any) => {
                    const { chartArea, ctx: c } = ctx.chart;
                    if (!chartArea) return 'transparent';
                    const g2 = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    g2.addColorStop(0, 'rgba(34,197,94,0.18)');
                    g2.addColorStop(1, 'rgba(34,197,94,0)');
                    return g2;
                },
                fill: true, tension: 0.42, pointRadius: 3, pointHoverRadius: 6,
                pointBackgroundColor: '#22c55e', pointBorderColor: isDark ? '#0f172a' : '#fff',
                pointBorderWidth: 2, borderWidth: 2.5,
            },
            {
                label: 'Marge brute',
                data: monthlyTrend.map(m => m.gross_profit),
                borderColor: '#6366f1',
                backgroundColor: (ctx: any) => {
                    const { chartArea, ctx: c } = ctx.chart;
                    if (!chartArea) return 'transparent';
                    const g2 = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    g2.addColorStop(0, 'rgba(99,102,241,0.14)');
                    g2.addColorStop(1, 'rgba(99,102,241,0)');
                    return g2;
                },
                fill: true, tension: 0.42, pointRadius: 3, pointHoverRadius: 6,
                pointBackgroundColor: '#6366f1', pointBorderColor: isDark ? '#0f172a' : '#fff',
                pointBorderWidth: 2, borderWidth: 2,
            },
            {
                label: 'Dépenses',
                data: monthlyTrend.map(m => m.charges),
                borderColor: '#f97316',
                backgroundColor: (ctx: any) => {
                    const { chartArea, ctx: c } = ctx.chart;
                    if (!chartArea) return 'transparent';
                    const g2 = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    g2.addColorStop(0, 'rgba(249,115,22,0.13)');
                    g2.addColorStop(1, 'rgba(249,115,22,0)');
                    return g2;
                },
                fill: true, tension: 0.42, pointRadius: 3, pointHoverRadius: 6,
                pointBackgroundColor: '#f97316', pointBorderColor: isDark ? '#0f172a' : '#fff',
                pointBorderWidth: 2, borderWidth: 2,
            },
        ],
    };

    const lineOpts: any = {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDark ? '#1e293b' : '#fff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderWidth: 1,
                titleColor: isDark ? '#94a3b8' : '#64748b',
                bodyColor: isDark ? '#f1f5f9' : '#0f172a',
                padding: 12, boxPadding: 4,
                callbacks: {
                    label: (ctx: any) =>
                        `  ${ctx.dataset.label} : ${Number(ctx.parsed.y).toLocaleString('fr-MA', { maximumFractionDigits: 0 })} MAD`,
                },
            },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11, family: 'inherit' } }, border: { display: false } },
            y: {
                grid: { color: gridColor },
                ticks: { color: tickColor, font: { size: 10, family: 'inherit' }, callback: (v: any) => fmtK(Number(v)), maxTicksLimit: 5 },
                border: { display: false },
            },
        },
    };

    /* ── Doughnut — expense breakdown ── */
    const totalSorties = repartitionSorties.reduce((s, r) => s + r.amount, 0);
    const doughnutData = {
        labels: repartitionSorties.map(r => r.label),
        datasets: [{
            data: repartitionSorties.map(r => r.amount),
            backgroundColor: repartitionSorties.map(r => r.color),
            borderWidth: 3, borderColor: isDark ? '#0f172a' : '#fff', hoverOffset: 8,
        }],
    };
    const doughnutOpts: any = {
        responsive: true, maintainAspectRatio: false, cutout: '76%',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDark ? '#1e293b' : '#fff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderWidth: 1, bodyColor: isDark ? '#f1f5f9' : '#0f172a', padding: 10,
                callbacks: {
                    label: (ctx: any) => {
                        const pct = totalSorties > 0 ? ((ctx.parsed / totalSorties) * 100).toFixed(1) : '0';
                        return `  ${ctx.label} : ${fmtK(Number(ctx.parsed))} MAD (${pct}%)`;
                    },
                },
            },
        },
    };

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    /* ── Balance progress bar ── */
    const spentPct = account.initial_capital > 0
        ? Math.min(100, Math.max(0, ((account.initial_capital - account.balance) / account.initial_capital) * 100))
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finances" />
            {showCapitalModal && <CapitalModal onClose={() => setShowCapitalModal(false)} />}

            <div className="p-6 flex flex-col gap-6 min-h-0">

                {/* ══ HEADER ══ */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Finances</h1>
                        <p className="text-sm text-muted-foreground">Tableau de bord financier complet</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => router.visit('/charges')}
                            className="h-9 px-4 text-sm font-medium rounded-xl border border-border bg-card hover:bg-accent text-foreground transition-colors">
                            Charges
                        </button>
                        <button onClick={() => router.visit('/employees')}
                            className="h-9 px-4 text-sm font-medium rounded-xl border border-border bg-card hover:bg-accent text-foreground transition-colors">
                            Employés
                        </button>
                        <button onClick={() => setShowCapitalModal(true)}
                            className="h-9 px-4 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Déposer / Capital
                        </button>
                    </div>
                </div>

                {/* ══ VIRTUAL ACCOUNT HERO CARD ══ */}
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-800 via-slate-700 to-slate-900 p-6 shadow-xl">
                    {/* decorative circles */}
                    <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row md:items-end gap-6">
                        {/* Left: balance + name */}
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-2">
                                <Landmark className="w-5 h-5 text-white/60" />
                                <span className="text-xs font-bold uppercase tracking-widest text-white/60">{account.name}</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">Solde disponible</p>
                                <p className={`text-4xl font-black font-mono tracking-tight ${balanceOk ? 'text-white' : 'text-rose-400'}`}>
                                    {fmtK(account.balance)} <span className="text-lg font-semibold text-white/50">MAD</span>
                                </p>
                                {!balanceOk && (
                                    <div className="flex items-center gap-1.5 mt-1.5 text-rose-400 text-xs font-semibold">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Solde négatif — vérifiez vos achats et charges
                                    </div>
                                )}
                            </div>

                            {/* Progress bar: spent from initial capital */}
                            {account.initial_capital > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] text-white/50">
                                        <span>Capital utilisé</span>
                                        <span>{spentPct.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${spentPct}%`,
                                                backgroundColor: spentPct > 80 ? '#f97316' : spentPct > 60 ? '#eab308' : '#22c55e',
                                            }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: stat tiles */}
                        <div className="flex gap-3 flex-wrap md:flex-nowrap">
                            <div className="bg-white/10 rounded-2xl px-5 py-4 min-w-36">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Capital initial</p>
                                <p className="text-xl font-black font-mono text-white">{fmtK(account.initial_capital)}</p>
                                <p className="text-[10px] text-white/40 mt-0.5">MAD</p>
                            </div>
                            <div className="bg-white/10 rounded-2xl px-5 py-4 min-w-36">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Bénéfice net</p>
                                <p className={`text-xl font-black font-mono ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {g.net_profit >= 0 ? '+' : ''}{fmtK(g.net_profit)}
                                </p>
                                <p className="text-[10px] text-white/40 mt-0.5">{g.net_margin_pct}% marge</p>
                            </div>
                            <button onClick={() => setShowCapitalModal(true)}
                                className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-2xl px-5 py-4 min-w-36 transition-colors text-left">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Déposer</p>
                                <p className="text-xl font-black font-mono text-white">+</p>
                                <p className="text-[10px] text-white/40 mt-0.5">Ajouter du capital</p>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ══ GLOBAL KPI GRID — 8 cards ══ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <GlobalKpiCard
                        label="Ventes totales" icon={TrendingUp} color="#22c55e"
                        value={`${fmtK(g.total_sales)} MAD`}
                        sub="Chiffre d'affaires net (all-time)"
                        positive
                    />
                    <GlobalKpiCard
                        label="Total achats" icon={ShoppingCart} color="#3b82f6"
                        value={`${fmtK(g.total_purchases)} MAD`}
                        sub="Achats nets fournisseurs"
                        positive={false}
                    />
                    <GlobalKpiCard
                        label="Marge brute" icon={BarChart3} color="#6366f1"
                        value={`${fmtK(g.gross_profit)} MAD`}
                        sub={`Marge ${g.gross_margin_pct}% · COGS ${fmtK(g.cogs)} MAD`}
                        positive={g.gross_profit >= 0}
                    />
                    <GlobalKpiCard
                        label="Total charges & salaires" icon={Wallet} color="#f59e0b"
                        value={`${fmtK(g.total_expenses)} MAD`}
                        sub={`Charges ${fmtK(g.total_charges)} · Salaires ${fmtK(g.total_salaries)}`}
                        positive={false}
                    />
                    <GlobalKpiCard
                        label="Capital initial" icon={PiggyBank} color="#64748b"
                        value={`${fmtK(account.initial_capital)} MAD`}
                        sub="Apport initial au compte"
                    />
                    <GlobalKpiCard
                        label="Pertes produits" icon={Package} color="#ef4444"
                        value={`${fmtK(g.total_losses)} MAD`}
                        sub="Stock endommagé non retourné"
                        positive={false}
                    />
                    <GlobalKpiCard
                        label="Solde clients" icon={Users} color="#06b6d4"
                        value={`${fmtK(Math.abs(soldes.clients))} MAD`}
                        sub={soldes.clients > 0 ? 'Montant à encaisser' : 'Solde créditeur'}
                        positive={soldes.clients <= 0}
                    />
                    <GlobalKpiCard
                        label="Bénéfice net" icon={isProfit ? TrendingUp : TrendingDown} color={isProfit ? '#22c55e' : '#ef4444'}
                        value={`${g.net_profit >= 0 ? '+' : ''}${fmtK(g.net_profit)} MAD`}
                        sub={`Marge ${g.net_margin_pct}% · Pertes incluses`}
                        positive={isProfit}
                    />
                </div>

                {/* ══ PROFIT FORMULA ROW ══ */}
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        Formule bénéfice net (all-time)
                    </p>
                    <div className="flex items-center gap-2 flex-wrap text-sm font-mono">
                        <span className="rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 font-bold">
                            Marge brute {fmtK(g.gross_profit)} MAD
                        </span>
                        <span className="text-muted-foreground font-sans">−</span>
                        <span className="rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-3 py-1.5 font-bold">
                            Charges {fmtK(g.total_charges)} MAD
                        </span>
                        <span className="text-muted-foreground font-sans">−</span>
                        <span className="rounded-lg bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 px-3 py-1.5 font-bold">
                            Salaires {fmtK(g.total_salaries)} MAD
                        </span>
                        <span className="text-muted-foreground font-sans">−</span>
                        <span className="rounded-lg bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 px-3 py-1.5 font-bold">
                            Pertes {fmtK(g.total_losses)} MAD
                        </span>
                        <span className="text-muted-foreground font-sans">=</span>
                        <span className={`rounded-lg px-3 py-1.5 font-bold ${
                            isProfit
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                                : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                        }`}>
                            {g.net_profit >= 0 ? '+' : ''}{fmtK(g.net_profit)} MAD
                        </span>
                    </div>
                </div>

                {/* ══ PERIOD SELECTOR ══ */}
                <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-sm font-bold text-muted-foreground">Détail mensuel :</p>
                    <div className="flex items-center bg-card border border-border rounded-xl overflow-hidden h-9">
                        <button onClick={() => navigate(-1)}
                            className="h-full px-2.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors border-r border-border">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <select value={selectedMonth}
                            onChange={e => router.get('/finances', { month: Number(e.target.value), year: selectedYear }, { preserveScroll: true })}
                            className="h-full text-sm font-semibold text-foreground bg-transparent border-0 outline-none cursor-pointer px-2 appearance-none">
                            {MONTHS_FR.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <select value={selectedYear}
                            onChange={e => router.get('/finances', { month: selectedMonth, year: Number(e.target.value) }, { preserveScroll: true })}
                            className="h-full text-sm font-semibold text-foreground bg-transparent border-0 outline-none cursor-pointer px-2 appearance-none border-l border-border">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button onClick={() => navigate(1)}
                            className="h-full px-2.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors border-l border-border">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <span className="text-sm text-muted-foreground">— {monthLabel}</span>
                </div>

                {/* ══ CHARTS + MONTHLY DETAIL ══ */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">

                    {/* ── LEFT: charts ── */}
                    <div className="xl:col-span-3 flex flex-col gap-4">

                        {/* Line chart */}
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-foreground">Ventes · Marge brute · Dépenses</h3>
                                    <p className="text-xs text-muted-foreground">6 derniers mois</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 rounded-full bg-emerald-500 inline-block" /> Ventes</span>
                                    <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 rounded-full bg-indigo-500 inline-block" /> Marge</span>
                                    <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 rounded-full bg-orange-400 inline-block" /> Dépenses</span>
                                </div>
                            </div>
                            <div className="h-56">
                                <Line data={lineData} options={lineOpts} />
                            </div>
                        </div>

                        {/* Doughnut */}
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <div className="mb-4">
                                <h3 className="font-bold text-foreground">Répartition des sorties</h3>
                                <p className="text-xs text-muted-foreground">Achats, charges et salaires · {monthLabel}</p>
                            </div>
                            {repartitionSorties.length === 0 ? (
                                <div className="flex items-center justify-center h-28 text-sm text-muted-foreground">
                                    Aucune dépense ce mois
                                </div>
                            ) : (
                                <div className="flex items-center gap-8">
                                    <div className="relative shrink-0 w-36 h-36">
                                        <Doughnut data={doughnutData} options={doughnutOpts} />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <p className="text-[10px] text-muted-foreground">Total</p>
                                            <p className="text-sm font-bold font-mono text-foreground leading-tight">{fmtK(totalSorties)}</p>
                                            <p className="text-[10px] text-muted-foreground">MAD</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-2.5">
                                        {repartitionSorties.map(row => {
                                            const pct = totalSorties > 0 ? (row.amount / totalSorties) * 100 : 0;
                                            return (
                                                <div key={row.key}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                                                            <span className="text-sm text-foreground truncate">{row.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0 ml-3">
                                                            <span className="text-xs font-mono font-semibold text-foreground">{fmtK(row.amount)} MAD</span>
                                                            <span className="text-xs text-muted-foreground w-8 text-right">{pct.toFixed(0)}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                                        <div className="h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${pct}%`, backgroundColor: row.color }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT: monthly flux + soldes ── */}
                    <div className="xl:col-span-2 flex flex-col gap-4">

                        {/* Monthly flux */}
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <div className="mb-4">
                                <h3 className="font-bold text-foreground">Flux financiers</h3>
                                <p className="text-xs text-muted-foreground">{monthLabel}</p>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Entrées</p>
                            <FlowRow label="Ventes clients"     value={fmtK(kpis.ca_brut)}         positive icon={ArrowUpRight} />
                            <FlowRow label="Encaissements"      value={fmtK(kpis.encaissements)}    positive icon={ArrowUpRight} />
                            {kpis.retours_four_remb > 0 && (
                                <FlowRow label="Ret. four. (remb.)" value={fmtK(kpis.retours_four_remb)} positive icon={ArrowUpRight} />
                            )}
                            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1 mt-4">Sorties</p>
                            <FlowRow label="Achats fournisseurs" value={fmtK(kpis.achats_nets)}    positive={false} icon={ArrowDownRight} />
                            <FlowRow label="Charges"             value={fmtK(kpis.charges_total)}  positive={false} icon={ArrowDownRight} />
                            <FlowRow label="Salaires payés"      value={fmtK(kpis.salaires_payes)} positive={false} icon={ArrowDownRight} />
                            {kpis.retours_clients > 0 && (
                                <FlowRow label="Retours clients" value={fmtK(kpis.retours_clients)} positive={false} icon={ArrowDownRight} />
                            )}
                            <div className={`mt-4 rounded-xl px-4 py-3 flex items-center justify-between ${
                                kpis.benefice_net >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-rose-50 dark:bg-rose-950/30'
                            }`}>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Résultat mensuel</span>
                                <span className={`text-sm font-bold font-mono ${kpis.benefice_net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {kpis.benefice_net >= 0 ? '+' : '−'}{fmtK(Math.abs(kpis.benefice_net))} MAD
                                </span>
                            </div>
                        </div>

                        {/* Client balance */}
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Solde clients</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Créances non encaissées</p>
                                </div>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                    soldes.clients > 0 ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-500' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500'
                                }`}>
                                    <Users className="w-4 h-4" />
                                </div>
                            </div>
                            <p className={`text-2xl font-bold font-mono leading-none ${soldes.clients > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {fmtK(Math.abs(soldes.clients))} MAD
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {soldes.clients > 0 ? 'Montant encore à encaisser' : soldes.clients < 0 ? 'Avoir clients' : 'Compte soldé'}
                            </p>
                        </div>

                        {/* Supplier balance */}
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Solde fournisseurs</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Dettes restantes</p>
                                </div>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                    soldes.fournisseurs > 0 ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-500' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500'
                                }`}>
                                    <Truck className="w-4 h-4" />
                                </div>
                            </div>
                            <p className={`text-2xl font-bold font-mono leading-none ${soldes.fournisseurs > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {fmtK(Math.abs(soldes.fournisseurs))} MAD
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {soldes.fournisseurs > 0 ? 'Montant encore à décaisser' : soldes.fournisseurs < 0 ? 'Avoir fournisseur' : 'Compte soldé'}
                            </p>
                        </div>

                        {/* Losses alert */}
                        {g.total_losses > 0 && (
                            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-2xl p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-red-700 dark:text-red-400">Stock endommagé</p>
                                        <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                                            {fmtFull(g.total_losses)} en pertes potentielles — produits non retournés aux fournisseurs.
                                        </p>
                                        <button className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400 underline underline-offset-2"
                                            onClick={() => router.visit('/stock')}>
                                            Voir le stock endommagé →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
