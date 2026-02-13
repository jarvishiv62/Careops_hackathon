// backend/src/modules/users/users.service.js
import prisma from "../../db/prisma.js";
import { hashPassword } from "../../utils/password.js";
import { generateToken } from "../../utils/jwt.js";
import crypto from "crypto";

class UsersService {
  /**
   * Get all users in workspace
   */
  async getUsers(workspaceId) {
    const users = await prisma.user.findMany({
      where: { workspaceId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users;
  }

  /**
   * Get user by ID
   */
  async getUser(userId, workspaceId) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        workspaceId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Invite staff user
   * In production, this should send an email with invite link
   */
  async inviteUser(workspaceId, data) {
    // Check if email already exists in this workspace
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        workspaceId,
      },
    });

    if (existingUser) {
      throw new Error("User with this email already exists in workspace");
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create user with temporary password
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await hashPassword(tempPassword);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || "STAFF",
        workspaceId,
      },
    });

    // In production, send email with invite link
    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?token=${inviteToken}&userId=${user.id}`;

    console.log(`📧 Invite link for ${data.email}: ${inviteLink}`);

    // TODO: Send email via integration
    // await sendEmail({
    //   to: data.email,
    //   subject: 'You've been invited to join a workspace',
    //   html: `Click here to accept: ${inviteLink}`
    // });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      inviteLink, // Only for development
    };
  }

  /**
   * Accept invite and set password
   */
  async acceptInvite(userId, password) {
    // Hash password
    const hashedPassword = await hashPassword(password);

    // Update user password
    const user = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      include: {
        workspace: true,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      workspace: {
        id: user.workspace.id,
        name: user.workspace.name,
        status: user.workspace.status,
      },
      token,
    };
  }

  /**
   * Update user
   */
  async updateUser(userId, workspaceId, data) {
    // Verify user belongs to workspace
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        workspaceId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return updatedUser;
  }

  /**
   * Delete user
   */
  async deleteUser(userId, workspaceId, requestingUserId) {
    // Prevent self-deletion
    if (userId === requestingUserId) {
      throw new Error("Cannot delete your own account");
    }

    // Verify user belongs to workspace
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        workspaceId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Prevent deleting the only owner
    if (user.role === "OWNER") {
      const ownerCount = await prisma.user.count({
        where: {
          workspaceId,
          role: "OWNER",
        },
      });

      if (ownerCount <= 1) {
        throw new Error("Cannot delete the only owner of the workspace");
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: "User deleted successfully" };
  }
}

export default new UsersService();
