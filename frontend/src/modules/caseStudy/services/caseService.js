import axiosInstance from "../../../api/axiosInstance";

const caseService = {
  async getAllCases({ courseId, page, size, status }) {
    if (!courseId || courseId === "undefined") {
      return [];
    }

    const params = {};
    if (status) params.status = status;
    if (page !== undefined && page !== null) params.page = page;
    if (size !== undefined && size !== null) params.size = size;

    const response = await axiosInstance.get(`/cases/course/${courseId}`, {
      params,
    });
    return response.data?.data ?? response.data;
  },

  async getCaseById(caseId) {
    const response = await axiosInstance.get(`/cases/${caseId}`);
    return response.data.data;
  },

  async createCase(payload) {
    const hasFile = payload?.caseMaterial instanceof File;

    if (hasFile) {
      const requestPayload = { ...payload };
      const caseMaterial = requestPayload.caseMaterial;
      delete requestPayload.caseMaterial;

      const formData = new FormData();
      formData.append(
        "request",
        new Blob([JSON.stringify(requestPayload)], { type: "application/json" })
      );
      formData.append("caseMaterial", caseMaterial);

      const response = await axiosInstance.post("/cases", formData);
      return response.data?.data ?? response.data;
    }

    const response = await axiosInstance.post("/cases", payload);
    return response.data?.data ?? response.data;
  },

  async updateCase(caseId, payload, role) {
    const url =
      role === "ADMIN" ? `/cases/${caseId}` : `/faculty/cases/${caseId}`;
    const response = await axiosInstance.put(url, payload);
    return response.data?.data ?? response.data;
  },

  async publishCase(caseId) {
    const response = await axiosInstance.put(`/admin/cases/${caseId}/publish`);
    return response.data;
  },
};

export default caseService;

