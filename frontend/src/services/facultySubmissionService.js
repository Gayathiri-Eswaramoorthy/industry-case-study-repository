import axiosInstance from "../api/axiosInstance";

async function extractApiError(error, fallbackMessage) {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      return parsed?.message || parsed?.error || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }

  return data?.message || data?.error || fallbackMessage;
}

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

  async downloadSubmissionPdf(submissionId, originalName) {
    let response;
    try {
      response = await axiosInstance.get(`/submissions/${submissionId}/pdf`, {
        responseType: "blob",
      });
    } catch (error) {
      const message = await extractApiError(error, "Unable to download submitted PDF.");
      throw new Error(message);
    }

    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = originalName || "submission.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async viewSubmissionPdf(submissionId) {
    let response;
    try {
      response = await axiosInstance.get(`/submissions/${submissionId}/pdf`, {
        responseType: "blob",
      });
    } catch (error) {
      const message = await extractApiError(error, "Unable to open submitted PDF.");
      throw new Error(message);
    }

    return response.data;
  },
};

export default facultySubmissionService;
