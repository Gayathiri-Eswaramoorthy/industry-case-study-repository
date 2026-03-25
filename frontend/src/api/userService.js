import axiosInstance from "./axiosInstance";

export const getUsers = async ({ page = 0, size = 5, role = null }) => {
  const params = { page, size };
  if (role) params.role = role;
  const response = await axiosInstance.get("/users", { params });
  return response.data?.data;
};

export const getUserStats = async () => {
  const response = await axiosInstance.get("/users/stats");
  return response.data?.data ?? { total: 0, faculty: 0, student: 0, admin: 0 };
};

export const deleteUser = async (id) => {
  await axiosInstance.delete(`/users/${id}`);
};

export const createUser = async (userData) => {
  const response = await axiosInstance.post("/admin/users", userData);
  return response.data;
};

export const resetUserPassword = async ({ userId, newPassword }) => {
  const response = await axiosInstance.put(`/admin/users/${userId}/reset-password`, {
    newPassword,
  });
  return response.data;
};

export const getFacultyList = async () => {
  const response = await axiosInstance.get("/users/faculty");
  return response.data?.data ?? response.data ?? [];
};

export const reassignStudent = async ({ studentId, newFacultyId }) => {
  const response = await axiosInstance.put(
    `/admin/students/${studentId}/reassign`,
    null,
    { params: { newFacultyId } }
  );
  return response.data;
};

// Admin — faculty approvals
export const getPendingFaculty = async () => {
  const response = await axiosInstance.get("/admin/pending-faculty");
  return response.data;
};

export const approveFaculty = async (id) => {
  const response = await axiosInstance.put(`/admin/faculty/${id}/approve`);
  return response.data;
};

export const rejectFaculty = async ({ id, reason }) => {
  const response = await axiosInstance.put(`/admin/faculty/${id}/reject`, null, {
    params: { reason },
  });
  return response.data;
};

// Faculty — student approvals
export const getPendingStudents = async () => {
  const response = await axiosInstance.get("/faculty/pending-students");
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
};

export const approveStudent = async (id) => {
  const response = await axiosInstance.put(`/faculty/students/${id}/approve`);
  return response.data;
};

export const rejectStudent = async ({ id, reason }) => {
  const response = await axiosInstance.put(`/faculty/students/${id}/reject`, null, {
    params: { reason },
  });
  return response.data;
};

export const getFacultyStudentAnalytics = async () => {
  const response = await axiosInstance.get("/admin/students/faculty-analytics");
  return Array.isArray(response.data) ? response.data : [];
};

export const getStudentsByFaculty = async ({
  facultyId,
  page = 0,
  size = 10,
  status = "ALL",
}) => {
  const response = await axiosInstance.get(`/admin/students/faculty/${facultyId}`, {
    params: { page, size, status },
  });
  return response.data;
};
