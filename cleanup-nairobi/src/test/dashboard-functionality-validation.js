/**
 * Dashboard Layout Functionality Validation Script
 * 
 * This script validates all the functionality requirements for task 5:
 * - Sidebar toggle functionality remains intact
 * - Topbar sticky behavior works correctly
 * - All dashboard components maintain proper styling
 * - Navigation between dashboard sections works as expected
 */

// Validation Results
const validationResults = {
  sidebarToggle: {
    status: 'PENDING',
    tests: [],
    issues: []
  },
  topbarSticky: {
    status: 'PENDING',
    tests: [],
    issues: []
  },
  componentStyling: {
    status: 'PENDING',
    tests: [],
    issues: []
  },
  navigation: {
    status: 'PENDING',
    tests: [],
    issues: []
  }
};

// Helper function to log results
function logResult(category, test, status, details = '') {
  validationResults[category].tests.push({
    test,
    status,
    details,
    timestamp: new Date().toISOString()
  });
  
  if (status === 'FAIL') {
    validationResults[category].issues.push(`${test}: ${details}`);
  }
  
  console.log(`[${category.toUpperCase()}] ${test}: ${status}${details ? ` - ${details}` : ''}`);
}

// Validation Functions
function validateSidebarToggle() {
  console.log('\n=== SIDEBAR TOGGLE FUNCTIONALITY VALIDATION ===');
  
  try {
    // Check if DashboardLayout component exists and has proper structure
    const dashboardLayoutExists = document.querySelector('.min-h-screen');
    logResult('sidebarToggle', 'Dashboard layout container exists', 
      dashboardLayoutExists ? 'PASS' : 'FAIL', 
      dashboardLayoutExists ? 'Found min-h-screen container' : 'Container not found');

    // Check sidebar container structure
    const sidebarContainer = document.querySelector('.fixed.inset-y-0.left-0');
    logResult('sidebarToggle', 'Sidebar container has proper positioning classes', 
      sidebarContainer ? 'PASS' : 'FAIL',
      sidebarContainer ? 'Fixed positioning classes found' : 'Positioning classes missing');

    // Check for mobile overlay
    const hasOverlayLogic = document.querySelector('.bg-black.bg-opacity-50') !== null || 
                           document.querySelector('[class*="bg-opacity"]') !== null;
    logResult('sidebarToggle', 'Mobile overlay structure present', 
      hasOverlayLogic ? 'PASS' : 'FAIL',
      'Overlay classes available for mobile toggle');

    // Check transition classes
    const hasTransitions = document.querySelector('.transition-transform');
    logResult('sidebarToggle', 'Sidebar has transition animations', 
      hasTransitions ? 'PASS' : 'FAIL',
      hasTransitions ? 'Transition classes found' : 'Missing transition classes');

    validationResults.sidebarToggle.status = 
      validationResults.sidebarToggle.issues.length === 0 ? 'PASS' : 'FAIL';

  } catch (error) {
    logResult('sidebarToggle', 'Validation execution', 'FAIL', error.message);
    validationResults.sidebarToggle.status = 'FAIL';
  }
}

function validateTopbarSticky() {
  console.log('\n=== TOPBAR STICKY BEHAVIOR VALIDATION ===');
  
  try {
    // Check for sticky header
    const stickyHeader = document.querySelector('header.sticky');
    logResult('topbarSticky', 'Topbar has sticky positioning', 
      stickyHeader ? 'PASS' : 'FAIL',
      stickyHeader ? 'Sticky class found on header' : 'Sticky class missing');

    // Check z-index for proper layering
    const hasZIndex = document.querySelector('header[class*="z-"]');
    logResult('topbarSticky', 'Topbar has proper z-index', 
      hasZIndex ? 'PASS' : 'FAIL',
      hasZIndex ? 'Z-index class found' : 'Z-index class missing');

    // Check top positioning
    const hasTopPosition = document.querySelector('header.top-0');
    logResult('topbarSticky', 'Topbar positioned at top', 
      hasTopPosition ? 'PASS' : 'FAIL',
      hasTopPosition ? 'Top-0 class found' : 'Top positioning missing');

    // Check for shadow/styling
    const hasShadow = document.querySelector('header[class*="shadow"]');
    logResult('topbarSticky', 'Topbar has visual styling', 
      hasShadow ? 'PASS' : 'FAIL',
      hasShadow ? 'Shadow styling found' : 'Visual styling may be missing');

    validationResults.topbarSticky.status = 
      validationResults.topbarSticky.issues.length === 0 ? 'PASS' : 'FAIL';

  } catch (error) {
    logResult('topbarSticky', 'Validation execution', 'FAIL', error.message);
    validationResults.topbarSticky.status = 'FAIL';
  }
}

function validateComponentStyling() {
  console.log('\n=== COMPONENT STYLING CONSISTENCY VALIDATION ===');
  
  try {
    // Check main layout structure
    const mainContainer = document.querySelector('.min-h-screen');
    logResult('componentStyling', 'Main container has proper classes', 
      mainContainer && mainContainer.classList.contains('bg-gradient-to-br') ? 'PASS' : 'FAIL',
      'Background gradient classes');

    // Check sidebar offset for main content
    const contentOffset = document.querySelector('.lg\\:pl-64');
    logResult('componentStyling', 'Content area has sidebar offset', 
      contentOffset ? 'PASS' : 'FAIL',
      contentOffset ? 'Sidebar offset class found' : 'Missing sidebar offset');

    // Check main content area styling
    const mainContent = document.querySelector('main');
    const hasFlexGrow = mainContent && mainContent.classList.contains('flex-1');
    const hasBackground = mainContent && (
      mainContent.classList.contains('bg-gradient-to-b') || 
      mainContent.classList.contains('bg-white') ||
      mainContent.classList.contains('bg-gray-50')
    );
    
    logResult('componentStyling', 'Main content has flex-1 class', 
      hasFlexGrow ? 'PASS' : 'FAIL',
      hasFlexGrow ? 'Flex-1 class found' : 'Missing flex-1 class');

    logResult('componentStyling', 'Main content has background styling', 
      hasBackground ? 'PASS' : 'FAIL',
      hasBackground ? 'Background classes found' : 'Missing background styling');

    // Check padding and spacing
    const hasPadding = mainContent && (
      mainContent.classList.contains('px-4') || 
      mainContent.classList.contains('p-4') ||
      mainContent.classList.contains('px-6')
    );
    
    logResult('componentStyling', 'Main content has proper padding', 
      hasPadding ? 'PASS' : 'FAIL',
      hasPadding ? 'Padding classes found' : 'Missing padding classes');

    // Check for animation classes
    const hasAnimations = document.querySelector('.animate-fadeIn');
    logResult('componentStyling', 'Content has fade-in animation', 
      hasAnimations ? 'PASS' : 'FAIL',
      hasAnimations ? 'Animation class found' : 'Animation class missing');

    validationResults.componentStyling.status = 
      validationResults.componentStyling.issues.length === 0 ? 'PASS' : 'FAIL';

  } catch (error) {
    logResult('componentStyling', 'Validation execution', 'FAIL', error.message);
    validationResults.componentStyling.status = 'FAIL';
  }
}

function validateNavigation() {
  console.log('\n=== NAVIGATION FUNCTIONALITY VALIDATION ===');
  
  try {
    // Check for React Router outlet
    const hasOutlet = document.querySelector('main') !== null;
    logResult('navigation', 'Main content area exists for routing', 
      hasOutlet ? 'PASS' : 'FAIL',
      hasOutlet ? 'Main element found' : 'Main element missing');

    // Check layout structure consistency
    const layoutStructure = {
      sidebar: document.querySelector('aside') !== null,
      topbar: document.querySelector('header') !== null,
      main: document.querySelector('main') !== null
    };

    const structureComplete = Object.values(layoutStructure).every(exists => exists);
    logResult('navigation', 'Layout structure is complete', 
      structureComplete ? 'PASS' : 'FAIL',
      `Sidebar: ${layoutStructure.sidebar}, Topbar: ${layoutStructure.topbar}, Main: ${layoutStructure.main}`);

    // Check for navigation links in sidebar
    const navLinks = document.querySelectorAll('nav a, nav [role="link"]');
    logResult('navigation', 'Navigation links present in sidebar', 
      navLinks.length > 0 ? 'PASS' : 'FAIL',
      `Found ${navLinks.length} navigation links`);

    // Check for proper container structure that supports routing
    const routingContainer = document.querySelector('.max-w-7xl');
    logResult('navigation', 'Content container supports routing', 
      routingContainer ? 'PASS' : 'FAIL',
      routingContainer ? 'Content container found' : 'Content container missing');

    validationResults.navigation.status = 
      validationResults.navigation.issues.length === 0 ? 'PASS' : 'FAIL';

  } catch (error) {
    logResult('navigation', 'Validation execution', 'FAIL', error.message);
    validationResults.navigation.status = 'FAIL';
  }
}

function generateReport() {
  console.log('\n=== VALIDATION SUMMARY REPORT ===');
  
  const categories = Object.keys(validationResults);
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  categories.forEach(category => {
    const result = validationResults[category];
    const categoryPassed = result.tests.filter(t => t.status === 'PASS').length;
    const categoryFailed = result.tests.filter(t => t.status === 'FAIL').length;
    
    totalTests += result.tests.length;
    passedTests += categoryPassed;
    failedTests += categoryFailed;

    console.log(`\n${category.toUpperCase()}: ${result.status}`);
    console.log(`  Tests: ${result.tests.length} | Passed: ${categoryPassed} | Failed: ${categoryFailed}`);
    
    if (result.issues.length > 0) {
      console.log('  Issues:');
      result.issues.forEach(issue => console.log(`    - ${issue}`));
    }
  });

  console.log('\n=== OVERALL RESULTS ===');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  const overallStatus = failedTests === 0 ? 'PASS' : 'FAIL';
  console.log(`Overall Status: ${overallStatus}`);

  return {
    overallStatus,
    totalTests,
    passedTests,
    failedTests,
    successRate: (passedTests / totalTests) * 100,
    results: validationResults
  };
}

// Main validation execution
function runValidation() {
  console.log('Starting Dashboard Layout Functionality Validation...');
  console.log('Timestamp:', new Date().toISOString());
  
  validateSidebarToggle();
  validateTopbarSticky();
  validateComponentStyling();
  validateNavigation();
  
  return generateReport();
}

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
  window.dashboardValidation = {
    runValidation,
    validateSidebarToggle,
    validateTopbarSticky,
    validateComponentStyling,
    validateNavigation,
    generateReport,
    results: validationResults
  };
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runValidation,
    validateSidebarToggle,
    validateTopbarSticky,
    validateComponentStyling,
    validateNavigation,
    generateReport
  };
}

console.log('Dashboard validation script loaded. Run dashboardValidation.runValidation() in browser console.');