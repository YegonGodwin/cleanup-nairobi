// Mock the Supabase config
jest.mock('../../config/supabase.js', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

// Mock the database config
jest.mock('../../config/database.js', () => ({
  TABLES: {
    WASTE_REPORTS: 'waste_reports'
  },
  REPORT_STATUS: {
    PENDING: 'pending'
  }
}));

import { createWasteReport } from '../../utils/wasteReportHelpers.js';
import { supabaseAdmin } from '../../config/supabase.js';

describe('wasteReportHelpers - Integration Tests', () => {
  let mockFrom, mockInsert, mockSelect, mockSingle;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup the mock chain
    mockSingle = jest.fn();
    mockSelect = jest.fn(() => ({ single: mockSingle }));
    mockInsert = jest.fn(() => ({ select: mockSelect }));
    mockFrom = jest.fn(() => ({ insert: mockInsert }));
    
    supabaseAdmin.from = mockFrom;
  });

  describe('createWasteReport with nullable coordinates', () => {
    test('should create report with null coordinates successfully', async () => {
      const reportData = {
        user_id: 'test-user-id',
        location: 'Manual location entry - Kibera',
        description: 'Waste pile reported manually',
        waste_type: 'mixed',
        latitude: null,
        longitude: null
      };

      const expectedDbData = {
        ...reportData,
        status: 'pending',
        created_at: expect.any(String)
      };

      const mockCreatedReport = {
        id: 'test-report-id',
        ...expectedDbData
      };

      mockSingle.mockResolvedValueOnce({
        data: mockCreatedReport,
        error: null
      });

      const result = await createWasteReport(reportData);

      expect(mockFrom).toHaveBeenCalledWith('waste_reports');
      expect(mockInsert).toHaveBeenCalledWith([expectedDbData]);
      expect(result).toEqual(mockCreatedReport);
    });

    test('should reject partial coordinates (only latitude provided)', async () => {
      const reportData = {
        user_id: 'test-user-id',
        location: 'Test location',
        description: 'Test description',
        waste_type: 'plastic',
        latitude: -1.2921,
        longitude: null
      };

      await expect(createWasteReport(reportData)).rejects.toThrow(
        'Both latitude and longitude must be provided together, or both must be null'
      );

      expect(mockInsert).not.toHaveBeenCalled();
    });

    test('should reject partial coordinates (only longitude provided)', async () => {
      const reportData = {
        user_id: 'test-user-id',
        location: 'Test location',
        description: 'Test description',
        waste_type: 'plastic',
        latitude: null,
        longitude: 36.8219
      };

      await expect(createWasteReport(reportData)).rejects.toThrow(
        'Both latitude and longitude must be provided together, or both must be null'
      );

      expect(mockInsert).not.toHaveBeenCalled();
    });
  });
});