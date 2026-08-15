/**
 * Obsidian Luxury Pomodoro & Focus Engine
 * Ambient circular SVG dial, customizable modes, sound chimes, and automatic DB telemetry
 */
class PomodoroTimer {
  constructor() {
    this.mode = 'focus'; // 'focus', 'short_break', 'long_break'
    this.durations = {
      focus: 25 * 60,
      short_break: 5 * 60,
      long_break: 15 * 60
    };
    this.timeLeft = this.durations.focus;
    this.totalDuration = this.durations.focus;
    this.isRunning = false;
    this.intervalId = null;
    this.attachedTaskId = null;
    this.attachedTaskTitle = null;

    this.circleRadius = 140;
    this.circumference = 2 * Math.PI * this.circleRadius;

    this.init();
  }

  init() {
    this.bindEvents();
    this.updateDisplay();
    this.updateProgressRing();
  }

  bindEvents() {
    // Mode switcher buttons
    $(document).on('click', '.timer-mode-btn', (e) => {
      const mode = $(e.currentTarget).data('mode');
      this.switchMode(mode);
    });

    // Main Toggle (Start / Pause)
    $(document).on('click', '#pomodoro-toggle-btn', () => {
      this.toggle();
    });

    // Reset Button
    $(document).on('click', '#pomodoro-reset-btn', () => {
      this.reset();
    });

    // Skip Button
    $(document).on('click', '#pomodoro-skip-btn', () => {
      this.skip();
    });

    // Duration preset buttons (e.g. 25m, 50m, 5m, 15m)
    $(document).on('click', '.duration-preset-btn', (e) => {
      const mins = parseInt($(e.currentTarget).data('mins'));
      if (mins) {
        this.setCustomDuration(mins);
      }
    });

    // Detach task button
    $(document).on('click', '#detach-task-btn', () => {
      this.detachTask();
    });
  }

  switchMode(newMode) {
    if (this.isRunning) {
      if (!confirm("A focus session is currently running. Switch mode and reset?")) {
        return;
      }
      this.pause();
    }

    this.mode = newMode;
    $('.timer-mode-btn').removeClass('active');
    $(`.timer-mode-btn[data-mode="${newMode}"]`).addClass('active');

    this.totalDuration = this.durations[newMode];
    this.timeLeft = this.totalDuration;

    // Visual mode accents
    const $container = $('#pomodoro-card-wrapper');
    $container.removeClass('mode-focus mode-short-break mode-long-break');
    $container.addClass(`mode-${newMode.replace('_', '-')}`);

    this.updateDisplay();
    this.updateProgressRing();
    if (window.audioSynth) window.audioSynth.playClick();
  }

  setCustomDuration(minutes) {
    if (this.isRunning) this.pause();
    this.durations[this.mode] = minutes * 60;
    this.totalDuration = minutes * 60;
    this.timeLeft = this.totalDuration;
    this.updateDisplay();
    this.updateProgressRing();
    if (window.audioSynth) window.audioSynth.playClick();
  }

  attachTask(taskId, taskTitle) {
    this.attachedTaskId = taskId;
    this.attachedTaskTitle = taskTitle;
    $('#pomodoro-target-task-container').show();
    $('#pomodoro-target-task-title').text(taskTitle);
    
    // Automatically switch to focus mode and open timer
    if (this.mode !== 'focus') {
      this.switchMode('focus');
    }
  }

  detachTask() {
    this.attachedTaskId = null;
    this.attachedTaskTitle = null;
    $('#pomodoro-target-task-container').hide();
    if (window.audioSynth) window.audioSynth.playClick();
  }

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    $('#pomodoro-toggle-btn').html('<span>⏸ PAUSE</span>').addClass('btn-active-running');
    if (window.audioSynth) window.audioSynth.playPomodoroStart();

    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);

    this.updateDisplay();
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.intervalId = null;

    $('#pomodoro-toggle-btn').html('<span>▶ RESUME</span>').removeClass('btn-active-running');
    if (window.audioSynth) window.audioSynth.playKeyTick();
    this.updateDisplay();
  }

  reset() {
    this.pause();
    this.timeLeft = this.totalDuration;
    $('#pomodoro-toggle-btn').html('<span>▶ START FOCUS</span>').removeClass('btn-active-running');
    this.updateDisplay();
    this.updateProgressRing();
    if (window.audioSynth) window.audioSynth.playClick();
  }

  skip() {
    this.pause();
    if (this.mode === 'focus') {
      this.switchMode('short_break');
    } else {
      this.switchMode('focus');
    }
  }

  async tick() {
    if (this.timeLeft > 0) {
      this.timeLeft--;
      this.updateDisplay();
      this.updateProgressRing();
    } else {
      await this.completeSession();
    }
  }

  async completeSession() {
    this.pause();
    const completedMinutes = Math.round(this.totalDuration / 60);

    if (window.audioSynth) {
      window.audioSynth.playPomodoroComplete();
    }

    // Save session to IndexedDB
    if (window.productivityDB) {
      await window.productivityDB.recordPomodoroSession({
        durationMinutes: completedMinutes,
        type: this.mode,
        taskId: this.attachedTaskId,
        notes: this.attachedTaskTitle ? `Focus on: ${this.attachedTaskTitle}` : ''
      });

      // Refresh Stats dashboard in real-time
      if (window.statsDashboard) {
        window.statsDashboard.refreshCurrentView();
      }

      // Refresh Todo manager
      if (window.todoManager) {
        window.todoManager.loadTasks();
      }
    }

    // Auto-advance mode
    if (this.mode === 'focus') {
      alert(`✦ Focus Session Complete! (${completedMinutes} mins logged to Obsidian DB). Take a well-deserved break.`);
      this.switchMode('short_break');
    } else {
      alert(`✦ Break concluded. Ready to step back into the flow state?`);
      this.switchMode('focus');
    }
  }

  updateDisplay() {
    const mins = Math.floor(this.timeLeft / 60);
    const secs = this.timeLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    $('#pomodoro-time-display').text(formatted);

    // Update Top-Nav Mini HUD
    const modeLabel = this.mode === 'focus' ? 'FOCUS' : 'BREAK';
    const statusText = this.isRunning ? `⚡ [ ${modeLabel} ${formatted} ]` : `[ ${modeLabel} ${formatted} ]`;
    $('#header-timer-status').text(statusText);

    // Update document title
    if (this.isRunning) {
      document.title = `(${formatted}) ${modeLabel} — Obsidian Focus`;
    } else {
      document.title = `The Obsidian Mirror — Productivity Hub`;
    }
  }

  updateProgressRing() {
    const $ring = $('#pomodoro-progress-circle');
    if (!$ring.length) return;

    const progress = (this.totalDuration - this.timeLeft) / this.totalDuration;
    const offset = this.circumference - (progress * this.circumference);
    $ring.css('strokeDashoffset', offset);
  }
}

window.pomodoroTimer = new PomodoroTimer();
