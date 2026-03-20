import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportForm from '../ReportForm';
import { reportsAPI } from '../../../services/api';

// Mock the API
vi.mock('../../../services/api', () => ({
  reportsAPI: {
    create: vi.fn()
  }
}));

// Mock Toast component
vi.mock('../../ui/Toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn()
  }
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

describe('ReportForm - End-to-End Coordinate Fix Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    
    // Reset geolocation mock
    mockGeolocation.getCurrentPosition.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete workflow with GPS coordinates', () => {
    it('should complete full report submission with GPS coordinates', async () => {
      // Mock successful GPS
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: -1.2921,
            longitude: 36.8219,
            accuracy: 10
          }
        });
      });

      // Mock successful API response
      const mockResponse = {
        id: 'test-report-1',
        location: 'Uhuru Park, Nairobi',
        latitude: -1.2921,
        longitude: 36.8219,
        description: 'Large pile of plastic waste',
        waste_type: 'plastic',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      reportsAPI.create.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        message: 'Report created successfully'
      });

      render(<ReportForm />);

      // Fill in location manually first
      const locationInput = screen.getByPlaceholderText('Enter location manually or use GPS');
      await user.type(locationInput, 'Uhuru Park, Nairobi');

      // Use GPS to get coordinates
      const gpsButton = screen.getByTitle('Use GPS to get current location');
      await user.click(gpsButton);

      // Wait for GPS to complete
      await waitFor(() => {
        expect(screen.getByText(/GPS coordinates obtained/)).toBeInTheDocument();
      });

      // Fill in other required fields
      const descriptionInput = screen.getByPlaceholderText('Describe the waste issue...');
      await user.type(descriptionInput, 'Large pile of plastic waste');

      const wasteTypeSelect = screen.getByDisplayValue('Select waste type');
      await user.selectOptions(wasteTypeSelect, 'plastic');

      // Submit the form
      const submitButton = screen.getByText('Submit Report');
      await user.click(submitButton);

      // Verify API was called with correct data
      await waitFor(() => {
        expect(reportsAPI.create).toHaveBeenCalledWith({
          location: 'Uhuru Park, Nairobi',
          latitude: -1.2921,
          longitude: 36.8219,
          description: 'Large pile of plastic waste',
          waste_type: 'plastic',
          image_url: null
        });
      });

      // Verify success feedback
      await waitFor(() => {
        expect(screen.getByText(/Report submitted successfully/)).toBeInTheDocument();
      });
    });

    it('should handle GPS failure and continue with manual location', async () => {
      // Mock GPS failure
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          message: 'User denied geolocation'
        });
      });

      // Mock successful API response without coordinates
      const mockResponse = {
        id: 'test-report-2',
        location: 'Manual location - Kibera',
        latitude: null,
        longitude: null,
        description: 'Waste blocking drainage',
        waste_type: 'mixed',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      reportsAPI.create.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        message: 'Report created successfully'
      });

      render(<ReportForm />);

      // Fill in location manually
      const locationInput = screen.getByPlaceholderText('Enter location manually or use GPS');
      await user.type(locationInput, 'Manual location - Kibera');

      // Try to use GPS (will fail)
      const gpsButton = screen.getByTitle('Use GPS to get current location');
      await user.click(gpsButton);

      // Wait for GPS failure message
      await waitFor(() => {
        expect(screen.getByText(/GPS unavailable/)).toBeInTheDocument();
      });

      // Continue with manual entry
      const descriptionInput = screen.getByPlaceholderText('Describe the waste issue...');
      await user.type(descriptionInput, 'Waste blocking drainage');

      const wasteTypeSelect = screen.getByDisplayValue('Select waste type');
      await user.selectOptions(wasteTypeSelect, 'mixed');

      // Submit the form
      const submitButton = screen.getByText('Submit Report');
      await user.click(submitButton);

      // Verify API was called without coordinates
      await waitFor(() => {
        expect(reportsAPI.create).toHaveBeenCalledWith({
          location: 'Manual location - Kibera',
          latitude: null,
          longitude: null,
          description: 'Waste blocking drainage',
          waste_type: 'mixed',
          image_url: null
        });
      });

      // Verify success feedback
      await waitFor(() => {
        expect(screen.getByText(/Report submitted successfully/)).toBeInTheDocument();
      });
    });
  });

  describe('Complete workflow with manual location only', () => {
    it('should complete full report submission without GPS', async () => {
      // Mock successful API response without coordinates
      const mockResponse = {
        id: 'test-report-3',
        location: 'Westlands Shopping Center, parking area',
        latitude: null,
        longitude: null,
        description: 'Overflowing bins near entrance',
        waste_type: 'organic',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      reportsAPI.create.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        message: 'Report created successfully'
      });

      render(<ReportForm />);

      // Fill in all fields manually (no GPS usage)
      const locationInput = screen.getByPlaceholderText('Enter location manually or use GPS');
      await user.type(locationInput, 'Westlands Shopping Center, parking area');

      const descriptionInput = screen.getByPlaceholderText('Describe the waste issue...');
      await user.type(descriptionInput, 'Overflowing bins near entrance');

      const wasteTypeSelect = screen.getByDisplayValue('Select waste type');
      await user.selectOptions(wasteTypeSelect, 'organic');

      // Verify manual location status is shown
      await waitFor(() => {
        expect(screen.getByText(/Manual location entered/)).toBeInTheDocument();
      });

      // Submit the form
      const submitButton = screen.getByText('Submit Report');
      await user.click(submitButton);

      // Verify API was called without coordinates
      await waitFor(() => {
        expect(reportsAPI.create).toHaveBeenCalledWith({
          location: 'Westlands Shopping Center, parking area',
          latitude: null,
          longitude: null,
          description: 'Overflowing bins near entrance',
          waste_type: 'organic',
          image_url: null
        });
      });

      // Verify success feedback
      await waitFor(() => {
        expect(screen.getByText(/Report submitted successfully/)).toBeInTheDocument();
      });
    });

    it('should show appropriate status indicators for manual entry', async () => {
      render(<ReportForm />);

      const locationInput = screen.getByPlaceholderText('Enter location manually or use GPS');
      
      // Initially no status
      expect(screen.queryByText(/GPS coordinates/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Manual location/)).not.toBeInTheDocument();

      // Type location manually
      await user.type(locationInput, 'Manual location');

      // Should show manual location status
      await waitFor(() => {
        expect(screen.getByText(/Manual location entered/)).toBeInTheDocument();
      });

      // Should show info about GPS being optional
      expect(screen.getByText(/GPS coordinates are optional/)).toBeInTheDocument();
    });
  });

  describe('Error handling scenarios', () => {
    it('should handle API errors gracefully with coordinate data', async () => {
      // Mock successful GPS
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: -1.2921,
            longitude: 36.8219
          }
        });
      });

      // Mock API error
      reportsAPI.create.mockRejectedValueOnce(
        new Error('Server error: coordinate validation failed')
      );

      render(<ReportForm />);

      // Fill form with GPS coordinates
      const locationInput = screen.getByPlaceholderText('Enter location manually or use GPS');
      await user.type(locationInput, 'Test location');

      const gpsButton = screen.getByTitle('Use GPS to get current location');
      await user.click(gpsButton);

      await waitFor(() => {
        expect(screen.getByText(/GPS coordinates obtained/)).toBeInTheDocument();
      });

      const descriptionInput = screen.getByPlaceholderText('Describe the waste issue...');
      await user.type(descriptionInput, 'Test description');

      const wasteTypeSelect = screen.getByDisplayValue('Select waste type');
      await user.selectOptions(wasteTypeSelect, 'plastic');

      // Submit and expect error
      const submitButton = screen.getByText('Submit Report');
      await user.click(submitButton);

      // Should show error with coordinate-specific options
      await waitFor(() => {
        expect(screen.getByText(/Error submitting report/)).toBeInTheDocument();
      });

      // Should show coordinate-specific error handling options
      expect(screen.getByText('Remove GPS Data')).toBeInTheDocument();
      expect(screen.getByText('Get GPS Again')).toBeInTheDocument();
    });

    it('should handle API errors gracefully without coordinate data', async () => {
      // Mock API error
      reportsAPI.create.mockRejectedValueOnce(
        new Error('Server error: general validation failed')
      );

      render(<ReportForm />);

      // Fill form without GPS
      const locationInput = screen.getByPlaceholderText('Enter location manually or use GPS');
      await user.type(locationInput, 'Manual location');

      const descriptionInput = screen.getByPlaceholderText('Describe the waste issue...');
      await user.type(descriptionInput, 'Test description');

      const wasteTypeSelect = screen.getByDisplayValue('Select waste type');
      await user.selectOptions(wasteTypeSelect, 'plastic');

      // Submit and expect error
      const submitButton = screen.getByText('Submit Report');
      await user.click(submitButton);

      // Should show general error
      await waitFor(() => {
        expect(screen.getByText(/Error submitting report/)).toBeInTheDocument();
      });

      // Should show retry option
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should handle coordinate-specific error recovery', async () => {
      // Mock successful GPS initially
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: -1.2921,
            longitude: 36.8219
          }
        });
      });

      // Mock coordinate validation error first, then success
      reportsAPI.create
        .mockRejectedValueOnce(new Error('coordinate validation failed'))
        .mockResolvedValueOnce({
          success: true,
          data: { id: 'recovered-report' },
          message: 'Report created successfully'
        });

      render(<ReportForm />);

      // Fill form with GPS
      const locationInput = screen.getByPlaceholderText('Enter location manually or use GPS');
      await user.type(locationInput, 'Test location');

      const gpsButton = screen.getByTitle('Use GPS to get current location');
      await user.click(gpsButton);

      await waitFor(() => {
        expect(screen.getByText(/GPS coordinates obtained/)).toBeInTheDocument();
      });

      const descriptionInput = screen.getByPlaceholderText('Describe the waste issue...');
      await user.type(descriptionInput, 'Test description');

      const wasteTypeSelect = screen.getByDisplayValue('Select waste type');
      await user.selectOptions(wasteTypeSelect, 'plastic');

      // Submit and get error
      const submitButton = screen.getByText('Submit Report');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Remove GPS Data')).toBeInTheDocument();
      });

      // Click "Remove GPS Data" to retry without coordinates
      const removeGpsButton = screen.getByText('Remove GPS Data');
      await user.click(removeGpsButton);

      // Should retry without coordinates and succeed
      await waitFor(() => {
        expect(reportsAPI.create).toHaveBeenCalledTimes(2);
        expect(reportsAPI.create).toHaveBeenLastCalledWith({
          location: 'Test location',
          latitude: null,
          longitude: null,
          description: 'Test description',
          waste_type: 'plastic',
          image_url: null
        });
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/Report submitted successfully/)).toBeInTheDocument();
      });
    });
  });

  describe('User experience validation', () => {
    it('should provide clear feedback throughout the GPS process', async () => {
      // Mock GPS with delay to test loading states
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        setTimeout(() => {
          success({
            coords: {
              latitude: -1.2921,
              longitude: 36.8219
            }
          });
        }, 100);
      });

      render(<ReportForm />);

      const gpsButton = screen.getByTitle('Use GPS to get current location');
      
      // Initial state
      expect(screen.queryByText(/Getting GPS/)).not.toBeInTheDocument();
      
      // Click GPS button
      await user.click(gpsButton);
      
      // Should show loading state
      expect(screen.getByText(/Getting GPS location/)).toBeInTheDocument();
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/GPS coordinates obtained/)).toBeInTheDocument();
      });
      
      // Should show success state with coordinates
      expect(screen.getByText(/Latitude: -1.2921/)).toBeInTheDocument();
      expect(screen.getByText(/Longitude: 36.8219/)).toBeInTheDocument();
    });

    it('should allow users to switch between GPS and manual entry', async () => {
      // Mock successful GPS
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: -1.2921,
            longitude: 36.8219
          }
        });
      });

      render(<ReportForm />);

      const locationInput = screen.getByPlaceholderText('Enter location manually or use GPS');
      
      // Start with manual entry
      await user.type(locationInput, 'Manual location');
      
      await waitFor(() => {
        expect(screen.getByText(/Manual location entered/)).toBeInTheDocument();
      });

      // Switch to GPS
      const gpsButton = screen.getByTitle('Use GPS to get current location');
      await user.click(gpsButton);

      await waitFor(() => {
        expect(screen.getByText(/GPS coordinates obtained/)).toBeInTheDocument();
      });

      // Clear GPS and go back to manual
      const clearGpsButton = screen.getByText('Clear GPS');
      await user.click(clearGpsButton);

      await waitFor(() => {
        expect(screen.queryByText(/GPS coordinates obtained/)).not.toBeInTheDocument();
        expect(screen.getByText(/Manual location entered/)).toBeInTheDocument();
      });
    });

    it('should validate form submission works in all coordinate states', async () => {
      const mockResponse = {
        id: 'test-report',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      reportsAPI.create.mockResolvedValue({
        success: true,
        data: mockResponse,
        message: 'Report created successfully'
      });

      render(<ReportForm />);

      // Test 1: Manual location only
      const locationInput = screen.getByPlaceholderText('Enter location manually or use GPS');
      await user.type(locationInput, 'Test location');

      const descriptionInput = screen.getByPlaceholderText('Describe the waste issue...');
      await user.type(descriptionInput, 'Test description');

      const wasteTypeSelect = screen.getByDisplayValue('Select waste type');
      await user.selectOptions(wasteTypeSelect, 'plastic');

      let submitButton = screen.getByText('Submit Report');
      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      await waitFor(() => {
        expect(reportsAPI.create).toHaveBeenCalledWith({
          location: 'Test location',
          latitude: null,
          longitude: null,
          description: 'Test description',
          waste_type: 'plastic',
          image_url: null
        });
      });
    });
  });
});