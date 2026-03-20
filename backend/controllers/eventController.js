import { supabase } from '../config/supabase.js';
import { TABLES, EVENT_STATUS } from '../config/database.js';
import { successResponse, errorResponse, paginate } from '../utils/helpers.js';

// Create new cleanup event (Admin only)
export const createEvent = async (req, res) => {
  try {
    const { title, description, location, latitude, longitude, date, startTime, endTime, maxParticipants } = req.body;
    const createdBy = req.user.id;

    const { data: event, error } = await supabase
      .from(TABLES.CLEANUP_EVENTS)
      .insert([
        {
          title,
          description,
          location,
          latitude,
          longitude,
          date,
          start_time: startTime,
          end_time: endTime,
          max_participants: maxParticipants,
          status: EVENT_STATUS.UPCOMING,
          created_by: createdBy,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Create event error:', error);
      return errorResponse(res, 'Failed to create event', 500);
    }

    return successResponse(res, event, 'Event created successfully', 201);
  } catch (error) {
    console.error('Create event error:', error);
    return errorResponse(res, 'Failed to create event', 500);
  }
};

// Get all events with filters
export const getEvents = async (req, res) => {
  try {
    const { status, location, page = 1, limit = 10 } = req.query;
    const { offset, limit: pageLimit } = paginate(parseInt(page), parseInt(limit));

    let query = supabase
      .from(TABLES.CLEANUP_EVENTS)
      .select('*, event_participants(count)', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    // Order by date
    query = query.order('date', { ascending: true });

    // Pagination
    query = query.range(offset, offset + pageLimit - 1);

    const { data: events, error, count } = await query;

    if (error) {
      console.error('Get events error:', error);
      return errorResponse(res, 'Failed to get events', 500);
    }

    return successResponse(res, {
      events,
      pagination: {
        page: parseInt(page),
        limit: pageLimit,
        total: count,
        totalPages: Math.ceil(count / pageLimit)
      }
    }, 'Events retrieved successfully');
  } catch (error) {
    console.error('Get events error:', error);
    return errorResponse(res, 'Failed to get events', 500);
  }
};

// Get single event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: event, error } = await supabase
      .from(TABLES.CLEANUP_EVENTS)
      .select(`
        *,
        event_participants (
          id,
          user_id,
          users (
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !event) {
      return errorResponse(res, 'Event not found', 404);
    }

    return successResponse(res, event, 'Event retrieved successfully');
  } catch (error) {
    console.error('Get event error:', error);
    return errorResponse(res, 'Failed to get event', 500);
  }
};

// Update event (Admin only)
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, latitude, longitude, date, startTime, endTime, maxParticipants, status } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (location) updateData.location = location;
    if (latitude) updateData.latitude = latitude;
    if (longitude) updateData.longitude = longitude;
    if (date) updateData.date = date;
    if (startTime) updateData.start_time = startTime;
    if (endTime) updateData.end_time = endTime;
    if (maxParticipants) updateData.max_participants = maxParticipants;
    if (status) updateData.status = status;

    const { data: event, error } = await supabase
      .from(TABLES.CLEANUP_EVENTS)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update event error:', error);
      return errorResponse(res, 'Failed to update event', 500);
    }

    return successResponse(res, event, 'Event updated successfully');
  } catch (error) {
    console.error('Update event error:', error);
    return errorResponse(res, 'Failed to update event', 500);
  }
};

// Delete event (Admin only)
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from(TABLES.CLEANUP_EVENTS)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete event error:', error);
      return errorResponse(res, 'Failed to delete event', 500);
    }

    return successResponse(res, null, 'Event deleted successfully');
  } catch (error) {
    console.error('Delete event error:', error);
    return errorResponse(res, 'Failed to delete event', 500);
  }
};

// Join event (User)
export const joinEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if event exists and has space
    const { data: event, error: eventError } = await supabase
      .from(TABLES.CLEANUP_EVENTS)
      .select('*, event_participants(count)')
      .eq('id', id)
      .single();

    if (eventError || !event) {
      return errorResponse(res, 'Event not found', 404);
    }

    const participantCount = event.event_participants[0]?.count || 0;

    if (participantCount >= event.max_participants) {
      return errorResponse(res, 'Event is full', 400);
    }

    // Check if user already joined
    const { data: existingParticipant } = await supabase
      .from(TABLES.EVENT_PARTICIPANTS)
      .select('id')
      .eq('event_id', id)
      .eq('user_id', userId)
      .single();

    if (existingParticipant) {
      return errorResponse(res, 'You have already joined this event', 400);
    }

    // Add participant
    const { data: participant, error } = await supabase
      .from(TABLES.EVENT_PARTICIPANTS)
      .insert([
        {
          event_id: id,
          user_id: userId,
          joined_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Join event error:', error);
      return errorResponse(res, 'Failed to join event', 500);
    }

    return successResponse(res, participant, 'Successfully joined event', 201);
  } catch (error) {
    console.error('Join event error:', error);
    return errorResponse(res, 'Failed to join event', 500);
  }
};

// Leave event (User)
export const leaveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from(TABLES.EVENT_PARTICIPANTS)
      .delete()
      .eq('event_id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Leave event error:', error);
      return errorResponse(res, 'Failed to leave event', 500);
    }

    return successResponse(res, null, 'Successfully left event');
  } catch (error) {
    console.error('Leave event error:', error);
    return errorResponse(res, 'Failed to leave event', 500);
  }
};

// Get user's joined events
export const getUserEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: participants, error } = await supabase
      .from(TABLES.EVENT_PARTICIPANTS)
      .select(`
        *,
        cleanup_events (*)
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Get user events error:', error);
      return errorResponse(res, 'Failed to get user events', 500);
    }

    const events = participants.map(p => p.cleanup_events);

    return successResponse(res, events, 'User events retrieved successfully');
  } catch (error) {
    console.error('Get user events error:', error);
    return errorResponse(res, 'Failed to get user events', 500);
  }
};

export default {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  getUserEvents
};
