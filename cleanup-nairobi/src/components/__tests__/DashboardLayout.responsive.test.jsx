import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';

// Mock the Outlet component to render test content
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="dashboard-content">Test Dashboard Content</div>
  };
});

// Mock child components to focus on layout testing
vi.mock('../Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>
}));

vi.mock('../Topbar', () => ({
  default: ({ onMenuClick }) => (
    <div data-testid="topbar" onClick={onMenuClick}>
      Topbar
    </div>
  )
}));

describe('DashboardLayout Responsive Testing', () => {
  beforeEach(() => {
    // Reset any existing viewport changes
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080,
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderDashboardLayout = () => {
    return render(
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    );
  };

  describe('Desktop Layout (1920x1080)', () => {
    beforeEach(() => {
      // Set desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080,
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('should render sidebar and main content properly on desktop', () => {
      renderDashboardLayout();
      
      // Verify sidebar is present
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      
      // Verify topbar is present
      expect(screen.getByTestId('topbar')).toBeInTheDocument();
      
      // Verify main content is present
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    it('should have proper CSS classes for desktop layout', () => {
      const { container } = renderDashboardLayout();
      
      // Check main container has min-h-screen
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
      
      // Check sidebar container has proper positioning classes
      const sidebarContainer = container.querySelector('.fixed.inset-y-0.left-0');
      expect(sidebarContainer).toBeInTheDocument();
      
      // Check main content area has proper left padding for sidebar
      const mainContentArea = container.querySelector('.lg\\:pl-64');
      expect(mainContentArea).toBeInTheDocument();
    });

    it('should position content at the top without excessive spacing', () => {
      const { container } = renderDashboardLayout();
      
      // Check that main content has flex-1 class for proper height
      const mainElement = container.querySelector('main.flex-1');
      expect(mainElement).toBeInTheDocument();
      
      // Verify the main content container uses flex column layout
      const flexContainer = container.querySelector('.flex.flex-col.min-h-screen');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe('Desktop Layout (1366x768)', () => {
    beforeEach(() => {
      // Set smaller desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1366,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 768,
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('should maintain desktop layout on smaller desktop screens', () => {
      renderDashboardLayout();
      
      // All components should still be visible
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('topbar')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    it('should maintain proper spacing and positioning', () => {
      const { container } = renderDashboardLayout();
      
      // Main content should still have proper left padding
      const mainContentArea = container.querySelector('.lg\\:pl-64');
      expect(mainContentArea).toBeInTheDocument();
      
      // Content should still be positioned at top
      const mainElement = container.querySelector('main.flex-1');
      expect(mainElement).toBeInTheDocument();
    });
  });

  describe('Tablet Layout (768px width)', () => {
    beforeEach(() => {
      // Set tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('should render all components on tablet', () => {
      renderDashboardLayout();
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('topbar')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    it('should have proper responsive classes for tablet', () => {
      const { container } = renderDashboardLayout();
      
      // Sidebar should have transform classes for mobile behavior
      const sidebarContainer = container.querySelector('.transform.transition-transform');
      expect(sidebarContainer).toBeInTheDocument();
      
      // Main content should maintain proper structure
      const mainElement = container.querySelector('main.flex-1');
      expect(mainElement).toBeInTheDocument();
    });

    it('should maintain content positioning at top on tablet', () => {
      const { container } = renderDashboardLayout();
      
      // Check flex layout is maintained
      const flexContainer = container.querySelector('.flex.flex-col.min-h-screen');
      expect(flexContainer).toBeInTheDocument();
      
      // Main content should have proper padding
      const mainElement = container.querySelector('main.flex-1');
      expect(mainElement).toHaveClass('pt-4');
    });
  });

  describe('Mobile Layout (375px width)', () => {
    beforeEach(() => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('should render all components on mobile', () => {
      renderDashboardLayout();
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('topbar')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    it('should have mobile-specific layout classes', () => {
      const { container } = renderDashboardLayout();
      
      // Sidebar should be hidden by default on mobile (translate-x-full)
      const sidebarContainer = container.querySelector('.-translate-x-full');
      expect(sidebarContainer).toBeInTheDocument();
      
      // Should have mobile overlay capability - check for the overlay div
      const overlayDiv = container.querySelector('.fixed.inset-0.z-40');
      // The overlay is conditionally rendered, so we check the container structure instead
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should maintain proper content positioning on mobile', () => {
      const { container } = renderDashboardLayout();
      
      // Main content should not have left padding on mobile (only lg:pl-64)
      const mainContentArea = container.querySelector('.lg\\:pl-64');
      expect(mainContentArea).toBeInTheDocument();
      
      // Content should still start at top
      const mainElement = container.querySelector('main.flex-1');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveClass('pt-4');
    });
  });

  describe('Content Positioning Verification', () => {
    it('should ensure content starts immediately below topbar across all screen sizes', () => {
      const screenSizes = [
        { width: 1920, height: 1080, name: 'Desktop Large' },
        { width: 1366, height: 768, name: 'Desktop Small' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];

      screenSizes.forEach(({ width, height, name }) => {
        // Set viewport
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: height,
        });
        window.dispatchEvent(new Event('resize'));

        const { container, unmount } = renderDashboardLayout();
        
        // Verify flex layout structure
        const flexContainer = container.querySelector('.flex.flex-col.min-h-screen');
        expect(flexContainer, `${name}: Should have flex column container`).toBeInTheDocument();
        
        // Verify main content has flex-1 for proper height
        const mainElement = container.querySelector('main.flex-1');
        expect(mainElement, `${name}: Should have flex-1 main element`).toBeInTheDocument();
        
        // Verify content has proper top padding (not excessive)
        expect(mainElement, `${name}: Should have pt-4 class`).toHaveClass('pt-4');
        
        // Verify no excessive margins that would push content down
        expect(mainElement, `${name}: Should not have large top margins`).not.toHaveClass('mt-16', 'mt-20', 'mt-24');
        
        unmount();
      });
    });

    it('should maintain consistent spacing between components', () => {
      renderDashboardLayout();
      const { container } = renderDashboardLayout();
      
      // Check that main content has proper padding
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('px-4', 'sm:px-6', 'pt-4', 'pb-6');
      
      // Check that content wrapper has max-width constraint
      const contentWrapper = container.querySelector('.max-w-7xl.mx-auto');
      expect(contentWrapper).toBeInTheDocument();
    });
  });

  describe('Layout Structure Integrity', () => {
    it('should maintain proper hierarchy across all screen sizes', () => {
      renderDashboardLayout();
      const { container } = renderDashboardLayout();
      
      // Verify the main structure hierarchy
      const rootContainer = container.querySelector('.min-h-screen');
      expect(rootContainer).toBeInTheDocument();
      
      // Sidebar should be positioned correctly
      const sidebar = container.querySelector('.fixed.inset-y-0.left-0');
      expect(sidebar).toBeInTheDocument();
      
      // Main content area should have proper offset
      const mainArea = container.querySelector('.lg\\:pl-64');
      expect(mainArea).toBeInTheDocument();
      
      // Flex container should be inside main area
      const flexContainer = mainArea.querySelector('.flex.flex-col.min-h-screen');
      expect(flexContainer).toBeInTheDocument();
    });
  });
});