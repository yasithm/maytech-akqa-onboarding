// State management
let currentUser = null;
let currentSection = 0;
let userProgress = null;
const totalSections = 7; // 0-6

// DOM Elements
const sections = document.querySelectorAll('.content-section');
const progressFill = document.getElementById('progress-fill');
const progressPercentage = document.getElementById('progress-percentage');
const acknowledgeCheckbox = document.getElementById('acknowledge-checkbox');
const acknowledgeBtn = document.getElementById('acknowledge-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const logoutBtn = document.getElementById('logout-btn');
const userNameSpan = document.getElementById('user-name');
const progressSteps = document.querySelectorAll('.step');

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
        currentUser = sessionData.user;
        userNameSpan.textContent = `Welcome, ${currentUser.name}`;

        // Redirect admin to admin panel
        if (currentUser.role === 'admin') {
            window.location.href = '/admin';
            return;
        }

        // Load progress
        await loadProgress();

        // Setup event listeners
        setupEventListeners();

        // Show initial section
        showSection(currentSection);
    } catch (error) {
        console.error('Initialization error:', error);
        window.location.href = '/';
    }
}

// Load user progress
async function loadProgress() {
    try {
        const response = await fetch('/api/progress');
        if (response.ok) {
            userProgress = await response.json();
            currentSection = userProgress.currentSection || 0;
            updateProgressBar();
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

// Save progress
async function saveProgress(sectionId, acknowledged) {
    try {
        const response = await fetch('/api/progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sectionId: sectionId,
                acknowledged: acknowledged
            })
        });

        if (response.ok) {
            userProgress = await response.json();
            updateProgressBar();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error saving progress:', error);
        return false;
    }
}

// Show section
function showSection(sectionIndex) {
    // Hide all sections
    sections.forEach(section => section.classList.remove('active'));

    // Show current section
    const currentSectionElement = document.getElementById(`section-${sectionIndex}`);
    if (currentSectionElement) {
        currentSectionElement.classList.add('active');
    }

    // Update current section
    currentSection = sectionIndex;

    // Check if section is already acknowledged
    const isAcknowledged = isSectionAcknowledged(sectionIndex);

    // Update UI
    updateNavigationButtons();
    updateAcknowledgmentArea(isAcknowledged);
    updateProgressSteps();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Check if section is acknowledged
function isSectionAcknowledged(sectionIndex) {
    if (!userProgress || !userProgress.sections) return false;
    const section = userProgress.sections.find(s => s.id === sectionIndex);
    return section && section.acknowledged;
}

// Update acknowledgment area
function updateAcknowledgmentArea(isAcknowledged) {
    if (currentSection === totalSections - 1) {
        // Completion section - no acknowledgment needed
        return;
    }

    if (isAcknowledged) {
        acknowledgeCheckbox.checked = true;
        acknowledgeBtn.disabled = false;
        acknowledgeBtn.textContent = 'Already Acknowledged ✓';
    } else {
        acknowledgeCheckbox.checked = false;
        acknowledgeBtn.disabled = true;
        acknowledgeBtn.textContent = 'Acknowledge & Continue';
    }
}

// Update navigation buttons
function updateNavigationButtons() {
    // Previous button
    prevBtn.disabled = currentSection === 0;

    // Next button
    const canProgress = isSectionAcknowledged(currentSection) || currentSection === totalSections - 1;
    const hasNext = currentSection < totalSections - 1;
    nextBtn.disabled = !canProgress || !hasNext;
}

// Update progress bar
function updateProgressBar() {
    const completedCount = userProgress ? userProgress.completedSections : 0;
    const percentage = Math.round((completedCount / (totalSections - 1)) * 100);

    progressFill.style.width = `${percentage}%`;
    progressPercentage.textContent = `${percentage}%`;
}

// Update progress steps
function updateProgressSteps() {
    progressSteps.forEach((step, index) => {
        step.classList.remove('active', 'completed');

        if (index < currentSection) {
            step.classList.add('completed');
        } else if (index === currentSection) {
            step.classList.add('active');
        }

        // Add click handler for completed sections
        if (index < currentSection) {
            step.style.cursor = 'pointer';
            step.onclick = () => showSection(index);
        } else if (index === currentSection) {
            step.style.cursor = 'default';
            step.onclick = null;
        } else {
            step.style.cursor = 'not-allowed';
            step.onclick = null;
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Acknowledgment checkbox
    acknowledgeCheckbox.addEventListener('change', (e) => {
        acknowledgeBtn.disabled = !e.target.checked;
    });

    // Acknowledge button
    acknowledgeBtn.addEventListener('click', async () => {
        if (!acknowledgeCheckbox.checked) return;

        acknowledgeBtn.disabled = true;
        acknowledgeBtn.innerHTML = '<span class="loading"></span>Saving...';

        const success = await saveProgress(currentSection, true);

        if (success) {
            acknowledgeBtn.textContent = 'Acknowledged ✓';

            // Auto-advance to next section after a short delay
            setTimeout(() => {
                if (currentSection < totalSections - 1) {
                    showSection(currentSection + 1);
                }
            }, 800);
        } else {
            acknowledgeBtn.textContent = 'Error - Try Again';
            acknowledgeBtn.disabled = false;
        }
    });

    // Previous button
    prevBtn.addEventListener('click', () => {
        if (currentSection > 0) {
            showSection(currentSection - 1);
        }
    });

    // Next button
    nextBtn.addEventListener('click', () => {
        if (currentSection < totalSections - 1 && isSectionAcknowledged(currentSection)) {
            showSection(currentSection + 1);
        }
    });

    // Logout button
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/';
        }
    });

    // Completion button
    const completedBtn = document.querySelector('.completed-btn');
    if (completedBtn) {
        completedBtn.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
}

// Add loading spinner style
const style = document.createElement('style');
style.textContent = `
    .loading {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 0.8s linear infinite;
        margin-right: 0.5rem;
        vertical-align: middle;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Start the app
init();
