import axiosInstance from "./axiosInstance";

export const getUsers = async ({ page = 0, size = 5 }) => {
  const response = await axiosInstance.get(`/users?page=${page}&size=${size}`);
  return response.data?.data;
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
