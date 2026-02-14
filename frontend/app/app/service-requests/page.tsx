// frontend/app/app/service-requests/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Filter,
  Search,
  Edit,
  Eye,
} from "lucide-react";

interface ServiceRequest {
  id: string;
  referenceId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  serviceType: string;
  urgency: string;
  preferredDate?: string;
  preferredTime?: string;
  message: string;
  additionalInfo?: string;
  status: string;
  staffNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const urgencyColors = {
  low: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusColors = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  IN_PROGRESS: "bg-blue-500/20 text-blue-400",
  COMPLETED: "bg-green-500/20 text-green-400",
  CANCELLED: "bg-gray-500/20 text-gray-400",
};

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [staffNotes, setStaffNotes] = useState("");

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, urgencyFilter]);

  const fetchServiceRequests = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/service-requests`,
      );
      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error("Error fetching service requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          request.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.referenceId.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    // Urgency filter
    if (urgencyFilter !== "all") {
      filtered = filtered.filter(
        (request) => request.urgency === urgencyFilter,
      );
    }

    setFilteredRequests(filtered);
  };

  const handleViewDetails = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setStaffNotes(request.staffNotes || "");
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/service-requests/${selectedRequest.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            staffNotes,
          }),
        },
      );

      if (response.ok) {
        await fetchServiceRequests();
        setShowStatusModal(false);
        setShowDetailsModal(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading service requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-dark border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-secondary flex items-center">
                <FileText className="w-6 h-6 mr-2 text-purple-400" />
                Service Requests
              </h1>
              <p className="text-gray-300 mt-1">
                Manage and respond to customer service requests
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Total: {requests.length} | Filtered: {filteredRequests.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-dark border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or reference ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Urgency Filter */}
            <div>
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Urgency</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-100 mb-2">
              No service requests found
            </h3>
            <p className="text-gray-400">
              {searchTerm || statusFilter !== "all" || urgencyFilter !== "all"
                ? "Try adjusting your filters"
                : "No service requests have been submitted yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-bold text-gray-100">
                        {request.firstName} {request.lastName}
                      </h3>
                      <span className="text-sm text-gray-400">
                        #{request.referenceId}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${urgencyColors[request.urgency as keyof typeof urgencyColors]}`}
                      >
                        {request.urgency.toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[request.status as keyof typeof statusColors]}`}
                      >
                        {request.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-300">
                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                        {request.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                        {request.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <FileText className="w-4 h-4 mr-2 text-gray-500" />
                        {request.serviceType}
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {request.message && (
                      <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-200 line-clamp-2">
                          {request.message}
                        </p>
                      </div>
                    )}

                    {request.preferredDate && (
                      <div className="flex items-center text-sm text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        Preferred: {request.preferredDate}{" "}
                        {request.preferredTime && `at ${request.preferredTime}`}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(request)}
                      className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-gradient max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <h2 className="heading-secondary">Service Request Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="heading-secondary mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-purple-400" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Name</p>
                    <p className="font-medium text-gray-100">
                      {selectedRequest.firstName} {selectedRequest.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="font-medium text-gray-100">
                      {selectedRequest.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <p className="font-medium text-gray-100">
                      {selectedRequest.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Company</p>
                    <p className="font-medium text-gray-100">
                      {selectedRequest.company || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className="heading-secondary mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-400" />
                  Service Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-300">Service Type</p>
                    <p className="font-medium text-gray-200">
                      {selectedRequest.serviceType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Urgency</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${urgencyColors[selectedRequest.urgency as keyof typeof urgencyColors]}`}
                    >
                      {selectedRequest.urgency.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Status</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusColors[selectedRequest.status as keyof typeof statusColors]}`}
                    >
                      {selectedRequest.status.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Reference ID</p>
                    <p className="font-medium text-gray-200">
                      #{selectedRequest.referenceId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <h3 className="heading-secondary mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-purple-400" />
                  Message
                </h3>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-200">{selectedRequest.message}</p>
                </div>
              </div>

              {/* Staff Notes */}
              <div>
                <h3 className="heading-secondary mb-4 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-purple-400" />
                  Staff Notes
                </h3>
                <textarea
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Add notes about this request..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-700/50 flex justify-between">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn-outline"
              >
                Close
              </button>
              <div className="space-x-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="">Change Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <button
                  onClick={() => setShowStatusModal(true)}
                  disabled={!newStatus}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Status
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Status Confirmation Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-gradient max-w-md w-full"
          >
            <div className="p-6">
              <h3 className="heading-secondary mb-4">Update Request Status</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to change status to{" "}
                <span className="font-bold text-purple-400">
                  {newStatus.replace("_", " ")}
                </span>
                ?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button onClick={handleUpdateStatus} className="btn-primary">
                  Confirm Update
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
