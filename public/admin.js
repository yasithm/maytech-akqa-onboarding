// State
let allProgress = [];
let allUsers = [];
const totalSections = 7;

// DOM Elements
const logoutBtn = document.getElementById('logout-btn');
const refreshBtn = document.getElementById('refresh-btn');
const addUserBtn = document.getElementById('add-user-btn');
const addUserModal = document.getElementById('add-user-modal');
const addUserForm = document.getElementById('add-user-form');
const cancelBtn = document.getElementById('cancel-btn');
const tableContent = document.getElementById('table-content');

// Stats elements
const totalStaffEl = document.getElementById('total-staff');
const completedCountEl = document.getElementById('completed-count');
const inProgressCountEl = document.getElementById('in-progress-count');
const notStartedCountEl = document.getElementById('not-started-count');

// Initialize
async function init() {
    try {
        // Check session
        const sessionResponse = await fetch('/api/session');
        if (!sessionResponse.ok) {
            window.location.href = '/';
            return;
        }

        const sessionData = await sessionResponse.json();
        const currentUser = sessionData.user;

        // Check if admin
        if (currentUser.role !== 'admin') {
            window.location.href = '/onboarding';
            return;
        }

        // Load data
        await loadData();

        // Setup event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Initialization error:', error);
        window.location.href = '/';
    }
}

// Load all data
async function loadData() {
    try {
        // Show loading state
        tableContent.innerHTML = '<div class="empty-state"><h3>Loading...</h3></div>';

        // Fetch users and progress
        const [usersResponse, progressResponse] = await Promise.all([
            fetch('/api/admin/users'),
            fetch('/api/admin/progress')
        ]);

        if (usersResponse.ok) {
            allUsers = await usersResponse.json();
        }

        if (progressResponse.ok) {
            allProgress = await progressResponse.json();
        }

        // Render dashboard
        renderStats();
        renderTable();
    } catch (error) {
        console.error('Error loading data:', error);
        tableContent.innerHTML = '<div class="empty-state"><h3>Error loading data</h3><p>Please try refreshing the page.</p></div>';
    }
}

// Render statistics
function renderStats() {
    const staffUsers = allUsers.filter(u => u.role === 'staff');
    const totalStaff = staffUsers.length;

    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    staffUsers.forEach(user => {
        const userProgress = allProgress.find(p => p.userId === user.id);

        if (!userProgress || userProgress.completedSections === 0) {
            notStarted++;
        } else if (userProgress.completedSections >= totalSections - 1) {
            completed++;
        } else {
            inProgress++;
        }
    });

    totalStaffEl.textContent = totalStaff;
    completedCountEl.textContent = completed;
    inProgressCountEl.textContent = inProgress;
    notStartedCountEl.textContent = notStarted;
}

// Render progress table
function renderTable() {
    const staffUsers = allUsers.filter(u => u.role === 'staff');

    if (staffUsers.length === 0) {
        tableContent.innerHTML = `
            <div class="empty-state">
                <h3>No Staff Members</h3>
                <p>Add users to start tracking their onboarding progress.</p>
            </div>
        `;
        return;
    }

    let tableHTML = `
        <table class="progress-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                </tr>
            </thead>
            <tbody>
    `;

    staffUsers.forEach(user => {
        const userProgress = allProgress.find(p => p.userId === user.id);
        const completedSections = userProgress ? userProgress.completedSections : 0;
        const percentage = Math.round((completedSections / (totalSections - 1)) * 100);
        const lastUpdated = userProgress && userProgress.lastUpdated
            ? new Date(userProgress.lastUpdated).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'Not started';

        let statusClass = 'status-not-started';
        let statusText = 'Not Started';

        if (completedSections === 0) {
            statusClass = 'status-not-started';
            statusText = 'Not Started';
        } else if (completedSections >= totalSections - 1) {
            statusClass = 'status-completed';
            statusText = 'Completed';
        } else {
            statusClass = 'status-in-progress';
            statusText = 'In Progress';
        }

        tableHTML += `
            <tr>
                <td><strong>${user.name}</strong></td>
                <td>${user.email}</td>
                <td class="progress-bar-cell">
                    <div class="mini-progress-bar">
                        <div class="mini-progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <small>${completedSections} / ${totalSections - 1} sections (${percentage}%)</small>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>${lastUpdated}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    tableContent.innerHTML = tableHTML;
}

// Setup event listeners
function setupEventListeners() {
    // Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/';
        }
    });

    // Refresh
    refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<span class="loading"></span>Refreshing...';
        await loadData();
        refreshBtn.disabled = false;
        refreshBtn.textContent = '↻ Refresh Data';
    });

    // Add user
    addUserBtn.addEventListener('click', () => {
        addUserModal.classList.add('active');
    });

    // Cancel
    cancelBtn.addEventListener('click', () => {
        addUserModal.classList.remove('active');
        addUserForm.reset();
    });

    // Close modal on outside click
    addUserModal.addEventListener('click', (e) => {
        if (e.target === addUserModal) {
            addUserModal.classList.remove('active');
            addUserForm.reset();
        }
    });

    // Add user form submit
    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('user-name').value;
        const email = document.getElementById('user-email').value;
        const password = document.getElementById('user-password').value;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span>Creating...';

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, name })
            });

            const data = await response.json();

            if (response.ok) {
                // Success
                addUserModal.classList.remove('active');
                addUserForm.reset();
                await loadData();
                alert(`User ${name} created successfully!`);
            } else {
                alert(data.error || 'Error creating user');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Error creating user. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create User';
        }
    });
}

// Start the app
init();
