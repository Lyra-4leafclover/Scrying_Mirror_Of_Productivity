/**
 * Subsurface Content, Profile Manager & Blog Publishing Engine
 * Includes Avatar Local File Uploading, Blog Image Ctrl+V Paste & Embedded Illustrations
 */
class ContentManager {
  constructor() {
    this.projects = [
      {
        id: 'atelier',
        title: 'Atelier',
        badge: 'PYTHON // WORKSHOP SPACE',
        desc: 'A personal workshop repository space where I document, build, and track progress across programming languages and software development topics including Tkinter CLI Quiz Makers, Computer Vision Document Reassembly pipelines, and IoT systems.',
        details: [
          'Python 100% codebase architecture',
          'Tkinter CLI & Popup Quiz Maker with Image Windows',
          'OpenCV Shredded & Torn Document Reassembly Engine',
          'Phantom Gate IoT Access Control & Safety System'
        ],
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
        liveUrl: 'https://github.com/Lyra-4leafclover/atelier',
        githubUrl: 'https://github.com/Lyra-4leafclover/atelier'
      }
    ];

    this.activePost = null;
    this.editingBlogId = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderProfile();
    this.renderBlogList();
    this.renderGuestbook();
  }

  bindEvents() {
    // Project modal
    $(document).on('click', '.project-card', (e) => {
      const pid = $(e.currentTarget).data('project');
      this.openProjectModal(pid);
    });

    $('#project-modal-close, #project-modal').on('click', (e) => {
      if (e.target.id === 'project-modal' || e.target.id === 'project-modal-close') {
        $('#project-modal').removeClass('active');
      }
    });

    // Blog modal
    $('#blog-modal-close, #blog-modal').on('click', (e) => {
      if (e.target.id === 'blog-modal' || e.target.id === 'blog-modal-close') {
        $('#blog-modal').removeClass('active');
      }
    });

    // Profile Modals close
    $('#profile-edit-modal-close, #profile-edit-modal').on('click', (e) => {
      if (e.target.id === 'profile-edit-modal' || e.target.id === 'profile-edit-modal-close') {
        $('#profile-edit-modal').removeClass('active');
      }
    });

    $('#profile-switch-modal-close, #profile-switch-modal').on('click', (e) => {
      if (e.target.id === 'profile-switch-modal' || e.target.id === 'profile-switch-modal-close') {
        $('#profile-switch-modal').removeClass('active');
      }
    });

    // Blog Editor Modal close
    $('#blog-editor-modal-close, #blog-editor-modal').on('click', (e) => {
      if (e.target.id === 'blog-editor-modal' || e.target.id === 'blog-editor-modal-close') {
        $('#blog-editor-modal').removeClass('active');
      }
    });

    // --- PROFILE EVENTS ---
    $(document).on('click', '#user-profile-badge, #btn-open-profile-switcher', () => {
      this.openProfileSwitcher();
    });

    $(document).on('click', '#btn-edit-profile', () => {
      this.openProfileEditor();
    });

    // Live URL typing preview in profile modal
    $(document).on('input', '#edit-profile-avatar', (e) => {
      const val = $(e.currentTarget).val().trim();
      if (val) {
        $('#edit-profile-avatar-preview').attr('src', val);
      }
    });

    // Profile Avatar File Upload from Computer
    $(document).on('change', '#edit-profile-file-input', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        this.compressImage(event.target.result, 300, 0.85, (compressedDataUrl) => {
          $('#edit-profile-avatar').val(compressedDataUrl);
          $('#edit-profile-avatar-preview').attr('src', compressedDataUrl);
        });
      };
      reader.readAsDataURL(file);
    });

    // Preset avatar randomizer
    $(document).on('click', '#btn-use-avatar-preset', () => {
      const presets = [
        'assets2/lyrabwpfp.jpg',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80'
      ];
      const randomAvatar = presets[Math.floor(Math.random() * presets.length)];
      $('#edit-profile-avatar').val(randomAvatar);
      $('#edit-profile-avatar-preview').attr('src', randomAvatar);
    });

    $(document).on('submit', '#profile-edit-form', (e) => {
      e.preventDefault();
      if (!window.productivityDB) return;

      const updated = {
        name: $('#edit-profile-name').val().trim(),
        role: $('#edit-profile-role').val().trim(),
        avatar: $('#edit-profile-avatar').val().trim(),
        yearsExp: parseInt($('#edit-profile-exp').val()) || 0,
        projectsCount: parseInt($('#edit-profile-projects').val()) || 0,
        awardsCount: parseInt($('#edit-profile-awards').val()) || 0,
        bio: $('#edit-profile-bio').val().trim(),
        bioSecondary: $('#edit-profile-bio2').val().trim(),
        techTags: $('#edit-profile-tags').val().split(',').map(s => s.trim()).filter(Boolean),
        github: $('#edit-profile-github').val().trim(),
        email: $('#edit-profile-email').val().trim()
      };

      window.productivityDB.updateProfile(updated);
      $('#profile-edit-modal').removeClass('active');
      this.renderProfile();
      if (window.audioSynth) window.audioSynth.playTaskComplete();
    });

    // Switch Profile from list
    $(document).on('click', '.profile-item-select', (e) => {
      const pid = $(e.currentTarget).data('pid');
      if (pid && window.productivityDB) {
        window.productivityDB.switchProfile(pid);
        $('#profile-switch-modal').removeClass('active');
        this.renderProfile();
        this.renderBlogList();
        if (window.todoManager) window.todoManager.loadTasks();
        if (window.statsDashboard) window.statsDashboard.refreshCurrentView();
        if (window.audioSynth) window.audioSynth.playClick();
      }
    });

    // Delete profile
    $(document).on('click', '.profile-delete-btn', (e) => {
      e.stopPropagation();
      const pid = $(e.currentTarget).data('pid');
      if (confirm('Delete this user profile and its data?')) {
        if (window.productivityDB) {
          window.productivityDB.deleteProfile(pid);
          this.openProfileSwitcher();
          this.renderProfile();
          this.renderBlogList();
          if (window.todoManager) window.todoManager.loadTasks();
        }
      }
    });

    // Create new profile button in modal
    $(document).on('click', '#btn-create-new-profile', () => {
      const name = prompt('Enter New User Name / Handle:');
      if (name && name.trim()) {
        const role = prompt('Enter Title / Role (e.g. Full-Stack Dev | AIML Researcher):') || 'DEVELOPER // RESEARCHER';
        if (window.productivityDB) {
          window.productivityDB.createProfile({ name, role });
          $('#profile-switch-modal').removeClass('active');
          this.renderProfile();
          this.renderBlogList();
          if (window.todoManager) window.todoManager.loadTasks();
          if (window.statsDashboard) window.statsDashboard.refreshCurrentView();
          if (window.audioSynth) window.audioSynth.playTaskComplete();
        }
      }
    });

    // --- BLOG AUTHORING & IMAGE PASTE EVENTS ---
    $(document).on('click', '#btn-write-blog', () => {
      this.openBlogEditor();
    });

    // Blog Cover File Upload
    $(document).on('change', '#editor-blog-cover-file', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        this.compressImage(event.target.result, 900, 0.85, (compressedDataUrl) => {
          $('#editor-blog-cover').val(compressedDataUrl);
        });
      };
      reader.readAsDataURL(file);
    });

    // Blog Insert Image File from Computer
    $(document).on('change', '#blog-insert-img-file', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        this.compressImage(event.target.result, 800, 0.85, (compressedDataUrl) => {
          this.insertImageTagIntoTextarea('#editor-blog-content', compressedDataUrl);
        });
      };
      reader.readAsDataURL(file);
    });

    // Paste (Ctrl+V) Image Handler inside Blog Content Textarea
    $(document).on('paste', '#editor-blog-content', (e) => {
      const clipboardData = e.originalEvent.clipboardData || window.clipboardData;
      if (!clipboardData || !clipboardData.items) return;

      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (event) => {
            this.compressImage(event.target.result, 800, 0.85, (compressedDataUrl) => {
              this.insertImageTagIntoTextarea('#editor-blog-content', compressedDataUrl);
              if (window.audioSynth) window.audioSynth.playKeyTick();
            });
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    });

    // Blog submission
    $(document).on('submit', '#blog-editor-form', (e) => {
      e.preventDefault();
      if (!window.productivityDB) return;

      const title = $('#editor-blog-title').val().trim();
      const readTime = $('#editor-blog-readtime').val().trim() || '4 MIN READ';
      const summary = $('#editor-blog-summary').val().trim();
      const coverImage = $('#editor-blog-cover').val().trim();
      const content = $('#editor-blog-content').val().trim();

      if (!title || !content) return;

      if (this.editingBlogId) {
        window.productivityDB.updateBlog(this.editingBlogId, {
          title,
          readTime,
          summary,
          coverImage,
          content
        });
      } else {
        window.productivityDB.addBlog({
          title,
          readTime,
          summary,
          coverImage,
          content
        });
      }

      $('#blog-editor-modal').removeClass('active');
      this.renderBlogList();
      if (window.audioSynth) window.audioSynth.playTaskComplete();
    });

    // Edit blog button on item
    $(document).on('click', '.blog-edit-btn', (e) => {
      e.stopPropagation();
      const bid = $(e.currentTarget).data('bid');
      this.openBlogEditor(bid);
    });

    // Delete blog button on item
    $(document).on('click', '.blog-delete-btn', (e) => {
      e.stopPropagation();
      const bid = $(e.currentTarget).data('bid');
      if (confirm('Are you sure you want to delete this article?')) {
        if (window.productivityDB) {
          window.productivityDB.deleteBlog(bid);
          this.renderBlogList();
          if (window.audioSynth) window.audioSynth.playKeyTick();
        }
      }
    });

    // Guestbook form submission
    $('#guestbook-form').on('submit', (e) => {
      e.preventDefault();
      const name = $('#gb-input-name').val().trim();
      const text = $('#gb-input-msg').val().trim();
      if (!name || !text) return;

      const savedGb = localStorage.getItem('obsidian_guestbook_notes');
      const entries = savedGb ? JSON.parse(savedGb) : [];
      entries.unshift({
        name,
        date: new Date().toLocaleDateString('en-GB'),
        text
      });

      localStorage.setItem('obsidian_guestbook_notes', JSON.stringify(entries));
      $('#gb-input-name').val('');
      $('#gb-input-msg').val('');
      this.renderGuestbook();
    });
  }

  insertImageTagIntoTextarea(selector, base64Url) {
    const $textarea = $(selector);
    const textareaElem = $textarea[0];
    if (!textareaElem) return;

    const startPos = textareaElem.selectionStart || textareaElem.value.length;
    const endPos = textareaElem.selectionEnd || textareaElem.value.length;
    const currentVal = textareaElem.value;

    const imgTag = `\n<img src="${base64Url}" class="blog-embedded-img" alt="Embedded Illustration" />\n`;
    const newVal = currentVal.substring(0, startPos) + imgTag + currentVal.substring(endPos);

    $textarea.val(newVal);
    textareaElem.selectionStart = textareaElem.selectionEnd = startPos + imgTag.length;
    $textarea.focus();
  }

  compressImage(base64Str, maxWidth, quality, callback) {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      callback(compressed);
    };
    img.src = base64Str;
  }

  renderProfile() {
    if (!window.productivityDB) return;
    const profile = window.productivityDB.getActiveProfile();

    // Update Top Navigation Profile Pill
    $('#header-username').text(profile.name.toUpperCase());
    if (profile.avatar) {
      $('#header-avatar').attr('src', profile.avatar);
    }

    // Update Subsurface Profile View (#view-about)
    $('#profile-display-name').text(profile.name.toUpperCase());
    $('#profile-display-role').text(profile.role);
    $('#profile-display-avatar').attr('src', profile.avatar || 'assets2/lyrabwpfp.jpg');
    $('#profile-stat-exp').text(profile.yearsExp || 0);
    $('#profile-stat-projects').text(profile.projectsCount || 0);
    $('#profile-stat-awards').text(profile.awardsCount || 0);
    $('#profile-display-bio1').text(profile.bio);
    $('#profile-display-bio2').text(profile.bioSecondary || '');

    // Render Tech tags
    const $tags = $('#profile-display-tags');
    if ($tags.length && profile.techTags) {
      let html = '';
      profile.techTags.forEach(tag => {
        html += `<span class="tech-tag">${this.escapeHtml(tag)}</span>`;
      });
      $tags.html(html);
    }

    // Update contact channels if present
    if (profile.email) $('#contact-display-email').text(profile.email);
    if (profile.github) $('#contact-display-github').text(profile.github);
  }

  openProfileEditor() {
    if (!window.productivityDB) return;
    const profile = window.productivityDB.getActiveProfile();

    $('#edit-profile-name').val(profile.name);
    $('#edit-profile-role').val(profile.role);
    $('#edit-profile-avatar').val(profile.avatar);
    $('#edit-profile-avatar-preview').attr('src', profile.avatar || 'assets2/lyrabwpfp.jpg');
    $('#edit-profile-exp').val(profile.yearsExp);
    $('#edit-profile-projects').val(profile.projectsCount);
    $('#edit-profile-awards').val(profile.awardsCount);
    $('#edit-profile-bio').val(profile.bio);
    $('#edit-profile-bio2').val(profile.bioSecondary || '');
    $('#edit-profile-tags').val((profile.techTags || []).join(', '));
    $('#edit-profile-github').val(profile.github || '');
    $('#edit-profile-email').val(profile.email || '');

    $('#profile-edit-modal').addClass('active');
  }

  openProfileSwitcher() {
    if (!window.productivityDB) return;
    const profiles = window.productivityDB.profiles;
    const activeId = window.productivityDB.activeProfileId;

    let html = '';
    profiles.forEach(p => {
      const isActive = p.id === activeId;
      html += `
        <div class="profile-switch-card ${isActive ? 'active-profile' : ''}">
          <div class="profile-card-left profile-item-select" data-pid="${p.id}">
            <img src="${p.avatar || 'assets2/lyrabwpfp.jpg'}" class="profile-card-avatar">
            <div>
              <div class="profile-card-name">${this.escapeHtml(p.name)} ${isActive ? '<span class="active-badge">✓ ACTIVE</span>' : ''}</div>
              <div class="profile-card-role">${this.escapeHtml(p.role)}</div>
            </div>
          </div>
          ${profiles.length > 1 ? `
            <button class="profile-delete-btn" data-pid="${p.id}" title="Delete profile">&times;</button>
          ` : ''}
        </div>
      `;
    });

    $('#profiles-list-container').html(html);
    $('#profile-switch-modal').addClass('active');
  }

  openBlogEditor(blogId = null) {
    this.editingBlogId = blogId;
    if (blogId && window.productivityDB) {
      const blogs = window.productivityDB.getBlogs();
      const blog = blogs.find(b => b.id === blogId);
      if (blog) {
        $('#editor-modal-title-hdr').text('Edit Log Article');
        $('#editor-blog-title').val(blog.title);
        $('#editor-blog-readtime').val(blog.readTime);
        $('#editor-blog-summary').val(blog.summary);
        $('#editor-blog-cover').val(blog.coverImage);
        $('#editor-blog-content').val(blog.content);
      }
    } else {
      $('#editor-modal-title-hdr').text('Write New Engineering Log');
      $('#editor-blog-title').val('');
      $('#editor-blog-readtime').val('4 MIN READ');
      $('#editor-blog-summary').val('');
      $('#editor-blog-cover').val('https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80');
      $('#editor-blog-content').val('');
    }

    $('#blog-editor-modal').addClass('active');
  }

  showView(viewName) {
    const $targetView = $(`#view-${viewName}`);
    if (!$targetView.length) return;

    $('.subsurface-view').removeClass('active');
    $targetView.addClass('active');

    try {
      if (window.liquidMirror && typeof window.liquidMirror.triggerCommandShockwave === 'function') {
        window.liquidMirror.triggerCommandShockwave();
      } else if (window.liquidMirror && typeof window.liquidMirror.triggerDistortion === 'function') {
        window.liquidMirror.triggerDistortion();
      }
    } catch (err) {}

    if (viewName === 'skills') {
      setTimeout(() => {
        $('.skill-bar-fill').each(function() {
          const level = $(this).attr('data-level');
          $(this).css('width', level);
        });
      }, 100);
    } else if (viewName === 'guestbook') {
      this.renderGuestbook();
    } else if (viewName === 'blogs') {
      this.renderBlogList();
    } else if (viewName === 'about') {
      this.renderProfile();
    } else if (viewName === 'todo' && window.todoManager) {
      window.todoManager.loadTasks();
    } else if (viewName === 'stats' && window.statsDashboard) {
      window.statsDashboard.refreshCurrentView();
    } else if (viewName === 'pomodoro' && window.pomodoroTimer) {
      window.pomodoroTimer.updateDisplay();
      window.pomodoroTimer.updateProgressRing();
    } else if (viewName === 'quote' && window.quoteSystem) {
      window.quoteSystem.renderCurrentQuote();
    }
  }

  renderBlogList() {
    const $container = $('#blogs-list-container');
    if (!$container.length || !window.productivityDB) return;

    const blogs = window.productivityDB.getBlogs();
    if (blogs.length === 0) {
      $container.html(`
        <div style="text-align: center; padding: 40px 20px; color: var(--text-dim); font-family: var(--font-code);">
          <div style="font-size: 1.6rem; color: var(--violet-primary); margin-bottom: 8px;">✧</div>
          <p>No articles published in this profile yet. Click "+ WRITE LOG" above to publish your first post!</p>
        </div>
      `);
      return;
    }

    let html = '';
    blogs.forEach((post, idx) => {
      html += `
        <div class="blog-item" data-index="${idx}">
          <div style="flex: 1;" onclick="if(window.contentManager) window.contentManager.openBlogModal(window.productivityDB.getBlogs()[${idx}]);">
            <div class="blog-meta">${this.escapeHtml(post.date)} // ${this.escapeHtml(post.readTime)}</div>
            <h3 class="blog-title">${this.escapeHtml(post.title)}</h3>
            <p class="blog-summary">${this.escapeHtml(post.summary)}</p>
          </div>
          <div class="blog-action-side">
            <span class="blog-read-btn" onclick="if(window.contentManager) window.contentManager.openBlogModal(window.productivityDB.getBlogs()[${idx}]);">[READ ARTICLE]</span>
            <button class="blog-edit-btn" data-bid="${post.id}" title="Edit Article">✎</button>
            <button class="blog-delete-btn" data-bid="${post.id}" title="Delete Article">&times;</button>
          </div>
        </div>
      `;
    });
    $container.html(html);
  }

  openBlogModal(post) {
    if (!post) return;
    this.activePost = post;

    $('#b-modal-meta').text(`${post.date} // ${post.readTime}`);
    $('#b-modal-title').text(post.title);

    let contentHtml = post.content;
    if (post.coverImage) {
      contentHtml = `<img src="${post.coverImage}" class="blog-hero-cover" alt="${this.escapeHtml(post.title)}"/>` + contentHtml;
    }
    $('#b-modal-body').html(contentHtml);

    $('#blog-modal').addClass('active');
  }

  renderComments(post) {
    const $container = $('#b-modal-comments-list');
    if (!$container.length) return;

    const comments = post.comments || [];
    if (comments.length === 0) {
      $container.html('<div style="color: var(--text-dim); font-size: 0.8rem; padding: 6px 0;">No comments on this article yet. Be the first to leave one!</div>');
      return;
    }

    let html = '';
    comments.forEach(c => {
      html += `
        <div class="comment-item">
          <div class="comment-author-row">
            <span class="comment-author-name">${this.escapeHtml(c.name)}</span>
            <span class="comment-date">${this.escapeHtml(c.date)}</span>
          </div>
          <div class="comment-text">${this.escapeHtml(c.text)}</div>
        </div>
      `;
    });
    $container.html(html);
  }

  openProjectModal(pid) {
    const p = this.projects.find(x => x.id === pid);
    if (!p) return;

    $('#p-modal-badge').text(p.badge);
    $('#p-modal-title').text(p.title);
    $('#p-modal-desc').text(p.desc);
    $('#p-modal-img').attr('src', p.image);

    let detailsHtml = '';
    p.details.forEach(d => detailsHtml += `<li>${this.escapeHtml(d)}</li>`);
    $('#p-modal-details').html(detailsHtml);

    $('#p-modal-live').attr('href', p.liveUrl);
    $('#p-modal-github').attr('href', p.githubUrl);

    $('#project-modal').addClass('active');
  }

  renderGuestbook() {
    const $container = $('#guestbook-list-container');
    if (!$container.length) return;

    const savedGb = localStorage.getItem('obsidian_guestbook_notes');
    const entries = savedGb ? JSON.parse(savedGb) : [
      { name: "Aria Vance", date: "15.08.2026", text: "Love the subsurface Obsidian pool interface!" },
      { name: "Julian Kai", date: "12.08.2026", text: "Excited to see the Smart Clothing Organizer IoT project unfold!" }
    ];

    let html = '';
    entries.forEach(entry => {
      html += `
        <div class="gb-entry-item">
          <div class="gb-entry-header">
            <span class="gb-entry-name">${this.escapeHtml(entry.name)}</span>
            <span class="gb-entry-date">${this.escapeHtml(entry.date)}</span>
          </div>
          <div class="gb-entry-text">${this.escapeHtml(entry.text)}</div>
        </div>
      `;
    });
    $container.html(html);
  }

  escapeHtml(str) {
    return $('<div>').text(str || '').html();
  }
}

window.contentManager = new ContentManager();