import prismaService from "../../db/prisma.js";
import eventEmitter from "../../events/eventEmitter.js";
import {
  createValidationError,
  createNotFoundError,
  createConflictError,
} from "../../middlewares/errorHandler.js";

class WorkspaceService {
  async createWorkspace(data, userId) {
    try {
      const {
        name,
        description,
        slug,
        address,
        timezone,
        contactEmail,
        settings,
      } = data;

      // Validate required fields
      if (!name || !slug || !timezone || !contactEmail) {
        throw createValidationError(
          "Name, slug, timezone, and contact email are required",
        );
      }

      // Check if slug is already taken
      const existingWorkspace = await prismaService.client.workspace.findUnique(
        {
          where: { slug },
        },
      );

      if (existingWorkspace) {
        throw createConflictError("Workspace slug already exists");
      }

      // Validate onboarding requirements
      if (!settings || !settings.integrations) {
        throw createValidationError("Communication integrations are required");
      }

      const hasEmailIntegration =
        settings.integrations.email && settings.integrations.email.enabled;
      const hasSmsIntegration =
        settings.integrations.sms && settings.integrations.sms.enabled;

      if (!hasEmailIntegration && !hasSmsIntegration) {
        throw createValidationError(
          "At least one communication channel (Email or SMS) is required",
        );
      }

      // Create workspace
      const workspace = await prismaService.client.workspace.create({
        data: {
          name,
          description,
          slug,
          settings: {
            ...settings,
            address,
            timezone,
            contactEmail,
            isActive: settings.isActive || false, // Will be set to true after onboarding completion
            onboardingCompleted: false,
          },
        },
        include: {
          users: {
            include: {
              user: true,
            },
          },
        },
      });

      // Add creator as owner
      await prismaService.client.workspaceUser.create({
        data: {
          userId,
          workspaceId: workspace.id,
          role: "OWNER",
        },
      });

      // Create default contact form if provided
      if (settings.contactForm) {
        await prismaService.client.form.create({
          data: {
            workspaceId: workspace.id,
            name: settings.contactForm.name,
            description: "Public contact form",
            fields: settings.contactForm.fields,
            isActive: true,
          },
        });
      }

      // Create booking types if provided
      if (settings.bookingTypes && Array.isArray(settings.bookingTypes)) {
        for (const bookingType of settings.bookingTypes) {
          await prismaService.client.booking.create({
            data: {
              workspaceId: workspace.id,
              contactId: null, // Will be set when actual booking is made
              service: bookingType.name,
              startTime: new Date(), // Placeholder
              endTime: new Date(), // Placeholder
              status: "SCHEDULED",
              metadata: {
                duration: bookingType.duration,
                description: bookingType.description,
                isTemplate: true,
              },
            },
          });
        }
      }

      // Get the complete workspace with users
      const completeWorkspace = await prismaService.client.workspace.findUnique(
        {
          where: { id: workspace.id },
          include: {
            users: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
            _count: {
              select: {
                contacts: true,
                conversations: true,
                bookings: true,
                forms: true,
                inventory: true,
                integrations: true,
              },
            },
          },
        },
      );

      eventEmitter.emitWorkspaceCreated(completeWorkspace);

      return completeWorkspace;
    } catch (error) {
      throw error;
    }
  }

  async getWorkspacesByUser(userId) {
    try {
      const workspaces = await prismaService.client.workspaceUser.findMany({
        where: { userId },
        include: {
          workspace: {
            include: {
              _count: {
                select: {
                  contacts: true,
                  conversations: true,
                  bookings: true,
                  forms: true,
                  inventory: true,
                  integrations: true,
                  users: true,
                },
              },
            },
          },
        },
      });

      return workspaces.map((wu) => ({
        ...wu.workspace,
        userRole: wu.role,
        joinedAt: wu.joinedAt,
      }));
    } catch (error) {
      throw error;
    }
  }

  async getWorkspaceById(workspaceId, userId) {
    try {
      // Check if user has access to workspace
      const workspaceUser = await prismaService.client.workspaceUser.findUnique(
        {
          where: {
            userId_workspaceId: {
              userId,
              workspaceId,
            },
          },
        },
      );

      if (!workspaceUser) {
        throw createNotFoundError("Workspace");
      }

      const workspace = await prismaService.client.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              contacts: true,
              conversations: true,
              bookings: true,
              forms: true,
              inventory: true,
              integrations: true,
            },
          },
        },
      });

      if (!workspace) {
        throw createNotFoundError("Workspace");
      }

      return {
        ...workspace,
        userRole: workspaceUser.role,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateWorkspace(workspaceId, data, userId) {
    try {
      // Check if user has permission to update workspace
      const workspaceUser = await prismaService.client.workspaceUser.findUnique(
        {
          where: {
            userId_workspaceId: {
              userId,
              workspaceId,
            },
          },
        },
      );

      if (!workspaceUser || !["OWNER", "ADMIN"].includes(workspaceUser.role)) {
        throw createAuthorizationError(
          "Insufficient permissions to update workspace",
        );
      }

      const { name, description, settings } = data;

      const workspace = await prismaService.client.workspace.update({
        where: { id: workspaceId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(settings && { settings }),
        },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              contacts: true,
              conversations: true,
              bookings: true,
              forms: true,
              inventory: true,
              integrations: true,
            },
          },
        },
      });

      eventEmitter.emitWorkspaceUpdated(workspace);

      return workspace;
    } catch (error) {
      throw error;
    }
  }

  async deleteWorkspace(workspaceId, userId) {
    try {
      // Check if user is owner
      const workspaceUser = await prismaService.client.workspaceUser.findUnique(
        {
          where: {
            userId_workspaceId: {
              userId,
              workspaceId,
            },
          },
        },
      );

      if (!workspaceUser || workspaceUser.role !== "OWNER") {
        throw createAuthorizationError(
          "Only workspace owners can delete workspaces",
        );
      }

      // Delete workspace (cascade will handle related records)
      await prismaService.client.workspace.delete({
        where: { id: workspaceId },
      });

      eventEmitter.emitWorkspaceDeleted(workspaceId);

      return { message: "Workspace deleted successfully" };
    } catch (error) {
      throw error;
    }
  }

  async inviteUserToWorkspace(workspaceId, email, role, userId) {
    try {
      // Check if user has permission to invite
      const workspaceUser = await prismaService.client.workspaceUser.findUnique(
        {
          where: {
            userId_workspaceId: {
              userId,
              workspaceId,
            },
          },
        },
      );

      if (!workspaceUser || !["OWNER", "ADMIN"].includes(workspaceUser.role)) {
        throw createAuthorizationError(
          "Insufficient permissions to invite users",
        );
      }

      // Find or create user
      let user = await prismaService.client.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Create user if doesn't exist
        user = await prismaService.client.user.create({
          data: {
            email,
            name: email.split("@")[0], // Default name from email
            role: "USER",
          },
        });

        eventEmitter.emitUserCreated(user);
      }

      // Check if user is already in workspace
      const existingMembership =
        await prismaService.client.workspaceUser.findUnique({
          where: {
            userId_workspaceId: {
              userId: user.id,
              workspaceId,
            },
          },
        });

      if (existingMembership) {
        throw createConflictError("User is already a member of this workspace");
      }

      // Add user to workspace
      const membership = await prismaService.client.workspaceUser.create({
        data: {
          userId: user.id,
          workspaceId,
          role,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      return membership;
    } catch (error) {
      throw error;
    }
  }

  async removeUserFromWorkspace(workspaceId, targetUserId, userId) {
    try {
      // Check permissions
      const workspaceUser = await prismaService.client.workspaceUser.findUnique(
        {
          where: {
            userId_workspaceId: {
              userId,
              workspaceId,
            },
          },
        },
      );

      if (!workspaceUser) {
        throw createAuthorizationError("Access denied");
      }

      // Can't remove yourself if you're owner
      if (userId === targetUserId && workspaceUser.role === "OWNER") {
        throw createValidationError(
          "Workspace owners cannot remove themselves",
        );
      }

      // Can only remove users if you're owner/admin, or removing yourself
      const targetWorkspaceUser =
        await prismaService.client.workspaceUser.findUnique({
          where: {
            userId_workspaceId: {
              userId: targetUserId,
              workspaceId,
            },
          },
        });

      if (!targetWorkspaceUser) {
        throw createNotFoundError("User in workspace");
      }

      // Check permissions
      if (
        userId !== targetUserId &&
        !["OWNER", "ADMIN"].includes(workspaceUser.role)
      ) {
        throw createAuthorizationError(
          "Insufficient permissions to remove users",
        );
      }

      // Can't remove owners unless you're also an owner
      if (
        targetWorkspaceUser.role === "OWNER" &&
        workspaceUser.role !== "OWNER"
      ) {
        throw createAuthorizationError("Only owners can remove other owners");
      }

      // Remove user
      await prismaService.client.workspaceUser.delete({
        where: {
          userId_workspaceId: {
            userId: targetUserId,
            workspaceId,
          },
        },
      });

      return { message: "User removed from workspace successfully" };
    } catch (error) {
      throw error;
    }
  }

  async updateUserRole(workspaceId, targetUserId, newRole, userId) {
    try {
      // Check permissions
      const workspaceUser = await prismaService.client.workspaceUser.findUnique(
        {
          where: {
            userId_workspaceId: {
              userId,
              workspaceId,
            },
          },
        },
      );

      if (!workspaceUser || !["OWNER", "ADMIN"].includes(workspaceUser.role)) {
        throw createAuthorizationError(
          "Insufficient permissions to update user roles",
        );
      }

      // Get target user
      const targetWorkspaceUser =
        await prismaService.client.workspaceUser.findUnique({
          where: {
            userId_workspaceId: {
              userId: targetUserId,
              workspaceId,
            },
          },
        });

      if (!targetWorkspaceUser) {
        throw createNotFoundError("User in workspace");
      }

      // Can't change role of owners unless you're also an owner
      if (
        targetWorkspaceUser.role === "OWNER" &&
        workspaceUser.role !== "OWNER"
      ) {
        throw createAuthorizationError(
          "Only owners can change roles of other owners",
        );
      }

      // Can't promote someone to owner unless you're an owner
      if (newRole === "OWNER" && workspaceUser.role !== "OWNER") {
        throw createAuthorizationError(
          "Only owners can promote users to owner",
        );
      }

      // Update role
      const updatedMembership = await prismaService.client.workspaceUser.update(
        {
          where: {
            userId_workspaceId: {
              userId: targetUserId,
              workspaceId,
            },
          },
          data: { role: newRole },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      );

      return updatedMembership;
    } catch (error) {
      throw error;
    }
  }

  async getWorkspaceStats(workspaceId, userId) {
    try {
      // Check if user has access to workspace
      const workspaceUser = await prismaService.client.workspaceUser.findUnique(
        {
          where: {
            userId_workspaceId: {
              userId,
              workspaceId,
            },
          },
        },
      );

      if (!workspaceUser) {
        throw createNotFoundError("Workspace");
      }

      const stats = await prismaService.client.workspace.findUnique({
        where: { id: workspaceId },
        select: {
          _count: {
            select: {
              contacts: true,
              conversations: true,
              bookings: true,
              forms: true,
              inventory: true,
              integrations: true,
              users: true,
            },
          },
        },
      });

      return stats._count;
    } catch (error) {
      throw error;
    }
  }
}

export default new WorkspaceService();
