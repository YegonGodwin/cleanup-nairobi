import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import DashboardLayout from '../DashboardLayout';
import { AuthProvider } from '../../context/AuthContext';

// Mock the child components
vi.mock('../Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>
}));

vi.mock('../Topbar', () => ({
  default: ({ onMenuClick }) => (
    <div data-testid="topbar">
      <button onClick={onMenuClick} data-testid="menu-button">
        Menu
      </button>
    </div>
  )
}));

// Mock dashboard page content
const MockDashboardContent = () => (
  <div data-testid="dashboard-content">Dashboard Content</div>
);

const MockReportsContent = () => (
  <div data-testid="reports-content">Reports Content</div>
);

// Mock auth utilities
vi.mock('../../utils/auth', () => ({
  getToken: vi.fn(() => 'mock-token'),
  setToken: vi.fn(),
  removeToken: vi.fn(),
  getUserFromToken: vi.fn(() => ({ fullName: 'Test User', email: 'test@example.com' }))
}));

// Mock API
vi.mock('../../services/api', () => ({
  authAPI: {
    getProfile: vi.fn(() => Promise.resolve({ data: { fullName: 'Test User', email: 'test@example.com' } })),
    login: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn()
  }
}));

const renderWithRouter = (initialEntries = ['/dashboard']) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<MockDashboardContent />} />
            <Route path="reports" element={<MockReportsContent />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('DashboardLayout Functionality Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sidebar Toggle Functionality', () => {
    test('should toggle sidebar visibility on mobile when menu button is clicked', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithRouter();

      const menuButton = screen.getByTestId('menu-button');
      const sidebar = screen.getByTestId('sidebar');

      // Initially sidebar should be hidden on mobile (transform: translateX(-100%))
      const sidebarContainer = sidebar.closest('div');
      expect(sidebarContainer).toHaveClass('-translate-x-full');

      // Click menu button to open sidebar
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(sidebarContainer).toHaveClass('translate-x-0');
        expect(sidebarContainer).not.toHaveClass('-translate-x-full');
      });

      // Click menu button again to close sidebar
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(sidebarContainer).toHaveClass('-translate-x-full');
        expect(sidebarContainer).not.toHaveClass('translate-x-0');
      });
    });

    test('should close sidebar when overlay is clicked on mobile', async () => {
      renderWithRouter();

      const menuButton = screen.getByTestId('menu-button');
      
      // Open sidebar first
      fireEvent.click(menuButton);

      await waitFor(() => {
        const overlay = document.querySelector('.bg-black.bg-opacity-50');
        expect(overlay).toBeInTheDocument();
      });

      // Click overlay to close sidebar
      const overlay = document.querySelector('.bg-black.bg-opacity-50');
      fireEvent.click(overlay);

      await waitFor(() => {
        const sidebar = screen.getByTestId('sidebar');
        const sidebarContainer = sidebar.closest('div');
        expect(sidebarContainer).toHaveClass('-translate-x-full');
      });
    });

    test('should maintain sidebar visibility on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      renderWithRouter();

      const sidebar = screen.getByTestId('sidebar');
      const sidebarContainer = sidebar.closest('div');

      // On desktop, sidebar should always be visible (lg:translate-x-0)
      expect(sidebarContainer).toHaveClass('lg:translate-x-0');
      expect(sidebarContainer).toHaveClass('lg:static');
    });
  });

  describe('Topbar Sticky Behavior', () => {
    test('should have sticky positioning classes applied to topbar', () => {
      renderWithRouter();

      const topbar = screen.getByTestId('topbar');
      const topbarContainer = topbar.closest('header');

      expect(topbarContainer).toHaveClass('sticky');
      expect(topbarContainer).toHaveClass('top-0');
      expect(topbarContainer).toHaveClass('z-40');
    });

    test('should maintain topbar position during scroll simulation', () => {
      renderWithRouter();

      const topbar = screen.getByTestId('topbar');
      const topbarContainer = topbar.closest('header');

      // Simulate scroll
      fireEvent.scroll(window, { target: { scrollY: 100 } });

      // Topbar should still maintain sticky classes
      expect(topbarContainer).toHaveClass('sticky');
      expect(topbarContainer).toHaveClass('top-0');
    });
  });

  describe('Dashboard Components Styling Consistency', () => {
    test('should maintain proper layout structure and classes', () => {
      renderWithRouter();

      // Check main container structure
      const mainContainer = document.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('bg-gradient-to-br');
      expect(mainContainer).toHaveClass('from-gray-50');

      // Check sidebar offset for main content
      const contentArea = document.querySelector('.lg\\:pl-64');
      expect(contentArea).toBeInTheDocument();

      // Check main content area
      const mainContent = document.querySelector('main');
      expect(mainContent).toHaveClass('flex-1');
      expect(mainContent).toHaveClass('bg-gradient-to-b');
      expect(mainContent).toHaveClass('from-gray-50');
      expect(mainContent).toHaveClass('to-white');
    });

    test('should apply proper spacing and padding to content area', () => {
      renderWithRouter();

      const mainContent = document.querySelector('main');
      expect(mainContent).toHaveClass('px-4');
      expect(mainContent).toHaveClass('sm:px-6');
      expect(mainContent).toHaveClass('pt-4');
      expect(mainContent).toHaveClass('pb-6');

      const contentWrapper = document.querySelector('.max-w-7xl');
      expect(contentWrapper).toHaveClass('mx-auto');
      expect(contentWrapper).toHaveClass('animate-fadeIn');
    });

    test('should render dashboard content properly', () => {
      renderWithRouter();

      const dashboardContent = screen.getByTestId('dashboard-content');
      expect(dashboardContent).toBeInTheDocument();
      expect(dashboardContent).toBeVisible();
    });
  });

  describe('Navigation Between Dashboard Sections', () => {
    test('should render different content when navigating to reports section', async () => {
      const { rerender } = renderWithRouter(['/dashboard/reports']);

      // Should show reports content
      const reportsContent = screen.getByTestId('reports-content');
      expect(reportsContent).toBeInTheDocument();
      expect(reportsContent).toBeVisible();
    });

    test('should maintain layout structure when navigating between sections', () => {
      renderWithRouter(['/dashboard/reports']);

      // Layout structure should remain consistent
      const sidebar = screen.getByTestId('sidebar');
      const topbar = screen.getByTestId('topbar');
      const mainContent = document.querySelector('main');

      expect(sidebar).toBeInTheDocument();
      expect(topbar).toBeInTheDocument();
      expect(mainContent).toBeInTheDocument();

      // Classes should be preserved
      expect(mainContent).toHaveClass('flex-1');
      expect(document.querySelector('.lg\\:pl-64')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    test('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithRouter();

      const sidebar = screen.getByTestId('sidebar');
      const sidebarContainer = sidebar.closest('div');

      // Mobile-specific classes
      expect(sidebarContainer).toHaveClass('fixed');
      expect(sidebarContainer).toHaveClass('-translate-x-full');
      expect(sidebarContainer).toHaveClass('lg:translate-x-0');
    });

    test('should adapt layout for tablet screens', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      renderWithRouter();

      const mainContent = document.querySelector('main');
      expect(mainContent).toHaveClass('px-4');
      expect(mainContent).toHaveClass('sm:px-6');
    });

    test('should adapt layout for desktop screens', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      renderWithRouter();

      const sidebar = screen.getByTestId('sidebar');
      const sidebarContainer = sidebar.closest('div');

      // Desktop-specific classes
      expect(sidebarContainer).toHaveClass('lg:static');
      expect(sidebarContainer).toHaveClass('lg:translate-x-0');
    });
  });

  describe('Animation and Transition Classes', () => {
    test('should have proper transition classes for sidebar', () => {
      renderWithRouter();

      const sidebar = screen.getByTestId('sidebar');
      const sidebarContainer = sidebar.closest('div');

      expect(sidebarContainer).toHaveClass('transition-transform');
      expect(sidebarContainer).toHaveClass('duration-300');
      expect(sidebarContainer).toHaveClass('ease-in-out');
    });

    test('should have fadeIn animation for content', () => {
      renderWithRouter();

      const contentWrapper = document.querySelector('.animate-fadeIn');
      expect(contentWrapper).toBeInTheDocument();
    });

    test('should have overlay transition classes', async () => {
      renderWithRouter();

      const menuButton = screen.getByTestId('menu-button');
      fireEvent.click(menuButton);

      await waitFor(() => {
        const overlay = document.querySelector('.transition-opacity');
        expect(overlay).toBeInTheDocument();
      });
    });
  });
});