#!/usr/bin/env ts-node

/**
 * Direct User and Admin Creation Script
 * Creates a user directly in the database and sets them as admin
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface UserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

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

async function createAdminUser(input: UserInput) {
  try {
    console.log('\n🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(input.password, 10);

    console.log('👤 Creating admin user...');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    let user;
    if (existingUser) {
      console.log('⚠️  User already exists. Updating to ADMIN...');
      user = await prisma.user.update({
        where: { email: input.email },
        data: {
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          firstName: input.firstName,
          lastName: input.lastName,
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
        },
      });

      console.log('💰 Creating wallet for user...');
      // Create wallet for the user
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          ledgerBalance: 0,
          availableBalance: 0,
        },
      });
    }

    console.log('\n✅ SUCCESS! Admin user created/updated:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:    ${user.email}`);
    console.log(`👤 Name:     ${user.firstName} ${user.lastName}`);
    console.log(`🔑 Role:     ${user.role}`);
    console.log(`✓  Status:   ${user.status}`);
    console.log(`✉️  Verified: ${user.emailVerified}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 You can now log in with these credentials!\n');

    return user;
  } catch (error: any) {
    console.error('\n❌ Error creating user:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   Create Admin User (Direct Method)  ║');
  console.log('╚═══════════════════════════════════════╝\n');

  // Get user input
  const email = await prompt('📧 Email address: ');
  const password = await prompt('🔒 Password: ');
  const firstName = await prompt('👤 First name: ');
  const lastName = await prompt('👥 Last name: ');

  // Validate
  if (!email || !password || !firstName || !lastName) {
    console.error('\n❌ All fields are required!');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('\n❌ Password must be at least 6 characters!');
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('\n❌ Invalid email format!');
    process.exit(1);
  }

  console.log('\n📝 Creating user with:');
  console.log(`   Email: ${email}`);
  console.log(`   Name: ${firstName} ${lastName}`);
  console.log(`   Role: ADMIN`);
  console.log('');

  await createAdminUser({
    email,
    password,
    firstName,
    lastName,
  });
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
