<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Account;
use App\Models\Category;
use App\Models\ApiToken;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator',
                'password' => bcrypt('admin123'),
            ]
        );

        // Create regular user
        $user = User::firstOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'John Doe',
                'password' => bcrypt('user123'),
            ]
        );

        // Create accounts
        $account = Account::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Dompet Utama'],
            [
                'balance' => 5000000,
                'currency' => 'IDR',
            ]
        );

        // Create system categories
        $categories = [
            ['name' => 'Makanan', 'type' => 'expense', 'is_system' => true],
            ['name' => 'Minuman', 'type' => 'expense', 'is_system' => true],
            ['name' => 'Transportasi', 'type' => 'expense', 'is_system' => true],
            ['name' => 'Gaji', 'type' => 'income', 'is_system' => true],
            ['name' => 'Bonus', 'type' => 'income', 'is_system' => true],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(
                ['name' => $cat['name']],
                [
                    'user_id' => $user->id,
                    'type' => $cat['type'],
                    'is_system' => $cat['is_system'],
                ]
            );
        }

        // Create API token
        $tokenPlain = 'catatan_sk_' . bin2hex(random_bytes(16));
        ApiToken::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Token AI Agent'],
            [
                'token_hash' => hash('sha256', $tokenPlain),
                'abilities' => [
                    'profile:read',
                    'transactions:read',
                    'transactions:create',
                    'transactions:update',
                    'transactions:delete',
                    'categories:read',
                    'summary:read',
                ],
            ]
        );

        $this->command->info("=== DATA POSTMAN ===");
        $this->command->info("User: user@example.com / user123");
        $this->command->info("Admin: admin@example.com / admin123");
        $this->command->info("Token: catatan_sk_" . substr(hash('sha256', $tokenPlain), 0, 16) . "...");
        $this->command->info("Account ID: " . $account->id);
        $this->command->info("Category Makanan ID: " . Category::where('name', 'Makanan')->first()->id);
        $this->command->info("Category Gaji ID: " . Category::where('name', 'Gaji')->first()->id);
    }
}
