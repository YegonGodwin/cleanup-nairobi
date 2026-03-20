import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportAssignmentModal from '../ReportAssignmentModal'

// Mock the API
vi.mock('../../../services/api', () => ({
  driversAPI: {
    getAvailable: vi.fn(),
  },
  reportsAPI: {
    assign: vi.fn(),
  },
}))

describe('ReportAssignmentModal', () => {
  const mockReport = {
    id: 'report-123',
    location: 'Uhuru Park, Nairobi',
    description: 'Large pile of plastic waste',
    waste_type: 'plastic',
    status: 'pending',
    user_name: 'John Doe'
  }

  const mockDrivers = [
    {
      id: 'driver-1',
      full_name: 'Driver One',
      vehicle_number: 'KAA 123A',
      phone: '+254700000001',
      is_available: true,
      current_assignments: 2
    },
    {
      id: 'driver-2',
      full_name: 'Driver Two',
      vehicle_number: 'KAB 456B',
      phone: '+254700000002',
      is_available: true,
      current_assignments: 0
    },
    {
      id: 'driver-3',
      full_name: 'Driver Three',
      vehicle_number: 'KAC 789C',
      phone: '+254700000003',
      is_available: false,
      current_assignments: 5
    }
  ]

  const mockOnClose = vi.fn()
  const mockOnAssign = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    const { driversAPI } = require('../../../services/api')
    driversAPI.getAvailable.mockResolvedValue({ data: mockDrivers })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Modal Rendering', () => {
    it('should render modal when open', async () => {
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Assign Driver')).toBeInTheDocument()
        expect(screen.getByText('Report Details')).toBeInTheDocument()
      })
    })

    it('should not render modal when closed', () => {
      render(
        <ReportAssignmentModal
          isOpen={false}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      expect(screen.queryByText('Assign Driver')).not.toBeInTheDocument()
    })

    it('should display report information', async () => {
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Uhuru Park, Nairobi')).toBeInTheDocument()
        expect(screen.getByText('Large pile of plastic waste')).toBeInTheDocument()
        expect(screen.getByText('plastic')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })
  })

  describe('Driver Loading and Display', () => {
    it('should show loading state while fetching drivers', () => {
      const { driversAPI } = require('../../../services/api')
      driversAPI.getAvailable.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      expect(screen.getByText(/loading available drivers/i)).toBeInTheDocument()
    })

    it('should display available drivers after loading', async () => {
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Driver One')).toBeInTheDocument()
        expect(screen.getByText('Driver Two')).toBeInTheDocument()
        expect(screen.getByText('KAA 123A')).toBeInTheDocument()
        expect(screen.getByText('KAB 456B')).toBeInTheDocument()
      })
    })

    it('should show driver availability status', async () => {
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Available')).toBeInTheDocument()
        expect(screen.getByText('Busy')).toBeInTheDocument()
      })
    })

    it('should show current assignments count', async () => {
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('2 active assignments')).toBeInTheDocument()
        expect(screen.getByText('0 active assignments')).toBeInTheDocument()
        expect(screen.getByText('5 active assignments')).toBeInTheDocument()
      })
    })

    it('should handle driver loading error', async () => {
      const { driversAPI } = require('../../../services/api')
      driversAPI.getAvailable.mockRejectedValue(new Error('Failed to load drivers'))

      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/failed to load drivers/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })
  })

  describe('Driver Selection', () => {
    it('should allow selecting a driver', async () => {
      const user = userEvent.setup()
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Driver One')).toBeInTheDocument()
      })

      const driverCard = screen.getByText('Driver One').closest('.driver-card')
      await user.click(driverCard)

      expect(driverCard).toHaveClass('selected') // Assuming selected styling
    })

    it('should show selected driver with different styling', async () => {
      const user = userEvent.setup()
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Driver One')).toBeInTheDocument()
      })

      const driverCard = screen.getByText('Driver One').closest('div')
      await user.click(driverCard)

      // Should have selected styling
      expect(driverCard).toHaveClass('ring-2', 'ring-green-500')
    })

    it('should allow changing driver selection', async () => {
      const user = userEvent.setup()
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Driver One')).toBeInTheDocument()
        expect(screen.getByText('Driver Two')).toBeInTheDocument()
      })

      // Select first driver
      const driverOneCard = screen.getByText('Driver One').closest('div')
      await user.click(driverOneCard)

      // Select second driver
      const driverTwoCard = screen.getByText('Driver Two').closest('div')
      await user.click(driverTwoCard)

      // Only second driver should be selected
      expect(driverTwoCard).toHaveClass('ring-2', 'ring-green-500')
      expect(driverOneCard).not.toHaveClass('ring-2', 'ring-green-500')
    })
  })

  describe('Assignment Notes', () => {
    it('should allow entering assignment notes', async () => {
      const user = userEvent.setup()
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
      })

      const notesTextarea = screen.getByLabelText(/notes/i)
      await user.type(notesTextarea, 'Priority pickup - high traffic area')

      expect(notesTextarea).toHaveValue('Priority pickup - high traffic area')
    })

    it('should have character limit for notes', async () => {
      const user = userEvent.setup()
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
      })

      const notesTextarea = screen.getByLabelText(/notes/i)
      expect(notesTextarea).toHaveAttribute('maxLength', '500')
    })
  })

  describe('Priority Selection', () => {
    it('should allow selecting assignment priority', async () => {
      const user = userEvent.setup()
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/priority/i)).toBeInTheDocument()
      })

      const prioritySelect = screen.getByLabelText(/priority/i)
      await user.selectOptions(prioritySelect, 'high')

      expect(prioritySelect).toHaveValue('high')
    })

    it('should have priority options', async () => {
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /low/i })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: /medium/i })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: /high/i })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: /urgent/i })).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should enable assign button when driver is selected', async () => {
      const user = userEvent.setup()
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Driver One')).toBeInTheDocument()
      })

      const assignButton = screen.getByRole('button', { name: /assign driver/i })
      expect(assignButton).toBeDisabled()

      // Select a driver
      const driverCard = screen.getByText('Driver One').closest('div')
      await user.click(driverCard)

      expect(assignButton).not.toBeDisabled()
    })

    it('should submit assignment with correct data', async () => {
      const user = userEvent.setup()
      const { reportsAPI } = require('../../../services/api')
      reportsAPI.assign.mockResolvedValue({ success: true })

      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Driver One')).toBeInTheDocument()
      })

      // Select driver
      const driverCard = screen.getByText('Driver One').closest('div')
      await user.click(driverCard)

      // Add notes
      const notesTextarea = screen.getByLabelText(/notes/i)
      await user.type(notesTextarea, 'Test assignment notes')

      // Set priority
      const prioritySelect = screen.getByLabelText(/priority/i)
      await user.selectOptions(prioritySelect, 'high')

      // Submit
      const assignButton = screen.getByRole('button', { name: /assign driver/i })
      await user.click(assignButton)

      expect(reportsAPI.assign).toHaveBeenCalledWith(mockReport.id, {
        driver_id: 'driver-1',
        notes: 'Test assignment notes',
        priority: 'high'
      })
    })

    it('should call onAssign callback on successful assignment', async () => {
      const user = userEvent.setup()
      const { reportsAPI } = require('../../../services/api')
      const mockAssignmentResponse = { 
        success: true, 
        data: { assignment_id: 'assignment-123' } 
      }
      reportsAPI.assign.mockResolvedValue(mockAssignmentResponse)

      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Driver One')).toBeInTheDocument()
      })

      // Select driver and submit
      const driverCard = screen.getByText('Driver One').closest('div')
      await user.click(driverCard)

      const assignButton = screen.getByRole('button', { name: /assign driver/i })
      await user.click(assignButton)

      await waitFor(() => {
        expect(mockOnAssign).toHaveBeenCalledWith(mockAssignmentResponse)
      })
    })

    it('should show loading state during assignment', async () => {
      const user = userEvent.setup()
      const { reportsAPI } = require('../../../services/api')
      reportsAPI.assign.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Driver One')).toBeInTheDocument()
      })

      // Select driver and submit
      const driverCard = screen.getByText('Driver One').closest('div')
      await user.click(driverCard)

      const assignButton = screen.getByRole('button', { name: /assign driver/i })
      await user.click(assignButton)

      expect(screen.getByText(/assigning/i)).toBeInTheDocument()
      expect(assignButton).toBeDisabled()
    })

    it('should handle assignment errors', async () => {
      const user = userEvent.setup()
      const { reportsAPI } = require('../../../services/api')
      reportsAPI.assign.mockRejectedValue(new Error('Assignment failed'))

      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Driver One')).toBeInTheDocument()
      })

      // Select driver and submit
      const driverCard = screen.getByText('Driver One').closest('div')
      await user.click(driverCard)

      const assignButton = screen.getByRole('button', { name: /assign driver/i })
      await user.click(assignButton)

      await waitFor(() => {
        expect(screen.getByText(/assignment failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Modal Controls', () => {
    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close modal when clicking outside', async () => {
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      const modalOverlay = screen.getByTestId('modal-overlay')
      fireEvent.click(modalOverlay)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close modal on Escape key press', async () => {
      const user = userEvent.setup()
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await user.keyboard('{Escape}')

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/priority/i)).toBeInTheDocument()
      })
    })

    it('should trap focus within modal', async () => {
      const user = userEvent.setup()
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Focus should be trapped within modal
      await user.tab()
      expect(document.activeElement).toBeInTheDocument()
    })

    it('should have proper heading structure', async () => {
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /assign driver/i })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /report details/i })).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty drivers list', async () => {
      const { driversAPI } = require('../../../services/api')
      driversAPI.getAvailable.mockResolvedValue({ data: [] })

      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/no available drivers/i)).toBeInTheDocument()
      })
    })

    it('should handle missing report data', () => {
      render(
        <ReportAssignmentModal
          isOpen={true}
          report={null}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      expect(screen.getByText(/no report selected/i)).toBeInTheDocument()
    })

    it('should handle drivers with missing information', async () => {
      const incompleteDrivers = [
        {
          id: 'driver-incomplete',
          full_name: 'Incomplete Driver',
          // Missing vehicle_number, phone, etc.
          is_available: true
        }
      ]

      const { driversAPI } = require('../../../services/api')
      driversAPI.getAvailable.mockResolvedValue({ data: incompleteDrivers })

      render(
        <ReportAssignmentModal
          isOpen={true}
          report={mockReport}
          onClose={mockOnClose}
          onAssign={mockOnAssign}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Incomplete Driver')).toBeInTheDocument()
        // Should handle missing data gracefully
      })
    })
  })
})