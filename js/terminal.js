/**
 * Subsurface Interactive Terminal for Obsidian Productivity Hub
 */
class SubsurfaceTerminal {
  constructor() {
    this.commands = [
      'todo',
      'pomodoro',
      'stats',
      'video',
      'quote',
      'tasks',
      'timer',
      'focus',
      'analytics',
      'lecture',
      'about',
      'projects',
      'skills',
      'research',
      'github',
      'blogs',
      'guestbook',
      'contact',
      'help',
      'clear',
      'matrix'
    ];
    this.history = [];
    this.historyIndex = -1;
    this.$input = $('#terminal-input');
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    this.$input.on('keydown', (e) => {
      if (e.key === 'Enter') {
        const rawInput = this.$input.val().trim();
        if (rawInput) {
          this.executeCommand(rawInput);
          this.history.push(rawInput);
          this.historyIndex = this.history.length;
          this.$input.val('');
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.$input.val(this.history[this.historyIndex]);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.$input.val(this.history[this.historyIndex]);
        } else {
          this.historyIndex = this.history.length;
          this.$input.val('');
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const currentVal = this.$input.val().trim().toLowerCase();
        if (currentVal) {
          const match = this.commands.find(cmd => cmd.startsWith(currentVal));
          if (match) {
            this.$input.val(match);
          }
        }
      }
    });

    $(document).on('click', '.terminal-cmd-item', (e) => {
      const cmd = $(e.currentTarget).data('cmd');
      if (cmd) {
        this.executeCommand(cmd);
      }
    });
  }

  async executeCommand(rawCommand) {
    try {
      if (window.audioSynth && typeof window.audioSynth.playClick === 'function') {
        window.audioSynth.playClick();
      }
    } catch (e) {}

    const parts = rawCommand.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    const fullArg = parts.slice(1).join(' ');

    switch(cmd) {
      // 1. TODO / TASKS
      case 'todo':
      case 'tasks':
      case 'task':
        if (args.length > 0) {
          const sub = args[0].toLowerCase();
          if (sub === 'add') {
            const taskTitle = parts.slice(2).join(' ');
            if (taskTitle && window.productivityDB) {
              await window.productivityDB.addTask(taskTitle);
              if (window.todoManager) await window.todoManager.loadTasks();
            }
          } else if (sub === 'clear') {
            if (window.productivityDB && window.todoManager) {
              const comp = window.todoManager.tasks.filter(t => t.completed);
              for (const t of comp) await window.productivityDB.deleteTask(t.id);
              await window.todoManager.loadTasks();
            }
          }
        }
        if (window.contentManager) window.contentManager.showView('todo');
        break;

      // 2. POMODORO / TIMER / FOCUS
      case 'pomodoro':
      case 'timer':
      case 'focus':
        if (args.length > 0) {
          const sub = args[0].toLowerCase();
          const parsedMins = parseInt(sub);
          if (!isNaN(parsedMins) && parsedMins > 0) {
            if (window.pomodoroTimer) {
              window.pomodoroTimer.setCustomDuration(parsedMins);
              window.pomodoroTimer.start();
            }
          } else if (sub === 'start') {
            if (window.pomodoroTimer) window.pomodoroTimer.start();
          } else if (sub === 'pause' || sub === 'stop') {
            if (window.pomodoroTimer) window.pomodoroTimer.pause();
          } else if (sub === 'reset') {
            if (window.pomodoroTimer) window.pomodoroTimer.reset();
          } else if (sub === 'break') {
            if (window.pomodoroTimer) window.pomodoroTimer.switchMode('short_break');
          }
        }
        if (window.contentManager) window.contentManager.showView('pomodoro');
        break;

      // 3. STATS / ANALYTICS
      case 'stats':
      case 'analytics':
      case 'telemetry':
        if (args.length > 0) {
          const scale = args[0].toLowerCase();
          if (['day', 'week', 'month', 'year'].includes(scale) && window.statsDashboard) {
            window.statsDashboard.switchScale(scale);
          }
        }
        if (window.contentManager) window.contentManager.showView('stats');
        break;

      // 4. VIDEO / LECTURE / STUDY
      case 'video':
      case 'lecture':
      case 'study':
      case 'yt':
        if (fullArg && window.videoWorkspace) {
          const vidId = window.videoWorkspace.extractYouTubeId(fullArg);
          if (vidId) {
            window.videoWorkspace.loadVideo(vidId, fullArg);
          }
        }
        if (window.contentManager) window.contentManager.showView('video');
        break;

      // 5. QUOTE / DAILY / WISDOM
      case 'quote':
      case 'quotes':
      case 'daily':
      case 'wisdom':
        if (args.length > 0 && args[0].toLowerCase() === 'next') {
          if (window.quoteSystem) window.quoteSystem.getRandomQuote();
        }
        if (window.contentManager) window.contentManager.showView('quote');
        break;

      // PORTFOLIO COMMANDS
      case 'about':
      case 'projects':
      case 'skills':
      case 'research':
      case 'github':
      case 'blogs':
      case 'guestbook':
      case 'contact':
      case 'help':
        if (window.contentManager) {
          window.contentManager.showView(cmd);
        }
        break;

      case 'clear':
        $('.subsurface-view').removeClass('active');
        $('#view-idle').addClass('active');
        try {
          if (window.liquidMirror && typeof window.liquidMirror.triggerCommandShockwave === 'function') {
            window.liquidMirror.triggerCommandShockwave();
          }
        } catch (e) {}
        break;

      case 'matrix':
        if (window.toggleMatrixRain) {
          window.toggleMatrixRain();
        }
        break;

      default:
        this.showError(`Command not recognized: "${rawCommand}". Type 'help' for directory.`);
        break;
    }
  }

  showError(msg) {
    this.$input.val(msg);
    setTimeout(() => {
      this.$input.val('');
    }, 2500);
  }
}

$(document).ready(() => {
  window.subsurfaceTerminal = new SubsurfaceTerminal();
});