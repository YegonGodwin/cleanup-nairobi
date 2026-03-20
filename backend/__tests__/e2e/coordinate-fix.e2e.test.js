import request from 'supertest';
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

// Mock authentication middleware
const mockAuthMiddleware = (req, res, next) => {
  req.user = { id: 'test-user-id', role: 'user' };
  next();
};

// Import after mocking
let wasteReportController;
let wasteReportHelpers;
let notificationHelpers;
let wasteReportRoutes;

beforeAll(async () => {
  wasteReportController = (await import('../../controllers/wasteReportController.js')).default;
  wasteReportHelpers = await import('../../utils/wasteReportHelpers.js');
  notificationHelpers = await import('../../utils/notificationHelpers.js');
  wasteReportRoutes = (await import('../../routes/wasteReportRoutes.js')).default;
});

describe('Coordinate Fix - End-to-End Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(cors());
    app.use(express.json());
    
    // Mock authentication middleware for all routes
    app.use('/api/reports', mockAuthMiddleware, wasteReportRoutes);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Test report submission with GPS coordinates', () => {
    it('should successfully create report with valid GPS coordinates', async () => {
      const reportData = {
        location: 'Uhuru Park, Nairobi',
        latitude: -1.2921,
        longitude: 36.8219,
        description: 'Large pile of plastic waste near the fountain',
        waste_type: 'plastic'
      };

      const mockCreatedReport = {
        id: 'test-report-id-1',
        user_id: 'test-user-id',
        ...reportData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      wasteReportHelpers.createWasteReport.mockResolvedValueOnce(mockCreatedReport);
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      notificationHelpers.createNewReportNotifications.mockResolvedValueOnce();

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockCreatedReport,
        message: 'Waste report created successfully'
      });

      expect(wasteReportHelpers.createWasteReport).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        location: 'Uhuru Park, Nairobi',
        latitude: -1.2921,
        longitude: 36.8219,
        description: 'Large pile of plastic waste near the fountain',
        waste_type: 'plastic',
        image_url: null,
        status: 'pending'
      });
    });

    it('should validate GPS coordinates are within Nairobi bounds', async () => {
      const reportData = {
        location: 'Outside Nairobi',
        latitude: 0.0236, // Kampala coordinates (outside Nairobi)
        longitude: 32.5825,
        description: 'Waste outside Nairobi',
        waste_type: 'plastic'
      };

      // Mock validation error for coordinates outside bounds
      wasteReportHelpers.createWasteReport.mockRejectedValueOnce(
        new Error('Coordinates are outside the allowed area (Nairobi)')
      );

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INTERNAL_ERROR');
    });

    it('should handle invalid coordinate formats', async () => {
      const reportData = {
        location: 'Test location',
        latitude: 'invalid-lat',
        longitude: 36.8219,
        description: 'Test description',
        waste_type: 'plastic'
      };

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'VALIDATION_ERROR',
        message: expect.stringContaining('Invalid')
      });
    });
  });

  describe('Test report submission with manual location only', () => {
    it('should successfully create report without GPS coordinates', async () => {
      const reportData = {
        location: 'Manual location entry - Kibera slums, near the market',
        description: 'Large waste pile blocking the road',
        waste_type: 'mixed',
        latitude: null,
        longitude: null
      };

      const mockCreatedReport = {
        id: 'test-report-id-2',
        user_id: 'test-user-id',
        ...reportData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      wasteReportHelpers.createWasteReport.mockResolvedValueOnce(mockCreatedReport);
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      notificationHelpers.createNewReportNotifications.mockResolvedValueOnce();

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockCreatedReport,
        message: 'Waste report created successfully'
      });

      expect(wasteReportHelpers.createWasteReport).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        location: 'Manual location entry - Kibera slums, near the market',
        latitude: null,
        longitude: null,
        description: 'Large waste pile blocking the road',
        waste_type: 'mixed',
        image_url: null,
        status: 'pending'
      });
    });

    it('should create report when coordinates are omitted from request', async () => {
      const reportData = {
        location: 'Westlands shopping center',
        description: 'Overflowing bins in parking area',
        waste_type: 'organic'
        // No latitude/longitude provided
      };

      const mockCreatedReport = {
        id: 'test-report-id-3',
        user_id: 'test-user-id',
        location: 'Westlands shopping center',
        latitude: null,
        longitude: null,
        description: 'Overflowing bins in parking area',
        waste_type: 'organic',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      wasteReportHelpers.createWasteReport.mockResolvedValueOnce(mockCreatedReport);
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      notificationHelpers.createNewReportNotifications.mockResolvedValueOnce();

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.latitude).toBeNull();
      expect(response.body.data.longitude).toBeNull();
    });
  });

  describe('Verify database stores reports correctly in both cases', () => {
    it('should store report with GPS coordinates in database', async () => {
      const reportWithCoords = {
        location: 'City Market, Nairobi',
        latitude: -1.2864,
        longitude: 36.8172,
        description: 'Waste accumulation near entrance',
        waste_type: 'plastic'
      };

      const mockStoredReport = {
        id: 'stored-report-1',
        user_id: 'test-user-id',
        ...reportWithCoords,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      wasteReportHelpers.createWasteReport.mockResolvedValueOnce(mockStoredReport);
      wasteReportHelpers.getWasteReportById.mockResolvedValueOnce(mockStoredReport);
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      notificationHelpers.createNewReportNotifications.mockResolvedValueOnce();

      // Create the report
      const createResponse = await request(app)
        .post('/api/reports')
        .send(reportWithCoords)
        .expect(201);

      expect(createResponse.body.data.latitude).toBe(-1.2864);
      expect(createResponse.body.data.longitude).toBe(36.8172);

      // Verify it can be retrieved with coordinates intact
      const getResponse = await request(app)
        .get(`/api/reports/${createResponse.body.data.id}`)
        .expect(200);

      expect(getResponse.body.data.latitude).toBe(-1.2864);
      expect(getResponse.body.data.longitude).toBe(36.8172);
    });

    it('should store report with null coordinates in database', async () => {
      const reportWithoutCoords = {
        location: 'Mathare slums, Block 5',
        description: 'Waste blocking drainage',
        waste_type: 'mixed',
        latitude: null,
        longitude: null
      };

      const mockStoredReport = {
        id: 'stored-report-2',
        user_id: 'test-user-id',
        ...reportWithoutCoords,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      wasteReportHelpers.createWasteReport.mockResolvedValueOnce(mockStoredReport);
      wasteReportHelpers.getWasteReportById.mockResolvedValueOnce(mockStoredReport);
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      notificationHelpers.createNewReportNotifications.mockResolvedValueOnce();

      // Create the report
      const createResponse = await request(app)
        .post('/api/reports')
        .send(reportWithoutCoords)
        .expect(201);

      expect(createResponse.body.data.latitude).toBeNull();
      expect(createResponse.body.data.longitude).toBeNull();

      // Verify it can be retrieved with null coordinates
      const getResponse = await request(app)
        .get(`/api/reports/${createResponse.body.data.id}`)
        .expect(200);

      expect(getResponse.body.data.latitude).toBeNull();
      expect(getResponse.body.data.longitude).toBeNull();
    });

    it('should handle mixed reports in database queries', async () => {
      const mockReports = [
        {
          id: 'report-with-coords',
          user_id: 'test-user-id',
          location: 'Location with GPS',
          latitude: -1.2921,
          longitude: 36.8219,
          description: 'Report with coordinates',
          waste_type: 'plastic',
          status: 'pending'
        },
        {
          id: 'report-without-coords',
          user_id: 'test-user-id',
          location: 'Manual location',
          latitude: null,
          longitude: null,
          description: 'Report without coordinates',
          waste_type: 'organic',
          status: 'pending'
        }
      ];

      wasteReportHelpers.getUserWasteReports.mockResolvedValueOnce({
        reports: mockReports,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      });

      const response = await request(app)
        .get('/api/reports/user')
        .expect(200);

      expect(response.body.data.reports).toHaveLength(2);
      expect(response.body.data.reports[0].latitude).toBe(-1.2921);
      expect(response.body.data.reports[1].latitude).toBeNull();
    });
  });

  describe('Test error handling for various coordinate scenarios', () => {
    it('should reject partial coordinates (latitude only)', async () => {
      const reportData = {
        location: 'Test location',
        latitude: -1.2921,
        longitude: null, // Only latitude provided
        description: 'Test description',
        waste_type: 'plastic'
      };

      wasteReportHelpers.createWasteReport.mockRejectedValueOnce(
        new Error('Both latitude and longitude must be provided together, or both must be null')
      );

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INTERNAL_ERROR');
    });

    it('should reject partial coordinates (longitude only)', async () => {
      const reportData = {
        location: 'Test location',
        latitude: null,
        longitude: 36.8219, // Only longitude provided
        description: 'Test description',
        waste_type: 'plastic'
      };

      wasteReportHelpers.createWasteReport.mockRejectedValueOnce(
        new Error('Both latitude and longitude must be provided together, or both must be null')
      );

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INTERNAL_ERROR');
    });

    it('should handle database constraint violations gracefully', async () => {
      const reportData = {
        location: 'Test location',
        description: 'Test description',
        waste_type: 'plastic'
      };

      // Mock database constraint error
      wasteReportHelpers.createWasteReport.mockRejectedValueOnce(
        new Error('null value in column "latitude" violates not-null constraint')
      );

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INTERNAL_ERROR');
    });

    it('should handle coordinate validation errors', async () => {
      const reportData = {
        location: 'Test location',
        latitude: 'not-a-number',
        longitude: 'also-not-a-number',
        description: 'Test description',
        waste_type: 'plastic'
      };

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'VALIDATION_ERROR',
        message: expect.stringContaining('Invalid')
      });
    });

    it('should handle extreme coordinate values', async () => {
      const reportData = {
        location: 'Test location',
        latitude: 999, // Invalid latitude (should be -90 to 90)
        longitude: 999, // Invalid longitude (should be -180 to 180)
        description: 'Test description',
        waste_type: 'plastic'
      };

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should handle network timeout during coordinate processing', async () => {
      const reportData = {
        location: 'Test location',
        latitude: -1.2921,
        longitude: 36.8219,
        description: 'Test description',
        waste_type: 'plastic'
      };

      // Mock network timeout
      wasteReportHelpers.createWasteReport.mockRejectedValueOnce(
        new Error('TIMEOUT: Request timed out')
      );

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INTERNAL_ERROR');
    });

    it('should provide user-friendly error messages for coordinate issues', async () => {
      const reportData = {
        location: 'Test location',
        latitude: -1.2921,
        longitude: null,
        description: 'Test description',
        waste_type: 'plastic'
      };

      wasteReportHelpers.createWasteReport.mockRejectedValueOnce(
        new Error('Both latitude and longitude must be provided together, or both must be null')
      );

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(500);

      expect(response.body.message).toContain('error');
      expect(response.body.success).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle report lifecycle with null coordinates', async () => {
      const reportData = {
        location: 'Community center, Kawangware',
        description: 'Waste collection point overflow',
        waste_type: 'mixed',
        latitude: null,
        longitude: null
      };

      const mockReport = {
        id: 'lifecycle-test-id',
        user_id: 'test-user-id',
        ...reportData,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // Mock creation
      wasteReportHelpers.createWasteReport.mockResolvedValueOnce(mockReport);
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      notificationHelpers.createNewReportNotifications.mockResolvedValueOnce();

      // Create report
      const createResponse = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(201);

      expect(createResponse.body.data.latitude).toBeNull();
      expect(createResponse.body.data.longitude).toBeNull();

      // Mock status update
      const updatedReport = { ...mockReport, status: 'assigned' };
      wasteReportHelpers.updateWasteReportStatus.mockResolvedValueOnce(updatedReport);

      // Update status
      const updateResponse = await request(app)
        .put(`/api/reports/${mockReport.id}/status`)
        .send({ status: 'assigned', notes: 'Assigned to driver' })
        .expect(200);

      expect(updateResponse.body.data.status).toBe('assigned');
      expect(updateResponse.body.data.latitude).toBeNull();
      expect(updateResponse.body.data.longitude).toBeNull();
    });

    it('should handle bulk operations with mixed coordinate data', async () => {
      const mockMixedReports = [
        {
          id: 'bulk-1',
          location: 'GPS Location',
          latitude: -1.2921,
          longitude: 36.8219,
          status: 'pending'
        },
        {
          id: 'bulk-2',
          location: 'Manual Location',
          latitude: null,
          longitude: null,
          status: 'pending'
        }
      ];

      wasteReportHelpers.getWasteReports.mockResolvedValueOnce({
        reports: mockMixedReports,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
      });

      // Mock admin user for this test
      app.use('/api/admin-reports', (req, res, next) => {
        req.user = { id: 'admin-id', role: 'admin' };
        next();
      }, wasteReportRoutes);

      const response = await request(app)
        .get('/api/admin-reports')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].latitude).toBe(-1.2921);
      expect(response.body.data[1].latitude).toBeNull();
    });
  });
});