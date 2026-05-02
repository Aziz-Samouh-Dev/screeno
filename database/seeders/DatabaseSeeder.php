<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Client;
use App\Models\Supplier;
use App\Models\Produit;
use App\Models\PaymentMethod;
use App\Models\ClientTransaction;
use App\Models\DamagedStock;
use App\Models\CompanyProfile;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ══════════════════════════════════════════
        // 1. COMPANY PROFILE
        // ══════════════════════════════════════════
        CompanyProfile::create([
            'name'    => 'Screeno SARL',
            'address' => '45 Rue Mohammed V, Quartier des Affaires',
            'city'    => 'Casablanca',
            'country' => 'Maroc',
            'phone'   => '+212 522 001 002',
            'email'   => 'contact@screeno.ma',
            'tax_id'  => '12345678',
            'ice'     => '001234567000012',
            'notes'   => 'Siège social principal.',
        ]);

        // ══════════════════════════════════════════
        // 2. USERS
        // ══════════════════════════════════════════
        User::create([
            'name'     => 'Amin Admin',
            'email'    => 'amin@screenino.com',
            'password' => Hash::make('Amin@1234'),
            'role'     => 'admin',
        ]);

        User::create([
            'name'     => 'Yassine Vendeur',
            'email'    => 'yassine@screenino.com',
            'password' => Hash::make('User@1234'),
            'role'     => 'user',
        ]);

        User::create([
            'name'     => 'Fatima Caisse',
            'email'    => 'fatima@screenino.com',
            'password' => Hash::make('User@1234'),
            'role'     => 'user',
        ]);

        // ══════════════════════════════════════════
        // 3. PAYMENT METHODS
        // ══════════════════════════════════════════
        $methods = [
            ['name' => 'Espèces',     'code' => 'CASH',   'description' => 'Paiement en liquide',         'is_active' => true],
            ['name' => 'Carte bancaire', 'code' => 'CARD', 'description' => 'Visa, Mastercard, etc.',      'is_active' => true],
            ['name' => 'Chèque',      'code' => 'CHEQUE', 'description' => 'Paiement par chèque',         'is_active' => true],
            ['name' => 'Virement',    'code' => 'BANK',   'description' => 'Virement bancaire',           'is_active' => true],
        ];
        foreach ($methods as $m) {
            PaymentMethod::firstOrCreate(['code' => $m['code']], $m);
        }

        // ══════════════════════════════════════════
        // 4. PRODUCTS
        // ══════════════════════════════════════════
        $produits = [
            ['nom' => 'HP Pavilion 15 Laptop',       'sku' => 'HP-LAP-001',  'purchase_price' => 4800,  'sale_price' => 6500,  'stock_quantity' => 12],
            ['nom' => 'Dell Inspiron 15 3520',        'sku' => 'DEL-LAP-002', 'purchase_price' => 5200,  'sale_price' => 7000,  'stock_quantity' => 8],
            ['nom' => 'Lenovo IdeaPad Slim 3',        'sku' => 'LEN-LAP-003', 'purchase_price' => 4200,  'sale_price' => 5800,  'stock_quantity' => 15],
            ['nom' => 'Asus VivoBook 15',             'sku' => 'ASU-LAP-004', 'purchase_price' => 4500,  'sale_price' => 6200,  'stock_quantity' => 6],
            ['nom' => 'Écran Samsung 24" FHD',        'sku' => 'SAM-ECR-005', 'purchase_price' => 1200,  'sale_price' => 1800,  'stock_quantity' => 20],
            ['nom' => 'Clavier Logitech MK270',       'sku' => 'LOG-CLA-006', 'purchase_price' => 180,   'sale_price' => 280,   'stock_quantity' => 35],
            ['nom' => 'Souris Logitech M185',         'sku' => 'LOG-SOU-007', 'purchase_price' => 90,    'sale_price' => 150,   'stock_quantity' => 40],
            ['nom' => 'Disque dur externe 1TB WD',    'sku' => 'WD-HDD-008',  'purchase_price' => 550,   'sale_price' => 780,   'stock_quantity' => 18],
            ['nom' => 'Clé USB 64GB Kingston',        'sku' => 'KIN-USB-009', 'purchase_price' => 70,    'sale_price' => 120,   'stock_quantity' => 60],
            ['nom' => 'HP LaserJet Pro M404dn',       'sku' => 'HP-IMP-010',  'purchase_price' => 2800,  'sale_price' => 3900,  'stock_quantity' => 5],
            ['nom' => 'Switch TP-Link 8 ports',       'sku' => 'TPL-NET-011', 'purchase_price' => 220,   'sale_price' => 350,   'stock_quantity' => 14],
            ['nom' => 'Câble HDMI 2m',                'sku' => 'CAB-HDM-012', 'purchase_price' => 35,    'sale_price' => 65,    'stock_quantity' => 80],
            ['nom' => 'Casque USB Jabra Evolve',      'sku' => 'JAB-CAS-013', 'purchase_price' => 650,   'sale_price' => 950,   'stock_quantity' => 10],
            ['nom' => 'Webcam Logitech C920',         'sku' => 'LOG-CAM-014', 'purchase_price' => 480,   'sale_price' => 720,   'stock_quantity' => 9],
            ['nom' => 'Onduleur APC 650VA',           'sku' => 'APC-UPS-015', 'purchase_price' => 580,   'sale_price' => 850,   'stock_quantity' => 7],
        ];

        $produitIds = [];
        foreach ($produits as $p) {
            $prod = Produit::create([
                'uuid'           => Str::uuid(),
                'nom'            => $p['nom'],
                'sku'            => $p['sku'],
                'image'          => null,
                'description'    => 'Produit de qualité professionnelle.',
                'purchase_price' => $p['purchase_price'],
                'sale_price'     => $p['sale_price'],
                'stock_quantity' => $p['stock_quantity'],
            ]);
            $produitIds[] = $prod->id;
        }

        // ══════════════════════════════════════════
        // 5. CLIENTS
        // ══════════════════════════════════════════
        $clients = [
            ['nom' => 'TechMaroc SARL',       'email' => 'contact@techmaroc.ma',    'telephone' => '0522 301 400', 'ville' => 'Casablanca'],
            ['nom' => 'Informatique Plus',    'email' => 'info@informatique-plus.ma', 'telephone' => '0537 201 300', 'ville' => 'Rabat'     ],
            ['nom' => 'Bureau Solutions',     'email' => 'achat@bureausol.ma',       'telephone' => '0528 401 500', 'ville' => 'Agadir'    ],
            ['nom' => 'Karim Bensouda',       'email' => 'karim.b@gmail.com',        'telephone' => '0661 234 567', 'ville' => 'Fès'       ],
            ['nom' => 'Sara El Amrani',       'email' => 'sara.elamrani@gmail.com',  'telephone' => '0662 345 678', 'ville' => 'Marrakech' ],
            ['nom' => 'Digital Office MA',   'email' => 'buy@digitaloffice.ma',     'telephone' => '0539 501 600', 'ville' => 'Tanger'    ],
        ];

        $clientIds = [];
        foreach ($clients as $c) {
            $cl = Client::create([
                'nom'       => $c['nom'],
                'email'     => $c['email'],
                'telephone' => $c['telephone'],
                'adresse'   => '12 Avenue Hassan II',
                'ville'     => $c['ville'],
                'notes'     => 'Client régulier.',
                'status'    => 'active',
            ]);
            $clientIds[] = $cl->id;
        }

        // ══════════════════════════════════════════
        // 6. SUPPLIERS
        // ══════════════════════════════════════════
        $suppliers = [
            ['nom' => 'HP Maroc Distribution',   'email' => 'orders@hp-maroc.ma',     'telephone' => '0522 800 100', 'ville' => 'Casablanca'],
            ['nom' => 'Dell MEA Import',          'email' => 'supply@dell-mea.com',    'telephone' => '0522 800 200', 'ville' => 'Casablanca'],
            ['nom' => 'Logitech MENA Partner',    'email' => 'partner@logitech.ma',    'telephone' => '0537 900 300', 'ville' => 'Rabat'     ],
            ['nom' => 'Global Tech Wholesale',    'email' => 'wholesale@globaltech.ma','telephone' => '0528 700 400', 'ville' => 'Agadir'    ],
        ];

        foreach ($suppliers as $s) {
            Supplier::create([
                'nom'       => $s['nom'],
                'email'     => $s['email'],
                'telephone' => $s['telephone'],
                'adresse'   => '5 Zone Industrielle',
                'ville'     => $s['ville'],
                'notes'     => 'Fournisseur agréé.',
                'status'    => 'active',
            ]);
        }

        // ══════════════════════════════════════════
        // 7. CLIENT TRANSACTIONS
        //    F = Vente  |  R = Retour  |  P = Paiement
        // ══════════════════════════════════════════

        // Helper to create a sell transaction
        $sell = function (int $clientId, int $productId, string $productName, int $qty, float $unitPrice, string $date) {
            ClientTransaction::create([
                'uuid'         => Str::uuid(),
                'client_id'    => $clientId,
                'type'         => 'F',
                'product_id'   => $productId,
                'product_name' => $productName,
                'quantity'     => $qty,
                'unit_price'   => $unitPrice,
                'total_price'  => $qty * $unitPrice,
                'notes'        => null,
                'created_at'   => $date,
                'updated_at'   => $date,
            ]);
        };

        $pay = function (int $clientId, float $amount, string $date) {
            ClientTransaction::create([
                'uuid'         => Str::uuid(),
                'client_id'    => $clientId,
                'type'         => 'P',
                'product_id'   => null,
                'product_name' => null,
                'quantity'     => 0,
                'unit_price'   => 0,
                'total_price'  => $amount,
                'notes'        => 'Paiement client',
                'created_at'   => $date,
                'updated_at'   => $date,
            ]);
        };

        // ----- Client 1: TechMaroc SARL -----
        $c1 = $clientIds[0];
        $sell($c1, $produitIds[0],  'HP Pavilion 15 Laptop',    3, 6500,  '2026-03-10 09:00:00');
        $sell($c1, $produitIds[4],  'Écran Samsung 24" FHD',    5, 1800,  '2026-03-10 09:05:00');
        $pay($c1, 25000, '2026-03-20 10:00:00');
        $sell($c1, $produitIds[1],  'Dell Inspiron 15 3520',    2, 7000,  '2026-04-05 14:00:00');
        $pay($c1, 14000, '2026-04-15 11:00:00');

        // Return: 1 Dell Inspiron en stock
        $t = ClientTransaction::create([
            'uuid' => Str::uuid(), 'client_id' => $c1, 'type' => 'R',
            'product_id' => $produitIds[1], 'product_name' => 'Dell Inspiron 15 3520',
            'quantity' => 1, 'unit_price' => 7000, 'total_price' => 7000,
            'notes' => 'Retour défaut clavier', 'return_type' => 'stock',
            'created_at' => '2026-04-20 09:00:00', 'updated_at' => '2026-04-20 09:00:00',
        ]);
        Produit::find($produitIds[1])?->increment('stock_quantity', 1);

        // ----- Client 2: Informatique Plus -----
        $c2 = $clientIds[1];
        $sell($c2, $produitIds[2],  'Lenovo IdeaPad Slim 3',    4, 5800,  '2026-03-15 10:00:00');
        $sell($c2, $produitIds[5],  'Clavier Logitech MK270',   10, 280,  '2026-03-15 10:10:00');
        $sell($c2, $produitIds[6],  'Souris Logitech M185',     10, 150,  '2026-03-15 10:15:00');
        $pay($c2, 30000, '2026-03-28 09:00:00');

        // Return: 1 Lenovo endommagé
        $t = ClientTransaction::create([
            'uuid' => Str::uuid(), 'client_id' => $c2, 'type' => 'R',
            'product_id' => $produitIds[2], 'product_name' => 'Lenovo IdeaPad Slim 3',
            'quantity' => 1, 'unit_price' => 5800, 'total_price' => 5800,
            'notes' => 'Écran cassé à la livraison', 'return_type' => 'damaged',
            'created_at' => '2026-03-30 10:00:00', 'updated_at' => '2026-03-30 10:00:00',
        ]);
        DamagedStock::create([
            'product_id' => $produitIds[2], 'product_name' => 'Lenovo IdeaPad Slim 3',
            'quantity' => 1, 'client_id' => $c2, 'client_transaction_id' => $t->id,
        ]);

        // ----- Client 3: Bureau Solutions -----
        $c3 = $clientIds[2];
        $sell($c3, $produitIds[9],  'HP LaserJet Pro M404dn',   2, 3900,  '2026-03-20 11:00:00');
        $sell($c3, $produitIds[11], 'Câble HDMI 2m',            20, 65,   '2026-03-20 11:10:00');
        $sell($c3, $produitIds[10], 'Switch TP-Link 8 ports',   3, 350,   '2026-04-01 09:00:00');
        $pay($c3, 10000, '2026-04-10 14:00:00');
        $pay($c3, 5000,  '2026-04-25 14:00:00');

        // ----- Client 4: Karim Bensouda -----
        $c4 = $clientIds[3];
        $sell($c4, $produitIds[3],  'Asus VivoBook 15',         1, 6200,  '2026-04-02 15:00:00');
        $sell($c4, $produitIds[7],  'Disque dur externe 1TB WD',1, 780,   '2026-04-02 15:05:00');
        $sell($c4, $produitIds[8],  'Clé USB 64GB Kingston',    3, 120,   '2026-04-02 15:10:00');
        $pay($c4, 5000, '2026-04-10 10:00:00');
        $pay($c4, 2360, '2026-04-20 10:00:00');

        // ----- Client 5: Sara El Amrani -----
        $c5 = $clientIds[4];
        $sell($c5, $produitIds[13], 'Webcam Logitech C920',     2, 720,   '2026-04-10 13:00:00');
        $sell($c5, $produitIds[12], 'Casque USB Jabra Evolve',  2, 950,   '2026-04-10 13:05:00');
        $pay($c5, 3340, '2026-04-18 11:00:00');

        // ----- Client 6: Digital Office MA -----
        $c6 = $clientIds[5];
        $sell($c6, $produitIds[0],  'HP Pavilion 15 Laptop',    5, 6500,  '2026-04-15 09:00:00');
        $sell($c6, $produitIds[4],  'Écran Samsung 24" FHD',    5, 1800,  '2026-04-15 09:10:00');
        $sell($c6, $produitIds[14], 'Onduleur APC 650VA',       3, 850,   '2026-04-15 09:20:00');
        $pay($c6, 20000, '2026-04-28 10:00:00');

        // Return: 1 Onduleur endommagé
        $t2 = ClientTransaction::create([
            'uuid' => Str::uuid(), 'client_id' => $c6, 'type' => 'R',
            'product_id' => $produitIds[14], 'product_name' => 'Onduleur APC 650VA',
            'quantity' => 1, 'unit_price' => 850, 'total_price' => 850,
            'notes' => 'Onduleur grillé dès branchement', 'return_type' => 'damaged',
            'created_at' => '2026-04-29 10:00:00', 'updated_at' => '2026-04-29 10:00:00',
        ]);
        DamagedStock::create([
            'product_id' => $produitIds[14], 'product_name' => 'Onduleur APC 650VA',
            'quantity' => 1, 'client_id' => $c6, 'client_transaction_id' => $t2->id,
        ]);

        // Return: 1 Écran Samsung en stock
        $t3 = ClientTransaction::create([
            'uuid' => Str::uuid(), 'client_id' => $c6, 'type' => 'R',
            'product_id' => $produitIds[4], 'product_name' => 'Écran Samsung 24" FHD',
            'quantity' => 1, 'unit_price' => 1800, 'total_price' => 1800,
            'notes' => 'Retour sous 7 jours', 'return_type' => 'stock',
            'created_at' => '2026-04-30 09:00:00', 'updated_at' => '2026-04-30 09:00:00',
        ]);
        Produit::find($produitIds[4])?->increment('stock_quantity', 1);
    }
}
