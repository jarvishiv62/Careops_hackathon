// backend/src/middlewares/workspace.js
import {
  createAuthorizationError,
  createNotFoundError,
} from "./errorHandler.js";
import { prisma } from "../db/prisma.js";

/**
 * Middleware to extract workspace ID and verify user access
 */
const workspaceMiddleware = async (req, res, next) => {
  try {
    // Get workspace ID from different sources
    let workspaceId = null;

    // 1. Use workspace ID already set by auth middleware (preferred)
    if (req.workspaceId) {
      workspaceId = req.workspaceId;
    }
    // 2. From URL parameter (most common)
    else if (req.params.workspaceId) {
      workspaceId = req.params.workspaceId;
    }
    // 3. From request body (for creation endpoints)
    else if (req.body.workspaceId) {
      workspaceId = req.body.workspaceId;
    }
    // 4. From query parameter
    else if (req.query.workspaceId) {
      workspaceId = req.query.workspaceId;
    }

    if (!workspaceId) {
      // For routes that don't require workspace context, skip verification
      req.workspaceId = null;
      return next();
    }

    // Only verify workspace access if not already verified by auth middleware
    if (!req.userRole) {
      // Verify user has access to this workspace
      const workspaceUser = await prisma.workspaceUser.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.user.id,
            workspaceId: workspaceId,
          },
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
              settings: true,
            },
          },
        },
      });

      if (!workspaceUser) {
        throw createAuthorizationError("Access denied to this workspace");
      }

      // Add workspace context to request
      req.workspaceId = workspaceId;
      req.workspace = workspaceUser.workspace;
      req.userRole = workspaceUser.role;
    } else {
      // Workspace already verified by auth middleware, just get workspace details
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
          id: true,
          name: true,
          slug: true,
          settings: true,
        },
      });

      if (!workspace) {
        throw createNotFoundError("Workspace not found");
      }

      req.workspace = workspace;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require workspace context
 */
const requireWorkspace = (req, res, next) => {
  if (!req.workspaceId) {
    return next(createAuthorizationError("Workspace context required"));
  }
  next();
};

/**
 * Middleware to require specific roles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return next(createAuthorizationError("Insufficient permissions"));
    }
    next();
  };
};

export { workspaceMiddleware, requireWorkspace, requireRole };
