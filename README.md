# Maytech & AKQA Onboarding System

A comprehensive employee onboarding platform for new staff joining the Maytech and AKQA partnership in Sri Lanka.

## Overview

This application provides a complete onboarding solution with staff authentication, sequential learning modules, progress tracking, and administrative oversight. New employees must go through each section and acknowledge their understanding before proceeding to the next.

## Features

### For Staff
- **Secure Login**: Individual staff accounts with secure authentication
- **Sequential Learning**: Navigate through 7 comprehensive onboarding sections
- **Progress Tracking**: Visual progress indicator showing completion status
- **Acknowledgment System**: Must acknowledge understanding of each section before proceeding
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Session Persistence**: Resume where you left off

### For Administrators
- **Admin Dashboard**: Real-time overview of all staff onboarding progress
- **User Management**: Create new staff accounts
- **Progress Monitoring**: Track completion status and dates
- **Statistics**: View overall completion metrics
- **Comprehensive Reporting**: Detailed progress breakdown per employee

## Onboarding Sections

1. **Partnership** - Understanding the Maytech & AKQA collaboration
2. **FAQ** - Answers to common questions about payroll, leave, and HR
3. **Policies & Procedures** - Hybrid work, leave policies, and security guidelines
4. **Responsibilities** - Clear breakdown of who handles what
5. **Workflows** - Standard procedures for requests and support
6. **Workplace Guidelines** - Confidentiality, professionalism, and wellbeing
7. **Completion** - Congratulations and next steps

## Technologies Used

### Backend
- **Node.js** with **Express**: RESTful API and session management
- **PostgreSQL**: Production-ready relational database
- **Prisma ORM**: Type-safe database access and migrations
- **bcryptjs**: Secure password hashing
- **express-session**: User authentication and session persistence

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with flexbox and grid layouts
- **Vanilla JavaScript**: No frameworks - fast and lightweight

### Deployment
- **Vercel**: Serverless deployment platform
- **Vercel Postgres**: Managed PostgreSQL database

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)
- PostgreSQL database (local or cloud-hosted)

### Setup

#### Option A: Quick Setup with Vercel Postgres (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd maytech-akqa-onboarding
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Vercel Postgres**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Create a new Postgres database or use existing one
   - Go to the `.env.local` tab and copy the environment variables
   - Create a `.env` file in your project root

4. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```

   Your `.env` should look like:
   ```env
   POSTGRES_PRISMA_URL="postgres://default:***@***-pooler.*.postgres.vercel-storage.com/verceldb?sslmode=require&pgbouncer=true"
   POSTGRES_URL_NON_POOLING="postgres://default:***@***.*.postgres.vercel-storage.com/verceldb?sslmode=require"
   SESSION_SECRET="your-secure-random-secret-here"
   NODE_ENV="development"
   ```

5. **Run database migrations**
   ```bash
   npm run db:push
   ```

   This creates all the necessary tables in your database.

6. **Initialize default users**
   ```bash
   npm run db:init
   ```

   This creates the default admin and demo staff accounts.

7. **Start the server**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

8. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`

#### Option B: Local PostgreSQL Setup

1. **Install PostgreSQL**
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt install postgresql`
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/)

2. **Create database**
   ```bash
   createdb maytech_onboarding
   ```

3. **Configure environment variables**

   Create `.env` file:
   ```env
   POSTGRES_PRISMA_URL="postgresql://username:password@localhost:5432/maytech_onboarding"
   POSTGRES_URL_NON_POOLING="postgresql://username:password@localhost:5432/maytech_onboarding"
   SESSION_SECRET="your-secure-random-secret-here"
   NODE_ENV="development"
   ```

4. **Follow steps 5-8 from Option A**

#### Migrating from JSON Files (Legacy)

If you have existing data in `data/users.json` and `data/progress.json`:

```bash
npm run db:migrate-json
```

This will transfer all users and progress data to the database.

## Default Credentials

### Admin Account
- **Email**: admin@maytech.com
- **Password**: admin123

### Demo Staff Account
- **Email**: staff@maytech.com
- **Password**: staff123

**Note**: Change these credentials in production!

## File Structure

```
maytech-akqa-onboarding/
├── server.js                 # Express server with authentication
├── package.json              # Dependencies and scripts
├── .gitignore               # Git ignore rules
├── .env                     # Environment variables (not in git)
├── .env.example            # Example environment configuration
├── README.md                # This file
├── prisma/                  # Prisma ORM configuration
│   └── schema.prisma       # Database schema
├── lib/                     # Shared libraries
│   └── prisma.js           # Prisma client instance
├── scripts/                 # Utility scripts
│   ├── init-db.js          # Initialize default users
│   └── migrate-json-to-db.js  # Migrate from JSON files
├── data/                    # Legacy JSON files (optional)
│   ├── users.json          # Legacy user accounts
│   └── progress.json       # Legacy progress tracking
└── public/                  # Static files served by Express
    ├── login.html          # Login page
    ├── onboarding.html     # Staff onboarding interface
    ├── admin.html          # Admin dashboard
    ├── onboarding.js       # Onboarding logic
    ├── admin.js            # Admin dashboard logic
    ├── styles.css          # Original styles
    └── onboarding-styles.css  # Onboarding-specific styles
```

## Usage

### For Staff Members

1. **Login**: Use your credentials provided by HR
2. **Read Each Section**: Carefully review the onboarding content
3. **Acknowledge**: Check the box and click "Acknowledge & Continue"
4. **Progress**: The system automatically saves your progress
5. **Resume**: You can logout and resume later from where you left off

### For Administrators

1. **Login**: Use admin credentials
2. **Dashboard**: View real-time statistics and progress overview
3. **Monitor Progress**: See which staff have completed onboarding
4. **Add Users**: Create new staff accounts from the dashboard
5. **Track Details**: View completion dates and percentages

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/session` - Check current session

### Progress (Staff)
- `GET /api/progress` - Get current user's progress
- `POST /api/progress` - Update section acknowledgment

### Admin
- `GET /api/admin/progress` - Get all staff progress
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user

## Database Management

### Available Scripts

- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Create and apply migrations (development)
- `npm run db:migrate:deploy` - Apply migrations (production)
- `npm run db:push` - Push schema changes to database (quick prototyping)
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:init` - Initialize database with default users
- `npm run db:migrate-json` - Migrate data from legacy JSON files

### Database Schema

**Users Table**
- `id` - Auto-incrementing primary key
- `email` - Unique email address
- `password` - Bcrypt hashed password
- `name` - User's full name
- `role` - 'admin' or 'staff'
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

**Progress Table**
- `id` - Auto-incrementing primary key
- `userId` - Foreign key to Users (unique, one-to-one)
- `currentSection` - Current section index (0-6)
- `completedSections` - Count of completed sections
- `sections` - JSON array of section completion data
- `lastUpdated` - Last progress update timestamp
- `createdAt` - Progress creation timestamp

**Sessions Table**
- `id` - Session identifier
- `sid` - Session ID (unique)
- `data` - Session data (JSON)
- `expiresAt` - Session expiration timestamp

### Backup and Restore

**Export data** (using Prisma Studio):
```bash
npm run db:studio
```

**Backup database** (PostgreSQL):
```bash
pg_dump -U username -d maytech_onboarding > backup.sql
```

**Restore database**:
```bash
psql -U username -d maytech_onboarding < backup.sql
```

## Security Considerations

- Passwords are hashed using bcrypt with salt rounds
- Session-based authentication with secure cookies
- PostgreSQL database with Prisma ORM for type-safe queries
- Environment variables for sensitive configuration
- Admin-only endpoints protected with role-based middleware
- Input validation on all forms
- SQL injection protection via Prisma parameterized queries
- HTTPS enforced in production (Vercel)

## Production Deployment

### Deploying to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Vercel Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Vercel will auto-detect the Express.js app

3. **Set up Vercel Postgres**
   - In your Vercel project, go to Storage tab
   - Create a new Postgres database
   - Vercel will automatically set environment variables

4. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add `SESSION_SECRET` with a strong random value
   - `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` are auto-set by Vercel

5. **Run Database Migrations**

   After deployment, use Vercel CLI to initialize the database:
   ```bash
   vercel env pull .env.local
   npm run db:push
   npm run db:init
   ```

   Or connect to your database directly via Vercel dashboard.

6. **Deploy**
   ```bash
   vercel --prod
   ```

### Production Checklist

1. ✅ **Change Default Credentials**: Update admin password after first login
2. ✅ **HTTPS Enabled**: Vercel provides automatic HTTPS
3. ✅ **Environment Variables**: All secrets in Vercel environment config
4. ✅ **Database**: PostgreSQL with automatic backups (Vercel Postgres)
5. ✅ **Monitoring**: Enable Vercel Analytics and logging
6. ✅ **Session Security**: Secure cookies enabled in production
7. 🔲 **Rate Limiting**: Consider adding API rate limiting
8. 🔲 **Email Notifications**: Set up email alerts for new users

## Customization

### Branding
Edit CSS variables in `public/onboarding-styles.css`:

```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #8b5cf6;
    --success-color: #10b981;
    /* ... customize colors */
}
```

### Content
Update section content in `public/onboarding.html`

### Number of Sections
Modify `totalSections` variable in `public/onboarding.js` and `public/admin.js`

## Troubleshooting

**Port already in use**
```bash
# Change port in server.js or set PORT environment variable
PORT=3001 npm start
```

**Database connection error**
- Verify `.env` file exists with correct database URLs
- Check database is running (local) or accessible (cloud)
- Ensure `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` are set
- Try running `npm run db:push` to sync schema

**Prisma Client not generated**
```bash
npm run db:generate
```

**Cannot access after login**
- Clear browser cookies
- Check browser console for errors
- Verify `SESSION_SECRET` is set in `.env`
- Check server logs for database errors

**Progress not saving**
- Check database connection
- Verify Progress table exists: `npm run db:studio`
- Check server logs for Prisma errors
- Ensure user has valid session

**Migration errors**
```bash
# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Then re-initialize
npm run db:push
npm run db:init
```

## Future Enhancements

- Email notifications for incomplete onboarding
- Certificate generation upon completion
- Quiz/assessment integration
- Multi-language support
- Mobile app version
- Integration with HR systems (BetterHR)
- Video content support
- PDF export of progress reports

## Credits

Created for the Maytech & AKQA partnership based on official onboarding materials.

## License

© 2025 Maytech & AKQA. All rights reserved.

## Support

For technical issues, please contact:
- **System Administrator**: system@maytech.com
- **HR Inquiries**: Maytech HR Manager
- **General Questions**: Director of Engineering and Technology
