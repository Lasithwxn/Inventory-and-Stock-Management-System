// ============================================
//  STOCKR — login.js
//  Location: src/main/resources/static/JS/
// ============================================

// ── CURSOR ──
const cursor = document.getElementById('cursor');
const trail  = document.getElementById('cursor-trail');
let mx = 0, my = 0;
document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
    setTimeout(() => { trail.style.left = mx + 'px'; trail.style.top = my + 'px'; }, 90);
});
document.querySelectorAll('a,button,input,.check-box').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.style.width = '24px'; cursor.style.height = '24px'; cursor.style.opacity = '.5'; });
    el.addEventListener('mouseleave', () => { cursor.style.width = '14px'; cursor.style.height = '14px'; cursor.style.opacity = '1'; });
});

// ── TABS ──
function switchTab(tab) {
    document.getElementById('panel-login').classList.toggle('active', tab === 'login');
    document.getElementById('panel-register').classList.toggle('active', tab === 'register');
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active', tab === 'register');
    clearAllErrors();
}

// ── TOGGLE PASSWORD VISIBILITY ──
function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.style.opacity = isText ? '0.4' : '0.9';
}

// ── CHECKBOX ──
function toggleCheck(cbId, boxId) {
    const cb  = document.getElementById(cbId);
    const box = document.getElementById(boxId);
    cb.checked = !cb.checked;
    box.classList.toggle('checked', cb.checked);
}

// ── SHOW / HIDE error messages ──
function showErr(id, show) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('show', show);
}
function setFieldState(inputId, state) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.classList.remove('error', 'valid');
    if (state) el.classList.add(state);
}
function clearAllErrors() {
    document.querySelectorAll('.field-msg').forEach(e => e.classList.remove('show'));
    document.querySelectorAll('input').forEach(e => e.classList.remove('error', 'valid'));
}

// ── VALIDATORS ──
function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
function isStrongPassword(v) {
    return v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<<>\/?]/.test(v);
}
function sanitise(str) { return str.replace(/[<>"'&]/g, ''); }

// ── PASSWORD STRENGTH ──
function checkStrength(val) {
    const wrap  = document.getElementById('strength-wrap');
    const fill  = document.getElementById('strength-fill');
    const label = document.getElementById('strength-label');
    wrap.classList.toggle('show', val.length > 0);

    let score = 0;
    if (val.length >= 8)   score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<<>\/?]/.test(val)) score++;

    const map = [
        { w: '0%',   c: 'transparent', t: '—' },
        { w: '25%',  c: '#ff2d78',     t: 'WEAK' },
        { w: '50%',  c: '#ff8c00',     t: 'FAIR' },
        { w: '75%',  c: '#d4ff00',     t: 'GOOD' },
        { w: '100%', c: '#00ffe0',     t: 'STRONG' },
    ];
    fill.style.width      = map[score].w;
    fill.style.background = map[score].c;
    label.style.color     = map[score].c;
    label.textContent     = map[score].t;

    document.getElementById('req-len').classList.toggle('met',     val.length >= 8);
    document.getElementById('req-upper').classList.toggle('met',   /[A-Z]/.test(val));
    document.getElementById('req-num').classList.toggle('met',     /[0-9]/.test(val));
    document.getElementById('req-special').classList.toggle('met', /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<<>\/?]/.test(val));
}

function showReqs(show) {
    const el = document.getElementById('req-list');
    const pw = document.getElementById('reg-password').value;
    el.classList.toggle('show', show && pw.length > 0);
}

// ── RATE LIMITING ──
let loginAttempts = 0;
let lockoutUntil  = 0;

function isLockedOut() { return Date.now() < lockoutUntil; }

function startLockout(seconds) {
    lockoutUntil = Date.now() + seconds * 1000;
    const msg   = document.getElementById('lockout-msg');
    const timer = document.getElementById('lockout-timer');
    msg.style.display = 'block';
    document.getElementById('login-btn').disabled = true;
    const iv = setInterval(() => {
        const rem = Math.ceil((lockoutUntil - Date.now()) / 1000);
        if (rem <= 0) {
            clearInterval(iv);
            msg.style.display = 'none';
            document.getElementById('login-btn').disabled = false;
            loginAttempts = 0;
        } else {
            timer.textContent = rem;
        }
    }, 500);
}

// ── LOGIN HANDLER ──
function handleLogin() {
    if (isLockedOut()) return;

    const emailEl = document.getElementById('login-email');
    const pwEl    = document.getElementById('login-password');
    const email   = sanitise(emailEl.value.trim());
    const pw      = pwEl.value;
    let valid     = true;

    if (!isValidEmail(email)) {
        showErr('login-email-err', true); setFieldState('login-email', 'error'); valid = false;
    } else {
        showErr('login-email-err', false); setFieldState('login-email', 'valid');
    }

    if (pw.length === 0) {
        showErr('login-pw-err', true); setFieldState('login-password', 'error'); valid = false;
    } else {
        showErr('login-pw-err', false); setFieldState('login-password', 'valid');
    }

    if (!valid) return;

    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.classList.add('loading');
    btn.textContent = 'Authenticating...';

    // ── Call Spring Boot API ──
    fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password: pw })
    })
        .then(res => {
            if (!res.ok) throw new Error('Server error');
            return res.json();
        })
        .then(data => {
            btn.classList.remove('loading');

            if (data.success) {
                loginAttempts = 0;
                btn.textContent = 'Sign In';

                // ✅ FIX: Force uppercase + store userId
                const role = (data.role || '').toUpperCase();
                sessionStorage.setItem('userRole', role);
                sessionStorage.setItem('userName', data.name || 'User');
                sessionStorage.setItem('userId', data.id || '1');

                document.getElementById('login-form-wrap').style.display = 'none';
                document.getElementById('success-screen').classList.add('show');
                showToast('Login successful — welcome back!', 'success');

                // ✅ FIX: Correct role-based redirects
                setTimeout(() => {
                    if (role === 'ADMIN')        window.location.href = '../HTML/adminDashboard.html';
                    else if (role === 'MANAGER') window.location.href = '../HTML/managerDashboard.html';
                    else                         window.location.href = '../HTML/stockerDashboard.html';
                }, 1500);

            } else {
                btn.disabled = false;
                btn.textContent = 'Sign In';
                loginAttempts++;
                if (loginAttempts >= 5) startLockout(30);
                else showToast(data.message || `Invalid credentials. ${5 - loginAttempts} attempts left.`, 'fail');
            }
        })
        .catch(() => {
            btn.classList.remove('loading');
            btn.disabled = false;
            btn.textContent = 'Sign In';

            // ── DEMO MODE fallback ──
            const demoUsers = {
                'admin@stockr.com':   { password: 'Admin@1234',   role: 'ADMIN',   name: 'Admin',   id: '1' },
                'lahiru@stockr.com':  { password: 'Manager@1234', role: 'MANAGER', name: 'Lahiru',  id: '2' },
                'hasitha@stockr.com': { password: 'Stocker@1234', role: 'STOCKER', name: 'Hasitha', id: '3' },
            };

            const match = demoUsers[email];
            if (match && match.password === pw) {
                const role = match.role.toUpperCase();
                sessionStorage.setItem('userRole', role);
                sessionStorage.setItem('userName', match.name);
                sessionStorage.setItem('userId', match.id);
                document.getElementById('login-form-wrap').style.display = 'none';
                document.getElementById('success-screen').classList.add('show');
                showToast('[DEMO] Login successful!', 'success');
                setTimeout(() => {
                    if (role === 'ADMIN')        window.location.href = '../HTML/adminDashboard.html';
                    else if (role === 'MANAGER') window.location.href = '../HTML/managerDashboard.html';
                    else                         window.location.href = '../HTML/stockerDashboard.html';
                }, 1500);
            } else {
                loginAttempts++;
                if (loginAttempts >= 5) startLockout(30);
                else showToast(`Invalid credentials. ${5 - loginAttempts} attempts left.`, 'fail');
            }
        });
}

// ── REGISTER HANDLER ──
function handleRegister() {
    const name    = sanitise(document.getElementById('reg-name').value.trim());
    const email   = sanitise(document.getElementById('reg-email').value.trim());
    const pw      = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const terms   = document.getElementById('terms').checked;
    let valid     = true;

    if (name.length < 2) {
        showErr('reg-name-err', true); setFieldState('reg-name', 'error'); valid = false;
    } else { showErr('reg-name-err', false); setFieldState('reg-name', 'valid'); }

    if (!isValidEmail(email)) {
        showErr('reg-email-err', true); setFieldState('reg-email', 'error'); valid = false;
    } else { showErr('reg-email-err', false); setFieldState('reg-email', 'valid'); }

    if (!isStrongPassword(pw)) {
        showErr('reg-pw-err', true); setFieldState('reg-password', 'error'); valid = false;
        document.getElementById('req-list').classList.add('show');
    } else { showErr('reg-pw-err', false); setFieldState('reg-password', 'valid'); }

    if (pw !== confirm || confirm.length === 0) {
        showErr('reg-confirm-err', true); setFieldState('reg-confirm', 'error'); valid = false;
    } else { showErr('reg-confirm-err', false); setFieldState('reg-confirm', 'valid'); }

    if (!terms) {
        showErr('terms-err', true); valid = false;
    } else { showErr('terms-err', false); }

    if (!valid) return;

    const btn = document.getElementById('register-btn');
    btn.disabled = true;
    btn.classList.add('loading');
    btn.textContent = 'Creating account...';

    // ── Call Spring Boot API ──
    fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password: pw })
    })
        .then(res => {
            if (!res.ok) throw new Error('Server error');
            return res.json();
        })
        .then(data => {
            btn.classList.remove('loading');
            if (data.success) {
                document.getElementById('register-form-wrap').style.display = 'none';
                document.getElementById('register-success').style.display = 'block';
                showToast('Account created! You can now sign in.', 'success');
            } else {
                btn.disabled = false;
                btn.textContent = 'Create Account';
                showToast(data.message, 'fail');
            }
        })
        .catch(() => {
            btn.classList.remove('loading');
            btn.disabled = false;
            btn.textContent = 'Create Account';
            showToast('Cannot reach server — is Spring Boot running?', 'fail');
        });
}

// ── TOAST ──
let toastTimer;
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = (type === 'success' ? '✦ ' : '⚠ ') + msg;
    t.className = 'show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = ''; }, 3500);
}

// ── ENTER KEY ──
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (document.getElementById('panel-login').classList.contains('active')) handleLogin();
    else handleRegister();
});