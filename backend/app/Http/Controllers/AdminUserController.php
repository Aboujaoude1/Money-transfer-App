<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    // GET /api/admin/users
    public function index(Request $request)
    {
        // user is already auth:sanctum + admin via middleware
        $users = User::with('wallet')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($u) {
                // add a "balance" attribute from wallet relation
                $u->balance = $u->wallet->balance ?? 0;
                return $u;
            });

        return response()->json([
            'status' => 'success',
            'users'  => $users,
        ]);
    }
}
