import express from 'express';
import cors from 'cors';
import { jest } from '@jest/globals';

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

// Mock helper functions
jest.unstable_mockModule('../../utils/wasteReportHelpers.js', () => ({
  createWasteReport: jest.fn(),
  getWasteReports: jest.fn(),
  getWasteReportById: jest.fn(),
  updateWasteReportStatus: jest.fn(),
  getUserWasteReports: jest.fn(),
  getAvailableReports: jest.fn(),
  canAssignReport: jest.fn(),
  getReportsStatistics: jest.fn(),
  deleteWasteReport: jest.fn(),
  assignReportToDriver: jest.fn(),
  getDriverAssignments: jest.fn(),
  acceptDriverAssignment: jest.fn(),
  startDriverAssignment: jest.fn(),
  completeDriverAssignment: jest.fn()
}));

// Mock notification helpers
jest.unstable_mockModule('../../utils/notificationHelpers.js', () => ({
  createNewReportNotifications: jest.fn(),
  createTaskAssignmentNotification: jest.fn(),
  createTaskAcceptedNotifications: jest.fn()
}));

// Import after mocking
let wasteReportController;
let wasteReportHelpers;
let notificationHelpers;

beforeAll(async () => {
  wasteReportController = (await import('../../controllers/wasteReportController.js')).default;
  wasteReportHelpers = await import('../../utils/wasteReportHelpers.js');
  notificationHelpers = await import('../../utils/notificationHelpers.js');
});

describe('Waste Report Controller', () => {
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
      user: { id: 'test-user-id', role: 'user' },
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

  describe('POST /api/reports - createReport', () => {
    it('should create a new waste report successfully', async () => {
      const reportData = {
        location: 'Uhuru Park, Nairobi',
        latitude: -1.2921,
        longitude: 36.8219,
        description: 'Large pile of plastic waste',
        waste_type: 'plastic'
      };

      const mockCreatedReport = {
        id: 'test-report-id',
        user_id: 'test-user-id',
        ...reportData,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      wasteReportHelpers.createWasteReport.mockResolvedValueOnce(mockCreatedReport);
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      notificationHelpers.createNewReportNotifications.mockResolvedValueOnce();

      mockReq.body = reportData;

      wasteReportController.createReport(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(wasteReportHelpers.createWasteReport).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        location: 'Uhuru Park, Nairobi',
        latitude: -1.2921,
        longitude: 36.8219,
        description: 'Large pile of plastic waste',
        waste_type: 'plastic',
        image_url: null,
        status: 'pending'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedReport,
        message: 'Waste report created successfully'
      });
    });

    it('should return 400 for missing required fields', async () => {
      mockReq.body = {
        location: 'Uhuru Park',
        // Missing description and waste_type
      };

      wasteReportController.createReport(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Location, description, and waste_type are required'
      });
    });

    it('should handle database errors', async () => {
      wasteReportHelpers.createWasteReport.mockRejectedValueOnce(new Error('Database connection failed'));

      mockReq.body = {
        location: 'Uhuru Park',
        description: 'Test description',
        waste_type: 'plastic'
      };

      wasteReportController.createReport(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_ERROR',
        message: expect.stringContaining('error')
      });
    });

    it('should handle coordinates validation', async () => {
      mockReq.body = {
        location: 'Uhuru Park',
        description: 'Test description',
        waste_type: 'plastic',
        latitude: 'invalid',
        longitude: 36.8219
      };

      wasteReportController.createReport(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: expect.stringContaining('Invalid')
      });
    });

    it('should handle optional image upload', async () => {
      const reportData = {
        location: 'Uhuru Park, Nairobi',
        description: 'Large pile of plastic waste',
        waste_type: 'plastic',
        image_url: 'https://example.com/image.jpg'
      };

      const mockCreatedReport = {
        id: 'test-report-id',
        user_id: 'test-user-id',
        ...reportData,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      wasteReportHelpers.createWasteReport.mockResolvedValueOnce(mockCreatedReport);
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      notificationHelpers.createNewReportNotifications.mockResolvedValueOnce();

      mockReq.body = reportData;

      wasteReportController.createReport(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(wasteReportHelpers.createWasteReport).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        location: 'Uhuru Park, Nairobi',
        latitude: null,
        longitude: null,
        description: 'Large pile of plastic waste',
        waste_type: 'plastic',
        image_url: 'https://example.com/image.jpg',
        status: 'pending'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should create report with null coordinates when GPS is unavailable', async () => {
      const reportData = {
        location: 'Manual location entry - Kibera',
        description: 'Waste pile reported manually',
        waste_type: 'mixed',
        latitude: null,
        longitude: null
      };

      const mockCreatedReport = {
        id: 'test-report-id',
        user_id: 'test-user-id',
        ...reportData,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      wasteReportHelpers.createWasteReport.mockResolvedValueOnce(mockCreatedReport);
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      notificationHelpers.createNewReportNotifications.mockResolvedValueOnce();

      mockReq.body = reportData;

      wasteReportController.createReport(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(wasteReportHelpers.createWasteReport).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        location: 'Manual location entry - Kibera',
        latitude: null,
        longitude: null,
        description: 'Waste pile reported manually',
        waste_type: 'mixed',
        image_url: null,
        status: 'pending'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedReport,
        message: 'Waste report created successfully'
      });
    });

    it('should handle coordinate validation errors from helper function', async () => {
      const reportData = {
        location: 'Test location',
        description: 'Test description',
        waste_type: 'plastic',
        latitude: -1.2921,
        longitude: null // Invalid - only one coordinate provided
      };

      wasteReportHelpers.createWasteReport.mockRejectedValueOnce(
        new Error('Both latitude and longitude must be provided together, or both must be null')
      );

      mockReq.body = reportData;

      wasteReportController.createReport(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_ERROR',
        message: expect.stringContaining('error')
      });
    });
  });

  describe('GET /api/reports/user - getUserReports', () => {
    it('should return user reports with pagination', async () => {
      const mockResult = {
        reports: [
          {
            id: 'report-1',
            user_id: 'test-user-id',
            location: 'Location 1',
            status: 'pending',
            created_at: new Date().toISOString()
          },
          {
            id: 'report-2',
            user_id: 'test-user-id',
            location: 'Location 2',
            status: 'assigned',
            created_at: new Date().toISOString()
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      };

      wasteReportHelpers.getUserWasteReports.mockResolvedValueOnce(mockResult);

      mockReq.query = { page: '1', limit: '10' };

      wasteReportController.getUserReports(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(wasteReportHelpers.getUserWasteReports).toHaveBeenCalledWith('test-user-id', {
        status: undefined,
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'User reports retrieved successfully'
      });
    });

    it('should handle empty results', async () => {
      const mockResult = {
        reports: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };

      wasteReportHelpers.getUserWasteReports.mockResolvedValueOnce(mockResult);

      wasteReportController.getUserReports(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'User reports retrieved successfully'
      });
    });

    it('should handle filtering and sorting parameters', async () => {
      const mockResult = {
        reports: [],
        pagination: { page: 2, limit: 5, total: 0, totalPages: 0 }
      };

      wasteReportHelpers.getUserWasteReports.mockResolvedValueOnce(mockResult);

      mockReq.query = {
        page: '2',
        limit: '5',
        status: 'pending',
        sort_by: 'location',
        sort_order: 'asc'
      };

      wasteReportController.getUserReports(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(wasteReportHelpers.getUserWasteReports).toHaveBeenCalledWith('test-user-id', {
        status: 'pending',
        page: 2,
        limit: 5,
        sortBy: 'location',
        sortOrder: 'asc'
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should validate pagination limits', async () => {
      const mockResult = {
        reports: [],
        pagination: { page: 1, limit: 100, total: 0, totalPages: 0 }
      };

      wasteReportHelpers.getUserWasteReports.mockResolvedValueOnce(mockResult);

      mockReq.query = {
        page: '0', // Invalid page
        limit: '200' // Exceeds max limit
      };

      wasteReportController.getUserReports(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(wasteReportHelpers.getUserWasteReports).toHaveBeenCalledWith('test-user-id', {
        status: undefined,
        page: 1, // Corrected to minimum
        limit: 100, // Corrected to maximum
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
    });
  });

  describe('GET /api/reports - getReports (Admin)', () => {
    beforeEach(() => {
      mockReq.user.role = 'admin';
    });

    it('should return all reports for admin users', async () => {
      const mockResult = {
        reports: [
          {
            id: 'report-1',
            user_id: 'user-1',
            location: 'Location 1',
            status: 'pending'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };

      wasteReportHelpers.getWasteReports.mockResolvedValueOnce(mockResult);

      wasteReportController.getReports(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(wasteReportHelpers.getWasteReports).toHaveBeenCalledWith(
        {
          status: undefined,
          wasteType: undefined,
          userId: undefined,
          dateFrom: undefined,
          dateTo: undefined,
          search: undefined
        },
        {
          page: 1,
          limit: 10,
          sortBy: 'created_at',
          sortOrder: 'desc'
        }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.reports,
        message: 'Reports retrieved successfully'
      });
    });

    it('should apply filters when provided', async () => {
      mockReq.query = {
        status: 'pending',
        waste_type: 'plastic',
        user_id: 'test-user-id',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        search: 'park',
        page: '2',
        limit: '5',
        sort_by: 'location',
        sort_order: 'asc'
      };

      const mockResult = {
        reports: [],
        pagination: { page: 2, limit: 5, total: 0, totalPages: 0 }
      };

      wasteReportHelpers.getWasteReports.mockResolvedValueOnce(mockResult);

      wasteReportController.getReports(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(wasteReportHelpers.getWasteReports).toHaveBeenCalledWith(
        {
          status: 'pending',
          wasteType: 'plastic',
          userId: 'test-user-id',
          dateFrom: '2024-01-01',
          dateTo: '2024-01-31',
          search: 'park'
        },
        {
          page: 2,
          limit: 5,
          sortBy: 'location',
          sortOrder: 'asc'
        }
      );
    });

    it('should validate user_id parameter', async () => {
      mockReq.query.user_id = 'invalid-uuid';

      wasteReportController.getReports(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: expect.stringContaining('Invalid')
      });
    });

    it('should validate sort parameters', async () => {
      mockReq.query = {
        sort_by: 'invalid_field',
        sort_order: 'invalid_order'
      };

      const mockResult = {
        reports: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      };

      wasteReportHelpers.getWasteReports.mockResolvedValueOnce(mockResult);

      wasteReportController.getReports(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(wasteReportHelpers.getWasteReports).toHaveBeenCalledWith(
        expect.any(Object),
        {
          page: 1,
          limit: 10,
          sortBy: 'created_at', // Default value
          sortOrder: 'desc' // Default value
        }
      );
    });
  });

  describe('GET /api/reports/:id - getReportById', () => {
    it('should return report by ID successfully', async () => {
      const mockReport = {
        id: 'test-report-id',
        user_id: 'test-user-id',
        location: 'Test Location',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      wasteReportHelpers.getWasteReportById.mockResolvedValueOnce(mockReport);

      mockReq.params.id = 'test-report-id';

      wasteReportController.getReportById(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(wasteReportHelpers.getWasteReportById).toHaveBeenCalledWith('test-report-id');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockReport,
        message: 'Report retrieved successfully'
      });
    });

    it('should return 404 for non-existent report', async () => {
      wasteReportHelpers.getWasteReportById.mockResolvedValueOnce(null);

      mockReq.params.id = 'non-existent-id';

      wasteReportController.getReportById(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'NOT_FOUND',
        message: 'Report not found'
      });
    });

    it('should return 400 for invalid UUID', async () => {
      mockReq.params.id = 'invalid-uuid';

      wasteReportController.getReportById(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: expect.stringContaining('Invalid')
      });
    });
  });

  describe('PUT /api/reports/:id/status - updateReportStatus', () => {
    beforeEach(() => {
      mockReq.params.id = 'test-report-id';
      mockReq.body = {
        status: 'completed',
        notes: 'Task completed successfully'
      };
    });

    it('should update report status successfully', async () => {
      const mockUpdatedReport = {
        id: 'test-report-id',
        status: 'completed',
        notes: 'Task completed successfully',
        updated_at: new Date().toISOString()
      };

      wasteReportHelpers.updateWasteReportStatus.mockResolvedValueOnce(mockUpdatedReport);

      wasteReportController.updateReportStatus(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(wasteReportHelpers.updateWasteReportStatus).toHaveBeenCalledWith('test-report-id', {
        status: 'completed',
        notes: 'Task completed successfully'
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedReport,
        message: 'Report status updated successfully'
      });
    });

    it('should return 400 for invalid status', async () => {
      mockReq.body.status = 'invalid_status';

      wasteReportController.updateReportStatus(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid status provided'
      });
    });

    it('should return 400 for invalid report ID', async () => {
      mockReq.params.id = 'invalid-uuid';

      wasteReportController.updateReportStatus(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: expect.stringContaining('Invalid')
      });
    });
  });

  describe('DELETE /api/reports/:id - deleteReport', () => {
    beforeEach(() => {
      mockReq.user.role = 'admin';
      mockReq.params.id = 'test-report-id';
    });

    it('should delete report successfully', async () => {
      wasteReportHelpers.deleteWasteReport.mockResolvedValueOnce();

      wasteReportController.deleteReport(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(wasteReportHelpers.deleteWasteReport).toHaveBeenCalledWith('test-report-id');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Report deleted successfully'
      });
    });

    it('should return 400 for invalid report ID', async () => {
      mockReq.params.id = 'invalid-uuid';

      wasteReportController.deleteReport(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: expect.stringContaining('Invalid')
      });
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      delete mockReq.user;

      await wasteReportController.createReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    });

    it('should validate JWT token format', async () => {
      mockReq.headers.authorization = 'Invalid token format';

      await wasteReportController.createReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Invalid token format'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.insert.mockRejectedValueOnce(new Error('Unexpected error'));

      mockReq.body = {
        location: 'Test location',
        description: 'Test description',
        waste_type: 'plastic'
      };

      await wasteReportController.createReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      });
    });

    it('should validate required parameters', async () => {
      mockReq.params = {}; // Missing id parameter

      await wasteReportController.assignReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Report ID is required'
      });
    });
  });
});