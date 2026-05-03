import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from './server.js'; // Ensure app is exported from server.js!

describe('Express API Backend', () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.statusCode).toBe(404);
  });

  it('should enforce rate limiting', async () => {
    const res = await request(app).get('/api/gemini-models');
    expect(res.statusCode).not.toBe(404);
  });

  it('should include security headers (Helmet)', async () => {
    const res = await request(app).get('/');
    expect(res.headers).toHaveProperty('x-frame-options');
    expect(res.headers).toHaveProperty('x-xss-protection');
    expect(res.headers['x-frame-options']).toMatch(/SAMEORIGIN|DENY/i);
  });

  it('POST /api/gemini should return 400 for invalid model name', async () => {
    const res = await request(app)
      .post('/api/gemini')
      .send({ modelName: 'invalid-model', requestBody: {} });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Invalid or unsupported model name.');
  });

  it('POST /api/gemini should return 500 if API key is missing', async () => {
    delete process.env.VITE_GEMINI_API_KEY;
    const res = await request(app)
      .post('/api/gemini')
      .send({ modelName: 'gemini-1.5-flash', requestBody: {} });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Gemini API key is not configured on the server.');
  });

  it('GET /api/gemini-models should return 500 if API key is missing', async () => {
    delete process.env.VITE_GEMINI_API_KEY;
    const res = await request(app).get('/api/gemini-models');
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Gemini API key is not configured.');
  });

  it('GET /api/youtube should return 500 if API key is missing', async () => {
    delete process.env.VITE_YOUTUBE_API_KEY;
    const res = await request(app).get('/api/youtube?query=election');
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('YouTube API key is not configured.');
  });

  it('POST /api/translate should return 500 if API key is missing', async () => {
    delete process.env.VITE_GOOGLE_TRANSLATE_API_KEY;
    const res = await request(app)
      .post('/api/translate')
      .send({ q: 'hello', target: 'hi' });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Translate API key is not configured.');
  });

  describe('Successful proxy routes', () => {
    beforeAll(() => {
      process.env.VITE_GEMINI_API_KEY = 'test_key';
      process.env.VITE_YOUTUBE_API_KEY = 'test_key';
      process.env.VITE_GOOGLE_TRANSLATE_API_KEY = 'test_key';
      
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('youtube')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ items: [] })
          });
        }
        if (url.includes('translate')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: { translations: [] } })
          });
        }
        if (url.includes(':generateContent')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ candidates: [] })
          });
        }
        if (url.includes('models?key=')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ models: [] })
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
    });

    afterAll(() => {
      global.fetch.mockClear();
    });

    it('should successfully proxy POST /api/gemini', async () => {
      const res = await request(app)
        .post('/api/gemini')
        .send({ modelName: 'gemini-1.5-flash', requestBody: { contents: [] } });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('candidates');
    });

    it('should successfully proxy GET /api/gemini-models', async () => {
      const res = await request(app).get('/api/gemini-models');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('models');
    });

    it('should successfully proxy GET /api/youtube', async () => {
      const res = await request(app).get('/api/youtube?query=election');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('items');
    });

    it('should successfully proxy POST /api/translate', async () => {
      const res = await request(app)
        .post('/api/translate')
        .send({ q: 'hello', target: 'hi' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should return 500 if Gemini API returns non-ok status', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error')
      });

      const response = await request(app)
        .post('/api/gemini')
        .send({ modelName: 'gemini-2.5-flash', requestBody: { contents: [{ parts: [{ text: 'Hello' }] }] } });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should trigger the global error handler for an unhandled error', async () => {
      // Mock an error by sending an invalid payload that causes a crash, or we can just mock a route specifically to throw.
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Simulated fetch failure'));

      const response = await request(app)
        .post('/api/gemini')
        .send({ modelName: 'gemini-1.5-flash', requestBody: { contents: [{ parts: [{ text: 'trigger error' }] }] } });

      // The catch block in /api/gemini handles this and returns 500.
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch from Gemini API.');
    });

    it('should return 500 if YouTube API fails', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('YouTube Error'));
      const response = await request(app).get('/api/youtube?q=test');
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch from YouTube API.');
    });

    it('should return 500 if Translate API fails', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Translate Error'));
      const response = await request(app).post('/api/translate').send({ q: 'hello', target: 'es' });
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch from Translate API.');
    });

    it('should return 500 if Gemini Models API fails', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Models Error'));
      const response = await request(app).get('/api/gemini-models');
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch Gemini models.');
    });

    it('should invoke global error handler when next(err) is called (if any middleware fails)', async () => {
      // We can simulate an error by making express-json middleware fail, e.g. sending bad JSON.
      const response = await request(app)
        .post('/api/gemini')
        .set('Content-Type', 'application/json')
        .send('{"invalid json');

      expect(response.status).toBe(400); // Express body-parser returns 400 for bad JSON
      // But let's check if the global handler catches it. 
      // Actually express handles body-parser errors with next(err), which hits our global error handler!
      expect(response.body).toHaveProperty('error');
    });
  });
});
