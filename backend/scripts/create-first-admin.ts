#!/usr/bin/env ts-node

/**
 * Create First Admin User Script
 *
 * This script creates the first admin user directly in the database
 * without requiring prior registration. Use this for initial setup only.
 *
 * Usage: npx ts-node scripts/create-first-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function createFirstAdmin() {
  try {
    console.log('\n===========================================');
    console.log('     Create First Admin User');
    console.log('===========================================\n');

    // Get admin details
    const email = await prompt('Enter admin email: ');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`\n⚠️  User with email "${email}" already exists.`);
      console.log(`   Current role: ${existingUser.role}`);
      console.log(`   Current status: ${existingUser.status}\n`);

      if (existingUser.role === 'ADMIN' && existingUser.status === 'ACTIVE') {
        console.log('✓ This user is already an active admin!');
        console.log('\nYou can login with this user.\n');
        return;
      }

      const upgrade = await prompt('Would you like to upgrade this user to admin? (yes/no): ');
      if (upgrade.toLowerCase() !== 'yes' && upgrade.toLowerCase() !== 'y') {
        console.log('\nOperation cancelled.\n');
        return;
      }

      // Upgrade existing user to admin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
        },
      });

      console.log('\n✅ User successfully upgraded to admin!');
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Role: ${updatedUser.role}`);
      console.log(`   Status: ${updatedUser.status}\n`);
      return;
    }

    // Create new admin user
    const firstName = await prompt('Enter first name: ');
    const lastName = await prompt('Enter last name: ');
    const password = await prompt('Enter password (min 8 characters): ');

    if (!firstName || !lastName) {
      throw new Error('First name and last name are required');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user and wallet in a transaction
    const admin = await prisma.$transaction(async (tx: any) => {
      const newAdmin = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
        },
      });

      // Create wallet for admin
      await tx.wallet.create({
        data: {
          userId: newAdmin.id,
        },
      });

      return newAdmin;
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📋 Admin Details:');
    console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.status}`);
    console.log(`   Email Verified: ${admin.emailVerified}`);
    console.log('\n🎉 You can now login with these credentials!\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    await createFirstAdmin();
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
