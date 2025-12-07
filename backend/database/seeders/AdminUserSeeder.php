<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@moneyapp.co'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('Admin1234'),
                'phone_number' => '70000000',
                'dob' => '1990-01-01',
                'role' => 'admin',
            ]
        );

        Wallet::firstOrCreate(
            ['user_id' => $admin->id],
            ['balance' => 1000]
        );
    }
}
