<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
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
        static::creating(function ($client) {
            $client->uuid = \Str::uuid();
        });
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    public function clientTransactions()
    {
        return $this->hasMany(ClientTransaction::class);
    }
}
