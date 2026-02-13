// frontend/app/(public)/forms/[submissionId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface FormSubmission {
  id: string;
  status: string;
  form: {
    name: string;
    fileUrl: string;
    workspace: {
      name: string;
    };
  };
}

export default function PublicFormPage() {
  const params = useParams();
  const submissionId = params.submissionId as string;
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSubmission();
  }, []);

  const fetchSubmission = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forms/public/${submissionId}`,
      );

      const data = await response.json();
      if (data.success) {
        setSubmission(data.data);
        if (data.data.status === "COMPLETED") {
          setIsSubmitted(true);
        }
      } else {
        setError("Form submission not found");
      }
    } catch (error) {
      console.error("Failed to fetch submission:", error);
      setError("Failed to load form");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forms/public/${submissionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error("Failed to submit form:", error);
      alert("Failed to submit form");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">{error || "Form not found"}</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <div className="mb-4 text-6xl">✅</div>
            <h1 className="text-3xl font-bold text-green-600">
              Form Submitted!
            </h1>
            <p className="mt-4 text-gray-600">
              Thank you for completing the {submission.form.name}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{submission.form.name}</h1>
            <p className="mt-2 text-gray-600">
              From {submission.form.workspace.name}
            </p>
          </div>

          <div className="mb-8 rounded-lg bg-blue-50 p-6">
            <h2 className="mb-4 text-xl font-semibold">Instructions:</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Download the form using the button below</li>
              <li>Fill out the form completely</li>
              <li>Save the completed form</li>
              <li>Click "I've Completed This Form" when done</li>
            </ol>
          </div>

          <div className="mb-8">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}${submission.form.fileUrl}`}
              download
              className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              📥 Download Form
            </a>
          </div>

          <div className="border-t pt-6">
            <p className="mb-4 text-sm text-gray-600">
              Once you've downloaded, filled out, and saved the form, click
              below to confirm completion.
            </p>
            <button
              onClick={handleComplete}
              className="rounded-md bg-green-600 px-6 py-3 text-white hover:bg-green-700"
            >
              ✓ I've Completed This Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
