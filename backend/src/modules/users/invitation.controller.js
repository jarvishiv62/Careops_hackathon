// backend/src/modules/users/invitation.controller.js
import invitationService from "./invitation.service.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class InvitationController {
  // Create new invitation
  async createInvitation(req, res) {
    try {
      const { workspaceId } = req;
      const { email, role = "MEMBER", permissions = [] } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: "Email is required",
        });
      }

      const invitation = await invitationService.createInvitation(
        workspaceId,
        req.user.id,
        { email, role, permissions }
      );

      res.status(201).json({
        success: true,
        data: invitation,
        message: "Invitation sent successfully",
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to create invitation",
      });
    }
  }

  // Get pending invitations for workspace
  async getPendingInvitations(req, res) {
    try {
      const { workspaceId } = req;

      const invitations = await invitationService.getPendingInvitations(workspaceId);

      res.json({
        success: true,
        data: invitations,
      });
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch invitations",
      });
    }
  }

  // Accept invitation (public route)
  async acceptInvitation(req, res) {
    try {
      const { token } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      const result = await invitationService.acceptInvitation(token, userId);

      res.json({
        success: true,
        data: result,
        message: "Invitation accepted successfully",
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to accept invitation",
      });
    }
  }

  // Cancel invitation
  async cancelInvitation(req, res) {
    try {
      const { workspaceId } = req;
      const { invitationId } = req.params;

      const result = await invitationService.cancelInvitation(invitationId, workspaceId);

      res.json({
        success: true,
        data: result,
        message: "Invitation cancelled successfully",
      });
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to cancel invitation",
      });
    }
  }

  // Resend invitation
  async resendInvitation(req, res) {
    try {
      const { workspaceId } = req;
      const { invitationId } = req.params;

      const result = await invitationService.resendInvitation(invitationId, workspaceId);

      res.json({
        success: true,
        data: result,
        message: "Invitation resent successfully",
      });
    } catch (error) {
      console.error("Error resending invitation:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to resend invitation",
      });
    }
  }

  // Get invitation details (for validation before accepting)
  async getInvitationDetails(req, res) {
    try {
      const { token } = req.params;

      const invitation = await prisma.invitation.findFirst({
        where: {
          token,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        include: {
          workspace: {
            select: { name: true, description: true },
          },
          inviter: {
            select: { name: true, email: true },
          },
        },
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: "Invitation not found or expired",
        });
      }

      res.json({
        success: true,
        data: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          permissions: invitation.permissions,
          workspace: invitation.workspace,
          invitedBy: invitation.inviter,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (error) {
      console.error("Error fetching invitation details:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch invitation details",
      });
    }
  }
}

export default new InvitationController();
