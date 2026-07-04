<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Employee extends Model
{
    protected $fillable = [
        'uuid', 'nom', 'email', 'telephone', 'poste',
        'salaire_brut', 'date_embauche', 'cnss', 'status',
    ];

    protected $casts = [
        'date_embauche' => 'date',
        'salaire_brut'  => 'decimal:2',
    ];

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            $model->uuid ??= (string) Str::uuid();
        });
    }

    public function payments(): HasMany
    {
        return $this->hasMany(EmployeePayment::class);
    }
}
