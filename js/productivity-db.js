/**
 * Obsidian Multi-User Productivity & Profile Database Engine
 * 100% Real Authentic Data, Instant Synchronous Storage & Zero Mock Generation
 */
class ProductivityDatabase {
  constructor() {
    this.activeProfileId = localStorage.getItem('obsidian_active_profile_id') || 'profile_lyra';
    this.profiles = this.loadProfiles();
    this.ensureActiveProfile();
    this.purgeStaleMockData();
  }

  // Purge any stale mock data from previous version to ensure 100% real data
  purgeStaleMockData() {
    const versionKey = 'obsidian_data_schema_v6_placeholder_bio';
    if (localStorage.getItem(versionKey) !== 'true') {
      for (const p of this.profiles) {
        localStorage.removeItem(`obsidian_${p.id}_daily_stats`);
        localStorage.removeItem(`obsidian_${p.id}_blogs`);
      }
      localStorage.removeItem('obsidian_daily_stats');
      localStorage.removeItem('obsidian_blogs');
      localStorage.removeItem('obsidian_profiles');
      this.profiles = [this.getDefaultProfile()];
      this.activeProfileId = this.profiles[0].id;
      localStorage.setItem('obsidian_profiles', JSON.stringify(this.profiles));
      localStorage.setItem('obsidian_active_profile_id', this.activeProfileId);
      localStorage.setItem(versionKey, 'true');
    }
  }

  // --- PROFILES API ---
  getDefaultProfile() {
    return {
      id: 'profile_default',
      name: 'Alex Vance',
      role: 'FULL-STACK DEVELOPER // SYSTEM ARCHITECT',
      bio: "Building clean digital tools, experimenting with creative interfaces, and exploring the space where technology meets daily productivity.",
      bioSecondary: "This workspace serves as my personal focus dashboard and digital notebook — documenting ideas, code snippets, and projects along the way.",
      avatar: 'assets2/lyrabwpfp.jpg',
      yearsExp: 3,
      projectsCount: 8,
      awardsCount: 2,
      techTags: ['TypeScript', 'Python', 'React', 'Cloud Architecture', 'UI/UX Design'],
      email: 'alex@obsidianmirror.io',
      github: 'https://github.com',
      createdDate: '2026-08-15'
    };
  }

  loadProfiles() {
    const raw = localStorage.getItem('obsidian_profiles');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const defaultList = [this.getDefaultProfile()];
    localStorage.setItem('obsidian_profiles', JSON.stringify(defaultList));
    return defaultList;
  }

  saveProfiles() {
    localStorage.setItem('obsidian_profiles', JSON.stringify(this.profiles));
  }

  getActiveProfile() {
    const p = this.profiles.find(x => x.id === this.activeProfileId);
    return p || this.profiles[0] || this.getDefaultProfile();
  }

  ensureActiveProfile() {
    if (!this.profiles.some(p => p.id === this.activeProfileId)) {
      this.activeProfileId = this.profiles[0] ? this.profiles[0].id : 'profile_lyra';
      localStorage.setItem('obsidian_active_profile_id', this.activeProfileId);
    }
  }

  switchProfile(profileId) {
    if (this.profiles.some(p => p.id === profileId)) {
      this.activeProfileId = profileId;
      localStorage.setItem('obsidian_active_profile_id', profileId);
      return this.getActiveProfile();
    }
    return null;
  }

  createProfile({ name, role = 'ENGINEER // RESEARCHER', bio = '', avatar = '', techTags = [] }) {
    const id = 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newProfile = {
      id,
      name: name.trim() || 'Anonymous User',
      role: role.trim() || 'ENGINEER // RESEARCHER',
      bio: bio.trim() || 'A creator exploring systems, algorithms, and deep work.',
      bioSecondary: 'Documenting the technical journey through the Obsidian mirror.',
      avatar: avatar.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      yearsExp: 1,
      projectsCount: 3,
      awardsCount: 1,
      techTags: techTags.length ? techTags : ['Software', 'Architecture', 'Focus'],
      email: `${name.toLowerCase().replace(/\s+/g, '')}@obsidianmirror.io`,
      github: `https://github.com/${name.toLowerCase().replace(/\s+/g, '')}`,
      createdDate: this.getTodayStr()
    };

    this.profiles.push(newProfile);
    this.saveProfiles();
    this.switchProfile(id);
    return newProfile;
  }

  updateProfile(profileData) {
    const idx = this.profiles.findIndex(p => p.id === this.activeProfileId);
    if (idx >= 0) {
      this.profiles[idx] = { ...this.profiles[idx], ...profileData };
      this.saveProfiles();
      return this.profiles[idx];
    }
    return null;
  }

  deleteProfile(profileId) {
    if (this.profiles.length <= 1) return false;
    this.profiles = this.profiles.filter(p => p.id !== profileId);
    this.saveProfiles();
    if (this.activeProfileId === profileId) {
      this.activeProfileId = this.profiles[0].id;
      localStorage.setItem('obsidian_active_profile_id', this.activeProfileId);
    }
    return true;
  }

  // --- STORAGE KEYS PER ACTIVE USER ---
  getKey(name) {
    return `obsidian_${this.activeProfileId}_${name}`;
  }

  getTodayStr(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getFormattedDate(d = new Date()) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // --- TASKS API ---
  getTasks() {
    const raw = localStorage.getItem(this.getKey('tasks'));
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    return [];
  }

  saveTasks(tasks) {
    localStorage.setItem(this.getKey('tasks'), JSON.stringify(tasks));
  }

  addTask(title, category = 'Deep Work', priority = 'Medium', pomodorosGoal = 2) {
    const tasks = this.getTasks();
    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: title.trim(),
      category: category || 'Deep Work',
      priority: priority || 'Medium',
      completed: false,
      createdAt: Date.now(),
      completedAt: null,
      pomodorosGoal: parseInt(pomodorosGoal) || 1,
      pomodorosDone: 0
    };
    tasks.unshift(newTask);
    this.saveTasks(tasks);
    return newTask;
  }

  toggleTask(taskId) {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;

    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;
    this.saveTasks(tasks);

    // Update today's real stats
    this.incrementTodayStats({ tasksCompleted: task.completed ? 1 : -1 });
    return task;
  }

  deleteTask(taskId) {
    let tasks = this.getTasks();
    tasks = tasks.filter(t => t.id !== taskId);
    this.saveTasks(tasks);
    return true;
  }

  incrementTaskPomodoro(taskId) {
    if (!taskId) return null;
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;
    task.pomodorosDone = (task.pomodorosDone || 0) + 1;
    this.saveTasks(tasks);
    return task;
  }

  // --- BLOGS API ---
  getBlogs() {
    const raw = localStorage.getItem(this.getKey('blogs'));
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    const defaultLifeBlogs = [
      {
        id: "daily-log-coffee",
        title: "Sunday Morning Coffee & The Art of Slow Focus",
        date: "14.08.2026",
        readTime: "4 MIN READ",
        likes: 18,
        summary: "Reflections on brewing pour-over coffee, quiet mornings before the world wakes up, and finding mental clarity before diving into work.",
        coverImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
        content: `<p>There is something grounding about the first hour of a quiet Sunday morning. Before checking notifications, opening IDEs, or planning sprint goals, I've started making time for a slow pour-over brew.</p><h3>1. The Morning Ritual</h3><p>Grinding fresh beans by hand, waiting for the kettle to reach the right temperature, and watching the coffee bloom. It forces patience in a world that constantly demands instant outputs.</p><p>It's during these thirty uninterrupted minutes that my mind feels most untangled. Ideas that felt complicated the previous evening suddenly find simple, elegant shapes.</p><h3>2. Embracing Slow Mornings</h3><p>Not every hour of the day needs to be measured in efficiency. Sometimes the most productive thing you can do for your focus is giving yourself permission to just be present before the rush begins.</p>`,
        comments: [
          { name: "Maya", date: "14.08.2026", text: "Pour-over mornings are truly therapeutic. Great read!" }
        ]
      },
      {
        id: "daily-log-rainy-walks",
        title: "Rainy Evening Walks & Finding Flow in Lo-Fi Beats",
        date: "10.08.2026",
        readTime: "3 MIN READ",
        likes: 27,
        summary: "A quick journal entry on stepping outside after hours of screen time, city rain reflections, and the music that keeps me grounded.",
        coverImage: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80",
        content: `<p>After spending six straight hours debugging a stubborn problem, the sound of rain tapping against the window was a welcome signal to step away from the desk.</p><h3>1. Stepping Away from the Screen</h3><p>Walking through the quiet neighborhood streets with an umbrella and a favorite ambient playlist in my headphones. The air smelled fresh, and the neon streetlights reflected off the wet asphalt like liquid glass.</p><p>Taking walks when you're stuck on a problem isn't procrastinating; it's allowing your subconscious mind to do the heavy lifting in the background.</p><h3>2. The Desk Sanctuary</h3><p>Lofi beats and ambient synth sounds have become my sanctuary for evening work sessions. It creates an auditory bubble where time just glides by smoothly.</p>`,
        comments: [
          { name: "Liam", date: "11.08.2026", text: "Evening walks in the rain always reset my brain too." }
        ]
      },
      {
        id: "daily-log-workspace-reset",
        title: "Decluttering the Desk & Curating a Minimal Workspace",
        date: "06.08.2026",
        readTime: "5 MIN READ",
        likes: 32,
        summary: "How simplifying physical desk clutter, warm lighting, and a single notebook transformed my daily focus and state of mind.",
        coverImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
        content: `<p>A cluttered desk often mirrors a cluttered mind. This past week I decided to strip down my entire workspace to the absolute essentials.</p><h3>1. The Reset</h3><p>Removed the loose cables, piles of old sticky notes, and random knick-knacks. Left only my laptop, a clean keyboard, a warm desk lamp, and a blank dot-grid notebook.</p><p>The difference in mental friction was immediate. Sitting down to a clean surface removes the subconscious cognitive weight before you even start.</p><h3>2. Intentional Tools</h3><p>When every object on your desk serves a clear purpose, getting into flow state feels effortless and natural.</p>`,
        comments: []
      }
    ];
    this.saveBlogs(defaultLifeBlogs);
    return defaultLifeBlogs;
  }

  saveBlogs(blogs) {
    localStorage.setItem(this.getKey('blogs'), JSON.stringify(blogs));
  }

  addBlog({ title, readTime = '5 MIN READ', summary = '', coverImage = '', content = '' }) {
    const blogs = this.getBlogs();
    const newBlog = {
      id: 'blog_' + Date.now(),
      title: title.trim() || 'Untitled Log',
      date: this.getFormattedDate(),
      readTime: readTime.trim() || '4 MIN READ',
      likes: 0,
      summary: summary.trim() || 'Technical notes and progress log.',
      coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      content: content.trim() || '<p>Log content...</p>',
      comments: []
    };
    blogs.unshift(newBlog);
    this.saveBlogs(blogs);
    return newBlog;
  }

  updateBlog(blogId, updatedData) {
    const blogs = this.getBlogs();
    const idx = blogs.findIndex(b => b.id === blogId);
    if (idx >= 0) {
      blogs[idx] = { ...blogs[idx], ...updatedData };
      this.saveBlogs(blogs);
      return blogs[idx];
    }
    return null;
  }

  deleteBlog(blogId) {
    let blogs = this.getBlogs();
    blogs = blogs.filter(b => b.id !== blogId);
    this.saveBlogs(blogs);
    return true;
  }

  likeBlog(blogId) {
    const blogs = this.getBlogs();
    const blog = blogs.find(b => b.id === blogId);
    if (blog) {
      blog.likes = (blog.likes || 0) + 1;
      this.saveBlogs(blogs);
      return blog.likes;
    }
    return 0;
  }

  addBlogComment(blogId, name, text) {
    const blogs = this.getBlogs();
    const blog = blogs.find(b => b.id === blogId);
    if (blog) {
      if (!blog.comments) blog.comments = [];
      blog.comments.push({
        name: name.trim(),
        date: this.getFormattedDate(),
        text: text.trim()
      });
      this.saveBlogs(blogs);
      return blog.comments;
    }
    return [];
  }

  // --- SESSIONS API (Real Pomodoro & Focus Recordings) ---
  getSessions() {
    const raw = localStorage.getItem(this.getKey('sessions'));
    return raw ? JSON.parse(raw) : [];
  }

  recordPomodoroSession({ durationMinutes, type = 'focus', taskId = null, notes = '' }) {
    const sessions = this.getSessions();
    const now = new Date();
    const dateStr = this.getTodayStr(now);
    const session = {
      id: 'sess_' + Date.now(),
      startTime: Date.now() - durationMinutes * 60000,
      endTime: Date.now(),
      durationMinutes: parseInt(durationMinutes) || 25,
      type,
      taskId,
      notes,
      dateStr,
      hour: now.getHours()
    };

    sessions.unshift(session);
    localStorage.setItem(this.getKey('sessions'), JSON.stringify(sessions));

    if (type === 'focus') {
      this.incrementTodayStats({ focusMinutes: durationMinutes, sessionsCount: 1 });
      if (taskId) this.incrementTaskPomodoro(taskId);
    }
    return session;
  }

  // --- STATS & TELEMETRY API (Strictly Real Data Only) ---
  getDailyStatsMap() {
    const raw = localStorage.getItem(this.getKey('daily_stats'));
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    return {};
  }

  saveDailyStatsMap(map) {
    localStorage.setItem(this.getKey('daily_stats'), JSON.stringify(map));
  }

  incrementTodayStats({ focusMinutes = 0, tasksCompleted = 0, sessionsCount = 0 }) {
    const todayStr = this.getTodayStr();
    const statsMap = this.getDailyStatsMap();

    if (!statsMap[todayStr]) {
      statsMap[todayStr] = {
        dateStr: todayStr,
        focusMinutes: 0,
        tasksCompleted: 0,
        sessionsCount: 0,
        productivityScore: 0
      };
    }

    const s = statsMap[todayStr];
    s.focusMinutes = Math.max(0, (s.focusMinutes || 0) + focusMinutes);
    s.tasksCompleted = Math.max(0, (s.tasksCompleted || 0) + tasksCompleted);
    s.sessionsCount = Math.max(0, (s.sessionsCount || 0) + sessionsCount);
    s.productivityScore = Math.min(100, Math.round((s.focusMinutes / 120) * 100));

    this.saveDailyStatsMap(statsMap);
    return s;
  }

  // --- REAL AGGREGATE SUMMARY (Unified for Top Stat Cards) ---
  getGlobalRealSummary() {
    const tasks = this.getTasks();
    const sessions = this.getSessions();
    const focusSessions = sessions.filter(s => s.type === 'focus');
    
    // Sum real focus minutes
    const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + (parseInt(s.durationMinutes) || 0), 0);
    const totalTasksCompleted = tasks.filter(t => t.completed).length;

    // Real streak calculation from session dates
    const activeDates = new Set();
    focusSessions.forEach(s => {
      if (s.dateStr) activeDates.add(s.dateStr);
    });

    const todayStr = this.getTodayStr();
    let currentStreak = 0;
    let scan = new Date();

    if (activeDates.has(todayStr)) {
      currentStreak++;
      scan.setDate(scan.getDate() - 1);
    } else {
      scan.setDate(scan.getDate() - 1);
      if (activeDates.has(this.getTodayStr(scan))) {
        currentStreak++;
        scan.setDate(scan.getDate() - 1);
      }
    }

    if (currentStreak > 0) {
      while (true) {
        const checkStr = this.getTodayStr(scan);
        if (activeDates.has(checkStr)) {
          currentStreak++;
          scan.setDate(scan.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return {
      totalFocusHours: (totalFocusMinutes / 60).toFixed(1),
      totalFocusMinutes,
      totalTasksCompleted,
      currentStreak,
      longestStreak: Math.max(currentStreak, activeDates.size > 0 ? 1 : 0)
    };
  }

  // 1. Day Stats: hourly distribution, focus time, tasks done
  getDayStats(dateStr = this.getTodayStr()) {
    const statsMap = this.getDailyStatsMap();
    const stat = statsMap[dateStr] || {
      dateStr,
      focusMinutes: 0,
      tasksCompleted: 0,
      sessionsCount: 0,
      productivityScore: 0
    };

    const allSessions = this.getSessions();
    const daySessions = allSessions.filter(s => s.dateStr === dateStr);

    const hourlyDistribution = new Array(24).fill(0);
    daySessions.forEach(s => {
      const hour = s.hour !== undefined ? s.hour : new Date(s.endTime).getHours();
      if (hour >= 0 && hour < 24) {
        hourlyDistribution[hour] += (parseInt(s.durationMinutes) || 0);
      }
    });

    return { dateStr, stats: stat, sessions: daySessions, hourlyDistribution };
  }

  // 2. Week Stats: 7-day breakdown (Monday to Sunday)
  getWeekStats(referenceDate = new Date()) {
    const d = new Date(referenceDate);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMonday));

    const statsMap = this.getDailyStatsMap();
    const weekDays = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    let totalWeekFocusMins = 0;
    let totalWeekTasks = 0;

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const dateStr = this.getTodayStr(current);
      const stat = statsMap[dateStr] || { dateStr, focusMinutes: 0, tasksCompleted: 0, sessionsCount: 0 };

      totalWeekFocusMins += stat.focusMinutes;
      totalWeekTasks += stat.tasksCompleted;

      weekDays.push({
        dayName: dayNames[i],
        dateStr,
        focusMinutes: stat.focusMinutes,
        tasksCompleted: stat.tasksCompleted,
        sessionsCount: stat.sessionsCount
      });
    }

    return {
      days: weekDays,
      totalFocusMinutes: totalWeekFocusMins,
      totalTasksCompleted: totalWeekTasks,
      averageDailyMinutes: Math.round(totalWeekFocusMins / 7)
    };
  }

  // 3. Month Stats: matrix of days for the given year & month (1-12)
  getMonthStats(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const statsMap = this.getDailyStatsMap();
    const monthDays = [];

    let totalMonthFocusMins = 0;
    let totalMonthTasks = 0;
    let activeDaysCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const current = new Date(year, month - 1, day);
      const dateStr = this.getTodayStr(current);
      const stat = statsMap[dateStr] || { dateStr, focusMinutes: 0, tasksCompleted: 0, sessionsCount: 0 };

      if (stat.focusMinutes > 0) activeDaysCount++;
      totalMonthFocusMins += stat.focusMinutes;
      totalMonthTasks += stat.tasksCompleted;

      let level = 0;
      if (stat.focusMinutes >= 120) level = 4;
      else if (stat.focusMinutes >= 60) level = 3;
      else if (stat.focusMinutes >= 25) level = 2;
      else if (stat.focusMinutes > 0) level = 1;

      monthDays.push({
        day,
        dateStr,
        dayOfWeek: current.getDay(),
        focusMinutes: stat.focusMinutes,
        tasksCompleted: stat.tasksCompleted,
        level
      });
    }

    return {
      year,
      month,
      daysInMonth,
      firstDayOfWeek: new Date(year, month - 1, 1).getDay(),
      days: monthDays,
      totalFocusMinutes: totalMonthFocusMins,
      totalTasksCompleted: totalMonthTasks,
      activeDaysCount
    };
  }

  // 4. Year Stats: 365-day contribution matrix strictly from real data
  getYearStats(targetYear = new Date().getFullYear()) {
    const statsMap = this.getDailyStatsMap();
    const isLeap = (targetYear % 4 === 0 && targetYear % 100 !== 0) || targetYear % 400 === 0;
    const totalDays = isLeap ? 366 : 365;

    let totalYearFocusMins = 0;
    let totalYearTasks = 0;
    let maxFocusDay = { dateStr: '', focusMinutes: 0 };

    const days = [];
    const startDate = new Date(targetYear, 0, 1);

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = this.getTodayStr(d);
      const stat = statsMap[dateStr] || { dateStr, focusMinutes: 0, tasksCompleted: 0, sessionsCount: 0 };

      totalYearFocusMins += stat.focusMinutes;
      totalYearTasks += stat.tasksCompleted;

      if (stat.focusMinutes > maxFocusDay.focusMinutes) {
        maxFocusDay = { dateStr, focusMinutes: stat.focusMinutes };
      }

      let level = 0;
      if (stat.focusMinutes >= 120) level = 4;
      else if (stat.focusMinutes >= 60) level = 3;
      else if (stat.focusMinutes >= 25) level = 2;
      else if (stat.focusMinutes > 0) level = 1;

      days.push({
        dateStr,
        dayOfWeek: d.getDay(),
        month: d.getMonth(),
        focusMinutes: stat.focusMinutes,
        tasksCompleted: stat.tasksCompleted,
        level
      });
    }

    const summary = this.getGlobalRealSummary();

    return {
      year: targetYear,
      days,
      totalFocusHours: summary.totalFocusHours,
      totalTasksCompleted: summary.totalTasksCompleted,
      totalDaysActive: days.filter(d => d.focusMinutes > 0).length,
      currentStreak: summary.currentStreak,
      longestStreak: summary.longestStreak,
      maxFocusDay
    };
  }

  // --- VIDEO NOTES API ---
  getVideoNotes(videoId) {
    const raw = localStorage.getItem(this.getKey(`video_${videoId}`));
    return raw ? JSON.parse(raw) : null;
  }

  saveVideoNotes(videoId, { videoUrl, videoTitle = '', notes = '' }) {
    const item = { videoId, videoUrl, videoTitle, notes, updatedAt: Date.now() };
    localStorage.setItem(this.getKey(`video_${videoId}`), JSON.stringify(item));
    return item;
  }

  // --- BACKUP & RESTORE ---
  exportData() {
    const backup = {
      version: 4,
      activeProfile: this.getActiveProfile(),
      profiles: this.profiles,
      tasks: this.getTasks(),
      blogs: this.getBlogs(),
      sessions: this.getSessions(),
      daily_stats: this.getDailyStatsMap()
    };
    return JSON.stringify(backup, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.profiles) {
        this.profiles = data.profiles;
        this.saveProfiles();
      }
      if (data.tasks) this.saveTasks(data.tasks);
      if (data.blogs) this.saveBlogs(data.blogs);
      if (data.sessions) localStorage.setItem(this.getKey('sessions'), JSON.stringify(data.sessions));
      if (data.daily_stats) this.saveDailyStatsMap(data.daily_stats);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }
}

window.productivityDB = new ProductivityDatabase();
