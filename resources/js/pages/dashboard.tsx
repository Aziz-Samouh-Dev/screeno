import { useState, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useAppearance } from '@/hooks/use-appearance';
import type { BreadcrumbItem } from '@/types';
import {
    TrendingUp, CreditCard, ArrowRightLeft,
    Users, Truck, Package, AlertTriangle, Zap,
    UserPlus, ArrowRight, TriangleAlert,
    CircleCheck, ChevronRight, BarChart3, Activity,
} from 'lucide-react';

interface TrendPoint { label: string; sales: number; returns: number; payments: number }
interface TopClient  { uuid: string; nom: string; total_purchased: number }
interface RecentTxn  { uuid: string; type: string; client_uuid: string; client_nom: string; product_name: string | null; total_price: number; created_at: string }
interface LowStock   { uuid: string; nom: string; sku: string; stock_quantity: number }
interface DashProps {
    crm:        { total_f: number; total_r: number; total_p: number; balance: number; txn_count: number };
    counts:     { clients: number; active_clients: number; suppliers: number; products: number; low_stock: number; damaged_qty: number };
    trendData:  TrendPoint[];
    topClients: TopClient[];
    recentTxns: RecentTxn[];
    lowStockProducts: LowStock[];
    filters:    { period: string; date_from: string; date_to: string };
}

const safeNum = (v: unknown) => Number(v) || 0;

const fmt = (v: number, decimals = 0) => {
    const n = Math.abs(safeNum(v));
    const s = n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
            : n >= 1_000     ? (n / 1_000).toFixed(1) + 'K'
            : n.toFixed(decimals);
    return (v < 0 ? '-' : '') + s;
};

const fullFmt = (v: number) =>
    safeNum(v).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function timeAgo(iso: string | null | undefined) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60)    return `${s}s`;
    if (s < 3600)  return `${Math.floor(s / 60)}min`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}

const PERIODS = [
    { key: 'day',    label: "Aujourd'hui" },
    { key: 'week',   label: '7 jours'     },
    { key: 'month',  label: '30 jours'    },
    { key: 'year',   label: 'Année'       },
    { key: 'custom', label: 'Personnalisé'},
] as const;

const SERIES = [
    { key: 'sales',    label: 'Ventes',   color: '#6366f1', dash: false },
    { key: 'payments', label: 'Encaissé', color: '#10b981', dash: false },
    { key: 'returns',  label: 'Retours',  color: '#ef4444', dash: true  },
] as const;

function LineChart({ data }: { data: TrendPoint[] }) {
    const [hover, setHover] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const { resolvedAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    const gridColor  = isDark ? '#1f1f1f' : '#f1f5f9';
    const labelColor = isDark ? '#555555' : '#94a3b8';
    const dotFill    = isDark ? '#111111' : '#ffffff';
    const vline      = isDark ? '#2a2a2a' : '#cbd5e1';

    const VW = 900, VH = 220, PL = 52, PR = 12, PT = 12, PB = 32;
    const CW = VW - PL - PR, CH = VH - PT - PB;
    const n = data.length;

    if (n === 0) return (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm select-none">
            Aucune donnée sur cette période
        </div>
    );

    const allVals = data.flatMap(d => [d.sales, d.payments, d.returns]);
    const maxVal  = Math.max(...allVals, 1);
    const xAt = (i: number) => PL + (n < 2 ? CW / 2 : (i / (n - 1)) * CW);
    const yAt = (v: number) => PT + (1 - safeNum(v) / maxVal) * CH;

    const smooth = (key: keyof TrendPoint) => {
        const pts = data.map((d, i) => ({ x: xAt(i), y: yAt(safeNum(d[key])) }));
        if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
        let p = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const cx = (pts[i].x + pts[i + 1].x) / 2;
            p += ` C ${cx} ${pts[i].y}, ${cx} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
        }
        return p;
    };

    const area = (key: keyof TrendPoint) =>
        `${smooth(key)} L ${xAt(n - 1)} ${PT + CH} L ${PL} ${PT + CH} Z`;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ y: yAt(maxVal * f), v: maxVal * f }));
    const xStep  = Math.max(1, Math.ceil(n / 9));
    const xLabelSet = new Set<number>();
    for (let i = 0; i < n; i += xStep) xLabelSet.add(i);
    const lastStepIdx = Math.floor((n - 1) / xStep) * xStep;
    if (n - 1 - lastStepIdx >= Math.ceil(xStep * 0.55)) xLabelSet.add(n - 1);

    const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const px   = ((e.clientX - rect.left) / rect.width) * VW;
        let best = 0, bd = Infinity;
        for (let i = 0; i < n; i++) { const d = Math.abs(xAt(i) - px); if (d < bd) { bd = d; best = i; } }
        setHover(best);
    };

    const tipRight = hover !== null && xAt(hover) / VW > 0.6;

    return (
        <div className="relative select-none">
            <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} className="w-full block"
                preserveAspectRatio="none" style={{ height: 220 }}
                onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
                {yTicks.map((t, i) => (
                    <g key={i}>
                        <line x1={PL} y1={t.y} x2={VW - PR} y2={t.y} stroke={gridColor} strokeWidth="1" />
                        <text x={PL - 6} y={t.y + 4} textAnchor="end" fontSize="9.5" fill={labelColor} fontFamily="ui-monospace,monospace">
                            {fmt(t.v)}
                        </text>
                    </g>
                ))}
                {data.map((d, i) => xLabelSet.has(i) && (
                    <text key={i} x={xAt(i)} y={VH - 5} textAnchor="middle" fontSize="9.5" fill={labelColor}>{d.label}</text>
                ))}
                {[...SERIES].reverse().map(s => (
                    <path key={s.key} d={area(s.key)} fill={s.color} fillOpacity="0.06" />
                ))}
                {SERIES.map(s => (
                    <path key={s.key} d={smooth(s.key)} fill="none" stroke={s.color} strokeWidth="1.8"
                        strokeDasharray={s.dash ? '6 3' : undefined}
                        strokeLinejoin="round" strokeLinecap="round" />
                ))}
                {hover !== null && (
                    <g>
                        <line x1={xAt(hover)} y1={PT} x2={xAt(hover)} y2={PT + CH}
                            stroke={vline} strokeWidth="1" strokeDasharray="3 2" />
                        {SERIES.map(s => (
                            <circle key={s.key} cx={xAt(hover)} cy={yAt(safeNum(data[hover][s.key]))}
                                r="3.5" fill={dotFill} stroke={s.color} strokeWidth="2" />
                        ))}
                    </g>
                )}
                {data.map((_, i) => {
                    const x0 = i === 0     ? PL      : (xAt(i - 1) + xAt(i)) / 2;
                    const x1 = i === n - 1 ? VW - PR : (xAt(i) + xAt(i + 1)) / 2;
                    return <rect key={i} x={x0} y={PT} width={x1 - x0} height={CH} fill="transparent"
                        onMouseEnter={() => setHover(i)} />;
                })}
            </svg>
            {hover !== null && (
                <div className="absolute top-2 z-20 pointer-events-none bg-card border border-border text-foreground rounded-xl shadow-xl px-3.5 py-3 min-w-[170px]"
                    style={tipRight
                        ? { right: `${(1 - xAt(hover) / VW) * 100}%`, marginRight: 14 }
                        : { left:  `${(xAt(hover)  / VW) * 100}%`,    marginLeft:  14 }}>
                    <p className="text-[11px] text-muted-foreground font-semibold mb-2 pb-1.5 border-b border-border/60">
                        {data[hover].label}
                    </p>
                    <div className="space-y-1.5">
                        {SERIES.map(s => (
                            <div key={s.key} className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                                    {s.label}
                                </span>
                                <span className="text-[11px] font-mono font-bold text-foreground">
                                    {fullFmt(safeNum(data[hover][s.key]))}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, unit, sub, Icon, iconBg, iconColor, footer }: {
    label: string; value: string; unit?: string; sub?: string;
    Icon: React.ElementType; iconBg: string; iconColor: string;
    footer?: { left: string; right: string; rightColor?: string };
}) {
    return (
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className={`p-2 rounded-lg ${iconBg}`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
            </div>
            <p className="text-2xl font-bold text-foreground leading-none">
                {value}
                {unit && <span className="text-sm font-normal text-muted-foreground ml-1.5">{unit}</span>}
            </p>
            {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
            {footer && (
                <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{footer.left}</span>
                    <span className={`text-xs font-semibold font-mono ${footer.rightColor ?? 'text-foreground/70'}`}>{footer.right}</span>
                </div>
            )}
        </div>
    );
}

const AVATAR_COLORS = [
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400',
    'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
    'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
    'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400',
];
const avatarCls = (n: string) => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length];
const initials  = (n: string) => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Tableau de bord', href: '/dashboard' }];

export default function Dashboard() {
    const raw  = usePage().props as unknown as Partial<DashProps>;
    const crm  = raw.crm    ?? { total_f:0, total_r:0, total_p:0, balance:0, txn_count:0 };
    const cnt  = raw.counts ?? { clients:0, active_clients:0, suppliers:0, products:0, low_stock:0, damaged_qty:0 };
    const trend    = raw.trendData        ?? [];
    const tops     = raw.topClients       ?? [];
    const txns     = raw.recentTxns       ?? [];
    const lowStock = raw.lowStockProducts ?? [];
    const sf       = raw.filters          ?? { period:'month', date_from:'', date_to:'' };

    const [period,   setPeriod]   = useState(sf.period    ?? 'month');
    const [dateFrom, setDateFrom] = useState(sf.date_from ?? '');
    const [dateTo,   setDateTo]   = useState(sf.date_to   ?? '');

    const applyFilter = (p = period, f = dateFrom, t = dateTo) =>
        router.get('/dashboard', {
            period: p,
            ...(p === 'custom' ? { date_from: f || undefined, date_to: t || undefined } : {}),
        }, { preserveState: false });

    const pickPeriod = (p: string) => { setPeriod(p); if (p !== 'custom') applyFilter(p); };

    const topMax    = Math.max(...tops.map(c => c.total_purchased), 1);
    const seriesMax = Math.max(...SERIES.map(s => trend.reduce((a, d) => a + safeNum(d[s.key]), 0)), 1);

    const txnCfg: Record<string, { label: string; cls: string; dot: string }> = {
        F: { label: 'Vente',    cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60',   dot: 'bg-indigo-500'  },
        R: { label: 'Retour',   cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60',                     dot: 'bg-red-500'     },
        P: { label: 'Paiement', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60', dot: 'bg-emerald-500' },
    };

    const quickActions = [
        { label: 'Nouveau client', sub: 'Ajouter au portefeuille', href: '/clients/create', Icon: UserPlus,   bg: 'bg-indigo-50 dark:bg-indigo-950/40',  ic: 'text-indigo-600 dark:text-indigo-400'   },
        { label: 'Voir paiements', sub: 'Historique complet',      href: '/payments',       Icon: CreditCard, bg: 'bg-emerald-50 dark:bg-emerald-950/40', ic: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Clients',        sub: 'Gérer le portefeuille',   href: '/clients',        Icon: Users,      bg: 'bg-blue-50 dark:bg-blue-950/40',       ic: 'text-blue-600 dark:text-blue-400'       },
        { label: 'Fournisseurs',   sub: 'Voir les contacts',       href: '/suppliers',      Icon: Truck,      bg: 'bg-violet-50 dark:bg-violet-950/40',   ic: 'text-violet-600 dark:text-violet-400'   },
    ];

    const inventoryItems = [
        { label: 'Clients actifs', value: cnt.active_clients, Icon: Users,         bg: 'bg-indigo-50 dark:bg-indigo-950/40',  ic: 'text-indigo-600 dark:text-indigo-400',  href: '/clients'   },
        { label: 'Fournisseurs',   value: cnt.suppliers,      Icon: Truck,         bg: 'bg-violet-50 dark:bg-violet-950/40',  ic: 'text-violet-600 dark:text-violet-400',  href: '/suppliers' },
        { label: 'Produits',       value: cnt.products,       Icon: Package,       bg: 'bg-amber-50 dark:bg-amber-950/40',    ic: 'text-amber-600 dark:text-amber-400',    href: '/produits'  },
        { label: 'Stock faible',   value: cnt.low_stock,      Icon: AlertTriangle, bg: 'bg-orange-50 dark:bg-orange-950/40',  ic: 'text-orange-600 dark:text-orange-400',  href: '/produits'  },
        { label: 'Endommagés',     value: cnt.damaged_qty,    Icon: Zap,           bg: 'bg-red-50 dark:bg-red-950/40',        ic: 'text-red-600 dark:text-red-400',        href: '/stock'     },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tableau de bord" />

            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Tableau de bord</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {new Date().toLocaleDateString('fr-MA', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-0.5 bg-card border border-border rounded-lg p-1">
                        {PERIODS.map(p => (
                            <button key={p.key} type="button" onClick={() => pickPeriod(p.key)}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                                    period === p.key
                                        ? 'bg-foreground text-background shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                }`}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {period === 'custom' && (
                    <div className="flex items-center gap-3 flex-wrap bg-card border border-border rounded-xl px-4 py-3 shadow-sm">
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="border border-border rounded-lg px-3 py-1.5 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="border border-border rounded-lg px-3 py-1.5 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                        <button type="button" onClick={() => applyFilter()}
                            className="bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors">
                            Appliquer
                        </button>
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Ventes clients" value={fmt(crm.total_f)} unit="MAD"
                        sub={`${crm.txn_count} opération${crm.txn_count !== 1 ? 's' : ''} · période`}
                        Icon={TrendingUp} iconBg="bg-indigo-50 dark:bg-indigo-950/40" iconColor="text-indigo-600 dark:text-indigo-400"
                        footer={{ left: 'Solde impayé', right: `${fmt(crm.balance)} MAD`, rightColor: crm.balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground/60' }} />
                    <StatCard label="Encaissé" value={fmt(crm.total_p)} unit="MAD" sub="Paiements reçus · période"
                        Icon={CreditCard} iconBg="bg-emerald-50 dark:bg-emerald-950/40" iconColor="text-emerald-600 dark:text-emerald-400"
                        footer={{ left: 'Retours clients', right: `- ${fmt(crm.total_r)} MAD`, rightColor: 'text-red-500 dark:text-red-400' }} />
                    <StatCard label="Retours clients" value={fmt(crm.total_r)} unit="MAD" sub="Retours sur la période"
                        Icon={ArrowRightLeft} iconBg="bg-red-50 dark:bg-red-950/40" iconColor="text-red-500 dark:text-red-400" />
                    <StatCard label="Solde net" value={fmt(crm.total_f - crm.total_r - crm.total_p)} unit="MAD" sub="Ventes − retours − encaissé"
                        Icon={BarChart3}
                        iconBg={crm.total_f - crm.total_r - crm.total_p >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-red-50 dark:bg-red-950/40'}
                        iconColor={crm.total_f - crm.total_r - crm.total_p >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} />
                </div>

                {/* Chart */}
                <div className="bg-card rounded-xl border border-border shadow-sm">
                    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/60 flex-wrap gap-3">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Évolution des flux</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {PERIODS.find(p => p.key === period)?.label}
                                {period === 'custom' && dateFrom && dateTo ? ` · ${dateFrom} → ${dateTo}` : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-5 flex-wrap">
                            {SERIES.map(s => {
                                const total = trend.reduce((a, d) => a + safeNum(d[s.key]), 0);
                                return (
                                    <div key={s.key} className="flex items-center gap-1.5">
                                        <svg width="18" height="10" className="shrink-0">
                                            <line x1="0" y1="5" x2="18" y2="5" stroke={s.color} strokeWidth="2"
                                                strokeDasharray={s.dash ? '4 2' : undefined} />
                                        </svg>
                                        <span className="text-xs text-muted-foreground">{s.label}</span>
                                        <span className="text-xs font-semibold font-mono text-foreground">{fmt(total)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="px-3 py-4">
                        <LineChart data={trend} />
                    </div>
                </div>

                {/* Middle Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Top Clients */}
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40">
                                    <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">Top clients</h2>
                                    <p className="text-xs text-muted-foreground">Par ventes · période</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => router.visit('/clients')}
                                className="text-xs text-muted-foreground hover:text-indigo-500 flex items-center gap-0.5 transition-colors">
                                Tous <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        {tops.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <Users className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Aucune vente sur la période</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-4">
                                {tops.map((c, i) => (
                                    <div key={c.uuid} className="cursor-pointer group"
                                        onClick={() => router.visit(`/clients/${c.uuid}/ledger`)}>
                                        <div className="flex items-center gap-2.5 mb-1.5">
                                            <span className="text-[11px] font-bold text-muted-foreground w-4 shrink-0">#{i+1}</span>
                                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarCls(c.nom || 'A')}`}>
                                                {initials(c.nom || 'NA')}
                                            </div>
                                            <span className="text-xs font-semibold text-foreground group-hover:text-indigo-500 transition-colors truncate flex-1">
                                                {c.nom || 'N/A'}
                                            </span>
                                            <span className="text-xs font-mono font-bold text-foreground shrink-0">
                                                {fmt(c.total_purchased)}
                                            </span>
                                        </div>
                                        <div className="ml-10 h-1 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                                                style={{ width: `${Math.round((c.total_purchased / topMax) * 100)}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-muted">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">Activité récente</h2>
                                    <p className="text-xs text-muted-foreground">8 dernières opérations</p>
                                </div>
                            </div>
                        </div>
                        {txns.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <Activity className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Aucune transaction</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {txns.map(t => {
                                    const b = txnCfg[t.type] ?? { label: t.type, cls: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' };
                                    return (
                                        <div key={t.uuid ?? Math.random()}
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent cursor-pointer transition-colors"
                                            onClick={() => t.client_uuid && router.visit(`/clients/${t.client_uuid}/ledger`)}>
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${b.cls}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                                                {b.label}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-foreground truncate">{t.client_nom || 'N/A'}</p>
                                                {t.product_name && <p className="text-[10px] text-muted-foreground truncate">{t.product_name}</p>}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-mono font-bold text-foreground">{fmt(t.total_price)}</p>
                                                <p className="text-[10px] text-muted-foreground">{timeAgo(t.created_at)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right col */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
                            <h2 className="text-sm font-semibold text-foreground mb-4">Répartition · période</h2>
                            <div className="space-y-3.5">
                                {SERIES.map(s => {
                                    const total = trend.reduce((a, d) => a + safeNum(d[s.key]), 0);
                                    const pct   = Math.round((total / seriesMax) * 100);
                                    return (
                                        <div key={s.key}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                                                    {s.label}
                                                </span>
                                                <span className="text-xs font-mono font-semibold text-foreground">{fmt(total)} MAD</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${pct}%`, background: s.color }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
                            <h2 className="text-sm font-semibold text-foreground mb-3">Inventaire global</h2>
                            <div className="grid grid-cols-3 gap-2">
                                {inventoryItems.map(item => (
                                    <button key={item.label} type="button" onClick={() => router.visit(item.href)}
                                        className="rounded-lg p-2.5 text-left hover:opacity-80 transition-opacity cursor-pointer border border-border/60 hover:border-border">
                                        <div className={`p-1.5 rounded-md ${item.bg} w-fit mb-1.5`}>
                                            <item.Icon className={`h-3.5 w-3.5 ${item.ic}`} />
                                        </div>
                                        <p className="text-base font-bold text-foreground leading-none">{item.value ?? 0}</p>
                                        <p className="text-[9px] text-muted-foreground mt-1 leading-tight">{item.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {lowStock.length > 0 ? (
                        <div className="bg-card rounded-xl border border-orange-200 dark:border-orange-900/50 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-orange-100 dark:border-orange-900/40">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40">
                                        <TriangleAlert className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Alertes stock</p>
                                        <p className="text-xs text-muted-foreground">{cnt.low_stock} produit{cnt.low_stock !== 1 ? 's' : ''} à réapprovisionner</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => router.visit('/produits')}
                                    className="text-xs text-muted-foreground hover:text-orange-500 flex items-center gap-0.5 transition-colors">
                                    Gérer <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <div className="divide-y divide-border/50">
                                {lowStock.map(p => (
                                    <div key={p.uuid}
                                        className="flex items-center justify-between px-5 py-2.5 hover:bg-accent cursor-pointer transition-colors"
                                        onClick={() => router.visit(`/produits/${p.uuid}`)}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-muted">
                                                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-foreground">{p.nom || 'N/A'}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono">{p.sku || '—'}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                                            p.stock_quantity === 0
                                                ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                                                : 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400'
                                        }`}>
                                            {p.stock_quantity ?? 0} u.
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 shrink-0">
                                <CircleCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Stock en bonne santé</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Aucun produit sous le seuil d'alerte</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-card rounded-xl border border-border shadow-sm p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-3">Accès rapide</h2>
                        <div className="grid grid-cols-2 gap-2.5">
                            {quickActions.map(item => (
                                <button key={item.href} type="button" onClick={() => router.visit(item.href)}
                                    className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3 text-left hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group">
                                    <div className={`p-2 rounded-lg ${item.bg} shrink-0 group-hover:scale-105 transition-transform`}>
                                        <item.Icon className={`h-4 w-4 ${item.ic}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-foreground truncate">{item.label}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{item.sub}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
