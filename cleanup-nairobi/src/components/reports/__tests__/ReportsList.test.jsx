import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportsList from '../ReportsList'
import { reportsAPI } from '../../../services/api'

// Mock the API
vi.mock('../../../services/api', () => ({
  reportsAPI: {
    getUserReports: vi.fn(),
  },
}))

// Mock ReportCard component
vi.mock('../ReportCard', () => ({
  default: ({ report, onClick }) => (
    <div data-testid={`report-card-${report.id}`} onClick={() => onClick(report)}>
      <span>{report.location}</span>
      <span>{report.status}</span>
      <span>{report.waste_type}</span>
    </div>
  ),
}))

describe('ReportsList', () => {
  const mockReports = [
    {
      id: '1',
      location: 'Location 1',
      description: 'Description 1',
      waste_type: 'plastic',
      status: 'pending',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: '2',
      location: 'Location 2',
      description: 'Description 2',
      waste_type: 'organic',
      status: 'assigned',
      created_at: '2024-01-02T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z'
    },
    {
      id: '3',
      location: 'Location 3',
      description: 'Description 3',
      waste_type: 'metal',
      status: 'completed',
      created_at: '2024-01-03T10:00:00Z',
      updated_at: '2024-01-03T10:00:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    reportsAPI.getUserReports.mockResolvedValue({ data: mockReports })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the component title', async () => {
      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getByText('My Reports')).toBeInTheDocument()
      })
    })

    it('should render filters button', async () => {
      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
      })
    })

    it('should show reports count', async () => {
      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getByText('3 of 3 reports')).toBeInTheDocument()
      })
    })
  })

  describe('Data Loading', () => {
    it('should show loading state initially', () => {
      reportsAPI.getUserReports.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<ReportsList />)

      expect(screen.getByText(/loading your reports/i)).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('should fetch reports on mount', async () => {
      render(<ReportsList />)

      expect(reportsAPI.getUserReports).toHaveBeenCalledTimes(1)

      await waitFor(() => {
        expect(screen.getByText('My Reports')).toBeInTheDocument()
      })
    })

    it('should refetch reports when refreshTrigger changes', async () => {
      const { rerender } = render(<ReportsList refreshTrigger={1} />)

      expect(reportsAPI.getUserReports).toHaveBeenCalledTimes(1)

      rerender(<ReportsList refreshTrigger={2} />)

      expect(reportsAPI.getUserReports).toHaveBeenCalledTimes(2)
    })

    it('should display reports after successful fetch', async () => {
      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getByTestId('report-card-1')).toBeInTheDocument()
        expect(screen.getByTestId('report-card-2')).toBeInTheDocument()
        expect(screen.getByTestId('report-card-3')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error state when API call fails', async () => {
      const errorMessage = 'Failed to load reports'
      reportsAPI.getUserReports.mockRejectedValue(new Error(errorMessage))

      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })

    it('should retry loading when retry button is clicked', async () => {
      const user = userEvent.setup()
      reportsAPI.getUserReports
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: mockReports })

      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton)

      expect(reportsAPI.getUserReports).toHaveBeenCalledTimes(2)

      await waitFor(() => {
        expect(screen.getByText('My Reports')).toBeInTheDocument()
      })
    })
  })

  describe('Filtering and Sorting', () => {
    it('should show filters panel when filters button is clicked', async () => {
      const user = userEvent.setup()
      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
      })

      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)

      expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/waste type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument()
    })

    it('should filter reports by status', async () => {
      const user = userEvent.setup()
      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getAllByTestId(/report-card-/)).toHaveLength(3)
      })

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)

      // Filter by pending status
      const statusSelect = screen.getByLabelText(/status/i)
      await user.selectOptions(statusSelect, 'pending')

      await waitFor(() => {
        expect(screen.getByTestId('report-card-1')).toBeInTheDocument()
        expect(screen.queryByTestId('report-card-2')).not.toBeInTheDocument()
        expect(screen.queryByTestId('report-card-3')).not.toBeInTheDocument()
      })

      expect(screen.getByText('1 of 3 reports')).toBeInTheDocument()
    })

    it('should filter reports by waste type', async () => {
      const user = userEvent.setup()
      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getAllByTestId(/report-card-/)).toHaveLength(3)
      })

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)

      // Filter by organic waste type
      const wasteTypeSelect = screen.getByLabelText(/waste type/i)
      await user.selectOptions(wasteTypeSelect, 'organic')

      await waitFor(() => {
        expect(screen.queryByTestId('report-card-1')).not.toBeInTheDocument()
        expect(screen.getByTestId('report-card-2')).toBeInTheDocument()
        expect(screen.queryByTestId('report-card-3')).not.toBeInTheDocument()
      })

      expect(screen.getByText('1 of 3 reports')).toBeInTheDocument()
    })

    it('should sort reports by date', async () => {
      const user = userEvent.setup()
      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getAllByTestId(/report-card-/)).toHaveLength(3)
      })

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)

      // Sort by oldest first
      const sortSelect = screen.getByLabelText(/sort by/i)
      await user.selectOptions(sortSelect, 'oldest')

      // The order should change (oldest first means report-1 should be first)
      await waitFor(() => {
        const reportCards = screen.getAllByTestId(/report-card-/)
        expect(reportCards[0]).toHaveAttribute('data-testid', 'report-card-1')
      })
    })

    it('should combine multiple filters', async () => {
      const user = userEvent.setup()
      
      // Add more test data with mixed statuses and types
      const extendedReports = [
        ...mockReports,
        {
          id: '4',
          location: 'Location 4',
          waste_type: 'plastic',
          status: 'assigned',
          created_at: '2024-01-04T10:00:00Z'
        }
      ]
      
      reportsAPI.getUserReports.mockResolvedValue({ data: extendedReports })
      
      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getAllByTestId(/report-card-/)).toHaveLength(4)
      })

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)

      // Filter by assigned status AND plastic waste type
      const statusSelect = screen.getByLabelText(/status/i)
      await user.selectOptions(statusSelect, 'assigned')

      const wasteTypeSelect = screen.getByLabelText(/waste type/i)
      await user.selectOptions(wasteTypeSelect, 'plastic')

      await waitFor(() => {
        // Should only show report-4 (assigned + plastic)
        expect(screen.getByTestId('report-card-4')).toBeInTheDocument()
        expect(screen.queryByTestId('report-card-1')).not.toBeInTheDocument()
        expect(screen.queryByTestId('report-card-2')).not.toBeInTheDocument()
        expect(screen.queryByTestId('report-card-3')).not.toBeInTheDocument()
      })

      expect(screen.getByText('1 of 4 reports')).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no reports exist', async () => {
      reportsAPI.getUserReports.mockResolvedValue({ data: [] })

      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getByText(/no reports yet/i)).toBeInTheDocument()
        expect(screen.getByText(/start by creating your first waste report/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /create your first report/i })).toBeInTheDocument()
      })
    })

    it('should show filtered empty state when filters return no results', async () => {
      const user = userEvent.setup()
      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getAllByTestId(/report-card-/)).toHaveLength(3)
      })

      // Open filters and select a combination that returns no results
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)

      const statusSelect = screen.getByLabelText(/status/i)
      await user.selectOptions(statusSelect, 'completed')

      const wasteTypeSelect = screen.getByLabelText(/waste type/i)
      await user.selectOptions(wasteTypeSelect, 'plastic')

      await waitFor(() => {
        expect(screen.getByText(/no reports match your filters/i)).toBeInTheDocument()
        expect(screen.getByText(/try adjusting your filters/i)).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /create your first report/i })).not.toBeInTheDocument()
      })

      expect(screen.getByText('0 of 3 reports')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should handle report card clicks', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getByTestId('report-card-1')).toBeInTheDocument()
      })

      const reportCard = screen.getByTestId('report-card-1')
      fireEvent.click(reportCard)

      expect(consoleSpy).toHaveBeenCalledWith('Report clicked:', mockReports[0])
      
      consoleSpy.mockRestore()
    })

    it('should toggle filters panel visibility', async () => {
      const user = userEvent.setup()
      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
      })

      const filtersButton = screen.getByRole('button', { name: /filters/i })

      // Initially filters should not be visible
      expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument()

      // Click to show filters
      await user.click(filtersButton)
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument()

      // Click again to hide filters
      await user.click(filtersButton)
      expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for form controls', async () => {
      const user = userEvent.setup()
      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
      })

      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)

      expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/waste type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument()
    })

    it('should have proper button roles and labels', async () => {
      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily when props do not change', async () => {
      const { rerender } = render(<ReportsList refreshTrigger={1} />)

      await waitFor(() => {
        expect(reportsAPI.getUserReports).toHaveBeenCalledTimes(1)
      })

      // Re-render with same props
      rerender(<ReportsList refreshTrigger={1} />)

      // Should not fetch again
      expect(reportsAPI.getUserReports).toHaveBeenCalledTimes(1)
    })

    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        location: `Location ${i + 1}`,
        waste_type: 'plastic',
        status: 'pending',
        created_at: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`
      }))

      reportsAPI.getUserReports.mockResolvedValue({ data: largeDataset })

      render(<ReportsList />)

      await waitFor(() => {
        expect(screen.getByText('100 of 100 reports')).toBeInTheDocument()
        expect(screen.getAllByTestId(/report-card-/)).toHaveLength(100)
      })
    })
  })
})