const request = require('supertest');
const app = require('../server');

describe('Auth Endpoints', () => {
  it('should return 400 for invalid register data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: '123', email: 'invalid', password: 'short' });
    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid login data', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid', password: '' });
    expect(response.status).toBe(400);
  });
});
