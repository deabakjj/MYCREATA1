/**
 * @file Metrics API endpoints test
 * @description Tests for the metrics API endpoints
 */

const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/server');
const mongoose = require('mongoose');

describe('Metrics API Tests', () => {
  before(async () => {
    // Setup tests
    console.log('Setting up metrics API tests');
  });

  after(async () => {
    // Cleanup after tests
    await mongoose.disconnect();
    console.log('Metrics API tests completed');
  });
  
  describe('GET /api/metrics', () => {
    it('should return metrics in Prometheus format', async () => {
      const res = await request(app)
        .get('/api/metrics')
        .expect('Content-Type', /text/)
        .expect(200);
      
      expect(res.text).to.include('# HELP');
      expect(res.text).to.include('# TYPE');
    });
  });
  
  describe('GET /api/metrics/blockchain', () => {
    it('should return blockchain metrics in Prometheus format', async () => {
      const res = await request(app)
        .get('/api/metrics/blockchain')
        .expect('Content-Type', /text/)
        .expect(200);
      
      expect(res.text).to.include('# HELP');
      expect(res.text).to.include('# TYPE');
      expect(res.text).to.include('nest_token_transfers_total');
    });
  });
  
  describe('GET /api/metrics/contracts', () => {
    it('should return contract metrics in Prometheus format', async () => {
      const res = await request(app)
        .get('/api/metrics/contracts')
        .expect('Content-Type', /text/)
        .expect(200);
      
      expect(res.text).to.include('# HELP');
      expect(res.text).to.include('# TYPE');
      expect(res.text).to.include('nest_nft_mints_total');
    });
  });
  
  describe('Protected Metrics Endpoints', () => {
    // These tests would require authentication
    it('should require authentication for dashboard metrics', async () => {
      await request(app)
        .get('/api/metrics/dashboards/user-conversion')
        .expect(401);
      
      await request(app)
        .get('/api/metrics/dashboards/wallet-retention')
        .expect(401);
      
      await request(app)
        .get('/api/metrics/dashboards/token-exchange')
        .expect(401);
      
      await request(app)
        .get('/api/metrics/dashboards/xp-accumulation')
        .expect(401);
      
      await request(app)
        .get('/api/metrics/dashboards/nft-ownership')
        .expect(401);
    });
  });
});
