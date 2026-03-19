import axiosInstance from "../api/axiosInstance";

export const getStudentCoAttainment = async (studentId) => {
  console.log("Fetching CO attainment for studentId:", studentId);
  const response = await axiosInstance.get(`/students/${studentId}/co-attainment`);
  console.log("CO attainment response:", response.data);
  return response.data?.data ?? response.data ?? [];
};

export const getStudentPoAttainment = async (studentId) => {
  console.log("Fetching PO attainment for studentId:", studentId);
  const response = await axiosInstance.get(`/students/${studentId}/po-attainment`);
  console.log("PO attainment response:", response.data);
  return response.data?.data ?? response.data ?? [];
};
