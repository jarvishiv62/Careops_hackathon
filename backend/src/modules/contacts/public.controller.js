import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import eventEmitter from "../../events/eventEmitter.js";

const prisma = new PrismaClient();

class PublicContactController {
  // Public contact form submission (no auth required)
  async submitPublicContact(req, res) {
    try {
      const { workspaceId } = req.params;
      const { firstName, lastName, email, phone, message, company } = req.body;

      // Validate workspace exists and is active
      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          isActive: true,
        },
        include: {
          integrations: {
            where: { isActive: true },
          },
        },
      });

      if (!workspace) {
        return res.status(404).json({
          success: false,
          error: "Workspace not found or inactive",
        });
      }

      // Check if contact already exists
      let contact = await prisma.contact.findFirst({
        where: {
          workspaceId,
          email: email || null,
          phone: phone || null,
        },
      });

      if (!contact) {
        // Create new contact
        contact = await prisma.contact.create({
          data: {
            workspaceId,
            firstName: firstName || "",
            lastName: lastName || "",
            email: email || null,
            phone: phone || null,
            company: company || null,
            tags: ["public-form"],
            customFields: {
              source: "public_contact_form",
              submissionDate: new Date().toISOString(),
            },
          },
        });
      } else {
        // Update existing contact
        contact = await prisma.contact.update({
          where: { id: contact.id },
          data: {
            firstName: firstName || contact.firstName,
            lastName: lastName || contact.lastName,
            company: company || contact.company,
            updatedAt: new Date(),
          },
        });
      }

      // Create conversation
      const conversation = await prisma.conversation.create({
        data: {
          workspaceId,
          contactId: contact.id,
          channel: "EMAIL",
          status: "ACTIVE",
          metadata: {
            source: "public_contact_form",
            originalMessage: message,
          },
        },
      });

      // Create initial message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: message || "New contact form submission",
          senderType: "CONTACT",
          messageType: "TEXT",
          metadata: {
            source: "public_form",
            contactInfo: {
              email,
              phone,
              company,
            },
          },
        },
      });

      // Trigger automation events
      try {
        // Emit contact created event
        eventEmitter.emitContactCreated({
          workspaceId,
          contactId: contact.id,
          conversationId: conversation.id,
          source: "public_contact_form",
          contact: {
            firstName,
            lastName,
            email,
            phone,
            company,
          },
          contactInfo: {
            firstName,
            lastName,
            email,
            phone,
            company,
          },
          workspaceName: workspace.name,
        });
      } catch (automationError) {
        console.error("Automation trigger failed:", automationError);
        // Don't fail the request if automation fails
      }

      res.status(201).json({
        success: true,
        data: {
          contactId: contact.id,
          conversationId: conversation.id,
          message: "Contact form submitted successfully",
        },
      });
    } catch (error) {
      console.error("Error submitting public contact:", error);
      res.status(500).json({
        success: false,
        error: "Failed to submit contact form",
      });
    }
  }

  // Get workspace info for public contact form
  async getWorkspaceInfo(req, res) {
    try {
      const { workspaceId } = req.params;

      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          settings: true,
        },
      });

      if (!workspace) {
        return res.status(404).json({
          success: false,
          error: "Workspace not found or inactive",
        });
      }

      res.json({
        success: true,
        data: workspace,
      });
    } catch (error) {
      console.error("Error fetching workspace info:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch workspace information",
      });
    }
  }
}

export default new PublicContactController();
