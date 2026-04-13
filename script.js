const taskList = document.getElementById("taskList");
const deadlineList = document.getElementById("deadlineList");
const notesList = document.getElementById("notesList");

const totalTasksEl = document.getElementById("totalTasks");
const completedTasksEl = document.getElementById("completedTasks");
const pendingTasksEl = document.getElementById("pendingTasks");
const focusScoreEl = document.getElementById("focusScore");

const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");

const openPanelBtn = document.getElementById("openPanelBtn");
const closePanelBtn = document.getElementById("closePanelBtn");
const cancelBtn = document.getElementById("cancelBtn");
const overlay = document.getElementById("overlay");
const taskPanel = document.getElementById("taskPanel");
const panelTitle = document.getElementById("panelTitle");
const submitBtn = document.getElementById("submitBtn");

const taskForm = document.getElementById("taskForm");
const taskIdInput = document.getElementById("taskId");
const taskTitleInput = document.getElementById("taskTitle");
const taskDateInput = document.getElementById("taskDate");
const taskNoteInput = document.getElementById("taskNote");

const focusModeBtn = document.getElementById("focusModeBtn");
const emptyState = document.getElementById("emptyState");

const STORAGE_KEY = "student_life_planner_tasks";
const FOCUS_KEY = "student_life_planner_focus_mode";

let currentFilter = "all";
let focusMode = JSON.parse(localStorage.getItem(FOCUS_KEY)) || false;

function getFutureDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

const starterTasks = [
  {
    id: Date.now() + 1,
    title: "Advanced Macroeconomics Review",
    dueDate: getFutureDate(2),
    note: "Finish chapter 4 practice problems and review class notes.",
    completed: false
  },
  {
    id: Date.now() + 2,
    title: "Dissertation Methodology",
    dueDate: getFutureDate(4),
    note: "Draft interview questions for qualitative research.",
    completed: false
  },
  {
    id: Date.now() + 3,
    title: "Research Paper Outline",
    dueDate: getFutureDate(1),
    note: "Complete the introduction and list academic sources.",
    completed: false
  },
  {
    id: Date.now() + 4,
    title: "Organic Chemistry Notes",
    dueDate: getFutureDate(-1),
    note: "Revise formulas and reaction symbols before lab test.",
    completed: true
  }
];

let tasks = loadTasks();

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(starterTasks));
    return starterTasks;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : starterTasks;
  } catch (error) {
    return starterTasks;
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function saveFocusMode() {
  localStorage.setItem(FOCUS_KEY, JSON.stringify(focusMode));
}

function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDaysLeft(dateString) {
  const today = normalizeDate(new Date());
  const due = normalizeDate(new Date(`${dateString}T00:00:00`));
  const diff = due - today;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getStatus(task) {
  if (task.completed) return "Completed";
  if (getDaysLeft(task.dueDate) < 0) return "Overdue";
  return "Pending";
}

function getDeadlineText(task) {
  const daysLeft = getDaysLeft(task.dueDate);

  if (task.completed) return "Finished";
  if (daysLeft < 0) return `${Math.abs(daysLeft)} day late`;
  if (daysLeft === 0) return "Due today";
  if (daysLeft === 1) return "In 1 day";
  return `In ${daysLeft} days`;
}

function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sortByDate(list) {
  return [...list].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

function getVisibleTasks() {
  const searchValue = searchInput.value.trim().toLowerCase();

  return sortByDate(tasks).filter((task) => {
    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "completed" && task.completed) ||
      (currentFilter === "pending" && !task.completed);

    const matchesSearch =
      task.title.toLowerCase().includes(searchValue) ||
      task.note.toLowerCase().includes(searchValue);

    return matchesFilter && matchesSearch;
  });
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;

  totalTasksEl.textContent = total;
  completedTasksEl.textContent = completed;
  pendingTasksEl.textContent = pending;

  const score = total === 0 ? 0 : Math.round((completed / total) * 100);
  focusScoreEl.textContent = `${score}%`;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();

  if (visibleTasks.length === 0) {
    taskList.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  taskList.innerHTML = visibleTasks
    .map((task) => {
      const status = getStatus(task);
      const deadlineText = getDeadlineText(task);

      let statusTagClass = "tag-status";
      let cardClass = "";

      if (status === "Completed") {
        statusTagClass = "tag-completed";
        cardClass = "completed";
      } else if (status === "Overdue") {
        statusTagClass = "tag-overdue";
        cardClass = "overdue";
      }

      return `
        <article class="task-card ${cardClass}">
          <div class="task-card-top">
            <div>
              <p class="task-date">Due ${escapeHTML(formatDate(task.dueDate))}</p>
              <h3 class="task-title">${escapeHTML(task.title)}</h3>
            </div>
          </div>

          <p class="task-note">${escapeHTML(task.note || "No study note added.")}</p>

          <div class="task-tags">
            <span class="task-tag ${statusTagClass}">${escapeHTML(status)}</span>
            <span class="task-tag tag-deadline">${escapeHTML(deadlineText)}</span>
          </div>

          <div class="task-actions">
            <button class="small-btn complete" data-action="toggle" data-id="${task.id}">
              ${task.completed ? "Mark Pending" : "Mark Complete"}
            </button>
            <button class="small-btn edit" data-action="edit" data-id="${task.id}">Edit</button>
            <button class="small-btn delete" data-action="delete" data-id="${task.id}">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderDeadlines() {
  const upcoming = sortByDate(tasks.filter((task) => !task.completed)).slice(0, 4);

  if (upcoming.length === 0) {
    deadlineList.innerHTML = `
      <div class="deadline-item normal">
        <div class="deadline-title">No upcoming deadlines</div>
        <div class="deadline-date">Add pending tasks to see them here.</div>
      </div>
    `;
    return;
  }

  deadlineList.innerHTML = upcoming
    .map((task) => {
      const daysLeft = getDaysLeft(task.dueDate);
      const itemClass = daysLeft < 0 ? "overdue" : "normal";

      return `
        <div class="deadline-item ${itemClass}">
          <div class="deadline-item-top">
            <div>
              <div class="deadline-title">${escapeHTML(task.title)}</div>
              <div class="deadline-date">${escapeHTML(formatDate(task.dueDate))} • ${escapeHTML(getDeadlineText(task))}</div>
            </div>
            <span class="deadline-dot"></span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderNotes() {
  const noteTasks = tasks.filter((task) => task.note.trim()).slice(0, 4);

  if (noteTasks.length === 0) {
    notesList.innerHTML = `
      <div class="note-item">
        <div class="note-title">No notes yet</div>
        <div class="note-text">Your study notes will appear here.</div>
      </div>
    `;
    return;
  }

  notesList.innerHTML = noteTasks
    .map((task) => {
      const shortText =
        task.note.length > 70 ? `${task.note.slice(0, 70)}...` : task.note;

      return `
        <div class="note-item">
          <div class="note-title">${escapeHTML(task.title)}</div>
          <div class="note-text">${escapeHTML(shortText)}</div>
        </div>
      `;
    })
    .join("");
}

function renderAll() {
  updateStats();
  renderTasks();
  renderDeadlines();
  renderNotes();
  updateFilterButtons();
  updateFocusModeUI();
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === currentFilter);
  });
}

function resetForm() {
  taskForm.reset();
  taskIdInput.value = "";
  panelTitle.textContent = "Add New Task";
  submitBtn.textContent = "Save Task";
}

function openPanel(task = null) {
  if (task) {
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDateInput.value = task.dueDate;
    taskNoteInput.value = task.note;
    panelTitle.textContent = "Edit Task";
    submitBtn.textContent = "Update Task";
  } else {
    resetForm();
  }

  taskPanel.classList.add("open");
  overlay.classList.add("show");
  document.body.classList.add("no-scroll");
  taskPanel.setAttribute("aria-hidden", "false");
}

function closePanel() {
  taskPanel.classList.remove("open");
  overlay.classList.remove("show");
  document.body.classList.remove("no-scroll");
  taskPanel.setAttribute("aria-hidden", "true");
  resetForm();
}

function addTask(title, dueDate, note) {
  const newTask = {
    id: Date.now(),
    title,
    dueDate,
    note,
    completed: false
  };

  tasks.push(newTask);
  saveTasks();
  renderAll();
}

function updateTask(id, title, dueDate, note) {
  tasks = tasks.map((task) =>
    task.id === id
      ? { ...task, title, dueDate, note }
      : task
  );

  saveTasks();
  renderAll();
}

function deleteTask(id) {
  const confirmed = confirm("Do you want to delete this task?");
  if (!confirmed) return;

  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderAll();
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );

  saveTasks();
  renderAll();
}

function updateFocusModeUI() {
  document.body.classList.toggle("focus-mode", focusMode);
  focusModeBtn.textContent = `Focus Mode: ${focusMode ? "On" : "Off"}`;
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const id = Number(taskIdInput.value);
  const title = taskTitleInput.value.trim();
  const dueDate = taskDateInput.value;
  const note = taskNoteInput.value.trim();

  if (!title || !dueDate) return;

  if (id) {
    updateTask(id, title, dueDate, note);
  } else {
    addTask(title, dueDate, note);
  }

  closePanel();
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = Number(button.dataset.id);

  if (action === "toggle") {
    toggleTask(id);
  }

  if (action === "edit") {
    const task = tasks.find((item) => item.id === id);
    if (task) openPanel(task);
  }

  if (action === "delete") {
    deleteTask(id);
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    renderAll();
  });
});

searchInput.addEventListener("input", renderAll);

openPanelBtn.addEventListener("click", () => openPanel());
closePanelBtn.addEventListener("click", closePanel);
cancelBtn.addEventListener("click", closePanel);
overlay.addEventListener("click", closePanel);

focusModeBtn.addEventListener("click", () => {
  focusMode = !focusMode;
  saveFocusMode();
  updateFocusModeUI();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePanel();
});

renderAll();