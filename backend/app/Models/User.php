<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Mass assignable attributes
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone_number',
        'dob',
    ];

    /**
     * Hidden attributes for arrays / JSON
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Attribute casting
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        'dob'               => 'date',
    ];

    /**
     * Relationships
     */
    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    public function transactionsSent()
    {
        return $this->hasMany(Transaction::class, 'from_user_id');
    }

    public function transactionsReceived()
    {
        return $this->hasMany(Transaction::class, 'to_user_id');
    }

    /**
     * Role helpers
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isUser(): bool
    {
        return $this->role === 'user';
    }
}
