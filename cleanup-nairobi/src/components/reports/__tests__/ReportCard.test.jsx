import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportCard from '../ReportCard'

describe('ReportCard', () => {
  const mockReport = {
    id: 'test-report-123',
    location: 'Uhuru Park, Nairobi',
    description: 'Large pile of plastic waste near the main entrance that needs immediate attention',
    waste_type: 'plastic',
    status: 'pending',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    image_url: 'https://example.com/image.jpg'
  }

  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render report information correctly', () => {
      render(<ReportCard report={mockReport} onClick={mockOnClick} />)

      expect(screen.getByText('PENDING')).toBeInTheDocument()
      expect(screen.getByText('Plastic')).toBeInTheDocument()
      expect(screen.getByText('Uhuru Park, Nairobi')).toBeInTheDocument()
      expect(screen.getByText(/Large pile of plastic waste/)).toBeInTheDocument()
    })

    it('should display report ID (last 8 characters)', () => {
      render(<ReportCard report={mockReport} onClick={mockOnClick} />)

      expect(screen.getByText('#port-123')).toBeInTheDocument()
    })

    it('should format date correctly', () => {
      render(<ReportCard report={mockReport} onClick={mockOnClick} />)

      // Should show formatted date
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
    })

    it('should show image when image_url is provided', () => {
      render(<ReportCard report={mockReport} onClick={mockOnClick} />)

      const image = screen.getByAltText('Waste report')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
    })

    it('should not show image when image_url is not provided', () => {
      const reportWithoutImage = { ...mockReport, image_url: null }
      render(<ReportCard report={reportWithoutImage} onClick={mockOnClick} />)

      expect(screen.queryByAltText('Waste report')).not.toBeInTheDocument()
    })
  })

  describe('Status Display', () => {
    it('should display pending status with correct styling', () => {
      const pendingReport = { ...mockReport, status: 'pending' }
      render(<ReportCard report={pendingReport} onClick={mockOnClick} />)

      const statusBadge = screen.getByText('PENDING')
      expect(statusBadge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200')
    })

    it('should display assigned status with correct styling', () => {
      const assignedReport = { ...mockReport, status: 'assigned' }
      render(<ReportCard report={assignedReport} onClick={mockOnClick} />)

      const statusBadge = screen.getByText('ASSIGNED')
      expect(statusBadge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200')
    })

    it('should display in_progress status with correct styling', () => {
      const inProgressReport = { ...mockReport, status: 'in_progress' }
      render(<ReportCard report={inProgressReport} onClick={mockOnClick} />)

      const statusBadge = screen.getByText('IN PROGRESS')
      expect(statusBadge).toHaveClass('bg-purple-100', 'text-purple-800', 'border-purple-200')
    })

    it('should display completed status with correct styling', () => {
      const completedReport = { ...mockReport, status: 'completed' }
      render(<ReportCard report={completedReport} onClick={mockOnClick} />)

      const statusBadge = screen.getByText('COMPLETED')
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200')
    })

    it('should display rejected status with correct styling', () => {
      const rejectedReport = { ...mockReport, status: 'rejected' }
      render(<ReportCard report={rejectedReport} onClick={mockOnClick} />)

      const statusBadge = screen.getByText('REJECTED')
      expect(statusBadge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200')
    })

    it('should handle unknown status with default styling', () => {
      const unknownStatusReport = { ...mockReport, status: 'unknown' }
      render(<ReportCard report={unknownStatusReport} onClick={mockOnClick} />)

      const statusBadge = screen.getByText('UNKNOWN')
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-200')
    })
  })

  describe('Waste Type Display', () => {
    it('should capitalize waste type correctly', () => {
      const organicReport = { ...mockReport, waste_type: 'organic' }
      render(<ReportCard report={organicReport} onClick={mockOnClick} />)

      expect(screen.getByText('Organic')).toBeInTheDocument()
    })

    it('should handle mixed case waste types', () => {
      const mixedCaseReport = { ...mockReport, waste_type: 'ELECTRONIC' }
      render(<ReportCard report={mixedCaseReport} onClick={mockOnClick} />)

      expect(screen.getByText('ELECTRONIC')).toBeInTheDocument()
    })
  })

  describe('Description Truncation', () => {
    it('should truncate long descriptions', () => {
      const longDescription = 'A'.repeat(150) // 150 characters
      const longDescReport = { ...mockReport, description: longDescription }
      
      render(<ReportCard report={longDescReport} onClick={mockOnClick} />)

      const truncatedText = screen.getByText(/A{100}\.\.\./)
      expect(truncatedText).toBeInTheDocument()
    })

    it('should not truncate short descriptions', () => {
      const shortDescription = 'Short description'
      const shortDescReport = { ...mockReport, description: shortDescription }
      
      render(<ReportCard report={shortDescReport} onClick={mockOnClick} />)

      expect(screen.getByText('Short description')).toBeInTheDocument()
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument()
    })
  })

  describe('Driver Assignment Display', () => {
    it('should show driver assignment information when available', () => {
      const reportWithDriver = {
        ...mockReport,
        assigned_driver: {
          full_name: 'John Doe',
          vehicle_number: 'KAA 123A'
        }
      }

      render(<ReportCard report={reportWithDriver} onClick={mockOnClick} />)

      expect(screen.getByText('Assigned to: John Doe')).toBeInTheDocument()
      expect(screen.getByText('Vehicle: KAA 123A')).toBeInTheDocument()
    })

    it('should show driver without vehicle number', () => {
      const reportWithDriverNoVehicle = {
        ...mockReport,
        assigned_driver: {
          full_name: 'Jane Smith'
        }
      }

      render(<ReportCard report={reportWithDriverNoVehicle} onClick={mockOnClick} />)

      expect(screen.getByText('Assigned to: Jane Smith')).toBeInTheDocument()
      expect(screen.queryByText(/Vehicle:/)).not.toBeInTheDocument()
    })

    it('should not show driver section when no driver assigned', () => {
      render(<ReportCard report={mockReport} onClick={mockOnClick} />)

      expect(screen.queryByText(/Assigned to:/)).not.toBeInTheDocument()
    })
  })

  describe('Status Progression Indicator', () => {
    it('should show correct progression for pending status', () => {
      const pendingReport = { ...mockReport, status: 'pending' }
      render(<ReportCard report={pendingReport} onClick={mockOnClick} />)

      // Should have 4 dots total, first one active (green), rest inactive (gray)
      const progressDots = screen.container.querySelectorAll('.w-2.h-2.rounded-full')
      expect(progressDots).toHaveLength(4)
      
      // First dot should be green (current status)
      expect(progressDots[0]).toHaveClass('bg-green-500')
      // Rest should be gray (inactive)
      expect(progressDots[1]).toHaveClass('bg-gray-200')
      expect(progressDots[2]).toHaveClass('bg-gray-200')
      expect(progressDots[3]).toHaveClass('bg-gray-200')
    })

    it('should show correct progression for in_progress status', () => {
      const inProgressReport = { ...mockReport, status: 'in_progress' }
      render(<ReportCard report={inProgressReport} onClick={mockOnClick} />)

      const progressDots = screen.container.querySelectorAll('.w-2.h-2.rounded-full')
      
      // First three should be active (completed or current)
      expect(progressDots[0]).toHaveClass('bg-green-300') // completed
      expect(progressDots[1]).toHaveClass('bg-green-300') // completed
      expect(progressDots[2]).toHaveClass('bg-green-500') // current
      expect(progressDots[3]).toHaveClass('bg-gray-200') // inactive
    })

    it('should show correct progression for completed status', () => {
      const completedReport = { ...mockReport, status: 'completed' }
      render(<ReportCard report={completedReport} onClick={mockOnClick} />)

      const progressDots = screen.container.querySelectorAll('.w-2.h-2.rounded-full')
      
      // First three should be completed, last one current
      expect(progressDots[0]).toHaveClass('bg-green-300')
      expect(progressDots[1]).toHaveClass('bg-green-300')
      expect(progressDots[2]).toHaveClass('bg-green-300')
      expect(progressDots[3]).toHaveClass('bg-green-500') // current
    })
  })

  describe('Updated Date Display', () => {
    it('should show updated date when different from created date', () => {
      const updatedReport = {
        ...mockReport,
        updated_at: '2024-01-16T15:45:00Z'
      }

      render(<ReportCard report={updatedReport} onClick={mockOnClick} />)

      expect(screen.getByText(/Updated Jan 16, 2024/)).toBeInTheDocument()
    })

    it('should not show updated date when same as created date', () => {
      render(<ReportCard report={mockReport} onClick={mockOnClick} />)

      expect(screen.queryByText(/Updated/)).not.toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup()
      render(<ReportCard report={mockReport} onClick={mockOnClick} />)

      const card = screen.getByRole('generic', { name: '' }) // Card doesn't have explicit role
      await user.click(card)

      expect(mockOnClick).toHaveBeenCalledWith(mockReport)
    })

    it('should call onClick when clicked via fireEvent', () => {
      render(<ReportCard report={mockReport} onClick={mockOnClick} />)

      const card = screen.container.firstChild
      fireEvent.click(card)

      expect(mockOnClick).toHaveBeenCalledWith(mockReport)
    })

    it('should not crash when onClick is not provided', async () => {
      const user = userEvent.setup()
      render(<ReportCard report={mockReport} />)

      const card = screen.container.firstChild
      
      // Should not throw error
      expect(() => user.click(card)).not.toThrow()
    })

    it('should have cursor pointer styling', () => {
      render(<ReportCard report={mockReport} onClick={mockOnClick} />)

      const card = screen.container.firstChild
      expect(card).toHaveClass('cursor-pointer')
    })

    it('should have hover effects', () => {
      render(<ReportCard report={mockReport} onClick={mockOnClick} />)

      const card = screen.container.firstChild
      expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow')
    })
  })

  describe('Accessibility', () => {
    it('should have proper alt text for images', () => {
      render(<ReportCard report={mockReport} onClick={mockOnClick} />)

      const image = screen.getByAltText('Waste report')
      expect(image).toBeInTheDocument()
    })

    it('should have meaningful text content for screen readers', () => {
      render(<ReportCard report={mockReport} onClick={mockOnClick} />)

      // Important information should be accessible
      expect(screen.getByText('PENDING')).toBeInTheDocument()
      expect(screen.getByText('Plastic')).toBeInTheDocument()
      expect(screen.getByText('Uhuru Park, Nairobi')).toBeInTheDocument()
      expect(screen.getByText('View Details')).toBeInTheDocument()
    })

    it('should have proper title attributes for status dots', () => {
      render(<ReportCard report={mockReport} onClick={mockOnClick} />)

      const progressDots = screen.container.querySelectorAll('.w-2.h-2.rounded-full')
      expect(progressDots[0]).toHaveAttribute('title', 'pending')
      expect(progressDots[1]).toHaveAttribute('title', 'assigned')
      expect(progressDots[2]).toHaveAttribute('title', 'in progress')
      expect(progressDots[3]).toHaveAttribute('title', 'completed')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing report ID gracefully', () => {
      const reportWithoutId = { ...mockReport, id: null }
      render(<ReportCard report={reportWithoutId} onClick={mockOnClick} />)

      expect(screen.getByText('#N/A')).toBeInTheDocument()
    })

    it('should handle empty location', () => {
      const reportWithEmptyLocation = { ...mockReport, location: '' }
      render(<ReportCard report={reportWithEmptyLocation} onClick={mockOnClick} />)

      // Should still render without crashing
      expect(screen.getByText('PENDING')).toBeInTheDocument()
    })

    it('should handle empty description', () => {
      const reportWithEmptyDescription = { ...mockReport, description: '' }
      render(<ReportCard report={reportWithEmptyDescription} onClick={mockOnClick} />)

      // Should still render without crashing
      expect(screen.getByText('PENDING')).toBeInTheDocument()
    })

    it('should handle invalid date strings', () => {
      const reportWithInvalidDate = { ...mockReport, created_at: 'invalid-date' }
      render(<ReportCard report={reportWithInvalidDate} onClick={mockOnClick} />)

      // Should handle gracefully and not crash
      expect(screen.getByText('PENDING')).toBeInTheDocument()
    })

    it('should handle very short report IDs', () => {
      const reportWithShortId = { ...mockReport, id: '123' }
      render(<ReportCard report={reportWithShortId} onClick={mockOnClick} />)

      expect(screen.getByText('#123')).toBeInTheDocument()
    })
  })

  describe('Visual Layout', () => {
    it('should have proper card styling', () => {
      render(<ReportCard report={mockReport} onClick={mockOnClick} />)

      const card = screen.container.firstChild
      expect(card).toHaveClass('border-l-4', 'border-l-green-500')
    })

    it('should have proper spacing and layout classes', () => {
      render(<ReportCard report={mockReport} onClick={mockOnClick} />)

      // Check for key layout classes
      const card = screen.container.firstChild
      expect(card).toHaveClass('cursor-pointer', 'hover:shadow-lg', 'transition-shadow')
    })
  })
})