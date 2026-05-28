<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Supplier extends Model
{
    protected $fillable = [
        'uuid', 'nom', 'email', 'telephone',
        'adresse', 'ville', 'notes', 'status',
    ];

    protected static function booted(): void
    {
        static::creating(fn ($s) => $s->uuid ??= Str::uuid());
    }

    public function getRouteKeyName(): string { return 'uuid'; }

    public function produits()             { return $this->hasMany(Produit::class); }
    public function supplierTransactions() { return $this->hasMany(SupplierTransaction::class); }
}
