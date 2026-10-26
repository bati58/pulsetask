/**
 * ============================================================================
 * PulseTask — Personal Task Manager
 * ============================================================================
 * Written for Computer Science students learning modern JavaScript & DOM patterns.
 *
 * Core Architectural Concept: "State-Driven Rendering"
 * Instead of manually modifying HTML elements when something changes, we:
 *   1. Store all our data in a single JavaScript array (`tasks`).
 *   2. Whenever data changes, we update the array and save to `localStorage`.
 *   3. We call `render()`, which updates the DOM to match our state.
 *
 * This is the exact fundamental pattern used by modern frameworks like React!
 */

// ----------------------------------------------------------------------------
// 1. Storage Key & Initial Data
// ----------------------------------------------------------------------------
const STORAGE_KEY = 'pulsetask_tasks_v1';

// Supported Task Categories
const CATEGORIES = ['Personal', 'Study', 'Coding', 'Work'];
const CATEGORY_ICONS = {
  Personal: '👤',
  Study: '📚',
  Coding: '💻',
  Work: '💼'
};

// Seed starter tasks if it's the user's very first visit
const DEFAULT_TASKS = [
  {
    id: 'demo-1',
    text: 'Welcome to your new vibe coding Task Manager! 🚀',
    completed: true,
    createdAt: Date.now() - 3600000, // 1 hour ago
    dueDate: null,
    category: 'Personal'
  },
  {
    id: 'demo-2',
    text: 'Click the circle to toggle completion ✅',
    completed: false,
    createdAt: Date.now() - 1800000, // 30 mins ago
    dueDate: getTodayString(),
    category: 'Study'
  },
  {
    id: 'demo-3',
    text: 'Try filtering by Active and Completed above 🔍',
    completed: false,
    createdAt: Date.now(),
    dueDate: null,
    category: 'Coding'
  }
];

// ----------------------------------------------------------------------------
// 2. State Variables
// ----------------------------------------------------------------------------
// 'tasks' holds the list of task objects
let tasks = loadTasksFromStorage();

// 'currentFilter' determines which tasks to show: 'all' | 'active' | 'completed'
let currentFilter = 'all';

// 'currentCategoryFilter' determines which category to filter by: 'all' | 'Study' | 'Coding' | 'Personal' | 'Work'
let currentCategoryFilter = 'all';

// 'editingTaskId' tracks which task is currently being edited (null = none)
let editingTaskId = null;

// ----------------------------------------------------------------------------
// 3. Cached DOM Elements (DOM Selectors)
// ----------------------------------------------------------------------------
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const categorySelect = document.getElementById('category-select');
const dueDateInput = document.getElementById('due-date-input');
const categoryFilterBar = document.getElementById('category-filter-bar');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const emptyTitle = document.getElementById('empty-title');
const emptyDesc = document.getElementById('empty-desc');

// Progress overview
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');
const footerStatusText = document.getElementById('footer-status-text');

// Filter buttons and badges
const filterBtns = {
  all: document.getElementById('filter-all'),
  active: document.getElementById('filter-active'),
  completed: document.getElementById('filter-completed')
};

const filterBadges = {
  all: document.getElementById('badge-all'),
  active: document.getElementById('badge-active'),
  completed: document.getElementById('badge-completed')
};

const clearCompletedBtn = document.getElementById('clear-completed-btn');

// ----------------------------------------------------------------------------
// 4. LocalStorage Helpers
// ----------------------------------------------------------------------------

/**
 * Loads tasks from the browser's localStorage.
 * If no tasks exist, returns default initial tasks.
 */
function loadTasksFromStorage() {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return DEFAULT_TASKS;
    }
    const parsed = JSON.parse(serialized);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error);
    return [];
  }
}

/**
 * Persists the current tasks array to localStorage as a JSON string.
 */
function saveTasksToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
}

// ----------------------------------------------------------------------------
// 5. Core Feature Actions (Add, Toggle, Delete, Edit, Filter)
// ----------------------------------------------------------------------------

/**
 * Feature 1: Add a new task
 * Creates a new task object, adds it to state, persists, and re-renders.
 */
function addTask(text, dueDate = null, category = 'Personal') {
  const trimmed = text.trim();
  if (!trimmed) return;

  const validCategory = CATEGORIES.includes(category) ? category : 'Personal';

  const newTask = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    text: trimmed,
    completed: false,
    createdAt: Date.now(),
    dueDate: dueDate ? dueDate : null,
    category: validCategory
  };

  // Add new task to the beginning of the list
  tasks.unshift(newTask);

  saveTasksToStorage();
  render();
}

/**
 * Feature 2: Mark tasks as completed (toggle)
 * Flips the completed boolean of the matching task.
 */
function toggleTask(id) {
  tasks = tasks.map(task => {
    if (task.id === id) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });

  saveTasksToStorage();
  render();
}

/**
 * Feature 3: Delete tasks
 * Removes the task from the array with a smooth exit animation.
 */
function deleteTask(id) {
  const taskElement = document.querySelector(`[data-id="${id}"]`);
  
  if (taskElement) {
    // Add CSS removal animation class
    taskElement.classList.add('removing');
    
    // Wait for the animation to finish before updating state and re-rendering
    taskElement.addEventListener('animationend', () => {
      tasks = tasks.filter(task => task.id !== id);
      saveTasksToStorage();
      render();
    }, { once: true });
  } else {
    // Fallback if element not found in DOM
    tasks = tasks.filter(task => task.id !== id);
    saveTasksToStorage();
    render();
  }
}

/**
 * Feature 4: Filter tasks
 * Switches the active filter view ('all', 'active', 'completed').
 */
function setFilter(filter) {
  if (!['all', 'active', 'completed'].includes(filter)) return;
  currentFilter = filter;

  // Update active state in UI tabs
  Object.keys(filterBtns).forEach(key => {
    const btn = filterBtns[key];
    const isCurrent = key === filter;
    btn.classList.toggle('active', isCurrent);
    btn.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
  });

  render();
}

/**
 * Feature: Filter tasks by category ('all' | 'Study' | 'Coding' | 'Personal' | 'Work')
 */
function setCategoryFilter(category) {
  currentCategoryFilter = category;

  // Update active state in category tab buttons
  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    const isCurrent = btn.dataset.category === category;
    btn.classList.toggle('active', isCurrent);
    btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
  });

  render();
}

/**
 * Feature 5 (NEW): Edit an existing task
 * Enters inline editing mode for the specified task.
 */
function startEdit(id) {
  editingTaskId = id;
  render();

  // After render, auto-focus the edit input and place the cursor at the end
  const editInput = document.querySelector('.edit-input');
  if (editInput) {
    editInput.focus();
    editInput.selectionStart = editInput.value.length;
  }
}

/**
 * Saves the edited task title.
 * Rejects empty or whitespace-only text with a visual shake.
 */
function saveEdit(id) {
  const editInput = document.querySelector('.edit-input');
  if (!editInput) return;

  const newText = editInput.value.trim();

  // Validation: reject empty titles
  if (!newText) {
    editInput.classList.add('invalid');
    editInput.focus();
    // Remove the shake class after the animation finishes so it can re-trigger
    editInput.addEventListener('animationend', () => {
      editInput.classList.remove('invalid');
    }, { once: true });
    return;
  }

  const editDateInput = document.querySelector('.edit-date-input');
  const newDueDate = editDateInput && editDateInput.value ? editDateInput.value : null;

  const editCategorySelect = document.querySelector('.edit-category-select');
  const selectedCategory = editCategorySelect ? editCategorySelect.value : null;
  const newCategory = CATEGORIES.includes(selectedCategory) ? selectedCategory : 'Personal';

  // Update text, dueDate, and category — ID, completed, createdAt are all preserved
  tasks = tasks.map(task => {
    if (task.id === id) {
      return {
        ...task,
        text: newText,
        dueDate: newDueDate,
        category: newCategory
      };
    }
    return task;
  });

  editingTaskId = null;
  saveTasksToStorage();
  render();
}

/**
 * Cancels editing without saving — restores the original title.
 */
function cancelEdit() {
  editingTaskId = null;
  render();
}

/**
 * Bonus Action: Clear all completed tasks at once
 */
function clearCompleted() {
  const completedCount = tasks.filter(t => t.completed).length;
  if (completedCount === 0) return;

  tasks = tasks.filter(task => !task.completed);
  saveTasksToStorage();
  render();
}

// ----------------------------------------------------------------------------
// 6. Formatting & Helper Functions
// ----------------------------------------------------------------------------

/**
 * Converts a millisecond timestamp into a human-friendly relative label
 */
function formatTime(timestamp) {
  if (!timestamp) return '';
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes === 1) return '1 min ago';
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return '1 hr ago';
  if (diffHours < 24) return `${diffHours} hrs ago`;
  
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Returns today's date formatted as 'YYYY-MM-DD' in local time.
 */
function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates due date status: 'overdue' | 'today' | 'upcoming'
 * Completed tasks are never marked as overdue (Requirement 6).
 */
function getDueDateStatus(dueDate, completed) {
  if (!dueDate) return null;
  const today = getTodayString();
  if (dueDate < today) {
    return completed ? 'upcoming' : 'overdue';
  } else if (dueDate === today) {
    return 'today';
  } else {
    return 'upcoming';
  }
}

/**
 * Formats 'YYYY-MM-DD' into a friendly label and badge status
 */
function formatDueDate(dueDate, completed) {
  if (!dueDate) return null;
  const status = getDueDateStatus(dueDate, completed);
  
  const parts = dueDate.split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  const dateObj = new Date(year, month - 1, day);
  const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  if (completed) {
    return {
      statusClass: 'due-upcoming',
      label: `Due ${formattedDate}`,
      isOverdue: false
    };
  }

  if (status === 'overdue') {
    return {
      statusClass: 'due-overdue',
      label: `Overdue • ${formattedDate}`,
      isOverdue: true
    };
  } else if (status === 'today') {
    return {
      statusClass: 'due-today',
      label: 'Due today',
      isOverdue: false
    };
  } else {
    return {
      statusClass: 'due-upcoming',
      label: `Due ${formattedDate}`,
      isOverdue: false
    };
  }
}

// ----------------------------------------------------------------------------
// 7. Render Function (The Heart of the UI)
// ----------------------------------------------------------------------------

function render() {
  // 1. Calculate Statistics
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const activeCount = totalCount - completedCount;

  // Update Badges
  filterBadges.all.textContent = totalCount;
  filterBadges.active.textContent = activeCount;
  filterBadges.completed.textContent = completedCount;

  // Update Progress Card
  progressText.textContent = `${completedCount} of ${totalCount} completed`;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  progressFill.style.width = `${percent}%`;

  // Update Footer summary
  footerStatusText.textContent = `${activeCount} ${activeCount === 1 ? 'task' : 'tasks'} remaining`;

  // Enable/Disable "Clear Completed" button
  clearCompletedBtn.disabled = completedCount === 0;

  // 2. Filter tasks for current view (combining status filter + category filter)
  let visibleTasks = tasks;
  if (currentFilter === 'active') {
    visibleTasks = visibleTasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    visibleTasks = visibleTasks.filter(t => t.completed);
  }

  if (currentCategoryFilter !== 'all') {
    visibleTasks = visibleTasks.filter(t => (t.category || 'Personal') === currentCategoryFilter);
  }

  // 3. Render Empty State or Task List
  if (visibleTasks.length === 0) {
    taskList.innerHTML = '';
    emptyState.style.display = 'flex';

    if (totalCount === 0) {
      emptyTitle.textContent = 'No tasks yet!';
      emptyDesc.textContent = 'Type a task above and press Enter or click Add Task to get started.';
    } else if (currentCategoryFilter !== 'all') {
      const filterName = currentFilter === 'all' ? '' : `${currentFilter} `;
      emptyTitle.textContent = `No ${filterName}${currentCategoryFilter} tasks`;
      emptyDesc.textContent = `There are no ${filterName}tasks found in the "${currentCategoryFilter}" category.`;
    } else if (currentFilter === 'active') {
      emptyTitle.textContent = 'All caught up!';
      emptyDesc.textContent = 'You have completed all your active tasks. Awesome work!';
    } else if (currentFilter === 'completed') {
      emptyTitle.textContent = 'No completed tasks yet';
      emptyDesc.textContent = 'Complete some tasks from your list to see them showcased here.';
    }
  } else {
    emptyState.style.display = 'none';

    // Build task HTML items
    const isEditing = (id) => id === editingTaskId;

    taskList.innerHTML = visibleTasks.map(task => {
      const editing = isEditing(task.id);
      const dueInfo = task.dueDate ? formatDueDate(task.dueDate, task.completed) : null;
      const isOverdue = dueInfo ? dueInfo.isOverdue : false;
      const category = task.category || 'Personal';
      const categoryIcon = CATEGORY_ICONS[category] || '📌';
      const categoryClass = `category-${category.toLowerCase()}`;

      // Determine which body content to show: edit inputs or static title & meta
      const bodyHTML = editing
        ? `<input
             type="text"
             class="edit-input"
             maxlength="120"
             aria-label="Edit task title"
           />
           <div class="edit-meta-row">
             <select class="edit-category-select" aria-label="Edit task category" title="Edit category">
               <option value="Personal">👤 Personal</option>
               <option value="Study">📚 Study</option>
               <option value="Coding">💻 Coding</option>
               <option value="Work">💼 Work</option>
             </select>
             <input
               type="date"
               class="edit-date-input"
               aria-label="Edit due date"
               title="Edit due date"
             />
             <button
               type="button"
               class="btn-clear-date"
               data-action="clear-edit-date"
               aria-label="Remove due date"
               title="Remove due date"
             >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                 <line x1="18" y1="6" x2="6" y2="18"></line>
                 <line x1="6" y1="6" x2="18" y2="18"></line>
               </svg>
             </button>
           </div>`
        : `<span class="task-title">${escapeHtml(task.text)}</span>
           <div class="task-meta">
             <span class="category-badge ${categoryClass}">
               <span>${categoryIcon}</span>
               <span>${category}</span>
             </span>
             <span class="task-time">${formatTime(task.createdAt)}</span>
             ${dueInfo ? `
               <span class="due-badge ${dueInfo.statusClass}">
                 <svg class="due-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                   <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                   <line x1="16" y1="2" x2="16" y2="6"></line>
                   <line x1="8" y1="2" x2="8" y2="6"></line>
                   <line x1="3" y1="10" x2="21" y2="10"></line>
                 </svg>
                 <span>${dueInfo.label}</span>
               </span>
             ` : ''}
           </div>`;

      // Determine which action buttons to show
      const actionsHTML = editing
        ? `<div class="edit-actions">
             <button
               type="button"
               class="btn-save-edit"
               data-action="save-edit"
               aria-label="Save edit"
               title="Save changes"
             >
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                 <polyline points="20 6 9 17 4 12"></polyline>
               </svg>
             </button>
             <button
               type="button"
               class="btn-cancel-edit"
               data-action="cancel-edit"
               aria-label="Cancel edit"
               title="Discard changes"
             >
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                 <line x1="18" y1="6" x2="6" y2="18"></line>
                 <line x1="6" y1="6" x2="18" y2="18"></line>
               </svg>
             </button>
           </div>`
        : `<button
             type="button"
             class="btn-edit"
             data-action="edit"
             aria-label="Edit task: ${escapeHtml(task.text)}"
             title="Edit task"
           >
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
             </svg>
           </button>
           <button
             type="button"
             class="btn-delete"
             data-action="delete"
             aria-label="Delete task: ${escapeHtml(task.text)}"
             title="Delete task"
           >
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <polyline points="3 6 5 6 21 6"></polyline>
               <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
             </svg>
           </button>`;

      return `
      <li class="task-item ${task.completed ? 'completed' : ''} ${editing ? 'editing' : ''} ${isOverdue ? 'overdue' : ''}" data-id="${task.id}">
        <!-- Toggle Completion Checkbox Button -->
        <button
          type="button"
          class="checkbox-btn"
          data-action="toggle"
          aria-label="${task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}"
          title="${task.completed ? 'Mark as active' : 'Mark as completed'}"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>

        <!-- Task Body (Text & Details) -->
        <div class="task-body">
          ${bodyHTML}
        </div>

        <!-- Action Buttons -->
        ${actionsHTML}
      </li>`;
    }).join('');

    // Safe value injection: set edit inputs via DOM property (not innerHTML)
    if (editingTaskId) {
      const editInput = taskList.querySelector('.edit-input');
      const editDateInput = taskList.querySelector('.edit-date-input');
      const editCategorySelect = taskList.querySelector('.edit-category-select');
      const editingTask = tasks.find(t => t.id === editingTaskId);
      if (editInput && editingTask) {
        editInput.value = editingTask.text;
      }
      if (editDateInput && editingTask) {
        editDateInput.value = editingTask.dueDate || '';
      }
      if (editCategorySelect && editingTask) {
        editCategorySelect.value = editingTask.category || 'Personal';
      }
    }
  }
}

/**
 * Escapes unsafe HTML characters to prevent XSS (Cross-Site Scripting) vulnerabilities.
 * A crucial security habit in Computer Science!
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ----------------------------------------------------------------------------
// 8. Event Listeners & Delegation
// ----------------------------------------------------------------------------

// Form Submit: Handles adding a new task
taskForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Prevents the browser from reloading the page
  const text = taskInput.value;
  const dueDate = dueDateInput ? dueDateInput.value : null;
  const category = categorySelect ? categorySelect.value : 'Personal';
  if (text.trim()) {
    addTask(text, dueDate, category);
    taskInput.value = '';
    if (dueDateInput) {
      dueDateInput.value = '';
    }
    if (categorySelect) {
      categorySelect.value = 'Personal';
    }
    taskInput.focus();
  }
});

// Category Filter Bar: Delegation on category buttons
if (categoryFilterBar) {
  categoryFilterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-filter-btn');
    if (!btn) return;
    const cat = btn.dataset.category;
    if (cat) {
      setCategoryFilter(cat);
    }
  });
}

// Filter Tabs: Click handlers
Object.keys(filterBtns).forEach(key => {
  filterBtns[key].addEventListener('click', () => {
    setFilter(key);
  });
});

// Clear Completed Button
clearCompletedBtn.addEventListener('click', () => {
  clearCompleted();
});

/**
 * Event Delegation on the Task List:
 * Instead of adding individual click listeners to every single task item or button,
 * we place a single listener on the parent `<ul>`.
 * When a click bubbles up, we inspect `data-action` to see what was clicked!
 */
taskList.addEventListener('click', (e) => {
  const actionBtn = e.target.closest('[data-action]');
  if (!actionBtn) return;

  const taskItem = actionBtn.closest('.task-item');
  if (!taskItem) return;

  const taskId = taskItem.dataset.id;
  const action = actionBtn.dataset.action;

  if (action === 'toggle') {
    toggleTask(taskId);
  } else if (action === 'delete') {
    deleteTask(taskId);
  } else if (action === 'edit') {
    startEdit(taskId);
  } else if (action === 'save-edit') {
    saveEdit(taskId);
  } else if (action === 'cancel-edit') {
    cancelEdit();
  } else if (action === 'clear-edit-date') {
    const editDateInput = taskItem.querySelector('.edit-date-input');
    if (editDateInput) {
      editDateInput.value = '';
      editDateInput.focus();
    }
  }
});

// Keyboard support inside edit inputs: Enter = save, Escape = cancel
taskList.addEventListener('keydown', (e) => {
  if (!editingTaskId) return;
  const editInput = e.target.closest('.edit-input, .edit-date-input, .edit-category-select');
  if (!editInput) return;

  if (e.key === 'Enter') {
    e.preventDefault();
    saveEdit(editingTaskId);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    cancelEdit();
  }
});

// ----------------------------------------------------------------------------
// 9. Initial App Boot
// ----------------------------------------------------------------------------
// Render the initial UI right away
render();
