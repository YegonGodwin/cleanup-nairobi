// Database table names and schema reference
export const TABLES = {
  USERS: "users",
  CLEANUP_EVENTS: "cleanup_events",
  EVENT_PARTICIPANTS: "event_participants",
  WASTE_REPORTS: "waste_reports",
  DRIVERS: "drivers",
  DRIVER_ASSIGNMENTS: "driver_assignments",
  LOCATIONS: "locations",
  NOTIFICATIONS: "notifications",
  REWARDS: "rewards",
  USER_REWARDS: "user_rewards",
  VEHICLES: "vehicles",
};

// User roles
export const USER_ROLES = {
  USER: "user",
  DRIVER: "driver",
  ADMIN: "admin",
};

// Event status
export const EVENT_STATUS = {
  UPCOMING: "upcoming",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Waste report status
export const REPORT_STATUS = {
  PENDING: "pending",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  REJECTED: "rejected",
};

// Driver assignment status
export const ASSIGNMENT_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export default {
  TABLES,
  USER_ROLES,
  EVENT_STATUS,
  REPORT_STATUS,
  ASSIGNMENT_STATUS,
};
