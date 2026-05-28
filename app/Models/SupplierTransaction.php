<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SupplierTransaction extends Model
{
    protected $fillable = [
        'uuid', 'supplier_id', 'type',
        'product_id', 'product_name',
        'quantity', 'unit_price', 'total_price',
        'return_type', 'notes',
    ];

    protected $casts = [
        'unit_price'  => 'decimal:2',
        'total_price' => 'decimal:2',
        'quantity'    => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(fn ($m) => $m->uuid ??= Str::uuid());
    }

    public function getRouteKeyName(): string { return 'uuid'; }

    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function product()  { return $this->belongsTo(Produit::class, 'product_id'); }
}
