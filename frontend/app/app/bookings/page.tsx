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
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "CONFIRMED":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "COMPLETED":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "NO_SHOW":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "CANCELLED":
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="heading-primary">Bookings</h1>
          <p className="mt-2 text-gray-300">Manage appointments and bookings</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter("today")}
            className={`rounded-xl px-4 py-2 ${
              filter === "today" ? "btn-primary" : "btn-outline"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`rounded-xl px-4 py-2 ${
              filter === "upcoming" ? "btn-primary" : "btn-outline"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl px-4 py-2 ${
              filter === "all" ? "btn-primary" : "btn-outline"
            }`}
          >
            All
          </button>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="card-gradient p-8 text-center">
            <p className="text-gray-400">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="card-gradient hover-glow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-100">
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

                    <div className="mt-2 space-y-1 text-sm text-gray-300">
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
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        Confirm
                      </button>
                    )}
                    {booking.status === "CONFIRMED" && (
                      <button
                        onClick={() => updateStatus(booking.id, "COMPLETED")}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        Mark Complete
                      </button>
                    )}
                    {["PENDING", "CONFIRMED"].includes(booking.status) && (
                      <>
                        <button
                          onClick={() => updateStatus(booking.id, "NO_SHOW")}
                          className="btn-outline px-4 py-2 text-sm text-red-400 hover:text-red-300"
                        >
                          No Show
                        </button>
                        <button
                          onClick={() => updateStatus(booking.id, "CANCELLED")}
                          className="btn-outline px-4 py-2 text-sm"
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
