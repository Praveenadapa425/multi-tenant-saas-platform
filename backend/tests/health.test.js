const request = require('supertest');

// Mock the database pool before importing the server
jest.mock('../src/config/database', () => ({
  pool: {
    query: jest.fn(() => Promise.resolve({ rows: [] })),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn(() => Promise.resolve({ rows: [{ now: new Date() }] })),
      release: jest.fn()
    })
  }
}));

const app = require('../src/server');

describe('Health Check API Endpoint', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body.status).toBe('ok');
      expect(response.body.database).toBeDefined();
    });

    it('should handle health check without authentication', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.status).toBe('ok');
    });
  });
});