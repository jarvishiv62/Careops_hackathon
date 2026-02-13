// backend/src/modules/users/invitation.service.js
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import eventEmitter from "../../events/eventEmitter.js";
import notificationService from "../notifications/notification.service.js";

const prisma = new PrismaClient();

class InvitationService {
  constructor() {
    this.invitationExpiryHours = 72; // 3 days
  }

  async createInvitation(workspaceId, inviterId, invitationData) {
    try {
      const { email, role = "MEMBER", permissions = [] } = invitationData;

      // Check if user already exists in workspace
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: {
          workspaces: {
            where: { workspaceId },
          },
        },
      });

      if (existingUser && existingUser.workspaces.length > 0) {
        throw new Error("User is already a member of this workspace");
      }

      // Check if there's already a pending invitation
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          workspaceId,
          email,
          status: "PENDING",
          createdAt: {
            gte: new Date(Date.now() - this.invitationExpiryHours * 60 * 60 * 1000),
          },
        },
      });

      if (existingInvitation) {
        throw new Error("Invitation already sent and is still valid");
      }

      // Create invitation token
      const token = jwt.sign(
        {
          workspaceId,
          email,
          role,
          permissions,
          type: "invitation",
        },
        process.env.JWT_SECRET,
        { expiresIn: `${this.invitationExpiryHours}h` }
      );

      // Store invitation in database
      const invitation = await prisma.invitation.create({
        data: {
          workspaceId,
          email,
          role,
          permissions,
          token,
          status: "PENDING",
          invitedBy: inviterId,
          expiresAt: new Date(Date.now() + this.invitationExpiryHours * 60 * 60 * 1000),
        },
        include: {
          workspace: {
            select: { name: true },
          },
          inviter: {
            select: { name: true, email: true },
          },
        },
      });

      // Get workspace email integration to send invitation
      const emailIntegration = await prisma.integration.findFirst({
        where: {
          workspaceId,
          type: { startsWith: "EMAIL" },
          isActive: true,
        },
      });

      if (emailIntegration) {
        await this.sendInvitationEmail(invitation, emailIntegration);
      } else {
        console.log(`No email integration found for workspace ${workspaceId}`);
      }

      // Send notification to inviter
      await notificationService.sendToUser(inviterId, {
        type: "invitation",
        title: "Invitation Sent",
        message: `Invitation sent to ${email}`,
        data: {
          invitationId: invitation.id,
          email,
        },
      });

      return {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      };
    } catch (error) {
      console.error("Error creating invitation:", error);
      throw error;
    }
  }

  async sendInvitationEmail(invitation, emailIntegration) {
    try {
      // Import here to avoid circular dependencies
      const { getEmailProvider } = await import("../../integrations/integrationFactory.js");
      
      const emailProvider = getEmailProvider(emailIntegration);
      const acceptUrl = `${process.env.FRONTEND_URL}/invite/${invitation.token}`;

      const emailContent = {
        subject: `Invitation to join ${invitation.workspace.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">You're invited!</h2>
            <p>Hi there,</p>
            <p>${invitation.inviter.name} has invited you to join <strong>${invitation.workspace.name}</strong> on CareOps.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Role:</strong> ${invitation.role}</p>
              <p><strong>Invited by:</strong> ${invitation.inviter.name} (${invitation.inviter.email})</p>
            </div>
            
            <p>Click the button below to accept the invitation:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptUrl}" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              This invitation will expire in ${this.invitationExpiryHours} hours.<br>
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        `,
        text: `You've been invited to join ${invitation.workspace.name} by ${invitation.inviter.name}. Role: ${invitation.role}. Accept here: ${acceptUrl}`,
      };

      await emailProvider.send({
        to: invitation.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      console.log(`Invitation email sent to ${invitation.email}`);
    } catch (error) {
      console.error("Error sending invitation email:", error);
      throw error;
    }
  }

  async acceptInvitation(token, userId) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type !== "invitation") {
        throw new Error("Invalid invitation token");
      }

      const { workspaceId, email, role, permissions } = decoded;

      // Check if invitation exists and is valid
      const invitation = await prisma.invitation.findFirst({
        where: {
          workspaceId,
          email,
          token,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
      });

      if (!invitation) {
        throw new Error("Invitation not found or expired");
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.email !== email) {
        throw new Error("User email doesn't match invitation");
      }

      // Add user to workspace
      await prisma.workspaceUser.create({
        data: {
          userId,
          workspaceId,
          role,
          joinedAt: new Date(),
        },
      });

      // Update invitation status
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedBy: userId,
          acceptedAt: new Date(),
        },
      });

      // Emit event for automation
      eventEmitter.emit("user.joined_workspace", {
        workspaceId,
        userId,
        role,
        invitedBy: invitation.invitedBy,
      });

      // Send notification to inviter
      await notificationService.sendToUser(invitation.invitedBy, {
        type: "invitation_accepted",
        title: "Invitation Accepted",
        message: `${user.name} accepted the invitation to join ${decoded.workspaceName || 'your workspace'}`,
        data: {
          userId,
          email,
        },
      });

      return {
        success: true,
        message: "Invitation accepted successfully",
        workspaceId,
        role,
      };
    } catch (error) {
      console.error("Error accepting invitation:", error);
      throw error;
    }
  }

  async getPendingInvitations(workspaceId) {
    try {
      const invitations = await prisma.invitation.findMany({
        where: {
          workspaceId,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        include: {
          inviter: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        permissions: inv.permissions,
        status: inv.status,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        invitedBy: inv.inviter,
      }));
    } catch (error) {
      console.error("Error fetching invitations:", error);
      throw error;
    }
  }

  async cancelInvitation(invitationId, workspaceId) {
    try {
      const invitation = await prisma.invitation.findFirst({
        where: {
          id: invitationId,
          workspaceId,
          status: "PENDING",
        },
      });

      if (!invitation) {
        throw new Error("Invitation not found");
      }

      await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: "CANCELLED" },
      });

      return { success: true, message: "Invitation cancelled" };
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      throw error;
    }
  }

  async resendInvitation(invitationId, workspaceId) {
    try {
      const invitation = await prisma.invitation.findFirst({
        where: {
          id: invitationId,
          workspaceId,
          status: "PENDING",
        },
        include: {
          workspace: { select: { name: true } },
          inviter: { select: { name: true, email: true } },
        },
      });

      if (!invitation) {
        throw new Error("Invitation not found");
      }

      // Update expiration time
      const newExpiresAt = new Date(Date.now() + this.invitationExpiryHours * 60 * 60 * 1000);
      
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { expiresAt: newExpiresAt },
      });

      // Get email integration and resend
      const emailIntegration = await prisma.integration.findFirst({
        where: {
          workspaceId,
          type: { startsWith: "EMAIL" },
          isActive: true,
        },
      });

      if (emailIntegration) {
        await this.sendInvitationEmail(invitation, emailIntegration);
      }

      return { success: true, message: "Invitation resent" };
    } catch (error) {
      console.error("Error resending invitation:", error);
      throw error;
    }
  }
}

export default new InvitationService();
