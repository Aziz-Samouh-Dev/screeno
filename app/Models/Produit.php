<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Produit extends Model
{
      use HasFactory;

    protected $fillable = [
        'nom',
        'description',
        'prix_achat',
        'prix_vente',
        'quantite',
        'image',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($produit) {
            $produit->uuid = Str::uuid();
        });
    }
}
