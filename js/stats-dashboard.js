/**
 * Obsidian Multi-Timescale Productivity Stats Engine
 * 100% Real-Data telemetry synced with actual Pomodoro sessions and completed directives
 */
class StatsDashboard {
  constructor() {
    this.currentScale = 'day';
    this.selectedYear = new Date().getFullYear();
    this.selectedMonth = new Date().getMonth() + 1; // 1-12
    this.init();
  }

  init() {
    this.bindEvents();
    this.refreshCurrentView();
  }

  bindEvents() {
    // Timescale tabs (Day / Week / Month / Year)
    $(document).on('click', '.stats-scale-tab', (e) => {
      const scale = $(e.currentTarget).data('scale');
      this.switchScale(scale);
    });

    // Month navigation
    $(document).on('click', '#stats-month-prev', () => {
      this.selectedMonth--;
      if (this.selectedMonth < 1) {
        this.selectedMonth = 12;
        this.selectedYear--;
      }
      this.renderMonthView();
    });

    $(document).on('click', '#stats-month-next', () => {
      this.selectedMonth++;
      if (this.selectedMonth > 12) {
        this.selectedMonth = 1;
        this.selectedYear++;
      }
      this.renderMonthView();
    });

    // Export DB Backup
    $(document).on('click', '#btn-export-db', () => {
      if (!window.productivityDB) return;
      const json = window.productivityDB.exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `obsidian_productivity_backup_${window.productivityDB.getTodayStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Restore DB Backup
    $(document).on('click', '#btn-restore-db', () => {
      $('#stats-import-file-input').click();
    });

    $(document).on('change', '#stats-import-file-input', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (window.productivityDB) {
          const success = window.productivityDB.importData(event.target.result);
          if (success) {
            alert('Obsidian DB restored successfully!');
            this.refreshCurrentView();
            if (window.todoManager) window.todoManager.loadTasks();
            if (window.contentManager) window.contentManager.renderBlogList();
          } else {
            alert('Failed to parse database backup file.');
          }
        }
      };
      reader.readAsText(file);
    });
  }

  switchScale(scale) {
    this.currentScale = scale;
    $('.stats-scale-tab').removeClass('active');
    $(`.stats-scale-tab[data-scale="${scale}"]`).addClass('active');

    $('.stats-view-panel').hide();
    $(`#stats-panel-${scale}`).fadeIn(200);

    this.refreshCurrentView();
    if (window.audioSynth) window.audioSynth.playClick();
  }

  updateGlobalCards() {
    if (!window.productivityDB) return;
    const summary = window.productivityDB.getGlobalRealSummary();

    $('#stat-total-focus-hours').text(`${summary.totalFocusHours}H`);
    $('#stat-current-streak').text(`${summary.currentStreak} DAYS`);
    $('#stat-longest-streak').text(`${summary.longestStreak} DAYS`);
    $('#stat-total-tasks-done').text(summary.totalTasksCompleted);
  }

  refreshCurrentView() {
    if (!window.productivityDB) return;
    this.updateGlobalCards();

    if (this.currentScale === 'year') {
      this.renderYearView();
    } else if (this.currentScale === 'month') {
      this.renderMonthView();
    } else if (this.currentScale === 'week') {
      this.renderWeekView();
    } else if (this.currentScale === 'day') {
      this.renderDayView();
    }
  }

  // --- 1. YEAR VIEW: 365-DAY CONTRIBUTION HEATMAP ---
  renderYearView() {
    this.updateGlobalCards();
    const data = window.productivityDB.getYearStats(this.selectedYear);

    const $grid = $('#stats-year-heatmap-grid');
    if (!$grid.length) return;

    // Group into 53 weeks (columns) of 7 days (rows)
    let html = '';
    const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Header labels row for months
    let headerMonthsHtml = '<div class="heatmap-months-labels">';
    let currentMonth = -1;
    data.days.forEach((day, index) => {
      if (index % 7 === 0) {
        if (day.month !== currentMonth) {
          headerMonthsHtml += `<span class="heatmap-month-tag">${monthsNames[day.month]}</span>`;
          currentMonth = day.month;
        } else {
          headerMonthsHtml += `<span class="heatmap-month-tag"></span>`;
        }
      }
    });
    headerMonthsHtml += '</div>';

    // Heatmap cells
    html += '<div class="heatmap-columns-wrapper">';
    let weekHtml = '<div class="heatmap-week-col">';

    data.days.forEach((day, index) => {
      const tooltip = `${day.dateStr}: ${day.focusMinutes} mins focus, ${day.tasksCompleted} tasks`;
      weekHtml += `<div class="heatmap-cell level-${day.level}" title="${tooltip}" data-date="${day.dateStr}" data-mins="${day.focusMinutes}" data-tasks="${day.tasksCompleted}"></div>`;

      if ((index + 1) % 7 === 0) {
        weekHtml += '</div>';
        html += weekHtml;
        weekHtml = '<div class="heatmap-week-col">';
      }
    });

    if (weekHtml !== '<div class="heatmap-week-col">') {
      weekHtml += '</div>';
      html += weekHtml;
    }
    html += '</div>';

    $grid.html(headerMonthsHtml + html);
  }

  // --- 2. MONTH VIEW: CALENDAR MATRIX ---
  renderMonthView() {
    this.updateGlobalCards();
    const data = window.productivityDB.getMonthStats(this.selectedYear, this.selectedMonth);
    const monthsNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    $('#stats-month-label').text(`${monthsNames[this.selectedMonth - 1]} ${this.selectedYear}`);
    $('#stats-month-focus-total').text(`${(data.totalFocusMinutes / 60).toFixed(1)} hrs`);
    $('#stats-month-active-days').text(`${data.activeDaysCount} / ${data.daysInMonth} Days`);

    const $grid = $('#stats-month-calendar-grid');
    if (!$grid.length) return;

    const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let html = '<div class="month-grid-headers">';
    dayHeaders.forEach(d => html += `<div class="month-hdr-cell">${d}</div>`);
    html += '</div><div class="month-grid-cells">';

    // Adjust for Monday start (0: Sun -> 6, 1: Mon -> 0)
    let offset = data.firstDayOfWeek === 0 ? 6 : data.firstDayOfWeek - 1;
    for (let i = 0; i < offset; i++) {
      html += '<div class="month-cell empty"></div>';
    }

    data.days.forEach(day => {
      const isToday = day.dateStr === window.productivityDB.getTodayStr();
      html += `
        <div class="month-cell level-${day.level} ${isToday ? 'is-today' : ''}">
          <div class="month-day-num">${day.day}</div>
          ${day.focusMinutes > 0 ? `
            <div class="month-cell-metrics">
              <span class="month-cell-mins">${day.focusMinutes}m</span>
              ${day.tasksCompleted > 0 ? `<span class="month-cell-tasks">✓ ${day.tasksCompleted}</span>` : ''}
            </div>
          ` : ''}
        </div>
      `;
    });

    html += '</div>';
    $grid.html(html);
  }

  // --- 3. WEEK VIEW: 7-DAY BAR CHART ---
  renderWeekView() {
    this.updateGlobalCards();
    const data = window.productivityDB.getWeekStats();
    $('#stats-week-focus-total').text(`${(data.totalFocusMinutes / 60).toFixed(1)} hrs`);
    $('#stats-week-tasks-total').text(`${data.totalTasksCompleted} Tasks`);
    $('#stats-week-daily-avg').text(`${data.averageDailyMinutes} mins/day`);

    const $chart = $('#stats-week-bar-chart');
    if (!$chart.length) return;

    const maxMins = Math.max(...data.days.map(d => d.focusMinutes), 60);

    let html = '';
    data.days.forEach(day => {
      const heightPercent = day.focusMinutes > 0 ? Math.min(100, Math.round((day.focusMinutes / maxMins) * 100)) : 0;
      const isToday = day.dateStr === window.productivityDB.getTodayStr();

      html += `
        <div class="week-bar-column ${isToday ? 'is-today' : ''}">
          <div class="week-bar-val">${day.focusMinutes > 0 ? `${day.focusMinutes}m` : ''}</div>
          <div class="week-bar-track">
            <div class="week-bar-fill" style="height: ${heightPercent}%;"></div>
          </div>
          <div class="week-bar-label">${day.dayName}</div>
          <div class="week-bar-tasks">${day.tasksCompleted > 0 ? `✓${day.tasksCompleted}` : '-'}</div>
        </div>
      `;
    });

    $chart.html(html);
  }

  // --- 4. DAY VIEW: 24-HOUR TIMELINE ---
  renderDayView() {
    this.updateGlobalCards();
    const data = window.productivityDB.getDayStats();
    $('#stats-day-focus-total').text(`${data.stats.focusMinutes} mins`);
    $('#stats-day-tasks-total').text(data.stats.tasksCompleted);
    $('#stats-day-score').text(`${data.stats.productivityScore}%`);

    const $chart = $('#stats-day-hourly-chart');
    if (!$chart.length) return;

    let html = '<div class="day-hourly-grid">';
    const maxHourMins = 60;

    for (let h = 0; h < 24; h++) {
      const mins = data.hourlyDistribution[h];
      const percent = mins > 0 ? Math.min(100, Math.round((mins / maxHourMins) * 100)) : 0;
      const formattedHour = `${String(h).padStart(2, '0')}:00`;

      html += `
        <div class="hour-bar-wrapper" title="${formattedHour}: ${mins} mins focus">
          <div class="hour-bar-track">
            <div class="hour-bar-fill" style="height: ${percent}%;"></div>
          </div>
          <span class="hour-bar-time">${h % 3 === 0 ? h : ''}</span>
        </div>
      `;
    }
    html += '</div>';

    // Render list of sessions today
    const $sessionList = $('#stats-day-sessions-list');
    if ($sessionList.length) {
      if (data.sessions.length === 0) {
        $sessionList.html('<div style="color: var(--text-dim); font-size: 0.82rem; padding: 8px 0;">No pomodoro sessions logged yet today. Type "pomodoro" to begin.</div>');
      } else {
        let sessHtml = '';
        data.sessions.forEach(s => {
          const timeStr = new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          sessHtml += `
            <div class="day-session-item">
              <span class="session-time">${timeStr}</span>
              <span class="session-duration">${s.durationMinutes} mins [${s.type.toUpperCase()}]</span>
              <span class="session-notes">${s.notes || 'Focus block'}</span>
            </div>
          `;
        });
        $sessionList.html(sessHtml);
      }
    }

    $chart.html(html);
  }
}

window.statsDashboard = new StatsDashboard();
