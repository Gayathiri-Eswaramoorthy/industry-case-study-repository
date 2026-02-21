import axiosInstance from "./axiosInstance";

export const loginUser = async (email, password) => {
  const response = await axiosInstance.post(
    "/auth/login",
    {
      email,
      password,
    },
    {
      responseType: "text",
    }
  );

  return response.data;
};
