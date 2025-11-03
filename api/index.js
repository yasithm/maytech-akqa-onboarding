const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Determine root directory - works for both local and Vercel
// In Vercel serverless, __dirname is api/, so we go up one level
// In local development, __dirname is the project root (when running from api/)
const ROOT_DIR = __dirname.includes('/api') ? path.join(__dirname, '..') : __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// For Vercel serverless, use /tmp (writable), otherwise use data/ directory
const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_URL;
const DATA_DIR = IS_VERCEL ? '/tmp/data' : path.join(ROOT_DIR, 'data');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

// Session configuration with environment variables
const SESSION_SECRET = process.env.SESSION_SECRET || 'maytech-akqa-onboarding-secret-2025';
const isProduction = process.env.NODE_ENV === 'production';
const isHTTPS = process.env.VERCEL_URL ? true : false; // Vercel provides HTTPS

// Use memory store for sessions in Vercel (serverless functions are stateless)
const MemoryStore = require('express-session').MemoryStore;
app.use(session({
    store: IS_VERCEL ? new MemoryStore() : undefined, // Use memory store in Vercel
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isHTTPS || isProduction, // Secure cookies in production/HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
}));

// Data files
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');

// Initialize data files - gracefully handle errors for serverless environments
function initializeDataFiles() {
    try {
        // Try to create data directory (will fail silently in read-only filesystems)
        if (!fs.existsSync(DATA_DIR)) {
            try {
                fs.mkdirSync(DATA_DIR, { recursive: true });
            } catch (err) {
                // Ignore errors - might be read-only filesystem
                console.warn('Could not create data directory:', err.message);
            }
        }

        // Only initialize files if directory is writable
        try {
            if (!fs.existsSync(USERS_FILE)) {
                const defaultUsers = [
                    {
                        id: 1,
                        email: 'admin@maytech.com',
                        password: bcrypt.hashSync('admin123', 10),
                        name: 'Admin User',
                        role: 'admin'
                    },
                    {
                        id: 2,
                        email: 'staff@maytech.com',
                        password: bcrypt.hashSync('staff123', 10),
                        name: 'Demo Staff',
                        role: 'staff'
                    }
                ];
                fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
            }

            if (!fs.existsSync(PROGRESS_FILE)) {
                fs.writeFileSync(PROGRESS_FILE, JSON.stringify([], null, 2));
            }
        } catch (err) {
            console.warn('Could not initialize data files:', err.message);
        }
    } catch (err) {
        // Don't fail the entire deployment if data initialization fails
        console.warn('Data initialization warning:', err.message);
    }
}

// Initialize data files (non-blocking)
initializeDataFiles();

// Helper functions - with error handling for serverless environments
function readUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        }
    } catch (err) {
        console.warn('Error reading users file:', err.message);
    }
    
    // Return default users if file doesn't exist or can't be read
    // Using pre-hashed passwords to ensure consistency (from existing users.json)
    return [
        {
            id: 1,
            email: 'admin@maytech.com',
            password: '$2a$10$yVDaObtbmZHJLce8vvrG8O58M9mhrDtreFmDF59rC11YeiJ3b1ImC', // admin123
            name: 'Admin User',
            role: 'admin'
        },
        {
            id: 2,
            email: 'staff@maytech.com',
            password: '$2a$10$K5vube2Zjdh4Z6xb0G4VYeXe.oFnClgH3mtgk1Akz1aY8GdRuThI.', // staff123
            name: 'Demo Staff',
            role: 'staff'
        }
    ];
}

function writeUsers(users) {
    try {
        // Ensure directory exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (err) {
        console.warn('Error writing users file:', err.message);
        // In serverless, this will fail silently - consider using a database
    }
}

function readProgress() {
    try {
        if (fs.existsSync(PROGRESS_FILE)) {
            return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        }
    } catch (err) {
        console.warn('Error reading progress file:', err.message);
    }
    return [];
}

function writeProgress(progress) {
    try {
        // Ensure directory exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    } catch (err) {
        console.warn('Error writing progress file:', err.message);
        // In serverless, this will fail silently - consider using a database
    }
}

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
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

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
app.get('/api/progress', isAuthenticated, (req, res) => {
    const allProgress = readProgress();
    const userProgress = allProgress.find(p => p.userId === req.session.user.id);

    if (!userProgress) {
        const newProgress = {
            userId: req.session.user.id,
            userName: req.session.user.name,
            sections: [],
            currentSection: 0,
            completedSections: 0,
            lastUpdated: new Date().toISOString()
        };
        allProgress.push(newProgress);
        writeProgress(allProgress);
        return res.json(newProgress);
    }

    res.json(userProgress);
});

// Update progress
app.post('/api/progress', isAuthenticated, (req, res) => {
    const { sectionId, acknowledged } = req.body;
    const allProgress = readProgress();
    let userProgress = allProgress.find(p => p.userId === req.session.user.id);

    if (!userProgress) {
        userProgress = {
            userId: req.session.user.id,
            userName: req.session.user.name,
            sections: [],
            currentSection: 0,
            completedSections: 0,
            lastUpdated: new Date().toISOString()
        };
        allProgress.push(userProgress);
    }

    // Update section
    const sectionIndex = userProgress.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex >= 0) {
        userProgress.sections[sectionIndex].acknowledged = acknowledged;
        userProgress.sections[sectionIndex].completedAt = new Date().toISOString();
    } else {
        userProgress.sections.push({
            id: sectionId,
            acknowledged: acknowledged,
            completedAt: new Date().toISOString()
        });
    }

    // Update counters
    userProgress.completedSections = userProgress.sections.filter(s => s.acknowledged).length;
    userProgress.currentSection = Math.min(userProgress.completedSections, 6); // 7 sections total (0-6)
    userProgress.lastUpdated = new Date().toISOString();

    // Save
    const progressIndex = allProgress.findIndex(p => p.userId === req.session.user.id);
    if (progressIndex >= 0) {
        allProgress[progressIndex] = userProgress;
    }
    writeProgress(allProgress);

    res.json(userProgress);
});

// Admin: Get all progress
app.get('/api/admin/progress', isAuthenticated, isAdmin, (req, res) => {
    const allProgress = readProgress();
    const users = readUsers();

    // Enrich progress data with user info
    const enrichedProgress = allProgress.map(p => {
        const user = users.find(u => u.id === p.userId);
        return {
            ...p,
            userName: user ? user.name : 'Unknown',
            userEmail: user ? user.email : 'Unknown'
        };
    });

    res.json(enrichedProgress);
});

// Admin: Create new user
app.post('/api/admin/users', isAuthenticated, isAdmin, (req, res) => {
    const { email, password, name } = req.body;
    const users = readUsers();

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        email,
        password: bcrypt.hashSync(password, 10),
        name,
        role: 'staff'
    };

    users.push(newUser);
    writeUsers(users);

    res.json({ success: true, user: { id: newUser.id, email: newUser.email, name: newUser.name } });
});

// Admin: Get all users
app.get('/api/admin/users', isAuthenticated, isAdmin, (req, res) => {
    const users = readUsers();
    const safeUsers = users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role
    }));
    res.json(safeUsers);
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
});

app.get('/onboarding', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'onboarding.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
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
