<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'nom',
        'image',
        'description',
        'prix_achat',
        'prix_vente',
        'quantite',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($produit) {
            $produit->uuid = Str::uuid();
        });
    }
}
