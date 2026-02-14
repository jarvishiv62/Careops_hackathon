// backend/src/routes/publicConversations.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const prisma = new PrismaClient();

// Create new public conversation
router.post('/public', async (req, res) => {
  try {
    const { userName, userEmail, initialMessage } = req.body;

    if (!userName || !userEmail) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }

    // Create a default workspace for public conversations (or use first available)
    let workspace = await prisma.workspace.findFirst({
      where: { isActive: true }
    });

    if (!workspace) {
      return res.status(500).json({
        success: false,
        error: 'No active workspace found'
      });
    }

    // Create contact for the user if doesn't exist
    let contact = await prisma.contact.findFirst({
      where: {
        email: userEmail,
        workspaceId: workspace.id
      }
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          workspaceId: workspace.id,
          firstName: userName.split(' ')[0] || userName,
          lastName: userName.split(' ').slice(1).join(' ') || '',
          email: userEmail,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: workspace.id,
        contactId: contact.id,
        channel: 'CHAT',
        status: 'ACTIVE',
        metadata: {
          isPublic: true,
          userName,
          userEmail
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        contact: true
      }
    });

    // Create initial message if provided
    if (initialMessage) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: initialMessage,
          senderType: 'CONTACT',
          senderId: contact.id,
          messageType: 'TEXT',
          createdAt: new Date()
        }
      });
    }

    // Get all messages for the conversation
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' }
    });

    // Create notification for staff
    await prisma.notification.create({
      data: {
        workspaceId: workspace.id,
        type: 'message',
        title: 'New Public Conversation',
        message: `${userName} (${userEmail}) started a new conversation`,
        data: {
          conversationId: conversation.id,
          userName,
          userEmail,
          isPublic: true
        },
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...conversation,
        messages
      },
      message: 'Conversation started successfully'
    });

  } catch (error) {
    console.error('Error creating public conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start conversation'
    });
  }
});

// Add message to public conversation
router.post('/:conversationId/messages/public', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, senderName, senderEmail } = req.body;

    if (!content || !senderName || !senderEmail) {
      return res.status(400).json({
        success: false,
        error: 'Message content, sender name, and email are required'
      });
    }

    // Verify conversation exists and is public
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        metadata: {
          path: ['isPublic'],
          equals: true
        }
      },
      include: {
        workspace: true,
        contact: true
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        content,
        senderType: 'CONTACT',
        senderId: conversation.contactId,
        messageType: 'TEXT',
        metadata: {
          senderName,
          senderEmail
        },
        createdAt: new Date()
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    // Create notification for staff
    await prisma.notification.create({
      data: {
        workspaceId: conversation.workspaceId,
        type: 'message',
        title: 'New Message in Public Chat',
        message: `${senderName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        data: {
          conversationId,
          senderName,
          senderEmail,
          messageContent: content
        },
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error adding message to public conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// Get public conversation details
router.get('/:conversationId/public', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        metadata: {
          path: ['isPublic'],
          equals: true
        }
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        contact: true
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('Error fetching public conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation'
    });
  }
});

export default router;
