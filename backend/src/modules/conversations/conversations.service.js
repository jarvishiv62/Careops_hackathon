// backend/src/modules/conversations/conversations.service.js
import { prisma } from "../../db/prisma.js";
import eventEmitter from "../../events/eventEmitter.js";
import {
  getEmailProvider,
  getSMSProvider,
} from "../../integrations/integrationFactory.js";

class ConversationsService {
  /**
   * Get all conversations for workspace
   */
  async getConversations(workspaceId, filters = {}) {
    const where = { workspaceId };

    // Filter by status
    if (filters.status) {
      where.status = filters.status;
    }

    // Filter by channel
    if (filters.channel) {
      where.channel = filters.channel;
    }

    // Filter by search query (contact name or email)
    if (filters.search) {
      where.OR = [
        {
          contact: {
            OR: [
              { firstName: { contains: filters.search, mode: "insensitive" } },
              { lastName: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    // Filter by unread messages
    if (filters.unreadOnly) {
      where.messages = {
        some: {
          senderType: "CONTACT",
        },
      };
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        contact: true,
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Get latest message only for list view
        },
        _count: {
          select: {
            messages: {
              where: {
                senderType: "CONTACT",
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Add unread count to each conversation
    return conversations.map((conv) => ({
      ...conv,
      unreadCount: conv._count.messages,
      lastMessage: conv.messages[0] || null,
      messages: undefined, // Remove messages array, use lastMessage instead
      _count: undefined,
    }));
  }

  /**
   * Get conversation by ID with all messages
   */
  async getConversation(conversationId, workspaceId) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        workspaceId,
      },
      include: {
        contact: true,
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  }

  /**
   * Send message (staff reply)
   */
  async sendMessage(
    conversationId,
    workspaceId,
    staffUserId,
    content,
    messageType = "TEXT",
  ) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        workspaceId,
      },
      include: {
        contact: true,
        workspace: {
          include: {
            users: {
              where: {
                userId: staffUserId,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Create message in database
    const message = await prisma.message.create({
      data: {
        conversationId,
        content,
        senderType: "USER",
        senderId: staffUserId,
        messageType,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
      },
    });

    // Emit staff reply event
    await eventEmitter.emitEvent(
      "message.staffReply",
      workspaceId,
      message.id,
      {
        conversationId,
        staffUserId,
      },
    );

    // Send actual email/SMS via integration
    try {
      await this.sendViaIntegration(conversation, message);
    } catch (error) {
      console.error("Failed to send message via integration:", error);
      // Don't throw error - message is saved even if delivery fails
    }

    return message;
  }

  /**
   * Send message via email or SMS integration
   */
  async sendViaIntegration(conversation, message) {
    const workspaceId = conversation.workspaceId;

    if (conversation.channel === "EMAIL" && conversation.contact.email) {
      // Get email integration
      const emailIntegration = await prisma.integration.findFirst({
        where: {
          workspaceId,
          type: "EMAIL",
          isActive: true,
        },
      });

      if (emailIntegration) {
        const emailProvider = getEmailProvider(emailIntegration);

        await emailProvider.send({
          to: conversation.contact.email,
          subject: `Message from ${conversation.workspace.name || "CareOps"}`,
          html: `
            <p>Hi ${conversation.contact.firstName || "there"},</p>
            <p>${message.content}</p>
            <br>
            <p>Best regards,<br>${conversation.workspace.name || "CareOps Team"}</p>
          `,
          text: message.content,
        });

        console.log(`✅ Email sent to ${conversation.contact.email}`);
      }
    } else if (conversation.channel === "SMS" && conversation.contact.phone) {
      // Get SMS integration
      const smsIntegration = await prisma.integration.findFirst({
        where: {
          workspaceId,
          type: "SMS",
          isActive: true,
        },
      });

      if (smsIntegration) {
        const smsProvider = getSMSProvider(smsIntegration);

        await smsProvider.send({
          to: conversation.contact.phone,
          message: message.content,
        });

        console.log(`✅ SMS sent to ${conversation.contact.phone}`);
      }
    }
  }

  /**
   * Update conversation status
   */
  async updateConversationStatus(conversationId, workspaceId, status) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        workspaceId,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(workspaceId) {
    const count = await prisma.message.count({
      where: {
        conversation: {
          workspaceId,
        },
        senderType: "CONTACT",
      },
    });

    return count;
  }

  /**
   * Get conversation by contact ID
   */
  async getConversationByContact(contactId, workspaceId) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        contactId,
        workspaceId,
      },
      include: {
        contact: true,
        messages: {
          orderBy: {
            sentAt: "asc",
          },
        },
      },
    });

    return conversation;
  }
}

export default new ConversationsService();
