import axiosInstance from "../../../api/axiosInstance";

const submissionService = {
  async submitSolution(payload) {
    const response = await axiosInstance.post("/submissions", payload);
    return response.data;
  },

  async getMySubmissions() {
    const response = await axiosInstance.get("/submissions/my");
    return response.data;
  },

  async getSubmissionsByCase(caseId) {
    const response = await axiosInstance.get(`/submissions/case/${caseId}`);
    return response.data;
  },

  async evaluateSubmission(submissionId, marks, comment) {
    const response = await axiosInstance.patch(
      `/submissions/${submissionId}/evaluate`,
      null,
      {
        params: { marks, comment },
      }
    );
    return response.data;
  },
};

export default submissionService;
