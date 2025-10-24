#!/usr/bin/env node

/**
 * Migration Script: JSON Files to PostgreSQL Database
 *
 * This script migrates data from JSON files (users.json, progress.json)
 * to the PostgreSQL database via Prisma.
 *
 * Usage:
 *   node scripts/migrate-json-to-db.js
 *
 * Prerequisites:
 *   1. Database must be set up and POSTGRES_PRISMA_URL configured in .env
 *   2. Run `npx prisma migrate dev` to create tables
 *   3. Ensure data/users.json and data/progress.json exist
 */

const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
const PROGRESS_FILE = path.join(__dirname, '..', 'data', 'progress.json');

async function migrateData() {
  console.log('🚀 Starting migration from JSON files to database...\n');

  try {
    // Check if files exist
    if (!fs.existsSync(USERS_FILE)) {
      console.error('❌ Error: users.json not found at:', USERS_FILE);
      process.exit(1);
    }

    if (!fs.existsSync(PROGRESS_FILE)) {
      console.warn('⚠️  Warning: progress.json not found. Skipping progress migration.');
    }

    // Read JSON files
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    const progress = fs.existsSync(PROGRESS_FILE)
      ? JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
      : [];

    console.log(`📊 Found ${users.length} users and ${progress.length} progress records\n`);

    // Migrate Users
    console.log('👥 Migrating users...');
    let migratedUsers = 0;
    let skippedUsers = 0;

    for (const user of users) {
      try {
        // Check if user already exists
        const existing = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (existing) {
          console.log(`  ⏭️  Skipping existing user: ${user.email}`);
          skippedUsers++;
          continue;
        }

        // Create user in database
        await prisma.user.create({
          data: {
            email: user.email,
            password: user.password, // Already hashed
            name: user.name,
            role: user.role
          }
        });

        console.log(`  ✅ Migrated user: ${user.email} (${user.role})`);
        migratedUsers++;
      } catch (error) {
        console.error(`  ❌ Error migrating user ${user.email}:`, error.message);
      }
    }

    console.log(`\n✅ Users migration complete: ${migratedUsers} migrated, ${skippedUsers} skipped\n`);

    // Migrate Progress
    if (progress.length > 0) {
      console.log('📈 Migrating progress records...');
      let migratedProgress = 0;
      let skippedProgress = 0;

      for (const prog of progress) {
        try {
          // Find the user by email or name to get their new ID
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { id: prog.userId },
                { name: prog.userName }
              ]
            }
          });

          if (!user) {
            console.log(`  ⏭️  Skipping progress for unknown user: ${prog.userName || prog.userId}`);
            skippedProgress++;
            continue;
          }

          // Check if progress already exists
          const existing = await prisma.progress.findUnique({
            where: { userId: user.id }
          });

          if (existing) {
            console.log(`  ⏭️  Skipping existing progress for: ${user.name}`);
            skippedProgress++;
            continue;
          }

          // Create progress record
          await prisma.progress.create({
            data: {
              userId: user.id,
              currentSection: prog.currentSection || 0,
              completedSections: prog.completedSections || 0,
              sections: prog.sections || [],
              lastUpdated: prog.lastUpdated ? new Date(prog.lastUpdated) : new Date()
            }
          });

          console.log(`  ✅ Migrated progress for: ${user.name}`);
          migratedProgress++;
        } catch (error) {
          console.error(`  ❌ Error migrating progress:`, error.message);
        }
      }

      console.log(`\n✅ Progress migration complete: ${migratedProgress} migrated, ${skippedProgress} skipped\n`);
    }

    console.log('🎉 Migration completed successfully!\n');

    // Print summary
    console.log('📊 Final Database Summary:');
    const totalUsers = await prisma.user.count();
    const totalProgress = await prisma.progress.count();
    console.log(`   Users: ${totalUsers}`);
    console.log(`   Progress records: ${totalProgress}\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateData();
