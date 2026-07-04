import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    TrendingUp, TrendingDown, ShoppingCart, Wallet,
    Users, Truck, ArrowUpRight, ArrowDownRight,
    ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Finances', href: '/finances' }];

const MONTHS_FR = [
    'Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

interface Kpi {
    ca_brut: number; ca_net: number; retours_clients: number; encaissements: number;
    achats_bruts: number; achats_nets: number; retours_four_remb: number; decaissements_four: number;
    charges_total: number; salaires_payes: number; total_sorties: number;
    benefice_net: number; marge_nette: number;
}
interface Soldes { clients: number; fournisseurs: number }
interface TrendPoint { label: string; revenue: number; charges: number }
interface SortieRow  { key: string; label: string; amount: number; color: string }

const fmtK = (n: number) => {
    const abs = Math.abs(n);
    const s = abs >= 1_000_000 ? (abs / 1_000_000).toFixed(1) + 'M'
            : abs >= 1_000     ? (abs / 1_000).toFixed(1) + 'K'
            : abs.toFixed(0);
    return (n < 0 ? '-' : '') + s;
};

const fmtFull = (n: number) =>
    Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';

/* ─── KPI card — gradient style matching hero ─── */
function KpiCard({ label, value, info1Label, info1Value, info2Label, info2Value, icon: Icon, gradient }: {
    label: string; value: string;
    info1Label: string; info1Value: string;
    info2Label: string; info2Value: string;
    icon: React.ElementType; gradient: string;
}) {
    return (
        <div className={`rounded-2xl p-5 flex flex-col gap-3 ${gradient}`}>
            <div className="flex items-start justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/70 pt-0.5">{label}</p>
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>
            <div>
                <p className="text-2xl font-bold tracking-tight font-mono leading-none text-white">{value}</p>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-2 bg-white/15 rounded-xl px-3 py-2.5">
                <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 mb-0.5">{info1Label}</p>
                    <p className="text-xs font-bold text-white truncate">{info1Value}</p>
                </div>
                <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 mb-0.5">{info2Label}</p>
                    <p className="text-xs font-bold text-white truncate">{info2Value}</p>
                </div>
            </div>
        </div>
    );
}

/* ─── Flow row ─── */
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

export default function FinancesIndex() {
    const {
        monthLabel, selectedMonth, selectedYear,
        kpis, soldes, monthlyTrend, repartitionSorties,
    } = usePage().props as unknown as {
        monthLabel: string; selectedMonth: number; selectedYear: number;
        kpis: Kpi; soldes: Soldes;
        monthlyTrend: TrendPoint[]; repartitionSorties: SortieRow[];
    };

    const { resolvedAppearance } = useAppearance();
    const isDark    = resolvedAppearance === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    const tickColor = isDark ? '#64748b' : '#94a3b8';
    const isProfit  = kpis.benefice_net >= 0;

    function navigate(delta: number) {
        let m = selectedMonth + delta;
        let y = selectedYear;
        if (m > 12) { m = 1;  y++; }
        if (m < 1)  { m = 12; y--; }
        router.get('/finances', { month: m, year: y }, { preserveScroll: true });
    }

    /* ── gradient line chart ── */
    const lineData = {
        labels: monthlyTrend.map(m => m.label),
        datasets: [
            {
                label: 'Revenus nets',
                data: monthlyTrend.map(m => m.revenue),
                borderColor: '#22c55e',
                backgroundColor: (ctx: any) => {
                    const { chartArea, ctx: c } = ctx.chart;
                    if (!chartArea) return 'transparent';
                    const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    g.addColorStop(0, 'rgba(34,197,94,0.22)');
                    g.addColorStop(1, 'rgba(34,197,94,0)');
                    return g;
                },
                fill: true, tension: 0.45, pointRadius: 4, pointHoverRadius: 7,
                pointBackgroundColor: '#22c55e',
                pointBorderColor: isDark ? '#0f172a' : '#ffffff',
                pointBorderWidth: 2, borderWidth: 2.5,
            },
            {
                label: 'Dépenses',
                data: monthlyTrend.map(m => m.charges),
                borderColor: '#f97316',
                backgroundColor: (ctx: any) => {
                    const { chartArea, ctx: c } = ctx.chart;
                    if (!chartArea) return 'transparent';
                    const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    g.addColorStop(0, 'rgba(249,115,22,0.18)');
                    g.addColorStop(1, 'rgba(249,115,22,0)');
                    return g;
                },
                fill: true, tension: 0.45, pointRadius: 4, pointHoverRadius: 7,
                pointBackgroundColor: '#f97316',
                pointBorderColor: isDark ? '#0f172a' : '#ffffff',
                pointBorderWidth: 2, borderWidth: 2.5,
            },
        ],
    };

    const lineOptions: any = {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
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

    /* ── doughnut ── */
    const totalSorties = repartitionSorties.reduce((s, r) => s + r.amount, 0);

    const doughnutData = {
        labels: repartitionSorties.map(r => r.label),
        datasets: [{
            data: repartitionSorties.map(r => r.amount),
            backgroundColor: repartitionSorties.map(r => r.color),
            borderWidth: 3,
            borderColor: isDark ? '#0f172a' : '#ffffff',
            hoverOffset: 8,
        }],
    };

    const doughnutOptions: any = {
        responsive: true, maintainAspectRatio: false, cutout: '76%',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderWidth: 1,
                bodyColor: isDark ? '#f1f5f9' : '#0f172a',
                padding: 10,
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
            <div className="p-6 flex flex-col gap-5 min-h-0">

                {/* ══ HEADER ══ */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Finances</h1>
                        <p className="text-sm text-muted-foreground">Ventes · achats · charges · salaires</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Month/year navigator */}
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
                        <button onClick={() => router.visit('/charges')}
                            className="h-9 px-4 text-sm font-medium rounded-xl border border-border bg-card hover:bg-accent text-foreground transition-colors">
                            Charges
                        </button>
                        <button onClick={() => router.visit('/employees')}
                            className="h-9 px-4 text-sm font-medium rounded-xl border border-border bg-card hover:bg-accent text-foreground transition-colors">
                            Employés
                        </button>
                        <button onClick={() => router.visit('/charges')}
                            className="h-9 px-4 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                            + Nouvelle charge
                        </button>
                    </div>
                </div>

                {/* ══ 4 KPIs ══ */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* Résultat net */}
                    <KpiCard
                        label="Résultat net"
                        value={`${fmtK(kpis.benefice_net)} MAD`}
                        info1Label="CA net" info1Value={`${fmtK(kpis.ca_net)} MAD`}
                        info2Label="Dépenses" info2Value={`${fmtK(kpis.total_sorties)} MAD`}
                        icon={isProfit ? TrendingUp : TrendingDown}
                        gradient={isProfit ? 'bg-linear-to-br from-emerald-500 to-emerald-600' : 'bg-linear-to-br from-rose-500 to-rose-600'}
                    />
                    {/* CA */}
                    <KpiCard
                        label="Chiffre d'affaires"
                        value={`${fmtK(kpis.ca_brut)} MAD`}
                        info1Label="CA net" info1Value={`${fmtK(kpis.ca_net)} MAD`}
                        info2Label="Retours" info2Value={kpis.retours_clients > 0 ? `−${fmtK(kpis.retours_clients)} MAD` : '0 MAD'}
                        icon={TrendingUp}
                        gradient="bg-linear-to-br from-blue-500 to-blue-600"
                    />
                    {/* Dépenses */}
                    <KpiCard
                        label="Total dépenses"
                        value={`${fmtK(kpis.total_sorties)} MAD`}
                        info1Label="Achats" info1Value={`${fmtK(kpis.achats_nets)} MAD`}
                        info2Label="Ch. + Sal." info2Value={`${fmtK(kpis.charges_total + kpis.salaires_payes)} MAD`}
                        icon={ShoppingCart}
                        gradient="bg-linear-to-br from-orange-500 to-orange-600"
                    />
                    {/* Marge */}
                    <KpiCard
                        label="Marge nette"
                        value={`${kpis.marge_nette} %`}
                        info1Label="Encaissements" info1Value={`${fmtK(kpis.encaissements)} MAD`}
                        info2Label="Rentabilité" info2Value={isProfit ? 'Bénéficiaire' : 'Déficitaire'}
                        icon={Wallet}
                        gradient={isProfit ? 'bg-linear-to-br from-violet-500 to-violet-600' : 'bg-linear-to-br from-rose-500 to-rose-600'}
                    />
                </div>

                {/* ══ MAIN 2-COLUMN BODY ══ */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">

                    {/* ── LEFT: Chart + Doughnut ── */}
                    <div className="xl:col-span-3 flex flex-col gap-4">

                        {/* Line chart card */}
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-foreground">Revenus vs dépenses</h3>
                                    <p className="text-xs text-muted-foreground">6 derniers mois</p>
                                </div>
                                <div className="flex items-center gap-5 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-6 h-0.5 rounded-full bg-emerald-500 inline-block" /> Revenus
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-6 h-0.5 rounded-full bg-orange-400 inline-block" /> Dépenses
                                    </span>
                                </div>
                            </div>
                            {/* Mini stat row */}
                            <div className="flex gap-6 mb-4 pb-4 border-b border-border/40">
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Revenu net · {monthLabel}</p>
                                    <p className="text-xl font-bold font-mono text-emerald-500 leading-tight mt-0.5">{fmtFull(kpis.ca_net)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dépenses · {monthLabel}</p>
                                    <p className="text-xl font-bold font-mono text-orange-500 leading-tight mt-0.5">{fmtFull(kpis.total_sorties)}</p>
                                </div>
                            </div>
                            <div className="h-52">
                                <Line data={lineData} options={lineOptions} />
                            </div>
                        </div>

                        {/* Doughnut card */}
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <div className="mb-4">
                                <h3 className="font-bold text-foreground">Répartition des sorties</h3>
                                <p className="text-xs text-muted-foreground">Achats, charges et salaires · {monthLabel}</p>
                            </div>
                            {repartitionSorties.length === 0 ? (
                                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                                    Aucune dépense ce mois
                                </div>
                            ) : (
                                <div className="flex items-center gap-8">
                                    <div className="relative shrink-0 w-36 h-36">
                                        <Doughnut data={doughnutData} options={doughnutOptions} />
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

                    {/* ── RIGHT: Flux + Soldes ── */}
                    <div className="xl:col-span-2 flex flex-col gap-4">

                        {/* Flux detail */}
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <div className="mb-4">
                                <h3 className="font-bold text-foreground">Flux financiers</h3>
                                <p className="text-xs text-muted-foreground">{monthLabel} · entrées &amp; sorties</p>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Entrées</p>
                            <FlowRow label="Ventes clients"      value={fmtK(kpis.ca_brut)}          positive icon={ArrowUpRight} />
                            <FlowRow label="Encaissements"       value={fmtK(kpis.encaissements)}     positive icon={ArrowUpRight} />
                            {kpis.retours_four_remb > 0 && (
                                <FlowRow label="Ret. four. (remb.)" value={fmtK(kpis.retours_four_remb)} positive icon={ArrowUpRight} />
                            )}
                            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1 mt-4">Sorties</p>
                            <FlowRow label="Achats fournisseurs" value={fmtK(kpis.achats_nets)}       positive={false} icon={ArrowDownRight} />
                            <FlowRow label="Charges"             value={fmtK(kpis.charges_total)}     positive={false} icon={ArrowDownRight} />
                            <FlowRow label="Salaires payés"      value={fmtK(kpis.salaires_payes)}    positive={false} icon={ArrowDownRight} />
                            {kpis.retours_clients > 0 && (
                                <FlowRow label="Retours clients" value={fmtK(kpis.retours_clients)}   positive={false} icon={ArrowDownRight} />
                            )}
                            {/* Result */}
                            <div className={`mt-4 rounded-xl px-4 py-3 flex items-center justify-between ${
                                isProfit ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-rose-50 dark:bg-rose-950/30'
                            }`}>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Résultat net</span>
                                <span className={`text-sm font-bold font-mono ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {isProfit ? '+' : '−'}{fmtK(Math.abs(kpis.benefice_net))} MAD
                                </span>
                            </div>
                        </div>

                        {/* Solde clients */}
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Solde clients</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Créances all-time</p>
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
                                {soldes.clients > 0 ? '← Montant à encaisser' : soldes.clients < 0 ? '→ Avoir clients' : 'Compte soldé ✓'}
                            </p>
                        </div>

                        {/* Solde fournisseurs */}
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Solde fournisseurs</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Dettes all-time</p>
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
                                {soldes.fournisseurs > 0 ? '→ Montant à décaisser' : soldes.fournisseurs < 0 ? '← Avoir fournisseur' : 'Compte soldé ✓'}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
