<?php

namespace Database\Seeders;

use App\Models\BusinessAccount;
use App\Models\Charge;
use App\Models\Client;
use App\Models\ClientTransaction;
use App\Models\DamagedStock;
use App\Models\Employee;
use App\Models\EmployeePayment;
use App\Models\Produit;
use App\Models\Supplier;
use App\Models\SupplierTransaction;
use Illuminate\Database\Seeder;

/**
 * SCÉNARIO COMPLET — Janvier → Mars 2026
 * ────────────────────────────────────────
 * Dépôt capital → Achats fournisseurs → Ventes clients
 * → Retours → Charges → Salaires
 */
class ScenarioSeeder extends Seeder
{
    /* ── helpers ────────────────────────────────────────────────────── */

    private function sell(Client $c, Produit $p, int $qty, float $price, string $at): void
    {
        ClientTransaction::create([
            'client_id'    => $c->id,
            'type'         => 'F',
            'product_id'   => $p->id,
            'product_name' => $p->nom,
            'quantity'     => $qty,
            'unit_price'   => $price,
            'total_price'  => $qty * $price,
            'created_at'   => $at,
            'updated_at'   => $at,
        ]);
        $p->decrement('stock_quantity', $qty);
    }

    private function returnDamaged(Client $c, Produit $p, int $qty, float $price, string $note, string $at): void
    {
        $tx = ClientTransaction::create([
            'client_id'    => $c->id,
            'type'         => 'R',
            'return_type'  => 'damaged',
            'product_id'   => $p->id,
            'product_name' => $p->nom,
            'quantity'     => $qty,
            'unit_price'   => $price,
            'total_price'  => $qty * $price,
            'notes'        => $note,
            'created_at'   => $at,
            'updated_at'   => $at,
        ]);
        DamagedStock::create([
            'product_id'            => $p->id,
            'product_name'          => $p->nom,
            'quantity'              => $qty,
            'client_id'             => $c->id,
            'client_transaction_id' => $tx->id,
        ]);
    }

    private function returnToStock(Client $c, Produit $p, int $qty, float $price, string $note, string $at): void
    {
        ClientTransaction::create([
            'client_id'    => $c->id,
            'type'         => 'R',
            'return_type'  => 'stock',
            'product_id'   => $p->id,
            'product_name' => $p->nom,
            'quantity'     => $qty,
            'unit_price'   => $price,
            'total_price'  => $qty * $price,
            'notes'        => $note,
            'created_at'   => $at,
            'updated_at'   => $at,
        ]);
        $p->increment('stock_quantity', $qty);
    }

    private function pay(Client $c, float $amount, string $at): void
    {
        ClientTransaction::create([
            'client_id'    => $c->id,
            'type'         => 'P',
            'product_id'   => null,
            'product_name' => null,
            'quantity'     => 0,
            'unit_price'   => 0,
            'total_price'  => $amount,
            'notes'        => 'Paiement reçu',
            'created_at'   => $at,
            'updated_at'   => $at,
        ]);
    }

    private function buy(Supplier $s, Produit $p, int $qty, float $price, string $at): void
    {
        SupplierTransaction::create([
            'supplier_id'  => $s->id,
            'type'         => 'F',
            'product_id'   => $p->id,
            'product_name' => $p->nom,
            'quantity'     => $qty,
            'unit_price'   => $price,
            'total_price'  => $qty * $price,
            'created_at'   => $at,
            'updated_at'   => $at,
        ]);
        $p->increment('stock_quantity', $qty);
    }

    private function returnToSupplier(Supplier $s, Produit $p, int $qty, float $price, string $type, string $note, string $at): void
    {
        SupplierTransaction::create([
            'supplier_id'  => $s->id,
            'type'         => 'R',
            'return_type'  => $type,
            'product_id'   => $p->id,
            'product_name' => $p->nom,
            'quantity'     => $qty,
            'unit_price'   => $price,
            'total_price'  => $type === 'refund' ? $qty * $price : 0,
            'notes'        => $note,
            'created_at'   => $at,
            'updated_at'   => $at,
        ]);
        // Remove from damaged stock (FIFO)
        $remaining = $qty;
        DamagedStock::where('product_id', $p->id)->orderBy('id')->each(function ($row) use (&$remaining) {
            if ($remaining <= 0) return false;
            if ($row->quantity <= $remaining) {
                $remaining -= $row->quantity;
                $row->delete();
            } else {
                $row->decrement('quantity', $remaining);
                $remaining = 0;
            }
        });
    }

    private function charge(string $cat, string $desc, float $amount, string $date): void
    {
        Charge::create([
            'category'    => $cat,
            'description' => $desc,
            'amount'      => $amount,
            'date'        => $date,
            'status'      => 'paye',
        ]);
    }

    private function paySalary(Employee $e, int $month, int $year, string $at): void
    {
        EmployeePayment::firstOrCreate(
            ['employee_id' => $e->id, 'month' => $month, 'year' => $year],
            ['amount' => (float) $e->salaire_brut, 'paid_at' => $at]
        );
    }

    /* ══════════════════════════════════════════════════════════════════
    |  MAIN
    ══════════════════════════════════════════════════════════════════ */
    public function run(): void
    {
        /* ─────────────────────────────────────────────────────────────
        |  § 0  BUSINESS ACCOUNT — capital initial
        ───────────────────────────────────────────────────────────── */
        BusinessAccount::main()->update([
            'name'            => 'Compte Screeno SARL',
            'initial_capital' => 200_000,
        ]);

        /* ─────────────────────────────────────────────────────────────
        |  § 1  SUPPLIERS
        ───────────────────────────────────────────────────────────── */
        $hp   = Supplier::create(['nom' => 'HP Maroc Distribution',  'email' => 'orders@hp-maroc.ma',      'telephone' => '0522 800 100', 'adresse' => '5 Zone Industrielle', 'ville' => 'Casablanca', 'notes' => 'Distributeur agréé HP.',    'status' => 'active']);
        $dell = Supplier::create(['nom' => 'Dell MEA Import',         'email' => 'supply@dell-mea.com',     'telephone' => '0522 800 200', 'adresse' => '5 Zone Industrielle', 'ville' => 'Casablanca', 'notes' => 'Import MEA Dell.',          'status' => 'active']);
        $logi = Supplier::create(['nom' => 'Logitech MENA Partner',   'email' => 'partner@logitech.ma',     'telephone' => '0537 900 300', 'adresse' => '5 Zone Industrielle', 'ville' => 'Rabat',      'notes' => 'Partenaire Logitech MENA.', 'status' => 'active']);
        $gtw  = Supplier::create(['nom' => 'Global Tech Wholesale',   'email' => 'wholesale@globaltech.ma', 'telephone' => '0528 700 400', 'adresse' => '5 Zone Industrielle', 'ville' => 'Agadir',     'notes' => 'Grossiste informatique.',   'status' => 'active']);

        /* ─────────────────────────────────────────────────────────────
        |  § 2  PRODUCTS (stock starts at 0 — built by purchases below)
        ───────────────────────────────────────────────────────────── */
        $mk = fn (array $d) => Produit::create([
            'nom'                   => $d[0],
            'sku'                   => $d[1],
            'purchase_price'        => $d[2],
            'sale_price'            => $d[3],
            'stock_quantity'        => 0,
            'stock_alert_threshold' => 3,
            'supplier_id'           => $d[4],
            'description'           => 'Produit de qualité professionnelle.',
        ]);

        $pHP       = $mk(['HP Pavilion 15 Laptop',    'HP-LAP-001',  4_800, 6_500,  $hp->id]);
        $pDell     = $mk(['Dell Inspiron 15 3520',    'DEL-LAP-002', 5_200, 7_000,  $dell->id]);
        $pLenovo   = $mk(['Lenovo IdeaPad Slim 3',    'LEN-LAP-003', 4_200, 5_800,  $gtw->id]);
        $pAsus     = $mk(['Asus VivoBook 15',         'ASU-LAP-004', 4_500, 6_200,  $gtw->id]);
        $pEcran    = $mk(['Écran Samsung 24" FHD',    'SAM-ECR-005', 1_200, 1_800,  $gtw->id]);
        $pClavier  = $mk(['Clavier Logitech MK270',   'LOG-CLA-006',   180,   280,  $logi->id]);
        $pSouris   = $mk(['Souris Logitech M185',     'LOG-SOU-007',    90,   150,  $logi->id]);
        $pDisque   = $mk(['Disque dur externe 1TB WD','WD-HDD-008',    550,   780,  $gtw->id]);
        $pUSB      = $mk(['Clé USB 64GB Kingston',    'KIN-USB-009',    70,   120,  $gtw->id]);
        $pLaserJet = $mk(['HP LaserJet Pro M404dn',   'HP-IMP-010',  2_800, 3_900,  $hp->id]);
        $pSwitch   = $mk(['Switch TP-Link 8 ports',   'TPL-NET-011',   220,   350,  $gtw->id]);
        $pHDMI     = $mk(['Câble HDMI 2m',            'CAB-HDM-012',    35,    65,  $gtw->id]);
        $pCasque   = $mk(['Casque USB Jabra Evolve',  'JAB-CAS-013',   650,   950,  $logi->id]);
        $pWebcam   = $mk(['Webcam Logitech C920',     'LOG-CAM-014',   480,   720,  $logi->id]);
        $pUPS      = $mk(['Onduleur APC 650VA',       'APC-UPS-015',   580,   850,  $gtw->id]);

        /* ─────────────────────────────────────────────────────────────
        |  § 3  CLIENTS
        ───────────────────────────────────────────────────────────── */
        $mkC = fn (array $d) => Client::create([
            'nom' => $d[0], 'email' => $d[1], 'telephone' => $d[2],
            'adresse' => '12 Avenue Hassan II', 'ville' => $d[3],
            'notes' => 'Client régulier.', 'status' => 'active',
        ]);

        $c1 = $mkC(['TechMaroc SARL',    'contact@techmaroc.ma',      '0522 301 400', 'Casablanca']);
        $c2 = $mkC(['Informatique Plus', 'info@informatique-plus.ma', '0537 201 300', 'Rabat'    ]);
        $c3 = $mkC(['Bureau Solutions',  'achat@bureausol.ma',        '0528 401 500', 'Agadir'   ]);
        $c4 = $mkC(['Karim Bensouda',    'karim.b@gmail.com',         '0661 234 567', 'Fès'      ]);
        $c5 = $mkC(['Sara El Amrani',    'sara.elamrani@gmail.com',   '0662 345 678', 'Marrakech']);
        $c6 = $mkC(['Digital Office MA', 'buy@digitaloffice.ma',      '0539 501 600', 'Tanger'   ]);

        /* ─────────────────────────────────────────────────────────────
        |  § 4  EMPLOYEES
        ───────────────────────────────────────────────────────────── */
        $empDir  = Employee::create(['nom' => 'Rachid Alaoui',   'email' => 'r.alaoui@screeno.ma',  'telephone' => '0661 100 001', 'poste' => 'Directeur commercial', 'salaire_brut' => 8_000, 'date_embauche' => '2025-09-01', 'cnss' => 'CNSS-001', 'status' => 'actif']);
        $empVend = Employee::create(['nom' => 'Nadia Tahiri',    'email' => 'n.tahiri@screeno.ma',   'telephone' => '0661 100 002', 'poste' => 'Vendeuse',             'salaire_brut' => 4_500, 'date_embauche' => '2025-09-01', 'cnss' => 'CNSS-002', 'status' => 'actif']);
        $empTech = Employee::create(['nom' => 'Youssef Berrada', 'email' => 'y.berrada@screeno.ma',  'telephone' => '0661 100 003', 'poste' => 'Technicien SAV',       'salaire_brut' => 5_000, 'date_embauche' => '2025-10-01', 'cnss' => 'CNSS-003', 'status' => 'actif']);

        /* ═══════════════════════════════════════════════════════════
        |
        |  ██  JANVIER 2026
        |
        ═══════════════════════════════════════════════════════════ */

        // ── Achats (réappro initiale) ────────────────────────────
        // HP Maroc : 10×4 800 + 5×2 800 = 62 000 MAD
        $this->buy($hp,   $pHP,       10, 4_800, '2026-01-05 09:00:00');
        $this->buy($hp,   $pLaserJet,  5, 2_800, '2026-01-05 09:30:00');

        // Dell : 5×5 200 = 26 000 MAD
        $this->buy($dell, $pDell,      5, 5_200, '2026-01-07 10:00:00');

        // Logitech : 2 700+1 350+1 950+1 440 = 7 440 MAD
        $this->buy($logi, $pClavier,  15,   180, '2026-01-08 11:00:00');
        $this->buy($logi, $pSouris,   15,    90, '2026-01-08 11:10:00');
        $this->buy($logi, $pCasque,    3,   650, '2026-01-08 11:20:00');
        $this->buy($logi, $pWebcam,    3,   480, '2026-01-08 11:30:00');

        // Global Tech : 63 940 MAD
        $this->buy($gtw,  $pEcran,    10, 1_200, '2026-01-09 09:00:00');
        $this->buy($gtw,  $pUPS,       3,   580, '2026-01-09 09:10:00');
        $this->buy($gtw,  $pSwitch,    5,   220, '2026-01-09 09:20:00');
        $this->buy($gtw,  $pDisque,    5,   550, '2026-01-09 09:30:00');
        $this->buy($gtw,  $pUSB,      30,    70, '2026-01-09 09:40:00');
        $this->buy($gtw,  $pHDMI,     30,    35, '2026-01-09 09:50:00');
        $this->buy($gtw,  $pLenovo,    6, 4_200, '2026-01-10 10:00:00');
        $this->buy($gtw,  $pAsus,      4, 4_500, '2026-01-10 10:30:00');

        // ── Ventes C1 : TechMaroc SARL ─ 28 500 MAD ─────────────
        $this->sell($c1, $pHP,    3, 6_500, '2026-01-15 09:00:00');
        $this->sell($c1, $pEcran, 5, 1_800, '2026-01-15 09:10:00');
        $this->pay($c1, 18_000,              '2026-01-25 10:00:00');

        // ── Ventes C3 : Bureau Solutions ─ 10 150 MAD ────────────
        $this->sell($c3, $pLaserJet, 2, 3_900, '2026-01-18 11:00:00');
        $this->sell($c3, $pHDMI,    20,    65,  '2026-01-18 11:10:00');
        $this->sell($c3, $pSwitch,   3,   350,  '2026-01-18 11:20:00');
        $this->pay($c3, 6_000,                  '2026-01-28 14:00:00');

        // ── Charges janvier ─ 5 200 MAD ──────────────────────────
        $this->charge('loyer',     'Loyer local commercial — Janvier 2026',   3_500, '2026-01-31');
        $this->charge('energie',   'Facture électricité — Janvier 2026',         750, '2026-01-31');
        $this->charge('telecom',   'Abonnement Internet + téléphonie — Jan',     600, '2026-01-31');
        $this->charge('transport', 'Carburant livraisons — Janvier 2026',         350, '2026-01-31');

        // ── Salaires janvier ─ 17 500 MAD ────────────────────────
        $this->paySalary($empDir,  1, 2026, '2026-01-31 12:00:00');
        $this->paySalary($empVend, 1, 2026, '2026-01-31 12:00:00');
        $this->paySalary($empTech, 1, 2026, '2026-01-31 12:00:00');

        /* ═══════════════════════════════════════════════════════════
        |
        |  ██  FÉVRIER 2026
        |
        ═══════════════════════════════════════════════════════════ */

        // ── Ventes C2 : Informatique Plus ─ 27 500 MAD ───────────
        $this->sell($c2, $pLenovo,  4, 5_800, '2026-02-05 10:00:00');
        $this->sell($c2, $pClavier, 10,   280, '2026-02-05 10:10:00');
        $this->sell($c2, $pSouris,  10,   150, '2026-02-05 10:20:00');
        $this->pay($c2, 20_000,              '2026-02-15 09:00:00');
        // Retour endommagé — 1 Lenovo (écran fissuré)
        $this->returnDamaged($c2, $pLenovo, 1, 5_800, 'Écran fissuré à la livraison', '2026-02-10 14:00:00');

        // ── Ventes C4 : Karim Bensouda ─ 7 340 MAD ───────────────
        $this->sell($c4, $pAsus,   1, 6_200, '2026-02-12 15:00:00');
        $this->sell($c4, $pDisque, 1,   780, '2026-02-12 15:10:00');
        $this->sell($c4, $pUSB,    3,   120, '2026-02-12 15:20:00');
        $this->pay($c4, 4_000,             '2026-02-20 10:00:00');

        // ── Ventes C5 : Sara El Amrani ─ 3 340 MAD ───────────────
        $this->sell($c5, $pWebcam, 2, 720, '2026-02-18 13:00:00');
        $this->sell($c5, $pCasque, 2, 950, '2026-02-18 13:10:00');
        $this->pay($c5, 3_000,            '2026-02-25 11:00:00');

        // ── Charges février ─ 7 000 MAD ──────────────────────────
        $this->charge('loyer',     'Loyer local commercial — Février 2026',   3_500, '2026-02-28');
        $this->charge('energie',   'Facture électricité — Février 2026',         820, '2026-02-28');
        $this->charge('telecom',   'Internet + téléphonie — Février 2026',       600, '2026-02-28');
        $this->charge('assurance', 'Prime assurance locaux — Trimestre 1',     1_800, '2026-02-28');
        $this->charge('autre',     'Fournitures bureau — Février 2026',           280, '2026-02-28');

        // ── Salaires février ─ 17 500 MAD ────────────────────────
        $this->paySalary($empDir,  2, 2026, '2026-02-28 12:00:00');
        $this->paySalary($empVend, 2, 2026, '2026-02-28 12:00:00');
        $this->paySalary($empTech, 2, 2026, '2026-02-28 12:00:00');

        /* ═══════════════════════════════════════════════════════════
        |
        |  ██  MARS 2026
        |
        ═══════════════════════════════════════════════════════════ */

        // ── Réappro mars ─────────────────────────────────────────
        $this->buy($hp,   $pHP,   5, 4_800, '2026-03-02 09:00:00');
        $this->buy($dell, $pDell, 3, 5_200, '2026-03-02 09:30:00');

        // ── Ventes C1 (2e commande) ─ 14 000 MAD ─────────────────
        $this->sell($c1, $pDell, 2, 7_000, '2026-03-08 09:00:00');
        $this->pay($c1, 12_000,             '2026-03-15 10:00:00');
        // Retour stock — 1 Dell sous garantie (clavier défaillant)
        $this->returnToStock($c1, $pDell, 1, 7_000, 'Retour sous garantie — clavier défaillant', '2026-03-10 14:00:00');

        // ── Ventes C6 : Digital Office MA ─ 44 050 MAD ───────────
        $this->sell($c6, $pHP,   5, 6_500, '2026-03-12 09:00:00');
        $this->sell($c6, $pEcran,5, 1_800, '2026-03-12 09:10:00');
        $this->sell($c6, $pUPS,  3,   850, '2026-03-12 09:20:00');
        $this->pay($c6, 20_000,            '2026-03-20 10:00:00');
        // Retour endommagé — 1 Onduleur (grillé premier branchement)
        $this->returnDamaged($c6, $pUPS, 1, 850, 'Onduleur HS dès premier branchement', '2026-03-14 10:00:00');

        // ── Retour fournisseur GTW — Lenovo endommagé (remboursement)
        $this->returnToSupplier($gtw, $pLenovo, 1, 4_200, 'refund', 'Retour stock endommagé — remboursement', '2026-03-16 10:00:00');

        // ── Charges mars ─ 10 450 MAD ────────────────────────────
        $this->charge('loyer',     'Loyer local commercial — Mars 2026',      3_500, '2026-03-31');
        $this->charge('energie',   'Facture électricité — Mars 2026',            900, '2026-03-31');
        $this->charge('telecom',   'Internet + téléphonie — Mars 2026',          600, '2026-03-31');
        $this->charge('transport', 'Carburant + livraisons — Mars 2026',          450, '2026-03-31');
        $this->charge('taxes',     'Déclaration TVA T1 2026',                  4_200, '2026-03-31');
        $this->charge('autre',     'Marketing réseaux sociaux — Mars 2026',       800, '2026-03-31');

        // ── Salaires mars ─ 17 500 MAD ───────────────────────────
        $this->paySalary($empDir,  3, 2026, '2026-03-31 12:00:00');
        $this->paySalary($empVend, 3, 2026, '2026-03-31 12:00:00');
        $this->paySalary($empTech, 3, 2026, '2026-03-31 12:00:00');

        /*
         * ════════════════════════════════════════════════════════
         *  RÉSUMÉ FINANCIER (Janv → Mars 2026)
         * ════════════════════════════════════════════════════════
         *  Capital initial              :  200 000 MAD
         *
         *  ACHATS
         *  ├ Janv (HP+Dell+Logi+GTW)   : 159 380
         *  └ Mars (HP+Dell réappro)     :  39 600
         *  Total bruts                  : 198 980 MAD
         *  Retour fournisseur (remb.)   :   4 200 MAD
         *  ACHATS NETS                  : 194 780 MAD
         *
         *  VENTES BRUTES                : 134 880 MAD
         *  Retours clients              :  13 650 MAD
         *  VENTES NETTES                : 121 230 MAD
         *
         *  CHARGES                      :  22 650 MAD
         *  SALAIRES (3 mois)            :  52 500 MAD
         *
         *  BALANCE = 200 000 + 121 230 − 194 780 − 22 650 − 52 500
         *          ≈ +51 300 MAD  ✓
         *
         *  PERTES (Onduleur restant)    :     580 MAD
         *  BÉNÉFICE NET ≈ marge brute − charges − salaires − pertes
         *               ≈ −26 500 MAD  (stock immobilisé = actif)
         * ════════════════════════════════════════════════════════
         */
    }
}
