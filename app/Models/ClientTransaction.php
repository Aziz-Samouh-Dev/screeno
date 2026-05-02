<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ClientTransaction extends Model
{
    protected $fillable = [
        'uuid', 'client_id', 'type',
        'product_id', 'product_name',
        'quantity', 'unit_price', 'total_price', 'notes', 'return_type',
    ];

    protected $casts = [
        'unit_price'  => 'decimal:2',
        'total_price' => 'decimal:2',
        'quantity'    => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function ($m) {
            $m->uuid = Str::uuid();
        });
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function product()
    {
        return $this->belongsTo(Produit::class, 'product_id');
    }

    public function damagedStock()
    {
        return $this->hasOne(DamagedStock::class);
    }
}
