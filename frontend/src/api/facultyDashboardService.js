import axiosInstance from "./axiosInstance";

const facultyDashboardService = {
  async getFacultyDashboardStats() {
    const response = await axiosInstance.get("/faculty/dashboard");
    return response.data;
  },
};

export default facultyDashboardService;
