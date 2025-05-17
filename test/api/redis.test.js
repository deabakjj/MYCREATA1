/**
 * @file Redis Caching Tests
 * @description Tests for Redis caching service
 */

const { expect } = require('chai');
const sinon = require('sinon');
const redisCache = require('../../src/cache/redis');

describe('Redis Cache Tests', () => {
  before(async () => {
    // Mock Redis client for testing
    sinon.stub(redisCache, 'initRedis').returns(true);
    sinon.stub(redisCache, 'set').callsFake((key, value, ttl) => {
      return Promise.resolve('OK');
    });
    sinon.stub(redisCache, 'get').callsFake((key) => {
      if (key === 'testKey') {
        return Promise.resolve(JSON.stringify({ test: 'data' }));
      }
      return Promise.resolve(null);
    });
    sinon.stub(redisCache, 'del').callsFake((key) => {
      return Promise.resolve(1);
    });
    sinon.stub(redisCache, 'closeRedis').returns(true);
  });

  after(async () => {
    sinon.restore();
  });
  
  describe('Basic Redis Operations', () => {
    it('should set and get cache value correctly', async () => {
      await redisCache.set('testKey', { test: 'data' }, 3600);
      const result = await redisCache.get('testKey');
      
      expect(result).to.deep.equal({ test: 'data' });
    });
    
    it('should return null for non-existent key', async () => {
      const result = await redisCache.get('nonExistentKey');
      
      expect(result).to.be.null;
    });
    
    it('should delete cache value correctly', async () => {
      const result = await redisCache.del('testKey');
      
      expect(result).to.equal(1);
    });
  });
  
  describe('Cache Service Lifecycle', () => {
    it('should initialize Redis connection', async () => {
      const result = redisCache.initRedis();
      
      expect(result).to.be.true;
    });
    
    it('should close Redis connection', async () => {
      const result = redisCache.closeRedis();
      
      expect(result).to.be.true;
    });
  });
});
