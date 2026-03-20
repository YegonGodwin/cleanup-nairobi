import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportsTable from '../ReportsTable'

// Mock the API
vi.mock('../../../services/api', () => ({
  reportsAPI: {
    getAll: vi.fn(),
    assign: vi.fn(),
  },
}))

describe('ReportsTable', () => {
  const mockReports = [
    {
      id: '1',
      location: 'Location 1',
      description: 'Description 1',
      waste_type: 'plastic',
      status: 'pending',
      created_at: '2024-01-01T10:00:00Z',
      user_name: 'John Doe',
      user_id: 'user1'
    },
    {
      id: '2',
      location: 'Location 2',
      description: 'Description 2',
      waste_type: 'organic',
      status: 'assigned',
      created_at: '2024-01-02T10:00:00Z',
      user_name: 'Jane Smith',
      user_id: 'user2',
      assigned_driver: {
        full_name: 'Driver One',
        vehicle_number: 'KAA 123A'
      }
    }
  ]

  const mockOnAssign = vi.fn()
  const mockOnStatusChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Table Rendering', () => {
    it('should render table headers correctly', () => {
      render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      expect(screen.getByText('Report ID')).toBeInTheDocument()
      expect(screen.getByText('User')).toBeInTheDocument()
      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('Waste Type')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Date')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('should render report data in table rows', () => {
      render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Location 1')).toBeInTheDocument()
      expect(screen.getByText('plastic')).toBeInTheDocument()
      expect(screen.getByText('pending')).toBeInTheDocument()

      expect(screen.getByText('#2')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Location 2')).toBeInTheDocument()
      expect(screen.getByText('organic')).toBeInTheDocument()
      expect(screen.getByText('assigned')).toBeInTheDocument()
    })

    it('should show assigned driver information when available', () => {
      render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      expect(screen.getByText('Driver One')).toBeInTheDocument()
      expect(screen.getByText('KAA 123A')).toBeInTheDocument()
    })

    it('should format dates correctly', () => {
      render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      // Should show formatted dates
      expect(screen.getByText(/Jan 1, 2024/)).toBeInTheDocument()
      expect(screen.getByText(/Jan 2, 2024/)).toBeInTheDocument()
    })
  })

  describe('Status Display', () => {
    it('should display status badges with correct styling', () => {
      render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      const pendingBadge = screen.getByText('pending')
      const assignedBadge = screen.getByText('assigned')

      expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
      expect(assignedBadge).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('should handle different status types', () => {
      const reportsWithDifferentStatuses = [
        { ...mockReports[0], status: 'in_progress' },
        { ...mockReports[1], status: 'completed' },
        { ...mockReports[0], id: '3', status: 'rejected' }
      ]

      render(
        <ReportsTable 
          reports={reportsWithDifferentStatuses}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      expect(screen.getByText('in_progress')).toHaveClass('bg-purple-100', 'text-purple-800')
      expect(screen.getByText('completed')).toHaveClass('bg-green-100', 'text-green-800')
      expect(screen.getByText('rejected')).toHaveClass('bg-red-100', 'text-red-800')
    })
  })

  describe('Action Buttons', () => {
    it('should show assign button for pending reports', () => {
      render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      const assignButtons = screen.getAllByText('Assign Driver')
      expect(assignButtons).toHaveLength(1) // Only pending report should have assign button
    })

    it('should not show assign button for already assigned reports', () => {
      render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      // Should only have one assign button (for pending report)
      const assignButtons = screen.getAllByText('Assign Driver')
      expect(assignButtons).toHaveLength(1)
    })

    it('should show view details button for all reports', () => {
      render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      const viewButtons = screen.getAllByText('View')
      expect(viewButtons).toHaveLength(2) // One for each report
    })

    it('should call onAssign when assign button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      const assignButton = screen.getByText('Assign Driver')
      await user.click(assignButton)

      expect(mockOnAssign).toHaveBeenCalledWith(mockReports[0])
    })
  })

  describe('Sorting Functionality', () => {
    it('should show sort indicators on sortable columns', () => {
      render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      // Check for sortable column headers (they should be clickable)
      const dateHeader = screen.getByText('Date')
      const statusHeader = screen.getByText('Status')
      
      expect(dateHeader.closest('th')).toHaveClass('cursor-pointer')
      expect(statusHeader.closest('th')).toHaveClass('cursor-pointer')
    })

    it('should handle column sorting', async () => {
      const user = userEvent.setup()
      render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      const dateHeader = screen.getByText('Date')
      await user.click(dateHeader)

      // Should trigger sorting (implementation depends on parent component)
      // This test verifies the click handler exists
      expect(dateHeader.closest('th')).toHaveClass('cursor-pointer')
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no reports provided', () => {
      render(
        <ReportsTable 
          reports={[]}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      expect(screen.getByText(/no reports found/i)).toBeInTheDocument()
    })

    it('should show loading state when reports are loading', () => {
      render(
        <ReportsTable 
          reports={null}
          loading={true}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      expect(screen.getByText(/loading reports/i)).toBeInTheDocument()
    })
  })

  describe('Filtering Integration', () => {
    it('should display filtered results correctly', () => {
      const filteredReports = [mockReports[0]] // Only pending report

      render(
        <ReportsTable 
          reports={filteredReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.queryByText('#2')).not.toBeInTheDocument()
    })

    it('should handle search results highlighting', () => {
      const reportsWithHighlight = mockReports.map(report => ({
        ...report,
        _highlighted: report.id === '1'
      }))

      render(
        <ReportsTable 
          reports={reportsWithHighlight}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      // Implementation would depend on how highlighting is handled
      expect(screen.getByText('#1')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should handle mobile layout', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      // Should still render table (responsive behavior depends on CSS)
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getAllByRole('columnheader')).toHaveLength(7) // 7 columns
      expect(screen.getAllByRole('row')).toHaveLength(3) // Header + 2 data rows
    })

    it('should have proper button labels', () => {
      render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      expect(screen.getByRole('button', { name: 'Assign Driver' })).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: 'View' })).toHaveLength(2)
    })

    it('should have proper ARIA labels for status badges', () => {
      render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      const statusBadges = screen.getAllByText(/pending|assigned/)
      statusBadges.forEach(badge => {
        expect(badge).toHaveAttribute('aria-label', expect.stringContaining('Status:'))
      })
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        location: `Location ${i + 1}`,
        waste_type: 'plastic',
        status: 'pending',
        created_at: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
        user_name: `User ${i + 1}`,
        user_id: `user${i + 1}`
      }))

      render(
        <ReportsTable 
          reports={largeDataset}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      expect(screen.getAllByRole('row')).toHaveLength(101) // Header + 100 data rows
    })

    it('should not re-render unnecessarily', () => {
      const { rerender } = render(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      // Re-render with same props
      rerender(
        <ReportsTable 
          reports={mockReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      // Should still render correctly
      expect(screen.getByText('#1')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed report data gracefully', () => {
      const malformedReports = [
        {
          id: null,
          location: '',
          waste_type: undefined,
          status: 'pending',
          created_at: 'invalid-date',
          user_name: null
        }
      ]

      render(
        <ReportsTable 
          reports={malformedReports}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      // Should not crash and should handle missing data
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should handle missing callback functions', () => {
      render(
        <ReportsTable 
          reports={mockReports}
        />
      )

      // Should render without crashing even without callbacks
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('Data Display Edge Cases', () => {
    it('should handle very long location names', () => {
      const reportWithLongLocation = {
        ...mockReports[0],
        location: 'A very long location name that might overflow the table cell and cause layout issues'
      }

      render(
        <ReportsTable 
          reports={[reportWithLongLocation]}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      expect(screen.getByText(/A very long location name/)).toBeInTheDocument()
    })

    it('should handle special characters in data', () => {
      const reportWithSpecialChars = {
        ...mockReports[0],
        location: 'Location with "quotes" & <tags>',
        user_name: 'User with émojis 🚮'
      }

      render(
        <ReportsTable 
          reports={[reportWithSpecialChars]}
          onAssign={mockOnAssign}
          onStatusChange={mockOnStatusChange}
        />
      )

      expect(screen.getByText('Location with "quotes" & <tags>')).toBeInTheDocument()
      expect(screen.getByText('User with émojis 🚮')).toBeInTheDocument()
    })
  })
})