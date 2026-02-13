// frontend/app/app/forms/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import dayjs from "dayjs";

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
    if (!confirm("Are you sure you want to delete this form?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${formId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        fetchForms();
      }
    } catch (error) {
      console.error("Failed to delete form:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Forms</h1>
            <p className="mt-2 text-gray-600">
              Manage forms and track submissions
            </p>
          </div>
          {user?.role === "OWNER" && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              + Upload Form
            </button>
          )}
        </div>

        {/* View Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setView("forms")}
            className={`rounded-md px-4 py-2 ${
              view === "forms"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Forms
          </button>
          <button
            onClick={() => setView("submissions")}
            className={`rounded-md px-4 py-2 ${
              view === "submissions"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Submissions
          </button>
        </div>

        {/* Forms View */}
        {view === "forms" && (
          <div>
            {isLoading ? (
              <div className="text-center">Loading...</div>
            ) : forms.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center shadow">
                <p className="text-gray-500">No forms uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {forms.map((form) => (
                  <div key={form.id} className="rounded-lg bg-white p-6 shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{form.name}</h3>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>
                            <strong>Uploaded:</strong>{" "}
                            {dayjs(form.createdAt).format("MMM D, YYYY")}
                          </p>
                          <p>
                            <strong>Required:</strong>{" "}
                            {form.settings?.isRequired ? "Yes" : "No"}
                          </p>
                          <p>
                            <strong>Submissions:</strong>{" "}
                            {form.submissions.length}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {form.settings?.fileUrl && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}${form.settings.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            Download
                          </a>
                        )}
                        {user?.role === "OWNER" && (
                          <button
                            onClick={() => deleteForm(form.id)}
                            className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
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
              <div className="rounded-lg bg-white p-8 text-center shadow">
                <p className="text-gray-500">No form submissions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="rounded-lg bg-white p-6 shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">
                            {submission.form.name}
                          </h3>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
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
        throw new Error(data.error || "Upload failed");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold">Upload Form</h2>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Form Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., Intake Form, Consent Form"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              File * (PDF or Word)
            </label>
            <input
              type="file"
              required
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
              className="flex-1 rounded-md border border-gray-300 py-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file || !name}
              className="flex-1 rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
