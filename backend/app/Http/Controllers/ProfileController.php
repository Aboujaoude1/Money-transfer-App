<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    /**
     * UPDATE PROFILE
     * PUT /api/profile
     *
     * Frontend sends: { name, email, phone_number, dob }
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|email|max:255|unique:users,email,' . $user->id,
            'phone_number' => 'nullable|string|max:50',
            'dob'          => 'nullable|date',
        ]);

        $user->name         = $validated['name'];
        $user->email        = $validated['email'];
        $user->phone_number = $validated['phone_number'] ?? null;
        $user->dob          = $validated['dob'] ?? null;

        $user->save();

        // fresh() reloads from DB with latest values
        $freshUser = $user->fresh();

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully.',
            'user' => $freshUser,
        ]);
    }

    /**
     * CHANGE PASSWORD
     * POST /api/change-password
     *
     * Frontend sends:
     *  current_password
     *  new_password
     *  new_password_confirmation
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password'          => 'required|string',
            'new_password'              => 'required|string|min:6|confirmed', // uses new_password_confirmation
        ]);

        // Check current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            // Return a 422 validation-style error so frontend shows it under field
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors'  => [
                    'current_password' => ['Current password is incorrect.'],
                ],
            ], 422);
        }

        $user->password = $validated['new_password']; // auto-hashed by 'hashed' cast
        $user->save();

        return response()->json([
            'status'  => 'success',
            'message' => 'Password updated successfully.',
        ]);
    }
}
