<?php

namespace Database\Seeders;

use App\Models\ChargeCategory;
use Illuminate\Database\Seeder;

class ChargeCategorySeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            ['nom' => 'Loyer',      'slug' => 'loyer',      'color' => 'text-amber-500',   'bg_color' => 'bg-amber-50 dark:bg-amber-950/40',   'icon_name' => 'building2',       'sort_order' => 1],
            ['nom' => 'Salaires',   'slug' => 'salaires',   'color' => 'text-violet-500',  'bg_color' => 'bg-violet-50 dark:bg-violet-950/40',  'icon_name' => 'users',           'sort_order' => 2],
            ['nom' => 'Énergie',    'slug' => 'energie',    'color' => 'text-orange-500',  'bg_color' => 'bg-orange-50 dark:bg-orange-950/40',  'icon_name' => 'zap',             'sort_order' => 3],
            ['nom' => 'Transport',  'slug' => 'transport',  'color' => 'text-cyan-500',    'bg_color' => 'bg-cyan-50 dark:bg-cyan-950/40',      'icon_name' => 'truck',           'sort_order' => 4],
            ['nom' => 'Taxes',      'slug' => 'taxes',      'color' => 'text-red-500',     'bg_color' => 'bg-red-50 dark:bg-red-950/40',        'icon_name' => 'file-text',       'sort_order' => 5],
            ['nom' => 'Assurance',  'slug' => 'assurance',  'color' => 'text-emerald-500', 'bg_color' => 'bg-emerald-50 dark:bg-emerald-950/40','icon_name' => 'shield',          'sort_order' => 6],
            ['nom' => 'Télécom',    'slug' => 'telecom',    'color' => 'text-indigo-500',  'bg_color' => 'bg-indigo-50 dark:bg-indigo-950/40',  'icon_name' => 'wifi',            'sort_order' => 7],
            ['nom' => 'Autre',      'slug' => 'autre',      'color' => 'text-slate-500',   'bg_color' => 'bg-slate-50 dark:bg-slate-800/40',    'icon_name' => 'more-horizontal', 'sort_order' => 8],
        ];

        foreach ($defaults as $cat) {
            ChargeCategory::firstOrCreate(
                ['slug' => $cat['slug']],
                array_merge($cat, ['is_default' => false])
            );
        }
    }
}
