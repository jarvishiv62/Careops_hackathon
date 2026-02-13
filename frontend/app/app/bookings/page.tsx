// frontend/app/app/bookings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import dayjs from "dayjs";

interface Booking {
  id: string;
  referenceCode: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
  notes?: string;
  contact: {
    name: string;
    email?: string;
    phone?: string;
  };
  bookingType: {
    name: string;
    duration: number;
  };
}

export default function BookingsPage() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "today">(
    "upcoming",
  );

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/bookings`;

      if (filter === "upcoming") {
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/upcoming`;
      } else if (filter === "today") {
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/today`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (bookingId: string, status: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${bookingId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "NO_SHOW":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="mt-2 text-gray-600">Manage appointments and bookings</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter("today")}
            className={`rounded-md px-4 py-2 ${
              filter === "today"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`rounded-md px-4 py-2 ${
              filter === "upcoming"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`rounded-md px-4 py-2 ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            All
          </button>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="text-center">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-lg bg-white p-6 shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {booking.contact.name}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                          booking.status,
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>
                        <strong>Service:</strong> {booking.bookingType.name}
                      </p>
                      <p>
                        <strong>Time:</strong>{" "}
                        {dayjs(booking.startTime).format(
                          "MMM D, YYYY [at] h:mm A",
                        )}
                      </p>
                      <p>
                        <strong>Duration:</strong>{" "}
                        {booking.bookingType.duration} minutes
                      </p>
                      <p>
                        <strong>Reference:</strong> {booking.referenceCode}
                      </p>
                      {booking.contact.email && (
                        <p>
                          <strong>Email:</strong> {booking.contact.email}
                        </p>
                      )}
                      {booking.contact.phone && (
                        <p>
                          <strong>Phone:</strong> {booking.contact.phone}
                        </p>
                      )}
                      {booking.notes && (
                        <p>
                          <strong>Notes:</strong> {booking.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {booking.status === "PENDING" && (
                      <button
                        onClick={() => updateStatus(booking.id, "CONFIRMED")}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        Confirm
                      </button>
                    )}
                    {booking.status === "CONFIRMED" && (
                      <button
                        onClick={() => updateStatus(booking.id, "COMPLETED")}
                        className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                      >
                        Mark Complete
                      </button>
                    )}
                    {["PENDING", "CONFIRMED"].includes(booking.status) && (
                      <>
                        <button
                          onClick={() => updateStatus(booking.id, "NO_SHOW")}
                          className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          No Show
                        </button>
                        <button
                          onClick={() => updateStatus(booking.id, "CANCELLED")}
                          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
