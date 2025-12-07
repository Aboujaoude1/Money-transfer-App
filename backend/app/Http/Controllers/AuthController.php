<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // POST /api/register
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|string|email:rfc,dns|max:255|unique:users,email',
            'password'     => 'required|string|min:6|max:255|confirmed',
            'phone_number' => 'nullable|string|max:20',
            'dob'          => 'nullable|date', // expected format: YYYY-MM-DD
        ]);

        return DB::transaction(function () use ($validated) {
            $user = User::create([
                'name'         => $validated['name'],
                'email'        => $validated['email'],
                'password'     => Hash::make($validated['password']),
                'role'         => 'user',
                'phone_number' => $validated['phone_number'] ?? null,
                'dob'          => $validated['dob'] ?? null,
            ]);

            Wallet::create([
                'user_id' => $user->id,
                'balance' => 0,
            ]);

            $token = $user->createToken('mobile-token')->plainTextToken;

            return response()->json([
                'status' => 'success',
                'user'   => $user,
                'token'  => $token,
            ], 201);
        });
    }

    // POST /api/login
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Invalid email or password',
            ], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Optional: single-session behavior
        $user->tokens()->delete();

        $token = $user->createToken('mobile-token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'user'   => $user,
            'token'  => $token,
        ]);
    }

    // POST /api/logout
    public function logout(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $user->currentAccessToken()->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Logged out successfully',
        ]);
    }

    // GET /api/me
    public function me(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'user'   => $request->user(),
        ]);
    }
}
