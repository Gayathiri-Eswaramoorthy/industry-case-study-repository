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

  async getCoAttainmentSummary() {
    const response = await axiosInstance.get("/admin/analytics/co-attainment-summary");
    return response.data;
  },

  async getTopCases() {
    const response = await axiosInstance.get("/admin/analytics/top-cases");
    return response.data;
  },

  async getFacultyPerformance() {
    const response = await axiosInstance.get("/admin/faculty-performance");
    return Array.isArray(response.data) ? response.data : [];
  },

  async getOverallStats() {
    const response = await axiosInstance.get("/admin/overall-stats");
    return response.data ?? {};
  },

  async getFacultyStudentsBreakdown(facultyId) {
    if (facultyId === null || facultyId === undefined || facultyId === "") {
      throw new Error("Faculty ID is required for student breakdown.");
    }
    const response = await axiosInstance.get(`/admin/faculty-performance/${facultyId}/students`);
    return response.data ?? null;
  },
};

export default analyticsService;
