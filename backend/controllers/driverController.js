import { supabase, supabaseAdmin } from '../config/supabase.js';
import { TABLES, ASSIGNMENT_STATUS, REPORT_STATUS } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

// Get driver profile
export const getDriverProfile = async (req, res) => {
  try {
    const driverId = req.user.id;

    const { data: driver, error } = await supabase
      .from(TABLES.DRIVERS)
      .select('*')
      .eq('user_id', driverId)
      .single();

    if (error || !driver) {
      return errorResponse(res, 'Driver profile not found', 404);
    }

    return successResponse(res, driver, 'Driver profile retrieved successfully');
  } catch (error) {
    console.error('Get driver profile error:', error);
    return errorResponse(res, 'Failed to get driver profile', 500);
  }
};

// Update driver profile
export const updateDriverProfile = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { vehicleNumber, vehicleType, licenseNumber, isAvailable } = req.body;

    const updateData = {};
    if (vehicleNumber) updateData.vehicle_number = vehicleNumber;
    if (vehicleType) updateData.vehicle_type = vehicleType;
    if (licenseNumber) updateData.license_number = licenseNumber;
    if (typeof isAvailable === 'boolean') updateData.is_available = isAvailable;

    const { data: driver, error } = await supabase
      .from(TABLES.DRIVERS)
      .update(updateData)
      .eq('user_id', driverId)
      .select()
      .single();

    if (error) {
      console.error('Update driver profile error:', error);
      return errorResponse(res, 'Failed to update driver profile', 500);
    }

    return successResponse(res, driver, 'Driver profile updated successfully');
  } catch (error) {
    console.error('Update driver profile error:', error);
    return errorResponse(res, 'Failed to update driver profile', 500);
  }
};

// Get driver assignments
export const getDriverAssignments = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { status } = req.query;

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
          users (
            id,
            full_name,
            phone
          )
        )
      `)
      .eq('driver_id', driverId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('assigned_at', { ascending: false });

    const { data: assignments, error } = await query;

    if (error) {
      console.error('Get driver assignments error:', error);
      return errorResponse(res, 'Failed to get assignments', 500);
    }

    return successResponse(res, assignments, 'Assignments retrieved successfully');
  } catch (error) {
    console.error('Get driver assignments error:', error);
    return errorResponse(res, 'Failed to get assignments', 500);
  }
};

// Accept assignment
export const acceptAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = req.user.id;

    const { data: assignment, error } = await supabase
      .from(TABLES.DRIVER_ASSIGNMENTS)
      .update({
        status: ASSIGNMENT_STATUS.ACCEPTED,
        accepted_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('driver_id', driverId)
      .select()
      .single();

    if (error) {
      console.error('Accept assignment error:', error);
      return errorResponse(res, 'Failed to accept assignment', 500);
    }

    // Update waste report status
    await supabase
      .from(TABLES.WASTE_REPORTS)
      .update({ status: REPORT_STATUS.ASSIGNED })
      .eq('id', assignment.report_id);

    return successResponse(res, assignment, 'Assignment accepted successfully');
  } catch (error) {
    console.error('Accept assignment error:', error);
    return errorResponse(res, 'Failed to accept assignment', 500);
  }
};

// Start assignment
export const startAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = req.user.id;

    const { data: assignment, error } = await supabase
      .from(TABLES.DRIVER_ASSIGNMENTS)
      .update({
        status: ASSIGNMENT_STATUS.IN_PROGRESS,
        started_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('driver_id', driverId)
      .select()
      .single();

    if (error) {
      console.error('Start assignment error:', error);
      return errorResponse(res, 'Failed to start assignment', 500);
    }

    // Update waste report status
    await supabase
      .from(TABLES.WASTE_REPORTS)
      .update({ status: REPORT_STATUS.IN_PROGRESS })
      .eq('id', assignment.report_id);

    return successResponse(res, assignment, 'Assignment started successfully');
  } catch (error) {
    console.error('Start assignment error:', error);
    return errorResponse(res, 'Failed to start assignment', 500);
  }
};

// Complete assignment
export const completeAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = req.user.id;
    const { notes, imageUrl } = req.body;

    const updateData = {
      status: ASSIGNMENT_STATUS.COMPLETED,
      completed_at: new Date().toISOString()
    };

    if (notes) updateData.completion_notes = notes;
    if (imageUrl) updateData.completion_image_url = imageUrl;

    const { data: assignment, error } = await supabase
      .from(TABLES.DRIVER_ASSIGNMENTS)
      .update(updateData)
      .eq('id', id)
      .eq('driver_id', driverId)
      .select()
      .single();

    if (error) {
      console.error('Complete assignment error:', error);
      return errorResponse(res, 'Failed to complete assignment', 500);
    }

    // Update waste report status
    await supabase
      .from(TABLES.WASTE_REPORTS)
      .update({
        status: REPORT_STATUS.COMPLETED,
        completed_at: new Date().toISOString()
      })
      .eq('id', assignment.report_id);

    // Award points to driver
    await supabase.rpc('increment_user_points', {
      user_id: driverId,
      points: 50
    });

    return successResponse(res, assignment, 'Assignment completed successfully');
  } catch (error) {
    console.error('Complete assignment error:', error);
    return errorResponse(res, 'Failed to complete assignment', 500);
  }
};

// Cancel assignment
export const cancelAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = req.user.id;
    const { reason } = req.body;

    const { data: assignment, error } = await supabase
      .from(TABLES.DRIVER_ASSIGNMENTS)
      .update({
        status: ASSIGNMENT_STATUS.CANCELLED,
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('driver_id', driverId)
      .select()
      .single();

    if (error) {
      console.error('Cancel assignment error:', error);
      return errorResponse(res, 'Failed to cancel assignment', 500);
    }

    // Update waste report status back to pending
    await supabase
      .from(TABLES.WASTE_REPORTS)
      .update({ status: REPORT_STATUS.PENDING })
      .eq('id', assignment.report_id);

    return successResponse(res, assignment, 'Assignment cancelled successfully');
  } catch (error) {
    console.error('Cancel assignment error:', error);
    return errorResponse(res, 'Failed to cancel assignment', 500);
  }
};

// Get driver statistics
export const getDriverStats = async (req, res) => {
  try {
    const driverId = req.user.id;

    // Get total assignments
    const { count: totalAssignments } = await supabase
      .from(TABLES.DRIVER_ASSIGNMENTS)
      .select('*', { count: 'exact', head: true })
      .eq('driver_id', driverId);

    // Get completed assignments
    const { count: completedAssignments } = await supabase
      .from(TABLES.DRIVER_ASSIGNMENTS)
      .select('*', { count: 'exact', head: true })
      .eq('driver_id', driverId)
      .eq('status', ASSIGNMENT_STATUS.COMPLETED);

    // Get pending assignments
    const { count: pendingAssignments } = await supabase
      .from(TABLES.DRIVER_ASSIGNMENTS)
      .select('*', { count: 'exact', head: true })
      .eq('driver_id', driverId)
      .in('status', [ASSIGNMENT_STATUS.PENDING, ASSIGNMENT_STATUS.ACCEPTED, ASSIGNMENT_STATUS.IN_PROGRESS]);

    // Get user points
    const { data: user } = await supabase
      .from(TABLES.USERS)
      .select('points')
      .eq('id', driverId)
      .single();

    const stats = {
      totalAssignments: totalAssignments || 0,
      completedAssignments: completedAssignments || 0,
      pendingAssignments: pendingAssignments || 0,
      points: user?.points || 0
    };

    return successResponse(res, stats, 'Driver statistics retrieved successfully');
  } catch (error) {
    console.error('Get driver stats error:', error);
    return errorResponse(res, 'Failed to get driver statistics', 500);
  }
};

// Get driver's assigned vehicle
export const getDriverVehicle = async (req, res) => {
  try {
    const userId = req.user.id;
    const driverId = req.user.driver_id;

    // Use admin client to avoid RLS mismatch and query by driver_id first.
    let driver = null;
    let driverError = null;

    if (driverId) {
      const byDriverId = await supabaseAdmin
        .from(TABLES.DRIVERS)
        .select('id, user_id, vehicle_id, vehicle_number')
        .eq('id', driverId)
        .single();
      driver = byDriverId.data;
      driverError = byDriverId.error;
    }

    // Fallback to user_id lookup for older tokens/records.
    if (!driver && userId) {
      const byUserId = await supabaseAdmin
        .from(TABLES.DRIVERS)
        .select('id, user_id, vehicle_id, vehicle_number')
        .eq('user_id', userId)
        .single();
      driver = byUserId.data;
      driverError = byUserId.error;
    }

    if (driverError && !driver) {
      console.error('Get driver vehicle lookup error:', driverError);
    }

    if (!driver) {
      return successResponse(res, null, 'No vehicle assigned');
    }

    let vehicle = null;

    if (driver.vehicle_id) {
      const byVehicleId = await supabaseAdmin
        .from(TABLES.VEHICLES)
        .select(`
          id,
          registration_number,
          type,
          capacity,
          status,
          purchase_date,
          notes,
          location,
          current_latitude,
          current_longitude,
          collections_today,
          last_updated,
          created_at,
          updated_at
        `)
        .eq('id', driver.vehicle_id)
        .single();

      if (byVehicleId.error) {
        console.error('Get driver vehicle by id error:', byVehicleId.error);
      } else {
        vehicle = byVehicleId.data;
      }
    }

    // Backward-compatible fallback for drivers that only have vehicle_number populated.
    if (!vehicle && driver.vehicle_number && driver.vehicle_number !== 'N/A') {
      const byRegistration = await supabaseAdmin
        .from(TABLES.VEHICLES)
        .select(`
          id,
          registration_number,
          type,
          capacity,
          status,
          purchase_date,
          notes,
          location,
          current_latitude,
          current_longitude,
          collections_today,
          last_updated,
          created_at,
          updated_at
        `)
        .eq('registration_number', driver.vehicle_number)
        .single();

      if (byRegistration.error) {
        console.error('Get driver vehicle by registration error:', byRegistration.error);
      } else {
        vehicle = byRegistration.data;
      }
    }

    if (!vehicle) {
      return successResponse(res, null, 'No vehicle assigned');
    }

    return successResponse(res, vehicle, 'Vehicle retrieved successfully');
  } catch (error) {
    console.error('Get driver vehicle error:', error);
    return errorResponse(res, 'Failed to get assigned vehicle', 500);
  }
};

export default {
  getDriverProfile,
  updateDriverProfile,
  getDriverAssignments,
  acceptAssignment,
  startAssignment,
  completeAssignment,
  cancelAssignment,
  getDriverStats,
  getDriverVehicle
};
