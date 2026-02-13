// backend/src/modules/contacts/contacts.controller.js
import { asyncHandler } from "../../middlewares/errorHandler.js";
import contactsService from "./contacts.service.js";

class ContactsController {
  /**
   * GET /api/contacts
   * Get all contacts
   */
  getContacts = asyncHandler(async (req, res) => {
    const filters = {
      search: req.query.search,
    };

    const contacts = await contactsService.getContacts(
      req.workspaceId,
      filters,
    );

    res.json({
      success: true,
      data: contacts,
    });
  });

  /**
   * GET /api/contacts/:id
   * Get contact by ID
   */
  getContact = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const contact = await contactsService.getContact(id, req.workspaceId);

    res.json({
      success: true,
      data: contact,
    });
  });

  /**
   * GET /api/contacts/:id/stats
   * Get contact statistics
   */
  getContactStats = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const stats = await contactsService.getContactStats(id, req.workspaceId);

    res.json({
      success: true,
      data: stats,
    });
  });

  /**
   * POST /api/contacts/public/:workspaceId
   * Create contact from public form (PUBLIC)
   */
  createPublicContact = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const { name, email, phone, message } = req.body;

    if (!name || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        error: "Name and email or phone are required",
      });
    }

    const contact = await contactsService.createPublicContact(workspaceId, {
      name,
      email,
      phone,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Thank you for contacting us! We will get back to you soon.",
      data: contact,
    });
  });

  /**
   * POST /api/contacts
   * Create new contact
   */
  createContact = asyncHandler(async (req, res) => {
    const { name, email, phone, address, notes } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required",
      });
    }

    const contact = await contactsService.createContact(req.workspaceId, {
      name,
      email,
      phone,
      address,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Contact created successfully",
      data: contact,
    });
  });

  /**
   * PATCH /api/contacts/:id
   * Update contact
   */
  updateContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const contact = await contactsService.updateContact(id, req.workspaceId, {
      name,
      email,
      phone,
    });

    res.json({
      success: true,
      message: "Contact updated successfully",
      data: contact,
    });
  });

  /**
   * DELETE /api/contacts/:id
   * Delete contact
   */
  deleteContact = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await contactsService.deleteContact(id, req.workspaceId);

    res.json({
      success: true,
      message: result.message,
    });
  });
}

export default new ContactsController();
