import { supabase, supabaseAdmin } from '../config/supabase.js';
import { TABLES } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

// Get all vehicles
export const getAllVehicles = async (req, res) => {
  try {
    const { status, type } = req.query;
    
    // Use admin client to ensure we can read all vehicles regardless of RLS
    let query = supabaseAdmin
      .from(TABLES.VEHICLES)
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data: vehicles, error } = await query;

    if (error) {
      console.error('Get all vehicles error:', error);
      return errorResponse(res, 'Failed to get vehicles', 500);
    }

    return successResponse(res, vehicles, 'Vehicles retrieved successfully');
  } catch (error) {
    console.error('Get all vehicles error:', error);
    return errorResponse(res, 'Failed to get vehicles', 500);
  }
};

// Get vehicle by ID
export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Use admin client
    const { data: vehicle, error } = await supabaseAdmin
      .from(TABLES.VEHICLES)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    return successResponse(res, vehicle, 'Vehicle retrieved successfully');
  } catch (error) {
    console.error('Get vehicle error:', error);
    return errorResponse(res, 'Failed to get vehicle', 500);
  }
};

// Create vehicle
export const createVehicle = async (req, res) => {
  try {
    const { 
      registrationNumber, 
      type, 
      capacity, 
      status, 
      purchaseDate, 
      notes,
      location,
      currentLatitude,
      currentLongitude
    } = req.body;

    // Check if registration number already exists
    const { data: existing } = await supabaseAdmin
      .from(TABLES.VEHICLES)
      .select('id')
      .eq('registration_number', registrationNumber)
      .single();

    if (existing) {
      return errorResponse(res, 'Vehicle with this registration number already exists', 400);
    }

    const newVehicle = {
      registration_number: registrationNumber,
      type,
      capacity: Number(capacity),
      status: status || 'Active',
      purchase_date: purchaseDate,
      notes,
      location,
      current_latitude: currentLatitude,
      current_longitude: currentLongitude
    };

    const { data: vehicle, error } = await supabaseAdmin
      .from(TABLES.VEHICLES)
      .insert(newVehicle)
      .select()
      .single();

    if (error) {
      console.error('Create vehicle error:', error);
      return errorResponse(res, 'Failed to create vehicle', 500);
    }

    return successResponse(res, vehicle, 'Vehicle created successfully', 201);
  } catch (error) {
    console.error('Create vehicle error:', error);
    return errorResponse(res, 'Failed to create vehicle', 500);
  }
};

// Update vehicle
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      registrationNumber, 
      type, 
      capacity, 
      status, 
      purchaseDate, 
      notes,
      location,
      currentLatitude,
      currentLongitude
    } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (registrationNumber) updateData.registration_number = registrationNumber;
    if (type) updateData.type = type;
    if (capacity) updateData.capacity = Number(capacity);
    if (status) updateData.status = status;
    if (purchaseDate) updateData.purchase_date = purchaseDate;
    if (notes) updateData.notes = notes;
    if (location) updateData.location = location;
    if (currentLatitude) updateData.current_latitude = currentLatitude;
    if (currentLongitude) updateData.current_longitude = currentLongitude;

    const { data: vehicle, error } = await supabaseAdmin
      .from(TABLES.VEHICLES)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update vehicle error:', error);
      return errorResponse(res, 'Failed to update vehicle', 500);
    }

    return successResponse(res, vehicle, 'Vehicle updated successfully');
  } catch (error) {
    console.error('Update vehicle error:', error);
    return errorResponse(res, 'Failed to update vehicle', 500);
  }
};

// Delete vehicle
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from(TABLES.VEHICLES)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete vehicle error:', error);
      return errorResponse(res, 'Failed to delete vehicle', 500);
    }

    return successResponse(res, null, 'Vehicle deleted successfully');
  } catch (error) {
    console.error('Delete vehicle error:', error);
    return errorResponse(res, 'Failed to delete vehicle', 500);
  }
};

// Get available vehicles (not assigned to any driver)
export const getAvailableVehicles = async (req, res) => {
  try {
    // First, get all vehicle IDs that are currently assigned to drivers
    const { data: assignedVehicles, error: assignedError } = await supabaseAdmin
      .from(TABLES.DRIVERS)
      .select('vehicle_id')
      .not('vehicle_id', 'is', null);

    if (assignedError) {
      console.error('Get assigned vehicles error:', assignedError);
      return errorResponse(res, 'Failed to check vehicle availability', 500);
    }

    const assignedIds = assignedVehicles.map(v => v.vehicle_id);

    // Then get all vehicles that are NOT in the assigned list
    let query = supabaseAdmin
      .from(TABLES.VEHICLES)
      .select('*')
      .eq('status', 'Active'); // Only active vehicles can be assigned

    if (assignedIds.length > 0) {
      query = query.not('id', 'in', `(${assignedIds.join(',')})`);
    }

    const { data: vehicles, error } = await query;

    if (error) {
      console.error('Get available vehicles error:', error);
      return errorResponse(res, 'Failed to get available vehicles', 500);
    }

    return successResponse(res, vehicles, 'Available vehicles retrieved successfully');
  } catch (error) {
    console.error('Get available vehicles error:', error);
    return errorResponse(res, 'Failed to get available vehicles', 500);
  }
};

export default {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAvailableVehicles
};
