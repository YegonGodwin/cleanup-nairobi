import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";
import { TABLES, USER_ROLES } from "../config/database.js";

// Verify JWT token and attach user to request
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Get user profile from our custom users table
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.USERS)
      .select("*")
      .eq("id", decoded.userId)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Remove password from user object
    delete profile.password;

    // If user is a driver, get the driver_id from the drivers table
    if (profile.role === USER_ROLES.DRIVER) {
      const { data: driver, error: driverError } = await supabase
        .from(TABLES.DRIVERS)
        .select("id")
        .eq("user_id", profile.id)
        .single();

      if (driverError || !driver) {
        return res.status(401).json({
          success: false,
          message: "Driver details not found for this user",
        });
      }
      
      profile.driver_id = driver.id;
    }

    // Attach user profile to request
    req.user = profile;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication error",
      error: error.message,
    });
  }
};

// Check if user has required role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

// Middleware to check if user is admin
export const isAdmin = authorize(USER_ROLES.ADMIN);

// Middleware to check if user is driver
export const isDriver = authorize(USER_ROLES.DRIVER, USER_ROLES.ADMIN);

// Middleware to check if user is authenticated (any role)
export const isAuthenticated = authenticate;

export default {
  authenticate,
  authorize,
  isAdmin,
  isDriver,
  isAuthenticated,
};
