import axiosInstance from "../api/axiosInstance";

export const getStudentDashboard = async () => {
  const res = await axiosInstance.get("/student/dashboard");
  return res.data;
};
