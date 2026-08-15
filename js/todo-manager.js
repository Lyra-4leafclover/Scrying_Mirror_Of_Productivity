/**
 * Obsidian Luxury Todo & Task Manager Engine
 * Instant-response task creation, priority indicators, category filtering, and pomodoro focus linking
 */
class TodoManager {
  constructor() {
    this.tasks = [];
    this.currentFilter = 'all';
    this.currentCategory = 'all';
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadTasks();
  }

  bindEvents() {
    // Add task form submission
    $(document).on('submit', '#todo-add-form', (e) => {
      e.preventDefault();
      this.executeAddTask();
    });

    // Add task button click
    $(document).on('click', '.todo-add-btn', (e) => {
      e.preventDefault();
      this.executeAddTask();
    });

    // Keydown Enter on input
    $(document).on('keydown', '#todo-input-title', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.executeAddTask();
      }
    });

    // Toggle task complete
    $(document).on('click', '.todo-checkbox', (e) => {
      const taskId = $(e.currentTarget).closest('.todo-item').data('id');
      if (taskId && window.productivityDB) {
        const updated = window.productivityDB.toggleTask(taskId);
        if (updated && updated.completed) {
          if (window.audioSynth) window.audioSynth.playTaskComplete();
        } else {
          if (window.audioSynth) window.audioSynth.playClick();
        }
        this.loadTasks();
        if (window.statsDashboard) window.statsDashboard.refreshCurrentView();
      }
    });

    // Delete task
    $(document).on('click', '.todo-delete-btn', (e) => {
      e.stopPropagation();
      const taskId = $(e.currentTarget).closest('.todo-item').data('id');
      if (taskId && window.productivityDB) {
        window.productivityDB.deleteTask(taskId);
        if (window.audioSynth) window.audioSynth.playKeyTick();
        this.loadTasks();
        if (window.statsDashboard) window.statsDashboard.refreshCurrentView();
      }
    });

    // Link to Pomodoro Focus
    $(document).on('click', '.todo-focus-btn', (e) => {
      e.stopPropagation();
      const $item = $(e.currentTarget).closest('.todo-item');
      const taskId = $item.data('id');
      const taskTitle = $item.find('.todo-title-text').text();

      if (window.pomodoroTimer) {
        window.pomodoroTimer.attachTask(taskId, taskTitle);
      }
      if (window.contentManager) {
        window.contentManager.showView('pomodoro');
      }
      if (window.audioSynth) window.audioSynth.playPomodoroStart();
    });

    // Filter by Status (All / Active / Completed)
    $(document).on('click', '.todo-filter-btn', (e) => {
      $('.todo-filter-btn').removeClass('active');
      $(e.currentTarget).addClass('active');
      this.currentFilter = $(e.currentTarget).data('filter');
      this.renderTasks();
      if (window.audioSynth) window.audioSynth.playClick();
    });

    // Filter by Category Pill
    $(document).on('click', '.todo-cat-pill', (e) => {
      $('.todo-cat-pill').removeClass('active');
      $(e.currentTarget).addClass('active');
      this.currentCategory = $(e.currentTarget).data('category');
      this.renderTasks();
      if (window.audioSynth) window.audioSynth.playClick();
    });

    // Clear completed tasks
    $(document).on('click', '#todo-clear-completed-btn', () => {
      if (window.productivityDB) {
        const completedTasks = this.tasks.filter(t => t.completed);
        for (const t of completedTasks) {
          window.productivityDB.deleteTask(t.id);
        }
        this.loadTasks();
        if (window.audioSynth) window.audioSynth.playClick();
      }
    });
  }

  executeAddTask() {
    const $input = $('#todo-input-title');
    const title = $input.val().trim();
    const category = $('#todo-select-cat').val() || 'Deep Work';
    const priority = $('#todo-select-pri').val() || 'Medium';
    const pomodoros = parseInt($('#todo-input-pomo').val()) || 1;

    if (!title) {
      $input.focus();
      return;
    }

    if (window.productivityDB) {
      window.productivityDB.addTask(title, category, priority, pomodoros);
      $input.val('');
      this.loadTasks();
      if (window.audioSynth) window.audioSynth.playClick();
      if (window.statsDashboard) window.statsDashboard.refreshCurrentView();
    }
  }

  loadTasks() {
    if (window.productivityDB) {
      this.tasks = window.productivityDB.getTasks();
      this.renderTasks();
      this.updateProgressMetrics();
    }
  }

  renderTasks() {
    const $container = $('#todo-items-list');
    if (!$container.length) return;

    let filtered = [...this.tasks];

    // Status filter
    if (this.currentFilter === 'active') {
      filtered = filtered.filter(t => !t.completed);
    } else if (this.currentFilter === 'completed') {
      filtered = filtered.filter(t => t.completed);
    }

    // Category filter
    if (this.currentCategory !== 'all') {
      filtered = filtered.filter(t => (t.category || '').toLowerCase() === this.currentCategory.toLowerCase());
    }

    // Sort: uncompleted first, then by priority (High -> Medium -> Low), then creation date
    const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
    filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const priDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
      if (priDiff !== 0) return priDiff;
      return b.createdAt - a.createdAt;
    });

    if (filtered.length === 0) {
      $container.html(`
        <div class="todo-empty-state">
          <div class="empty-glyph">✧</div>
          <p>No tasks match this filter. Clear to enter flow state or add a new objective above.</p>
        </div>
      `);
      return;
    }

    let html = '';
    filtered.forEach(task => {
      const isCompleted = task.completed;
      const priorityClass = `priority-${(task.priority || 'medium').toLowerCase()}`;
      const pomoDone = task.pomodorosDone || 0;
      const pomoGoal = task.pomodorosGoal || 1;

      html += `
        <div class="todo-item ${isCompleted ? 'is-completed' : ''}" data-id="${task.id}">
          <div class="todo-item-left">
            <div class="todo-checkbox ${isCompleted ? 'checked' : ''}">
              ${isCompleted ? '✓' : ''}
            </div>
            <div class="todo-text-wrap">
              <span class="todo-title-text">${this.escapeHtml(task.title)}</span>
              <div class="todo-meta-row">
                <span class="todo-tag-pill">${this.escapeHtml(task.category || 'General')}</span>
                <span class="todo-priority-pill ${priorityClass}">${this.escapeHtml(task.priority || 'Medium')}</span>
                <span class="todo-pomo-counter">🍅 ${pomoDone}/${pomoGoal} focus</span>
              </div>
            </div>
          </div>
          <div class="todo-item-actions">
            ${!isCompleted ? `
              <button class="todo-focus-btn" title="Start Focus Session on this task">
                <span>⚡ FOCUS</span>
              </button>
            ` : ''}
            <button class="todo-delete-btn" title="Delete Task">
              <span>&times;</span>
            </button>
          </div>
        </div>
      `;
    });

    $container.html(html);
  }

  updateProgressMetrics() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    $('#todo-stat-total').text(total);
    $('#todo-stat-completed').text(completed);
    $('#todo-stat-percent').text(`${percentage}%`);
    $('#todo-progress-bar-fill').css('width', `${percentage}%`);
  }

  escapeHtml(str) {
    return $('<div>').text(str || '').html();
  }
}

window.todoManager = new TodoManager();
