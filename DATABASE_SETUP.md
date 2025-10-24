# Database Migration Guide

This guide will help you migrate from the legacy JSON file storage to PostgreSQL with Prisma ORM.

## Table of Contents

1. [Why Migrate to Database?](#why-migrate-to-database)
2. [What Changed?](#what-changed)
3. [Quick Start](#quick-start)
4. [Detailed Setup Instructions](#detailed-setup-instructions)
5. [Migrating Existing Data](#migrating-existing-data)
6. [Verifying the Migration](#verifying-the-migration)
7. [Troubleshooting](#troubleshooting)

## Why Migrate to Database?

The previous version used JSON files (`data/users.json` and `data/progress.json`) for data storage. While this worked for development, it has limitations:

❌ **Problems with JSON Files:**
- Not suitable for concurrent users (file locking issues)
- No transaction support
- Difficult to scale
- Risk of data corruption
- No backup/recovery mechanisms
- Poor performance with large datasets
- Not compatible with serverless deployments (Vercel)

✅ **Benefits of PostgreSQL + Prisma:**
- Production-ready and scalable
- ACID transactions (data integrity)
- Concurrent user support
- Automatic backups (with Vercel Postgres)
- Type-safe database queries
- Migration system for schema changes
- Works seamlessly with Vercel serverless functions

## What Changed?

### Code Changes

1. **Dependencies Added:**
   - `@prisma/client` - Database ORM client
   - `@vercel/postgres` - Vercel Postgres integration
   - `prisma` - Prisma CLI and tooling
   - `dotenv` - Environment variable management

2. **New Files:**
   - `prisma/schema.prisma` - Database schema definition
   - `lib/prisma.js` - Prisma client singleton
   - `scripts/init-db.js` - Initialize default users
   - `scripts/migrate-json-to-db.js` - Migrate from JSON to DB
   - `.env.example` - Environment variable template

3. **Modified Files:**
   - `server.js` - All routes now use Prisma instead of file I/O
   - `package.json` - Added database management scripts

### Database Schema

**User Model:**
```prisma
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  password  String    // bcrypt hashed
  name      String
  role      String    @default("staff")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  progress  Progress?
}
```

**Progress Model:**
```prisma
model Progress {
  id                Int      @id @default(autoincrement())
  userId            Int      @unique
  currentSection    Int      @default(0)
  completedSections Int      @default(0)
  sections          Json     // Array of section data
  lastUpdated       DateTime @default(now()) @updatedAt
  user              User     @relation(fields: [userId], references: [id])
}
```

## Quick Start

### For New Installations

If you're setting up from scratch (no existing data):

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add your database credentials

# 3. Push schema to database
npm run db:push

# 4. Initialize default users
npm run db:init

# 5. Start the server
npm start
```

### For Existing Installations (with JSON data)

If you have existing `data/users.json` and `data/progress.json`:

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add your database credentials

# 3. Push schema to database
npm run db:push

# 4. Migrate existing JSON data to database
npm run db:migrate-json

# 5. Start the server
npm start
```

## Detailed Setup Instructions

### Step 1: Set Up Database

#### Option A: Vercel Postgres (Recommended for Production)

1. **Go to Vercel Dashboard**
   - Navigate to https://vercel.com/dashboard
   - Select your project (or create a new one)

2. **Create Postgres Database**
   - Click on "Storage" tab
   - Click "Create Database"
   - Select "Postgres"
   - Choose a name (e.g., `maytech-onboarding`)
   - Select a region close to your users

3. **Get Connection Strings**
   - After creation, go to the `.env.local` tab
   - Copy `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`

4. **Configure Local Environment**

   Create `.env` file in your project root:

   ```env
   POSTGRES_PRISMA_URL="postgres://default:***@***-pooler.us-east-1.postgres.vercel-storage.com/verceldb?sslmode=require&pgbouncer=true"
   POSTGRES_URL_NON_POOLING="postgres://default:***@***-us-east-1.postgres.vercel-storage.com/verceldb?sslmode=require"
   SESSION_SECRET="generate-a-secure-random-string-here"
   NODE_ENV="development"
   ```

   **Generate a secure SESSION_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

#### Option B: Local PostgreSQL

1. **Install PostgreSQL**

   - **macOS** (using Homebrew):
     ```bash
     brew install postgresql@14
     brew services start postgresql@14
     ```

   - **Ubuntu/Debian**:
     ```bash
     sudo apt update
     sudo apt install postgresql postgresql-contrib
     sudo systemctl start postgresql
     ```

   - **Windows**:
     Download from https://www.postgresql.org/download/windows/

2. **Create Database**

   ```bash
   # Connect to PostgreSQL
   psql postgres

   # Create database
   CREATE DATABASE maytech_onboarding;

   # Create user (optional)
   CREATE USER maytech_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE maytech_onboarding TO maytech_user;

   # Exit
   \q
   ```

3. **Configure Environment**

   Create `.env` file:

   ```env
   POSTGRES_PRISMA_URL="postgresql://maytech_user:your_password@localhost:5432/maytech_onboarding"
   POSTGRES_URL_NON_POOLING="postgresql://maytech_user:your_password@localhost:5432/maytech_onboarding"
   SESSION_SECRET="generate-a-secure-random-string-here"
   NODE_ENV="development"
   ```

#### Option C: Other Cloud Providers

**Supabase:**
1. Create account at https://supabase.com
2. Create new project
3. Get connection string from Settings → Database
4. Use the connection pooling URL for `POSTGRES_PRISMA_URL`
5. Use the direct connection URL for `POSTGRES_URL_NON_POOLING`

**Railway:**
1. Create account at https://railway.app
2. Create new PostgreSQL database
3. Copy connection strings from Variables tab

**Neon:**
1. Create account at https://neon.tech
2. Create new project
3. Get pooled and direct connection strings

### Step 2: Initialize Database Schema

```bash
# Push Prisma schema to database (creates tables)
npm run db:push
```

This command will:
- Create `User` table
- Create `Progress` table
- Create `Session` table
- Set up all indexes and relations

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "verceldb", schema "public"

🚀  Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

### Step 3: Initialize Default Users

```bash
npm run db:init
```

This creates two default accounts:
- **Admin**: admin@maytech.com / admin123
- **Demo Staff**: staff@maytech.com / staff123

**Expected output:**
```
🔧 Initializing database with default users...

  ✅ Created admin user: admin@maytech.com
  ✅ Created staff user: staff@maytech.com

✅ Database initialization complete!

📊 Total users in database: 2
```

### Step 4: Verify Setup

```bash
# Open Prisma Studio (database GUI)
npm run db:studio
```

This opens a web interface at `http://localhost:5555` where you can:
- View all tables
- Browse user records
- Inspect data
- Make manual edits if needed

## Migrating Existing Data

If you have existing JSON files with user and progress data:

### Before Migration

**Backup your JSON files:**
```bash
cp data/users.json data/users.json.backup
cp data/progress.json data/progress.json.backup
```

### Run Migration Script

```bash
npm run db:migrate-json
```

The script will:
1. Read `data/users.json`
2. Read `data/progress.json`
3. Import users into PostgreSQL (skip if already exists)
4. Import progress records (skip if already exists)
5. Display summary

**Expected output:**
```
🚀 Starting migration from JSON files to database...

📊 Found 5 users and 3 progress records

👥 Migrating users...
  ✅ Migrated user: admin@maytech.com (admin)
  ✅ Migrated user: staff@maytech.com (staff)
  ✅ Migrated user: john@maytech.com (staff)
  ⏭️  Skipping existing user: jane@maytech.com
  ✅ Migrated user: bob@maytech.com (staff)

✅ Users migration complete: 4 migrated, 1 skipped

📈 Migrating progress records...
  ✅ Migrated progress for: John Doe
  ✅ Migrated progress for: Jane Smith
  ⏭️  Skipping existing progress for: Bob Johnson

✅ Progress migration complete: 2 migrated, 1 skipped

🎉 Migration completed successfully!

📊 Final Database Summary:
   Users: 5
   Progress records: 3
```

### After Migration

1. **Verify data in Prisma Studio:**
   ```bash
   npm run db:studio
   ```

2. **Test login with existing users**

3. **Check progress tracking works**

4. **Archive JSON files** (keep as backup):
   ```bash
   mkdir data/archive
   mv data/users.json data/archive/
   mv data/progress.json data/archive/
   ```

## Verifying the Migration

### 1. Check Database Connection

```bash
# Test Prisma connection
npx prisma db pull
```

Expected: No errors, schema synced successfully.

### 2. Start the Server

```bash
npm start
```

Expected output:
```
Maytech & AKQA Onboarding Server running on http://localhost:3000

Default credentials:
Admin: admin@maytech.com / admin123
Staff: staff@maytech.com / staff123
```

### 3. Test Login

1. Navigate to http://localhost:3000
2. Login with admin credentials
3. Verify admin dashboard loads
4. Check user list and progress data

### 4. Test Staff Progress

1. Logout and login as staff user
2. Navigate through onboarding sections
3. Acknowledge a section
4. Verify progress saves
5. Refresh page and verify progress persists

### 5. Test Admin Functions

1. Login as admin
2. Create a new user from admin dashboard
3. Verify user appears in user list
4. Check database in Prisma Studio

## Troubleshooting

### Error: "Can't reach database server"

**Cause:** Database connection string is incorrect or database is not running.

**Solution:**
1. Check `.env` file exists and has correct values
2. Verify database is running (local) or accessible (cloud)
3. Test connection:
   ```bash
   npx prisma db pull
   ```

### Error: "Prisma Client not initialized"

**Cause:** Prisma Client wasn't generated after install.

**Solution:**
```bash
npm run db:generate
```

### Error: "relation does not exist"

**Cause:** Database tables haven't been created.

**Solution:**
```bash
npm run db:push
```

### Error: "User already exists" during migration

**Cause:** Users were already migrated or created.

**Solution:** This is expected behavior. The script skips existing users. You can verify in Prisma Studio.

### Sessions not persisting after restart

**Cause:** Using in-memory session store (default).

**Solution:** This is normal in development. Sessions are stored in memory. For production, sessions are configured to use database-backed storage automatically.

### Migration script fails

**Cause:** JSON files don't exist or are malformed.

**Solution:**
1. Check `data/users.json` and `data/progress.json` exist
2. Verify JSON is valid:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('data/users.json'))"
   ```
3. Fix JSON syntax errors if any

### Want to start fresh

**Reset database completely:**
```bash
# CAUTION: This deletes ALL data
npx prisma migrate reset

# Re-initialize
npm run db:push
npm run db:init
```

## Database Management Commands

```bash
# Generate Prisma Client (after schema changes)
npm run db:generate

# Push schema to database (development)
npm run db:push

# Create a migration (for production)
npm run db:migrate

# Deploy migrations (production)
npm run db:migrate:deploy

# Open Prisma Studio (database GUI)
npm run db:studio

# Initialize default users
npm run db:init

# Migrate from JSON files
npm run db:migrate-json
```

## Production Deployment

When deploying to production (Vercel):

1. **Database is automatically configured** by Vercel Postgres
2. **Environment variables** are set automatically
3. **Run migrations** after deployment:
   ```bash
   vercel env pull .env.production
   npm run db:push
   npm run db:init
   ```

Or use Vercel Dashboard to run commands in serverless environment.

## Getting Help

If you encounter issues:

1. Check server logs for detailed error messages
2. Use Prisma Studio to inspect database state: `npm run db:studio`
3. Verify environment variables are set correctly
4. Check Prisma documentation: https://www.prisma.io/docs
5. Check Vercel Postgres docs: https://vercel.com/docs/storage/vercel-postgres

## Summary

✅ **What you've accomplished:**
- Migrated from JSON files to PostgreSQL
- Set up Prisma ORM for type-safe database access
- Created production-ready database schema
- Migrated all existing user and progress data
- Configured environment variables
- Set up database management scripts

✅ **What you can do now:**
- Scale to hundreds/thousands of users
- Deploy to Vercel with confidence
- Automatic backups (with Vercel Postgres)
- Use Prisma Studio to manage data
- Run migrations safely
- Query database efficiently

🎉 **Your onboarding system is now production-ready!**
