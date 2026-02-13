// backend/src/middlewares/auth.js
import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../db/prisma.js";

/**
 * Authenticate user from JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database with workspace relationships
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        workspaces: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    // Attach user to request
    req.user = user;
    // Get the first workspace (for simplicity, assuming one workspace per user for now)
    if (user.workspaces && user.workspaces.length > 0) {
      req.workspaceId = user.workspaces[0].workspaceId;
      req.userRole = user.workspaces[0].role;
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

/**
 * Require OWNER role
 */
export const requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  if (!req.userRole || req.userRole !== "OWNER") {
    return res.status(403).json({
      success: false,
      error: "Owner access required",
    });
  }

  next();
};

/**
 * Require STAFF or OWNER role
 */
export const requireStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  if (!req.userRole || !["OWNER", "STAFF"].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      error: "Staff access required",
    });
  }

  next();
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (user) {
        req.user = user;
        // Note: We don't set workspaceId here since we don't have the relationship data
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
