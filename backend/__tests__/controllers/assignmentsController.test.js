import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { jest } from '@jest/globals';
import {
  acceptAssignment,
  startAssignment,
} from '../../controllers/assignmentsController.js';
import * as wasteReportHelpers from '../../utils/wasteReportHelpers.js';
import * as notificationHelpers from '../../utils/notificationHelpers.js';


// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  neq: jest.fn(() => mockSupabase),
  in: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  lte: jest.fn(() => mockSupabase),
  ilike: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  range: jest.fn(() => mockSupabase),
  single: jest.fn(() => mockSupabase),
  rpc: jest.fn(() => mockSupabase)
};

// Mock the Supabase module
jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

// Mock JWT verification
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: jest.fn()
  }
}));
jest.mock('../../utils/wasteReportHelpers.js');
jest.mock('../../utils/notificationHelpers.js');


// Import after mocking - using wasteReportController since assignments are handled there
let wasteReportController;
let jwt;

beforeAll(async () => {
  wasteReportController = (await import('../../controllers/wasteReportController.js')).default;
  jwt = (await import('jsonwebtoken')).default;
});

describe('Assignment Controller (via Waste Report Controller)', () => {
  let app;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    app = express();
    app.use(cors());
    app.use(express.json());
    
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 'test-user-id', role: 'driver', driver_id: 'test-driver-id' },
      headers: { authorization: 'Bearer test-token' }
    };
    
    mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(() => mockRes),
      send: jest.fn(() => mockRes)
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/reports/:id/assign - assignReport', () => {
    beforeEach(() => {
      mockReq.user.role = 'admin';
      mockReq.params.id = 'test-report-id';
      mockReq.body = {
        driver_id: 'test-driver-id',
        notes: 'Priority pickup'
      };
    });

    it('should assign report to driver successfully', async () => {
      // Mock successful assignment
      const mockAssignment = {
        id: 'assignment-id',
        report_id: 'test-report-id',
        driver_id: 'test-driver-id',
        status: 'pending',
        assigned_at: new Date().toISOString(),
        drivers: { id: 'test-driver-id', full_name: 'Test Driver' },
        waste_reports: { id: 'test-report-id', location: 'Test Location' }
      };

      // Mock the helper function to return successful assignment
      jest.doMock('../../utils/wasteReportHelpers.js', () => ({
        canAssignReport: jest.fn().mockResolvedValue(true),
        assignReportToDriver: jest.fn().mockResolvedValue(mockAssignment)
      }));

      await wasteReportController.assignReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAssignment,
        message: 'Report assigned to driver successfully'
      });
    });

    it('should return 400 for invalid report ID', async () => {
      mockReq.params.id = 'invalid-id';

      await wasteReportController.assignReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: expect.stringContaining('Invalid')
      });
    });

    it('should return 400 for invalid driver ID', async () => {
      mockReq.body.driver_id = 'invalid-driver-id';

      await wasteReportController.assignReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: expect.stringContaining('Invalid')
      });
    });

    it('should return 400 when report cannot be assigned', async () => {
      // Mock helper to return false for canAssignReport
      jest.doMock('../../utils/wasteReportHelpers.js', () => ({
        canAssignReport: jest.fn().mockResolvedValue(false)
      }));

      await wasteReportController.assignReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Report cannot be assigned. It may already be assigned or not in pending status.'
      });
    });

    it('should deny access to non-admin users', async () => {
      mockReq.user.role = 'user';

      await wasteReportController.assignReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'FORBIDDEN',
        message: 'Admin access required'
      });
    });
  });

  describe('GET /api/assignments/driver - getDriverTasks', () => {
    beforeEach(() => {
      mockReq.user = { 
        id: 'test-user-id', 
        role: 'driver', 
        driver_id: 'test-driver-id' 
      };
    });

    it('should return driver tasks successfully', async () => {
      const mockTasks = {
        assignments: [
          {
            id: 'assignment-1',
            driver_id: 'test-driver-id',
            status: 'pending',
            assigned_at: new Date().toISOString(),
            waste_reports: {
              id: 'report-1',
              location: 'Test Location',
              waste_type: 'plastic'
            }
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };

      // Mock the helper function
      jest.doMock('../../utils/wasteReportHelpers.js', () => ({
        getDriverAssignments: jest.fn().mockResolvedValue(mockTasks)
      }));

      await wasteReportController.getDriverTasks(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTasks,
        message: 'Driver tasks retrieved successfully'
      });
    });

    it('should return 400 when driver ID is missing', async () => {
      mockReq.user.driver_id = null;

      await wasteReportController.getDriverTasks(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Driver ID not found. User may not be a driver.'
      });
    });

    it('should handle pagination parameters correctly', async () => {
      mockReq.query = {
        page: '2',
        limit: '5',
        status: 'pending',
        sort_by: 'assigned_at',
        sort_order: 'asc'
      };

      const mockTasks = {
        assignments: [],
        pagination: { page: 2, limit: 5, total: 0, totalPages: 0 }
      };

      jest.doMock('../../utils/wasteReportHelpers.js', () => ({
        getDriverAssignments: jest.fn().mockResolvedValue(mockTasks)
      }));

      await wasteReportController.getDriverTasks(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('PUT /api/assignments/:id/accept - acceptAssignment', () => {
    beforeEach(() => {
      mockReq.params.id = 'test-assignment-id';
      mockReq.user = { 
        id: 'test-user-id', 
        role: 'driver', 
        driver_id: 'test-driver-id' 
      };
    });

    it('should accept assignment successfully', async () => {
      const mockAcceptedAssignment = {
        id: 'test-assignment-id',
        driver_id: 'test-driver-id',
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        drivers: { id: 'test-driver-id', full_name: 'Test Driver' },
        waste_reports: { id: 'test-report-id', location: 'Test Location' }
      };

      jest.doMock('../../utils/wasteReportHelpers.js', () => ({
        acceptDriverAssignment: jest.fn().mockResolvedValue(mockAcceptedAssignment)
      }));

      await wasteReportController.acceptAssignment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAcceptedAssignment,
        message: 'Assignment accepted successfully'
      });
    });

    it('should return 400 for invalid assignment ID', async () => {
      mockReq.params.id = 'invalid-id';

      await wasteReportController.acceptAssignment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: expect.stringContaining('Invalid')
      });
    });

    it('should return 400 when driver ID is missing', async () => {
      mockReq.user.driver_id = null;

      await wasteReportController.acceptAssignment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Driver ID not found. User may not be a driver.'
      });
    });
  });

  describe('PUT /api/assignments/:id/start - startAssignment', () => {
    beforeEach(() => {
      mockReq.params.id = 'test-assignment-id';
      mockReq.user = { 
        id: 'test-user-id', 
        role: 'driver', 
        driver_id: 'test-driver-id' 
      };
    });

    it('should start assignment successfully', async () => {
      const mockStartedAssignment = {
        id: 'test-assignment-id',
        driver_id: 'test-driver-id',
        status: 'in_progress',
        started_at: new Date().toISOString()
      };

      jest.doMock('../../utils/wasteReportHelpers.js', () => ({
        startDriverAssignment: jest.fn().mockResolvedValue(mockStartedAssignment)
      }));

      await wasteReportController.startAssignment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStartedAssignment,
        message: 'Assignment started successfully'
      });
    });

    it('should return 400 for invalid assignment ID', async () => {
      mockReq.params.id = 'invalid-id';

      await wasteReportController.startAssignment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: expect.stringContaining('Invalid')
      });
    });
  });

  describe('PUT /api/assignments/:id/complete - completeAssignment', () => {
    beforeEach(() => {
      mockReq.params.id = 'test-assignment-id';
      mockReq.user = { 
        id: 'test-user-id', 
        role: 'driver', 
        driver_id: 'test-driver-id' 
      };
      mockReq.body = {
        completion_notes: 'Task completed successfully',
        completion_image_url: 'https://example.com/image.jpg'
      };
    });

    it('should complete assignment successfully', async () => {
      const mockCompletedAssignment = {
        id: 'test-assignment-id',
        driver_id: 'test-driver-id',
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_notes: 'Task completed successfully',
        completion_image_url: 'https://example.com/image.jpg'
      };

      jest.doMock('../../utils/wasteReportHelpers.js', () => ({
        completeDriverAssignment: jest.fn().mockResolvedValue(mockCompletedAssignment)
      }));

      await wasteReportController.completeAssignment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCompletedAssignment,
        message: 'Assignment completed successfully'
      });
    });

    it('should handle completion without optional fields', async () => {
      mockReq.body = {}; // No completion notes or image

      const mockCompletedAssignment = {
        id: 'test-assignment-id',
        driver_id: 'test-driver-id',
        status: 'completed',
        completed_at: new Date().toISOString()
      };

      jest.doMock('../../utils/wasteReportHelpers.js', () => ({
        completeDriverAssignment: jest.fn().mockResolvedValue(mockCompletedAssignment)
      }));

      await wasteReportController.completeAssignment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid assignment ID', async () => {
      mockReq.params.id = 'invalid-id';

      await wasteReportController.completeAssignment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: expect.stringContaining('Invalid')
      });
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for driver endpoints', async () => {
      delete mockReq.user;

      await wasteReportController.getDriverTasks(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    });

    it('should require admin role for assignment operations', async () => {
      mockReq.user.role = 'user';
      mockReq.params.id = 'test-report-id';
      mockReq.body = { driver_id: 'test-driver-id' };

      await wasteReportController.assignReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'FORBIDDEN',
        message: 'Admin access required'
      });
    });

    it('should require driver role for driver-specific operations', async () => {
      mockReq.user = { id: 'test-user-id', role: 'user' }; // Not a driver
      mockReq.params.id = 'test-assignment-id';

      await wasteReportController.acceptAssignment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Driver ID not found. User may not be a driver.'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockReq.params.id = 'test-assignment-id';
      mockReq.user = { 
        id: 'test-user-id', 
        role: 'driver', 
        driver_id: 'test-driver-id' 
      };

      // Mock helper to throw database error
      jest.doMock('../../utils/wasteReportHelpers.js', () => ({
        acceptDriverAssignment: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      }));

      await wasteReportController.acceptAssignment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_ERROR',
        message: expect.stringContaining('error')
      });
    });

    it('should validate required parameters', async () => {
      mockReq.params = {}; // Missing assignment ID
      mockReq.user = { 
        id: 'test-user-id', 
        role: 'driver', 
        driver_id: 'test-driver-id' 
      };

      await wasteReportController.acceptAssignment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: expect.stringContaining('Invalid')
      });
    });

    it('should handle unexpected errors', async () => {
      mockReq.params.id = 'test-assignment-id';
      mockReq.user = { 
        id: 'test-user-id', 
        role: 'driver', 
        driver_id: 'test-driver-id' 
      };

      // Mock helper to throw unexpected error
      jest.doMock('../../utils/wasteReportHelpers.js', () => ({
        startDriverAssignment: jest.fn().mockRejectedValue(new Error('Unexpected error'))
      }));

      await wasteReportController.startAssignment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_ERROR',
        message: expect.stringContaining('error')
      });
    });
  });
});
describe('assignmentsController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: 'test-assignment-id' },
      user: { driver_id: 'test-driver-id' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('acceptAssignment', () => {
    it('should call createTaskAcceptedNotifications with correct driver and report data', async () => {
      const mockAssignment = {
        id: 'test-assignment-id',
        waste_reports: { id: 'test-report-id', location: 'Test Location' },
        drivers: { id: 'test-driver-id', full_name: 'Test Driver' },
      };

      wasteReportHelpers.acceptDriverAssignment.mockResolvedValue(mockAssignment);

      await acceptAssignment(req, res);

      expect(notificationHelpers.createTaskAcceptedNotifications).toHaveBeenCalledWith(
        mockAssignment,
        mockAssignment.waste_reports,
        mockAssignment.drivers
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('startAssignment', () => {
    it('should call createTaskStartedNotifications with correct driver and report data', async () => {
      const mockAssignment = {
        id: 'test-assignment-id',
        waste_reports: { id: 'test-report-id', location: 'Test Location' },
        drivers: { id: 'test-driver-id', full_name: 'Test Driver' },
      };

      wasteReportHelpers.startDriverAssignment.mockResolvedValue(mockAssignment);

      await startAssignment(req, res);

      expect(notificationHelpers.createTaskStartedNotifications).toHaveBeenCalledWith(
        mockAssignment,
        mockAssignment.waste_reports,
        mockAssignment.drivers
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});