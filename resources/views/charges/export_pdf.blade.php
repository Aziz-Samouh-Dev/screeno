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
.doc-meta  { text-align: right; margin-top: 6px; font-size: 8px; color: #64748b; }

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

.badge-paye    { color: #15803d; font-weight: 700; }
.badge-apayer  { color: #d97706; font-weight: 700; }

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
            @if(!empty($company['email'])){{ $company['email'] }}@endif
        </div>
    </td>
    <td style="width:45%; vertical-align:top; text-align:right">
        <div class="doc-label">RAPPORT CHARGES</div>
        <div class="doc-meta">Généré le {{ now()->format('d/m/Y H:i') }}</div>
    </td>
</tr></table>

{{-- TABLE --}}
<table class="ledger">
    <thead><tr>
        <th style="width:80px">Date</th>
        <th style="width:80px">Catégorie</th>
        <th>Description</th>
        <th class="c" style="width:90px">Récurrence</th>
        <th class="r" style="width:100px">Montant</th>
        <th class="c" style="width:70px">Statut</th>
    </tr></thead>
    <tbody>
        @foreach($charges as $c)
        <tr>
            <td style="font-family:'Courier New',monospace; font-size:8px">{{ $c->date->format('d/m/Y') }}</td>
            <td>{{ $categoryLabels[$c->category] ?? $c->category }}</td>
            <td>{{ $c->description }}</td>
            <td class="c">{{ ['ponctuelle'=>'Ponctuel','mensuelle'=>'Mensuel','trimestrielle'=>'Trimestriel','annuelle'=>'Annuel'][$c->recurrence] ?? $c->recurrence }}</td>
            <td class="r">{{ number_format($c->amount, 2, ',', ' ') }} MAD</td>
            <td class="c {{ $c->status === 'paye' ? 'badge-paye' : 'badge-apayer' }}">
                {{ $c->status === 'paye' ? 'Payé' : 'À payer' }}
            </td>
        </tr>
        @endforeach
    </tbody>
    <tfoot><tr>
        <td colspan="4">Total ({{ $charges->count() }} charge(s))</td>
        <td class="r">{{ number_format($total, 2, ',', ' ') }} MAD</td>
        <td></td>
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
