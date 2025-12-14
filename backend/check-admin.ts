#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('Checking for admin users...\n');

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (admins.length === 0) {
      console.log('❌ No admin users found in the database.');
      console.log('\nTo create an admin user:');
      console.log('1. First register a user through the app');
      console.log('2. Then run: npx ts-node prisma/create-admin.ts <email>\n');
    } else {
      console.log(`✓ Found ${admins.length} admin user(s):\n`);
      admins.forEach((admin: any, index: number) => {
        console.log(`${index + 1}. ${admin.firstName} ${admin.lastName}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Status: ${admin.status}`);
        console.log(`   Email Verified: ${admin.emailVerified}`);
        console.log(`   Created: ${admin.createdAt.toISOString()}`);
        console.log('');
      });
    }

    // Also check all users
    console.log('All users in database:');
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (allUsers.length === 0) {
      console.log('❌ No users found in database\n');
    } else {
      console.log(`Total users: ${allUsers.length}\n`);
      allUsers.forEach((user: any, index: number) => {
        console.log(`${index + 1}. ${user.email} - ${user.role} - ${user.status}`);
      });
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
