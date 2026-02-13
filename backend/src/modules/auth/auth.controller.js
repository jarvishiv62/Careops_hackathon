// backend/src/modules/auth/auth.controller.js
import { asyncHandler } from "../../middlewares/errorHandler.js";
import authService from "./auth.service.js";

class AuthController {
  /**
   * POST /api/auth/register
   * Register new user and create workspace
   */
  register = asyncHandler(async (req, res) => {
    const data = req.validatedData;

    const result = await authService.register(data);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  });

  /**
   * POST /api/auth/login
   * Login user
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.validatedData;

    const result = await authService.login(email, password);

    res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  });

  /**
   * POST /api/auth/logout
   * Logout user (client-side token removal)
   */
  logout = asyncHandler(async (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    // This endpoint is optional and can be used for logging purposes

    res.json({
      success: true,
      message: "Logout successful",
    });
  });

  /**
   * GET /api/auth/me
   * Get current user profile
   */
  getMe = asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user.id);

    res.json({
      success: true,
      data: user,
    });
  });

  /**
   * PATCH /api/auth/profile
   * Update user profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const { name, email } = req.body;

    const user = await authService.updateProfile(req.user.id, { name, email });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  });

  /**
   * POST /api/auth/change-password
   * Change user password
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    const result = await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword,
    );

    res.json({
      success: true,
      message: result.message,
    });
  });
}

export default new AuthController();
