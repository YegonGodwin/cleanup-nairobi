import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportForm from '../ReportForm';

// Mock the API
vi.mock('../../../services/api', () => ({
  reportsAPI: {
    create: vi.fn()
  }
}));

// Mock the validation utilities
vi.mock('../../../utils/validation', () => ({
  validators: {
    location: vi.fn(() => null),
    description: vi.fn(() => null),
    wasteType: vi.fn(() => null),
    file: vi.fn(() => null)
  },
  useFormValidation: vi.fn(() => ({
    data: {
      location: '',
      latitude: null,
      longitude: null,
      description: '',
      waste_type: '',
      image_url: ''
    },
    errors: {},
    touched: {},
    handleChange: vi.fn(),
    handleBlur: vi.fn(),
    validateAll: vi.fn(() => true),
    reset: vi.fn()
  }))
}));

// Mock the API state hook
vi.mock('../../../hooks/useApiState', () => ({
  useFormSubmission: vi.fn(() => ({
    loading: false,
    error: null,
    submit: vi.fn(),
    retry: vi.fn(),
    canRetry: false
  }))
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

describe('ReportForm - Coordinate Fix Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form with coordinate status indicators', () => {
    render(<ReportForm />);
    
    expect(screen.getByText('Location *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter location manually or use GPS')).toBeInTheDocument();
    expect(screen.getByTitle('Use GPS to get current location')).toBeInTheDocument();
  });

  it('should show manual location status when user types location', async () => {
    const { useFormValidation } = await import('../../../utils/validation');
    const mockHandleChange = vi.fn();
    
    useFormValidation.mockReturnValue({
      data: {
        location: 'Nairobi CBD',
        latitude: null,
        longitude: null,
        description: '',
        waste_type: '',
        image_url: ''
      },
      errors: {},
      touched: {},
      handleChange: mockHandleChange,
      handleBlur: vi.fn(),
      validateAll: vi.fn(() => true),
      reset: vi.fn()
    });

    render(<ReportForm />);
    
    const locationInput = screen.getByPlaceholderText('Enter location manually or use GPS');
    fireEvent.change(locationInput, { target: { value: 'Nairobi CBD' } });
    
    // Should show manual location indicator
    await waitFor(() => {
      expect(screen.getByText(/Manual location entered/)).toBeInTheDocument();
    });
  });

  it('should handle GPS success and show success status', async () => {
    const { useFormValidation } = await import('../../../utils/validation');
    const mockHandleChange = vi.fn();
    
    useFormValidation.mockReturnValue({
      data: {
        location: 'Test Location',
        latitude: -1.2921,
        longitude: 36.8219,
        description: '',
        waste_type: '',
        image_url: ''
      },
      errors: {},
      touched: {},
      handleChange: mockHandleChange,
      handleBlur: vi.fn(),
      validateAll: vi.fn(() => true),
      reset: vi.fn()
    });

    // Mock successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: -1.2921,
          longitude: 36.8219
        }
      });
    });

    render(<ReportForm />);
    
    const gpsButton = screen.getByTitle('Use GPS to get current location');
    fireEvent.click(gpsButton);
    
    await waitFor(() => {
      expect(mockHandleChange).toHaveBeenCalled();
    });
  });

  it('should handle GPS failure gracefully', async () => {
    // Mock geolocation error
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 1, // PERMISSION_DENIED
        message: 'User denied geolocation'
      });
    });

    render(<ReportForm />);
    
    const gpsButton = screen.getByTitle('Use GPS to get current location');
    fireEvent.click(gpsButton);
    
    await waitFor(() => {
      expect(screen.getByText(/GPS unavailable/)).toBeInTheDocument();
    });
  });

  it('should allow form submission without coordinates', async () => {
    const { useFormSubmission } = await import('../../../hooks/useApiState');
    const mockSubmit = vi.fn();
    
    useFormSubmission.mockReturnValue({
      loading: false,
      error: null,
      submit: mockSubmit,
      retry: vi.fn(),
      canRetry: false
    });

    const { useFormValidation } = await import('../../../utils/validation');
    useFormValidation.mockReturnValue({
      data: {
        location: 'Manual Location',
        latitude: null,
        longitude: null,
        description: 'Test description',
        waste_type: 'plastic',
        image_url: ''
      },
      errors: {},
      touched: {},
      handleChange: vi.fn(),
      handleBlur: vi.fn(),
      validateAll: vi.fn(() => true),
      reset: vi.fn()
    });

    render(<ReportForm />);
    
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          location: 'Manual Location',
          description: 'Test description',
          waste_type: 'plastic'
        })
      );
    });
  });

  it('should show enhanced error handling for coordinate issues', async () => {
    const { useFormSubmission } = await import('../../../hooks/useApiState');
    
    const coordinateError = new Error('Invalid coordinates');
    coordinateError.message = 'coordinate validation failed';
    
    useFormSubmission.mockReturnValue({
      loading: false,
      error: coordinateError,
      submit: vi.fn(),
      retry: vi.fn(),
      canRetry: true
    });

    render(<ReportForm />);
    
    // Should show coordinate-specific error options
    expect(screen.getByText('Remove GPS Data')).toBeInTheDocument();
    expect(screen.getByText('Get GPS Again')).toBeInTheDocument();
  });
});