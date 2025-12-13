#!/usr/bin/env ts-node

/**
 * Create Admin User Script
 *
 * This script promotes an existing user to ADMIN role
 * Usage: npx ts-node prisma/create-admin.ts <email>
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

async function setUserAsAdmin(email: string) {
  try {
    console.log(`\nSearching for user: ${email}...`);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      console.error(`❌ Error: User with email "${email}" not found.`);
      console.log('\nPlease ensure the user has registered first.');
      process.exit(1);
    }

    console.log('\n📋 User found:');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Current Status: ${user.status}`);

    // Update user to ADMIN and ACTIVE
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true, // Ensure email is verified
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    console.log('\n✅ User successfully promoted to ADMIN!');
    console.log('\n📋 Updated user details:');
    console.log(`   Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log(`   Status: ${updatedUser.status}`);
    console.log(`   Email Verified: ${updatedUser.emailVerified}`);
    console.log('\n🎉 The user can now access admin features!\n');

  } catch (error: any) {
    console.error('\n❌ Error updating user:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function promptForEmail(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter the email address to make admin: ', (email) => {
      rl.close();
      resolve(email.trim());
    });
  });
}

async function main() {
  console.log('=========================================');
  console.log('         Create Admin User');
  console.log('=========================================\n');

  // Get email from command line argument or prompt
  let email = process.argv[2];

  if (!email) {
    email = await promptForEmail();
  }

  if (!email) {
    console.error('❌ Error: Email address is required');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Error: Invalid email format');
    process.exit(1);
  }

  await setUserAsAdmin(email);

  console.log('=========================================');
  console.log('                Done!');
  console.log('=========================================\n');
}

main()
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
