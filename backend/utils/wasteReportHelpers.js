import { supabase, supabaseAdmin } from '../config/supabase.js';
import { TABLES, REPORT_STATUS, ASSIGNMENT_STATUS } from '../config/database.js';

/**
 * Database helper functions for waste reports operations
 */

/**
 * Create a new waste report
 * @param {Object} reportData - Report data
 * @returns {Promise<Object>} Created report
 */
export const createWasteReport = async (reportData) => {
  try {
    // Prepare the report data with proper coordinate handling
    const reportToInsert = {
      ...reportData,
      status: REPORT_STATUS.PENDING,
      created_at: new Date().toISOString()
    };

    // Handle nullable coordinates - ensure they are either valid numbers or null
    if (reportToInsert.latitude !== undefined) {
      reportToInsert.latitude = reportToInsert.latitude === null || reportToInsert.latitude === '' 
        ? null 
        : parseFloat(reportToInsert.latitude);
    }
    
    if (reportToInsert.longitude !== undefined) {
      reportToInsert.longitude = reportToInsert.longitude === null || reportToInsert.longitude === '' 
        ? null 
        : parseFloat(reportToInsert.longitude);
    }

    // Validate coordinate pairs - if one is provided, both should be provided or both should be null
    if ((reportToInsert.latitude === null) !== (reportToInsert.longitude === null)) {
      throw new Error('Both latitude and longitude must be provided together, or both must be null');
    }

    // Use supabaseAdmin to bypass RLS since we're using custom authentication
    const { data, error } = await supabaseAdmin
      .from(TABLES.WASTE_REPORTS)
      .insert([reportToInsert])
      .select()
      .single();

    if (error) {
      // Provide more specific error messages for coordinate-related issues
      if (error.message.includes('latitude') || error.message.includes('longitude')) {
        throw new Error(`Coordinate validation failed: ${error.message}`);
      }
      
      // Handle other database constraint violations
      if (error.code === '23502') { // NOT NULL violation
        throw new Error(`Required field missing: ${error.message}`);
      }
      
      if (error.code === '23514') { // CHECK constraint violation
        throw new Error(`Invalid data format: ${error.message}`);
      }
      
      throw new Error(`Failed to create waste report: ${error.message}`);
    }

    // Create notifications for admin users (non-blocking)
    (async () => {
      try {
        const { data: adminUsers, error: adminError } = await supabaseAdmin
          .from(TABLES.USERS)
          .select('id')
          .eq('role', 'admin');

        if (adminError) {
          console.warn('Failed to fetch admin users for notification:', adminError.message);
          return;
        }

        if (adminUsers && adminUsers.length > 0) {
          const adminNotifications = adminUsers.map(admin => ({
            user_id: admin.id,
            title: 'New Waste Report',
            message: `A new waste report has been submitted for ${data.location}.`,
            type: 'new_report',
            related_entity_id: data.id,
            is_read: false,
            created_at: new Date().toISOString()
          }));

          const { error: notificationError } = await supabaseAdmin
            .from(TABLES.NOTIFICATIONS)
            .insert(adminNotifications);

          if (notificationError) {
            console.warn('Failed to create admin notifications for new report:', notificationError.message);
          }
        }
      } catch (error) {
        console.warn('An unexpected error occurred while creating admin notifications:', error.message);
      }
    })();

    return data;
  } catch (error) {
    // Re-throw with more context if it's our custom error
    if (error.message.includes('latitude and longitude must be provided together')) {
      throw error;
    }
    
    // Handle unexpected errors
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get waste reports with filters, search, and pagination
 * @param {Object} filters - Filter options
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Reports with pagination info
 */
export const getWasteReports = async (filters = {}, pagination = {}) => {
  const { status, wasteType, userId, dateFrom, dateTo, search } = filters;
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'created_at', 
    sortOrder = 'desc' 
  } = pagination;
  const offset = (page - 1) * limit;

  let query = supabase
    .from(TABLES.WASTE_REPORTS)
    .select(`
      *,
      users (
        id,
        full_name,
        avatar_url,
        phone,
        email
      ),
      driver_assignments (
        id,
        status,
        assigned_at,
        accepted_at,
        started_at,
        completed_at,
        completion_notes,
        drivers (
          id,
          full_name,
          phone,
          vehicle_number,
          vehicle_type,
          is_available
        )
      )
    `, { count: 'exact' });

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }

  if (wasteType) {
    query = query.eq('waste_type', wasteType);
  }

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }

  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  // Apply search functionality across location and description
  if (search) {
    query = query.or(`location.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply sorting
  const ascending = sortOrder === 'asc';
  query = query.order(sortBy, { ascending });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get waste reports: ${error.message}`);
  }

  return {
    reports: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
};

/**
 * Get a single waste report by ID with full details
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} Report with full details
 */
export const getWasteReportById = async (reportId) => {
  const { data, error } = await supabaseAdmin
    .from(TABLES.WASTE_REPORTS)
    .select(`
      *,
      users (
        id,
        full_name,
        avatar_url,
        phone,
        email
      ),
      driver_assignments (
        id,
        status,
        assigned_at,
        accepted_at,
        started_at,
        completed_at,
        cancelled_at,
        completion_notes,
        completion_image_url,
        cancellation_reason,
        drivers (
          id,
          full_name,
          phone,
          vehicle_number,
          vehicle_type,
          is_available
        )
      )
    `)
    .eq('id', reportId)
    .single();

  if (error) {
    throw new Error(`Failed to get waste report: ${error.message}`);
  }

  return data;
};

/**
 * Update waste report status and related fields
 * @param {string} reportId - Report ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated report
 */
export const updateWasteReportStatus = async (reportId, updateData) => {
  const { status, notes } = updateData;
  
  const updateFields = { 
    status,
    updated_at: new Date().toISOString()
  };

  if (notes) {
    updateFields.notes = notes;
  }

  if (status === REPORT_STATUS.COMPLETED) {
    updateFields.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from(TABLES.WASTE_REPORTS)
    .update(updateFields)
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update waste report status: ${error.message}`);
  }

  return data;
};

/**
 * Get user's waste reports with pagination and sorting
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} User's reports with pagination info
 */
export const getUserWasteReports = async (userId, options = {}) => {
  const { 
    status, 
    page = 1, 
    limit = 10, 
    sortBy = 'created_at', 
    sortOrder = 'desc' 
  } = options;
  
  const offset = (page - 1) * limit;

  let query = supabase
    .from(TABLES.WASTE_REPORTS)
    .select(`
      *,
      driver_assignments (
        id,
        status,
        assigned_at,
        accepted_at,
        started_at,
        completed_at,
        drivers (
          id,
          full_name,
          phone,
          vehicle_number,
          vehicle_type
        )
      )
    `, { count: 'exact' })
    .eq('user_id', userId);

  // Apply status filter
  if (status) {
    query = query.eq('status', status);
  }

  // Apply sorting
  const ascending = sortOrder === 'asc';
  query = query.order(sortBy, { ascending });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get user waste reports: ${error.message}`);
  }

  return {
    reports: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
};

/**
 * Get reports available for assignment (pending status)
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Available reports
 */
export const getAvailableReports = async (filters = {}) => {
  const { wasteType, location } = filters;

  let query = supabase
    .from(TABLES.WASTE_REPORTS)
    .select(`
      *,
      users (
        id,
        full_name,
        phone
      )
    `)
    .eq('status', REPORT_STATUS.PENDING)
    .order('created_at', { ascending: true }); // Oldest first for fairness

  if (wasteType) {
    query = query.eq('waste_type', wasteType);
  }

  if (location) {
    query = query.ilike('location', `%${location}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get available reports: ${error.message}`);
  }

  return data;
};

/**
 * Check if a report can be assigned (is pending and not already assigned)
 * @param {string} reportId - Report ID
 * @returns {Promise<boolean>} Whether report can be assigned
 */
export const canAssignReport = async (reportId) => {
  // Check report status
  const { data: report, error: reportError } = await supabase
    .from(TABLES.WASTE_REPORTS)
    .select('status')
    .eq('id', reportId)
    .single();

  if (reportError || !report) {
    return false;
  }

  if (report.status !== REPORT_STATUS.PENDING) {
    return false;
  }

  // Check if already assigned
  const { data: assignment, error: assignmentError } = await supabase
    .from(TABLES.DRIVER_ASSIGNMENTS)
    .select('id')
    .eq('report_id', reportId)
    .in('status', [ASSIGNMENT_STATUS.PENDING, ASSIGNMENT_STATUS.ACCEPTED, ASSIGNMENT_STATUS.IN_PROGRESS])
    .single();

  if (assignmentError && assignmentError.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" which is what we want
    return false;
  }

  return !assignment; // Return true if no active assignment exists
};

/**
 * Get reports statistics
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Statistics
 */
export const getReportsStatistics = async (filters = {}) => {
  const { userId, dateFrom, dateTo } = filters;

  let query = supabase
    .from(TABLES.WASTE_REPORTS)
    .select('status', { count: 'exact' });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }

  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get reports statistics: ${error.message}`);
  }

  // Count by status
  const stats = {
    total: count,
    pending: 0,
    assigned: 0,
    in_progress: 0,
    completed: 0,
    rejected: 0
  };

  data.forEach(report => {
    if (stats.hasOwnProperty(report.status)) {
      stats[report.status]++;
    }
  });

  return stats;
};

/**
 * Delete a waste report (admin only)
 * @param {string} reportId - Report ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteWasteReport = async (reportId) => {
  const { error } = await supabase
    .from(TABLES.WASTE_REPORTS)
    .delete()
    .eq('id', reportId);

  if (error) {
    throw new Error(`Failed to delete waste report: ${error.message}`);
  }

  return true;
};

/**
 * Assign a waste report to a driver
 * @param {Object} assignmentData - Assignment data
 * @returns {Promise<Object>} Created assignment with details
 */
export const assignReportToDriver = async (assignmentData) => {
  const { report_id, driver_id, notes } = assignmentData;

  // Start a transaction to ensure data consistency
  const { data: assignment, error: assignmentError } = await supabase
    .from(TABLES.DRIVER_ASSIGNMENTS)
    .insert([{
      driver_id,
      report_id,
      status: ASSIGNMENT_STATUS.PENDING,
      assigned_at: new Date().toISOString(),
      notes
    }])
    .select(`
      *,
      drivers (
        id,
        full_name,
        phone,
        vehicle_number,
        vehicle_type,
        is_available
      ),
      waste_reports (
        id,
        location,
        description,
        waste_type,
        status,
        created_at
      )
    `)
    .single();

  if (assignmentError) {
    throw new Error(`Failed to create driver assignment: ${assignmentError.message}`);
  }

  // Update report status to assigned
  const { error: updateError } = await supabase
    .from(TABLES.WASTE_REPORTS)
    .update({ 
      status: REPORT_STATUS.ASSIGNED,
      updated_at: new Date().toISOString()
    })
    .eq('id', report_id);

  if (updateError) {
    // Rollback assignment if report update fails
    await supabase
      .from(TABLES.DRIVER_ASSIGNMENTS)
      .delete()
      .eq('id', assignment.id);
    
    throw new Error(`Failed to update report status: ${updateError.message}`);
  }

  // Get driver's user_id for notification
  const { data: driverUser, error: driverUserError } = await supabase
    .from(TABLES.DRIVERS)
    .select('user_id')
    .eq('id', driver_id)
    .single();

  if (!driverUserError && driverUser) {
    // Create notification for driver
    const { error: notificationError } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .insert([{
        user_id: driverUser.user_id,
        title: 'New Task Assigned',
        message: `You have been assigned a new waste collection task at ${assignment.waste_reports.location}`,
        type: 'task_assigned',
        is_read: false,
        created_at: new Date().toISOString()
      }]);

    if (notificationError) {
      console.warn('Failed to create driver notification:', notificationError.message);
    }
  }

  return assignment;
};

/**
 * Get driver assignments with filters and pagination
 * @param {string} driverId - Driver ID
 * @param {Object} filters - Filter options
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Assignments with pagination info
 */
export const getDriverAssignments = async (driverId, filters = {}, pagination = {}) => {
  const { status, dateFrom, dateTo } = filters;
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'assigned_at', 
    sortOrder = 'desc' 
  } = pagination;
  const offset = (page - 1) * limit;

  let query = supabase
    .from(TABLES.DRIVER_ASSIGNMENTS)
    .select(`
      *,
      waste_reports (
        id,
        location,
        latitude,
        longitude,
        description,
        waste_type,
        image_url,
        status,
        created_at,
        users (
          id,
          full_name,
          phone
        )
      )
    `, { count: 'exact' })
    .eq('driver_id', driverId);

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }

  if (dateFrom) {
    query = query.gte('assigned_at', dateFrom);
  }

  if (dateTo) {
    query = query.lte('assigned_at', dateTo);
  }

  // Apply sorting
  const ascending = sortOrder === 'asc';
  query = query.order(sortBy, { ascending });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get driver assignments: ${error.message}`);
  }

  return {
    assignments: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
};

/**
 * Accept a driver assignment
 * @param {string} assignmentId - Assignment ID
 * @param {string} driverId - Driver ID (for validation)
 * @returns {Promise<Object>} Updated assignment
 */
export const acceptDriverAssignment = async (assignmentId, driverId) => {
  // First, verify the assignment belongs to the driver and is in pending status
  const { data: existingAssignment, error: fetchError } = await supabase
    .from(TABLES.DRIVER_ASSIGNMENTS)
    .select('id, driver_id, status, report_id')
    .eq('id', assignmentId)
    .eq('driver_id', driverId)
    .eq('status', ASSIGNMENT_STATUS.PENDING)
    .single();

  if (fetchError || !existingAssignment) {
    throw new Error('Assignment not found or cannot be accepted');
  }

  // Update assignment status
  const { data: assignment, error: updateError } = await supabase
    .from(TABLES.DRIVER_ASSIGNMENTS)
    .update({
      status: ASSIGNMENT_STATUS.ACCEPTED,
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', assignmentId)
    .select(`
      *,
      drivers (
        id,
        full_name,
        phone,
        vehicle_number,
        vehicle_type,
        is_available
      ),
      waste_reports (
        id,
        location,
        description,
        waste_type,
        status,
        users (
          id,
          full_name,
          phone
        )
      )
    `)
    .single();

  if (updateError) {
    throw new Error(`Failed to accept assignment: ${updateError.message}`);
  }

  // Create notification for user who submitted the report
  const { error: notificationError } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .insert([{
      user_id: assignment.waste_reports.users.id,
      title: 'Task Accepted',
      message: `Your waste report at ${assignment.waste_reports.location} has been accepted by a driver`,
      type: 'status_update',
      is_read: false,
      created_at: new Date().toISOString()
    }]);

  if (notificationError) {
    console.warn('Failed to create user notification:', notificationError.message);
  }

  return assignment;
};

/**
 * Start a driver assignment
 * @param {string} assignmentId - Assignment ID
 * @param {string} driverId - Driver ID (for validation)
 * @returns {Promise<Object>} Updated assignment
 */
export const startDriverAssignment = async (assignmentId, driverId) => {
  // First, verify the assignment belongs to the driver and is in accepted status
  const { data: existingAssignment, error: fetchError } = await supabase
    .from(TABLES.DRIVER_ASSIGNMENTS)
    .select('id, driver_id, status, report_id')
    .eq('id', assignmentId)
    .eq('driver_id', driverId)
    .eq('status', ASSIGNMENT_STATUS.ACCEPTED)
    .single();

  if (fetchError || !existingAssignment) {
    throw new Error('Assignment not found or cannot be started');
  }

  // Update assignment status to in_progress
  const { data: assignment, error: updateError } = await supabase
    .from(TABLES.DRIVER_ASSIGNMENTS)
    .update({
      status: ASSIGNMENT_STATUS.IN_PROGRESS,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', assignmentId)
    .select(`
      *,
      drivers (
        id,
        full_name,
        phone,
        vehicle_number,
        vehicle_type,
        is_available
      ),
      waste_reports (
        id,
        location,
        description,
        waste_type,
        status,
        users (
          id,
          full_name,
          phone
        )
      )
    `)
    .single();

  if (updateError) {
    throw new Error(`Failed to start assignment: ${updateError.message}`);
  }

  // Update report status to in_progress
  const { error: reportUpdateError } = await supabase
    .from(TABLES.WASTE_REPORTS)
    .update({ 
      status: REPORT_STATUS.IN_PROGRESS,
      updated_at: new Date().toISOString()
    })
    .eq('id', existingAssignment.report_id);

  if (reportUpdateError) {
    throw new Error(`Failed to update report status: ${reportUpdateError.message}`);
  }

  // Create notification for user who submitted the report
  const { error: notificationError } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .insert([{
      user_id: assignment.waste_reports.users.id,
      title: 'Task Started',
      message: `Collection has started for your waste report at ${assignment.waste_reports.location}`,
      type: 'status_update',
      is_read: false,
      created_at: new Date().toISOString()
    }]);

  if (notificationError) {
    console.warn('Failed to create user notification:', notificationError.message);
  }

  return assignment;
};

/**
 * Complete a driver assignment
 * @param {string} assignmentId - Assignment ID
 * @param {string} driverId - Driver ID (for validation)
 * @param {Object} completionData - Completion data (notes, image)
 * @returns {Promise<Object>} Updated assignment
 */
export const completeDriverAssignment = async (assignmentId, driverId, completionData = {}) => {
  const { completion_notes, completion_image_url } = completionData;

  // First, verify the assignment belongs to the driver and is in progress status
  const { data: existingAssignment, error: fetchError } = await supabase
    .from(TABLES.DRIVER_ASSIGNMENTS)
    .select('id, driver_id, status, report_id')
    .eq('id', assignmentId)
    .eq('driver_id', driverId)
    .eq('status', ASSIGNMENT_STATUS.IN_PROGRESS)
    .single();

  if (fetchError || !existingAssignment) {
    throw new Error('Assignment not found or cannot be completed');
  }

  // Update assignment status to completed
  const { data: assignment, error: updateError } = await supabase
    .from(TABLES.DRIVER_ASSIGNMENTS)
    .update({
      status: ASSIGNMENT_STATUS.COMPLETED,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completion_notes: completion_notes || null,
      completion_image_url: completion_image_url || null
    })
    .eq('id', assignmentId)
    .select(`
      *,
      waste_reports (
        id,
        location,
        description,
        waste_type,
        status,
        users (
          id,
          full_name,
          phone
        )
      ),
      drivers (
        id,
        full_name,
        phone,
        vehicle_number
      )
    `)
    .single();

  if (updateError) {
    throw new Error(`Failed to complete assignment: ${updateError.message}`);
  }

  // Update report status to completed
  const { error: reportUpdateError } = await supabase
    .from(TABLES.WASTE_REPORTS)
    .update({ 
      status: REPORT_STATUS.COMPLETED,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', existingAssignment.report_id);

  if (reportUpdateError) {
    throw new Error(`Failed to update report status: ${reportUpdateError.message}`);
  }

  // Award points to user for completed report (non-blocking)
  (async () => {
    try {
      const { error: pointsError } = await supabase.rpc('increment_user_points', {
        user_id: assignment.waste_reports.users.id,
        points: 20
      });

      if (pointsError) {
        console.warn('Failed to award completion points:', pointsError.message);
      }
    } catch (error) {
      console.warn('An unexpected error occurred while awarding points:', error.message);
    }
  })();

  // Create notification for user who submitted the report
  const { error: userNotificationError } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .insert([{
      user_id: assignment.waste_reports.users.id,
      title: 'Task Completed',
      message: `Your waste report at ${assignment.waste_reports.location} has been completed by ${assignment.drivers.full_name}`,
      type: 'status_update',
      is_read: false,
      created_at: new Date().toISOString()
    }]);

  if (userNotificationError) {
    console.warn('Failed to create user notification:', userNotificationError.message);
  }

  // Create notification for admin users
  const { data: adminUsers, error: adminError } = await supabase
    .from(TABLES.USERS)
    .select('id')
    .eq('role', 'admin');

  if (!adminError && adminUsers && adminUsers.length > 0) {
    const adminNotifications = adminUsers.map(admin => ({
      user_id: admin.id,
      title: 'Task Completed',
      message: `Waste collection task at ${assignment.waste_reports.location} has been completed by ${assignment.drivers.full_name}`,
      type: 'status_update',
      is_read: false,
      created_at: new Date().toISOString()
    }));

    const { error: adminNotificationError } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .insert(adminNotifications);

    if (adminNotificationError) {
      console.warn('Failed to create admin notifications:', adminNotificationError.message);
    }
  }

  return assignment;
};

/**
 * Validate coordinates if they are provided
 * @param {number|null} latitude - Latitude value
 * @param {number|null} longitude - Longitude value
 * @returns {Object} Validation result with isValid flag and error message
 */
export const validateCoordinates = (latitude, longitude) => {
  // Both null is valid (manual location entry)
  if (latitude === null && longitude === null) {
    return { isValid: true, error: null };
  }
  
  // Both must be provided together
  if ((latitude === null) !== (longitude === null)) {
    return { 
      isValid: false, 
      error: 'Both latitude and longitude must be provided together, or both must be null' 
    };
  }
  
  // Validate latitude range
  if (latitude < -90 || latitude > 90) {
    return { 
      isValid: false, 
      error: 'Latitude must be between -90 and 90 degrees' 
    };
  }
  
  // Validate longitude range
  if (longitude < -180 || longitude > 180) {
    return { 
      isValid: false, 
      error: 'Longitude must be between -180 and 180 degrees' 
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Check if coordinates are within Nairobi bounds (if provided)
 * @param {number|null} latitude - Latitude value
 * @param {number|null} longitude - Longitude value
 * @returns {Object} Validation result with isValid flag and error message
 */
export const validateNairobiBounds = (latitude, longitude) => {
  // Skip validation if coordinates are null
  if (latitude === null || longitude === null) {
    return { isValid: true, error: null };
  }
  
  // Nairobi bounds (approximate)
  const NAIROBI_BOUNDS = {
    north: -1.163,
    south: -1.444,
    east: 37.106,
    west: 36.650
  };
  
  if (latitude < NAIROBI_BOUNDS.south || latitude > NAIROBI_BOUNDS.north ||
      longitude < NAIROBI_BOUNDS.west || longitude > NAIROBI_BOUNDS.east) {
    return { 
      isValid: false, 
      error: 'Coordinates must be within Nairobi city bounds' 
    };
  }
  
  return { isValid: true, error: null };
};

export default {
  createWasteReport,
  getWasteReports,
  getWasteReportById,
  updateWasteReportStatus,
  getUserWasteReports,
  getAvailableReports,
  canAssignReport,
  getReportsStatistics,
  deleteWasteReport,
  assignReportToDriver,
  getDriverAssignments,
  acceptDriverAssignment,
  startDriverAssignment,
  completeDriverAssignment,
  validateCoordinates,
  validateNairobiBounds
};