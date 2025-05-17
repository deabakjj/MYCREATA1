/**
 * @file Cache Middleware Tests
 * @description Tests for API caching middleware
 */

const { expect } = require('chai');
const sinon = require('sinon');
const cacheMiddleware = require('../../src/api/middlewares/cache');
const redisCache = require('../../src/cache/redis');

describe('Cache Middleware Tests', () => {
  let req, res, next;
  
  before(async () => {
    // Mock Redis cache for testing
    sinon.stub(redisCache, 'get').callsFake((key) => {
      if (key === 'cache:GET:/api/test') {
        return Promise.resolve(JSON.stringify({
          status: 200,
          data: { cached: true },
          headers: { 'content-type': 'application/json' }
        }));
      }
      return Promise.resolve(null);
    });
    
    sinon.stub(redisCache, 'set').callsFake((key, value, ttl) => {
      return Promise.resolve('OK');
    });
  });

  after(async () => {
    sinon.restore();
  });
  
  beforeEach(() => {
    // Setup request, response, and next function for each test
    req = {
      method: 'GET',
      originalUrl: '/api/test',
      headers: {},
    };
    
    res = {
      statusCode: 200,
      setHeader: sinon.spy(),
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
      send: sinon.spy(),
      _body: null,
    };
    
    // Capture the response body
    const originalJson = res.json;
    res.json = function(body) {
      res._body = body;
      return originalJson.apply(this, arguments);
    };
    
    next = sinon.spy();
  });
  
  describe('Cache Hit Scenario', () => {
    it('should return cached response on cache hit', async () => {
      // Create middleware with 60 seconds TTL
      const middleware = cacheMiddleware(60);
      
      // Execute middleware
      await middleware(req, res, next);
      
      // Verify cache hit behavior
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ cached: true })).to.be.true;
      expect(next.called).to.be.false;
    });
    
    it('should set appropriate headers on cache hit', async () => {
      const middleware = cacheMiddleware(60);
      
      await middleware(req, res, next);
      
      expect(res.setHeader.calledWith('X-Cache', 'HIT')).to.be.true;
      expect(res.setHeader.calledWith('content-type', 'application/json')).to.be.true;
    });
  });
  
  describe('Cache Miss Scenario', () => {
    it('should call next() on cache miss', async () => {
      // Change request URL to create cache miss
      req.originalUrl = '/api/uncached';
      
      const middleware = cacheMiddleware(60);
      
      await middleware(req, res, next);
      
      expect(next.calledOnce).to.be.true;
    });
    
    it('should add cache functions to response on cache miss', async () => {
      req.originalUrl = '/api/uncached';
      
      const middleware = cacheMiddleware(60);
      
      await middleware(req, res, next);
      
      expect(res.cacheResponse).to.be.a('function');
    });
  });
  
  describe('Cache Exceptions', () => {
    it('should not cache responses for non-GET requests', async () => {
      req.method = 'POST';
      
      const middleware = cacheMiddleware(60);
      
      await middleware(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      expect(redisCache.get.called).to.be.false;
    });
    
    it('should not cache if Cache-Control: no-cache is set', async () => {
      req.headers['cache-control'] = 'no-cache';
      
      const middleware = cacheMiddleware(60);
      
      await middleware(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      expect(redisCache.get.called).to.be.false;
    });
  });
});
