# Backend Controller Tests

This directory contains comprehensive unit tests for all backend controllers in the waste reports management system.

## Test Files

### 1. wasteReportController.test.js
Tests for the main waste report controller including:
- **Report Creation**: Tests for creating new waste reports with validation
- **Report Retrieval**: Tests for getting user reports and admin reports with filtering
- **Report Management**: Tests for updating report status and deletion
- **Authentication & Authorization**: Tests for role-based access control
- **Error Handling**: Tests for various error scenarios and edge cases

### 2. assignmentsController.test.js
Tests for assignment-related functionality (handled within wasteReportController):
- **Report Assignment**: Tests for assigning reports to drivers
- **Driver Tasks**: Tests for retrieving driver assignments
- **Task Management**: Tests for accepting, starting, and completing tasks
- **Status Updates**: Tests for task status transitions
- **Validation**: Tests for input validation and error handling

### 3. notificationsController.test.js
Tests for the notifications controller including:
- **Notification Retrieval**: Tests for getting user notifications with pagination
- **Notification Management**: Tests for marking notifications as read
- **Bulk Operations**: Tests for bulk notification operations
- **Notification Counts**: Tests for getting notification statistics
- **Authentication**: Tests for user-specific notification access

## Test Coverage

The tests cover the following requirements from the specification:

### Requirement 8.1 - API Input Validation
- ✅ Tests for required field validation
- ✅ Tests for data type validation
- ✅ Tests for UUID format validation
- ✅ Tests for coordinate validation

### Requirement 8.2 - API Data Retrieval
- ✅ Tests for filtering and pagination
- ✅ Tests for sorting and search functionality
- ✅ Tests for user-specific data access
- ✅ Tests for admin data access

### Requirement 8.3 - API Error Handling
- ✅ Tests for database error handling
- ✅ Tests for validation error responses
- ✅ Tests for authentication errors
- ✅ Tests for authorization errors

### Requirement 8.4 - API Status Updates
- ✅ Tests for report status transitions
- ✅ Tests for assignment status updates
- ✅ Tests for notification status changes
- ✅ Tests for timestamp updates

## Key Test Scenarios

### Authentication & Authorization
- Tests verify that endpoints require proper authentication
- Tests ensure role-based access control (admin vs user vs driver)
- Tests validate user ownership of resources

### Input Validation
- Tests check for required fields
- Tests validate data formats (UUIDs, coordinates, etc.)
- Tests ensure proper error messages for invalid input

### Error Handling
- Tests cover database connection failures
- Tests handle unexpected errors gracefully
- Tests ensure proper HTTP status codes

### Business Logic
- Tests verify report creation workflow
- Tests validate assignment process
- Tests ensure notification delivery
- Tests check status transition rules

## Running Tests

```bash
# Run all controller tests
npm test -- --testPathPatterns="controllers"

# Run specific controller tests
npm test -- __tests__/controllers/wasteReportController.test.js
npm test -- __tests__/controllers/assignmentsController.test.js
npm test -- __tests__/controllers/notificationsController.test.js

# Run with coverage
npm run test:coverage
```

## Test Structure

Each test file follows a consistent structure:
1. **Setup**: Mock dependencies and create test fixtures
2. **Test Groups**: Organized by functionality (create, read, update, delete)
3. **Test Cases**: Cover happy path, edge cases, and error scenarios
4. **Assertions**: Verify both successful operations and error handling

## Mocking Strategy

The tests use comprehensive mocking for:
- **Supabase Client**: Mock database operations
- **Helper Functions**: Mock utility functions
- **Notification Services**: Mock notification delivery
- **Authentication**: Mock user context and permissions

This ensures tests are isolated, fast, and reliable while thoroughly testing the controller logic.