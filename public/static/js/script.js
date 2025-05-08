// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyByNq0mkVqbYoNdcuVemqSwr6Jaa7dwIiw",
  authDomain: "patanisho-879e5.firebaseapp.com",
  projectId: "patanisho-879e5",
  storageBucket: "patanisho-879e5.appspot.com",
  messagingSenderId: "67705354855",
  appId: "1:67705354855:web:1f498c20be9a557cb332c2",
  measurementId: "G-38B31667DJ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Login with Firebase Auth only
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Show dashboard
        document.getElementById('login').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';

        // Load user-specific data
        loadDashboardData(user.uid);
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
});

// Logout using Firebase Auth
function logout() {
    auth.signOut().then(() => {
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('login').style.display = 'flex';
        document.getElementById('loginForm').reset();
    });
}

// Load dashboard from Firestore
async function loadDashboardData(uid) {
    document.getElementById('loading').style.display = 'block';
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (!doc.exists) throw new Error("User data not found");
        const data = doc.data();

        updateOverview(data.stats);
        updateMealPreferences(data.meal_preferences?.weekly || {});
        updateMeals(data.meals);
        updateAlerts(data.alerts);
    } catch (err) {
        alert("Error loading dashboard: " + err.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Switch tabs (meal preferences)
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', async function() {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const period = this.textContent.toLowerCase();
        try {
            const doc = await db.collection('users').doc(auth.currentUser.uid).get();
            const prefs = doc.data().meal_preferences?.[period] || {};
            updateMealPreferences(prefs);
        } catch (err) {
            alert("Failed to fetch preferences: " + err.message);
        }
    });
});

// Reuse existing update functions:
function updateOverview(stats) {
    const overview = document.querySelector('.overview');
    overview.innerHTML = `
        <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-user"></i></div><div><div class="stat-value">${stats.total_residents}</div><div class="stat-label">Total Residents</div></div></div>
        <div class="stat-card"><div class="stat-icon green"><i class="fas fa-utensils"></i></div><div><div class="stat-value">${stats.meals_today}</div><div class="stat-label">Meals Today</div></div></div>
        <div class="stat-card"><div class="stat-icon red"><i class="fas fa-exclamation-circle"></i></div><div><div class="stat-value">${stats.alerts}</div><div class="stat-label">Alerts</div></div></div>
        <div class="stat-card"><div class="stat-icon amber"><i class="fas fa-boxes"></i></div><div><div class="stat-value">${stats.low_stock_items}</div><div class="stat-label">Low Stock Items</div></div></div>
    `;
}

function updateMealPreferences(preferences) {
    const container = document.getElementById('meal-preferences');
    container.innerHTML = Object.entries(preferences).map(([key, value]) => `
        <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                <span>${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span>${value}%</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar blue" style="width:${value}%;"></div>
            </div>
        </div>
    `).join('');
}

function updateMeals(meals) {
    const container = document.getElementById('todays-meals');
    container.innerHTML = Object.entries(meals).map(([key, meal]) => `
        <div class="meal">
            <div class="meal-header">
                <h4>${meal.name}</h4>
                <div class="meal-time">${meal.time}</div>
            </div>
            <ul>${meal.items.map(item => `<li>${item}</li>`).join('')}</ul>
            <div class="meal-stats">
                <div class="meal-stat"><i class="fas fa-fire-alt"></i> ${meal.stats.calories} kcal</div>
                <div class="meal-stat"><i class="fas fa-drumstick-bite"></i> ${meal.stats.protein}g protein</div>
                <div class="meal-stat"><i class="fas fa-users"></i> ${meal.stats.residents} residents</div>
            </div>
        </div>
    `).join('');
}

function updateAlerts(alerts) {
    const container = document.getElementById('alerts-list');
    container.innerHTML = alerts.map(alert => `
        <li class="alert-item">
            <div class="alert-icon ${alert.type}">
                <i class="fas fa-${alert.type === 'red' ? 'exclamation-circle' : alert.type === 'amber' ? 'exclamation-triangle' : 'info-circle'}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-desc">${alert.description}</div>
                <div class="alert-time">${alert.time}</div>
            </div>
        </li>
    `).join('');
}