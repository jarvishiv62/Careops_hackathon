// backend/src/modules/users/users.controller.js
import { asyncHandler } from "../../middlewares/errorHandler.js";
import usersService from "./users.service.js";

class UsersController {
  /**
   * GET /api/users
   * Get all users in workspace
   */
  getUsers = asyncHandler(async (req, res) => {
    const users = await usersService.getUsers(req.workspaceId);

    res.json({
      success: true,
      data: users,
    });
  });

  /**
   * GET /api/users/:id
   * Get user by ID
   */
  getUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await usersService.getUser(id, req.workspaceId);

    res.json({
      success: true,
      data: user,
    });
  });

  /**
   * POST /api/users/invite
   * Invite staff user (OWNER only)
   */
  inviteUser = asyncHandler(async (req, res) => {
    const data = req.validatedData;

    const result = await usersService.inviteUser(req.workspaceId, data);

    res.status(201).json({
      success: true,
      message: "User invited successfully",
      data: result,
    });
  });

  /**
   * POST /api/users/accept-invite
   * Accept invite and set password
   */
  acceptInvite = asyncHandler(async (req, res) => {
    const { userId, password } = req.validatedData;

    const result = await usersService.acceptInvite(userId, password);

    res.json({
      success: true,
      message: "Invite accepted successfully",
      data: result,
    });
  });

  /**
   * PATCH /api/users/:id
   * Update user (OWNER only)
   */
  updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, role } = req.body;

    const user = await usersService.updateUser(id, req.workspaceId, {
      name,
      role,
    });

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  });

  /**
   * DELETE /api/users/:id
   * Delete user (OWNER only)
   */
  deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await usersService.deleteUser(
      id,
      req.workspaceId,
      req.user.id,
    );

    res.json({
      success: true,
      message: result.message,
    });
  });
}

export default new UsersController();
