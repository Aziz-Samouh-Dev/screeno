<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Produit extends Model
{
    protected $fillable = [
        'uuid', 'nom', 'sku', 'description', 'image',
        'purchase_price', 'sale_price',
        'stock_quantity', 'stock_alert_threshold',
        'supplier_id',
    ];

    protected $casts = [
        'purchase_price'        => 'decimal:2',
        'sale_price'            => 'decimal:2',
        'stock_quantity'        => 'integer',
        'stock_alert_threshold' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($p) {
            $p->uuid ??= Str::uuid();
            $p->sku  ??= 'PRD-' . strtoupper(Str::random(8));
        });
    }

    public function getRouteKeyName(): string { return 'uuid'; }

    public function supplier()             { return $this->belongsTo(Supplier::class); }
    public function supplierTransactions() { return $this->hasMany(SupplierTransaction::class, 'product_id'); }
    public function clientTransactions()   { return $this->hasMany(ClientTransaction::class, 'product_id'); }
}
