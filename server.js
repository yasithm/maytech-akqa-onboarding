const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: 'maytech-akqa-onboarding-secret-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Data files
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const PROGRESS_FILE = path.join(__dirname, 'data', 'progress.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initialize data files if they don't exist
function initializeDataFiles() {
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
}

initializeDataFiles();

// Helper functions
function readUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readProgress() {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
}

function writeProgress(progress) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
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
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/onboarding', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'onboarding.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Maytech & AKQA Onboarding Server running on http://localhost:${PORT}`);
    console.log('\nDefault credentials:');
    console.log('Admin: admin@maytech.com / admin123');
    console.log('Staff: staff@maytech.com / staff123');
});
