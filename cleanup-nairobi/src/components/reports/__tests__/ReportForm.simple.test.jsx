import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportForm from '../ReportForm'

// Mock the API
vi.mock('../../../services/api', () => ({
  reportsAPI: {
    create: vi.fn(),
  },
}))

// Mock the validation utilities with simple implementations
vi.mock('../../../utils/validation', () => ({
  validators: {
    location: vi.fn(() => null),
    description: vi.fn(() => null),
    wasteType: vi.fn(() => null),
    file: vi.fn(() => null),
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
    reset: vi.fn(),
  })),
}))

// Mock the hooks with simple implementations
vi.mock('../../../hooks/useApiState', () => ({
  useFormSubmission: vi.fn(() => ({
    loading: false,
    error: null,
    submit: vi.fn(),
    retry: vi.fn(),
    canRetry: false,
  })),
}))

// Mock Toast to prevent import errors
vi.mock('../../../components/ui/Toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('ReportForm - Basic Tests', () => {
  const mockOnReportCreated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('should render the form title', () => {
      render(<ReportForm onReportCreated={mockOnReportCreated} />)
      
      expect(screen.getByText('Report Waste Issue')).toBeInTheDocument()
    })

    it('should render location field', () => {
      render(<ReportForm onReportCreated={mockOnReportCreated} />)
      
      expect(screen.getByText('Location *')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter location or use GPS')).toBeInTheDocument()
    })

    it('should render description field', () => {
      render(<ReportForm onReportCreated={mockOnReportCreated} />)
      
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Describe the waste issue in detail...')).toBeInTheDocument()
    })

    it('should render waste type field', () => {
      render(<ReportForm onReportCreated={mockOnReportCreated} />)
      
      expect(screen.getByText('Waste Type')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Select waste type')).toBeInTheDocument()
    })

    it('should render photo upload field', () => {
      render(<ReportForm onReportCreated={mockOnReportCreated} />)
      
      expect(screen.getByText('Photo (Optional)')).toBeInTheDocument()
      expect(screen.getByText('Choose Photo')).toBeInTheDocument()
    })

    it('should render submit button', () => {
      render(<ReportForm onReportCreated={mockOnReportCreated} />)
      
      expect(screen.getByRole('button', { name: 'Submit Report' })).toBeInTheDocument()
    })

    it('should render GPS button', () => {
      render(<ReportForm onReportCreated={mockOnReportCreated} />)
      
      // GPS button should be present (it has an icon but no text)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(1) // Should have submit button + GPS button
    })
  })

  describe('Form Interactions', () => {
    it('should handle form submission', async () => {
      const user = userEvent.setup()
      render(<ReportForm onReportCreated={mockOnReportCreated} />)

      const submitButton = screen.getByRole('button', { name: 'Submit Report' })
      await user.click(submitButton)

      // Form submission should be attempted (validation will be called)
      const { useFormValidation } = await import('../../../utils/validation')
      const mockValidation = useFormValidation.mock.results[0].value
      expect(mockValidation.validateAll).toHaveBeenCalled()
    })

    it('should handle waste type selection', async () => {
      const user = userEvent.setup()
      render(<ReportForm onReportCreated={mockOnReportCreated} />)

      const wasteTypeSelect = screen.getByDisplayValue('Select waste type')
      await user.selectOptions(wasteTypeSelect, 'plastic')

      // Should call handleChange from validation hook
      const { useFormValidation } = await import('../../../utils/validation')
      const mockValidation = useFormValidation.mock.results[0].value
      expect(mockValidation.handleChange).toHaveBeenCalled()
    })

    it('should handle file input change', async () => {
      const user = userEvent.setup()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      render(<ReportForm onReportCreated={mockOnReportCreated} />)

      const fileInput = screen.getByLabelText('Photo (Optional)')
      await user.upload(fileInput, file)

      expect(fileInput.files[0]).toBe(file)
    })
  })

  describe('Validation Display', () => {
    it('should display validation errors when present', () => {
      // Mock validation with errors
      const { useFormValidation } = require('../../../utils/validation')
      useFormValidation.mockReturnValue({
        data: {
          location: '',
          latitude: null,
          longitude: null,
          description: '',
          waste_type: '',
          image_url: ''
        },
        errors: {
          location: 'Location is required',
          description: 'Description is required'
        },
        touched: {
          location: true,
          description: true
        },
        handleChange: vi.fn(),
        handleBlur: vi.fn(),
        validateAll: vi.fn(() => false),
        reset: vi.fn(),
      })

      render(<ReportForm onReportCreated={mockOnReportCreated} />)

      expect(screen.getByText('Location is required')).toBeInTheDocument()
      expect(screen.getByText('Description is required')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading state during submission', () => {
      // Mock loading state
      const { useFormSubmission } = require('../../../hooks/useApiState')
      useFormSubmission.mockReturnValue({
        loading: true,
        error: null,
        submit: vi.fn(),
        retry: vi.fn(),
        canRetry: false,
      })

      render(<ReportForm onReportCreated={mockOnReportCreated} />)

      const submitButton = screen.getByRole('button', { name: /submitting/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should display submission errors', () => {
      // Mock error state
      const mockError = {
        getUserMessage: vi.fn(() => 'Submission failed')
      }
      
      const { useFormSubmission } = require('../../../hooks/useApiState')
      useFormSubmission.mockReturnValue({
        loading: false,
        error: mockError,
        submit: vi.fn(),
        retry: vi.fn(),
        canRetry: true,
      })

      render(<ReportForm onReportCreated={mockOnReportCreated} />)

      expect(screen.getByText('Submission failed')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  describe('GPS Functionality', () => {
    it('should handle geolocation success', async () => {
      const user = userEvent.setup()
      const mockPosition = {
        coords: {
          latitude: -1.2921,
          longitude: 36.8219
        }
      }

      // Mock successful geolocation
      global.navigator.geolocation.getCurrentPosition = vi.fn((success) => {
        success(mockPosition)
      })

      render(<ReportForm onReportCreated={mockOnReportCreated} />)

      // Click GPS button (second button after submit)
      const buttons = screen.getAllByRole('button')
      const gpsButton = buttons.find(button => button !== screen.getByRole('button', { name: 'Submit Report' }))
      
      if (gpsButton) {
        await user.click(gpsButton)
        
        // Should call handleChange with coordinates
        const { useFormValidation } = await import('../../../utils/validation')
        const mockValidation = useFormValidation.mock.results[0].value
        expect(mockValidation.handleChange).toHaveBeenCalled()
      }
    })

    it('should handle geolocation errors', async () => {
      const user = userEvent.setup()
      const mockError = { code: 1, message: 'Permission denied' }

      // Mock geolocation error
      global.navigator.geolocation.getCurrentPosition = vi.fn((success, error) => {
        error(mockError)
      })

      render(<ReportForm onReportCreated={mockOnReportCreated} />)

      // Click GPS button
      const buttons = screen.getAllByRole('button')
      const gpsButton = buttons.find(button => button !== screen.getByRole('button', { name: 'Submit Report' }))
      
      if (gpsButton) {
        await user.click(gpsButton)
        
        // Should show error message
        await waitFor(() => {
          expect(screen.getByText(/location access denied/i)).toBeInTheDocument()
        })
      }
    })
  })
})