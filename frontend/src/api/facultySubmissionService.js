import axiosInstance from './axiosInstance';

export const getSubmissionsForCase = async (caseId) => {
  const response = await axiosInstance.get(`/submissions/case/${caseId}`);
  return response.data;
};

export const evaluateSubmission = async (id, marks, comment) => {
  const params = new URLSearchParams();
  params.append('marks', marks);
  if (comment) {
    params.append('comment', comment);
  }
  
  const response = await axiosInstance.patch(`/submissions/${id}/evaluate?${params.toString()}`);
  return response.data;
};
