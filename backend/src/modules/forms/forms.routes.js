// backend/src/modules/forms/forms.routes.js
import express from "express";
import formsController from "./forms.controller.js";
import {
  authenticate,
  requireOwner,
  requireStaff,
} from "../../middlewares/auth.js";
import { upload } from "../../utils/fileUpload.js";

const router = express.Router();

// Public routes
router.get("/public/:submissionId", formsController.getPublicSubmission);
router.post("/public/:submissionId", formsController.completePublicSubmission);

// Protected routes
router.use(authenticate);

router.get("/", formsController.getForms);
router.get("/submissions", formsController.getSubmissions);
router.get("/submissions/stats", formsController.getSubmissionStats);
router.get("/:id", formsController.getForm);

// Owner only routes
router.post(
  "/",
  requireOwner,
  upload.single("file"),
  formsController.createForm,
);
router.patch("/:id", requireOwner, formsController.updateForm);
router.delete("/:id", requireOwner, formsController.deleteForm);

// Staff routes
router.patch(
  "/submissions/:id/complete",
  requireStaff,
  formsController.completeSubmission,
);

export default router;
