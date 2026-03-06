import axiosInstance from "../../../api/axiosInstance";

function normalizeDashboardData(responseData) {
  const raw = responseData?.data ?? responseData ?? {};

  return {
    totalUsers: Number(raw.totalUsers ?? 0),
    totalCases: Number(raw.totalCases ?? 0),
    totalSubmissions: Number(raw.totalSubmissions ?? 0),
    activeCases: Number(raw.activeCases ?? 0),
    pendingReviews: Number(raw.pendingReviews ?? 0),
    activeFaculty: Number(raw.activeFaculty ?? 0),
  };
}

const analyticsService = {
  async getDashboardStats() {
    const response = await axiosInstance.get("/admin/analytics/dashboard");
    return normalizeDashboardData(response.data);
  },

  async getUserAnalytics() {
    const response = await axiosInstance.get("/admin/analytics/users");
    return response.data;
  },

  async getCaseAnalytics() {
    const response = await axiosInstance.get("/admin/analytics/cases");
    return response.data;
  },

  async getSubmissionAnalytics() {
    const response = await axiosInstance.get("/admin/analytics/submissions");
    return response.data;
  },
};

export default analyticsService;
