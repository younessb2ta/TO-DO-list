document.addEventListener('DOMContentLoaded', initApp);

// Initialisation de l'application
async function initApp() {
  initTheme();
  await loadTasks();
  setupEventListeners();
}

// Gestion du thème
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.toggle('light-mode', savedTheme === 'light');
  updateThemeButton(savedTheme);
}

// Mise à jour du bouton de thème
function updateThemeButton(theme) {
  const btn = document.getElementById('themeBtn');
  btn.textContent = theme === 'light' ? '🌞' : '🌙';
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
  document.getElementById('addBtn').addEventListener('click', addTask);
  document.getElementById('themeBtn').addEventListener('click', toggleTheme);
  
  document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', handleFilter);
  });

  document.getElementById('sortSelect').addEventListener('change', handleSort);
}

// Gestion du changement de thème
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  updateThemeButton(isLight ? 'light' : 'dark');
}

// Chargement des tâches depuis le serveur
async function loadTasks() {
  try {
    const response = await fetch('http://localhost:5000/api/tasks');
    const tasks = await response.json();
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks(tasks);
    updateTaskCounter(tasks);
  } catch (error) {
    showError('Failed to load tasks. Using local storage...');
    const localTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    renderTasks(localTasks);
  }
}

// Affichage des tâches dans le DOM
function renderTasks(tasks) {
  const container = document.getElementById('taskList');
  container.innerHTML = '';

  tasks.forEach(task => {
    const taskElement = createTaskElement(task);
    container.appendChild(taskElement);
  });
}

// Création d'un élément tâche
function createTaskElement(task) {
  const taskElement = document.createElement('div');
  const priorityClass = `${task.priority.toLowerCase()}-priority`;
  const completedClass = task.completed ? 'completed' : '';
  
  taskElement.className = `task-item ${priorityClass} ${completedClass}`;
  taskElement.innerHTML = `
    <div class="task-content">
      <input type="checkbox" class="task-checkbox"
             data-id="${task.id}" ${task.completed ? 'checked' : ''}>
      <span class="task-text">${task.task_text}</span>
      <span class="priority-tag">${task.priority}</span>
      <input type="datetime-local" class="task-date-edit" hidden>
    </div>
    <span class="due-date">${new Date(task.due_date).toLocaleString()}</span>
    <div class="task-actions">
      <button class="edit-btn" data-id="${task.id}">Edit</button>
      <button class="save-btn" data-id="${task.id}" hidden>Save</button>
      <button class="delete-btn" data-id="${task.id}">Delete</button>
    </div>
  `;

  attachTaskEventListeners(taskElement, task);
  return taskElement;
}

// Ajout des écouteurs d'événements aux tâches
function attachTaskEventListeners(taskElement, task) {
  taskElement.querySelector('.task-checkbox').addEventListener('change', toggleTaskCompletion);
  taskElement.querySelector('.delete-btn').addEventListener('click', deleteTask);
  taskElement.querySelector('.edit-btn').addEventListener('click', handleEditClick);
}

// Ajout d'une nouvelle tâche
async function addTask() {
  const taskInput = document.getElementById('taskInput');
  const dueDateInput = document.getElementById('dueDate');
  const prioritySelect = document.getElementById('prioritySelect');

  if (!validateInput(taskInput, dueDateInput)) return;

  try {
    await fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: taskInput.value.trim(),
        dueDate: dueDateInput.value,
        priority: prioritySelect.value
      })
    });

    await loadTasks();
    resetInputs(taskInput, dueDateInput, prioritySelect);
  } catch (error) {
    showError('Failed to add task. Saving locally...');
    saveTaskLocally(taskInput, dueDateInput, prioritySelect);
  }
}

// Validation des entrées
function validateInput(taskInput, dueDateInput) {
  if (!taskInput.value.trim()) {
    showError('Task text is required!');
    taskInput.focus();
    return false;
  }
  if (!dueDateInput.value) {
    showError('Due date is required!');
    dueDateInput.focus();
    return false;
  }
  return true;
}

// Solution de repli avec stockage local
function saveTaskLocally(taskInput, dueDateInput, prioritySelect) {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const newTask = {
    id: Date.now(),
    task_text: taskInput.value.trim(),
    due_date: dueDateInput.value,
    priority: prioritySelect.value,
    completed: false
  };
  tasks.push(newTask);
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks(tasks);
  resetInputs(taskInput, dueDateInput, prioritySelect);
}

// Réinitialisation des champs de saisie
function resetInputs(taskInput, dueDateInput, prioritySelect) {
  taskInput.value = '';
  dueDateInput.value = '';
  prioritySelect.value = 'Medium';
}

// Basculer l'état d'une tâche
async function toggleTaskCompletion(event) {
  const taskId = event.target.dataset.id;
  const completed = event.target.checked;

  try {
    await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });
    await loadTasks();
  } catch (error) {
    showError('Failed to update task status. Updating locally...');
    updateTaskLocally(taskId, completed);
  }
}

// Suppression d'une tâche
async function deleteTask(event) {
  const taskId = event.target.dataset.id;
  
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
      method: 'DELETE'
    });
    await loadTasks();
  } catch (error) {
    showError('Failed to delete task. Removing locally...');
    deleteTaskLocally(taskId);
  }
}

// Gestion de l'édition d'une tâche
function handleEditClick(event) {
  const taskId = event.target.dataset.id;
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const task = tasks.find(t => t.id == taskId);
  if (!task) return;

  const taskElement = event.target.closest('.task-item');
  enterEditMode(taskElement, task);
}

// Passage en mode édition
function enterEditMode(taskElement, task) {
  const textSpan = taskElement.querySelector('.task-text');
  const dateSpan = taskElement.querySelector('.due-date');
  const priorityTag = taskElement.querySelector('.priority-tag');
  
  // Create editable inputs
  const textInput = createTextInput(textSpan.textContent);
  const dateInput = createDateInput(task.due_date);
  const prioritySelect = createPrioritySelect(task.priority);

  // Replace elements with inputs
  textSpan.replaceWith(textInput);
  dateSpan.replaceWith(dateInput);
  priorityTag.replaceWith(prioritySelect);
  
  // Toggle buttons
  const editBtn = taskElement.querySelector('.edit-btn');
  const saveBtn = taskElement.querySelector('.save-btn');
  const deleteBtn = taskElement.querySelector('.delete-btn');
  editBtn.hidden = true;
  saveBtn.hidden = false;
  deleteBtn.disabled = true;

  // Handle save
  saveBtn.addEventListener('click', () => 
    saveEditedTask(task, textInput, dateInput, prioritySelect, taskElement));
  
  // Handle Enter/Escape
  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEditedTask(task, textInput, dateInput, prioritySelect, taskElement);
    if (e.key === 'Escape') exitEditMode(taskElement, textSpan, dateSpan, priorityTag);
  });
}

// Sauvegarde d'une tâche modifiée
async function saveEditedTask(task, textInput, dateInput, prioritySelect, taskElement) {
  const newText = textInput.value.trim();
  const newDate = dateInput.value;
  const newPriority = prioritySelect.value;

  if (!newText || !newDate) {
    showError('Task text and date are required!');
    return;
  }

  try {
    await fetch(`http://localhost:5000/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: newText,
        dueDate: newDate,
        priority: newPriority
      })
    });
    await loadTasks();
  } catch (error) {
    showError('Failed to save changes. Updating locally...');
    updateTaskLocally(task.id, newText, newDate, newPriority);
    exitEditMode(taskElement);
  }
}

// Mise à jour locale des tâches
function updateTaskLocally(taskId, completed) {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const updatedTasks = tasks.map(task => 
    task.id == taskId ? { ...task, completed } : task
  );
  localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  renderTasks(updatedTasks);
}

// Gestion des filtres et tris
function handleFilter(event) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  const filter = event.target.dataset.filter;
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return filter === 'completed' ? task.completed : !task.completed;
  });
  
  renderTasks(filteredTasks);
}

function handleSort(event) {
  const sortBy = event.target.value;
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const sortedTasks = sortTasks(tasks, sortBy);
  renderTasks(sortedTasks);
}

// Logique de tri
// Logique alternative de tri
function sortTasks(tasks, sortBy) {
  const priorityOrder = { High: 1, Medium: 2, Low: 3 };
  
  return [...tasks].sort((a, b) => {
    if (sortBy === 'priority') {
      return priorityOrder[a.priority] - priorityOrder[b.priority] ||
             new Date(a.due_date) - new Date(b.due_date);
    }
    if (sortBy === 'date') {
      return new Date(a.due_date) - new Date(b.due_date) ||
             a.task_text.localeCompare(b.task_text);
    }
    return a.task_text.toLowerCase().localeCompare(b.task_text.toLowerCase());
  });
}

// Aides pour l'interface utilisateur
function createTextInput(value) {
  const input = document.createElement('input');
  input.className = 'edit-input';
  input.value = value;
  return input;
}

function createDateInput(dateValue) {
  const input = document.createElement('input');
  input.type = 'datetime-local';
  input.className = 'task-date-edit';
  input.value = new Date(dateValue).toISOString().slice(0, 16);
  return input;
}

function createPrioritySelect(currentPriority) {
  const select = document.createElement('select');
  select.className = 'edit-priority';
  select.innerHTML = `
    <option value="High" ${currentPriority === 'High' ? 'selected' : ''}>High</option>
    <option value="Medium" ${currentPriority === 'Medium' ? 'selected' : ''}>Medium</option>
    <option value="Low" ${currentPriority === 'Low' ? 'selected' : ''}>Low</option>
  `;
  return select;
}

function exitEditMode(taskElement) {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const currentFilter = document.querySelector('.filter-btn.active').dataset.filter;
  const currentSort = document.getElementById('sortSelect').value;
  renderTasks(sortTasks(tasks, currentSort).filter(t => 
    currentFilter === 'all' ? true :
    currentFilter === 'completed' ? t.completed : !t.completed
  ));
}

// Mise à jour du compteur de tâches
function updateTaskCounter(tasks) {
  const total = tasks.length;
  const remaining = tasks.filter(task => !task.completed).length;
  document.getElementById('counterText').textContent = 
    `${remaining}/${total} tasks remaining`;
}

// Affichage d'un message d'erreur
function showError(message) {
  alert(message);
}
function sortTasks(tasks, sortBy) {
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    return tasks.sort((a, b) => {
      if (sortBy === 'priority') {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // Existing sorting logic
    });
  }