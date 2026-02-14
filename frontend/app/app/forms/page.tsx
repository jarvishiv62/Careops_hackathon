// frontend/app/app/forms/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import dayjs from "dayjs";
import {
  FileText,
  MessageSquare,
  Calendar,
  Users,
  ArrowRight,
  CheckCircle,
  Zap,
} from "lucide-react";

interface Form {
  id: string;
  name: string;
  description?: string;
  fields: any;
  settings: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  submissions: FormSubmission[];
}

interface FormSubmission {
  id: string;
  formId: string;
  data: any;
  metadata?: any;
  createdAt: string;
}

export default function FormsPage() {
  const { token, user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [view, setView] = useState<"forms" | "submissions">("forms");
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (view === "forms") {
      fetchForms();
    } else {
      fetchSubmissions();
    }
  }, [view]);

  const fetchForms = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forms`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setForms(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch forms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forms/submissions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setSubmissions(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteForm = async (formId: string) => {
    console.log("deleteForm called with formId:", formId);
    try {
      console.log(
        "Sending DELETE request to:",
        `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${formId}`,
      );
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${formId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        fetchForms();
        console.log("Form deleted successfully");
      } else {
        const errorData = await response.json();
        console.error("Delete failed:", errorData);
        alert(`Failed to delete form: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to delete form:", error);
      alert("Failed to delete form. Please try again.");
    }
  };

  return (
    <div className="min-h-screen glass-dark p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl font-black text-gradient mb-2">Forms</h1>
              <p className="text-gray-300 text-lg">
                Manage forms and track submissions
              </p>
            </motion.div>
          </div>
          {user?.role === "OWNER" && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
            >
              <Zap className="w-5 h-5 mr-2" />
              Upload Form
            </motion.button>
          )}
        </div>

        {/* View Toggle */}
        <div className="mb-8">
          <div className="inline-flex rounded-xl bg-gray-800/50 backdrop-blur-xl p-1 border border-gray-700/50">
            {[
              { id: "forms", label: "Forms", icon: FileText },
              { id: "submissions", label: "Submissions", icon: Users },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setView(tab.id as "forms" | "submissions")}
                className={`relative px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  view === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
                {view === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400"
                    initial={false}
                    animate={{ height: "2px" }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Forms View */}
        {view === "forms" && (
          <div>
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center items-center py-12"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-300 text-lg">
                    Loading forms...
                  </span>
                </div>
              </motion.div>
            ) : forms.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl bg-gray-800/50 backdrop-blur-xl p-12 text-center border border-gray-700/50 shadow-2xl"
              >
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-200 mb-2">
                  No forms uploaded yet
                </h3>
                <p className="text-gray-400 mb-6">
                  Upload your first form to get started
                </p>
                {user?.role === "OWNER" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUploadModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Create Your First Form
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <div className="grid gap-6">
                {forms.map((form, index) => (
                  <motion.div
                    key={form.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{
                      y: -5,
                      boxShadow: "0 20px 40px rgba(168, 85, 247, 0.3)",
                    }}
                    className="rounded-2xl bg-gray-800/50 backdrop-blur-xl p-6 shadow-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-white">
                            {form.name}
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-purple-400" />
                            <span className="text-gray-300">
                              <strong>Created:</strong>{" "}
                              {dayjs(form.createdAt).format("MMM D, YYYY")}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle
                              className={`w-4 h-4 ${form.settings?.isRequired ? "text-green-400" : "text-yellow-400"}`}
                            />
                            <span className="text-gray-300">
                              <strong>Required:</strong>{" "}
                              {form.settings?.isRequired ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-gray-300">
                              <strong>Submissions:</strong>{" "}
                              {form.submissions.length}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {form.settings?.fileUrl && (
                          <motion.a
                            href={`${process.env.NEXT_PUBLIC_API_URL}${form.settings.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className="p-3 bg-blue-600/20 border border-blue-500/50 rounded-xl text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 transition-all duration-300"
                          >
                            <FileText className="w-5 h-5" />
                          </motion.a>
                        )}
                        {user?.role === "OWNER" && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => deleteForm(form.id)}
                            className="p-3 bg-red-600/20 border border-red-500/50 rounded-xl text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-all duration-300"
                          >
                            <FileText className="w-5 h-5" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submissions View */}
        {view === "submissions" && (
          <div>
            {isLoading ? (
              <div className="text-center">Loading...</div>
            ) : submissions.length === 0 ? (
              <div className="rounded-lg bg-gray-800/50 backdrop-blur-xl p-8 text-center border border-gray-700/50 shadow-lg">
                <p className="text-gray-400">No form submissions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="rounded-lg bg-gray-800/50 backdrop-blur-xl p-6 shadow-lg border border-gray-700/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">
                            {submission.form.name}
                          </h3>
                        </div>
                        <div className="mt-2 text-sm text-gray-300">
                          <p>
                            Created:{" "}
                            {dayjs(submission.createdAt).format(
                              "MMM D, YYYY [at] h:mm A",
                            )}
                          </p>
                          {submission.metadata?.submittedAt && (
                            <p>
                              Submitted:{" "}
                              {dayjs(submission.metadata.submittedAt).format(
                                "MMM D, YYYY [at] h:mm A",
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showUploadModal && (
          <UploadFormModal
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => {
              setShowUploadModal(false);
              fetchForms();
            }}
          />
        )}
      </div>
    </div>
  );
}

function UploadFormModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) return;

    setError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("isRequired", isRequired.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forms`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        onSuccess();
      }
    } catch (err: any) {
      // Handle error silently
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75">
      <div className="w-full max-w-md rounded-lg bg-gray-800/90 backdrop-blur-xl p-6 shadow-2xl border border-gray-700/50">
        <h2 className="text-2xl font-bold text-white">Upload Form</h2>

        {error && (
          <div className="mt-4 rounded-md bg-red-900/20 p-3 text-sm text-red-400 border border-red-600/50">
            <p className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Upload failed. Please try again.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Form Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700/50 px-3 py-2 text-white placeholder-gray-400"
              placeholder="e.g., Intake Form, Consent Form"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              File * (PDF or Word)
            </label>
            <input
              type="file"
              required
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700/50 px-3 py-2 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRequired"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="isRequired" className="text-sm">
              Required form
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-600 bg-gray-700/50 py-2 hover:bg-gray-600 text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file || !name}
              className="flex-1 rounded-md bg-purple-600 py-2 text-white hover:bg-purple-700 disabled:bg-purple-800"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
