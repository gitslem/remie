import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAdmin() {
  const user = await prisma.user.findUnique({
    where: { email: 'anslemebieg7@gmail.com' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      emailVerified: true,
      password: true
    }
  });

  if (user) {
    console.log('✓ User found in database:');
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Status:', user.status);
    console.log('  Email Verified:', user.emailVerified);
    console.log('  Password hash exists:', user.password ? 'Yes' : 'No');
    console.log('  Password hash starts with:', user.password.substring(0, 7));
  } else {
    console.log('❌ User not found');
  }

  await prisma.$disconnect();
}

verifyAdmin();
