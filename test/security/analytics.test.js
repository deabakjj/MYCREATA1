const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const { createSandbox } = require('sinon');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = require('../../src/server');
const { ensureAuthenticated, ensureAdmin } = require('../../src/api/middlewares/authMiddleware');
const User = require('../../src/models/user');
const Activity = require('../../src/models/activity');
const crypto = require('crypto');

describe('Analytics Module Security Tests', function() {
  let sandbox;
  let token;
  let adminToken;
  
  // Setup test data and authentication
  before(async function() {
    // Create a sinon sandbox for mocking and testing
    sandbox = createSandbox();
    
    // Create a mock admin user
    const adminUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'admin@nestplatform.com',
      username: 'admin',
      password: await bcrypt.hash('Secure!Password123', 10),
      roles: ['admin', 'user'],
      nestId: 'admin.nest'
    };
    
    // Create a mock regular user
    const regularUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'user@nestplatform.com',
      username: 'testuser',
      password: await bcrypt.hash('UserPass!123', 10), 
      roles: ['user'],
      nestId: 'testuser.nest'
    };
    
    // Mock the User.findOne method to return the appropriate user based on the email
    sandbox.stub(User, 'findOne').callsFake(async (query) => {
      if (query.email === adminUser.email) {
        return adminUser;
      } else if (query.email === regularUser.email) {
        return regularUser;
      }
      return null;
    });
    
    // Generate JWT tokens for both users
    const jwtSecret = process.env.JWT_SECRET || 'test-secret-key';
    
    token = jwt.sign({ 
      id: regularUser._id.toString(),
      email: regularUser.email,
      username: regularUser.username,
      roles: regularUser.roles 
    }, jwtSecret, { expiresIn: '1h' });
    
    adminToken = jwt.sign({ 
      id: adminUser._id.toString(),
      email: adminUser.email,
      username: adminUser.username,
      roles: adminUser.roles 
    }, jwtSecret, { expiresIn: '1h' });
  });
  
  after(function() {
    // Clean up the sandbox after tests
    sandbox.restore();
  });
  
  describe('Authentication and Authorization', function() {
    it('Should require authentication for all analytics endpoints', async function() {
      const analyticsEndpoints = [
        '/api/analytics/user-conversion',
        '/api/analytics/wallet-retention',
        '/api/analytics/token-exchange',
        '/api/analytics/xp-accumulation',
        '/api/analytics/nft-ownership'
      ];
      
      for (const endpoint of analyticsEndpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).to.be.oneOf([401, 403]);
      }
    });
    
    it('Should reject regular users from accessing admin-only analytics endpoints', async function() {
      const adminOnlyEndpoints = [
        '/api/analytics/admin/user-segments',
        '/api/analytics/admin/revenue',
        '/api/analytics/admin/system-health'
      ];
      
      for (const endpoint of adminOnlyEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${token}`);
        
        expect(response.status).to.equal(403);
      }
    });
    
    it('Should allow admin access to admin-only analytics endpoints', async function() {
      // Mock the response data for admin endpoints
      sandbox.stub(mongoose.Model, 'aggregate').resolves([]);
      
      const adminOnlyEndpoints = [
        '/api/analytics/admin/user-segments',
        '/api/analytics/admin/revenue',
        '/api/analytics/admin/system-health'
      ];
      
      for (const endpoint of adminOnlyEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(response.status).to.equal(200);
      }
    });
  });
  
  describe('Input Validation and Sanitization', function() {
    it('Should reject invalid date parameters', async function() {
      const response = await request(app)
        .get('/api/analytics/user-conversion')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: 'invalid-date',
          endDate: '2023-05-01'
        });
      
      expect(response.status).to.equal(400);
    });
    
    it('Should reject suspicious SQL injection attempts in parameters', async function() {
      const response = await request(app)
        .get('/api/analytics/user-conversion')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          userSegment: "admin' OR '1'='1"
        });
      
      expect(response.status).to.equal(400);
    });
    
    it('Should validate and sanitize filter parameters', async function() {
      // This stub will allow us to see what's being passed to the aggregation
      const aggregateStub = sandbox.stub(mongoose.Model, 'aggregate').resolves([]);
      
      await request(app)
        .get('/api/analytics/user-conversion')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          timeRange: 'last30Days',
          userSegment: '<script>alert(1)</script>', // XSS attempt
          nftType: 'attendance'
        });
      
      // Extract the aggregation pipeline that was generated
      const pipeline = aggregateStub.args[0][0];
      
      // Verify script tags and special characters were sanitized/escaped
      const matchStage = pipeline.find(stage => stage.$match);
      if (matchStage && matchStage.$match.userSegment) {
        expect(matchStage.$match.userSegment).not.to.include('<script>');
      }
    });
  });
  
  describe('Rate Limiting and DoS Protection', function() {
    it('Should rate limit excessive analytics requests', async function() {
      // Create multiple requests in rapid succession
      const requests = [];
      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app)
            .get('/api/analytics/user-conversion')
            .set('Authorization', `Bearer ${adminToken}`)
        );
      }
      
      // Execute all requests
      const responses = await Promise.all(requests);
      
      // Check if at least some of the responses were rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).to.be.greaterThan(0);
    });
  });
  
  describe('Data Privacy and Anonymization', function() {
    it('Should anonymize personal identifiers in analytics reports', async function() {
      // Mock data containing sensitive information
      const mockUsers = [
        { _id: '1', email: 'user1@example.com', username: 'user1', walletAddress: '0x123456789abcdef', nftCount: 5 },
        { _id: '2', email: 'user2@example.com', username: 'user2', walletAddress: '0xabcdef123456789', nftCount: 10 }
      ];
      
      // Mock the aggregation result
      sandbox.stub(mongoose.Model, 'aggregate').resolves(mockUsers);
      
      const response = await request(app)
        .get('/api/analytics/nft-ownership')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).to.equal(200);
      
      // Check that sensitive data is anonymized
      const data = response.body.data;
      expect(data).to.be.an('array');
      
      // Sensitive fields should be anonymized
      data.forEach(user => {
        expect(user).not.to.have.property('email');
        expect(user).not.to.have.property('walletAddress');
        
        // ID should be hashed or anonymized
        if (user.userId) {
          expect(user.userId).not.to.equal('1');
          expect(user.userId).not.to.equal('2');
        }
      });
      
      // Non-sensitive fields should remain
      data.forEach(user => {
        expect(user).to.have.property('nftCount');
      });
    });
    
    it('Should enforce data aggregation for privacy preservation', async function() {
      // Test that small segments are not individually identifiable
      sandbox.stub(mongoose.Model, 'aggregate').resolves([
        { _id: 'segment1', userCount: 2, averageNftCount: 5 }, // Small segment
        { _id: 'segment2', userCount: 30, averageNftCount: 7 } // Large segment
      ]);
      
      const response = await request(app)
        .get('/api/analytics/nft-ownership/by-segment')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).to.equal(200);
      
      // Small segments should be combined or marked
      const segments = response.body.data;
      const smallSegment = segments.find(s => s.id === 'segment1');
      
      // Expectation: Small segments should be marked or handled specially
      if (smallSegment) {
        expect(smallSegment).to.have.property('isSmallSegment', true);
        // Or expect smallSegment values to be null/redacted
      }
    });
  });
  
  describe('Secure Export and Reporting', function() {
    it('Should validate export format and prevent command injection', async function() {
      // Test valid export formats
      const validFormats = ['csv', 'json', 'xlsx'];
      for (const format of validFormats) {
        const response = await request(app)
          .get(`/api/analytics/export/user-conversion`)
          .query({ format })
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(response.status).to.equal(200);
      }
      
      // Test invalid/malicious format with command injection attempt
      const response = await request(app)
        .get(`/api/analytics/export/user-conversion`)
        .query({ format: 'csv; rm -rf /' })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).to.equal(400);
    });
    
    it('Should protect sensitive data in exports', async function() {
      // Mock the export data generation
      const mockExportData = [
        { userId: '1', email: 'user1@example.com', nftCount: 5 },
        { userId: '2', email: 'user2@example.com', nftCount: 10 }
      ];
      
      sandbox.stub(mongoose.Model, 'find').resolves(mockExportData);
      
      const response = await request(app)
        .get(`/api/analytics/export/nft-ownership`)
        .query({ format: 'csv' })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('text/csv');
      
      // Check that sensitive data is not included in export
      const csvContent = response.text;
      expect(csvContent).not.to.include('user1@example.com');
      expect(csvContent).not.to.include('user2@example.com');
    });
  });
  
  describe('Audit Logging for Analytics Activity', function() {
    it('Should log all analytics access', async function() {
      // Mock the Activity model's create method
      const createActivityStub = sandbox.stub(Activity, 'create').resolves({});
      
      // Perform an analytics request
      await request(app)
        .get('/api/analytics/user-conversion')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Verify that the activity was logged
      expect(createActivityStub.calledOnce).to.be.true;
      
      const activityLog = createActivityStub.args[0][0];
      expect(activityLog).to.have.property('type', 'analytics_access');
      expect(activityLog).to.have.property('userId');
      expect(activityLog).to.have.property('details');
      expect(activityLog.details).to.have.property('endpoint', '/api/analytics/user-conversion');
    });
    
    it('Should log export activities with extra detail', async function() {
      // Mock the Activity model's create method
      const createActivityStub = sandbox.stub(Activity, 'create').resolves({});
      
      // Perform an export request
      await request(app)
        .get('/api/analytics/export/nft-ownership')
        .query({ format: 'csv' })
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Verify that the export activity was logged with extra detail
      expect(createActivityStub.calledOnce).to.be.true;
      
      const activityLog = createActivityStub.args[0][0];
      expect(activityLog).to.have.property('type', 'analytics_export');
      expect(activityLog).to.have.property('userId');
      expect(activityLog).to.have.property('details');
      expect(activityLog.details).to.have.property('endpoint', '/api/analytics/export/nft-ownership');
      expect(activityLog.details).to.have.property('format', 'csv');
    });
  });
  
  describe('Query Injection Prevention', function() {
    it('Should prevent NoSQL injection in query parameters', async function() {
      // Mock sensitive data that would be exposed by a successful injection
      const sensitiveData = [
        { _id: '1', email: 'admin@example.com', password: 'hashed_password' }
      ];
      
      // This will be called if the injection is successful
      const findStub = sandbox.stub(mongoose.Model, 'find').resolves(sensitiveData);
      
      // Attempt NoSQL injection
      const injectionAttempts = [
        { userSegment: '{ $gt: "" }' },
        { userSegment: '{"$gt":""}' },
        { timeRange: '{ $where: "sleep(1000)" }' }
      ];
      
      for (const attempt of injectionAttempts) {
        const response = await request(app)
          .get('/api/analytics/user-conversion')
          .set('Authorization', `Bearer ${adminToken}`)
          .query(attempt);
        
        // Should either be rejected with 400 or sanitized
        if (response.status === 200) {
          // If request succeeded, ensure no injection occurred
          const calls = findStub.getCalls();
          for (const call of calls) {
            const query = call.args[0];
            
            // Ensure query doesn't contain MongoDB operators
            Object.values(query).forEach(value => {
              if (typeof value === 'string') {
                expect(value).not.to.include('$gt');
                expect(value).not.to.include('$where');
              }
            });
          }
        }
      }
    });
    
    it('Should sanitize pipeline aggregation parameters', async function() {
      // Mock the aggregation processing
      const aggregateStub = sandbox.stub(mongoose.Model, 'aggregate').resolves([]);
      
      // Attempt pipeline injection
      await request(app)
        .get('/api/analytics/nft-ownership')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          pipeline: JSON.stringify([
            { $match: { } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user_data' } },
            { $project: { password: 1, email: 1 } }
          ])
        });
      
      // Verify that the pipeline parameter was completely ignored or sanitized
      const pipeline = aggregateStub.args[0][0];
      
      // Should not contain user-provided pipeline stages
      const hasLookupStage = pipeline.some(stage => stage.$lookup && stage.$lookup.from === 'users');
      const hasPasswordProject = pipeline.some(stage => stage.$project && stage.$project.password);
      
      expect(hasLookupStage).to.be.false;
      expect(hasPasswordProject).to.be.false;
    });
  });
  
  describe('Data Integrity Protection', function() {
    it('Should detect and prevent tampering with analytics data', async function() {
      // Mock analytics data hash check
      const dataIntegrityHash = crypto.createHash('sha256').update('sample_data').digest('hex');
      
      // Store the hash in a mock database
      const mockVerificationData = {
        reportId: 'user-conversion-2023-05',
        dataHash: dataIntegrityHash,
        generated: new Date(),
        version: '1.0'
      };
      
      // Mock the verification lookup
      sandbox.stub(mongoose.Model, 'findOne').resolves(mockVerificationData);
      
      // Test with valid data (generates the same hash)
      const response = await request(app)
        .post('/api/analytics/verify-integrity')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: 'user-conversion-2023-05',
          data: 'sample_data'
        });
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('valid', true);
      
      // Test with tampered data (generates a different hash)
      const tamperedResponse = await request(app)
        .post('/api/analytics/verify-integrity')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: 'user-conversion-2023-05',
          data: 'sample_data_tampered'
        });
      
      expect(tamperedResponse.status).to.equal(200);
      expect(tamperedResponse.body).to.have.property('valid', false);
      expect(tamperedResponse.body).to.have.property('message').that.includes('integrity');
    });
  });
  
  describe('Error Handling and Information Leakage', function() {
    it('Should prevent stack traces and sensitive error details in responses', async function() {
      // Force an error by making a bad request
      const response = await request(app)
        .get('/api/analytics/non-existent-endpoint')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).to.be.oneOf([404, 400, 500]);
      
      // Check error response format
      expect(response.body).to.be.an('object');
      
      if (response.body.error) {
        // Should not include stack traces
        expect(response.body.error).not.to.include('at ');
        expect(response.body.error).not.to.include('node_modules');
        expect(response.body.error).not.to.include('Error: ');
      }
      
      // Should not leak file paths
      const responseText = JSON.stringify(response.body);
      expect(responseText).not.to.include('/src/');
      expect(responseText).not.to.include('C:\\');
      expect(responseText).not.to.include('/var/www/');
    });
    
    it('Should handle database connection errors securely', async function() {
      // Force a database connection error
      const originalAggregate = mongoose.Model.aggregate;
      sandbox.restore(); // Clear previous stubs
      
      sandbox.stub(mongoose.Model, 'aggregate').throws(new Error('MongoDB connection error: Authentication failed at server.example.com:27017'));
      
      const response = await request(app)
        .get('/api/analytics/user-conversion')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).to.equal(500);
      
      // Check error message sanitization
      expect(response.body).to.have.property('error');
      expect(response.body.error).not.to.include('MongoDB connection');
      expect(response.body.error).not.to.include('Authentication');
      expect(response.body.error).not.to.include('server.example.com');
      
      // Should provide a generic message instead
      expect(response.body.error).to.include('database');
    });
  });
});
