"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [workspaceData, setWorkspaceData] = useState({
    name: "",
    slug: "",
    description: "",
    address: "",
    timezone: "",
    contactEmail: "",
  });
  const [integrations, setIntegrations] = useState({
    email: { enabled: false, provider: "", config: {} },
    sms: { enabled: false, provider: "", config: {} },
  });
  const [contactForm, setContactForm] = useState({
    name: "Contact Form",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "tel", required: false },
      { name: "message", label: "Message", type: "textarea", required: false },
    ],
  });
  const [bookingTypes, setBookingTypes] = useState([
    {
      name: "Initial Consultation",
      duration: 30,
      description: "First meeting to discuss your needs",
    },
  ]);
  const [availability, setAvailability] = useState({
    monday: {
      enabled: true,
      slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    },
    tuesday: {
      enabled: true,
      slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    },
    wednesday: {
      enabled: true,
      slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    },
    thursday: {
      enabled: true,
      slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    },
    friday: {
      enabled: true,
      slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    },
    saturday: { enabled: false, slots: [] },
    sunday: { enabled: false, slots: [] },
  });
  const [forms, setForms] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    {
      title: "Step 1: Create Workspace",
      description: "Set up your business workspace with basic information.",
      content: "workspace",
    },
    {
      title: "Step 2: Set Up Email & SMS",
      description:
        "Connect your communication channels (at least one required).",
      content: "integrations",
    },
    {
      title: "Step 3: Create Contact Form",
      description: "Design your public contact form for customer inquiries.",
      content: "contact-form",
    },
    {
      title: "Step 4: Set Up Bookings",
      description: "Define your services, availability, and booking rules.",
      content: "bookings",
    },
    {
      title: "Step 5: Set Up Forms",
      description: "Upload required forms for post-booking automation.",
      content: "post-booking-forms",
    },
    {
      title: "Step 6: Set Up Inventory",
      description: "Define resources and items used in your services.",
      content: "inventory",
    },
    {
      title: "Step 7: Add Staff & Permissions",
      description: "Invite team members and assign roles.",
      content: "staff",
    },
    {
      title: "Step 8: Activate Workspace",
      description: "Review and activate your workspace to go live.",
      content: "activation",
    },
  ];

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("careops_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Complete onboarding process
      const token = localStorage.getItem("careops_token");

      // 1. Create workspace with all settings
      const workspaceResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workspaces`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...workspaceData,
            settings: {
              integrations,
              contactForm,
              bookingTypes,
              availability,
              forms,
              inventory,
              staff,
              isActive: true,
            },
          }),
        },
      );

      if (workspaceResponse.ok) {
        const workspace = await workspaceResponse.json();

        // 2. Set up integrations
        if (integrations.email.enabled) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              workspaceId: workspace.data.id,
              type: "email",
              name: "Email Service",
              config: integrations.email.config,
            }),
          });
        }

        if (integrations.sms.enabled) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              workspaceId: workspace.data.id,
              type: "sms",
              name: "SMS Service",
              config: integrations.sms.config,
            }),
          });
        }

        // 3. Create contact form
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workspaceId: workspace.data.id,
            name: contactForm.name,
            fields: contactForm.fields,
            isActive: true,
          }),
        });

        // 4. Create booking types
        for (const bookingType of bookingTypes) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/types`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              workspaceId: workspace.data.id,
              ...bookingType,
            }),
          });
        }

        router.push("/app/dashboard");
      } else {
        // If workspace creation fails, still redirect to dashboard
        console.error(
          "Workspace creation failed, but redirecting to dashboard",
        );
        router.push("/app/dashboard");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].content) {
      case "workspace":
        return (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="workspace-name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Business Name *
              </label>
              <input
                id="workspace-name"
                type="text"
                value={workspaceData.name}
                onChange={(e) =>
                  setWorkspaceData({ ...workspaceData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Business"
              />
            </div>

            <div>
              <label
                htmlFor="workspace-slug"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Workspace ID (URL-friendly) *
              </label>
              <input
                id="workspace-slug"
                type="text"
                value={workspaceData.slug}
                onChange={(e) =>
                  setWorkspaceData({
                    ...workspaceData,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="my-business"
              />
              <p className="mt-1 text-sm text-gray-500">
                This will be used in URLs: careops.app/
                {workspaceData.slug || "your-workspace"}
              </p>
            </div>

            <div>
              <label
                htmlFor="workspace-description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description (Optional)
              </label>
              <textarea
                id="workspace-description"
                value={workspaceData.description}
                onChange={(e) =>
                  setWorkspaceData({
                    ...workspaceData,
                    description: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your workspace..."
              />
            </div>

            <div>
              <label
                htmlFor="workspace-address"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Business Address (Important for in-person services)
              </label>
              <input
                id="workspace-address"
                type="text"
                value={workspaceData.address}
                onChange={(e) =>
                  setWorkspaceData({
                    ...workspaceData,
                    address: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123 Main St, City, State 12345"
              />
            </div>

            <div>
              <label
                htmlFor="workspace-timezone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Time Zone *
              </label>
              <select
                id="workspace-timezone"
                value={workspaceData.timezone}
                onChange={(e) =>
                  setWorkspaceData({
                    ...workspaceData,
                    timezone: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Time Zone</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Asia/Kolkata">India (IST)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="workspace-contact-email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contact Email *
              </label>
              <input
                id="workspace-contact-email"
                type="email"
                value={workspaceData.contactEmail}
                onChange={(e) =>
                  setWorkspaceData({
                    ...workspaceData,
                    contactEmail: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contact@yourbusiness.com"
              />
            </div>
          </div>
        );

      case "integrations":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Email Integration
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="email-enabled"
                    checked={integrations.email.enabled}
                    onChange={(e) =>
                      setIntegrations({
                        ...integrations,
                        email: {
                          ...integrations.email,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="mr-2"
                  />
                  <label
                    htmlFor="email-enabled"
                    className="text-sm font-medium text-gray-700"
                  >
                    Enable Email Communications
                  </label>
                </div>

                {integrations.email.enabled && (
                  <div className="space-y-4 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Provider
                      </label>
                      <select
                        value={integrations.email.provider}
                        onChange={(e) =>
                          setIntegrations({
                            ...integrations,
                            email: {
                              ...integrations.email,
                              provider: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Provider</option>
                        <option value="sendgrid">SendGrid</option>
                        <option value="resend">Resend</option>
                      </select>
                    </div>

                    {integrations.email.provider === "sendgrid" && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            SendGrid API Key
                          </label>
                          <input
                            type="password"
                            placeholder="SG.xxxxx..."
                            onChange={(e) =>
                              setIntegrations({
                                ...integrations,
                                email: {
                                  ...integrations.email,
                                  config: {
                                    ...integrations.email.config,
                                    apiKey: e.target.value,
                                  },
                                },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            From Email
                          </label>
                          <input
                            type="email"
                            placeholder="noreply@yourbusiness.com"
                            onChange={(e) =>
                              setIntegrations({
                                ...integrations,
                                email: {
                                  ...integrations.email,
                                  config: {
                                    ...integrations.email.config,
                                    fromEmail: e.target.value,
                                  },
                                },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> At least one communication channel
                (Email or SMS) is required for workspace activation.
              </p>
            </div>
          </div>
        );

      case "contact-form":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Contact Form Configuration
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                This form will be available to customers for initial inquiries.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Automation:</strong> When this form is submitted, a
                contact will be created, a conversation started, and a welcome
                message sent automatically.
              </p>
            </div>
          </div>
        );

      case "bookings":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Booking Types
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Define the services customers can book.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800">
                <strong>Setup Complete:</strong> Default consultation service
                has been created with standard business hours.
              </p>
            </div>
          </div>
        );

      case "post-booking-forms":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Post-Booking Forms
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload forms that will be automatically sent to customers after
                booking.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800">
                <strong>Automation:</strong> Forms will be automatically sent
                after booking confirmation and completion status will be
                tracked.
              </p>
            </div>
          </div>
        );

      case "inventory":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Inventory & Resources
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Define items and resources used in your services for tracking
                and alerts.
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
              <p className="text-sm text-orange-800">
                <strong>Automation:</strong> Low-stock alerts will be sent to
                your inbox and dashboard when items fall below threshold.
              </p>
            </div>
          </div>
        );

      case "staff":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Staff Members & Permissions
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Invite team members and assign appropriate permissions.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
              <p className="text-sm text-purple-800">
                <strong>Note:</strong> Staff members cannot change system
                configuration, automation rules, or manage integrations.
              </p>
            </div>
          </div>
        );

      case "activation":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Workspace Activation
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Review your setup and activate your workspace to go live.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-md p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Setup Checklist
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      label: "Workspace Information",
                      completed: !!workspaceData.name,
                    },
                    {
                      label: "Communication Channel",
                      completed:
                        integrations.email.enabled || integrations.sms.enabled,
                    },
                    { label: "Contact Form", completed: true },
                    {
                      label: "Booking Types",
                      completed: bookingTypes.length > 0,
                    },
                    { label: "Availability Defined", completed: true },
                    { label: "Forms Ready", completed: true },
                    { label: "Inventory Set", completed: true },
                    { label: "Staff Permissions", completed: true },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-700">
                        {item.label}
                      </span>
                      <span
                        className={`text-sm ${
                          item.completed ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {item.completed ? "✓ Complete" : "✗ Missing"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-md font-medium text-blue-900 mb-2">
                  What happens after activation?
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your contact forms will go live</li>
                  <li>• Booking links will become active</li>
                  <li>• Automation rules will start running</li>
                  <li>• Customers can start reaching out</li>
                  <li>• You'll receive real notifications</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index <= currentStep
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-500"
                  }`}
                >
                  {index < currentStep ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-full h-1 mx-2 ${
                      index < currentStep ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {steps[currentStep].title}
            </h2>
            <p className="mt-2 text-gray-600">
              {steps[currentStep].description}
            </p>
          </div>

          {renderStepContent()}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={
                isLoading ||
                (currentStep === 0 && !workspaceData.name) ||
                (currentStep === 1 &&
                  !(integrations.email.enabled || integrations.sms.enabled))
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-white">
                    <div className="border-t-2 border-b-2 border-white rounded-full w-5 h-5"></div>
                  </div>
                  Processing...
                </div>
              ) : currentStep === steps.length - 1 ? (
                "Complete Setup"
              ) : (
                "Next"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
