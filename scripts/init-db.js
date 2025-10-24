#!/usr/bin/env node

/**
 * Database Initialization Script
 *
 * Creates default users if they don't exist in the database.
 * This replaces the JSON file initialization.
 *
 * Usage:
 *   node scripts/init-db.js
 */

const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

async function initializeDatabase() {
  console.log('🔧 Initializing database with default users...\n');

  try {
    const defaultUsers = [
      {
        email: 'admin@maytech.com',
        password: bcrypt.hashSync('admin123', 10),
        name: 'Admin User',
        role: 'admin'
      },
      {
        email: 'staff@maytech.com',
        password: bcrypt.hashSync('staff123', 10),
        name: 'Demo Staff',
        role: 'staff'
      }
    ];

    for (const userData of defaultUsers) {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existing) {
        console.log(`  ⏭️  User already exists: ${userData.email}`);
        continue;
      }

      // Create user
      const user = await prisma.user.create({
        data: userData
      });

      console.log(`  ✅ Created ${userData.role} user: ${userData.email}`);
    }

    console.log('\n✅ Database initialization complete!\n');

    // Print summary
    const totalUsers = await prisma.user.count();
    console.log(`📊 Total users in database: ${totalUsers}\n`);

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run initialization
initializeDatabase();
