import dashboardService from "./dashboard.service.js";

const getDashboardData = async (req, res) => {
  try {
    const { workspaceId, userRole } = req;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: "Workspace ID required",
      });
    }

    const [dashboardStats, analyticsData, activityFeed, workspaceHealth] =
      await Promise.all([
        dashboardService.getDashboardStats(workspaceId, userRole),
        dashboardService.getAnalyticsData(workspaceId, "30d", userRole),
        dashboardService.getActivityFeed(workspaceId, 10, userRole),
        dashboardService.getWorkspaceHealth(workspaceId, userRole),
      ]);

    res.json({
      success: true,
      data: {
        stats: dashboardStats,
        analytics: analyticsData,
        activity: activityFeed,
        health: workspaceHealth,
      },
    });
  } catch (error) {
    console.error("Error in getDashboardData:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch dashboard data",
    });
  }
};

const getWorkspaceStats = async (req, res) => {
  try {
    const { workspaceId } = req;
    const { period = "30d" } = req.query;

    const stats = await dashboardService.getDashboardStats(workspaceId);
    const analytics = await dashboardService.getAnalyticsData(
      workspaceId,
      period,
    );

    res.json({
      success: true,
      data: {
        ...stats,
        analytics,
      },
    });
  } catch (error) {
    console.error("Error in getWorkspaceStats:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch workspace statistics",
    });
  }
};

const getActivityFeed = async (req, res) => {
  try {
    const { workspaceId } = req;
    const { limit = 20 } = req.query;

    const activities = await dashboardService.getActivityFeed(
      workspaceId,
      parseInt(limit),
    );

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Error in getActivityFeed:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch activity feed",
    });
  }
};

const getWorkspaceHealth = async (req, res) => {
  try {
    const { workspaceId } = req;

    const health = await dashboardService.getWorkspaceHealth(workspaceId);

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error("Error in getWorkspaceHealth:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch workspace health",
    });
  }
};

export default {
  getDashboardData,
  getWorkspaceStats,
  getActivityFeed,
  getWorkspaceHealth,
};
