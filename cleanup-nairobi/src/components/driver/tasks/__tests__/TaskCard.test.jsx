import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskCard from '../TaskCard'

// Mock TaskActions component
vi.mock('../TaskActions', () => ({
  default: ({ task, onTaskUpdate, onError }) => (
    <div data-testid="task-actions">
      <button onClick={() => onTaskUpdate && onTaskUpdate(task)}>Mock Action</button>
    </div>
  ),
}))

describe('TaskCard', () => {
  const mockTask = {
    id: 'task-123',
    report_id: 'report-456',
    status: 'pending',
    assigned_at: '2024-01-15T10:30:00Z',
    priority: 'medium',
    report_details: {
      location: 'Uhuru Park, Nairobi',
      description: 'Large pile of plastic waste near the main entrance',
      waste_type: 'plastic',
      user_name: 'John Doe',
      image_url: 'https://example.com/image.jpg'
    }
  }

  const mockOnTaskUpdate = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render task information correctly', () => {
      render(
        <TaskCard
          task={mockTask}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      expect(screen.getByText('Uhuru Park, Nairobi')).toBeInTheDocument()
      expect(screen.getByText(/Large pile of plastic waste/)).toBeInTheDocument()
      expect(screen.getByText('plastic')).toBeInTheDocument()
    })

    it('should display status badge', () => {
      render(
        <TaskCard
          task={mockTask}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('should display priority badge', () => {
      render(
        <TaskCard
          task={mockTask}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      expect(screen.getByText('Medium')).toBeInTheDocument()
    })

    it('should show waste type icon and text', () => {
      render(
        <TaskCard
          task={mockTask}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      // Should show plastic waste type
      expect(screen.getByText('plastic')).toBeInTheDocument()
      // Should show the recycling emoji for plastic
      expect(screen.getByText('♻️')).toBeInTheDocument()
    })

    it('should show task actions component', () => {
      render(
        <TaskCard
          task={mockTask}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      expect(screen.getByTestId('task-actions')).toBeInTheDocument()
    })
  })

  describe('Status Display', () => {
    it('should display pending status', () => {
      const pendingTask = { ...mockTask, status: 'pending' }
      render(
        <TaskCard
          task={pendingTask}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('should display accepted status', () => {
      const acceptedTask = { ...mockTask, status: 'accepted' }
      render(
        <TaskCard
          task={acceptedTask}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      expect(screen.getByText('Accepted')).toBeInTheDocument()
    })

    it('should display in_progress status', () => {
      const inProgressTask = { ...mockTask, status: 'in_progress' }
      render(
        <TaskCard
          task={inProgressTask}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      expect(screen.getByText('In Progress')).toBeInTheDocument()
    })

    it('should display completed status', () => {
      const completedTask = { ...mockTask, status: 'completed' }
      render(
        <TaskCard
          task={completedTask}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      expect(screen.getByText('Completed')).toBeInTheDocument()
    })
  })

  describe('Priority Display', () => {
    it('should display priority badge', () => {
      const highPriorityTask = { ...mockTask, priority: 'high' }
      render(
        <TaskCard
          task={highPriorityTask}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      expect(screen.getByText('High')).toBeInTheDocument()
    })

    it('should handle different priority levels', () => {
      const priorities = [
        { priority: 'low', expectedText: 'Low' },
        { priority: 'medium', expectedText: 'Medium' },
        { priority: 'high', expectedText: 'High' },
        { priority: 'urgent', expectedText: 'Urgent' }
      ]

      priorities.forEach(({ priority, expectedText }) => {
        const taskWithPriority = { ...mockTask, priority }
        const { unmount } = render(
          <TaskCard
            task={taskWithPriority}
            onTaskUpdate={mockOnTaskUpdate}
            onError={mockOnError}
          />
        )

        expect(screen.getByText(expectedText)).toBeInTheDocument()
        
        unmount()
      })
    })
  })

  describe('User Interactions', () => {
    it('should show expand/collapse button', () => {
      render(
        <TaskCard
          task={mockTask}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      // Should have expand button (ChevronDown icon)
      const expandButton = screen.getByRole('button')
      expect(expandButton).toBeInTheDocument()
    })

    it('should expand details when expand button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TaskCard
          task={mockTask}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      // Find and click the expand button (last button in the card)
      const buttons = screen.getAllByRole('button')
      const expandButton = buttons[buttons.length - 1] // Last button should be expand
      await user.click(expandButton)

      // Should show expanded details
      expect(screen.getByText('Report Details')).toBeInTheDocument()
      expect(screen.getByText('Assignment Details')).toBeInTheDocument()
    })

    it('should show navigation button when coordinates are available', () => {
      const taskWithCoords = {
        ...mockTask,
        report_details: {
          ...mockTask.report_details,
          latitude: -1.2921,
          longitude: 36.8219
        }
      }

      render(
        <TaskCard
          task={taskWithCoords}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      // Should have navigation button
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(1) // Should have more than just the expand button
    })
  })

  describe('Waste Type Display', () => {
    it('should show correct icon for different waste types', () => {
      const wasteTypes = [
        { type: 'plastic', icon: '♻️' },
        { type: 'organic', icon: '🍃' },
        { type: 'metal', icon: '🔩' },
        { type: 'glass', icon: '🥃' },
        { type: 'paper', icon: '📄' }
      ]

      wasteTypes.forEach(({ type, icon }) => {
        const taskWithWasteType = {
          ...mockTask,
          report_details: { ...mockTask.report_details, waste_type: type }
        }
        
        const { unmount } = render(
          <TaskCard
            task={taskWithWasteType}
            onTaskUpdate={mockOnTaskUpdate}
            onError={mockOnError}
          />
        )

        expect(screen.getByText(icon)).toBeInTheDocument()
        expect(screen.getByText(type)).toBeInTheDocument()
        
        unmount()
      })
    })
  })

  describe('Expanded Details', () => {
    it('should show expanded details when clicked', async () => {
      const user = userEvent.setup()
      render(
        <TaskCard
          task={mockTask}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      // Click expand button
      const buttons = screen.getAllByRole('button')
      const expandButton = buttons[buttons.length - 1]
      await user.click(expandButton)

      // Should show report details
      expect(screen.getByText('Report Details')).toBeInTheDocument()
      expect(screen.getByText('Assignment Details')).toBeInTheDocument()
      expect(screen.getByText('Report ID:')).toBeInTheDocument()
      expect(screen.getByText('Assignment ID:')).toBeInTheDocument()
    })

    it('should show image in expanded view when available', async () => {
      const user = userEvent.setup()
      render(
        <TaskCard
          task={mockTask}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      // Expand the card
      const buttons = screen.getAllByRole('button')
      const expandButton = buttons[buttons.length - 1]
      await user.click(expandButton)

      // Should show the image
      const image = screen.getByAltText('Waste report')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing report details gracefully', () => {
      const taskWithoutDetails = {
        ...mockTask,
        report_details: null
      }

      render(
        <TaskCard
          task={taskWithoutDetails}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      // Should show default values
      expect(screen.getByText('Unknown Location')).toBeInTheDocument()
      expect(screen.getByText('No description provided')).toBeInTheDocument()
    })

    it('should handle missing callback functions', () => {
      render(
        <TaskCard task={mockTask} />
      )

      // Should render without crashing
      expect(screen.getByText('Uhuru Park, Nairobi')).toBeInTheDocument()
    })

    it('should handle missing priority gracefully', () => {
      const taskWithoutPriority = {
        ...mockTask,
        priority: undefined
      }

      render(
        <TaskCard
          task={taskWithoutPriority}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      // Should show default priority
      expect(screen.getByText('Medium')).toBeInTheDocument()
    })

    it('should show urgent priority indicator', () => {
      const urgentTask = { ...mockTask, priority: 'urgent' }
      render(
        <TaskCard
          task={urgentTask}
          onTaskUpdate={mockOnTaskUpdate}
          onError={mockOnError}
        />
      )

      expect(screen.getByText('Urgent')).toBeInTheDocument()
      // Should have red priority bar at top
      const priorityBar = screen.container.querySelector('.h-1.bg-red-500')
      expect(priorityBar).toBeInTheDocument()
    })
  })
})