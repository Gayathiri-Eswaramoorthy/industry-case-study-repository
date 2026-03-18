import axiosInstance from "../api/axiosInstance";

export const getStudentCoAttainment = async (studentId) => {
  const response = await axiosInstance.get(`/students/${studentId}/co-attainment`);
  return response.data?.data ?? response.data ?? [];
};

export const getStudentPoAttainment = async (studentId) => {
  const response = await axiosInstance.get(`/students/${studentId}/po-attainment`);
  return response.data?.data ?? response.data ?? [];
};
