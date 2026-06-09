const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// In-memory active sessions (simple tokens)
const activeSessions = new Set();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database Helpers (Atomic Reads/Writes)
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // Initialize with default template if not exists
      const defaultDB = {
        articles: [],
        comments: [],
        config: {
          adminPasswordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' // admin123
        }
      };
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2), 'utf-8');
      return defaultDB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file:', err);
    return { articles: [], comments: [], config: {} };
  }
}

function writeDB(data) {
  try {
    const tempFile = DB_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

// Middleware: Verify Admin Session
function requireAdmin(req, res, next) {
  const token = req.cookies.admin_token;
  if (token && activeSessions.has(token)) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized: Admin privileges required.' });
  }
}

// Check Authentication Status
app.get('/api/check-auth', (req, res) => {
  const token = req.cookies.admin_token;
  if (token && activeSessions.has(token)) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

// Login Admin
app.post('/api/login', (req, res) => {
  const { passwordHash } = req.body;
  const db = readDB();
  const targetHash = db.config.adminPasswordHash || '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

  if (passwordHash === targetHash) {
    // Generate a simple token
    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.add(token);
    // Set cookie (valid for 1 day)
    res.cookie('admin_token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });
    res.json({ success: true, message: 'Logged in successfully.' });
  } else {
    res.status(401).json({ error: 'Incorrect password.' });
  }
});

// Logout Admin
app.post('/api/logout', (req, res) => {
  const token = req.cookies.admin_token;
  if (token) {
    activeSessions.delete(token);
    res.clearCookie('admin_token');
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Change Admin Password
app.post('/api/change-password', requireAdmin, (req, res) => {
  const { newPasswordHash } = req.body;
  if (!newPasswordHash || newPasswordHash.length !== 64) {
    return res.status(400).json({ error: 'Invalid password hash.' });
  }
  const db = readDB();
  db.config.adminPasswordHash = newPasswordHash;
  if (writeDB(db)) {
    res.json({ success: true, message: 'Password updated successfully.' });
  } else {
    res.status(500).json({ error: 'Failed to write to database.' });
  }
});

// GET all articles
app.get('/api/articles', (req, res) => {
  const db = readDB();
  // Return articles sorted by date descending (newest first)
  const sortedArticles = [...db.articles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(sortedArticles);
});

// GET single article
app.get('/api/articles/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const article = db.articles.find(a => a.id === id);
  if (article) {
    res.json(article);
  } else {
    res.status(404).json({ error: 'Article not found.' });
  }
});

// POST create article (Admin Only)
app.post('/api/articles', requireAdmin, (req, res) => {
  const { title, excerpt, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const db = readDB();
  const newArticle = {
    id: Date.now().toString(),
    title,
    excerpt: excerpt || (content.substring(0, 150) + '...'),
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.articles.push(newArticle);
  if (writeDB(db)) {
    res.status(201).json(newArticle);
  } else {
    res.status(500).json({ error: 'Failed to save article.' });
  }
});

// PUT update article (Admin Only)
app.put('/api/articles/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { title, excerpt, content } = req.body;

  const db = readDB();
  const index = db.articles.findIndex(a => a.id === id);

  if (index !== -1) {
    db.articles[index] = {
      ...db.articles[index],
      title: title || db.articles[index].title,
      excerpt: excerpt !== undefined ? excerpt : db.articles[index].excerpt,
      content: content || db.articles[index].content,
      updatedAt: new Date().toISOString()
    };

    if (writeDB(db)) {
      res.json(db.articles[index]);
    } else {
      res.status(500).json({ error: 'Failed to update article.' });
    }
  } else {
    res.status(404).json({ error: 'Article not found.' });
  }
});

// DELETE article and its comments (Admin Only)
app.delete('/api/articles/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const initialCount = db.articles.length;

  db.articles = db.articles.filter(a => a.id !== id);
  // Also clean up comments for this article
  db.comments = db.comments.filter(c => c.articleId !== id);

  if (db.articles.length < initialCount) {
    if (writeDB(db)) {
      res.json({ success: true, message: 'Article and its comments deleted successfully.' });
    } else {
      res.status(500).json({ error: 'Failed to delete article from storage.' });
    }
  } else {
    res.status(404).json({ error: 'Article not found.' });
  }
});

// GET comments for an article
app.get('/api/articles/:id/comments', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  // Filter comments for this article, sorted by oldest first
  const comments = db.comments
    .filter(c => c.articleId === id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(comments);
});

// POST add comment
app.post('/api/articles/:id/comments', (req, res) => {
  const { id } = req.params; // articleId
  const { author, content } = req.body;

  if (!author || !content) {
    return res.status(400).json({ error: 'Author and content are required.' });
  }

  const db = readDB();
  // Verify article exists
  const articleExists = db.articles.some(a => a.id === id);
  if (!articleExists) {
    return res.status(404).json({ error: 'Article not found.' });
  }

  const newComment = {
    id: Date.now().toString(),
    articleId: id,
    author: author.substring(0, 50),
    content: content.substring(0, 1000),
    createdAt: new Date().toISOString()
  };

  db.comments.push(newComment);
  if (writeDB(db)) {
    res.status(201).json(newComment);
  } else {
    res.status(500).json({ error: 'Failed to save comment.' });
  }
});

// DELETE comment (Admin Only)
app.delete('/api/comments/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const initialCount = db.comments.length;

  db.comments = db.comments.filter(c => c.id !== id);

  if (db.comments.length < initialCount) {
    if (writeDB(db)) {
      res.json({ success: true, message: 'Comment deleted successfully.' });
    } else {
      res.status(500).json({ error: 'Failed to delete comment from storage.' });
    }
  } else {
    res.status(404).json({ error: 'Comment not found.' });
  }
});

// Blog shortcut routes
app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'blog.html'));
});
app.get('/admin', (req, res) => {
  res.redirect('/blog.html?admin=true');
});

// Serve all static files in root directory
app.use(express.static(__dirname));

// Start server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` The Call of the Stars — Dynamic Server Running!   `);
  console.log(` Local URL: http://localhost:${PORT}             `);
  console.log(`===================================================`);
});
