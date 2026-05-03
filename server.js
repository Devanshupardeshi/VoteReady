import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import rateLimit from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Trust the first proxy (e.g., Google Cloud Run Load Balancer) for accurate IP rate limiting
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://maps.gstatic.com", "https://maps.googleapis.com", "https://i.ytimg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://maps.googleapis.com", "https://www.googleapis.com"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://www.google.com"],
    },
  },
}));

// Restrict CORS: Allow only localhost in dev, disable CORS in production (since frontend and backend are served together)
const corsOptions = {
  origin: process.env.NODE_ENV === 'development' ? ['http://localhost:5173', 'http://127.0.0.1:5173'] : false
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Apply the rate limiting middleware to API calls only
app.use('/api/', apiLimiter);

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');

// --- API Proxy Routes ---

// Gemini Proxy
app.post('/api/gemini', async (req, res) => {
  try {
    const { modelName, requestBody } = req.body;
    
    // Prevent path traversal and parameter injection
    const allowedModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];
    if (!allowedModels.includes(modelName)) {
      return res.status(400).json({ error: 'Invalid or unsupported model name.' });
    }
    
    if (!process.env.VITE_GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.VITE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errData);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Gemini API Proxy Error:', error);
    res.status(500).json({ error: 'Failed to fetch from Gemini API.' });
  }
});

// Gemini Models Proxy
app.get('/api/gemini-models', async (req, res) => {
  try {
    if (!process.env.VITE_GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.VITE_GEMINI_API_KEY}`
    );
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errData);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Gemini Models API Proxy Error:', error);
    res.status(500).json({ error: 'Failed to fetch Gemini models.' });
  }
});

// YouTube Proxy
app.get('/api/youtube', async (req, res) => {
  try {
    const { query, channelId, order } = req.query;
    if (!process.env.VITE_YOUTUBE_API_KEY) {
      return res.status(500).json({ error: 'YouTube API key is not configured.' });
    }
    
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: '3',
      key: process.env.VITE_YOUTUBE_API_KEY,
    });
    
    if (channelId) params.append('channelId', channelId);
    if (order) params.append('order', order);
    
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
    
    const response = await fetch(youtubeUrl);
    const data = await response.json();
    console.log('YouTube API response status:', response.status);
    console.log('YouTube API response data:', data);
    
    res.json(data);
  } catch (error) {
    console.error('YouTube API Proxy Error:', error);
    res.status(500).json({ error: 'Failed to fetch from YouTube API.' });
  }
});

// Translate Proxy
app.post('/api/translate', async (req, res) => {
  try {
    const { q, target } = req.body;
    if (!process.env.VITE_GOOGLE_TRANSLATE_API_KEY) {
      return res.status(500).json({ error: 'Translate API key is not configured.' });
    }
    
    // Support either a string or an array of strings
    const url = `https://translation.googleapis.com/language/translate/v2?key=${process.env.VITE_GOOGLE_TRANSLATE_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q, target, source: 'en', format: 'text' }),
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Translate API Proxy Error:', error);
    res.status(500).json({ error: 'Failed to fetch from Translate API.' });
  }
});

// Serve React Static Files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback Route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Ignore logging for 404 file not found errors from sendFile
  if (err.status !== 404 && process.env.NODE_ENV !== 'test') {
    /* v8 ignore next 2 */
    console.error('Unhandled API Error:', err.stack);
  }
  res.status(err.status || 500).json({ error: err.message || 'An unexpected error occurred on the server.' });
});

/* v8 ignore next 5 */
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}


export { app };
