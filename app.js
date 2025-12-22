// ============================================
// CONFIGURATION
// ============================================
// Backend API URL (deployed on Vercel)
const config = {
  API_URL: 'https://full-stack-to-do-list-backend-q7t3-i9j3khhu5.vercel.app/api',
};

// ============================================
// STATE MANAGEMENT
// ============================================
let state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  todos: [],
  filter: 'all', // all, active, completed
};

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
  // Screens
  authScreen: document.getElementById('authScreen'),
  todoScreen: document.getElementById('todoScreen'),
  
  // Auth
  authTabs: document.querySelectorAll('.auth-tab'),
  loginForm: document.getElementById('loginForm'),
  signupForm: document.getElementById('signupForm'),
  loginError: document.getElementById('loginError'),
  signupError: document.getElementById('signupError'),
  
  // Theme toggles
  themeToggles: [
    document.getElementById('themeToggle'),
    document.getElementById('themeToggleTodo'),
  ],
  
  // Todo
  userEmail: document.getElementById('userEmail'),
  logoutBtn: document.getElementById('logoutBtn'),
  addTaskForm: document.getElementById('addTaskForm'),
  taskInput: document.getElementById('taskInput'),
  tasksList: document.getElementById('tasksList'),
  emptyState: document.getElementById('emptyState'),
  loadingState: document.getElementById('loadingState'),
  taskCount: document.getElementById('taskCount'),
  filterTabs: document.querySelectorAll('.filter-tab'),
};

// ============================================
// API FUNCTIONS
// ============================================
const api = {
  async signup(email, password) {
    const response = await fetch(`${config.API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  },
  
  async login(email, password) {
    const response = await fetch(`${config.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  },
  
  async getTodos() {
    const response = await fetch(`${config.API_URL}/todos?sort=-createdAt`, {
      headers: {
        'Authorization': `Bearer ${state.token}`,
      },
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data.todos || [];
  },
  
  async createTodo(text) {
    const response = await fetch(`${config.API_URL}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`,
      },
      body: JSON.stringify({ text }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  },
  
  async updateTodo(id, updates) {
    const response = await fetch(`${config.API_URL}/todos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`,
      },
      body: JSON.stringify(updates),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  },
  
  async deleteTodo(id) {
    const response = await fetch(`${config.API_URL}/todos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.token}`,
      },
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  },
};

// ============================================
// UI FUNCTIONS
// ============================================
function showScreen(screen) {
  elements.authScreen.classList.remove('active');
  elements.todoScreen.classList.remove('active');
  
  if (screen === 'auth') {
    elements.authScreen.classList.add('active');
  } else if (screen === 'todo') {
    elements.todoScreen.classList.add('active');
  }
}

function showError(element, message) {
  element.textContent = message;
  setTimeout(() => {
    element.textContent = '';
  }, 5000);
}

function setLoading(isLoading) {
  if (isLoading) {
    elements.loadingState.classList.add('visible');
    elements.emptyState.classList.remove('visible');
    elements.tasksList.style.display = 'none';
  } else {
    elements.loadingState.classList.remove('visible');
  }
}

function renderTodos() {
  const filtered = state.todos.filter(todo => {
    if (state.filter === 'active') return !todo.completed;
    if (state.filter === 'completed') return todo.completed;
    return true;
  });
  
  elements.tasksList.innerHTML = '';
  
  if (filtered.length === 0) {
    elements.tasksList.style.display = 'none';
    elements.emptyState.classList.add('visible');
  } else {
    elements.tasksList.style.display = 'flex';
    elements.emptyState.classList.remove('visible');
    
    filtered.forEach(todo => {
      const taskElement = createTaskElement(todo);
      elements.tasksList.appendChild(taskElement);
    });
  }
  
  updateTaskCount();
}

function createTaskElement(todo) {
  const div = document.createElement('div');
  div.className = `task-item ${todo.completed ? 'completed' : ''}`;
  div.dataset.id = todo._id;
  
  div.innerHTML = `
    <div class="task-checkbox"></div>
    <div class="task-text">${escapeHtml(todo.text)}</div>
    <div class="task-actions">
      <button class="task-btn delete-btn" title="Delete">×</button>
    </div>
  `;
  
  // Toggle complete
  div.querySelector('.task-checkbox').addEventListener('click', () => {
    toggleTodo(todo._id);
  });
  
  div.querySelector('.task-text').addEventListener('click', () => {
    toggleTodo(todo._id);
  });
  
  // Delete
  div.querySelector('.delete-btn').addEventListener('click', () => {
    deleteTodoHandler(todo._id, div);
  });
  
  return div;
}

function updateTaskCount() {
  const total = state.todos.length;
  const active = state.todos.filter(t => !t.completed).length;
  
  if (state.filter === 'all') {
    elements.taskCount.textContent = `${total} task${total !== 1 ? 's' : ''}`;
  } else if (state.filter === 'active') {
    elements.taskCount.textContent = `${active} active`;
  } else {
    const completed = total - active;
    elements.taskCount.textContent = `${completed} completed`;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// EVENT HANDLERS
// ============================================
async function handleSignup(e) {
  e.preventDefault();
  
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  
  elements.signupError.textContent = '';
  
  try {
    const data = await api.signup(email, password);
    
    state.token = data.token;
    state.user = { email: data.email };
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(state.user));
    
    showScreen('todo');
    loadTodos();
  } catch (error) {
    showError(elements.signupError, error.message);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  elements.loginError.textContent = '';
  
  try {
    const data = await api.login(email, password);
    
    state.token = data.token;
    state.user = { email: data.email };
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(state.user));
    
    showScreen('todo');
    loadTodos();
  } catch (error) {
    showError(elements.loginError, error.message);
  }
}

function handleLogout() {
  state.token = null;
  state.user = null;
  state.todos = [];
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  showScreen('auth');
  
  // Reset forms
  elements.loginForm.reset();
  elements.signupForm.reset();
}

async function handleAddTask(e) {
  e.preventDefault();
  
  const text = elements.taskInput.value.trim();
  
  if (!text) return;
  
  try {
    const newTodo = await api.createTodo(text);
    state.todos.unshift(newTodo);
    elements.taskInput.value = '';
    renderTodos();
  } catch (error) {
    console.error('Failed to create todo:', error);
  }
}

async function toggleTodo(id) {
  const todo = state.todos.find(t => t._id === id);
  if (!todo) return;
  
  try {
    const updated = await api.updateTodo(id, { completed: !todo.completed });
    Object.assign(todo, updated);
    renderTodos();
  } catch (error) {
    console.error('Failed to update todo:', error);
  }
}

async function deleteTodoHandler(id, element) {
  element.classList.add('deleting');
  
  try {
    await api.deleteTodo(id);
    
    setTimeout(() => {
      state.todos = state.todos.filter(t => t._id !== id);
      renderTodos();
    }, 300);
  } catch (error) {
    console.error('Failed to delete todo:', error);
    element.classList.remove('deleting');
  }
}

async function loadTodos() {
  elements.userEmail.textContent = state.user.email;
  
  setLoading(true);
  
  try {
    state.todos = await api.getTodos();
    renderTodos();
  } catch (error) {
    console.error('Failed to load todos:', error);
  } finally {
    setLoading(false);
  }
}

function setFilter(filter) {
  state.filter = filter;
  
  elements.filterTabs.forEach(tab => {
    if (tab.dataset.filter === filter) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  renderTodos();
}

function toggleTheme() {
  if (document.body.classList.contains('theme-dark')) {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    localStorage.setItem('theme', 'light');
  } else {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
    localStorage.setItem('theme', 'dark');
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
// Auth tabs
elements.authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.dataset.tab;
    
    elements.authTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    if (targetTab === 'login') {
      elements.loginForm.classList.add('active');
      elements.signupForm.classList.remove('active');
    } else {
      elements.signupForm.classList.add('active');
      elements.loginForm.classList.remove('active');
    }
  });
});

// Forms
elements.signupForm.addEventListener('submit', handleSignup);
elements.loginForm.addEventListener('submit', handleLogin);
elements.logoutBtn.addEventListener('click', handleLogout);
elements.addTaskForm.addEventListener('submit', handleAddTask);

// Filters
elements.filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    setFilter(tab.dataset.filter);
  });
});

// Theme toggles
elements.themeToggles.forEach(toggle => {
  if (toggle) {
    toggle.addEventListener('click', toggleTheme);
  }
});

// ============================================
// INITIALIZATION
// ============================================
function init() {
  // Apply saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
  }
  
  // Check authentication
  if (state.token && state.user) {
    showScreen('todo');
    loadTodos();
  } else {
    showScreen('auth');
  }
}

// Start the app
init();
