import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    TrendingUp, TrendingDown, ShoppingCart, Wallet,
    Users, Truck, ArrowUpRight, ArrowDownRight,
    ChevronLeft, ChevronRight, PiggyBank, BarChart3,
    AlertTriangle, Landmark, Package,
    Plus, X, CheckCircle2, ArrowRight,
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
    ArcElement, Tooltip, Legend, Filler,
);

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Finances', href: '/finances' }];

const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// ── Types ─────────────────────────────────────────────────────────────────

interface Account { name: string; initial_capital: number; balance: number; currency: string }
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

// ── Formatters ────────────────────────────────────────────────────────────

const fmtK = (n: number) => {
    const abs = Math.abs(n);
    const s = abs >= 1_000_000 ? (abs / 1_000_000).toFixed(2) + ' M'
            : abs >= 1_000     ? (abs / 1_000).toFixed(1) + ' K'
            : abs.toFixed(0);
    return (n < 0 ? '-' : '') + s;
};
const fmtFull = (n: number) =>
    Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';

// ── Design atoms ─────────────────────────────────────────────────────────

/** Section divider — bilingual label (FR + AR), no rule line */
function SectionDivider({ fr, ar, right }: { fr: string; ar: string; right?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground select-none">
                    {fr}
                </span>
                <span className="text-[11px] text-muted-foreground/60 select-none" dir="rtl" lang="ar">
                    {ar}
                </span>
            </div>
            {right}
        </div>
    );
}

/** Uniform KPI card — bilingual label (FR + AR) */
function KpiCard({
    fr, ar, value, unit = 'MAD', sub, sign, icon: Icon,
}: {
    fr: string; ar: string; value: string; unit?: string; sub?: string;
    sign?: 'positive' | 'negative' | 'neutral'; icon?: React.ElementType;
}) {
    const numCls =
        sign === 'positive' ? 'text-emerald-600 dark:text-emerald-400'
      : sign === 'negative' ? 'text-rose-600 dark:text-rose-400'
      : 'text-foreground';
    return (
        <div className="rounded-xl border border-border bg-card px-4 py-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground leading-none">
                        {fr}
                    </p>
                    <p className="text-[11px] text-muted-foreground/50 mt-0.5 leading-none" dir="rtl" lang="ar">
                        {ar}
                    </p>
                </div>
                {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />}
            </div>
            <div>
                <span className={`text-xl font-bold font-mono tabular-nums leading-none ${numCls}`}>
                    {value}
                </span>
                <span className="text-xs text-muted-foreground ml-1.5 font-mono">{unit}</span>
            </div>
            {sub && (
                <p className="text-[10px] text-muted-foreground leading-relaxed border-t border-border/60 pt-2 mt-auto">
                    {sub}
                </p>
            )}
        </div>
    );
}

/** Flux row inside the monthly panel */
function FlowRow({ label, value, positive, icon: Icon }: {
    label: string; value: string; positive: boolean; icon: React.ElementType;
}) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
            <div className="flex items-center gap-2 min-w-0">
                <Icon className={`w-3 h-3 shrink-0 ${positive ? 'text-emerald-500' : 'text-rose-500'}`} />
                <span className="text-xs text-muted-foreground truncate">{label}</span>
            </div>
            <span className={`text-xs font-semibold font-mono tabular-nums shrink-0 ${
                positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
                {positive ? '+' : '−'}{value}
            </span>
        </div>
    );
}

// ── Capital modal ─────────────────────────────────────────────────────────

function CapitalModal({ onClose }: { onClose: () => void }) {
    const [mode, setMode]     = useState<'set' | 'add'>('add');
    const [amount, setAmount] = useState('');
    const [busy, setBusy]     = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) < 0) return;
        setBusy(true);
        router.post('/finances/capital', { amount: Number(amount), mode },
            { onFinish: () => { setBusy(false); onClose(); } });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={onClose}>
            <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-foreground">Mise à jour du capital</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Déposer ou redéfinir le capital initial</p>
                    </div>
                    <button onClick={onClose}
                        className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
                    {(['add', 'set'] as const).map(m => (
                        <button key={m} type="button" onClick={() => setMode(m)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                mode === m ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}>
                            {m === 'add' ? '+ Déposer' : 'Définir'}
                        </button>
                    ))}
                </div>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                            {mode === 'add' ? 'Montant à ajouter' : 'Nouveau capital'}
                        </label>
                        <div className="relative">
                            <input type="number" min="0" step="0.01" value={amount}
                                onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus
                                className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-14 text-xl font-mono font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">MAD</span>
                        </div>
                    </div>
                    <button type="submit" disabled={busy || !amount || Number(amount) <= 0}
                        className="w-full rounded-xl bg-primary text-primary-foreground text-xs font-semibold py-2.5 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {busy ? 'Enregistrement…' : mode === 'add' ? 'Confirmer le dépôt' : 'Définir le capital'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────

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
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    const tickColor = isDark ? '#64748b' : '#94a3b8';

    const [showCapitalModal, setShowCapitalModal] = useState(false);
    const isProfit  = g.net_profit >= 0;
    const balanceOk = account.balance >= 0;

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
    }, [props.flash?.success]);

    function navigate(delta: number) {
        let m = selectedMonth + delta, y = selectedYear;
        if (m > 12) { m = 1;  y++; }
        if (m < 1)  { m = 12; y--; }
        router.get('/finances', { month: m, year: y }, { preserveScroll: true });
    }

    const spentPct = account.initial_capital > 0
        ? Math.min(100, Math.max(0, ((account.initial_capital - account.balance) / account.initial_capital) * 100))
        : 0;

    /* ── Charts ── */
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
                    g2.addColorStop(0, 'rgba(34,197,94,0.12)');
                    g2.addColorStop(1, 'rgba(34,197,94,0)');
                    return g2;
                },
                fill: true, tension: 0.38, pointRadius: 3, pointHoverRadius: 5,
                pointBackgroundColor: '#22c55e', pointBorderColor: isDark ? '#0f172a' : '#fff',
                pointBorderWidth: 2, borderWidth: 2,
            },
            {
                label: 'Marge brute',
                data: monthlyTrend.map(m => m.gross_profit),
                borderColor: '#6366f1',
                backgroundColor: (ctx: any) => {
                    const { chartArea, ctx: c } = ctx.chart;
                    if (!chartArea) return 'transparent';
                    const g2 = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    g2.addColorStop(0, 'rgba(99,102,241,0.10)');
                    g2.addColorStop(1, 'rgba(99,102,241,0)');
                    return g2;
                },
                fill: true, tension: 0.38, pointRadius: 3, pointHoverRadius: 5,
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
                    g2.addColorStop(0, 'rgba(249,115,22,0.09)');
                    g2.addColorStop(1, 'rgba(249,115,22,0)');
                    return g2;
                },
                fill: true, tension: 0.38, pointRadius: 3, pointHoverRadius: 5,
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
                padding: 10, boxPadding: 4,
                callbacks: {
                    label: (ctx: any) =>
                        `  ${ctx.dataset.label} : ${Number(ctx.parsed.y).toLocaleString('fr-MA', { maximumFractionDigits: 0 })} MAD`,
                },
            },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11 } }, border: { display: false } },
            y: {
                grid: { color: gridColor },
                ticks: { color: tickColor, font: { size: 10 }, callback: (v: any) => fmtK(Number(v)), maxTicksLimit: 5 },
                border: { display: false },
            },
        },
    };

    const totalSorties = repartitionSorties.reduce((s, r) => s + r.amount, 0);
    const doughnutData = {
        labels: repartitionSorties.map(r => r.label),
        datasets: [{
            data: repartitionSorties.map(r => r.amount),
            backgroundColor: repartitionSorties.map(r => r.color),
            borderWidth: 2, borderColor: isDark ? '#161b24' : '#fff', hoverOffset: 6,
        }],
    };
    const doughnutOpts: any = {
        responsive: true, maintainAspectRatio: false, cutout: '72%',
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finances" />
            {showCapitalModal && <CapitalModal onClose={() => setShowCapitalModal(false)} />}

            <div className="px-6 py-5 space-y-6">

                {/* ══ PAGE HEADER ══════════════════════════════════════════════ */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-lg font-bold text-foreground tracking-tight">Finances</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Vue d'ensemble financière — {account.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.visit('/charges')}
                            className="h-8 px-3 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors">
                            Charges
                        </button>
                        <button onClick={() => router.visit('/employees')}
                            className="h-8 px-3 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors">
                            Employés
                        </button>
                        <button onClick={() => setShowCapitalModal(true)}
                            className="h-8 px-3 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                            <Plus className="w-3 h-3" /> Capital
                        </button>
                    </div>
                </div>

                {/* ══ COMPTE VIRTUEL — single unified card ═════════════════════ */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    {/* Card header bar */}
                    <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-2">
                            <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                                Compte virtuel
                            </span>
                            <span className="text-[11px] text-muted-foreground/50" dir="rtl" lang="ar">الحساب الافتراضي</span>
                            <span className="text-[10px] text-muted-foreground/40">·</span>
                            <span className="text-[10px] text-muted-foreground">{account.name}</span>
                        </div>
                        <button onClick={() => setShowCapitalModal(true)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
                            <Plus className="w-3 h-3" /> Déposer
                        </button>
                    </div>

                    {/* Three-column stat strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">

                        {/* Solde disponible */}
                        <div className="px-6 py-5 space-y-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Solde disponible</p>
                                <p className="text-[11px] text-muted-foreground/50" dir="rtl" lang="ar">الرصيد المتاح</p>
                            </div>
                            <p className={`text-4xl font-black font-mono tabular-nums leading-none ${
                                balanceOk ? 'text-foreground' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                                {fmtK(account.balance)}
                                <span className="text-base font-semibold text-muted-foreground ml-2">MAD</span>
                            </p>
                            {!balanceOk && (
                                <p className="text-xs text-rose-500 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Solde négatif
                                </p>
                            )}
                            {account.initial_capital > 0 && (
                                <div className="space-y-1 pt-1">
                                    <div className="h-[3px] rounded-full bg-muted overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${spentPct}%`,
                                                backgroundColor: spentPct > 80 ? '#ef4444' : spentPct > 55 ? '#f59e0b' : '#22c55e',
                                            }} />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        {spentPct.toFixed(1)}% du capital utilisé
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Capital initial */}
                        <div className="px-6 py-5 space-y-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Capital initial</p>
                                <p className="text-[11px] text-muted-foreground/50" dir="rtl" lang="ar">رأس المال الأولي</p>
                            </div>
                            <p className="text-4xl font-black font-mono tabular-nums leading-none text-foreground">
                                {fmtK(account.initial_capital)}
                                <span className="text-base font-semibold text-muted-foreground ml-2">MAD</span>
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                Apport de départ au compte
                            </p>
                        </div>

                        {/* Bénéfice net */}
                        <div className="px-6 py-5 space-y-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Bénéfice net</p>
                                <p className="text-[11px] text-muted-foreground/50" dir="rtl" lang="ar">صافي الربح</p>
                            </div>
                            <p className={`text-4xl font-black font-mono tabular-nums leading-none ${
                                isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                                {g.net_profit >= 0 ? '+' : ''}{fmtK(g.net_profit)}
                                <span className="text-base font-semibold text-muted-foreground ml-2">MAD</span>
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                Marge nette <span className="font-mono tabular-nums text-foreground font-semibold">{g.net_margin_pct}%</span>
                                &ensp;·&ensp;Pertes incluses
                            </p>
                        </div>
                    </div>
                </div>

                {/* ══ INDICATEURS GLOBAUX ══════════════════════════════════════ */}
                <SectionDivider fr="Indicateurs financiers" ar="المؤشرات المالية" />

                {/* Row 1: primary metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <KpiCard
                        fr="CA ventes nettes" ar="رقم الأعمال الصافي" icon={TrendingUp}
                        value={fmtK(g.total_sales)} sign="positive"
                        sub="Retours clients déduits"
                    />
                    <KpiCard
                        fr="Achats fournisseurs" ar="مشتريات الموردين" icon={ShoppingCart}
                        value={fmtK(g.total_purchases)} sign="negative"
                        sub="Retours fournisseurs déduits"
                    />
                    <KpiCard
                        fr="Marge brute" ar="الهامش الإجمالي" icon={BarChart3}
                        value={fmtK(g.gross_profit)}
                        sign={g.gross_profit >= 0 ? 'positive' : 'negative'}
                        sub={`${g.gross_margin_pct}% · COGS ${fmtK(g.cogs)} MAD`}
                    />
                    <KpiCard
                        fr="Charges & salaires" ar="المصاريف والرواتب" icon={Wallet}
                        value={fmtK(g.total_expenses)} sign="negative"
                        sub={`Ch. ${fmtK(g.total_charges)} · Sal. ${fmtK(g.total_salaries)} MAD`}
                    />
                </div>

                {/* Row 2: secondary metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <KpiCard
                        fr="Capital initial" ar="رأس المال الأولي" icon={PiggyBank}
                        value={fmtK(account.initial_capital)}
                        sub="Apport de départ"
                    />
                    <KpiCard
                        fr="Pertes produits" ar="خسائر المنتجات" icon={Package}
                        value={fmtK(g.total_losses)}
                        sign={g.total_losses > 0 ? 'negative' : 'positive'}
                        sub="Stock endommagé restant"
                    />
                    <KpiCard
                        fr="Créances clients" ar="ذمم العملاء" icon={Users}
                        value={fmtK(Math.abs(soldes.clients))}
                        sign={soldes.clients > 0 ? 'neutral' : 'positive'}
                        sub={soldes.clients > 0 ? 'À encaisser' : soldes.clients < 0 ? 'Avoir' : 'Soldé'}
                    />
                    <KpiCard
                        fr="Dettes fournisseurs" ar="ذمم الموردين" icon={Truck}
                        value={fmtK(Math.abs(soldes.fournisseurs))}
                        sign={soldes.fournisseurs > 0 ? 'negative' : 'positive'}
                        sub={soldes.fournisseurs > 0 ? 'À décaisser' : soldes.fournisseurs < 0 ? 'Avoir' : 'Soldé'}
                    />
                </div>

                {/* ══ FORMULE RÉSULTAT ═════════════════════════════════════════ */}
                <SectionDivider fr="Formule du résultat net" ar="معادلة صافي الربح" />

                <div className="rounded-xl border border-border bg-card px-5 py-4">
                    <div className="flex items-center gap-2 flex-wrap font-mono text-xs tabular-nums">
                        {[
                            { label: 'Marge brute',   value: fmtK(g.gross_profit),    cls: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50' },
                            { label: 'Charges',        value: fmtK(g.total_charges),   cls: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50' },
                            { label: 'Salaires',       value: fmtK(g.total_salaries),  cls: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50' },
                            { label: 'Pertes',         value: fmtK(g.total_losses),    cls: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50' },
                        ].map(({ label, value, cls }, i) => (
                            <>
                                {i > 0 && <span key={`op-${i}`} className="text-sm text-muted-foreground font-light">−</span>}
                                <span key={label} className={`inline-flex flex-col border rounded-lg px-3 py-2 ${cls}`}>
                                    <span className="text-[9px] uppercase tracking-widest opacity-70 font-bold">{label}</span>
                                    <span className="font-bold text-sm">{value} MAD</span>
                                </span>
                            </>
                        ))}
                        <span className="text-sm text-muted-foreground font-light">=</span>
                        <span className={`inline-flex flex-col border rounded-lg px-3 py-2 font-bold ${
                            isProfit
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                        }`}>
                            <span className="text-[9px] uppercase tracking-widest opacity-70 font-bold">Résultat net</span>
                            <span className="font-bold text-sm">{g.net_profit >= 0 ? '+' : ''}{fmtK(g.net_profit)} MAD</span>
                        </span>
                    </div>
                </div>

                {/* ══ ANALYSE MENSUELLE — section with inline period picker ═════ */}
                <SectionDivider
                    fr="Analyse mensuelle" ar="التحليل الشهري"
                    right={
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => navigate(-1)}
                                className="w-6 h-6 rounded-md border border-border bg-card hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors">
                                <ChevronLeft className="w-3 h-3" />
                            </button>
                            <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden h-7">
                                <select value={selectedMonth}
                                    onChange={e => router.get('/finances', { month: Number(e.target.value), year: selectedYear }, { preserveScroll: true })}
                                    className="text-xs font-semibold text-foreground bg-transparent border-0 outline-none cursor-pointer px-2 appearance-none h-full">
                                    {MONTHS_FR.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                </select>
                                <span className="text-border text-xs">|</span>
                                <select value={selectedYear}
                                    onChange={e => router.get('/finances', { month: selectedMonth, year: Number(e.target.value) }, { preserveScroll: true })}
                                    className="text-xs font-semibold text-foreground bg-transparent border-0 outline-none cursor-pointer px-2 appearance-none h-full">
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <button onClick={() => navigate(1)}
                                className="w-6 h-6 rounded-md border border-border bg-card hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors">
                                <ChevronRight className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] text-muted-foreground pl-1">{monthLabel}</span>
                        </div>
                    }
                />

                {/* Trend chart + Monthly flux — 2-col */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">

                    {/* Line chart — 2 cols */}
                    <div className="xl:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-xs font-semibold text-foreground">Évolution — 6 derniers mois</p>
                                    <p className="text-[11px] text-muted-foreground/60" dir="rtl" lang="ar">التطور خلال 6 أشهر</p>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Ventes · Marge brute · Dépenses</p>
                            </div>
                            <div className="flex items-center gap-4">
                                {[
                                    { color: '#22c55e', label: 'Ventes' },
                                    { color: '#6366f1', label: 'Marge' },
                                    { color: '#f97316', label: 'Dépenses' },
                                ].map(({ color, label }) => (
                                    <span key={label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                        <span className="w-4 h-[2px] rounded-full inline-block" style={{ backgroundColor: color }} />
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="px-5 py-4 h-52">
                            <Line data={lineData} options={lineOpts} />
                        </div>
                    </div>

                    {/* Monthly flux — 1 col */}
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        <div className="px-5 py-3 border-b border-border bg-muted/20">
                            <div className="flex items-baseline gap-2">
                                <p className="text-xs font-semibold text-foreground">Flux financiers</p>
                                <p className="text-[11px] text-muted-foreground/60" dir="rtl" lang="ar">التدفقات المالية</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{monthLabel}</p>
                        </div>
                        <div className="px-5 py-4 space-y-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-400 mb-2">Entrées</p>
                                <FlowRow label="Ventes clients"       value={`${fmtK(kpis.ca_brut)} MAD`}          positive icon={ArrowUpRight} />
                                <FlowRow label="Encaissements"        value={`${fmtK(kpis.encaissements)} MAD`}     positive icon={ArrowUpRight} />
                                {kpis.retours_four_remb > 0 && (
                                    <FlowRow label="Ret. fournisseur" value={`${fmtK(kpis.retours_four_remb)} MAD`} positive icon={ArrowUpRight} />
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-rose-600 dark:text-rose-400 mb-2">Sorties</p>
                                <FlowRow label="Achats fournisseurs" value={`${fmtK(kpis.achats_nets)} MAD`}    positive={false} icon={ArrowDownRight} />
                                <FlowRow label="Charges"             value={`${fmtK(kpis.charges_total)} MAD`}  positive={false} icon={ArrowDownRight} />
                                <FlowRow label="Salaires payés"      value={`${fmtK(kpis.salaires_payes)} MAD`} positive={false} icon={ArrowDownRight} />
                                {kpis.retours_clients > 0 && (
                                    <FlowRow label="Retours clients" value={`${fmtK(kpis.retours_clients)} MAD`} positive={false} icon={ArrowDownRight} />
                                )}
                            </div>
                            <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${
                                kpis.benefice_net >= 0
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30'
                                    : 'bg-rose-50 dark:bg-rose-950/30'
                            }`}>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Résultat {monthLabel.split(' ')[0]}
                                </span>
                                <span className={`text-sm font-bold font-mono tabular-nums ${
                                    kpis.benefice_net >= 0
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-rose-600 dark:text-rose-400'
                                }`}>
                                    {kpis.benefice_net >= 0 ? '+' : '−'}{fmtK(Math.abs(kpis.benefice_net))} MAD
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══ RÉPARTITION — doughnut + balances + alert ════════════════ */}
                <SectionDivider fr="Répartition & soldes" ar="التوزيع والأرصدة" />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">

                    {/* Doughnut — 2 cols */}
                    <div className="xl:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
                        <div className="px-5 py-3 border-b border-border bg-muted/20">
                            <div className="flex items-baseline gap-2">
                                <p className="text-xs font-semibold text-foreground">Répartition des sorties</p>
                                <p className="text-[11px] text-muted-foreground/60" dir="rtl" lang="ar">توزيع المصروفات</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Achats, charges, salaires · {monthLabel}</p>
                        </div>
                        <div className="px-5 py-5">
                            {repartitionSorties.length === 0 ? (
                                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                                    Aucune dépense ce mois
                                </div>
                            ) : (
                                <div className="flex items-center gap-8">
                                    <div className="relative shrink-0 w-32 h-32">
                                        <Doughnut data={doughnutData} options={doughnutOpts} />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Total</p>
                                            <p className="text-sm font-bold font-mono tabular-nums text-foreground">{fmtK(totalSorties)}</p>
                                            <p className="text-[9px] text-muted-foreground">MAD</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-3">
                                        {repartitionSorties.map(row => {
                                            const pct = totalSorties > 0 ? (row.amount / totalSorties) * 100 : 0;
                                            return (
                                                <div key={row.key}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                                                            <span className="text-xs text-foreground truncate">{row.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0 ml-3">
                                                            <span className="text-xs font-mono tabular-nums font-semibold text-foreground">{fmtK(row.amount)} MAD</span>
                                                            <span className="text-[10px] text-muted-foreground w-7 text-right tabular-nums">{pct.toFixed(0)}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-1 rounded-full bg-muted overflow-hidden">
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

                    {/* Balances — 1 col */}
                    <div className="flex flex-col gap-3">

                        {/* Clients */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Solde clients</p>
                                    <p className="text-[11px] text-muted-foreground/50" dir="rtl" lang="ar">رصيد العملاء</p>
                                </div>
                                <Users className="w-3.5 h-3.5 text-muted-foreground/50" />
                            </div>
                            <div className="px-4 py-3">
                                <p className={`text-xl font-bold font-mono tabular-nums ${
                                    soldes.clients > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                    {fmtK(Math.abs(soldes.clients))} MAD
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    {soldes.clients > 0 ? 'Créances à encaisser'
                                    : soldes.clients < 0 ? 'Avoir clients'
                                    : 'Comptes soldés'}
                                </p>
                            </div>
                        </div>

                        {/* Fournisseurs */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Solde fournisseurs</p>
                                    <p className="text-[11px] text-muted-foreground/50" dir="rtl" lang="ar">رصيد الموردين</p>
                                </div>
                                <Truck className="w-3.5 h-3.5 text-muted-foreground/50" />
                            </div>
                            <div className="px-4 py-3">
                                <p className={`text-xl font-bold font-mono tabular-nums ${
                                    soldes.fournisseurs > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                    {fmtK(Math.abs(soldes.fournisseurs))} MAD
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    {soldes.fournisseurs > 0 ? 'Dettes fournisseurs restantes'
                                    : soldes.fournisseurs < 0 ? 'Avoir fournisseur'
                                    : 'Aucune dette'}
                                </p>
                            </div>
                        </div>

                        {/* Losses alert */}
                        {g.total_losses > 0 && (
                            <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-card overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20">
                                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700 dark:text-amber-400">
                                        Stock endommagé
                                    </p>
                                    <p className="text-[11px] text-amber-600/60 dark:text-amber-400/50" dir="rtl" lang="ar">المخزون التالف</p>
                                </div>
                                <div className="px-4 py-3">
                                    <p className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                                        {fmtK(g.total_losses)} MAD
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                                        Pertes potentielles — produits non retournés aux fournisseurs.
                                    </p>
                                    <button className="mt-2 text-[10px] font-semibold text-amber-700 dark:text-amber-400 underline underline-offset-2 flex items-center gap-0.5"
                                        onClick={() => router.visit('/stock')}>
                                        Voir le stock <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
