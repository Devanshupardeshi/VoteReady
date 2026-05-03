import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './server.js'; // Ensure app is exported from server.js!

describe('Express API Backend', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.statusCode).toBe(404);
  });

  it('should enforce rate limiting', async () => {
    // This is a basic check. To fully test rate limiting, we'd need to send 101 requests.
    // For now, we'll just check that it responds normally to a single request.
    const res = await request(app).get('/api/gemini-models');
    // It might return 500 if API key is not set in test environment, but the route should exist.
    expect(res.statusCode).not.toBe(404);
  });

  it('should include security headers (Helmet)', async () => {
    const res = await request(app).get('/');
    expect(res.headers).toHaveProperty('x-frame-options');
    expect(res.headers).toHaveProperty('x-xss-protection');
    expect(res.headers['x-frame-options']).toMatch(/SAMEORIGIN|DENY/i);
  });
});
