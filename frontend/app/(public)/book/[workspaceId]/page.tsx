// frontend/app/(public)/book/[workspaceId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Send,
} from "lucide-react";

interface BookingType {
  id: string;
  name: string;
  description?: string;
  duration: number;
  location?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
}

interface WorkspaceInfo {
  id: string;
  name: string;
  description?: string;
}

export default function PublicBookingPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { workspace } = useAuth();

  // Use the authenticated workspace ID if available, otherwise use the URL parameter
  const actualWorkspaceId = workspace?.id || workspaceId;
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(
    null,
  );
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);

  const [step, setStep] = useState(1);
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([]);
  const [selectedType, setSelectedType] = useState<BookingType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    fetchWorkspaceInfo();
    fetchBookingTypes();
  }, []);

  useEffect(() => {
    if (selectedType && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedType, selectedDate]);

  const fetchWorkspaceInfo = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/contacts/public/${actualWorkspaceId}/info`,
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWorkspaceInfo(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching workspace info:", error);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const fetchBookingTypes = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/public/${actualWorkspaceId}/types`,
      );
      const data = await response.json();
      if (data.success) {
        setBookingTypes(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch booking types:", error);
    }
  };

  const fetchAvailableSlots = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/public/${actualWorkspaceId}/availability?bookingTypeId=${selectedType?.id}&date=${selectedDate}`,
      );
      const data = await response.json();
      if (data.success) {
        setAvailableSlots(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch slots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/public/${actualWorkspaceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingTypeId: selectedType?.id,
            startTime: selectedSlot?.startTime,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            notes: formData.notes,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      setConfirmationData(data.data);
      setBookingConfirmed(true);
    } catch (error: any) {
      setError(error.message || "Failed to create booking");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate next 14 days
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = dayjs().add(i, "day");
    return {
      value: date.format("YYYY-MM-DD"),
      label: date.format("ddd, MMM D"),
    };
  });

  if (bookingConfirmed && confirmationData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <div className="mb-4 text-6xl">✅</div>
            <h1 className="text-3xl font-bold text-green-600">
              Booking Confirmed!
            </h1>
            <p className="mt-4 text-gray-600">
              Thank you, {confirmationData.contact.name}! Your booking has been
              confirmed.
            </p>

            <div className="mt-6 space-y-3 rounded-lg bg-gray-50 p-6 text-left">
              <p>
                <strong>Service:</strong> {confirmationData.bookingType.name}
              </p>
              <p>
                <strong>Date & Time:</strong>{" "}
                {dayjs(confirmationData.startTime).format(
                  "MMMM D, YYYY [at] h:mm A",
                )}
              </p>
              <p>
                <strong>Duration:</strong>{" "}
                {confirmationData.bookingType.duration} minutes
              </p>
              <p>
                <strong>Reference Code:</strong>{" "}
                <span className="font-mono font-bold">
                  {confirmationData.referenceCode}
                </span>
              </p>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              A confirmation email has been sent to{" "}
              {confirmationData.contact.email}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Book an Appointment</h1>
          <p className="mt-2 text-gray-600">
            Select a service and time that works for you
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          {/* Step 1: Select Service */}
          {step === 1 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">Select a Service</h2>
              {bookingTypes.length === 0 ? (
                <p className="text-gray-500">
                  No services available at this time.
                </p>
              ) : (
                <div className="space-y-3">
                  {bookingTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedType(type);
                        setStep(2);
                      }}
                      className="w-full rounded-lg border-2 border-gray-200 p-4 text-left hover:border-blue-500 hover:bg-blue-50"
                    >
                      <h3 className="font-semibold">{type.name}</h3>
                      {type.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {type.description}
                        </p>
                      )}
                      <div className="mt-2 flex gap-4 text-sm text-gray-500">
                        <span>⏱️ {type.duration} min</span>
                        {type.location && <span>📍 {type.location}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Date */}
          {step === 2 && (
            <div>
              <button
                onClick={() => setStep(1)}
                className="mb-4 text-sm text-blue-600 hover:underline"
              >
                ← Back to services
              </button>

              <h2 className="mb-4 text-xl font-semibold">
                Select a Date - {selectedType?.name}
              </h2>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {availableDates.map((date) => (
                  <button
                    key={date.value}
                    onClick={() => {
                      setSelectedDate(date.value);
                      setStep(3);
                    }}
                    className="rounded-lg border-2 border-gray-200 p-3 hover:border-blue-500 hover:bg-blue-50"
                  >
                    {date.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Time */}
          {step === 3 && (
            <div>
              <button
                onClick={() => setStep(2)}
                className="mb-4 text-sm text-blue-600 hover:underline"
              >
                ← Back to dates
              </button>

              <h2 className="mb-4 text-xl font-semibold">
                Select a Time - {dayjs(selectedDate).format("MMM D, YYYY")}
              </h2>

              {isLoading ? (
                <p className="text-center text-gray-500">
                  Loading available times...
                </p>
              ) : availableSlots.length === 0 ? (
                <p className="text-center text-gray-500">
                  No available times for this date. Please select another date.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep(4);
                      }}
                      className="rounded-lg border-2 border-gray-200 p-3 hover:border-blue-500 hover:bg-blue-50"
                    >
                      {dayjs(slot.startTime).format("h:mm A")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Contact Info */}
          {step === 4 && (
            <div>
              <button
                onClick={() => setStep(3)}
                className="mb-4 text-sm text-blue-600 hover:underline"
              >
                ← Back to times
              </button>

              <h2 className="mb-4 text-xl font-semibold">Your Information</h2>

              <div className="mb-6 rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  <strong>Service:</strong> {selectedType?.name}
                  <br />
                  <strong>Date & Time:</strong>{" "}
                  {dayjs(selectedSlot?.startTime).format(
                    "MMM D, YYYY [at] h:mm A",
                  )}
                </p>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-md bg-blue-600 py-3 text-white hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {isLoading ? "Booking..." : "Confirm Booking"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
