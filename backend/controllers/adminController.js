import { supabase, supabaseAdmin } from '../config/supabase.js';
import { TABLES, USER_ROLES, EVENT_STATUS, REPORT_STATUS } from '../config/database.js';
import { successResponse, errorResponse, hashPassword } from '../utils/helpers.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from(TABLES.USERS)
      .select('*', { count: 'exact', head: true })
      .eq('role', USER_ROLES.USER);

    // Total drivers
    const { count: totalDrivers } = await supabase
      .from(TABLES.DRIVERS)
      .select('*', { count: 'exact', head: true });

    // Total events
    const { count: totalEvents } = await supabase
      .from(TABLES.CLEANUP_EVENTS)
      .select('*', { count: 'exact', head: true });

    // Upcoming events
    const { count: upcomingEvents } = await supabase
      .from(TABLES.CLEANUP_EVENTS)
      .select('*', { count: 'exact', head: true })
      .eq('status', EVENT_STATUS.UPCOMING);

    // Total waste reports
    const { count: totalReports } = await supabase
      .from(TABLES.WASTE_REPORTS)
      .select('*', { count: 'exact', head: true });

    // Pending reports
    const { count: pendingReports } = await supabase
      .from(TABLES.WASTE_REPORTS)
      .select('*', { count: 'exact', head: true })
      .eq('status', REPORT_STATUS.PENDING);

    // Completed reports
    const { count: completedReports } = await supabase
      .from(TABLES.WASTE_REPORTS)
      .select('*', { count: 'exact', head: true })
      .eq('status', REPORT_STATUS.COMPLETED);

    // Total vehicles
    const { count: totalVehicles } = await supabase
      .from(TABLES.VEHICLES)
      .select('*', { count: 'exact', head: true });

    // Active vehicles
    const { count: activeVehicles } = await supabase
      .from(TABLES.VEHICLES)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active');

    // Total event participants
    const { count: totalParticipants } = await supabase
      .from(TABLES.EVENT_PARTICIPANTS)
      .select('*', { count: 'exact', head: true });

    // Reports by category
    const { data: reportsData } = await supabase
      .from(TABLES.WASTE_REPORTS)
      .select('waste_type');

    const reportsByCategory = (reportsData || []).reduce((acc, report) => {
      const type = report.waste_type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Collection trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: trendData } = await supabase
      .from(TABLES.WASTE_REPORTS)
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString());

    const trends = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      trends[key] = 0;
    }

    (trendData || []).forEach(report => {
      const key = new Date(report.created_at).toISOString().slice(0, 10);
      if (trends[key] !== undefined) {
        trends[key]++;
      }
    });

    const collectionTrends = Object.entries(trends)
      .map(([date, count]) => ({
        date,
        name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        waste: count
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const stats = {
      users: {
        total: totalUsers || 0,
        drivers: totalDrivers || 0
      },
      events: {
        total: totalEvents || 0,
        upcoming: upcomingEvents || 0
      },
      reports: {
        total: totalReports || 0,
        pending: pendingReports || 0,
        completed: completedReports || 0,
        byCategory: Object.entries(reportsByCategory).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value
        }))
      },
      vehicles: {
        total: totalVehicles || 0,
        active: activeVehicles || 0
      },
      collectionTrends,
      participants: totalParticipants || 0
    };

    return successResponse(res, stats, 'Dashboard statistics retrieved successfully');
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return errorResponse(res, 'Failed to get dashboard statistics', 500);
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from(TABLES.USERS)
      .select('id, full_name, email, phone, location, role, avatar_url, points, created_at', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }

    query = query.order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Get all users error:', error);
      return errorResponse(res, 'Failed to get users', 500);
    }

    const formattedUsers = users.map(user => ({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      role: user.role,
      avatar: user.avatar_url,
      points: user.points,
      createdAt: user.created_at,
      status: 'Active', // Mock data
      reportsSubmitted: Math.floor(Math.random() * 20), // Mock data
      lastLogin: new Date(Date.now() - Math.random() * 10000000000).toISOString(), // Mock data
    }));

    return successResponse(res, {
      users: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    }, 'Users retrieved successfully');
  } catch (error) {
    console.error('Get all users error:', error);
    return errorResponse(res, 'Failed to get users', 500);
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from(TABLES.USERS)
      .select(`
        id, full_name, email, phone, location, role, avatar_url, points, created_at,
        waste_reports (count),
        event_participants (count)
      `)
      .eq('id', id)
      .single();

    if (error || !user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, user, 'User retrieved successfully');
  } catch (error) {
    console.error('Get user by ID error:', error);
    return errorResponse(res, 'Failed to get user', 500);
  }
};

// Create driver account
export const createDriver = async (req, res) => {
  try {
    const { fullName, email, password, phone, vehicleId, licenseNumber } = req.body;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return errorResponse(res, 'User with this email already exists', 409);
    }

    // Validate vehicle availability if vehicleId provided
    let vehicleData = null;
    if (vehicleId) {
      // Check if vehicle exists and is NOT assigned
      const { data: existingAssignment } = await supabaseAdmin
        .from(TABLES.DRIVERS)
        .select('id')
        .eq('vehicle_id', vehicleId)
        .single();
      
      if (existingAssignment) {
        return errorResponse(res, 'Selected vehicle is already assigned to another driver', 400);
      }

      // Get vehicle details to populate redundancy fields (optional, but keeps backward compat)
      const { data: vehicle, error: vehicleError } = await supabaseAdmin
        .from(TABLES.VEHICLES)
        .select('*')
        .eq('id', vehicleId)
        .single();
        
      if (vehicleError || !vehicle) {
        return errorResponse(res, 'Selected vehicle not found', 404);
      }
      vehicleData = vehicle;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with driver role
    const { data: user, error: userError } = await supabaseAdmin
      .from(TABLES.USERS)
      .insert([
        {
          full_name: fullName,
          email,
          password: hashedPassword,
          phone,
          role: USER_ROLES.DRIVER,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error('Create driver user error:', userError);
      return errorResponse(res, 'Failed to create driver account', 500);
    }

    // Create driver profile
    const driverProfile = {
      user_id: user.id,
      full_name: fullName,
      phone,
      license_number: licenseNumber,
      is_available: true,
      created_at: new Date().toISOString()
    };

    if (vehicleId) {
      driverProfile.vehicle_id = vehicleId;
      // Keep these for backward compatibility if other parts of app rely on them
      driverProfile.vehicle_number = vehicleData.registration_number; 
      driverProfile.vehicle_type = vehicleData.type;
    } else {
       // Fallback if no vehicle selected (though UI should enforce it)
       driverProfile.vehicle_number = 'N/A'; 
       driverProfile.vehicle_type = 'N/A';
    }

    const { data: driver, error: driverError } = await supabaseAdmin
      .from(TABLES.DRIVERS)
      .insert([driverProfile])
      .select()
      .single();

    if (driverError) {
      console.error('Create driver profile error:', driverError);
      // Rollback user creation
      await supabaseAdmin.from(TABLES.USERS).delete().eq('id', user.id);
      return errorResponse(res, 'Failed to create driver profile', 500);
    }

    delete user.password;

    return successResponse(res, { user, driver }, 'Driver account created successfully', 201);
  } catch (error) {
    console.error('Create driver error:', error);
    return errorResponse(res, 'Failed to create driver account', 500);
  }
};

// Get all drivers
export const getAllDrivers = async (req, res) => {
  try {
    const { isAvailable, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from(TABLES.DRIVERS)
      .select(`
        *,
        users (
          id,
          email,
          points
        )
      `, { count: 'exact' });

    if (isAvailable !== undefined) {
      query = query.eq('is_available', isAvailable === 'true');
    }

    query = query.order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: drivers, error, count } = await query;

    if (error) {
      console.error('Get all drivers error:', error);
      return errorResponse(res, 'Failed to get drivers', 500);
    }

    return successResponse(res, {
      drivers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    }, 'Drivers retrieved successfully');
  } catch (error) {
    console.error('Get all drivers error:', error);
    return errorResponse(res, 'Failed to get drivers', 500);
  }
};

// Assign driver to waste report
export const assignDriver = async (req, res) => {
  try {
    const { reportId, driverId } = req.body;

    // Check if report exists and is pending
    const { data: report, error: reportError } = await supabase
      .from(TABLES.WASTE_REPORTS)
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return errorResponse(res, 'Report not found', 404);
    }

    if (report.status !== REPORT_STATUS.PENDING) {
      return errorResponse(res, 'Report is not pending', 400);
    }

    // Check if driver exists
    const { data: driver, error: driverError } = await supabase
      .from(TABLES.DRIVERS)
      .select('*')
      .eq('id', driverId)
      .single();

    if (driverError || !driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    // Create assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from(TABLES.DRIVER_ASSIGNMENTS)
      .insert([
        {
          driver_id: driverId,
          report_id: reportId,
          status: 'pending',
          assigned_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (assignmentError) {
      console.error('Assign driver error:', assignmentError);
      return errorResponse(res, 'Failed to assign driver', 500);
    }

    // Update report status
    await supabase
      .from(TABLES.WASTE_REPORTS)
      .update({ status: REPORT_STATUS.ASSIGNED })
      .eq('id', reportId);

    return successResponse(res, assignment, 'Driver assigned successfully', 201);
  } catch (error) {
    console.error('Assign driver error:', error);
    return errorResponse(res, 'Failed to assign driver', 500);
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!Object.values(USER_ROLES).includes(role)) {
      return errorResponse(res, 'Invalid role', 400);
    }

    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .update({ role })
      .eq('id', id)
      .select('id, full_name, email, role')
      .single();

    if (error) {
      console.error('Update user role error:', error);
      return errorResponse(res, 'Failed to update user role', 500);
    }

    return successResponse(res, user, 'User role updated successfully');
  } catch (error) {
    console.error('Update user role error:', error);
    return errorResponse(res, 'Failed to update user role', 500);
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from(TABLES.USERS)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete user error:', error);
      return errorResponse(res, 'Failed to delete user', 500);
    }

    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse(res, 'Failed to delete user', 500);
  }
};

// Get recent activities
export const getRecentActivities = async (req, res) => {
  try {
    const {
      limit = 50,
      action,
      entityType,
      entity_type,
      search
    } = req.query;

    const normalizedLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const entityFilter = String(entityType || entity_type || '').trim().toLowerCase();
    const actionFilter = String(action || '').trim().toUpperCase();
    const searchFilter = String(search || '').trim().toLowerCase();

    const queryLimit = Math.max(12, normalizedLimit);

    const [recentReportsResponse, recentAssignmentsResponse, recentParticipantsResponse, recentUsersResponse] = await Promise.all([
      supabaseAdmin
        .from(TABLES.WASTE_REPORTS)
        .select(`
          id,
          location,
          status,
          waste_type,
          description,
          created_at,
          updated_at,
          user_id,
          users (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(queryLimit),
      supabaseAdmin
        .from(TABLES.DRIVER_ASSIGNMENTS)
        .select(`
          id,
          status,
          report_id,
          driver_id,
          assigned_at,
          accepted_at,
          started_at,
          completed_at,
          cancelled_at,
          notes,
          completion_notes,
          cancellation_reason,
          drivers (
            full_name,
            vehicle_number,
            user_id
          ),
          waste_reports (
            id,
            location,
            status,
            waste_type
          )
        `)
        .order('assigned_at', { ascending: false })
        .limit(queryLimit),
      supabaseAdmin
        .from(TABLES.EVENT_PARTICIPANTS)
        .select(`
          id,
          joined_at,
          user_id,
          users (
            full_name,
            email
          ),
          cleanup_events (
            id,
            title,
            status
          )
        `)
        .order('joined_at', { ascending: false })
        .limit(queryLimit),
      supabaseAdmin
        .from(TABLES.USERS)
        .select(`
          id,
          full_name,
          email,
          role,
          created_at
        `)
        .in('role', [USER_ROLES.ADMIN, USER_ROLES.DRIVER])
        .order('created_at', { ascending: false })
        .limit(queryLimit)
    ]);

    const { data: recentReports, error: reportsError } = recentReportsResponse;
    const { data: recentAssignments, error: assignmentsError } = recentAssignmentsResponse;
    const { data: recentParticipants, error: participantsError } = recentParticipantsResponse;
    const { data: recentUsers, error: usersError } = recentUsersResponse;

    if (reportsError || assignmentsError || participantsError || usersError) {
      console.error('Get recent activities query error:', {
        reportsError,
        assignmentsError,
        participantsError,
        usersError
      });
      return errorResponse(res, 'Failed to get recent activities', 500);
    }

    const reportActivities = (recentReports || []).map((report) => ({
      id: `report-created-${report.id}`,
      sourceId: report.id,
      type: 'report',
      action: 'CREATE',
      entityType: 'Report',
      entityId: report.id,
      actor: {
        id: report.user_id,
        name: report.users?.full_name || 'Unknown user',
        email: report.users?.email || null
      },
      target: {
        title: report.location || 'Waste report',
        subtitle: report.waste_type || null
      },
      status: report.status || 'pending',
      timestamp: report.created_at,
      description: `${report.users?.full_name || 'A user'} reported waste at ${report.location || 'an unspecified location'}`,
      metadata: {
        wasteType: report.waste_type || null,
        description: report.description || null,
        updatedAt: report.updated_at || null
      }
    }));

    const assignmentActivities = (recentAssignments || []).flatMap((assignment) => {
      const driverName = assignment.drivers?.full_name || 'Assigned driver';
      const location = assignment.waste_reports?.location || 'assigned report';

      const baseRecord = {
        sourceId: assignment.id,
        type: 'assignment',
        entityType: 'Assignment',
        entityId: assignment.id,
        actor: {
          id: assignment.drivers?.user_id || assignment.driver_id,
          name: driverName,
          email: null
        },
        target: {
          title: location,
          subtitle: assignment.waste_reports?.waste_type || null
        },
        status: assignment.status || null,
        metadata: {
          reportId: assignment.report_id,
          driverId: assignment.driver_id,
          notes: assignment.notes || null,
          completionNotes: assignment.completion_notes || null,
          cancellationReason: assignment.cancellation_reason || null,
          vehicleNumber: assignment.drivers?.vehicle_number || null
        }
      };

      return [
        assignment.assigned_at ? {
          ...baseRecord,
          id: `assignment-created-${assignment.id}`,
          action: 'ASSIGN',
          timestamp: assignment.assigned_at,
          description: `${driverName} was assigned to ${location}`
        } : null,
        assignment.accepted_at ? {
          ...baseRecord,
          id: `assignment-accepted-${assignment.id}`,
          action: 'ACCEPT',
          timestamp: assignment.accepted_at,
          description: `${driverName} accepted assignment for ${location}`
        } : null,
        assignment.started_at ? {
          ...baseRecord,
          id: `assignment-started-${assignment.id}`,
          action: 'START',
          timestamp: assignment.started_at,
          description: `${driverName} started collection at ${location}`
        } : null,
        assignment.completed_at ? {
          ...baseRecord,
          id: `assignment-completed-${assignment.id}`,
          action: 'COMPLETE',
          timestamp: assignment.completed_at,
          description: `${driverName} completed collection at ${location}`
        } : null,
        assignment.cancelled_at ? {
          ...baseRecord,
          id: `assignment-cancelled-${assignment.id}`,
          action: 'CANCEL',
          timestamp: assignment.cancelled_at,
          description: `${driverName} cancelled assignment for ${location}`
        } : null
      ].filter(Boolean);
    });

    const participantActivities = (recentParticipants || []).map((participant) => ({
      id: `event-join-${participant.id}`,
      sourceId: participant.id,
      type: 'event_participant',
      action: 'JOIN',
      entityType: 'Event',
      entityId: participant.cleanup_events?.id || participant.id,
      actor: {
        id: participant.user_id,
        name: participant.users?.full_name || 'Unknown participant',
        email: participant.users?.email || null
      },
      target: {
        title: participant.cleanup_events?.title || 'Cleanup event',
        subtitle: participant.cleanup_events?.status || null
      },
      status: participant.cleanup_events?.status || null,
      timestamp: participant.joined_at,
      description: `${participant.users?.full_name || 'A user'} joined ${participant.cleanup_events?.title || 'a cleanup event'}`,
      metadata: {}
    }));

    const userActivities = (recentUsers || []).map((user) => ({
      id: `user-created-${user.id}`,
      sourceId: user.id,
      type: 'user',
      action: 'CREATE',
      entityType: user.role === USER_ROLES.DRIVER ? 'Driver' : 'Admin',
      entityId: user.id,
      actor: {
        id: user.id,
        name: user.full_name || 'Unknown user',
        email: user.email || null
      },
      target: {
        title: user.full_name || user.email || 'System user',
        subtitle: user.role || null
      },
      status: user.role || null,
      timestamp: user.created_at,
      description: `${user.full_name || user.email || 'A user'} account was created with role ${user.role || 'unknown'}`,
      metadata: {
        email: user.email || null,
        role: user.role || null
      }
    }));

    const activities = [
      ...reportActivities,
      ...assignmentActivities,
      ...participantActivities,
      ...userActivities
    ]
      .filter((activity) => activity.timestamp)
      .filter((activity) => !actionFilter || activity.action === actionFilter)
      .filter((activity) => !entityFilter || String(activity.entityType || '').toLowerCase() === entityFilter)
      .filter((activity) => {
        if (!searchFilter) return true;

        const haystack = [
          activity.description,
          activity.actor?.name,
          activity.actor?.email,
          activity.target?.title,
          activity.target?.subtitle,
          activity.entityId,
          activity.status,
          activity.action,
          activity.entityType
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(searchFilter);
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, normalizedLimit);

    return successResponse(res, activities, 'Recent activities retrieved successfully');
  } catch (error) {
    console.error('Get recent activities error:', error);
    return errorResponse(res, 'Failed to get recent activities', 500);
  }
};

export default {
  getDashboardStats,
  getAllUsers,
  getUserById,
  createDriver,
  getAllDrivers,
  assignDriver,
  updateUserRole,
  deleteUser,
  getRecentActivities
};
