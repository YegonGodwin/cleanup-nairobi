import { supabaseAdmin } from '../config/supabase.js';
import { TABLES, USER_ROLES } from '../config/database.js';

// Notification types
export const NOTIFICATION_TYPES = {
  REPORT_CREATED: 'report_created',
  REPORT_ASSIGNED: 'report_assigned',
  TASK_ASSIGNED: 'task_assigned',
  STATUS_UPDATE: 'status_update',
  TASK_ACCEPTED: 'task_accepted',
  TASK_STARTED: 'task_started',
  TASK_COMPLETED: 'task_completed',
  TASK_OVERDUE: 'task_overdue',
  DRIVER_JOINED: 'driver_joined',
  SYSTEM_ALERT: 'system_alert',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked'
};

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Engaging message templates
export const MESSAGE_TEMPLATES = {
  REPORT_CREATED: {
    title: '🚨 New Waste Report Alert',
    getMessage: (user, report) => `${user.full_name} spotted waste that needs attention! 📍 Location: ${report.location} | Type: ${report.waste_type}${report.urgency === 'high' ? ' ⚠️ HIGH PRIORITY' : ''}`,
    priority: NOTIFICATION_PRIORITIES.HIGH
  },
  TASK_ACCEPTED: {
    title: '✅ Task Accepted - Action in Motion!',
    getMessage: (driver, report) => `Great news! Driver ${driver.full_name} is on the case! 🚛 They've accepted the waste collection at ${report.location}. ETA coming soon!`,
    priority: NOTIFICATION_PRIORITIES.MEDIUM
  },
  TASK_STARTED: {
    title: '🚀 Collection in Progress',
    getMessage: (driver, report) => `${driver.full_name} has arrived and started cleaning up ${report.location}! 💪 Real-time impact happening now!`,
    priority: NOTIFICATION_PRIORITIES.MEDIUM
  },
  TASK_COMPLETED: {
    title: '🎉 Mission Accomplished!',
    getMessage: (driver, report, details) => `Success! ${driver.full_name} has completed waste collection at ${report.location}! 🌟 ${details?.weight ? `Collected: ${details.weight}kg` : ''} Another step towards a cleaner Nairobi!`,
    priority: NOTIFICATION_PRIORITIES.HIGH
  },
  TASK_OVERDUE: {
    title: '⏰ Task Needs Attention',
    getMessage: (report, hoursOverdue) => `Heads up! The waste collection at ${report.location} is ${hoursOverdue} hours overdue. Time to check in with the assigned driver! 🔔`,
    priority: NOTIFICATION_PRIORITIES.URGENT
  },
  DRIVER_JOINED: {
    title: '👋 New Team Member!',
    getMessage: (driver) => `Welcome ${driver.full_name} to the CleanUp Nairobi team! 🚛 Our fleet just got stronger. Let's make Nairobi cleaner together!`,
    priority: NOTIFICATION_PRIORITIES.LOW
  },
  ACHIEVEMENT_UNLOCKED: {
    title: '🏆 Achievement Unlocked!',
    getMessage: (achievement, user) => `${user.full_name} just earned "${achievement.name}"! 🌟 ${achievement.description}`,
    priority: NOTIFICATION_PRIORITIES.LOW
  }
};

/**
 * Create a notification for a specific user
 * @param {string} userId - The user ID to send notification to
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {string} priority - Notification priority
 * @param {string} relatedReportId - Optional related report ID
 * @param {string} relatedAssignmentId - Optional related assignment ID
 * @param {Object} metadata - Optional additional metadata
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (userId, title, message, type, priority = NOTIFICATION_PRIORITIES.MEDIUM, relatedReportId = null, relatedAssignmentId = null, metadata = {}) => {
  try {
    // Base notification data that always exists
    const notificationData = {
      user_id: userId,
      title,
      message,
      type,
      is_read: false
    };

    // Try to add enhanced fields if they exist in the database
    try {
      notificationData.priority = priority;
      notificationData.related_report_id = relatedReportId;
      notificationData.related_assignment_id = relatedAssignmentId;
      notificationData.metadata = JSON.stringify(metadata);
    } catch (enhancedError) {
      console.log('📝 Using basic notification structure (enhanced fields not available)');
    }

    console.log('🔧 Creating notification:', notificationData);

    const { data, error } = await supabaseAdmin
      .from(TABLES.NOTIFICATIONS)
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      // If enhanced fields caused the error, try with basic fields only
      if (error.message.includes('column') && (notificationData.priority || notificationData.metadata)) {
        console.log('🔄 Retrying with basic notification structure...');
        
        const basicNotificationData = {
          user_id: userId,
          title,
          message,
          type,
          is_read: false
        };

        const { data: basicData, error: basicError } = await supabaseAdmin
          .from(TABLES.NOTIFICATIONS)
          .insert(basicNotificationData)
          .select()
          .single();

        if (basicError) {
          console.error('❌ Error creating basic notification:', basicError);
          throw basicError;
        }

        console.log('✅ Successfully created basic notification:', basicData);
        return basicData;
      }

      console.error('❌ Error creating notification:', error);
      throw error;
    }

    console.log('✅ Successfully created enhanced notification:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in createNotification:', error);
    throw error;
  }
};

/**
 * Create notifications for all admin users
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {string} priority - Notification priority
 * @param {string} relatedReportId - Optional related report ID
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<Array>} Array of created notifications
 */
export const createAdminNotifications = async (title, message, type, priority = NOTIFICATION_PRIORITIES.MEDIUM, relatedReportId = null, metadata = {}) => {
  try {
    console.log('🔍 Looking for admin users with role:', USER_ROLES.ADMIN);
    
    // Get all admin users - try both lowercase and capitalized
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('id, role, full_name')
      .or(`role.eq.${USER_ROLES.ADMIN},role.eq.Admin`);

    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError);
      throw adminError;
    }

    console.log('👥 Found users:', adminUsers);

    if (!adminUsers || adminUsers.length === 0) {
      console.log('⚠️ No admin users found! Checking all users...');
      
      // Debug: Check what users exist
      const { data: allUsers, error: allUsersError } = await supabaseAdmin
        .from(TABLES.USERS)
        .select('id, role, full_name')
        .limit(10);
        
      console.log('📋 All users in database:', allUsers);
      return [];
    }

    console.log(`🚨 Creating engaging notifications for ${adminUsers.length} admin users:`, adminUsers.map(u => u.full_name));

    // Create notifications for all admin users with enhanced fields if available
    const notifications = adminUsers.map(admin => {
      const notification = {
        user_id: admin.id,
        title,
        message,
        type,
        is_read: false
      };

      // Try to add enhanced fields
      try {
        notification.priority = priority;
        notification.related_report_id = relatedReportId;
        notification.metadata = JSON.stringify(metadata);
      } catch (enhancedError) {
        // Enhanced fields not available, use basic structure
      }

      return notification;
    });

    const { data, error } = await supabaseAdmin
      .from(TABLES.NOTIFICATIONS)
      .insert(notifications)
      .select();

    if (error) {
      console.error('Error creating admin notifications:', error);
      throw error;
    }

    console.log(`Successfully created ${data.length} engaging admin notifications`);
    return data;
  } catch (error) {
    console.error('Error in createAdminNotifications:', error);
    throw error;
  }
};

/**
 * Create notification for new waste report submission
 * @param {Object} report - The waste report object
 * @param {Object} user - The user who submitted the report
 * @returns {Promise<Array>} Array of created notifications
 */
export const createNewReportNotifications = async (report, user) => {
  try {
    console.log('🚨 Creating new report notifications...');
    console.log('📋 Report data:', { id: report.id, location: report.location, waste_type: report.waste_type });
    console.log('👤 User data:', { id: user.id, full_name: user.full_name, role: user.role });
    
    const template = MESSAGE_TEMPLATES.REPORT_CREATED;
    const title = template.title;
    const message = template.getMessage(user, report);
    const priority = template.priority;
    
    console.log('💬 Notification message:', message);
    
    const metadata = {
      user_name: user.full_name,
      location: report.location,
      waste_type: report.waste_type,
      urgency: report.urgency,
      coordinates: report.coordinates,
      timestamp: new Date().toISOString()
    };
    
    const result = await createAdminNotifications(
      title,
      message,
      NOTIFICATION_TYPES.REPORT_CREATED,
      priority,
      report.id,
      metadata
    );
    
    console.log('✅ Notification creation result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error creating new report notifications:', error);
    throw error;
  }
};

/**
 * Create notification for driver when assigned a task
 * @param {Object} assignment - The driver assignment object
 * @param {Object} report - The waste report object
 * @param {Object} driver - The driver object
 * @returns {Promise<Object>} Created notification
 */
export const createTaskAssignmentNotification = async (assignment, report, driver) => {
  try {
    const title = 'New Task Assigned';
    const message = `You have been assigned a new waste collection task at ${report.location}. Waste type: ${report.waste_type}`;
    
    return await createNotification(
      driver.user_id,
      title,
      message,
      NOTIFICATION_TYPES.TASK_ASSIGNED,
      report.id,
      assignment.id
    );
  } catch (error) {
    console.error('Error creating task assignment notification:', error);
    throw error;
  }
};

/**
 * Create notification for task status updates
 * @param {string} userId - User ID to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} reportId - Related report ID
 * @param {string} assignmentId - Related assignment ID
 * @returns {Promise<Object>} Created notification
 */
export const createTaskStatusNotification = async (userId, title, message, reportId, assignmentId) => {
  try {
    return await createNotification(
      userId,
      title,
      message,
      NOTIFICATION_TYPES.STATUS_UPDATE,
      reportId,
      assignmentId
    );
  } catch (error) {
    console.error('Error creating task status notification:', error);
    throw error;
  }
};

/**
 * Create notification when driver accepts a task
 * @param {Object} assignment - The driver assignment object
 * @param {Object} report - The waste report object
 * @param {Object} driver - The driver object
 * @returns {Promise<Array>} Array of created notifications (for user and admins)
 */
export const createTaskAcceptedNotifications = async (assignment, report, driver) => {
  try {
    const notifications = [];
    const template = MESSAGE_TEMPLATES.TASK_ACCEPTED;
    
    // Notify the user who submitted the report
    const userTitle = template.title;
    const userMessage = template.getMessage(driver, report);
    
    const userMetadata = {
      driver_name: driver.full_name,
      driver_phone: driver.phone,
      location: report.location,
      accepted_at: new Date().toISOString(),
      estimated_arrival: assignment.estimated_arrival
    };
    
    const userNotification = await createNotification(
      report.user_id,
      userTitle,
      userMessage,
      NOTIFICATION_TYPES.TASK_ACCEPTED,
      template.priority,
      report.id,
      assignment.id,
      userMetadata
    );
    notifications.push(userNotification);
    
    // Notify admins
    const adminTitle = template.title;
    const adminMessage = template.getMessage(driver, report);
    
    const adminMetadata = {
      ...userMetadata,
      assignment_id: assignment.id,
      driver_id: driver.id,
      report_urgency: report.urgency
    };
    
    const adminNotifications = await createAdminNotifications(
      adminTitle,
      adminMessage,
      NOTIFICATION_TYPES.TASK_ACCEPTED,
      template.priority,
      report.id,
      adminMetadata
    );
    notifications.push(...adminNotifications);
    
    return notifications;
  } catch (error) {
    console.error('Error creating task accepted notifications:', error);
    throw error;
  }
};

/**
 * Create notification when driver starts a task
 * @param {Object} assignment - The driver assignment object
 * @param {Object} report - The waste report object
 * @param {Object} driver - The driver object
 * @returns {Promise<Array>} Array of created notifications (for user and admins)
 */
export const createTaskStartedNotifications = async (assignment, report, driver) => {
  try {
    const notifications = [];
    const template = MESSAGE_TEMPLATES.TASK_STARTED;
    
    // Notify the user who submitted the report
    const userTitle = template.title;
    const userMessage = template.getMessage(driver, report);
    
    const userMetadata = {
      driver_name: driver.full_name,
      location: report.location,
      started_at: new Date().toISOString(),
      live_tracking: true
    };
    
    const userNotification = await createNotification(
      report.user_id,
      userTitle,
      userMessage,
      NOTIFICATION_TYPES.TASK_STARTED,
      template.priority,
      report.id,
      assignment.id,
      userMetadata
    );
    notifications.push(userNotification);
    
    // Notify admins
    const adminTitle = template.title;
    const adminMessage = template.getMessage(driver, report);
    
    const adminMetadata = {
      ...userMetadata,
      assignment_id: assignment.id,
      driver_id: driver.id,
      response_time: assignment.accepted_at ? 
        Math.round((new Date() - new Date(assignment.accepted_at)) / (1000 * 60)) : null // minutes
    };
    
    const adminNotifications = await createAdminNotifications(
      adminTitle,
      adminMessage,
      NOTIFICATION_TYPES.TASK_STARTED,
      template.priority,
      report.id,
      adminMetadata
    );
    notifications.push(...adminNotifications);
    
    return notifications;
  } catch (error) {
    console.error('Error creating task started notifications:', error);
    throw error;
  }
};

/**
 * Create notification when driver completes a task
 * @param {Object} assignment - The driver assignment object
 * @param {Object} report - The waste report object
 * @param {Object} driver - The driver object
 * @param {Object} completionDetails - Task completion details
 * @returns {Promise<Array>} Array of created notifications (for user and admins)
 */
export const createTaskCompletedNotifications = async (assignment, report, driver, completionDetails = {}) => {
  try {
    const notifications = [];
    const template = MESSAGE_TEMPLATES.TASK_COMPLETED;
    
    // Notify the user who submitted the report
    const userTitle = template.title;
    const userMessage = template.getMessage(driver, report, completionDetails);
    
    const userMetadata = {
      driver_name: driver.full_name,
      location: report.location,
      completion_time: new Date().toISOString(),
      completion_notes: completionDetails.completion_notes,
      completion_image: completionDetails.completion_image_url,
      weight_collected: completionDetails.weight
    };
    
    const userNotification = await createNotification(
      report.user_id,
      userTitle,
      userMessage,
      NOTIFICATION_TYPES.TASK_COMPLETED,
      template.priority,
      report.id,
      assignment.id,
      userMetadata
    );
    notifications.push(userNotification);
    
    // Notify admins with detailed info
    const adminTitle = template.title;
    const adminMessage = template.getMessage(driver, report, completionDetails);
    
    const adminMetadata = {
      ...userMetadata,
      assignment_id: assignment.id,
      task_duration: assignment.started_at ? 
        Math.round((new Date() - new Date(assignment.started_at)) / (1000 * 60)) : null, // minutes
      driver_id: driver.id
    };
    
    const adminNotifications = await createAdminNotifications(
      adminTitle,
      adminMessage,
      NOTIFICATION_TYPES.TASK_COMPLETED,
      template.priority,
      report.id,
      adminMetadata
    );
    notifications.push(...adminNotifications);
    
    return notifications;
  } catch (error) {
    console.error('Error creating task completed notifications:', error);
    throw error;
  }
};

/**
 * Create notification for overdue tasks
 * @param {Object} assignment - The overdue assignment
 * @param {Object} report - The waste report object
 * @param {number} hoursOverdue - Hours the task is overdue
 * @returns {Promise<Array>} Array of created notifications
 */
export const createOverdueTaskNotifications = async (assignment, report, hoursOverdue) => {
  try {
    const template = MESSAGE_TEMPLATES.TASK_OVERDUE;
    const title = template.title;
    const message = template.getMessage(report, hoursOverdue);
    
    const metadata = {
      assignment_id: assignment.id,
      location: report.location,
      hours_overdue: hoursOverdue,
      assigned_driver: assignment.driver_id,
      urgency_escalated: hoursOverdue > 24
    };
    
    return await createAdminNotifications(
      title,
      message,
      NOTIFICATION_TYPES.TASK_OVERDUE,
      template.priority,
      report.id,
      metadata
    );
  } catch (error) {
    console.error('Error creating overdue task notifications:', error);
    throw error;
  }
};

/**
 * Create notification for new driver joining
 * @param {Object} driver - The new driver object
 * @returns {Promise<Array>} Array of created notifications
 */
export const createDriverJoinedNotifications = async (driver) => {
  try {
    const template = MESSAGE_TEMPLATES.DRIVER_JOINED;
    const title = template.title;
    const message = template.getMessage(driver);
    
    const metadata = {
      driver_name: driver.full_name,
      driver_id: driver.id,
      joined_at: new Date().toISOString(),
      vehicle_type: driver.vehicle_type
    };
    
    return await createAdminNotifications(
      title,
      message,
      NOTIFICATION_TYPES.DRIVER_JOINED,
      template.priority,
      null,
      metadata
    );
  } catch (error) {
    console.error('Error creating driver joined notifications:', error);
    throw error;
  }
};

/**
 * Create achievement notification
 * @param {Object} user - The user who earned the achievement
 * @param {Object} achievement - The achievement object
 * @returns {Promise<Object>} Created notification
 */
export const createAchievementNotification = async (user, achievement) => {
  try {
    const template = MESSAGE_TEMPLATES.ACHIEVEMENT_UNLOCKED;
    const title = template.title;
    const message = template.getMessage(achievement, user);
    
    const metadata = {
      achievement_name: achievement.name,
      achievement_description: achievement.description,
      earned_at: new Date().toISOString(),
      user_name: user.full_name
    };
    
    return await createNotification(
      user.id,
      title,
      message,
      NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED,
      template.priority,
      null,
      null,
      metadata
    );
  } catch (error) {
    console.error('Error creating achievement notification:', error);
    throw error;
  }
};

/**
 * Create system alert notification
 * @param {string} alertTitle - Alert title
 * @param {string} alertMessage - Alert message
 * @param {string} priority - Alert priority
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Array>} Array of created notifications
 */
export const createSystemAlertNotifications = async (alertTitle, alertMessage, priority = NOTIFICATION_PRIORITIES.HIGH, metadata = {}) => {
  try {
    const title = `🚨 ${alertTitle}`;
    const message = alertMessage;
    
    const alertMetadata = {
      ...metadata,
      alert_type: 'system',
      created_at: new Date().toISOString()
    };
    
    return await createAdminNotifications(
      title,
      message,
      NOTIFICATION_TYPES.SYSTEM_ALERT,
      priority,
      null,
      alertMetadata
    );
  } catch (error) {
    console.error('Error creating system alert notifications:', error);
    throw error;
  }
};

export default {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  MESSAGE_TEMPLATES,
  createNotification,
  createAdminNotifications,
  createNewReportNotifications,
  createTaskAssignmentNotification,
  createTaskStatusNotification,
  createTaskAcceptedNotifications,
  createTaskStartedNotifications,
  createTaskCompletedNotifications,
  createOverdueTaskNotifications,
  createDriverJoinedNotifications,
  createAchievementNotification,
  createSystemAlertNotifications
};