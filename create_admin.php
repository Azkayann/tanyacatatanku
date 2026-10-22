<?php

use Illuminate\Support\Facades\Hash;

// Run in Laravel Tinker or PHP console

$admin = new \App\Models\User();
$admin->name = 'Super Admin';
$admin->email = 'admin@catatanku.id';
$admin->password = Hash::make('AdminPassword123');
$admin->role = 'admin';
$admin->is_active = true;
$admin->save();

echo "Admin user created successfully:\n";
echo "Email: {$admin->email}\n";
echo "Password: AdminPassword123\n";
echo "Role: {$admin->role}\n";

// Alternative: Using create method
/*
\App\Models\User::create([
    'name' => 'System Administrator',
    'email' => 'sysadmin@catatanku.id',
    'password' => Hash::make('SystemAdmin456'),
    'role' => 'admin',
    'is_active' => true,
]);
*/