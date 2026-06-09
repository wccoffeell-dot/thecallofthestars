/* ============================================
   The Call of the Stars — Blog & Comments System
   ============================================ */

let isAdmin = false;
let currentArticleId = null;

document.addEventListener('DOMContentLoaded', () => {
  initStarField();
  initNavigation();
  checkAdminAuth().then(() => {
    initApp();
  });
  setupEventHandlers();
});

/* --- Star Field Animation (Canvas) --- */
function initStarField() {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    const count = Math.floor((w * h) / 4000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.2,
        alpha: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.0008 + 0.0003,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.pageYOffset; }, { passive: true });

  function draw(time) {
    ctx.clearRect(0, 0, w, h);
    const parallax = scrollY * 0.08;

    for (const s of stars) {
      const twinkle = Math.sin(time * s.speed + s.phase) * 0.3 + 0.7;
      const a = s.alpha * twinkle;
      ctx.beginPath();
      ctx.arc(s.x, (s.y + parallax) % h, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 215, 205, ${a})`;
      ctx.fill();

      if (s.r > 1.1) {
        ctx.beginPath();
        ctx.arc(s.x, (s.y + parallax) % h, s.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 168, 83, ${a * 0.08})`;
        ctx.fill();
      }
    }
    requestAnimationFrame(draw);
  }

  resize();
  createStars();
  requestAnimationFrame(draw);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); createStars(); }, 200);
  });
}

/* --- Mobile Responsive Navigation --- */
function initNavigation() {
  const nav = document.querySelector('.site-nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      const isOpen = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });

    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

/* --- Crypto Helper (SHA-256 Hash) --- */
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/* --- Toast Notifications --- */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type} active`;
  setTimeout(() => {
    toast.classList.remove('active');
  }, 4000);
}

/* --- Authentication Checking --- */
async function checkAdminAuth() {
  try {
    const res = await fetch('/api/check-auth');
    const data = await res.json();
    isAdmin = data.authenticated;
    updateAdminUI();
  } catch (err) {
    console.error('Auth check failed:', err);
    isAdmin = false;
  }
}

function updateAdminUI() {
  const adminBar = document.getElementById('admin-bar');
  const loginLink = document.getElementById('link-admin-login');

  if (isAdmin) {
    if (adminBar) adminBar.style.display = 'flex';
    if (loginLink) {
      loginLink.textContent = 'Logout Session';
      loginLink.href = '#';
    }
  } else {
    if (adminBar) adminBar.style.display = 'none';
    if (loginLink) {
      loginLink.textContent = 'Admin Panel';
      loginLink.href = '#';
    }
  }
}

/* --- Core App Initialization --- */
function initApp() {
  const params = new URLSearchParams(window.location.search);
  const articleId = params.get('id');
  const triggerLogin = params.get('admin');

  // Toggle sections based on URL params
  if (articleId) {
    currentArticleId = articleId;
    document.getElementById('view-feed').style.display = 'none';
    document.getElementById('view-detail').style.display = 'block';
    loadArticleDetail(articleId);
  } else {
    currentArticleId = null;
    document.getElementById('view-feed').style.display = 'grid';
    document.getElementById('view-detail').style.display = 'none';
    loadArticlesFeed();
  }

  // Trigger login modal if requested in URL
  if (triggerLogin === 'true' && !isAdmin) {
    openModal('modal-login');
  }
}

/* --- Modal Controllers --- */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    // Focus first input
    const input = modal.querySelector('input');
    if (input) input.focus();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    // Clear forms inside modal
    const form = modal.querySelector('form');
    if (form) form.reset();
  }
}

/* --- Fetch and Render Operations --- */

// Load list of articles for feed view
async function loadArticlesFeed() {
  const feedArticles = document.getElementById('feed-articles');
  const loadingState = document.getElementById('feed-loading');
  if (!feedArticles) return;

  try {
    const res = await fetch('/api/articles');
    if (!res.ok) throw new Error('Failed to fetch articles');
    const articles = await res.json();

    loadingState.style.display = 'none';
    feedArticles.innerHTML = '';

    if (articles.length === 0) {
      feedArticles.innerHTML = '<div class="empty-state">No starry logs have been posted yet.</div>';
      return;
    }

    articles.forEach(article => {
      const date = new Date(article.createdAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const card = document.createElement('div');
      card.className = 'article-card';

      let adminControlsHtml = '';
      if (isAdmin) {
        adminControlsHtml = `
          <div class="article-card-admin-controls">
            <button class="btn-primary btn-small btn-secondary btn-edit-article" data-id="${article.id}">Edit</button>
            <button class="btn-primary btn-small btn-danger btn-delete-article" data-id="${article.id}">Delete</button>
          </div>
        `;
      }

      card.innerHTML = `
        <h2 class="article-card-title"><a href="blog.html?id=${article.id}">${escapeHtml(article.title)}</a></h2>
        <div class="article-meta">
          <span>${date}</span>
          <span>By Liang Song</span>
        </div>
        <div class="article-card-excerpt">${escapeHtml(article.excerpt)}</div>
        <div class="article-card-footer">
          <a href="blog.html?id=${article.id}" class="btn-primary btn-small">Read Entry</a>
          ${adminControlsHtml}
        </div>
      `;
      feedArticles.appendChild(card);
    });

    attachDynamicCardListeners();
  } catch (err) {
    console.error(err);
    loadingState.textContent = 'Failed to load starlight logs.';
    showToast('Failed to load articles from the database.', 'error');
  }
}

// Load full article detail and comments
async function loadArticleDetail(id) {
  const detailTitle = document.getElementById('detail-title');
  const detailDate = document.getElementById('detail-date');
  const detailContent = document.getElementById('detail-content');

  try {
    const res = await fetch(`/api/articles/${id}`);
    if (res.status === 404) {
      showToast('Article not found.', 'error');
      setTimeout(() => { window.location.href = 'blog.html'; }, 2000);
      return;
    }
    if (!res.ok) throw new Error('Error loading article details.');

    const article = await res.json();
    const date = new Date(article.createdAt).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    detailTitle.textContent = article.title;
    detailDate.textContent = date;

    // Convert markdown paragraph breaks to HTML paragraphs
    const contentHtml = article.content
      .split('\n\n')
      .map(p => `<p>${escapeHtml(p)}</p>`)
      .join('');
    detailContent.innerHTML = contentHtml;

    loadComments(id);
  } catch (err) {
    console.error(err);
    showToast('Failed to load article detail.', 'error');
  }
}

// Load comments for a specific article
async function loadComments(articleId) {
  const commentsList = document.getElementById('comments-list');
  const commentCount = document.getElementById('comment-count');
  if (!commentsList) return;

  try {
    const res = await fetch(`/api/articles/${articleId}/comments`);
    if (!res.ok) throw new Error('Error loading comments');
    const comments = await res.json();

    commentCount.textContent = comments.length;
    commentsList.innerHTML = '';

    if (comments.length === 0) {
      commentsList.innerHTML = '<div class="empty-state">No thoughts shared yet. Be the first to leave a message.</div>';
      return;
    }

    comments.forEach(comment => {
      const date = new Date(comment.createdAt).toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const item = document.createElement('div');
      item.className = 'comment-item';

      let deleteHtml = '';
      if (isAdmin) {
        deleteHtml = `
          <div class="comment-actions">
            <button class="btn-primary btn-small btn-danger btn-delete-comment" data-id="${comment.id}">Delete</button>
          </div>
        `;
      }

      item.innerHTML = `
        <div class="comment-header">
          <span class="comment-author">${escapeHtml(comment.author)}</span>
          <span class="comment-date">${date}</span>
        </div>
        <div class="comment-body">${escapeHtml(comment.content)}</div>
        ${deleteHtml}
      `;
      commentsList.appendChild(item);
    });

    attachDynamicCommentListeners();
  } catch (err) {
    console.error(err);
    showToast('Failed to load comments.', 'error');
  }
}

/* --- Event Handlers Setup --- */
function setupEventHandlers() {
  // Modal close buttons (X and cancels)
  document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = button.getAttribute('data-close');
      closeModal(modalId);
    });
  });

  // Clicking overlay backdrop closes modal
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  // Back to journal button
  const btnBack = document.getElementById('btn-back-to-feed');
  if (btnBack) {
    btnBack.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'blog.html';
    });
  }

  // Footer Login Trigger
  const linkLogin = document.getElementById('link-admin-login');
  if (linkLogin) {
    linkLogin.addEventListener('click', async (e) => {
      e.preventDefault();
      if (isAdmin) {
        // Log out
        try {
          const res = await fetch('/api/logout', { method: 'POST' });
          if (res.ok) {
            isAdmin = false;
            updateAdminUI();
            showToast('Logged out successfully.');
            // Reload page to reflect guest view
            setTimeout(() => { window.location.reload(); }, 1000);
          }
        } catch (err) {
          console.error(err);
          showToast('Failed to logout.', 'error');
        }
      } else {
        openModal('modal-login');
      }
    });
  }

  // Admin Bar Logout Button
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch('/api/logout', { method: 'POST' });
        if (res.ok) {
          isAdmin = false;
          updateAdminUI();
          showToast('Logged out successfully.');
          setTimeout(() => { window.location.reload(); }, 1000);
        }
      } catch (err) {
        console.error(err);
        showToast('Logout failed.', 'error');
      }
    });
  }

  // Admin Bar Create Article Button
  const btnNewArticle = document.getElementById('btn-new-article');
  if (btnNewArticle) {
    btnNewArticle.addEventListener('click', () => {
      document.getElementById('editor-article-id').value = '';
      document.getElementById('editor-modal-title').textContent = 'Write New Article';
      openModal('modal-editor');
    });
  }

  // Admin Bar Change Password Button
  const btnChangePasswordTrigger = document.getElementById('btn-change-password-trigger');
  if (btnChangePasswordTrigger) {
    btnChangePasswordTrigger.addEventListener('click', () => {
      openModal('modal-password');
    });
  }

  // Login Form Submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('login-password').value;
      const hash = await sha256(password);

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passwordHash: hash })
        });

        if (res.ok) {
          closeModal('modal-login');
          isAdmin = true;
          updateAdminUI();
          showToast('Author session authenticated.');
          setTimeout(() => {
            // Strip any query parameters and reload to render admin actions
            window.location.href = window.location.pathname + (currentArticleId ? `?id=${currentArticleId}` : '');
          }, 1000);
        } else {
          showToast('Unlock failed. Incorrect password.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Authentication server error.', 'error');
      }
    });
  }

  // Change Password Form Submission
  const passwordForm = document.getElementById('password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (newPassword !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
      }

      const hash = await sha256(newPassword);

      try {
        const res = await fetch('/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPasswordHash: hash })
        });

        if (res.ok) {
          closeModal('modal-password');
          showToast('Author credentials updated successfully.');
        } else {
          const data = await res.json();
          showToast(data.error || 'Failed to change password.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Server error changing password.', 'error');
      }
    });
  }

  // Article Editor Form Submission (Publish / Edit)
  const editorForm = document.getElementById('editor-form');
  if (editorForm) {
    editorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editor-article-id').value;
      const title = document.getElementById('editor-title').value;
      const excerpt = document.getElementById('editor-excerpt').value;
      const content = document.getElementById('editor-content').value;

      const url = id ? `/api/articles/${id}` : '/api/articles';
      const method = id ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, excerpt, content })
        });

        if (res.ok) {
          closeModal('modal-editor');
          showToast(id ? 'Article modified.' : 'New article published!');
          setTimeout(() => {
            if (id) {
              window.location.reload();
            } else {
              window.location.href = 'blog.html';
            }
          }, 1000);
        } else {
          const data = await res.json();
          showToast(data.error || 'Failed to save article.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Network error saving article.', 'error');
      }
    });
  }

  // Comment Submission Form
  const commentForm = document.getElementById('comment-form');
  if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentArticleId) return;

      const author = document.getElementById('comment-author').value;
      const content = document.getElementById('comment-content').value;

      try {
        const res = await fetch(`/api/articles/${currentArticleId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ author, content })
        });

        if (res.ok) {
          document.getElementById('comment-content').value = '';
          showToast('Thought posted successfully.');
          loadComments(currentArticleId);
        } else {
          const data = await res.json();
          showToast(data.error || 'Failed to post message.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Server error posting comment.', 'error');
      }
    });
  }
}

// Attach listeners for Edit/Delete buttons on feed articles
function attachDynamicCardListeners() {
  // Edit Article
  document.querySelectorAll('.btn-edit-article').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = button.getAttribute('data-id');
      try {
        const res = await fetch(`/api/articles/${id}`);
        if (res.ok) {
          const article = await res.json();
          document.getElementById('editor-article-id').value = article.id;
          document.getElementById('editor-title').value = article.title;
          document.getElementById('editor-excerpt').value = article.excerpt;
          document.getElementById('editor-content').value = article.content;
          document.getElementById('editor-modal-title').textContent = 'Edit Article';
          openModal('modal-editor');
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to fetch article details.', 'error');
      }
    });
  });

  // Delete Article
  document.querySelectorAll('.btn-delete-article').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = button.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this article and all its messages? This action cannot be undone.')) {
        try {
          const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Article deleted.');
            loadArticlesFeed();
          } else {
            showToast('Delete operation failed.', 'error');
          }
        } catch (err) {
          console.error(err);
          showToast('Server error deleting article.', 'error');
        }
      }
    });
  });
}

// Attach listeners for Delete buttons on comments
function attachDynamicCommentListeners() {
  document.querySelectorAll('.btn-delete-comment').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = button.getAttribute('data-id');
      if (confirm('Are you sure you want to remove this message?')) {
        try {
          const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Message deleted.');
            if (currentArticleId) loadComments(currentArticleId);
          } else {
            showToast('Delete comment failed.', 'error');
          }
        } catch (err) {
          console.error(err);
          showToast('Network error deleting comment.', 'error');
        }
      }
    });
  });
}

/* --- HTML Escaping Helper (Security against XSS) --- */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
