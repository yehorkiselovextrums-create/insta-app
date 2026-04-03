const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

console.log('Environment check:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);

// PostgreSQL connection
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
} else {
  console.error('ERROR: DATABASE_URL not set!');
  pool = {
    query: async () => ({ rows: [] })
  };
}

// Initialize database
let dbReady = false;
async function initDB() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('Cannot initialize DB: DATABASE_URL is not set');
      return;
    }
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        image_url TEXT NOT NULL,
        caption TEXT,
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Database initialized successfully');
    dbReady = true;
  } catch (err) {
    console.error('✗ Database init error:', err.message);
    dbReady = false;
  }
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: dbReady });
});

// Get all posts (newest first)
app.get('/api/posts', async (req, res) => {
  try {
    if (!dbReady) {
      console.error('DB not ready');
      return res.status(503).json({ error: 'Database not ready', posts: [] });
    }
    const result = await pool.query(
      'SELECT * FROM posts ORDER BY created_at DESC'
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error('GET /api/posts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch posts', posts: [] });
  }
});

// Get single post
app.get('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM posts WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create post
app.post('/api/posts', async (req, res) => {
  try {
    const { title, image_url, caption } = req.body;
    
    if (!title || !image_url) {
      return res.status(400).json({ error: 'Title and image_url are required' });
    }

    if (!dbReady) {
      return res.status(503).json({ error: 'Database not ready' });
    }

    const result = await pool.query(
      'INSERT INTO posts (title, image_url, caption, likes) VALUES ($1, $2, $3, 0) RETURNING *',
      [title, image_url, caption || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/posts error:', err.message);
    res.status(500).json({ error: 'Failed to create post', details: err.message });
  }
});

// Like post
app.patch('/api/posts/:id/likes', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE posts SET likes = likes + 1 WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update likes' });
  }
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDB();
});