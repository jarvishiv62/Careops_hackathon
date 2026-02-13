// backend/src/modules/forms/forms.service.js
import { prisma } from "../../db/prisma.js";
import { deleteFile } from "../../utils/fileUpload.js";
import path from "path";

class FormsService {
  /**
   * Get all forms for workspace
   */
  async getForms(workspaceId) {
    const forms = await prisma.form.findMany({
      where: { workspaceId },
      include: {
        bookingTypes: {
          include: {
            bookingType: true,
          },
        },
        submissions: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return forms;
  }

  /**
   * Get form by ID
   */
  async getForm(formId, workspaceId) {
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        workspaceId,
      },
      include: {
        bookingTypes: {
          include: {
            bookingType: true,
          },
        },
        submissions: {
          include: {
            form: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!form) {
      throw new Error("Form not found");
    }

    return form;
  }

  /**
   * Create form
   */
  async createForm(workspaceId, data, file) {
    // Handle both file upload and field-based forms
    if (file) {
      // File upload form
      const form = await prisma.form.create({
        data: {
          workspaceId,
          name: data.name,
          description: data.description || "",
          fields: data.fields || [],
          settings: {
            ...data.settings,
            fileUrl: `/uploads/forms/${file.filename}`,
            isRequired: data.isRequired,
          },
          isActive: data.isActive !== false,
        },
      });
      return form;
    } else {
      // Field-based form (for onboarding)
      const form = await prisma.form.create({
        data: {
          workspaceId,
          name: data.name,
          description: data.description || "",
          fields: data.fields || [],
          settings: { ...data.settings, isRequired: data.isRequired },
          isActive: data.isActive !== false,
        },
      });
      return form;
    }
  }

  /**
   * Update form
   */
  async updateForm(formId, workspaceId, data) {
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        workspaceId,
      },
    });

    if (!form) {
      throw new Error("Form not found");
    }

    const updated = await prisma.form.update({
      where: { id: formId },
      data: {
        name: data.name,
        description: data.description,
        fields: data.fields,
        settings: {
          ...form.settings,
          ...data.settings,
          isRequired: data.isRequired,
        },
        isActive: data.isActive,
      },
    });

    return updated;
  }

  /**
   * Delete form
   */
  async deleteForm(formId, workspaceId) {
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        workspaceId,
      },
    });

    if (!form) {
      throw new Error("Form not found");
    }

    // Check if form has pending submissions
    const pendingSubmissions = await prisma.formSubmission.count({
      where: {
        formId,
      },
    });

    if (pendingSubmissions > 0) {
      throw new Error("Cannot delete form with submissions");
    }

    // Delete file if exists
    if (form.settings?.fileUrl) {
      const filepath = path.join(
        "./uploads/forms",
        path.basename(form.settings.fileUrl),
      );
      deleteFile(filepath);
    }

    // Delete form
    await prisma.form.delete({
      where: { id: formId },
    });

    return { message: "Form deleted successfully" };
  }

  /**
   * Get all form submissions
   */
  async getSubmissions(workspaceId, filters = {}) {
    const where = {
      form: {
        workspaceId,
      },
    };

    // Filter by form
    if (filters.formId) {
      where.formId = filters.formId;
    }

    const submissions = await prisma.formSubmission.findMany({
      where,
      include: {
        form: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return submissions;
  }

  /**
   * Get submission by ID (public)
   */
  async getSubmission(submissionId) {
    const submission = await prisma.formSubmission.findUnique({
      where: { id: submissionId },
      include: {
        form: {
          include: {
            workspace: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new Error("Form submission not found");
    }

    return submission;
  }

  /**
   * Mark submission as completed
   */
  async completeSubmission(submissionId, workspaceId) {
    // Verify submission belongs to workspace
    const submission = await prisma.formSubmission.findFirst({
      where: {
        id: submissionId,
        form: {
          workspaceId,
        },
      },
    });

    if (!submission) {
      throw new Error("Form submission not found");
    }

    const updated = await prisma.formSubmission.update({
      where: { id: submissionId },
      data: {
        metadata: { ...submission.metadata, submittedAt: new Date() },
      },
    });

    return updated;
  }

  /**
   * Get submission statistics
   */
  async getSubmissionStats(workspaceId) {
    const [total, recent] = await Promise.all([
      prisma.formSubmission.count({
        where: {
          form: { workspaceId },
        },
      }),
      prisma.formSubmission.count({
        where: {
          form: { workspaceId },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      total,
      recent,
    };
  }
}

export default new FormsService();
