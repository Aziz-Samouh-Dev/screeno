<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
@page { size: A4 portrait; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #1a1a1a; background: #fff; line-height: 1.4; padding: 14mm; }

/* ── Header ── */
.top { width: 100%; border-bottom: 3px solid #1e293b; padding-bottom: 14px; margin-bottom: 14px; }
.top td { vertical-align: top; }
.co-name  { font-size: 18px; font-weight: 900; color: #1e293b; }
.co-meta  { font-size: 8px; color: #64748b; line-height: 1.8; margin-top: 5px; }
.doc-label { font-size: 26px; font-weight: 900; color: #1e293b; text-align: right; letter-spacing: -1px; }
.doc-sub   { font-size: 10px; font-weight: 700; color: #6d28d9; text-align: right; margin-top: 3px; font-family: "Courier New", monospace; }
.doc-meta  { text-align: right; margin-top: 6px; font-size: 8px; color: #64748b; }

/* ── Supplier info + Summary ── */
.bts { width: 100%; margin-bottom: 16px; }
.bts td { vertical-align: top; }
.section-lbl  { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid #e2e8f0; }
.party-name   { font-size: 13px; font-weight: 900; color: #1e293b; margin-top: 4px; margin-bottom: 3px; }
.party-detail { font-size: 8px; color: #475569; line-height: 1.8; }

.sum-box { border: 1px solid #e2e8f0; border-collapse: collapse; margin-top: 4px; }
.sum-box td { padding: 0; }
.sum-row { width: 100%; border-collapse: collapse; border-bottom: 1px solid #f1f5f9; }
.sum-row td { padding: 5px 10px; font-size: 8.5px; }
.sum-l { color: #64748b; }
.sum-r { text-align: right; font-weight: 700; font-family: "Courier New", monospace; }
.sum-final { width: 100%; border-collapse: collapse; background: #1e293b; }
.sum-final td { padding: 8px 10px; }
.sum-fl { color: #94a3b8; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; }
.sum-fr { text-align: right; color: #fff; font-size: 12px; font-weight: 900; font-family: "Courier New", monospace; }

/* ── Section titles ── */
.sec { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1e293b; padding-bottom: 5px; border-bottom: 2px solid #1e293b; margin-bottom: 10px; margin-top: 18px; }

/* ── Invoice cards ── */
.card { border: 1px solid #e2e8f0; margin-bottom: 10px; page-break-inside: avoid; }
.card-hd { background: #f5f3ff; padding: 8px 12px; }
.card-hd td { vertical-align: middle; }
.card-code { font-size: 11px; font-weight: 900; font-family: "Courier New", monospace; color: #6d28d9; }
.card-date { font-size: 8px; color: #64748b; margin-left: 10px; }
.sbadge         { font-size: 7.5px; font-weight: 700; padding: 2px 7px; border: 1px solid; }
.sbadge-paid    { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.sbadge-partial { background: #fffbeb; color: #b45309; border-color: #fde68a; }
.sbadge-unpaid  { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

.card-it { width: 100%; border-collapse: collapse; }
.card-it th { padding: 5px 10px; text-align: left; font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; background: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; }
.card-it th:last-child { border-right: none; }
.card-it th.r { text-align: right; }
.card-it th.c { text-align: center; }
.card-it td { padding: 6px 10px; font-size: 8.5px; color: #334155; border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; }
.card-it td:last-child { border-right: none; }
.card-it td.r { text-align: right; font-family: "Courier New", monospace; }
.card-it td.c { text-align: center; }

.card-ft { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 6px 12px; }
.card-ft td { font-size: 8.5px; }
.card-total { font-weight: 900; text-align: right; color: #1e293b; font-family: "Courier New", monospace; }
.notes-row { padding: 5px 12px; font-size: 8px; color: #94a3b8; font-style: italic; border-top: 1px solid #f1f5f9; }

/* ── Payments table ── */
.pay-title { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-top: 18px; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid #e2e8f0; }
.pay { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; }
.pay thead tr { background: #f0fdf4; }
.pay thead th { padding: 6px 10px; text-align: left; font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #15803d; border-bottom: 1px solid #bbf7d0; border-right: 1px solid #d1fae5; }
.pay thead th:last-child { border-right: none; }
.pay thead th.r { text-align: right; }
.pay tbody td { padding: 6px 10px; font-size: 8.5px; color: #334155; border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; }
.pay tbody td:last-child { border-right: none; }
.pay tbody td.r { text-align: right; font-family: "Courier New", monospace; font-weight: 700; color: #16a34a; }
.pay tfoot td { padding: 6px 10px; font-size: 8.5px; font-weight: 700; border-top: 2px solid #bbf7d0; background: #f0fdf4; }
.pay tfoot td.r { text-align: right; font-family: "Courier New", monospace; color: #15803d; }

/* ── Grand total ── */
.gt-wrap { margin-top: 20px; border-top: 2px solid #1e293b; padding-top: 14px; }
.gt-box  { width: 280px; margin-left: auto; border: 1px solid #cbd5e1; border-collapse: collapse; }
.gt-box td { padding: 0; }
.gt-row  { width: 100%; border-collapse: collapse; border-bottom: 1px solid #e2e8f0; }
.gt-row td { padding: 6px 12px; font-size: 8.5px; }
.gt-l { color: #64748b; }
.gt-r { text-align: right; font-weight: 700; font-family: "Courier New", monospace; }
.gt-final { width: 100%; border-collapse: collapse; background: #1e293b; }
.gt-final td { padding: 9px 12px; }
.gt-fl { color: #94a3b8; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; }
.gt-fr { text-align: right; color: #fff; font-size: 13px; font-weight: 900; font-family: "Courier New", monospace; }

.footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #e2e8f0; width: 100%; }
.footer td { font-size: 7.5px; color: #94a3b8; }
.bold { font-weight: 700; }
.mono { font-family: "Courier New", monospace; }
</style>
</head>
<body>

{{-- HEADER --}}
<table class="top"><tr>
    <td style="width:55%">
        @if(!empty($company['name']))
            <div class="co-name">{{ $company['name'] }}</div>
        @endif
        <div class="co-meta">
            @if(!empty($company['address'])){{ $company['address'] }}<br>@endif
            @if(!empty($company['city'])){{ $company['city'] }}<br>@endif
            @if(!empty($company['phone']))Tél : {{ $company['phone'] }}<br>@endif
            @if(!empty($company['email'])){{ $company['email'] }}<br>@endif
            @if(!empty($company['tax_id']))IF : {{ $company['tax_id'] }}
                @if(!empty($company['ice'])) &nbsp;·&nbsp; ICE : {{ $company['ice'] }}@endif
            @elseif(!empty($company['ice']))ICE : {{ $company['ice'] }}@endif
        </div>
    </td>
    <td style="width:45%; vertical-align:top; text-align:right">
        <div class="doc-label">HISTORIQUE FOURNISSEUR</div>
        <div class="doc-sub">{{ $supplier->nom }}</div>
        @if(!empty($dateFrom) || !empty($dateTo))
        <div class="doc-meta" style="margin-top:4px; font-weight:700; color:#1e293b">
            Période : {{ $dateFrom ?? '—' }} → {{ $dateTo ?? '—' }}
        </div>
        @endif
        <div class="doc-meta">Généré le {{ now()->format('d/m/Y H:i') }}</div>
    </td>
</tr></table>

{{-- SUPPLIER + SUMMARY --}}
<table class="bts"><tr>
    <td style="width:48%; padding-right:20px">
        <div class="section-lbl">Informations fournisseur</div>
        <div class="party-name">{{ $supplier->nom }}</div>
        <div class="party-detail">
            @if($supplier->email)    {{ $supplier->email }}<br>@endif
            @if($supplier->telephone)Tél : {{ $supplier->telephone }}<br>@endif
            @if($supplier->adresse)  {{ $supplier->adresse }}<br>@endif
            @if($supplier->ville)    {{ $supplier->ville }}@endif
        </div>
    </td>
    <td style="width:52%">
        <div class="section-lbl">Résumé financier</div>
        <table class="sum-box" style="width:100%; margin-top:4px">
            <tr><td>
                <table class="sum-row" style="width:100%"><tr>
                    <td class="sum-l">Total acheté</td>
                    <td class="sum-r">{{ number_format($totalPurchased, 2, ',', ' ') }} MAD</td>
                </tr></table>
            </td></tr>
            <tr><td>
                <table class="sum-row" style="width:100%"><tr>
                    <td class="sum-l">Total réglé</td>
                    <td class="sum-r" style="color:#16a34a">{{ number_format($totalPaid, 2, ',', ' ') }} MAD</td>
                </tr></table>
            </td></tr>
            <tr><td>
                <table class="sum-final" style="width:100%"><tr>
                    <td class="sum-fl">Solde dû</td>
                    <td class="sum-fr">{{ number_format($balance, 2, ',', ' ') }} MAD</td>
                </tr></table>
            </td></tr>
        </table>
    </td>
</tr></table>

{{-- FACTURES D'ACHAT --}}
@if($invoices->count())
<div class="sec">Factures d'achat &nbsp;({{ $invoices->count() }})</div>
@foreach($invoices as $inv)
<div class="card">
    <table class="card-hd" style="width:100%"><tr>
        <td>
            <span class="card-code">{{ $inv['code'] }}</span>
            <span class="card-date">{{ $inv['created_at'] }}</span>
        </td>
        <td style="text-align:right">
            <span class="sbadge sbadge-{{ $inv['status'] }}">
                {{ $inv['status'] === 'paid' ? 'Payée' : ($inv['status'] === 'partial' ? 'Partielle' : 'Impayée') }}
            </span>
        </td>
    </tr></table>
    @if(count($inv['items']))
    <table class="card-it">
        <thead><tr>
            <th>Désignation</th>
            <th class="c" style="width:50px">Qté</th>
            <th class="r" style="width:110px">Prix unit.</th>
            <th class="r" style="width:110px">Total</th>
        </tr></thead>
        <tbody>
            @foreach($inv['items'] as $item)
            <tr>
                <td class="bold">{{ $item['product_name'] }}</td>
                <td class="c">{{ $item['quantity'] }}</td>
                <td class="r mono">{{ number_format($item['unit_price'], 2, ',', ' ') }} MAD</td>
                <td class="r mono bold">{{ number_format($item['total_price'], 2, ',', ' ') }} MAD</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif
    <table class="card-ft" style="width:100%"><tr>
        <td>
            Payé : <span class="bold mono" style="color:#16a34a">{{ number_format($inv['paid_amount'], 2, ',', ' ') }} MAD</span>
            &nbsp;&nbsp;
            Reste : <span class="bold mono" style="color:{{ $inv['remaining_amount'] > 0 ? '#dc2626' : '#16a34a' }}">{{ number_format($inv['remaining_amount'], 2, ',', ' ') }} MAD</span>
        </td>
        <td class="card-total">{{ number_format($inv['total_amount'], 2, ',', ' ') }} MAD</td>
    </tr></table>
    @if($inv['notes'])<div class="notes-row">{{ $inv['notes'] }}</div>@endif
</div>
@endforeach
@endif

{{-- PAIEMENTS --}}
@if($payments->count())
<div class="pay-title">Historique des paiements &nbsp;({{ $payments->count() }})</div>
<table class="pay">
    <thead><tr>
        <th>Date</th>
        <th>Facture</th>
        <th>Méthode</th>
        <th>Référence</th>
        <th class="r">Montant</th>
    </tr></thead>
    <tbody>
        @foreach($payments as $p)
        <tr>
            <td class="bold">{{ $p['created_at'] }}</td>
            <td class="mono" style="color:#6d28d9">{{ $p['invoice_code'] ?? '—' }}</td>
            <td>{{ $p['payment_method'] ?? '—' }}</td>
            <td style="color:#94a3b8">{{ $p['reference'] ?? '—' }}</td>
            <td class="r">{{ number_format($p['amount'], 2, ',', ' ') }} MAD</td>
        </tr>
        @endforeach
    </tbody>
    <tfoot><tr>
        <td colspan="4" style="text-align:right">Total réglé</td>
        <td class="r">{{ number_format($payments->sum('amount'), 2, ',', ' ') }} MAD</td>
    </tr></tfoot>
</table>
@endif

{{-- GRAND TOTAL --}}
<div class="gt-wrap">
    <table class="gt-box" style="width:100%">
        <tr><td>
            <table class="gt-row" style="width:100%"><tr>
                <td class="gt-l">Total acheté</td>
                <td class="gt-r">{{ number_format($totalPurchased, 2, ',', ' ') }} MAD</td>
            </tr></table>
        </td></tr>
        <tr><td>
            <table class="gt-row" style="width:100%"><tr>
                <td class="gt-l">— Total réglé</td>
                <td class="gt-r" style="color:#16a34a">{{ number_format($totalPaid, 2, ',', ' ') }} MAD</td>
            </tr></table>
        </td></tr>
        <tr><td>
            <table class="gt-final" style="width:100%"><tr>
                <td class="gt-fl">Solde dû</td>
                <td class="gt-fr">{{ number_format($balance, 2, ',', ' ') }} MAD</td>
            </tr></table>
        </td></tr>
    </table>
</div>

{{-- FOOTER --}}
<table class="footer"><tr>
    <td>
        @if(!empty($company['name'])){{ $company['name'] }}@endif
        @if(!empty($company['email'])) &nbsp;·&nbsp; {{ $company['email'] }}@endif
        @if(!empty($company['phone'])) &nbsp;·&nbsp; {{ $company['phone'] }}@endif
    </td>
    <td style="text-align:right">Document généré le {{ now()->format('d/m/Y à H:i') }}</td>
</tr></table>

</body>
</html>
