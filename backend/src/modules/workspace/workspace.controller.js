import workspaceService from "./workspace.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

class WorkspaceController {
  // Create a new workspace
  createWorkspace = asyncHandler(async (req, res) => {
    const workspace = await workspaceService.createWorkspace(
      req.body,
      req.user.id,
    );

    res.status(201).json({
      success: true,
      data: workspace,
      message: "Workspace created successfully",
    });
  });

  // Get all workspaces for the current user
  getWorkspaces = asyncHandler(async (req, res) => {
    const workspaces = await workspaceService.getWorkspacesByUser(req.user.id);

    res.json({
      success: true,
      data: workspaces,
      count: workspaces.length,
    });
  });

  // Get a specific workspace by ID
  getWorkspace = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const workspace = await workspaceService.getWorkspaceById(id, req.user.id);

    res.json({
      success: true,
      data: workspace,
    });
  });

  // Update a workspace
  updateWorkspace = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const workspace = await workspaceService.updateWorkspace(
      id,
      req.body,
      req.user.id,
    );

    res.json({
      success: true,
      data: workspace,
      message: "Workspace updated successfully",
    });
  });

  // Delete a workspace
  deleteWorkspace = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await workspaceService.deleteWorkspace(id, req.user.id);

    res.json({
      success: true,
      ...result,
    });
  });

  // Invite a user to workspace
  inviteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { email, role = "MEMBER" } = req.body;

    const membership = await workspaceService.inviteUserToWorkspace(
      id,
      email,
      role,
      req.user.id,
    );

    res.status(201).json({
      success: true,
      data: membership,
      message: "User invited successfully",
    });
  });

  // Remove a user from workspace
  removeUser = asyncHandler(async (req, res) => {
    const { id, userId } = req.params;
    const result = await workspaceService.removeUserFromWorkspace(
      id,
      userId,
      req.user.id,
    );

    res.json({
      success: true,
      ...result,
    });
  });

  // Update user role in workspace
  updateUserRole = asyncHandler(async (req, res) => {
    const { id, userId } = req.params;
    const { role } = req.body;

    const membership = await workspaceService.updateUserRole(
      id,
      userId,
      role,
      req.user.id,
    );

    res.json({
      success: true,
      data: membership,
      message: "User role updated successfully",
    });
  });

  // Get workspace statistics
  getWorkspaceStats = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const stats = await workspaceService.getWorkspaceStats(id, req.user.id);

    res.json({
      success: true,
      data: stats,
    });
  });

  // Get workspace members
  getWorkspaceMembers = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const workspace = await workspaceService.getWorkspaceById(id, req.user.id);

    res.json({
      success: true,
      data: workspace.users,
      count: workspace.users.length,
    });
  });

  // Leave workspace
  leaveWorkspace = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await workspaceService.removeUserFromWorkspace(
      id,
      req.user.id,
      req.user.id,
    );

    res.json({
      success: true,
      ...result,
    });
  });
}

export default new WorkspaceController();
