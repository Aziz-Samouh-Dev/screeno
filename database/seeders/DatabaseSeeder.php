<?php

namespace Database\Seeders;

use App\Models\CompanyProfile;
use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Company profile ──────────────────────────────────────────
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

        // ── 2. Users ─────────────────────────────────────────────────────
        User::create(['name' => 'Amin Admin',      'email' => 'amin@screenino.com',    'password' => Hash::make('Amin@1234'), 'role' => 'admin']);
        User::create(['name' => 'Yassine Vendeur', 'email' => 'yassine@screenino.com', 'password' => Hash::make('User@1234'), 'role' => 'user' ]);
        User::create(['name' => 'Fatima Caisse',   'email' => 'fatima@screenino.com',  'password' => Hash::make('User@1234'), 'role' => 'user' ]);

        // ── 3. Payment methods ───────────────────────────────────────────
        foreach ([
            ['name' => 'Espèces',        'code' => 'CASH',   'description' => 'Paiement en liquide',    'is_active' => true],
            ['name' => 'Carte bancaire', 'code' => 'CARD',   'description' => 'Visa, Mastercard, etc.', 'is_active' => true],
            ['name' => 'Chèque',         'code' => 'CHEQUE', 'description' => 'Paiement par chèque',    'is_active' => true],
            ['name' => 'Virement',       'code' => 'BANK',   'description' => 'Virement bancaire',      'is_active' => true],
        ] as $m) {
            PaymentMethod::firstOrCreate(['code' => $m['code']], $m);
        }

        // ── 4. Charge categories ─────────────────────────────────────────
        $this->call(ChargeCategorySeeder::class);

        // ── 5. Business scenario (suppliers, products, clients, transactions…)
        $this->call(ScenarioSeeder::class);
    }
}
