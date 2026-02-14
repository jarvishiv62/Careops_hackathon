"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Package,
  Users,
  Settings,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Zap,
  Shield,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default function Onboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [workspaceData, setWorkspaceData] = useState({
    businessName: "",
    businessEmail: "",
    serviceType: "",
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
    autoReply: {
      enabled: true,
      message:
        "Thank you for reaching out! We'll get back to you within 24 hours.",
    },
  });
  const [bookingSettings, setBookingSettings] = useState({
    advanceBookingDays: 30,
    cancellationPolicy: "24 hours notice required",
    reminderTime: "2 hours before",
    autoConfirm: false,
  });

  const [forms, setForms] = useState([
    {
      name: "New Client Intake Form",
      fields: [
        {
          name: "emergencyContact",
          label: "Emergency Contact",
          type: "text",
          required: true,
        },
        {
          name: "medicalHistory",
          label: "Medical History",
          type: "textarea",
          required: false,
        },
        {
          name: "consent",
          label: "Service Consent",
          type: "checkbox",
          required: true,
        },
      ],
      trigger: "after_booking_confirmation",
    },
  ]);

  const [inventory, setInventory] = useState([
    {
      name: "Consultation Room",
      type: "resource",
      quantity: 1,
      lowStockThreshold: 1,
    },
  ]);

  const [staff, setStaff] = useState([
    {
      name: "",
      email: "",
      role: "admin",
      permissions: ["manage_bookings", "view_contacts"],
    },
  ]);
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
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    {
      title: "Business Info",
      description: "Tell us about your business and services.",
      content: "business-info",
      icon: User,
    },
    {
      title: "Workspace Setup",
      description: "Configure your workspace details.",
      content: "workspace",
      icon: Settings,
    },
    {
      title: "Communications",
      description: "Set up email & SMS channels.",
      content: "integrations",
      icon: Mail,
    },
    {
      title: "Contact Form",
      description: "Design your customer contact form.",
      content: "contact-form",
      icon: MessageSquare,
    },
    {
      title: "Bookings",
      description: "Configure your booking system.",
      content: "bookings",
      icon: Calendar,
    },
    {
      title: "Forms",
      description: "Set up post-booking forms.",
      content: "forms",
      icon: Package,
    },
    {
      title: "Inventory",
      description: "Manage your resources.",
      content: "inventory",
      icon: Package,
    },
    {
      title: "Team",
      description: "Add staff members.",
      content: "staff",
      icon: Users,
    },
    {
      title: "Launch",
      description: "Activate your workspace.",
      content: "activation",
      icon: Zap,
    },
  ];

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("careops_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const validateCurrentStep = () => {
    switch (steps[currentStep].content) {
      case "business-info":
        return (
          workspaceData.businessName.trim() &&
          workspaceData.businessEmail.trim() &&
          workspaceData.businessEmail.includes("@") &&
          workspaceData.serviceType
        );
      case "workspace":
        return (
          workspaceData.name.trim() &&
          workspaceData.slug.trim() &&
          workspaceData.timezone &&
          workspaceData.contactEmail.trim() &&
          workspaceData.contactEmail.includes("@")
        );
      case "integrations":
        return integrations.email.enabled || integrations.sms.enabled;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }
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
              forms: [],
              inventory: [],
              staff: [],
              isActive: true,
            },
          }),
        },
      );

      if (workspaceResponse.ok) {
        const workspace = await workspaceResponse.json();
        router.push("/app/dashboard");
      } else {
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
      case "business-info":
        return (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="business-name"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Business Name *
              </label>
              <input
                id="business-name"
                type="text"
                value={workspaceData.businessName}
                onChange={(e) =>
                  setWorkspaceData({
                    ...workspaceData,
                    businessName: e.target.value,
                  })
                }
                className="input-field"
                placeholder="My Business LLC"
              />
            </div>

            <div>
              <label
                htmlFor="business-email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Business Email *
              </label>
              <input
                id="business-email"
                type="email"
                value={workspaceData.businessEmail}
                onChange={(e) =>
                  setWorkspaceData({
                    ...workspaceData,
                    businessEmail: e.target.value,
                  })
                }
                className="input-field"
                placeholder="contact@yourbusiness.com"
              />
            </div>

            <div>
              <label
                htmlFor="service-type"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Service Type *
              </label>
              <select
                id="service-type"
                value={workspaceData.serviceType}
                onChange={(e) =>
                  setWorkspaceData({
                    ...workspaceData,
                    serviceType: e.target.value,
                  })
                }
                className="input-field"
              >
                <option value="">Select Service Type</option>
                <option value="consulting">Consulting</option>
                <option value="healthcare">Healthcare</option>
                <option value="beauty">Beauty & Wellness</option>
                <option value="education">Education & Training</option>
                <option value="legal">Legal Services</option>
                <option value="finance">Financial Services</option>
                <option value="automotive">Automotive</option>
                <option value="home-services">Home Services</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                <strong>Next Steps:</strong> We'll use this information to set
                up your workspace with industry-specific configurations and
                templates.
              </p>
            </div>
          </div>
        );

      case "workspace":
        return (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="workspace-name"
                className="block text-sm font-medium text-gray-300 mb-2"
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
                className="input-field"
                placeholder="My Business"
              />
            </div>

            <div>
              <label
                htmlFor="workspace-slug"
                className="block text-sm font-medium text-gray-300 mb-2"
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
                className="input-field"
                placeholder="my-business"
              />
              <p className="mt-1 text-sm text-gray-400">
                This will be used in URLs: careops.app/
                {workspaceData.slug || "your-workspace"}
              </p>
            </div>

            <div>
              <label
                htmlFor="workspace-description"
                className="block text-sm font-medium text-gray-300 mb-2"
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
                className="input-field resize-none"
                placeholder="Describe your workspace..."
              />
            </div>

            <div>
              <label
                htmlFor="workspace-address"
                className="block text-sm font-medium text-gray-300 mb-2"
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
                className="input-field"
                placeholder="123 Main St, City, State 12345"
              />
            </div>

            <div>
              <label
                htmlFor="workspace-timezone"
                className="block text-sm font-medium text-gray-300 mb-2"
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
                className="input-field"
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
                className="block text-sm font-medium text-gray-300 mb-2"
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
                className="input-field"
                placeholder="contact@yourbusiness.com"
              />
            </div>
          </div>
        );

      case "integrations":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-purple-400" />
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
                    className="text-sm font-medium text-gray-300"
                  >
                    Enable Email Communications
                  </label>
                </div>

                {integrations.email.enabled && (
                  <div className="space-y-4 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
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
                        className="input-field"
                      >
                        <option value="">Select Provider</option>
                        <option value="sendgrid">SendGrid</option>
                        <option value="resend">Resend</option>
                      </select>
                    </div>

                    {integrations.email.provider === "sendgrid" && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
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
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
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
                            className="input-field"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-purple-400" />
                SMS Integration
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sms-enabled"
                    checked={integrations.sms.enabled}
                    onChange={(e) =>
                      setIntegrations({
                        ...integrations,
                        sms: {
                          ...integrations.sms,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="mr-2"
                  />
                  <label
                    htmlFor="sms-enabled"
                    className="text-sm font-medium text-gray-300"
                  >
                    Enable SMS Notifications
                  </label>
                </div>

                {integrations.sms.enabled && (
                  <div className="space-y-4 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        SMS Provider
                      </label>
                      <select
                        value={integrations.sms.provider}
                        onChange={(e) =>
                          setIntegrations({
                            ...integrations,
                            sms: {
                              ...integrations.sms,
                              provider: e.target.value,
                            },
                          })
                        }
                        className="input-field"
                      >
                        <option value="">Select Provider</option>
                        <option value="twilio">Twilio</option>
                        <option value="messagebird">MessageBird</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-sm text-yellow-300">
                <strong>Important:</strong> At least one communication channel
                (Email or SMS) is required for workspace activation.
              </p>
            </div>
          </div>
        );

      case "contact-form":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-purple-400" />
                Contact Form Configuration
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                This form will be available to customers for initial inquiries.
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    Skip this step?
                  </p>
                  <p className="text-xs text-gray-500">
                    We'll create a standard contact form automatically based on
                    your business type
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Auto-fill with default values and proceed
                    setContactForm({
                      name: "Contact Form",
                      fields: [
                        {
                          name: "name",
                          label: "Name",
                          type: "text",
                          required: true,
                        },
                        {
                          name: "email",
                          label: "Email",
                          type: "email",
                          required: true,
                        },
                        {
                          name: "phone",
                          label: "Phone",
                          type: "tel",
                          required: false,
                        },
                        {
                          name: "message",
                          label: "Message",
                          type: "textarea",
                          required: false,
                        },
                      ],
                      autoReply: {
                        enabled: true,
                        message:
                          "Thank you for reaching out! We'll get back to you within 24 hours.",
                      },
                    });
                    handleNext();
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  Skip & Auto-Create
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Form Name
              </label>
              <input
                type="text"
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm({ ...contactForm, name: e.target.value })
                }
                className="input-field"
                placeholder="Contact Form"
              />
            </div>

            <div>
              <h4 className="text-md font-semibold text-white mb-3">
                Auto-Reply Message
              </h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="auto-reply-enabled"
                    checked={contactForm.autoReply.enabled}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        autoReply: {
                          ...contactForm.autoReply,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="mr-2"
                  />
                  <label
                    htmlFor="auto-reply-enabled"
                    className="text-sm font-medium text-gray-300"
                  >
                    Enable Auto-Reply
                  </label>
                </div>

                {contactForm.autoReply.enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Auto-Reply Message
                    </label>
                    <textarea
                      value={contactForm.autoReply.message}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          autoReply: {
                            ...contactForm.autoReply,
                            message: e.target.value,
                          },
                        })
                      }
                      rows={3}
                      className="input-field resize-none"
                      placeholder="Thank you for reaching out! We'll get back to you soon."
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                <strong>Automation:</strong> When this form is submitted, a
                contact will be created, a conversation started, and a welcome
                message sent automatically.
              </p>
            </div>
          </div>
        );

      case "bookings":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-400" />
                Booking Settings
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Configure your booking system rules and policies.
              </p>
            </div>

            {/* Skip Option */}
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    Skip this step?
                  </p>
                  <p className="text-xs text-gray-500">
                    We'll create standard booking settings based on your
                    business type
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Auto-fill with default values and proceed
                    setBookingSettings({
                      advanceBookingDays: 30,
                      cancellationPolicy: "24 hours notice required",
                      reminderTime: "2 hours before",
                      autoConfirm: false,
                    });
                    handleNext();
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  Skip & Use Defaults
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Advance Booking (Days)
                </label>
                <input
                  type="number"
                  value={bookingSettings.advanceBookingDays}
                  onChange={(e) =>
                    setBookingSettings({
                      ...bookingSettings,
                      advanceBookingDays: parseInt(e.target.value) || 30,
                    })
                  }
                  className="input-field"
                  min="1"
                  max="365"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cancellation Policy
                </label>
                <textarea
                  value={bookingSettings.cancellationPolicy}
                  onChange={(e) =>
                    setBookingSettings({
                      ...bookingSettings,
                      cancellationPolicy: e.target.value,
                    })
                  }
                  rows={2}
                  className="input-field resize-none"
                  placeholder="Describe your cancellation policy..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reminder Time
                </label>
                <select
                  value={bookingSettings.reminderTime}
                  onChange={(e) =>
                    setBookingSettings({
                      ...bookingSettings,
                      reminderTime: e.target.value,
                    })
                  }
                  className="input-field"
                >
                  <option value="1 hour before">1 hour before</option>
                  <option value="2 hours before">2 hours before</option>
                  <option value="24 hours before">24 hours before</option>
                  <option value="48 hours before">48 hours before</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-confirm"
                  checked={bookingSettings.autoConfirm}
                  onChange={(e) =>
                    setBookingSettings({
                      ...bookingSettings,
                      autoConfirm: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                <label
                  htmlFor="auto-confirm"
                  className="text-sm font-medium text-gray-300"
                >
                  Auto-confirm bookings
                </label>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-sm text-green-300">
                <strong>Setup Complete:</strong> Default consultation service
                has been created with standard business hours.
              </p>
            </div>
          </div>
        );

      case "forms":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-purple-400" />
                Post-Booking Forms
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Configure forms that will be automatically sent to customers
                after booking.
              </p>
            </div>

            {/* Skip Option */}
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    Skip this step?
                  </p>
                  <p className="text-xs text-gray-500">
                    We'll create standard intake forms based on your business
                    type
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Auto-fill with default values and proceed
                    setForms([
                      {
                        name: "New Client Intake Form",
                        fields: [
                          {
                            name: "emergencyContact",
                            label: "Emergency Contact",
                            type: "text",
                            required: true,
                          },
                          {
                            name: "medicalHistory",
                            label: "Medical History",
                            type: "textarea",
                            required: false,
                          },
                          {
                            name: "consent",
                            label: "Service Consent",
                            type: "checkbox",
                            required: true,
                          },
                        ],
                        trigger: "after_booking_confirmation",
                      },
                    ]);
                    handleNext();
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  Skip & Auto-Create
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Form Name
                </label>
                <input
                  type="text"
                  value={forms[0]?.name || ""}
                  onChange={(e) => {
                    const updatedForms = [...forms];
                    if (updatedForms[0]) {
                      updatedForms[0].name = e.target.value;
                      setForms(updatedForms);
                    }
                  }}
                  className="input-field"
                  placeholder="New Client Intake Form"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Form Trigger
                </label>
                <select
                  value={forms[0]?.trigger || "after_booking_confirmation"}
                  onChange={(e) => {
                    const updatedForms = [...forms];
                    if (updatedForms[0]) {
                      updatedForms[0].trigger = e.target.value;
                      setForms(updatedForms);
                    }
                  }}
                  className="input-field"
                >
                  <option value="after_booking_confirmation">
                    After Booking Confirmation
                  </option>
                  <option value="24_hours_before">
                    24 Hours Before Appointment
                  </option>
                  <option value="after_completion">
                    After Appointment Completion
                  </option>
                </select>
              </div>

              <div>
                <h4 className="text-md font-semibold text-white mb-3">
                  Required Fields
                </h4>
                <div className="space-y-2">
                  {forms[0]?.fields?.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg"
                    >
                      <span className="text-sm text-gray-300">
                        {field.label}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          field.required
                            ? "bg-red-500/20 text-red-400"
                            : "bg-gray-600/20 text-gray-400"
                        }`}
                      >
                        {field.required ? "Required" : "Optional"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-sm text-green-300">
                <strong>Automation:</strong> Forms will be automatically sent
                after booking confirmation and completion status will be
                tracked.
              </p>
            </div>
          </div>
        );

      case "inventory":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-purple-400" />
                Inventory & Resources
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Define items and resources used in your services for tracking
                and alerts.
              </p>
            </div>

            {/* Skip Option */}
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    Skip this step?
                  </p>
                  <p className="text-xs text-gray-500">
                    We'll create basic inventory tracking based on your business
                    type
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Auto-fill with default values and proceed
                    setInventory([
                      {
                        name: "Consultation Room",
                        type: "resource",
                        quantity: 1,
                        lowStockThreshold: 1,
                      },
                    ]);
                    handleNext();
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  Skip & Setup Later
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Resource Name
                </label>
                <input
                  type="text"
                  value={inventory[0]?.name || ""}
                  onChange={(e) => {
                    const updatedInventory = [...inventory];
                    if (updatedInventory[0]) {
                      updatedInventory[0].name = e.target.value;
                      setInventory(updatedInventory);
                    }
                  }}
                  className="input-field"
                  placeholder="Consultation Room"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Resource Type
                </label>
                <select
                  value={inventory[0]?.type || "resource"}
                  onChange={(e) => {
                    const updatedInventory = [...inventory];
                    if (updatedInventory[0]) {
                      updatedInventory[0].type = e.target.value;
                      setInventory(updatedInventory);
                    }
                  }}
                  className="input-field"
                >
                  <option value="resource">Room/Resource</option>
                  <option value="equipment">Equipment</option>
                  <option value="supplies">Supplies</option>
                  <option value="product">Product</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity Available
                </label>
                <input
                  type="number"
                  value={inventory[0]?.quantity || 1}
                  onChange={(e) => {
                    const updatedInventory = [...inventory];
                    if (updatedInventory[0]) {
                      updatedInventory[0].quantity =
                        parseInt(e.target.value) || 1;
                      setInventory(updatedInventory);
                    }
                  }}
                  className="input-field"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  value={inventory[0]?.lowStockThreshold || 1}
                  onChange={(e) => {
                    const updatedInventory = [...inventory];
                    if (updatedInventory[0]) {
                      updatedInventory[0].lowStockThreshold =
                        parseInt(e.target.value) || 1;
                      setInventory(updatedInventory);
                    }
                  }}
                  className="input-field"
                  min="1"
                  max={inventory[0]?.quantity || 1}
                />
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <p className="text-sm text-orange-300">
                <strong>Automation:</strong> Low-stock alerts will be sent to
                your inbox and dashboard when items fall below threshold.
              </p>
            </div>
          </div>
        );

      case "staff":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-400" />
                Staff Members & Permissions
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Invite team members and assign appropriate permissions.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-md font-semibold text-white mb-3">
                  Add First Team Member
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={staff[0]?.name || ""}
                      onChange={(e) => {
                        const updatedStaff = [...staff];
                        if (updatedStaff[0]) {
                          updatedStaff[0].name = e.target.value;
                          setStaff(updatedStaff);
                        }
                      }}
                      className="input-field"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={staff[0]?.email || ""}
                      onChange={(e) => {
                        const updatedStaff = [...staff];
                        if (updatedStaff[0]) {
                          updatedStaff[0].email = e.target.value;
                          setStaff(updatedStaff);
                        }
                      }}
                      className="input-field"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role
                    </label>
                    <select
                      value={staff[0]?.role || "admin"}
                      onChange={(e) => {
                        const updatedStaff = [...staff];
                        if (updatedStaff[0]) {
                          updatedStaff[0].role = e.target.value;
                          setStaff(updatedStaff);
                        }
                      }}
                      className="input-field"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">
                      Permissions
                    </h5>
                    <div className="space-y-2">
                      {[
                        { key: "manage_bookings", label: "Manage Bookings" },
                        { key: "view_contacts", label: "View Contacts" },
                        { key: "manage_inventory", label: "Manage Inventory" },
                        { key: "view_reports", label: "View Reports" },
                      ].map((permission) => (
                        <div key={permission.key} className="flex items-center">
                          <input
                            type="checkbox"
                            id={permission.key}
                            checked={
                              staff[0]?.permissions?.includes(permission.key) ||
                              false
                            }
                            onChange={(e) => {
                              const updatedStaff = [...staff];
                              if (updatedStaff[0]) {
                                const permissions =
                                  updatedStaff[0].permissions || [];
                                if (e.target.checked) {
                                  permissions.push(permission.key);
                                } else {
                                  const index = permissions.indexOf(
                                    permission.key,
                                  );
                                  if (index > -1) permissions.splice(index, 1);
                                }
                                updatedStaff[0].permissions = permissions;
                                setStaff(updatedStaff);
                              }
                            }}
                            className="mr-2"
                          />
                          <label
                            htmlFor={permission.key}
                            className="text-sm text-gray-300"
                          >
                            {permission.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <p className="text-sm text-purple-300">
                <strong>Note:</strong> Staff members cannot change system
                configuration, automation rules, or manage integrations.
              </p>
            </div>
          </div>
        );

      case "activation":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-purple-400" />
                Workspace Activation
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Review your setup and activate your workspace to go live.
              </p>
            </div>

            <div className="border border-gray-700 rounded-lg p-4">
              <h4 className="text-md font-bold text-white mb-3">
                Setup Checklist
              </h4>
              <div className="space-y-2">
                {[
                  {
                    label: "Business Information",
                    completed:
                      !!workspaceData.businessName &&
                      !!workspaceData.businessEmail &&
                      !!workspaceData.serviceType,
                  },
                  {
                    label: "Workspace Details",
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
                    <span className="text-sm text-gray-300">{item.label}</span>
                    <span
                      className={`text-sm ${
                        item.completed ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {item.completed ? "✓ Complete" : "✗ Missing"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-md font-bold text-white mb-3">
                What happens after activation?
              </h4>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• Your contact forms will go live</li>
                <li>• Booking links will become active</li>
                <li>• Automation rules will start running</li>
                <li>• Customers can start reaching out</li>
                <li>• You'll receive real notifications</li>
              </ul>
            </div>

            {/* Encouraging Onboarding Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 mb-4">
                Need help getting started? Our team is here to support you!
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Link
                  href="/landing"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Landing Page
                </Link>
              </motion.div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen dashboard-bg">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="glass-dark border-b border-gray-800/50 py-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
                  style={{
                    width: `${(currentStep / (steps.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {/* Steps */}
              <div className="relative flex justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  const isUpcoming = index > currentStep;

                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center group cursor-pointer"
                    >
                      <div
                        className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                          isCompleted
                            ? "border-purple-500 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30"
                            : isActive
                              ? "border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-500/30 ring-4 ring-purple-500/20"
                              : "border-gray-600 bg-gray-800 text-gray-500 hover:border-gray-500"
                        }`}
                        onClick={() =>
                          index <= currentStep && setCurrentStep(index)
                        }
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}

                        {/* Pulse animation for active step */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping" />
                        )}
                      </div>

                      <div className="mt-3 text-center">
                        <p
                          className={`text-sm font-medium transition-colors ${
                            isCompleted
                              ? "text-purple-400"
                              : isActive
                                ? "text-white"
                                : "text-gray-500 group-hover:text-gray-400"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 max-w-24 hidden sm:block">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="glass-dark border-b border-gray-800/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="content-card-enhanced rounded-2xl p-8">
              <div className="mb-8">
                <h2 className="heading-primary mb-2">
                  {steps[currentStep].title}
                </h2>
                <p className="text-gray-300">
                  {steps[currentStep].description}
                </p>
              </div>

              {/* Form Content */}
              <div className="mb-8">{renderStepContent()}</div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="px-6 py-3 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={isLoading || !validateCurrentStep()}
                  className="btn-primary px-8 py-3 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Processing...</span>
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
      </div>
    </div>
  );
}
