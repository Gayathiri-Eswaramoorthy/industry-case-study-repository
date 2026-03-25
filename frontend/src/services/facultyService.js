import axios from "../utils/axios";

export const getFacultyAnalytics = async () => {
  const res = await axios.get("/faculty/analytics");
  return res.data;
};

export const getAssignedStudents = async () => {
  const res = await axios.get("/faculty/students/assigned");
  return Array.isArray(res.data) ? res.data : [];
};
