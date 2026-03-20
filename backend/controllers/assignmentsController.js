import {
  getDriverAssignments,
  acceptDriverAssignment,
  startDriverAssignment,
  completeDriverAssignment,
  assignReportToDriver,
  canAssignReport,
} from '../utils/wasteReportHelpers.js';
import {
  createTaskAssignmentNotification,
  createTaskAcceptedNotifications,
  createTaskStartedNotifications,
  createTaskCompletedNotifications,
} from '../utils/notificationHelpers.js';
import {
  asyncHandler,
  logError,
  ValidationError,
  validateUUID,
  handleDatabaseError,
} from '../utils/wasteReportErrors.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

// Get driver assignments (Driver)
export const getDriverTasks = asyncHandler(async (req, res) => {
  const driverId = req.user.driver_id; // Assuming driver_id is available in user object
  const {
    status,
    page = 1,
    limit = 10,
    sort_by = 'assigned_at',
    sort_order = 'desc',
    dateFrom,
    dateTo,
  } = req.query;

  try {
    if (!driverId) {
      throw new ValidationError('Driver ID not found. User may not be a driver.');
    }

    validateUUID(driverId, 'driverId');

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    // Validate sort parameters
    const validSortFields = ['assigned_at', 'status', 'accepted_at', 'started_at'];
    const validSortOrders = ['asc', 'desc'];

    const sortBy = validSortFields.includes(sort_by) ? sort_by : 'assigned_at';
    const sortOrder = validSortOrders.includes(sort_order) ? sort_order : 'desc';

    const filters = {
      status,
      dateFrom,
      dateTo,
    };

    const pagination = {
      page: pageNum,
      limit: limitNum,
      sortBy,
      sortOrder,
    };

    const result = await getDriverAssignments(driverId, filters, pagination);

    // Return only the assignments array to the frontend, which expects an array for .filter() operations
    return successResponse(res, result.assignments, 'Driver tasks retrieved successfully');
  } catch (error) {
    logError(error, { context: 'get_driver_tasks', driverId });

    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, 400);
    }

    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});

// Accept driver assignment (Driver)
export const acceptAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const driverId = req.user.driver_id; // Assuming driver_id is available in user object

  try {
    validateUUID(id, 'assignmentId');

    if (!driverId) {
      throw new ValidationError('Driver ID not found. User may not be a driver.');
    }

    validateUUID(driverId, 'driverId');

    const assignment = await acceptDriverAssignment(id, driverId);

    // ✅ Create engaging task acceptance notifications
    try {
      await createTaskAcceptedNotifications(
        assignment,
        assignment.waste_reports,
        assignment.drivers
      );

      console.log('✅ Task acceptance notifications sent successfully!');
    } catch (notificationError) {
      console.error('❌ Failed to send acceptance notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    return successResponse(res, assignment, 'Assignment accepted successfully! ✅ All parties have been notified.');
  } catch (error) {
    logError(error, { context: 'accept_assignment', assignmentId: id, driverId });

    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, 400);
    }

    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});

// Start driver assignment (Driver)
export const startAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const driverId = req.user.driver_id; // Assuming driver_id is available in user object

  try {
    validateUUID(id, 'assignmentId');

    if (!driverId) {
      throw new ValidationError('Driver ID not found. User may not be a driver.');
    }

    validateUUID(driverId, 'driverId');

    const assignment = await startDriverAssignment(id, driverId);

    // 🚀 Create engaging task started notifications
    try {
      await createTaskStartedNotifications(
        assignment,
        assignment.waste_reports,
        assignment.drivers
      );

      console.log('🚀 Task started notifications sent successfully!');
    } catch (notificationError) {
      console.error('❌ Failed to send task started notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    return successResponse(res, assignment, 'Assignment started successfully! 🚀 Live updates sent to stakeholders.');
  } catch (error) {
    logError(error, { context: 'start_assignment', assignmentId: id, driverId });

    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, 400);
    }

    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});

// Complete driver assignment (Driver)
export const completeAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { completion_notes, completion_image_url, estimated_weight, completion_metadata } = req.body;
  const driverId = req.user.driver_id; // Assuming driver_id is available in user object

  try {
    validateUUID(id, 'assignmentId');

    if (!driverId) {
      throw new ValidationError('Driver ID not found. User may not be a driver.');
    }

    validateUUID(driverId, 'driverId');

    const completionData = {
      completion_notes,
      completion_image_url,
      estimated_weight,
      completion_metadata,
    };

    const assignment = await completeDriverAssignment(id, driverId, completionData);

    // 🎉 Create engaging completion notifications
    try {
      const completionDetails = {
        completion_notes,
        completion_image_url,
        weight: estimated_weight,
        ...completion_metadata
      };

      await createTaskCompletedNotifications(
        assignment,
        assignment.waste_reports,
        assignment.drivers,
        completionDetails
      );

      console.log('✅ Task completion notifications sent successfully!');
    } catch (notificationError) {
      console.error('❌ Failed to send completion notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    return successResponse(res, assignment, 'Assignment completed successfully! 🎉 Notifications sent to all stakeholders.');
  } catch (error) {
    logError(error, { context: 'complete_assignment', assignmentId: id, driverId });

    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, 400);
    }

    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});

// Assign report to driver (Admin)
export const assignReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { driver_id, notes } = req.body;

  try {
    validateUUID(id, 'reportId');
    validateUUID(driver_id, 'driverId');

    // Check if report can be assigned
    const canAssign = await canAssignReport(id);
    if (!canAssign) {
      throw new ValidationError('Report cannot be assigned. It may already be assigned or not in pending status.');
    }

    const assignmentData = {
      report_id: id,
      driver_id,
      notes: notes || null,
    };

    const assignment = await assignReportToDriver(assignmentData);

    // Create notification for driver (non-blocking)
    if (assignment && assignment.drivers && assignment.waste_reports) {
      createTaskAssignmentNotification(assignment, assignment.waste_reports, assignment.drivers).catch(notificationError => {
        logError(notificationError, { context: 'create_assignment_notification', assignmentId: assignment.id });
      });
    }

    return successResponse(res, assignment, 'Report assigned to driver successfully', 201);
  } catch (error) {
    logError(error, { context: 'assign_report', reportId: id, driverId: driver_id });

    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, 400);
    }

    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});
