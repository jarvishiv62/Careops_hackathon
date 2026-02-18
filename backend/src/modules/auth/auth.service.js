// backend/src/modules/auth/auth.service.js
import { prisma } from "../../db/prisma.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { generateToken } from "../../utils/jwt.js";

class AuthService {
  /**
   * Register new user and create workspace
   */
  async register(data) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create workspace and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create workspace
      const workspace = await tx.workspace.create({
        data: {
          name: data.businessName,
          slug:
            data.businessName.toLowerCase().replace(/\s+/g, "-") +
            "-" +
            data.email.split("@")[0],
          description: `Workspace for ${data.businessName}`,
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
        },
      });

      // Create workspace-user relationship
      await tx.workspaceUser.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: "OWNER",
        },
      });

      return { user, workspace };
    });

    // Generate token
    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: "OWNER",
      workspaceId: result.workspace.id,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: "OWNER",
      },
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
      },
      token,
    };
  }

  /**
   * Login user
   */
  async login(email, password) {
    console.log(`🔐 Login attempt for email: ${email}`);

    // Find user with workspace relationships
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        workspaces: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      throw new Error("Invalid email or password");
    }

    // Compare password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      console.log(`❌ Invalid password for: ${email}`);
      throw new Error("Invalid email or password");
    }

    // Get the first workspace and role (for simplicity, assuming one workspace per user for now)
    const workspaceUser = user.workspaces[0];
    if (!workspaceUser) {
      throw new Error("User not associated with any workspace");
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: workspaceUser.role,
      workspaceId: workspaceUser.workspaceId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: workspaceUser.role,
      },
      workspace: {
        id: workspaceUser.workspace.id,
        name: workspaceUser.workspace.name,
      },
      token,
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        workspaces: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Transform response to match expected format
    const workspaceUser = user.workspaces[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: workspaceUser?.role,
      createdAt: user.createdAt,
      workspace: workspaceUser?.workspace,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, data) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return user;
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isValidPassword = await comparePassword(
      currentPassword,
      user.password,
    );

    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: "Password changed successfully" };
  }
}

export default new AuthService();
