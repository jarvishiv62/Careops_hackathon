"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { useAuth } from "../../../lib/auth";
import Sidebar from "../../../components/features/Sidebar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  Users,
  MessageSquare,
  Calendar,
  FileText,
  Package,
  Link,
  TrendingUp,
  TrendingDown,
  Activity,
  Bell,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface DashboardStats {
  contacts: number;
  conversations: number;
  bookings: number;
  forms: number;
  inventory: number;
  integrations: number;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  userRole: string;
  _count: DashboardStats;
}

interface ActivityItem {
  id: string;
  type: "booking" | "conversation" | "form";
  title: string;
  description: string;
  timestamp: string;
  data?: any;
}

interface AnalyticsData {
  dailyBookings: { date: string; count: number }[];
  dailyContacts: { date: string; count: number }[];
  conversationByChannel: { channel: string; _count: number }[];
  bookingTypePerformance: {
    bookingTypeId: string;
    count: number;
    name: string;
  }[];
}

interface HealthMetrics {
  bookingConfirmationRate: number;
  bookingCompletionRate: number;
  conversationEngagementRate: number;
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  activeConversations: number;
  totalContacts: number;
  activeIntegrations: number;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, workspace, token } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    // Check authentication and load workspace data
    if (!token) {
      router.push("/login");
      return;
    }

    if (workspace) {
      loadDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [router, token, workspace]);

  const loadDashboardData = async () => {
    try {
      if (!token || !workspace) return;

      // Load comprehensive dashboard data
      const dashboardResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/overview`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (dashboardResponse.ok) {
        const dashboardResult = await dashboardResponse.json();
        setDashboardData(dashboardResult.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Role-based stat cards
  const getStatCards = () => {
    const userRole = workspace?.userRole || user?.role;

    const baseStats = [
      {
        title: "My Patients",
        value: dashboardData?.stats?.overview?.totalContacts || 0,
        icon: Users,
        color: "from-cyan-400 to-blue-500",
        bgColor: "bg-cyan-500/10",
        change: dashboardData?.stats?.growth?.contactGrowth || 0,
        changeType:
          (dashboardData?.stats?.growth?.contactGrowth || 0) >= 0
            ? "positive"
            : "negative",
      },
      {
        title: "My Appointments",
        value: dashboardData?.stats?.overview?.totalBookings || 0,
        icon: Calendar,
        color: "from-purple-400 to-pink-500",
        bgColor: "bg-purple-500/10",
        change: dashboardData?.stats?.growth?.bookingGrowth || 0,
        changeType:
          (dashboardData?.stats?.growth?.bookingGrowth || 0) >= 0
            ? "positive"
            : "negative",
      },
    ];

    const adminStats = [
      ...baseStats,
      {
        title: "Form Submissions",
        value: dashboardData?.stats?.overview?.totalForms || 0,
        icon: FileText,
        color: "from-orange-400 to-red-500",
        bgColor: "bg-orange-500/10",
        change: "+5%",
        changeType: "positive",
      },
      {
        title: "Active Conversations",
        value: dashboardData?.stats?.overview?.totalConversations || 0,
        icon: MessageSquare,
        color: "from-green-400 to-emerald-500",
        bgColor: "bg-green-500/10",
        change: "+8%",
        changeType: "positive",
      },
    ];

    const ownerStats = [
      ...adminStats,
      {
        title: "Inventory Items",
        value: dashboardData?.stats?.overview?.totalInventory || 0,
        icon: Package,
        color: "from-pink-500 to-pink-600",
        bgColor: "bg-pink-50",
        change: "+3%",
        changeType: "positive",
      },
      {
        title: "Active Integrations",
        value: dashboardData?.stats?.overview?.totalIntegrations || 0,
        icon: Link,
        color: "from-indigo-500 to-indigo-600",
        bgColor: "bg-indigo-50",
        change: "+2",
        changeType: "neutral",
      },
    ];

    // Return stats based on role
    switch (userRole) {
      case "OWNER":
        return ownerStats;
      case "ADMIN":
        return adminStats;
      case "MEMBER":
        return baseStats;
      default:
        return baseStats;
    }
  };

  const statCards = getStatCards();

  const recentActivity = [
    {
      id: 1,
      type: "contact",
      message: "New contact added: John Doe",
      time: "2 minutes ago",
      icon: "👤",
    },
    {
      id: 2,
      type: "booking",
      message: "New booking scheduled for tomorrow",
      time: "15 minutes ago",
      icon: "📅",
    },
    {
      id: 3,
      type: "form",
      message: "Contact form submitted",
      time: "1 hour ago",
      icon: "📝",
    },
    {
      id: 4,
      type: "conversation",
      message: "New conversation started",
      time: "2 hours ago",
      icon: "💬",
    },
  ];

  // Role-based quick actions
  const getQuickActions = () => {
    const userRole = workspace?.userRole || user?.role;

    const baseActions = [
      {
        title: "Add Patient",
        description: "Register a new patient",
        icon: Users,
        color: "bg-blue-500",
        action: () => router.push("/app/contacts/new"),
      },
      {
        title: "Schedule Appointment",
        description: "Book a new appointment",
        icon: Calendar,
        color: "bg-purple-500",
        action: () => router.push("/app/bookings/new"),
      },
      {
        title: "View Conversations",
        description: "Check patient messages",
        icon: MessageSquare,
        color: "bg-green-500",
        action: () => router.push("/app/inbox"),
      },
    ];

    const adminActions = [
      ...baseActions,
      {
        title: "Create Form",
        description: "Build a health form",
        icon: FileText,
        color: "bg-orange-500",
        action: () => router.push("/app/forms/new"),
      },
    ];

    const ownerActions = [
      ...adminActions,
      {
        title: "Add Supplies",
        description: "Add medical supplies",
        icon: Package,
        color: "bg-pink-500",
        action: () => router.push("/app/inventory/new"),
      },
    ];

    // Return actions based on role
    switch (userRole) {
      case "OWNER":
        return ownerActions;
      case "ADMIN":
        return adminActions;
      case "MEMBER":
        return baseActions;
      default:
        return baseActions;
    }
  };

  const quickActions = getQuickActions();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-bg flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col dashboard-content">
        {/* Header */}
        <header className="bg-black/40 backdrop-blur-xl shadow-lg border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-black text-white"
                >
                  Dashboard
                </motion.h1>
                {workspace && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="ml-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-bold shadow-lg shadow-purple-500/25"
                  >
                    {workspace.name}
                  </motion.span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-gray-300 hover:text-white relative transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  {dashboardData?.stats?.alerts?.inventoryAlertCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full glow-pulse"></span>
                  )}
                </motion.button>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/25 glow-pulse">
                  {workspace?.name?.charAt(0) || "U"}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="heading-primary">
              Welcome back, {workspace?.name || "User"}!
            </h2>
            <p className="mt-2 text-gray-300">
              Here's what's happening with your workspace today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="stat-card-enhanced p-6 rounded-2xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-300">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-black text-white mt-2">
                      {stat.value}
                    </p>
                    <div className="flex items-center mt-2">
                      <span
                        className={`text-sm font-bold ${
                          stat.changeType === "positive"
                            ? "text-green-400"
                            : stat.changeType === "negative"
                              ? "text-red-400"
                              : "text-gray-400"
                        }`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-400 ml-1">
                        from last month
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg ${
                      stat.color === "from-cyan-400 to-blue-500"
                        ? "gradient-cyan"
                        : stat.color === "from-purple-400 to-pink-500"
                          ? "gradient-purple"
                          : stat.color === "from-orange-400 to-red-500"
                            ? "gradient-orange"
                            : stat.color === "from-green-400 to-emerald-500"
                              ? "gradient-green"
                              : stat.color === "from-pink-500 to-pink-600"
                                ? "gradient-pink"
                                : "gradient-indigo"
                    }`}
                  >
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h3 className="heading-secondary mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{
                    y: -3,
                    boxShadow: "0 15px 35px rgba(139, 92, 246, 0.15)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={action.action}
                  className="action-card-enhanced p-6 text-left group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg ${
                      action.color === "bg-blue-500"
                        ? "gradient-cyan"
                        : action.color === "bg-purple-500"
                          ? "gradient-purple"
                          : action.color === "bg-green-500"
                            ? "gradient-green"
                            : action.color === "bg-orange-500"
                              ? "gradient-orange"
                              : "gradient-pink"
                    }`}
                  >
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-white mb-1">{action.title}</h4>
                  <p className="text-sm text-gray-300">{action.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Tabs and Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="content-card-enhanced rounded-2xl shadow-2xl border border-purple-500/20"
          >
            <div className="border-b border-purple-500/20">
              <nav className="flex -mb-px">
                {["overview", "analytics", "activity"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`tab-enhanced py-4 px-8 text-sm font-bold border-b-2 transition-all ${
                      activeTab === tab
                        ? "active text-purple-400"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {activeTab === "overview" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-xl font-semibold text-white mb-6">
                    Workspace Overview
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-4">
                        Recent Activity
                      </h4>
                      <div className="space-y-4">
                        {(dashboardData?.activity || recentActivity)
                          .slice(0, 5)
                          .map((activity: any, index: number) => (
                            <motion.div
                              key={activity.id || index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="activity-item-enhanced flex items-center space-x-4 p-3 rounded-lg"
                            >
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  activity.type === "booking"
                                    ? "bg-purple-500/20"
                                    : activity.type === "conversation"
                                      ? "bg-green-500/20"
                                      : "bg-orange-500/20"
                                }`}
                              >
                                {activity.type === "booking" ? (
                                  <Calendar className="w-5 h-5 text-purple-400" />
                                ) : activity.type === "conversation" ? (
                                  <MessageSquare className="w-5 h-5 text-green-400" />
                                ) : (
                                  <FileText className="w-5 h-5 text-orange-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-white">
                                  {activity.title || activity.message}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {activity.time ||
                                    new Date(
                                      activity.timestamp,
                                    ).toLocaleString()}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-300 mb-4">
                        Performance Metrics
                      </h4>
                      <div className="space-y-4">
                        <div className="metric-card flex justify-between items-center p-3 rounded-lg">
                          <span className="text-sm text-gray-300">
                            Booking Confirmation Rate
                          </span>
                          <span className="text-sm font-bold text-white">
                            {dashboardData?.health?.bookingConfirmationRate ||
                              0}
                            %
                          </span>
                        </div>
                        <div className="metric-card flex justify-between items-center p-3 rounded-lg">
                          <span className="text-sm text-gray-300">
                            Booking Completion Rate
                          </span>
                          <span className="text-sm font-bold text-white">
                            {dashboardData?.health?.bookingCompletionRate || 0}%
                          </span>
                        </div>
                        <div className="metric-card flex justify-between items-center p-3 rounded-lg">
                          <span className="text-sm text-gray-300">
                            Conversation Engagement
                          </span>
                          <span className="text-sm font-bold text-white">
                            {dashboardData?.health
                              ?.conversationEngagementRate || 0}
                            %
                          </span>
                        </div>
                        <div className="metric-card flex justify-between items-center p-3 rounded-lg">
                          <span className="text-sm text-gray-300">
                            Active Integrations
                          </span>
                          <span className="text-sm font-bold text-white">
                            {dashboardData?.health?.activeIntegrations || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "analytics" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-xl font-semibold text-white mb-6">
                    Analytics Dashboard
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="content-card-enhanced p-6 rounded-xl">
                      <h4 className="text-sm font-medium text-gray-300 mb-4">
                        Booking Trends
                      </h4>
                      {dashboardData?.analytics?.dailyBookings ? (
                        <Line
                          data={{
                            labels: dashboardData.analytics.dailyBookings.map(
                              (d: any) => new Date(d.date).toLocaleDateString(),
                            ),
                            datasets: [
                              {
                                label: "Bookings",
                                data: dashboardData.analytics.dailyBookings.map(
                                  (d: any) => d.count,
                                ),
                                borderColor: "rgb(139, 92, 246)",
                                backgroundColor: "rgba(139, 92, 246, 0.1)",
                                tension: 0.4,
                                fill: true,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: { display: false },
                            },
                            scales: {
                              y: { beginAtZero: true },
                            },
                          }}
                        />
                      ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">
                          No booking data available
                        </div>
                      )}
                    </div>
                    <div className="content-card-enhanced p-6 rounded-xl">
                      <h4 className="text-sm font-medium text-gray-300 mb-4">
                        Contact Growth
                      </h4>
                      {dashboardData?.analytics?.dailyContacts ? (
                        <Bar
                          data={{
                            labels: dashboardData.analytics.dailyContacts.map(
                              (d: any) => new Date(d.date).toLocaleDateString(),
                            ),
                            datasets: [
                              {
                                label: "New Contacts",
                                data: dashboardData.analytics.dailyContacts.map(
                                  (d: any) => d.count,
                                ),
                                backgroundColor: "rgba(16, 185, 129, 0.8)",
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: { display: false },
                            },
                            scales: {
                              y: { beginAtZero: true },
                            },
                          }}
                        />
                      ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">
                          No contact data available
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "activity" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-xl font-semibold text-white mb-6">
                    All Activity
                  </h3>
                  <div className="space-y-4">
                    {(dashboardData?.activity || []).map(
                      (activity: any, index: number) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="activity-item-enhanced flex items-center space-x-4 p-4 rounded-lg"
                        >
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              activity.type === "booking"
                                ? "bg-purple-500/20"
                                : activity.type === "conversation"
                                  ? "bg-green-500/20"
                                  : "bg-orange-500/20"
                            }`}
                          >
                            {activity.type === "booking" ? (
                              <Calendar className="w-6 h-6 text-purple-400" />
                            ) : activity.type === "conversation" ? (
                              <MessageSquare className="w-6 h-6 text-green-400" />
                            ) : (
                              <FileText className="w-6 h-6 text-orange-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">
                              {activity.title}
                            </p>
                            <p className="text-sm text-gray-300">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {activity.status && (
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  activity.status === "CONFIRMED"
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : activity.status === "PENDING"
                                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                      : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                }`}
                              >
                                {activity.status}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ),
                    )}
                    {(!dashboardData?.activity ||
                      dashboardData.activity.length === 0) && (
                      <div className="text-center py-12">
                        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">No recent activity</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
