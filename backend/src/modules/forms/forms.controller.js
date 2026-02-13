// backend/src/modules/forms/forms.controller.js
import { asyncHandler } from "../../middlewares/errorHandler.js";
import formsService from "./forms.service.js";

class FormsController {
  /**
   * GET /api/forms
   * Get all forms
   */
  getForms = asyncHandler(async (req, res) => {
    const forms = await formsService.getForms(req.workspaceId);

    res.json({
      success: true,
      data: forms,
    });
  });

  /**
   * GET /api/forms/:id
   * Get form by ID
   */
  getForm = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const form = await formsService.getForm(id, req.workspaceId);

    res.json({
      success: true,
      data: form,
    });
  });

  /**
   * POST /api/forms
   * Create form (OWNER only)
   */
  createForm = asyncHandler(async (req, res) => {
    const { name, description, fields, isActive } = req.body;
    const file = req.file;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Form name is required",
      });
    }

    const form = await formsService.createForm(
      req.workspaceId,
      { name, description, fields, isActive },
      file,
    );

    res.status(201).json({
      success: true,
      message: "Form created successfully",
      data: form,
    });
  });

  /**
   * PATCH /api/forms/:id
   * Update form (OWNER only)
   */
  updateForm = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, fields, isActive } = req.body;

    const form = await formsService.updateForm(id, req.workspaceId, {
      name,
      description,
      fields,
      isActive,
    });

    res.json({
      success: true,
      message: "Form updated successfully",
      data: form,
    });
  });

  /**
   * DELETE /api/forms/:id
   * Delete form (OWNER only)
   */
  deleteForm = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await formsService.deleteForm(id, req.workspaceId);

    res.json({
      success: true,
      message: result.message,
    });
  });

  /**
   * GET /api/forms/submissions
   * Get all form submissions
   */
  getSubmissions = asyncHandler(async (req, res) => {
    const filters = {
      status: req.query.status,
      formId: req.query.formId,
    };

    const submissions = await formsService.getSubmissions(
      req.workspaceId,
      filters,
    );

    res.json({
      success: true,
      data: submissions,
    });
  });

  /**
   * GET /api/forms/submissions/stats
   * Get submission statistics
   */
  getSubmissionStats = asyncHandler(async (req, res) => {
    const stats = await formsService.getSubmissionStats(req.workspaceId);

    res.json({
      success: true,
      data: stats,
    });
  });

  /**
   * GET /api/forms/public/:submissionId
   * Get submission for public form filling (PUBLIC)
   */
  getPublicSubmission = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;

    const submission = await formsService.getSubmission(submissionId);

    res.json({
      success: true,
      data: submission,
    });
  });

  /**
   * POST /api/forms/public/:submissionId
   * Mark submission as completed (PUBLIC)
   */
  completePublicSubmission = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;

    // For MVP, just mark as completed
    // In production, you might want to upload the filled form
    const submission = await formsService.getSubmission(submissionId);

    const updated = await formsService.completeSubmission(
      submissionId,
      submission.form.workspaceId,
    );

    res.json({
      success: true,
      message: "Form submitted successfully",
      data: updated,
    });
  });

  /**
   * PATCH /api/forms/submissions/:id/complete
   * Mark submission as completed (STAFF)
   */
  completeSubmission = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const submission = await formsService.completeSubmission(
      id,
      req.workspaceId,
    );

    res.json({
      success: true,
      message: "Form submission marked as completed",
      data: submission,
    });
  });
}

export default new FormsController();
