// frontend/app/app/booking-types/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

interface BookingType {
  id: string;
  name: string;
  description?: string;
  duration: number;
  location?: string;
  isActive: boolean;
  availabilityRules: AvailabilityRule[];
}

interface AvailabilityRule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function BookingTypesPage() {
  const { token, user } = useAuth();
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<BookingType | null>(null);

  useEffect(() => {
    fetchBookingTypes();
  }, []);

  const fetchBookingTypes = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/types`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setBookingTypes(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch booking types:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBookingType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking type?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/types/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        fetchBookingTypes();
      }
    } catch (error) {
      console.error("Failed to delete booking type:", error);
    }
  };

  if (user?.role !== "OWNER") {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-gray-600">
            Only workspace owners can manage booking types.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Booking Types</h1>
            <p className="mt-2 text-gray-600">
              Manage your service types and availability
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Add Service
          </button>
        </div>

        {isLoading ? (
          <div className="text-center">Loading...</div>
        ) : bookingTypes.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-gray-500">
              No booking types yet. Create your first service!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookingTypes.map((type) => (
              <div key={type.id} className="rounded-lg bg-white p-6 shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{type.name}</h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          type.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {type.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {type.description && (
                      <p className="mt-2 text-gray-600">{type.description}</p>
                    )}

                    <div className="mt-4 space-y-2 text-sm">
                      <p>
                        <strong>Duration:</strong> {type.duration} minutes
                      </p>
                      {type.location && (
                        <p>
                          <strong>Location:</strong> {type.location}
                        </p>
                      )}

                      {type.availabilityRules.length > 0 && (
                        <div className="mt-4">
                          <strong className="block mb-2">Availability:</strong>
                          <div className="space-y-1">
                            {type.availabilityRules.map((rule) => (
                              <div
                                key={rule.id}
                                className="flex items-center gap-2 text-sm text-gray-600"
                              >
                                <span className="font-medium">
                                  {DAYS[rule.dayOfWeek]}:
                                </span>
                                <span>
                                  {rule.startTime} - {rule.endTime}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedType(type)}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteBookingType(type.id)}
                      className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddModal && (
          <AddBookingTypeModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              fetchBookingTypes();
            }}
          />
        )}

        {selectedType && (
          <EditAvailabilityModal
            bookingType={selectedType}
            onClose={() => setSelectedType(null)}
            onSuccess={() => {
              setSelectedType(null);
              fetchBookingTypes();
            }}
          />
        )}
      </div>
    </div>
  );
}

function AddBookingTypeModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 60,
    location: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/types`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking type");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold">Add Service Type</h2>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Service Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., Consultation, Therapy Session"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Duration (minutes) *
            </label>
            <input
              type="number"
              required
              min="15"
              step="15"
              value={formData.duration}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setFormData({
                  ...formData,
                  duration: isNaN(value) ? 60 : value,
                });
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., Office, Online"
            />
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
              disabled={isSubmitting}
              className="flex-1 rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isSubmitting ? "Creating..." : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditAvailabilityModal({
  bookingType,
  onClose,
  onSuccess,
}: {
  bookingType: BookingType;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { token } = useAuth();
  const [newRule, setNewRule] = useState({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
  });
  const [isAdding, setIsAdding] = useState(false);

  const addAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/types/${bookingType.id}/availability`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newRule),
        },
      );

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to add availability:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold">Manage Availability</h2>
        <p className="mt-1 text-sm text-gray-600">{bookingType.name}</p>

        <form onSubmit={addAvailability} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Day of Week</label>
            <select
              value={newRule.dayOfWeek}
              onChange={(e) =>
                setNewRule({ ...newRule, dayOfWeek: parseInt(e.target.value) })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              {DAYS.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Start Time</label>
              <input
                type="time"
                value={newRule.startTime}
                onChange={(e) =>
                  setNewRule({ ...newRule, startTime: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">End Time</label>
              <input
                type="time"
                value={newRule.endTime}
                onChange={(e) =>
                  setNewRule({ ...newRule, endTime: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isAdding}
            className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isAdding ? "Adding..." : "Add Time Slot"}
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-md border border-gray-300 py-2 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}
