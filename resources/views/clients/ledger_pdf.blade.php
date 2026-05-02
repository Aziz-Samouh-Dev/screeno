<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
@page { size: A4 portrait; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #1a1a1a; background: #fff; line-height: 1.4; padding: 14mm; }

.top { width: 100%; border-bottom: 3px solid #1e293b; padding-bottom: 14px; margin-bottom: 14px; }
.top td { vertical-align: top; }
.co-name  { font-size: 18px; font-weight: 900; color: #1e293b; }
.co-meta  { font-size: 8px; color: #64748b; line-height: 1.8; margin-top: 5px; }
.doc-label { font-size: 22px; font-weight: 900; color: #1e293b; text-align: right; letter-spacing: -1px; }
.doc-sub   { font-size: 10px; font-weight: 700; color: #7c3aed; text-align: right; margin-top: 3px; }
.doc-meta  { text-align: right; margin-top: 6px; font-size: 8px; color: #64748b; }

.bts { width: 100%; margin-bottom: 16px; }
.bts td { vertical-align: top; }
.section-lbl { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid #e2e8f0; }
.party-name  { font-size: 13px; font-weight: 900; color: #1e293b; margin-top: 4px; margin-bottom: 3px; }
.party-detail{ font-size: 8px; color: #475569; line-height: 1.8; }

.sum-box { border: 1px solid #e2e8f0; border-collapse: collapse; margin-top: 4px; }
.sum-row { width: 100%; border-collapse: collapse; border-bottom: 1px solid #f1f5f9; }
.sum-row td { padding: 5px 10px; font-size: 8.5px; }
.sum-l { color: #64748b; }
.sum-r { text-align: right; font-weight: 700; font-family: "Courier New", monospace; }
.sum-final { width: 100%; border-collapse: collapse; background: #1e293b; }
.sum-final td { padding: 8px 10px; }
.sum-fl { color: #94a3b8; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; }
.sum-fr { text-align: right; color: #fff; font-size: 12px; font-weight: 900; font-family: "Courier New", monospace; }

.ledger { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; margin-top: 16px; }
.ledger thead tr { background: #f8fafc; }
.ledger thead th { padding: 6px 8px; text-align: left; font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 2px solid #e2e8f0; border-right: 1px solid #e2e8f0; }
.ledger thead th:last-child { border-right: none; }
.ledger thead th.r { text-align: right; }
.ledger thead th.c { text-align: center; }
.ledger tbody td { padding: 5px 8px; font-size: 8.5px; color: #334155; border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; }
.ledger tbody td:last-child { border-right: none; }
.ledger tbody td.r { text-align: right; font-family: "Courier New", monospace; }
.ledger tbody td.c { text-align: center; }
.ledger tfoot td { padding: 7px 8px; font-weight: 700; font-size: 8.5px; border-top: 2px solid #1e293b; background: #f8fafc; }
.ledger tfoot td.r { text-align: right; font-family: "Courier New", monospace; }

.type-f { color: #1d4ed8; font-weight: 700; }
.type-r { color: #7e22ce; font-weight: 700; }
.type-p { color: #15803d; font-weight: 700; }
.rt-pos { color: #d97706; font-weight: 700; }
.rt-neg { color: #15803d; font-weight: 700; }

.footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #e2e8f0; width: 100%; }
.footer td { font-size: 7.5px; color: #94a3b8; }
</style>
</head>
<body>

{{-- HEADER --}}
<table class="top"><tr>
    <td style="width:55%">
        @if(!empty($company['name']))<div class="co-name">{{ $company['name'] }}</div>@endif
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
        <div class="doc-label">GRAND LIVRE CLIENT</div>
        <div class="doc-sub">{{ $client->nom }}</div>
        @if(!empty($dateFrom) || !empty($dateTo))
        <div class="doc-meta" style="margin-top:4px; font-weight:700; color:#1e293b">
            Période : {{ $dateFrom ?? '—' }} → {{ $dateTo ?? '—' }}
        </div>
        @endif
        <div class="doc-meta">Généré le {{ now()->format('d/m/Y H:i') }}</div>
    </td>
</tr></table>

{{-- CLIENT + SUMMARY --}}
<table class="bts"><tr>
    <td style="width:48%; padding-right:20px">
        <div class="section-lbl">Informations client</div>
        <div class="party-name">{{ $client->nom }}</div>
        <div class="party-detail">
            @if(isset($client->email)){{ $client->email }}<br>@endif
            @if(isset($client->telephone))Tél : {{ $client->telephone }}<br>@endif
        </div>
    </td>
    <td style="width:52%">
        <div class="section-lbl">Résumé</div>
        <table class="sum-box" style="width:100%; margin-top:4px">
            <tr><td>
                <table class="sum-row" style="width:100%"><tr>
                    <td class="sum-l">Total facturé (F)</td>
                    <td class="sum-r">{{ number_format($totalF, 2, ',', ' ') }} MAD</td>
                </tr></table>
            </td></tr>
            <tr><td>
                <table class="sum-row" style="width:100%"><tr>
                    <td class="sum-l">Total retours (R)</td>
                    <td class="sum-r" style="color:#7e22ce">{{ number_format($totalR, 2, ',', ' ') }} MAD</td>
                </tr></table>
            </td></tr>
            <tr><td>
                <table class="sum-row" style="width:100%"><tr>
                    <td class="sum-l">Total paiements (P)</td>
                    <td class="sum-r" style="color:#15803d">{{ number_format($totalP, 2, ',', ' ') }} MAD</td>
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

{{-- LEDGER TABLE --}}
<table class="ledger">
    <thead><tr>
        <th style="width:140px">Date &amp; Heure / Type</th>
        <th>Produit / Libellé</th>
        <th class="c" style="width:40px">Qté</th>
        <th class="r" style="width:90px">Prix unit.</th>
        <th class="r" style="width:90px">Montant</th>
        <th class="r" style="width:90px">RT</th>
    </tr></thead>
    <tbody>
        @foreach($rows as $row)
        <tr>
            <td class="type-{{ strtolower($row['type']) }}" style="font-family:'Courier New',monospace; font-size:8px; white-space:nowrap">
                {{ $row['created_at'] }} / {{ $row['type'] }}
            </td>
            <td>{{ $row['product_name'] ?? '—' }}</td>
            <td class="c">{{ $row['quantity'] ?? '—' }}</td>
            <td class="r">{{ $row['unit_price'] ? number_format($row['unit_price'], 2, ',', ' ') : '—' }}</td>
            <td class="r">
                @if($row['type'] === 'F')
                    <span style="color:#1d4ed8">+{{ number_format($row['total_price'], 2, ',', ' ') }}</span>
                @else
                    <span style="color:{{ $row['type'] === 'R' ? '#7e22ce' : '#15803d' }}">-{{ number_format($row['total_price'], 2, ',', ' ') }}</span>
                @endif
            </td>
            <td class="r {{ $row['running_total'] > 0 ? 'rt-pos' : 'rt-neg' }}">
                {{ number_format($row['running_total'], 2, ',', ' ') }}
            </td>
        </tr>
        @endforeach
    </tbody>
    <tfoot><tr>
        <td colspan="4">Total</td>
        <td class="r">{{ number_format($totalF - $totalR - $totalP, 2, ',', ' ') }} MAD</td>
        <td class="r">{{ number_format($balance, 2, ',', ' ') }} MAD</td>
    </tr></tfoot>
</table>

{{-- FOOTER --}}
<table class="footer" style="margin-top:20px"><tr>
    <td>
        @if(!empty($company['name'])){{ $company['name'] }}@endif
        @if(!empty($company['email'])) · {{ $company['email'] }}@endif
    </td>
    <td style="text-align:right">Document généré le {{ now()->format('d/m/Y à H:i') }}</td>
</tr></table>

</body>
</html>
