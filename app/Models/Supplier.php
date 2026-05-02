<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'nom',
        'email',
        'telephone',
        'adresse',
        'ville',
        'notes',
        'status',
    ];

    protected static function booted()
    {
        static::creating(function ($supplier) {
            $supplier->uuid = \Str::uuid();
        });
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }

}
