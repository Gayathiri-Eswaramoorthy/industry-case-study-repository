import axiosInstance from './axiosInstance';

export const getMySubmissions = async () => {
  const response = await axiosInstance.get('/submissions/my');
  return response.data;
};
