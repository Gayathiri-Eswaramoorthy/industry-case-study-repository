import axiosInstance from "../api/axiosInstance";

const facultySubmissionService = {
  async getFacultySubmissions() {
    const response = await axiosInstance.get("/faculty/submissions");
    return response.data;
  },

  async getFacultySubmission(submissionId) {
    const response = await axiosInstance.get(`/faculty/submissions/${submissionId}`);
    return response.data;
  },

  async evaluateSubmission(submissionId, payload) {
    const response = await axiosInstance.put(`/submissions/${submissionId}/evaluate`, payload);
    return response.data;
  },
};

export default facultySubmissionService;
