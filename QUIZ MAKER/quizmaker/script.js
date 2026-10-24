const DB = {
  users: 'dw_users',
  session: 'dw_session',
  quizzes: 'dw_quizzes',
  attempts: 'dw_attempts'
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function getUsers() {
  return loadJSON(DB.users, []);
}

function getQuizzes() {
  return loadJSON(DB.quizzes, []);
}

function saveQuizzes(list) {
  saveJSON(DB.quizzes, list);
}

function getSession() {
  return loadJSON(DB.session, null);
}

function setSession(username) {
  saveJSON(DB.session, username ? { username } : null);
}

function currentUser() {
  const s = getSession();
  if (!s) return null;
  return getUsers().find(u => u.username === s.username) || null;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function toast(msg) {
  let holder = document.querySelector('.toast-holder');
  if (!holder) {
    holder = document.createElement('div');
    holder.className = 'toast-holder';
    document.body.appendChild(holder);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  holder.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

function confirmDialog(title, body, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(body)}</p>
      <div class="confirm-actions">
        <button class="btn btn-ghost" data-act="cancel">Cancel</button>
        <button class="btn btn-danger" data-act="confirm">Delete</button>
      </div>
    </div>`;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.dataset.act === 'cancel') {
      overlay.remove();
    }
    if (e.target.dataset.act === 'confirm') {
      onConfirm();
      overlay.remove();
    }
  });
  document.body.appendChild(overlay);
}

const state = {
  route: 'home',
  quizId: null,
  draft: null,
  attempt: null
};

function navigate(route, params) {
  state.route = route;
  state.params = params || {};
  document.getElementById('mobileMenu').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
}

function initials(name) {
  return (name || '?').slice(0, 1).toUpperCase();
}

function renderAuthSlot() {
  const user = currentUser();
  const slot = document.getElementById('authSlot');
  const mobileSlot = document.getElementById('mobileAuthSlot');
  if (user) {
    const html = `
      <div class="user-chip">
        <span class="avatar">${initials(user.username)}</span>
        <span>${escapeHTML(user.username)}</span>
      </div>
      <button class="btn btn-ghost" id="logoutBtn">Log out</button>`;
    slot.innerHTML = html;
    mobileSlot.innerHTML = html;
  } else {
    const html = `
      <button class="btn btn-ghost" data-nav="login">Log in</button>
      <button class="btn btn-primary" data-nav="register">Sign up</button>`;
    slot.innerHTML = html;
    mobileSlot.innerHTML = html;
  }
}

function updateActiveNav() {
  document.querySelectorAll('.nav-link[data-nav]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === state.route);
  });
}

function homeView() {
  const quizzes = getQuizzes();
  const users = getUsers();
  return `
  <section class="hero">
    <div>
      <span class="hero-eyebrow">Build a deck. Deal it out.</span>
      <h1>Turn what you know into a quiz <em>anyone</em> can take.</h1>
      <p>Deckwise is a lightweight quiz maker. Write your questions, mark the right answers, and share the deck. Everyone who takes it gets scored on the spot.</p>
      <div class="hero-ctas">
        <button class="btn btn-primary" data-nav="create">Create a quiz</button>
        <button class="btn btn-ghost" data-nav="browse">Browse quizzes</button>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><b>${quizzes.length}</b><span>Quizzes live</span></div>
        <div class="hero-stat"><b>${quizzes.reduce((a, q) => a + q.questions.length, 0)}</b><span>Questions written</span></div>
        <div class="hero-stat"><b>${users.length}</b><span>Quiz makers</span></div>
      </div>
    </div>
    <div class="deck-visual">
      <div class="index-card card-a"></div>
      <div class="index-card card-b"></div>
      <div class="index-card card-c">
        <span class="card-tab">CARD 03 / 12</span>
        <div class="card-q">Which language runs natively in every browser?</div>
        <div class="card-opt">Python</div>
        <div class="card-opt correct">JavaScript</div>
        <div class="card-opt">Ruby</div>
      </div>
    </div>
  </section>

  <section class="how-strip">
    <div class="section-head">
      <h2>Three cards, one deck</h2>
    </div>
    <div class="how-grid">
      <div class="how-card">
        <span class="how-tab">STEP 01</span>
        <h3>Write the deck</h3>
        <p>Give your quiz a title, then add questions one at a time with four answer options each.</p>
      </div>
      <div class="how-card">
        <span class="how-tab">STEP 02</span>
        <h3>Mark the answer</h3>
        <p>Pick the correct option per question. Deckwise keeps score against it automatically.</p>
      </div>
      <div class="how-card">
        <span class="how-tab">STEP 03</span>
        <h3>Deal it out</h3>
        <p>Anyone browsing Deckwise can take your quiz and see their score the moment they finish.</p>
      </div>
    </div>
  </section>`;
}

function loginView() {
  return `
  <div class="auth-shell">
    <div class="auth-card">
      <h1>Welcome back</h1>
      <p>Log in to create and track your quizzes.</p>
      <div class="form-alert" id="authAlert"></div>
      <form id="loginForm">
        <div class="field">
          <label for="li-username">Username</label>
          <input type="text" id="li-username" autocomplete="username" required>
        </div>
        <div class="field">
          <label for="li-password">Password</label>
          <input type="password" id="li-password" autocomplete="current-password" required>
        </div>
        <button class="btn btn-primary btn-block" type="submit">Log in</button>
      </form>
      <div class="auth-switch">No account yet? <button data-nav="register">Sign up</button></div>
    </div>
  </div>`;
}

function registerView() {
  return `
  <div class="auth-shell">
    <div class="auth-card">
      <h1>Create your account</h1>
      <p>Sign up to start building quizzes.</p>
      <div class="form-alert" id="authAlert"></div>
      <form id="registerForm">
        <div class="field">
          <label for="re-username">Username</label>
          <input type="text" id="re-username" autocomplete="username" required minlength="3">
        </div>
        <div class="field">
          <label for="re-password">Password</label>
          <input type="password" id="re-password" autocomplete="new-password" required minlength="4">
        </div>
        <button class="btn btn-primary btn-block" type="submit">Sign up</button>
      </form>
      <div class="auth-switch">Already have an account? <button data-nav="login">Log in</button></div>
    </div>
  </div>`;
}

function browseView() {
  const quizzes = getQuizzes().slice().sort((a, b) => b.createdAt - a.createdAt);
  const q = (state.params && state.params.search) || '';
  const filtered = q
    ? quizzes.filter(qz => qz.title.toLowerCase().includes(q.toLowerCase()) || qz.author.toLowerCase().includes(q.toLowerCase()))
    : quizzes;

  const cards = filtered.map(qz => `
    <div class="quiz-card">
      <div class="quiz-card-top">
        <h3>${escapeHTML(qz.title)}</h3>
        <span class="pill">${qz.questions.length} Q</span>
      </div>
      <p class="desc">${escapeHTML(qz.description || 'No description provided.')}</p>
      <div class="quiz-meta">
        <span>by ${escapeHTML(qz.author)}</span>
      </div>
      <div class="quiz-card-actions">
        <button class="btn btn-primary btn-block" data-action="take" data-id="${qz.id}">Take quiz</button>
        ${currentUser() && currentUser().username === qz.author ? `<button class="icon-btn" data-action="delete" data-id="${qz.id}" title="Delete quiz">✕</button>` : ''}
      </div>
    </div>`).join('');

  return `
  <div class="page-head">
    <span class="hero-eyebrow">The deck box</span>
    <h1>Browse quizzes</h1>
    <p>Pick a deck someone else built, or write your own from the create tab.</p>
    <div class="browse-controls">
      <input type="text" class="search-input" id="searchInput" placeholder="Search by title or author..." value="${escapeHTML(q)}">
      <button class="btn btn-violet" data-nav="create">+ New quiz</button>
    </div>
  </div>
  <div class="wrap">
    ${filtered.length ? `<div class="quiz-grid">${cards}</div>` : `
      <div class="empty-state">
        <span class="glyph">◆</span>
        <h3>${q ? 'No quizzes match that search' : 'No quizzes yet'}</h3>
        <p>${q ? 'Try a different search term.' : 'Be the first to build a deck.'}</p>
      </div>`}
  </div>`;
}

function blankQuestion() {
  return {
    id: uid('q'),
    text: '',
    options: ['', '', '', ''],
    correctIndex: 0
  };
}

function ensureDraft() {
  if (!state.draft) {
    state.draft = {
      title: '',
      description: '',
      questions: [blankQuestion()]
    };
  }
}

function createView() {
  const user = currentUser();
  if (!user) {
    return `
    <div class="auth-shell">
      <div class="auth-card">
        <h1>Log in to create</h1>
        <p>You need an account to build and publish a quiz.</p>
        <button class="btn btn-primary btn-block" data-nav="login">Log in</button>
        <div class="auth-switch">No account yet? <button data-nav="register">Sign up</button></div>
      </div>
    </div>`;
  }

  ensureDraft();
  const d = state.draft;

  const questionCards = d.questions.map((q, qi) => `
    <div class="question-card" data-qindex="${qi}">
      <div class="qc-head">
        <span class="qc-tab">CARD ${qi + 1} / ${d.questions.length}</span>
        ${d.questions.length > 1 ? `<button class="icon-btn" data-action="remove-question" data-qindex="${qi}" title="Remove question">✕</button>` : ''}
      </div>
      <div class="field">
        <label>Question</label>
        <input type="text" data-field="text" data-qindex="${qi}" placeholder="e.g. What year was the printing press invented?" value="${escapeHTML(q.text)}">
      </div>
      <div class="option-hint">Select the radio next to the correct option.</div>
      ${q.options.map((opt, oi) => `
        <div class="option-row ${q.correctIndex === oi ? 'is-correct' : ''}">
          <input type="radio" name="correct-${qi}" data-action="set-correct" data-qindex="${qi}" data-oindex="${oi}" ${q.correctIndex === oi ? 'checked' : ''}>
          <input type="text" data-field="option" data-qindex="${qi}" data-oindex="${oi}" placeholder="Option ${String.fromCharCode(65 + oi)}" value="${escapeHTML(opt)}">
        </div>`).join('')}
    </div>`).join('');

  return `
  <div class="create-shell">
    <div class="create-header">
      <span class="hero-eyebrow">New deck</span>
      <h1>Create a quiz</h1>
    </div>

    <div class="meta-card">
      <div class="field">
        <label for="quiz-title">Quiz title</label>
        <input type="text" id="quiz-title" placeholder="e.g. World Capitals Warm-up" value="${escapeHTML(d.title)}">
        <div class="field-error" id="titleError">Give your quiz a title.</div>
      </div>
      <div class="field">
        <label for="quiz-desc">Description (optional)</label>
        <textarea id="quiz-desc" rows="2" placeholder="A short line about what this quiz covers.">${escapeHTML(d.description)}</textarea>
      </div>
    </div>

    <div id="questionsHolder">${questionCards}</div>

    <button class="add-question-btn" id="addQuestionBtn">+ Add another question</button>

    <div class="create-actions">
      <button class="btn btn-ghost" id="discardDraftBtn">Discard</button>
      <button class="btn btn-primary" id="publishQuizBtn">Publish quiz</button>
    </div>
  </div>`;
}

function takeView() {
  const quizzes = getQuizzes();
  const quiz = quizzes.find(q => q.id === state.quizId);
  if (!quiz) {
    return `<div class="wrap"><div class="empty-state"><span class="glyph">◆</span><h3>Quiz not found</h3><p>It may have been removed.</p></div></div>`;
  }

  if (!state.attempt || state.attempt.quizId !== quiz.id) {
    state.attempt = {
      quizId: quiz.id,
      index: 0,
      answers: new Array(quiz.questions.length).fill(null)
    };
  }

  const a = state.attempt;
  const q = quiz.questions[a.index];
  const total = quiz.questions.length;
  const pct = Math.round((a.index / total) * 100);
  const selected = a.answers[a.index];

  const options = q.options.map((opt, oi) => `
    <button class="take-option ${selected === oi ? 'selected' : ''}" data-action="select-option" data-oindex="${oi}">
      <span class="opt-letter">${String.fromCharCode(65 + oi)}</span>
      <span>${escapeHTML(opt)}</span>
    </button>`).join('');

  return `
  <div class="take-shell">
    <div class="take-progress">
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <span class="progress-label">${a.index + 1} / ${total}</span>
    </div>
    <div class="take-card">
      <span class="take-quiz-name">${escapeHTML(quiz.title)}</span>
      <div class="take-question">${escapeHTML(q.text)}</div>
      <div class="take-options">${options}</div>
      <div class="take-nav">
        <button class="btn btn-ghost" id="prevQBtn" ${a.index === 0 ? 'disabled' : ''}>Back</button>
        <button class="btn btn-primary" id="nextQBtn" ${selected === null ? 'disabled' : ''}>${a.index === total - 1 ? 'Finish quiz' : 'Next'}</button>
      </div>
    </div>
  </div>`;
}

function resultsView() {
  const quizzes = getQuizzes();
  const quiz = quizzes.find(q => q.id === state.quizId);
  const result = state.lastResult;
  if (!quiz || !result) {
    return `<div class="wrap"><div class="empty-state"><span class="glyph">◆</span><h3>No results to show</h3><p>Take a quiz first.</p></div></div>`;
  }

  const pct = Math.round((result.score / quiz.questions.length) * 100);
  const message = pct === 100 ? 'Perfect deck clear.' : pct >= 70 ? 'Nice work.' : pct >= 40 ? 'Not bad, room to grow.' : 'Worth another pass.';

  const reviews = quiz.questions.map((q, i) => {
    const picked = result.answers[i];
    const isCorrect = picked === q.correctIndex;
    return `
    <div class="review-item">
      <div class="review-item-head">
        <span class="review-q">${escapeHTML(q.text)}</span>
        <span class="review-badge ${isCorrect ? 'correct' : 'wrong'}">${isCorrect ? 'Correct' : 'Missed'}</span>
      </div>
      ${q.options.map((opt, oi) => {
        let cls = '';
        if (oi === q.correctIndex) cls = 'was-correct';
        else if (oi === picked) cls = 'was-wrong-pick';
        return `<div class="review-opt ${cls}">${escapeHTML(opt)}${oi === picked && !isCorrect ? ' — your answer' : ''}${oi === q.correctIndex ? ' — correct answer' : ''}</div>`;
      }).join('')}
    </div>`;
  }).join('');

  return `
  <div class="results-shell">
    <div class="score-hero" style="--pct:${pct}">
      <div class="score-ring">
        <div class="score-num">${pct}%<small>${result.score} / ${quiz.questions.length}</small></div>
      </div>
      <h2>${message}</h2>
      <p>You completed "${escapeHTML(quiz.title)}"</p>
      <div class="score-actions">
        <button class="btn btn-primary" data-action="retake" data-id="${quiz.id}">Retake quiz</button>
        <button class="btn btn-ghost" data-nav="browse">Browse more quizzes</button>
      </div>
    </div>
    <div class="review-list">${reviews}</div>
  </div>`;
}

function render() {
  const view = document.getElementById('view');
  let html = '';
  switch (state.route) {
    case 'home': html = homeView(); break;
    case 'login': html = loginView(); break;
    case 'register': html = registerView(); break;
    case 'browse': html = browseView(); break;
    case 'create': html = createView(); break;
    case 'take': html = takeView(); break;
    case 'results': html = resultsView(); break;
    default: html = homeView();
  }
  view.innerHTML = html;
  renderAuthSlot();
  updateActiveNav();
  bindViewEvents();
}

function bindViewEvents() {
  const view = document.getElementById('view');

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('li-username').value.trim();
      const password = document.getElementById('li-password').value;
      const users = getUsers();
      const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      const alertBox = document.getElementById('authAlert');
      if (!found) {
        alertBox.textContent = 'Incorrect username or password.';
        alertBox.style.display = 'block';
        return;
      }
      setSession(found.username);
      toast(`Welcome back, ${found.username}.`);
      navigate('browse');
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('re-username').value.trim();
      const password = document.getElementById('re-password').value;
      const users = getUsers();
      const alertBox = document.getElementById('authAlert');
      if (username.length < 3) {
        alertBox.textContent = 'Username needs at least 3 characters.';
        alertBox.style.display = 'block';
        return;
      }
      if (password.length < 4) {
        alertBox.textContent = 'Password needs at least 4 characters.';
        alertBox.style.display = 'block';
        return;
      }
      if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        alertBox.textContent = 'That username is already taken.';
        alertBox.style.display = 'block';
        return;
      }
      users.push({ username, password, createdAt: Date.now() });
      saveJSON(DB.users, users);
      setSession(username);
      toast(`Account created. Welcome, ${username}.`);
      navigate('browse');
    });
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.params = { search: e.target.value };
      render();
      const box = document.getElementById('searchInput');
      if (box) {
        box.focus();
        box.setSelectionRange(box.value.length, box.value.length);
      }
    });
  }

  const titleInput = document.getElementById('quiz-title');
  if (titleInput) {
    titleInput.addEventListener('input', (e) => {
      state.draft.title = e.target.value;
    });
  }
  const descInput = document.getElementById('quiz-desc');
  if (descInput) {
    descInput.addEventListener('input', (e) => {
      state.draft.description = e.target.value;
    });
  }

  view.querySelectorAll('input[data-field="text"]').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const qi = Number(e.target.dataset.qindex);
      state.draft.questions[qi].text = e.target.value;
    });
  });

  view.querySelectorAll('input[data-field="option"]').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const qi = Number(e.target.dataset.qindex);
      const oi = Number(e.target.dataset.oindex);
      state.draft.questions[qi].options[oi] = e.target.value;
    });
  });

  view.querySelectorAll('input[data-action="set-correct"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const qi = Number(e.target.dataset.qindex);
      const oi = Number(e.target.dataset.oindex);
      state.draft.questions[qi].correctIndex = oi;
      render();
    });
  });

  const addQBtn = document.getElementById('addQuestionBtn');
  if (addQBtn) {
    addQBtn.addEventListener('click', () => {
      state.draft.questions.push(blankQuestion());
      render();
      const cards = document.querySelectorAll('.question-card');
      cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  const discardBtn = document.getElementById('discardDraftBtn');
  if (discardBtn) {
    discardBtn.addEventListener('click', () => {
      confirmDialog('Discard this quiz?', 'Everything you have written will be lost.', () => {
        state.draft = null;
        navigate('browse');
      });
    });
  }

  const publishBtn = document.getElementById('publishQuizBtn');
  if (publishBtn) {
    publishBtn.addEventListener('click', () => publishDraft());
  }

  const prevQBtn = document.getElementById('prevQBtn');
  if (prevQBtn) {
    prevQBtn.addEventListener('click', () => {
      if (state.attempt.index > 0) {
        state.attempt.index -= 1;
        render();
      }
    });
  }

  const nextQBtn = document.getElementById('nextQBtn');
  if (nextQBtn) {
    nextQBtn.addEventListener('click', () => {
      const quiz = getQuizzes().find(q => q.id === state.quizId);
      if (state.attempt.index < quiz.questions.length - 1) {
        state.attempt.index += 1;
        render();
      } else {
        finishAttempt(quiz);
      }
    });
  }
}

function handleViewClick(e) {
  const navBtn = e.target.closest('[data-nav]');
  if (navBtn) {
    navigate(navBtn.dataset.nav);
    return;
  }

  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;
  const action = actionEl.dataset.action;

  if (action === 'take') {
    state.quizId = actionEl.dataset.id;
    state.attempt = null;
    navigate('take');
  }

  if (action === 'retake') {
    state.quizId = actionEl.dataset.id;
    state.attempt = null;
    navigate('take');
  }

  if (action === 'delete') {
    const id = actionEl.dataset.id;
    confirmDialog('Delete this quiz?', 'This cannot be undone.', () => {
      const list = getQuizzes().filter(q => q.id !== id);
      saveQuizzes(list);
      toast('Quiz deleted.');
      render();
    });
  }

  if (action === 'remove-question') {
    const qi = Number(actionEl.dataset.qindex);
    state.draft.questions.splice(qi, 1);
    render();
  }

  if (action === 'select-option') {
    const oi = Number(actionEl.dataset.oindex);
    state.attempt.answers[state.attempt.index] = oi;
    render();
  }
}

function publishDraft() {
  const d = state.draft;
  const user = currentUser();
  const titleInput = document.getElementById('quiz-title');
  const titleError = document.getElementById('titleError');

  if (!d.title.trim()) {
    titleError.style.display = 'block';
    titleInput.focus();
    return;
  }
  titleError.style.display = 'none';

  for (let i = 0; i < d.questions.length; i++) {
    const q = d.questions[i];
    if (!q.text.trim() || q.options.some(o => !o.trim())) {
      toast(`Fill in every field on card ${i + 1} before publishing.`);
      const card = document.querySelectorAll('.question-card')[i];
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
  }

  const quiz = {
    id: uid('quiz'),
    title: d.title.trim(),
    description: d.description.trim(),
    author: user.username,
    createdAt: Date.now(),
    questions: d.questions.map(q => ({
      id: q.id,
      text: q.text.trim(),
      options: q.options.map(o => o.trim()),
      correctIndex: q.correctIndex
    }))
  };

  const list = getQuizzes();
  list.push(quiz);
  saveQuizzes(list);
  state.draft = null;
  toast('Quiz published.');
  navigate('browse');
}

function finishAttempt(quiz) {
  const a = state.attempt;
  let score = 0;
  quiz.questions.forEach((q, i) => {
    if (a.answers[i] === q.correctIndex) score += 1;
  });
  state.lastResult = { score, answers: a.answers.slice() };

  const attempts = loadJSON(DB.attempts, []);
  const user = currentUser();
  attempts.push({
    quizId: quiz.id,
    username: user ? user.username : 'guest',
    score,
    total: quiz.questions.length,
    takenAt: Date.now()
  });
  saveJSON(DB.attempts, attempts);

  navigate('results');
}

function bindGlobalEvents() {
  document.getElementById('view').addEventListener('click', handleViewClick);

  document.body.addEventListener('click', (e) => {
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn && !document.getElementById('view').contains(navBtn)) {
      navigate(navBtn.dataset.nav);
    }
    if (e.target.id === 'logoutBtn') {
      setSession(null);
      toast('Logged out.');
      navigate('home');
    }
    if (e.target.id === 'hamburger' || e.target.closest('#hamburger')) {
      document.getElementById('mobileMenu').classList.toggle('open');
    }
  });
}

bindGlobalEvents();
navigate('home');
