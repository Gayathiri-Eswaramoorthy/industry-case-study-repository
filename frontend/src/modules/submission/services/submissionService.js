import axiosInstance from "../../../api/axiosInstance";

const submissionService = {
  async submitSolution({ caseId, submissionType, solutionText, githubLink, file, selfRating }) {
    if (submissionType === "PDF") {
      const formData = new FormData();
      formData.append("caseId", String(caseId));
      if (selfRating != null) {
        formData.append("selfRating", String(selfRating));
      }
      formData.append("file", file);

      const response = await axiosInstance.post("/submissions", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    }

    const payload = {
      caseId,
      selfRating,
      ...(submissionType === "TEXT" ? { solutionText } : {}),
      ...(submissionType === "GITHUB_LINK" ? { githubLink } : {}),
    };

    const response = await axiosInstance.post("/submissions", payload);
    return response.data;
  },

  async getMySubmissions({ page = 0, size = 10 } = {}) {
    const response = await axiosInstance.get("/submissions/my", {
      params: { page, size },
    });
    return response.data?.data ?? response.data ?? {
      content: [],
      page,
      size,
      totalElements: 0,
      totalPages: 0,
      last: true,
    };
  },

  async getSubmissionsByCase(caseId) {
    const response = await axiosInstance.get(`/submissions/case/${caseId}`);
    return response.data;
  },

  async getCoScores(submissionId) {
    const response = await axiosInstance.get(`/submissions/${submissionId}/co-scores`);
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
