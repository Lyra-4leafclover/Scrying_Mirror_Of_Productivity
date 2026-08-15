/**
 * Obsidian Video Embed & Lecture Workspace
 * Dual-Engine: Universal YouTube Embed + Native HTML5 Media Player with Split-Screen Notes Sync
 */
class VideoWorkspace {
  constructor() {
    this.currentMode = 'yt'; // 'yt' or 'direct'
    this.currentVideoId = null;
    this.currentVideoUrl = '';
    this.autoSaveTimer = null;

    this.presets = [
      { id: 'rfscVS0vtbw', title: 'Python 4-Hour Crash Course (freeCodeCamp)', category: 'Python', type: 'yt' },
      { id: 'YoXxevp1WRQ', title: 'Harvard CS50: Intro to Computer Science', category: 'CS50', type: 'yt' },
      { id: 'eWRfhZUzrAc', title: 'C++ Full Course for Beginners', category: 'C++', type: 'yt' },
      { id: '4xDzrJKXOOY', title: 'Synthwave Radio Chill & Coding Beats', category: 'Music', type: 'yt' }
    ];

    this.init();
  }

  init() {
    this.bindEvents();
    this.renderPresets();
    this.loadVideo(this.presets[0].id, `https://www.youtube.com/watch?v=${this.presets[0].id}`, this.presets[0].title);
  }

  bindEvents() {
    // Mode toggles
    $(document).on('click', '#video-mode-yt', () => {
      this.switchMode('yt');
    });

    $(document).on('click', '#video-mode-direct', () => {
      this.switchMode('direct');
    });

    // URL submission
    $(document).on('submit', '#video-url-form', (e) => {
      e.preventDefault();
      this.handleUrlInput();
    });

    $(document).on('click', '.video-load-btn', (e) => {
      e.preventDefault();
      this.handleUrlInput();
    });

    // Preset click
    $(document).on('click', '.video-preset-pill', (e) => {
      const vid = $(e.currentTarget).data('vid');
      const title = $(e.currentTarget).data('title');
      if (vid) {
        this.switchMode('yt');
        this.loadVideo(vid, `https://www.youtube.com/watch?v=${vid}`, title);
        if (window.audioSynth) window.audioSynth.playClick();
      }
    });

    // Quick tool buttons
    $(document).on('click', '#btn-insert-timestamp', () => {
      let ts = '00:00';
      if (this.currentMode === 'direct') {
        const vidElem = document.getElementById('video-html5-player');
        if (vidElem && vidElem.currentTime) {
          const m = Math.floor(vidElem.currentTime / 60);
          const s = Math.floor(vidElem.currentTime % 60);
          ts = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
      } else {
        const d = new Date();
        ts = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
      this.insertIntoScratchpad(`\n[${ts}] `);
    });

    $(document).on('click', '#btn-insert-bullet', () => {
      this.insertIntoScratchpad('\n• ');
    });

    $(document).on('click', '#btn-insert-code', () => {
      this.insertIntoScratchpad('\n```\n// Code snippet\n```\n');
    });

    // Auto-save lecture notes on keystroke
    $(document).on('input', '#video-lecture-notes', () => {
      clearTimeout(this.autoSaveTimer);
      $('#video-notes-saved-indicator').text('Saving notes...').css('color', 'var(--violet-accent)');

      this.autoSaveTimer = setTimeout(() => {
        this.saveCurrentNotes();
      }, 1000);
    });

    // Manual Save notes button
    $(document).on('click', '#video-save-notes-btn', () => {
      this.saveCurrentNotes();
      if (window.audioSynth) window.audioSynth.playKeyTick();
    });

    // Clear notes button
    $(document).on('click', '#video-clear-notes-btn', () => {
      if (confirm('Clear notes for this lecture?')) {
        $('#video-lecture-notes').val('');
        this.saveCurrentNotes();
      }
    });
  }

  switchMode(mode) {
    this.currentMode = mode;
    $('.video-mode-tab').removeClass('active');

    if (mode === 'yt') {
      $('#video-mode-yt').addClass('active');
      $('#video-yt-wrapper').show();
      $('#video-html5-wrapper').hide();
      $('#video-url-input').attr('placeholder', 'Paste YouTube URL or Video ID (e.g. https://youtu.be/...)');
    } else {
      $('#video-mode-direct').addClass('active');
      $('#video-yt-wrapper').hide();
      $('#video-html5-wrapper').show();
      $('#video-url-input').attr('placeholder', 'Paste direct video URL (.mp4, .webm) or local media path...');
    }
  }

  insertIntoScratchpad(text) {
    const $textarea = $('#video-lecture-notes');
    const curVal = $textarea.val();
    $textarea.val(curVal + text);
    $textarea.focus();
    this.saveCurrentNotes();
  }

  handleUrlInput() {
    const inputUrl = $('#video-url-input').val().trim();
    if (!inputUrl) return;

    // Check if direct video file
    if (inputUrl.match(/\.(mp4|webm|ogg|mov)($|\?)/i)) {
      this.switchMode('direct');
      this.loadDirectVideo(inputUrl, 'Direct Media Stream');
      $('#video-url-input').val('');
      return;
    }

    const videoId = this.extractYouTubeId(inputUrl);
    if (videoId) {
      this.switchMode('yt');
      this.loadVideo(videoId, inputUrl, 'Custom YouTube Lecture');
      $('#video-url-input').val('');
      if (window.audioSynth) window.audioSynth.playClick();
    } else {
      alert('Please enter a valid YouTube URL (https://youtu.be/...) or direct .mp4/.webm video link.');
    }
  }

  extractYouTubeId(url) {
    if (!url) return null;
    const clean = url.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
      return clean;
    }

    const shortMatch = clean.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
    if (shortMatch && shortMatch[1]) return shortMatch[1];

    const watchMatch = clean.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
    if (watchMatch && watchMatch[1]) return watchMatch[1];

    const embedMatch = clean.match(/youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/i);
    if (embedMatch && embedMatch[1]) return embedMatch[1];

    const liveMatch = clean.match(/youtube\.com\/(?:live|shorts)\/([a-zA-Z0-9_-]{11})/i);
    if (liveMatch && liveMatch[1]) return liveMatch[1];

    return null;
  }

  loadVideo(videoId, url, title = 'Obsidian Video Lecture') {
    this.currentVideoId = videoId;
    this.currentVideoUrl = url || `https://www.youtube.com/watch?v=${videoId}`;

    // Universal clean YouTube embed
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;
    $('#video-iframe-embed').attr('src', embedUrl);
    $('#video-active-title').text(title);
    $('#video-popout-btn').attr('href', this.currentVideoUrl);

    this.loadSavedNotes(videoId);
  }

  loadDirectVideo(mediaUrl, title = 'Direct Video Lecture') {
    this.currentVideoId = 'direct_' + btoa(mediaUrl).substring(0, 16);
    this.currentVideoUrl = mediaUrl;

    const vidElem = document.getElementById('video-html5-player');
    if (vidElem) {
      vidElem.src = mediaUrl;
      vidElem.load();
    }

    $('#video-active-title').text(title);
    $('#video-popout-btn').attr('href', mediaUrl);

    this.loadSavedNotes(this.currentVideoId);
  }

  loadSavedNotes(keyId) {
    if (window.productivityDB) {
      const saved = window.productivityDB.getVideoNotes(keyId);
      if (saved && saved.notes) {
        $('#video-lecture-notes').val(saved.notes);
        $('#video-notes-saved-indicator').text('Notes loaded from DB').css('color', 'var(--text-dim)');
      } else {
        $('#video-lecture-notes').val('');
        $('#video-notes-saved-indicator').text('Ready for notes').css('color', 'var(--text-dim)');
      }
    }
  }

  saveCurrentNotes() {
    if (!this.currentVideoId || !window.productivityDB) return;
    const notes = $('#video-lecture-notes').val();
    const title = $('#video-active-title').text() || 'Lecture Notes';

    window.productivityDB.saveVideoNotes(this.currentVideoId, {
      videoUrl: this.currentVideoUrl,
      videoTitle: title,
      notes
    });

    $('#video-notes-saved-indicator').text('✓ Saved to DB').css('color', '#a3e635');
    setTimeout(() => {
      $('#video-notes-saved-indicator').text('Synced to DB').css('color', 'var(--text-dim)');
    }, 2000);
  }

  renderPresets() {
    const $container = $('#video-presets-container');
    if (!$container.length) return;

    let html = '';
    this.presets.forEach(p => {
      html += `
        <button class="video-preset-pill" data-vid="${p.id}" data-title="${this.escapeHtml(p.title)}">
          <span class="preset-tag">[${p.category}]</span>
          <span class="preset-name">${this.escapeHtml(p.title)}</span>
        </button>
      `;
    });
    $container.html(html);
  }

  escapeHtml(str) {
    return $('<div>').text(str || '').html();
  }
}

window.videoWorkspace = new VideoWorkspace();
