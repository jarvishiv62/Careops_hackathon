// backend/src/modules/conversations/conversations.controller.js
import { asyncHandler } from "../../middlewares/errorHandler.js";
import conversationsService from "./conversations.service.js";

class ConversationsController {
  /**
   * GET /api/conversations
   * Get all conversations
   */
  getConversations = asyncHandler(async (req, res) => {
    const filters = {
      unreadOnly: req.query.unreadOnly === "true",
      status: req.query.status,
      channel: req.query.channel,
      search: req.query.search,
    };

    const conversations = await conversationsService.getConversations(
      req.workspaceId,
      filters,
    );

    res.json({
      success: true,
      data: conversations,
    });
  });

  /**
   * GET /api/conversations/:id
   * Get conversation with all messages
   */
  getConversation = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const conversation = await conversationsService.getConversation(
      id,
      req.workspaceId,
    );

    res.json({
      success: true,
      data: conversation,
    });
  });

  /**
   * GET /api/conversations/contact/:contactId
   * Get conversation by contact ID
   */
  getConversationByContact = asyncHandler(async (req, res) => {
    const { contactId } = req.params;

    const conversation = await conversationsService.getConversationByContact(
      contactId,
      req.workspaceId,
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    res.json({
      success: true,
      data: conversation,
    });
  });

  /**
   * POST /api/conversations/:id/messages
   * Send message (staff reply)
   */
  sendMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content, messageType } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Message content is required",
      });
    }

    const message = await conversationsService.sendMessage(
      id,
      req.workspaceId,
      req.user.id,
      content,
      messageType || "TEXT",
    );

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  });

  /**
   * PATCH /api/conversations/:id/status
   * Update conversation status
   */
  updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required",
      });
    }

    const conversation = await conversationsService.updateConversationStatus(
      id,
      req.workspaceId,
      status,
    );

    res.json({
      success: true,
      message: "Conversation status updated",
      data: conversation,
    });
  });

  /**
   * GET /api/conversations/unread/count
   * Get unread message count
   */
  getUnreadCount = asyncHandler(async (req, res) => {
    const count = await conversationsService.getUnreadCount(req.workspaceId);

    res.json({
      success: true,
      data: { count },
    });
  });
}

export default new ConversationsController();
