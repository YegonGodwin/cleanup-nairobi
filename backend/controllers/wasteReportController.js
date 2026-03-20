import { supabase } from '../config/supabase.js';
import { TABLES, REPORT_STATUS } from '../config/database.js';
import { successResponse, errorResponse, paginate } from '../utils/helpers.js';
import {
  createWasteReport,
  getWasteReports,
  getWasteReportById,
  updateWasteReportStatus,
  getUserWasteReports,
  getAvailableReports,
  canAssignReport,
  getReportsStatistics,
  deleteWasteReport,
} from '../utils/wasteReportHelpers.js';
import { 
  createNewReportNotifications,
} from '../utils/notificationHelpers.js';
import {
  WasteReportError,
  ValidationError,
  NotFoundError,
  handleDatabaseError,
  validateUUID,
  validateCoordinates,
  asyncHandler,
  logError
} from '../utils/wasteReportErrors.js';

// Create waste report (User)
export const createReport = asyncHandler(async (req, res) => {
  const { location, latitude, longitude, description, waste_type, image_url } = req.body;
  const userId = req.user.id;

  try {
    // Validate required fields
    if (!location || !description || !waste_type) {
      throw new ValidationError('Location, description, and waste_type are required');
    }

    // Validate and parse coordinates if provided
    let coords = null;
    if (latitude != null && longitude != null && latitude !== '' && longitude !== '') {
      try {
        coords = validateCoordinates(latitude, longitude);
      } catch (coordError) {
        // Log coordinate validation error but don't fail the request
        logError(coordError, { context: 'coordinate_validation', userId, latitude, longitude });
        coords = null;
      }
    }

    // Build reportData object - coordinates are now optional
    let reportData = {
      user_id: userId,
      location: location.trim(),
      description: description.trim(),
      waste_type: waste_type.trim(),
      image_url: image_url || null,
      status: 'pending',
      latitude: coords ? coords.latitude : null,
      longitude: coords ? coords.longitude : null
    };

    // Debug log to see what data is being sent to the database
    console.log('Report data being sent to DB:', JSON.stringify(reportData, null, 2));

    const report = await createWasteReport(reportData);

    // Award points to user for reporting (non-blocking)
    supabase.rpc('increment_user_points', {
      user_id: userId,
      points: 10
    }).then(({ error }) => {
      if (error) {
        logError(error, { context: 'award_points', userId, reportId: report.id });
      }
    }).catch(pointsError => {
      logError(pointsError, { context: 'award_points', userId, reportId: report.id });
    });

    // 🚨 Create engaging notifications for admin users (non-blocking)
    try {
      await createNewReportNotifications(report, req.user);
      console.log('🚨 New report notifications sent to all admins!');
    } catch (notificationError) {
      console.error('❌ Failed to send new report notifications:', notificationError);
      logError(notificationError, { context: 'create_notifications', userId, reportId: report.id });
    }

    return successResponse(res, report, 'Waste report created successfully', 201);
  } catch (error) {
    logError(error, { context: 'create_report', userId });
    
    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, 400);
    }
    
    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});

// Get all reports with filters (Admin)
export const getReports = asyncHandler(async (req, res) => {
  const { 
    status, 
    waste_type, 
    user_id, 
    dateFrom, 
    dateTo, 
    page = 1, 
    limit = 10,
    search,
    sort_by = 'created_at',
    sort_order = 'desc'
  } = req.query;

  try {
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    // Validate userId if provided
    if (user_id) {
      validateUUID(user_id, 'user_id');
    }

    // Validate sort parameters
    const validSortFields = ['created_at', 'status', 'waste_type', 'location', 'updated_at'];
    const validSortOrders = ['asc', 'desc'];
    
    const sortBy = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = validSortOrders.includes(sort_order) ? sort_order : 'desc';

    const filters = {
      status,
      wasteType: waste_type,
      userId: user_id,
      dateFrom,
      dateTo,
      search
    };

    const pagination = {
      page: pageNum,
      limit: limitNum,
      sortBy,
      sortOrder
    };

    const result = await getWasteReports(filters, pagination);

    return successResponse(res, result.reports, 'Reports retrieved successfully');
  } catch (error) {
    logError(error, { context: 'get_reports', filters: req.query });
    
    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, 400);
    }
    
    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});

// Get single report by ID
export const getReportById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    validateUUID(id, 'reportId');

    const report = await getWasteReportById(id);

    if (!report) {
      throw new NotFoundError('Report');
    }

    return successResponse(res, report, 'Report retrieved successfully');
  } catch (error) {
    logError(error, { context: 'get_report_by_id', reportId: id });
    
    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, 400);
    }
    
    if (error instanceof NotFoundError) {
      return errorResponse(res, error.message, 404);
    }
    
    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});

// Update report status (Admin/Driver)
export const updateReportStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  try {
    validateUUID(id, 'reportId');

    // Validate status
    const validStatuses = Object.values(REPORT_STATUS);
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status provided', 'status');
    }

    const updateData = { status, notes };
    const report = await updateWasteReportStatus(id, updateData);

    return successResponse(res, report, 'Report status updated successfully');
  } catch (error) {
    logError(error, { context: 'update_report_status', reportId: id, status });
    
    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, 400);
    }
    
    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});

// Delete report (Admin only)
export const deleteReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    validateUUID(id, 'reportId');

    await deleteWasteReport(id);

    return successResponse(res, null, 'Report deleted successfully');
  } catch (error) {
    logError(error, { context: 'delete_report', reportId: id });
    
    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, 400);
    }
    
    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});

// Get user's reports with pagination and sorting
export const getUserReports = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { 
    status, 
    page = 1, 
    limit = 10, 
    sort_by = 'created_at', 
    sort_order = 'desc' 
  } = req.query;

  try {
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    // Validate sort parameters
    const validSortFields = ['created_at', 'status', 'waste_type', 'location'];
    const validSortOrders = ['asc', 'desc'];
    
    const sortBy = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = validSortOrders.includes(sort_order) ? sort_order : 'desc';

    const options = {
      status,
      page: pageNum,
      limit: limitNum,
      sortBy,
      sortOrder
    };

    const result = await getUserWasteReports(userId, options);

    return successResponse(res, result, 'User reports retrieved successfully');
  } catch (error) {
    logError(error, { context: 'get_user_reports', userId });
    
    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});

// Get user dashboard statistics
export const getUserDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Get user reports stats
    const { data: reports, error: reportsError } = await supabase
      .from(TABLES.WASTE_REPORTS)
      .select('status, waste_type')
      .eq('user_id', userId);

    if (reportsError) throw reportsError;

    const totalReports = (reports || []).length;
    const completedReports = (reports || []).filter(r => r.status === REPORT_STATUS.COMPLETED).length;
    
    // Recycling actions: reports with specific waste types (plastic, metal, glass, paper)
    const recyclingTypes = ['plastic', 'metal', 'glass', 'paper'];
    const recyclingActions = (reports || []).filter(r => recyclingTypes.includes(r.waste_type)).length;

    // Waste breakdown for PieChart
    const breakdown = (reports || []).reduce((acc, report) => {
      const type = report.waste_type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const wasteBreakdown = Object.entries(breakdown).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));

    // Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: trendData, error: trendError } = await supabase
      .from(TABLES.WASTE_REPORTS)
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', sixMonthsAgo.toISOString());

    if (trendError) throw trendError;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trends = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = months[d.getMonth()];
      trends[monthName] = 0;
    }

    (trendData || []).forEach(report => {
      const monthName = months[new Date(report.created_at).getMonth()];
      if (trends[monthName] !== undefined) {
        trends[monthName]++;
      }
    });

    const monthlyTrends = Object.entries(trends)
      .map(([name, waste]) => ({ name, waste }))
      .reverse();

    // Waste collected: Assuming 5kg per completed report for now
    const wasteCollected = completedReports * 5;

    // 2. Get user points
    const { data: user, error: userError } = await supabase
      .from(TABLES.USERS)
      .select('points')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // 3. Calculate rank: count users with points > current user's points
    const { count: higherPointsCount, error: rankError } = await supabase
      .from(TABLES.USERS)
      .select('*', { count: 'exact', head: true })
      .gt('points', user.points || 0);

    if (rankError) throw rankError;

    const communityRank = (higherPointsCount || 0) + 1;
    
    // Impact score: derived from points (for example, points * 1.5)
    const impactScore = Math.floor((user.points || 0) * 1.5);

    // 4. Get total community size
    const { count: communitySize, error: sizeError } = await supabase
      .from(TABLES.USERS)
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user');

    if (sizeError) throw sizeError;

    const stats = {
      wasteCollected,
      recyclingActions,
      communityRank,
      communitySize: communitySize || 0,
      impactScore,
      reportsSubmitted: totalReports,
      completedCollections: completedReports,
      points: user.points || 0,
      wasteBreakdown,
      monthlyTrends
    };

    return successResponse(res, stats, 'User dashboard statistics retrieved successfully');
  } catch (error) {
    logError(error, { context: 'get_user_dashboard_stats', userId });
    
    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});

// Get nearby reports (for drivers)
export const getNearbyReports = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius = 5 } = req.query;

  try {
    // Validate and parse coordinates
    const coords = validateCoordinates(latitude, longitude);
    const rad = parseFloat(radius);

    if (isNaN(rad) || rad <= 0) {
      throw new ValidationError('Invalid radius provided', 'radius');
    }

    // Get available reports (pending status)
    const reports = await getAvailableReports();

    // Filter by distance (simple calculation, can be improved with PostGIS)
    // Only include reports that have coordinates
    const nearbyReports = reports.filter(report => {
      // Skip reports without coordinates
      if (report.latitude == null || report.longitude == null) {
        return false;
      }
      
      const distance = calculateDistance(coords.latitude, coords.longitude, report.latitude, report.longitude);
      return distance <= rad;
    });

    return successResponse(res, nearbyReports, 'Nearby reports retrieved successfully');
  } catch (error) {
    logError(error, { context: 'get_nearby_reports', coordinates: { latitude, longitude, radius } });
    
    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, 400);
    }
    
    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});

// Get reports available for assignment (Admin)
export const getAvailableReportsForAssignment = asyncHandler(async (req, res) => {
  const { wasteType, location } = req.query;

  try {
    const filters = {};
    if (wasteType) filters.wasteType = wasteType;
    if (location) filters.location = location;

    const reports = await getAvailableReports(filters);

    return successResponse(res, reports, 'Available reports retrieved successfully');
  } catch (error) {
    logError(error, { context: 'get_available_reports', filters: req.query });
    
    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});

// Get reports statistics (Admin)
export const getReportsStats = asyncHandler(async (req, res) => {
  const { userId, dateFrom, dateTo } = req.query;

  try {
    const filters = {};
    if (userId) {
      validateUUID(userId, 'userId');
      filters.userId = userId;
    }
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    const stats = await getReportsStatistics(filters);

    return successResponse(res, stats, 'Reports statistics retrieved successfully');
  } catch (error) {
    logError(error, { context: 'get_reports_stats', filters: req.query });
    
    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, 400);
    }
    
    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});

// Check if report can be assigned (Admin)
export const checkReportAssignability = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    validateUUID(id, 'reportId');

    const canAssign = await canAssignReport(id);

    return successResponse(res, { canAssign }, 'Report assignability checked successfully');
  } catch (error) {
    logError(error, { context: 'check_report_assignability', reportId: id });
    
    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, 400);
    }
    
    const dbError = handleDatabaseError(error);
    return errorResponse(res, dbError.message, dbError.statusCode);
  }
});

// Helper function to calculate distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value) => {
  return (value * Math.PI) / 180;
};

export default {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  deleteReport,
  getUserReports,
  getUserDashboardStats,
  getNearbyReports,
  getAvailableReportsForAssignment,
  getReportsStats,
  checkReportAssignability
};


