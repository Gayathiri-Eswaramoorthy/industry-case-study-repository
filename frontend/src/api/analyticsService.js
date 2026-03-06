import axiosInstance from "./axiosInstance";

export const getDashboardStats = async () => {
  const response = await axiosInstance.get("/admin/analytics/dashboard");
  return response.data;
};
