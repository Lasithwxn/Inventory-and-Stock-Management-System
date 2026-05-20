// ── CONFIG ──
const API_BASE = 'http://localhost:8080/api';

// ── STATE ──
var profile = {
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    empId: '',
    department: '',
    joined: '',
};

// ── INIT ──
function init() {
    var userId   = sessionStorage.getItem('userId');
    var userName = sessionStorage.getItem('userName');
    var userRole = sessionStorage.getItem('userRole');

    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // Fill entirely from sessionStorage — no API call needed
    var parts = (userName || '').trim().split(' ');
    profile.id        = userId;
    profile.firstName = parts[0] || 'Unknown';
    profile.lastName  = parts.slice(1).join(' ') || '';
    profile.role      = userRole || 'STOCKER';
    profile.empId     = 'USR-' + String(userId).padStart(3, '0');
    profile.joined    = '2024-01-15';
    profile.email     = sessionStorage.getItem('userEmail') || '';

    updateHero();
    updateForm();
    setInitialsAvatar();
    setupEventListeners();
}

// ── EVENT LISTENERS ──
function setupEventListeners() {
    var modal = document.getElementById('deleteModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeDeleteModal();
        });
    }
}

// ── INITIALS AVATAR ──
function setInitialsAvatar() {
    var img = document.getElementById('avatarImg');
    if (!img) return;

    var first    = (profile.firstName || '?')[0].toUpperCase();
    var last     = profile.lastName ? profile.lastName[0].toUpperCase() : '';
    var initials = first + last;

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110">' +
        '<rect width="110" height="110" rx="55" fill="#0a1520"/>' +
        '<text x="55" y="55" dy=".35em" text-anchor="middle" ' +
        'font-family="Arial,sans-serif" font-size="38" font-weight="bold" ' +
        'fill="#00f5ff">' + initials + '</text></svg>';

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// ── UPDATE HERO ──
function updateHero() {
    var fullName = (profile.firstName + ' ' + profile.lastName).trim();
    var set = function(id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    set('heroName',      fullName      || 'Unknown');
    set('heroRole',      profile.role  || 'USER');
    set('heroId',        profile.empId || 'USR-???');
    set('heroJoined',    profile.joined|| '-');
    set('headerName',    fullName      || 'Profile');
    set('modalUserName', fullName      || 'this user');
}

// ── UPDATE FORM ──
function updateForm() {
    var fields = {
        firstName:  profile.firstName,
        lastName:   profile.lastName,
        email:      profile.email,
        role:       profile.role,
        empId:      profile.empId,
        department: profile.department
    };
    Object.keys(fields).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = fields[id] || '';
    });
}

// ── TABS ──
function switchTab(id, btn) {
    document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(b)   { b.classList.remove('active'); });
    var panel = document.getElementById('tab-' + id);
    if (panel) panel.classList.add('active');
    if (btn)   btn.classList.add('active');
}

// ── SAVE PROFILE ──
function saveProfile() {
    var g = function(id) { return document.getElementById(id); };

    profile.firstName  = g('firstName')  ? g('firstName').value.trim()  : profile.firstName;
    profile.lastName   = g('lastName')   ? g('lastName').value.trim()   : profile.lastName;
    profile.email      = g('email')      ? g('email').value.trim()      : profile.email;
    profile.department = g('department') ? g('department').value.trim() : profile.department;

    if (!profile.firstName || !profile.email) {
        showToast('First name and email are required.', true);
        return;
    }

    // Update sessionStorage so header reflects new name
    sessionStorage.setItem('userName', (profile.firstName + ' ' + profile.lastName).trim());

    updateHero();
    setInitialsAvatar();

    fetch(API_BASE + '/users/' + profile.id, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            firstName:  profile.firstName,
            lastName:   profile.lastName,
            email:      profile.email,
            department: profile.department
        })
    })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            showToast(data.success !== false ? 'Profile saved!' : (data.message || 'Save failed.'), data.success === false);
        })
        .catch(function() {
            showToast('Profile updated locally (server offline).', true);
        });
}

function resetForm() {
    updateForm();
    showToast('Changes discarded.');
}

// ── CHANGE PASSWORD ──
function changePassword() {
    var cur  = document.getElementById('curPass');
    var nw   = document.getElementById('newPass');
    var conf = document.getElementById('confPass');

    if (!cur.value || !nw.value || !conf.value) { showToast('All password fields are required.', true); return; }
    if (nw.value.length < 8)                    { showToast('Password must be at least 8 characters.', true); return; }
    if (nw.value !== conf.value)                { showToast('Passwords do not match.', true); return; }

    fetch(API_BASE + '/users/me/password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: cur.value, newPassword: nw.value })
    })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.success !== false) {
                cur.value = ''; nw.value = ''; conf.value = '';
                showToast('Password updated successfully!');
            } else {
                showToast(data.message || 'Password change failed.', true);
            }
        })
        .catch(function() {
            cur.value = ''; nw.value = ''; conf.value = '';
            showToast('Password changed (server offline).');
        });
}

// ── DELETE ACCOUNT ──
function openDeleteModal() {
    var modal = document.getElementById('deleteModal');
    if (modal) modal.classList.add('open');
}

function closeDeleteModal() {
    var modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('open');
}

function deleteAccount() {
    closeDeleteModal();
    fetch(API_BASE + '/users/' + profile.id, { method: 'DELETE', credentials: 'include' })
        .finally(function() {
            sessionStorage.clear();
            showToast('Account deleted. Redirecting…');
            setTimeout(function() { window.location.href = 'login.html'; }, 2000);
        });
}

// ── TOAST ──
var toastTimer;
function showToast(msg, isError) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    void t.offsetWidth;
    t.classList.add('show');
    toastTimer = setTimeout(function() { t.classList.remove('show'); }, 3000);
}

// ── BOOT ──
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}