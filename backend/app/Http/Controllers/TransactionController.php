<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    // GET /api/wallet
// TransactionController.php

public function wallet(Request $request)
{
    $user = $request->user();
    $wallet = $user->wallet()->first();

    // always: user balance
    $response = [
        'status'  => 'success',
        'wallet'  => $wallet,
        'balance' => $wallet?->balance ?? 0,
    ];

    // if admin → add total + all users
    if ($user->isAdmin()) {
        $response['total_balance'] = \App\Models\Wallet::sum('balance');

        // return all users with their balance
        $response['users'] = \App\Models\User::with('wallet')
            ->get()
            ->map(function ($u) {
                return [
                    'id'      => $u->id,
                    'name'    => $u->name,
                    'email'   => $u->email,
                    'balance' => $u->wallet->balance ?? 0,
                ];
            });
    }

    return response()->json($response);
}

    // POST /api/deposit
    public function deposit(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'amount'      => 'required|numeric|min:0.01',
            'description' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($user, $data) {
            $wallet = Wallet::firstOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0]
            );

            $wallet->balance += $data['amount'];
            $wallet->save();

            $transaction = Transaction::create([
                'type'         => 'deposit',
                'from_user_id' => null,
                'to_user_id'   => $user->id,
                'amount'       => $data['amount'],
                'status'       => 'completed',
                'description'  => $data['description'] ?? null,
            ]);

            return response()->json([
                'status'      => 'success',
                'message'     => 'Deposit successful',
                'balance'     => $wallet->balance,
                'transaction' => $transaction,
            ], 201);
        });
    }

    // POST /api/withdraw
    public function withdraw(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'amount'      => 'required|numeric|min:0.01',
            'description' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($user, $data) {
            $wallet = Wallet::firstOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0]
            );

            if ($wallet->balance < $data['amount']) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Insufficient balance',
                ], 422);
            }

            $wallet->balance -= $data['amount'];
            $wallet->save();

            $transaction = Transaction::create([
                'type'         => 'withdraw',
                'from_user_id' => $user->id,
                'to_user_id'   => null,
                'amount'       => $data['amount'],
                'status'       => 'completed',
                'description'  => $data['description'] ?? null,
            ]);

            return response()->json([
                'status'      => 'success',
                'message'     => 'Withdraw successful',
                'balance'     => $wallet->balance,
                'transaction' => $transaction,
            ]);
        });
    }

    // POST /api/transfer
    public function transfer(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'to_email'    => 'required|email|exists:users,email',
            'amount'      => 'required|numeric|min:0.01',
            'description' => 'nullable|string',
        ]);

        $receiver = User::where('email', $data['to_email'])->first();

        if ($receiver->id === $user->id) {
            return response()->json([
                'status'  => 'error',
                'message' => 'You cannot transfer to yourself',
            ], 422);
        }

        return DB::transaction(function () use ($user, $receiver, $data) {
            $senderWallet = Wallet::firstOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0]
            );

            $receiverWallet = Wallet::firstOrCreate(
                ['user_id' => $receiver->id],
                ['balance' => 0]
            );

            if ($senderWallet->balance < $data['amount']) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Insufficient balance',
                ], 422);
            }

            $senderWallet->balance   -= $data['amount'];
            $receiverWallet->balance += $data['amount'];

            $senderWallet->save();
            $receiverWallet->save();

            $transaction = Transaction::create([
                'type'         => 'transfer',
                'from_user_id' => $user->id,
                'to_user_id'   => $receiver->id,
                'amount'       => $data['amount'],
                'status'       => 'completed',
                'description'  => $data['description'] ?? null,
            ]);

            return response()->json([
                'status'          => 'success',
                'message'         => 'Transfer successful',
                'sender_balance'  => $senderWallet->balance,
                'receiver_balance'=> $receiverWallet->balance,
                'transaction'     => $transaction,
            ]);
        });
    }

    // GET /api/transactions (current user)
    public function myTransactions(Request $request)
{
    $user = $request->user();

    // If admin → see ALL transactions
    if ($user->isAdmin()) {
        $transactions = Transaction::with(['fromUser', 'toUser'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status'       => 'success',
            'transactions' => $transactions,
        ]);
    }

    // Normal user → only his own
    $transactions = Transaction::with(['fromUser', 'toUser'])
        ->where(function ($q) use ($user) {
            $q->where('from_user_id', $user->id)
              ->orWhere('to_user_id', $user->id);
        })
        ->orderBy('created_at', 'desc')
        ->get();

    return response()->json([
        'status'       => 'success',
        'transactions' => $transactions,
    ]);
}


    // GET /api/admin/transactions (protected by admin middleware)
    public function adminTransactions(Request $request)
    {
        // if you already added the 'admin' middleware, this check is optional
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Forbidden: admin only',
            ], 403);
        }

        $transactions = Transaction::with(['fromUser', 'toUser'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status'       => 'success',
            'transactions' => $transactions,
        ]);
    }
}
