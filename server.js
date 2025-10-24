const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const prisma = require('./lib/prisma');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'maytech-akqa-onboarding-secret-2025-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
}));

// Database is now managed by Prisma
// Run `npm run db:init` to create default users
// Run `npm run db:migrate` to migrate data from JSON files

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
}

function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ error: 'Admin access required' });
}

// Routes

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create session
        req.session.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        };

        res.json({
            success: true,
            user: req.session.user
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Check session
app.get('/api/session', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Get user progress
app.get('/api/progress', isAuthenticated, async (req, res) => {
    try {
        let userProgress = await prisma.progress.findUnique({
            where: { userId: req.session.user.id },
            include: { user: true }
        });

        if (!userProgress) {
            // Create new progress record
            userProgress = await prisma.progress.create({
                data: {
                    userId: req.session.user.id,
                    sections: [],
                    currentSection: 0,
                    completedSections: 0
                },
                include: { user: true }
            });
        }

        // Format response to match old structure
        res.json({
            userId: userProgress.userId,
            userName: userProgress.user.name,
            sections: userProgress.sections,
            currentSection: userProgress.currentSection,
            completedSections: userProgress.completedSections,
            lastUpdated: userProgress.lastUpdated.toISOString()
        });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update progress
app.post('/api/progress', isAuthenticated, async (req, res) => {
    try {
        const { sectionId, acknowledged } = req.body;

        // Get or create progress record
        let userProgress = await prisma.progress.findUnique({
            where: { userId: req.session.user.id },
            include: { user: true }
        });

        if (!userProgress) {
            userProgress = await prisma.progress.create({
                data: {
                    userId: req.session.user.id,
                    sections: [],
                    currentSection: 0,
                    completedSections: 0
                },
                include: { user: true }
            });
        }

        // Update section data
        let sections = Array.isArray(userProgress.sections) ? userProgress.sections : [];
        const sectionIndex = sections.findIndex(s => s.id === sectionId);

        if (sectionIndex >= 0) {
            sections[sectionIndex].acknowledged = acknowledged;
            sections[sectionIndex].completedAt = new Date().toISOString();
        } else {
            sections.push({
                id: sectionId,
                acknowledged: acknowledged,
                completedAt: new Date().toISOString()
            });
        }

        // Calculate counters
        const completedSections = sections.filter(s => s.acknowledged).length;
        const currentSection = Math.min(completedSections, 6); // 7 sections total (0-6)

        // Update progress in database
        userProgress = await prisma.progress.update({
            where: { userId: req.session.user.id },
            data: {
                sections: sections,
                currentSection: currentSection,
                completedSections: completedSections
            },
            include: { user: true }
        });

        // Format response to match old structure
        res.json({
            userId: userProgress.userId,
            userName: userProgress.user.name,
            sections: userProgress.sections,
            currentSection: userProgress.currentSection,
            completedSections: userProgress.completedSections,
            lastUpdated: userProgress.lastUpdated.toISOString()
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Get all progress
app.get('/api/admin/progress', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const allProgress = await prisma.progress.findMany({
            include: { user: true },
            orderBy: { lastUpdated: 'desc' }
        });

        // Format response to match old structure
        const enrichedProgress = allProgress.map(p => ({
            userId: p.userId,
            userName: p.user.name,
            userEmail: p.user.email,
            sections: p.sections,
            currentSection: p.currentSection,
            completedSections: p.completedSections,
            lastUpdated: p.lastUpdated.toISOString()
        }));

        res.json(enrichedProgress);
    } catch (error) {
        console.error('Get all progress error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Create new user
app.post('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user already exists
        const existing = await prisma.user.findUnique({
            where: { email }
        });

        if (existing) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                email,
                password: bcrypt.hashSync(password, 10),
                name,
                role: 'staff'
            }
        });

        res.json({
            success: true,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Get all users
app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/onboarding', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'onboarding.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Export for Vercel serverless
module.exports = app;

// Start server only when running locally (not on Vercel)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Maytech & AKQA Onboarding Server running on http://localhost:${PORT}`);
        console.log('\nDefault credentials:');
        console.log('Admin: admin@maytech.com / admin123');
        console.log('Staff: staff@maytech.com / staff123');
    });
}
