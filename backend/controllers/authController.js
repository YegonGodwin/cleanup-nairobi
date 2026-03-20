import { supabase, supabaseAdmin } from "../config/supabase.js";
import { TABLES, USER_ROLES } from "../config/database.js";
import {
  hashPassword,
  comparePassword,
  generateToken,
  successResponse,
  errorResponse,
} from "../utils/helpers.js";

export const register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      location,
      role = USER_ROLES.USER,
    } = req.body;

    // Check if user already exists using admin client (server-side)
    const { data: existingUser, error: existingError } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing user:", existingError);
      return errorResponse(res, "Failed to validate user", 500);
    }

    if (existingUser) {
      return errorResponse(res, "User with this email already exists", 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user using admin client to ensure insert succeeds regardless of RLS
    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .insert([
        {
          full_name: fullName,
          email,
          password: hashedPassword,
          phone,
          location,
          role,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .maybeSingle();

    if (error) {
      console.error("Registration error:", error);
      return errorResponse(res, "Failed to create user", 500);
    }

    // Generate token
    const token = generateToken(user);

    // Remove password from response and capitalize role for frontend consistency
    delete user.password;
    const formattedUser = {
      ...user,
      role: user.role.charAt(0).toUpperCase() + user.role.slice(1)
    };

    return successResponse(
      res,
      {
        user: formattedUser,
        token,
      },
      "User registered successfully",
      201,
    );
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse(res, "Registration failed", 500);
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    // Find user by email using admin client to bypass RLS
    const { data: users, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("*")
      .eq("email", email);

    console.log('Database query result:', { 
      usersFound: users?.length || 0, 
      error: error?.message 
    });

    const user = users && users.length > 0 ? users[0] : null;

    if (error || !user) {
      console.log('User not found or database error:', error?.message);
      return errorResponse(res, "Invalid email or password", 401);
    }

    console.log('User found:', { id: user.id, email: user.email, role: user.role });

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    console.log('Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return errorResponse(res, "Invalid email or password", 401);
    }

    // Generate token
    const token = generateToken(user);
    console.log('Token generated successfully');

    // Remove password from response and capitalize role for frontend consistency
    delete user.password;
    const formattedUser = {
      ...user,
      role: user.role.charAt(0).toUpperCase() + user.role.slice(1)
    };

    console.log('Login successful for user:', email, 'with role:', formattedUser.role);

    return successResponse(
      res,
      {
        user: formattedUser,
        token,
      },
      "Login successful",
    );
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse(res, "Login failed", 500);
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select(
        "id, full_name, email, phone, location, role, avatar_url, points, created_at",
      )
      .eq("id", userId)
      .single();

    if (error || !user) {
      return errorResponse(res, "User not found", 404);
    }

    // Capitalize role for frontend consistency (same as JWT token)
    const formattedUser = {
      ...user,
      role: user.role.charAt(0).toUpperCase() + user.role.slice(1)
    };

    return successResponse(res, formattedUser, "Profile retrieved successfully");
  } catch (error) {
    console.error("Get profile error:", error);
    return errorResponse(res, "Failed to get profile", 500);
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, phone, location, avatarUrl } = req.body;

    const updateData = {};
    if (fullName) updateData.full_name = fullName;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;
    if (avatarUrl) updateData.avatar_url = avatarUrl;

    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .update(updateData)
      .eq("id", userId)
      .select(
        "id, full_name, email, phone, location, role, avatar_url, points, created_at",
      )
      .single();

    if (error) {
      console.error("Update profile error:", error);
      return errorResponse(res, "Failed to update profile", 500);
    }

    return successResponse(res, user, "Profile updated successfully");
  } catch (error) {
    console.error("Update profile error:", error);
    return errorResponse(res, "Failed to update profile", 500);
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("password")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return errorResponse(res, "User not found", 404);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      return errorResponse(res, "Current password is incorrect", 401);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from(TABLES.USERS)
      .update({ password: hashedPassword })
      .eq("id", userId);

    if (updateError) {
      console.error("Change password error:", updateError);
      return errorResponse(res, "Failed to change password", 500);
    }

    return successResponse(res, null, "Password changed successfully");
  } catch (error) {
    console.error("Change password error:", error);
    return errorResponse(res, "Failed to change password", 500);
  }
};

export default {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
