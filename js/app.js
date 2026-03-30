/* =====================================================
   EduPortal — Frontend App Logic
   Handles: Auth, Courses, Enrollments, DOM, Fetch API
   ===================================================== */

const API = 'http://localhost:5000';

/* ─── State ─── */
let currentUser = null;
let allCourses = [];
let enrolledIds = new Set();

/* ─── DOM Refs ─── */
const loader = document.getElementById('loader');
const authModal = document.getElementById('authModal');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const modalClose = document.getElementById('modalClose');
const modalOverlay = document.getElementById('modalOverlay');
const tabLogin = document.getElementById('tabLogin');
const tabSignup = document.getElementById('tabSignup');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const switchToSignup = document.getElementById('switchToSignup');
const switchToLogin = document.getElementById('switchToLogin');
const userPill = document.getElementById('userPill');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const dashLink = document.getElementById('dashLink');
const coursesGrid = document.getElementById('coursesGrid');
const coursesEmpty = document.getElementById('coursesEmpty');
const courseSearch = document.getElementById('courseSearch');
const filterTabs = document.getElementById('filterTabs');
const enrollmentsList = document.getElementById('enrollmentsList');
const enrollCount = document.getElementById('enrollCount');
const totalCredits = document.getElementById('totalCredits');
const completedCount = document.getElementById('completedCount');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

/* ─── Course Data (mock + demo — works offline) ─── */
const DEMO_COURSES = [
  { _id: 'c1', code: 'CS101', name: 'Cloud Security', instructor: 'Sunnyraj Puwar', credits: 4, dept: 'CS', schedule: 'Mon/Wed 9:00 AM', seats: 45, enrolled: 20, icon: '☁️' },
  { _id: 'c2', code: 'CS201', name: 'Unix & Shell Programming', instructor: 'Sanjay Ajani', credits: 4, dept: 'CS', schedule: 'Tue/Thu 11:00 AM', seats: 40, enrolled: 25, icon: '💻' },
  { _id: 'c3', code: 'CS301', name: 'Computational Intelligence', instructor: 'Prakash Arumugam', credits: 3, dept: 'CS', schedule: 'Mon/Wed 2:00 PM', seats: 50, enrolled: 18, icon: '🧠' },
  { _id: 'c4', code: 'CS401', name: 'Robotics & Automation', instructor: 'Dr. K Manivel', credits: 4, dept: 'CS', schedule: 'Fri 10:00 AM', seats: 35, enrolled: 12, icon: '🤖' },
  { _id: 'c5', code: 'MATH301', name: 'Probability & Statistics', instructor: 'Dr. Chandan Kumawat', credits: 3, dept: 'MATH', schedule: 'Mon/Wed 11:00 AM', seats: 45, enrolled: 30, icon: '📊' },
  { _id: 'c6', code: 'CS210', name: 'Full Stack Development', instructor: 'Shaily Tiwari', credits: 4, dept: 'CS', schedule: 'Fri 2:00 PM', seats: 40, enrolled: 28, icon: '🌐' },
  { _id: 'c7', code: 'AI401', name: 'Machine Learning Fundamentals', instructor: 'Dr. Arjun Nair', credits: 3, dept: 'AI', schedule: 'Tue/Thu 3:00 PM', seats: 30, enrolled: 29, icon: '🧠' },
  { _id: 'c8', code: 'AI402', name: 'Deep Learning & Neural Networks', instructor: 'Prof. Sneha Joshi', credits: 3, dept: 'AI', schedule: 'Mon/Wed 4:00 PM', seats: 25, enrolled: 18, icon: '🤖' },
  { _id: 'c9', code: 'MATH101', name: 'Calculus I', instructor: 'Dr. Suresh Kumar', credits: 4, dept: 'MATH', schedule: 'Mon/Wed/Fri 8:00 AM', seats: 60, enrolled: 45, icon: '📐' },
  { _id: 'c10', code: 'MATH201', name: 'Linear Algebra', instructor: 'Prof. Kavita Reddy', credits: 3, dept: 'MATH', schedule: 'Tue/Thu 9:00 AM', seats: 50, enrolled: 22, icon: '📊' },
  { _id: 'c11', code: 'BUS101', name: 'Principles of Management', instructor: 'Prof. Deepa Rao', credits: 3, dept: 'BUS', schedule: 'Tue/Thu 1:00 PM', seats: 70, enrolled: 55, icon: '🏢' },
  { _id: 'c12', code: 'BUS201', name: 'Financial Accounting', instructor: 'Dr. Rajesh Iyer', credits: 4, dept: 'BUS', schedule: 'Mon/Wed 3:00 PM', seats: 60, enrolled: 40, icon: '💹' }
];

/* ─── Init ─── */
window.addEventListener('load', () => {
  setTimeout(() => loader.classList.add('hidden'), 1000);
  loadSession();
  allCourses = DEMO_COURSES;
  renderCourses(allCourses);
  setupNav();
  setupFilters();
  setupSearch();
  setupPwStrength();
});

/* ─── SESSION ─── */
function loadSession() {
  const saved = localStorage.getItem('edu_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    const savedEnrolled = localStorage.getItem('edu_enrolled_' + currentUser.id);
    if (savedEnrolled) enrolledIds = new Set(JSON.parse(savedEnrolled));
    showLoggedInUI();
  }
}

function saveSession() {
  if (currentUser) {
    localStorage.setItem('edu_user', JSON.stringify(currentUser));
    localStorage.setItem('edu_enrolled_' + currentUser.id, JSON.stringify([...enrolledIds]));
  }
}

/* ─── NAV ─── */
function setupNav() {
  document.querySelectorAll('.nav-link, [data-section]').forEach(el => {
    el.addEventListener('click', e => {
      const section = el.dataset.section;
      if (section) { e.preventDefault(); navigateTo(section); }
    });
  });

  loginBtn.addEventListener('click', () => openModal('login'));
  signupBtn.addEventListener('click', () => openModal('signup'));
  document.getElementById('heroSignup').addEventListener('click', () => openModal('signup'));
  document.getElementById('heroExplore').addEventListener('click', () => navigateTo('courses'));
  document.getElementById('browseCourses')?.addEventListener('click', () => navigateTo('courses'));
  logoutBtn.addEventListener('click', logout);
}

function navigateTo(id) {
  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const sec = document.getElementById(id);
  if (sec) { sec.classList.remove('hidden'); sec.classList.add('active'); }
  const link = document.querySelector(`.nav-link[data-section="${id}"]`);
  if (link) link.classList.add('active');
  if (id === 'dashboard') renderDashboard();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─── AUTH MODAL ─── */
function openModal(tab = 'login') {
  authModal.classList.remove('hidden');
  switchTab(tab);
}
function closeModal() {
  authModal.classList.add('hidden');
  clearForms();
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);
tabLogin.addEventListener('click', () => switchTab('login'));
tabSignup.addEventListener('click', () => switchTab('signup'));
switchToSignup.addEventListener('click', e => { e.preventDefault(); switchTab('signup'); });
switchToLogin.addEventListener('click', e => { e.preventDefault(); switchTab('login'); });

function switchTab(tab) {
  if (tab === 'login') {
    tabLogin.classList.add('active'); tabSignup.classList.remove('active');
    loginForm.classList.remove('hidden'); signupForm.classList.add('hidden');
  } else {
    tabSignup.classList.add('active'); tabLogin.classList.remove('active');
    signupForm.classList.remove('hidden'); loginForm.classList.add('hidden');
  }
}

function clearForms() {
  loginForm.reset(); signupForm.reset();
  ['loginEmailErr','loginPwErr','signupFirstErr','signupIdErr','signupEmailErr','signupPwErr'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = ''; });
  ['loginMsg','signupMsg'].forEach(id => { const el = document.getElementById(id); if(el) { el.className = 'form-msg hidden'; el.textContent = ''; } });
}

/* ─── LOGIN ─── */
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  clearErrors('login');

  let valid = true;
  if (!email || !isValidEmail(email)) { showError('loginEmailErr', 'Please enter a valid email'); valid = false; }
  if (!password || password.length < 6) { showError('loginPwErr', 'Password must be at least 6 characters'); valid = false; }
  if (!valid) return;

  setLoading('loginSubmit', true);

  try {
    const res = await apiFetch('/login', 'POST', { email, password });
    if (res.success) {
      currentUser = res.user;
      const savedEnrolled = localStorage.getItem('edu_enrolled_' + currentUser.id);
      if (savedEnrolled) enrolledIds = new Set(JSON.parse(savedEnrolled));
      saveSession();
      showLoggedInUI();
      closeModal();
      showToast(`Welcome back, ${currentUser.firstName}! 👋`);
      renderCourses(allCourses);
    } else {
      if (res.message === "Login Successful") {
  showFormMsg('loginMsg', res.message, 'success');  // ✅ GREEN
} else {
  showFormMsg('loginMsg', res.message || 'Invalid credentials', 'error'); // ❌ RED
}
    }
  } catch {
    // Demo mode: simulate login
    const saved = getAllUsers().find(u => u.email === email && u.password === password);
    if (saved) {
      currentUser = { id: saved.id, firstName: saved.firstName, lastName: saved.lastName, email: saved.email, studentId: saved.studentId };
      const savedEnrolled = localStorage.getItem('edu_enrolled_' + currentUser.id);
      if (savedEnrolled) enrolledIds = new Set(JSON.parse(savedEnrolled));
      saveSession();
      showLoggedInUI();
      closeModal();
      showToast(`Welcome back, ${currentUser.firstName}! 👋`);
      renderCourses(allCourses);
    } else {
      showFormMsg('loginMsg', 'Invalid email or password', 'error');
    }
  }
  setLoading('loginSubmit', false);
});

/* ─── SIGNUP ─── */
signupForm.addEventListener('submit', async e => {
  e.preventDefault();
  const firstName = document.getElementById('signupFirst').value.trim();
  const lastName = document.getElementById('signupLast').value.trim();
  const studentId = document.getElementById('signupStudentId').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  clearErrors('signup');

  let valid = true;
  if (!firstName) { showError('signupFirstErr', 'First name is required'); valid = false; }
  if (!studentId || studentId.length < 5) { showError('signupIdErr', 'Enter a valid Student ID'); valid = false; }
  if (!email || !isValidEmail(email)) { showError('signupEmailErr', 'Enter a valid email address'); valid = false; }
  if (!password || password.length < 6) { showError('signupPwErr', 'Password must be at least 6 characters'); valid = false; }
  if (!valid) return;

  setLoading('signupSubmit', true);

  try {
   const res = await apiFetch('/register', 'POST', {
  name: firstName + " " + lastName,
  email,
  password
});
    if (res.success) {
      currentUser = res.user;
      saveSession();
      showLoggedInUI();
      closeModal();
      showToast(`Account created! Welcome, ${firstName}! 🎉`);
      renderCourses(allCourses);
    } else {
      showFormMsg('signupMsg', res.message || 'Registration failed', 'error');
    }
  } catch {
    // Demo mode: check if email already exists
    const users = getAllUsers();
    if (users.find(u => u.email === email)) {
      showFormMsg('signupMsg', 'Email already registered. Please log in.', 'error');
      setLoading('signupSubmit', false);
      return;
    }
    const newUser = { id: 'u' + Date.now(), firstName, lastName, studentId, email, password };
    users.push(newUser);
    localStorage.setItem('edu_users', JSON.stringify(users));
    currentUser = { id: newUser.id, firstName, lastName, email, studentId };
    saveSession();
    showLoggedInUI();
    closeModal();
    showToast(`Account created! Welcome, ${firstName}! 🎉`);
    renderCourses(allCourses);
  }
  setLoading('signupSubmit', false);
});

/* ─── LOGOUT ─── */
function logout() {
  currentUser = null;
  enrolledIds = new Set();
  localStorage.removeItem('edu_user');
  showLoggedOutUI();
  navigateTo('home');
  renderCourses(allCourses);
  showToast('Logged out successfully');
}

/* ─── UI STATES ─── */
function showLoggedInUI() {
  loginBtn.classList.add('hidden');
  signupBtn.classList.add('hidden');
  userPill.classList.remove('hidden');
  dashLink.classList.remove('hidden');
  userName.textContent = currentUser.firstName;
  userAvatar.textContent = currentUser.firstName[0].toUpperCase();
}
function showLoggedOutUI() {
  loginBtn.classList.remove('hidden');
  signupBtn.classList.remove('hidden');
  userPill.classList.add('hidden');
  dashLink.classList.add('hidden');
}

/* ─── COURSES ─── */
let activeFilter = 'all';

function setupFilters() {
  filterTabs.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      filterTabs.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilter();
    });
  });
}

function setupSearch() {
  courseSearch.addEventListener('input', () => applyFilter());
}

function applyFilter() {
  const q = courseSearch.value.toLowerCase();
  const filtered = allCourses.filter(c => {
    const matchDept = activeFilter === 'all' || c.dept === activeFilter;
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q);
    return matchDept && matchQ;
  });
  renderCourses(filtered);
}

function renderCourses(courses) {
  coursesGrid.innerHTML = '';
  if (!courses.length) {
    coursesEmpty.classList.remove('hidden');
    return;
  }
  coursesEmpty.classList.add('hidden');
  courses.forEach(c => {
    const pct = (c.enrolled / c.seats) * 100;
    const fillClass = pct >= 90 ? 'red' : pct >= 70 ? 'yellow' : '';
    const isEnrolled = enrolledIds.has(c._id);
    const isFull = c.enrolled >= c.seats;
    const bannerClass = c.dept.toLowerCase();
    coursesGrid.innerHTML += `
      <div class="course-card" data-id="${c._id}">
        <div class="course-banner ${bannerClass}"></div>
        <div class="course-body">
          <div class="course-meta">
            <span class="course-code">${c.code}</span>
            <span class="course-credits">⭐ ${c.credits} Credits</span>
          </div>
          <div class="course-name">${c.name}</div>
          <div class="course-instructor">👤 ${c.instructor}</div>
          <div class="course-seats">
            <div class="seats-bar"><div class="seats-fill ${fillClass}" style="width:${pct}%"></div></div>
            <span class="seats-text">${c.seats - c.enrolled} seats left</span>
          </div>
          <div class="course-footer">
            <span class="course-schedule">🕐 ${c.schedule}</span>
            <button class="btn-enroll ${isEnrolled ? 'enrolled' : ''}" data-id="${c._id}"
              ${isEnrolled ? 'disabled' : isFull ? 'disabled' : ''}>
              ${isEnrolled ? '✓ Enrolled' : isFull ? 'Full' : 'Enroll'}
            </button>
          </div>
        </div>
      </div>`;
  });

  // Enroll button events
  coursesGrid.querySelectorAll('.btn-enroll:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => handleEnroll(btn.dataset.id));
  });
}

async function handleEnroll(courseId) {
  if (!currentUser) { openModal('login'); showToast('Please log in to enroll'); return; }
  const course = allCourses.find(c => c._id === courseId);
  if (!course) return;
  if (enrolledIds.has(courseId)) return;

  try {
    await apiFetch('/enrollments', 'POST', { courseId, studentId: currentUser.id });
  } catch { /* offline, use local */ }

  enrolledIds.add(courseId);
  course.enrolled = Math.min(course.enrolled + 1, course.seats);
  saveSession();
  renderCourses(allCourses.filter(c => {
    const matchDept = activeFilter === 'all' || c.dept === activeFilter;
    const q = courseSearch.value.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
    return matchDept && matchQ;
  }));
  showToast(`Enrolled in ${course.name}! 🎓`);
}

/* ─── DASHBOARD ─── */
function renderDashboard() {
  const enrolled = allCourses.filter(c => enrolledIds.has(c._id));
  const credits = enrolled.reduce((s, c) => s + c.credits, 0);
  enrollCount.textContent = enrolled.length;
  totalCredits.textContent = credits;
  completedCount.textContent = 0;

  if (!enrolled.length) {
    enrollmentsList.innerHTML = `
      <div class="empty-enrollments">
        <div class="empty-icon">🎓</div>
        <p>You haven't enrolled in any courses yet.</p>
        <button class="btn-primary" onclick="navigateTo('courses')">Browse Courses</button>
      </div>`;
    return;
  }

  enrollmentsList.innerHTML = enrolled.map(c => `
    <div class="enrollment-item">
      <div class="enroll-left">
        <div class="enroll-icon">${c.icon}</div>
        <div>
          <div class="enroll-name">${c.name}</div>
          <div class="enroll-meta">${c.code} · ${c.instructor} · ${c.schedule}</div>
        </div>
      </div>
      <div class="enroll-right">
        <span class="enroll-credits">${c.credits} cr</span>
        <button class="btn-drop" data-id="${c._id}">Drop</button>
      </div>
    </div>`).join('');

  enrollmentsList.querySelectorAll('.btn-drop').forEach(btn => {
    btn.addEventListener('click', () => handleDrop(btn.dataset.id));
  });
}
async function handleDrop(courseId) {
  try {
    await fetch(`http://localhost:5000/enroll/${courseId}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.log("Offline delete");
  }

  const course = allCourses.find(c => c._id === courseId);
  if (!course) return;

  enrolledIds.delete(courseId);
  course.enrolled = Math.max(0, course.enrolled - 1);

  saveSession();
  renderDashboard();
  showToast(`Dropped ${course.name}`);
}

/* ─── PASSWORD STRENGTH ─── */
function setupPwStrength() {
  const pwInput = document.getElementById('signupPassword');
  const bars = document.querySelectorAll('#pwStrength .pw-bar');
  pwInput.addEventListener('input', () => {
    const v = pwInput.value;
    const strength = v.length >= 10 && /[A-Z]/.test(v) && /[0-9]/.test(v) ? 3
                   : v.length >= 8 ? 2
                   : v.length >= 6 ? 1 : 0;
    bars.forEach((b, i) => {
      b.className = 'pw-bar';
      if (i < strength) {
        b.classList.add(strength === 1 ? 'weak' : strength === 2 ? 'medium' : 'strong');
      }
    });
  });
}

/* ─── PASSWORD TOGGLE ─── */
document.querySelectorAll('.pw-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const inp = document.getElementById(btn.dataset.target);
    inp.type = inp.type === 'password' ? 'text' : 'password';
    btn.textContent = inp.type === 'password' ? '👁' : '🙈';
  });
});

/* ─── HELPERS ─── */
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
function clearErrors(form) {
  const ids = form === 'login'
    ? ['loginEmailErr','loginPwErr']
    : ['signupFirstErr','signupIdErr','signupEmailErr','signupPwErr'];
  ids.forEach(id => { const el = document.getElementById(id); if(el) el.textContent = ''; });
  const msg = document.getElementById(form + 'Msg');
  if (msg) { msg.className = 'form-msg hidden'; msg.textContent = ''; }
}
function showFormMsg(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `form-msg ${type}`;
  el.textContent = msg;
}
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const span = btn.querySelector('span');
  const ld = btn.querySelector('.btn-loader');
  if (loading) { span.classList.add('hidden'); ld.classList.remove('hidden'); btn.disabled = true; }
  else { span.classList.remove('hidden'); ld.classList.add('hidden'); btn.disabled = false; }
}

let toastTimer;
function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

async function apiFetch(path, method = 'GET', body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  return res.json();
}

function getAllUsers() {
  try { return JSON.parse(localStorage.getItem('edu_users') || '[]'); }
  catch { return []; }
}
function registerUser() {
  const data = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value
  };

  fetch('http://localhost:5000/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
  });
}
function loginUser() {
  const data = {
    email: document.getElementById("email").value,
    password: document.getElementById("password").value
  };

  fetch('http://localhost:5000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
  });
}
