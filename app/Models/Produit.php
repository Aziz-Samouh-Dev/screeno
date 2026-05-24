<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Produit extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'nom',
        'sku',
        'description',
        'image',
        'purchase_price',
        'sale_price',
        'stock_quantity',
        'stock_alert_threshold',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($produit) {
            // Generate UUID if not set
            if (! $produit->uuid) {
                $produit->uuid = Str::uuid();
            }

            // Generate SKU if not set
            if (! $produit->sku) {
                $produit->sku = 'PRD-'.strtoupper(Str::random(8));
            }
        });
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    // ⚡ RELATION: A product can be in many purchase invoice items
    public function purchaseInvoiceItems()
    {
        return $this->hasMany(PurchaseInvoiceItem::class, 'product_id');
    }

    // ⚡ RELATION: A product can be in many seles invoice items
    public function salesInvoiceItems()
    {
        return $this->hasMany(SalesInvoiceItem::class, 'product_id');
    }

    public function salesReturnItems()
    {
        return $this->hasMany(SalesReturnItem::class, 'product_id');
    }

    

    protected $casts = [
        'purchase_price'        => 'decimal:2',
        'sale_price'            => 'decimal:2',
        'stock_quantity'        => 'integer',
        'stock_alert_threshold' => 'integer',
    ];
}
