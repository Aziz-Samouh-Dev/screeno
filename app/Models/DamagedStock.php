<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DamagedStock extends Model
{
    protected $table = 'damaged_stock';

    protected $fillable = [
        'product_id', 'product_name', 'quantity',
        'client_id', 'client_transaction_id', 'sales_return_item_id',
    ];

    public function product()
    {
        return $this->belongsTo(Produit::class, 'product_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function clientTransaction()
    {
        return $this->belongsTo(ClientTransaction::class);
    }

    public function salesReturnItem()
    {
        return $this->belongsTo(SalesReturnItem::class);
    }
}
