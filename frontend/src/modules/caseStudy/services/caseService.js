import axiosInstance from "../../../api/axiosInstance";

const caseService = {
  async getAllCases({ courseId, page, size, status }) {
    const params = {};
    if (status) params.status = status;
    if (page !== undefined && page !== null) params.page = page;
    if (size !== undefined && size !== null) params.size = size;

    const endpoint =
      courseId && courseId !== "undefined" ? `/cases/course/${courseId}` : "/cases";

    const response = await axiosInstance.get(endpoint, {
      params,
    });
    return response.data?.data ?? response.data ?? {
      content: [],
      page: 0,
      size: size ?? 10,
      totalElements: 0,
      totalPages: 0,
      last: true,
    };
  },

  async getCaseById(caseId) {
    const response = await axiosInstance.get(`/cases/${caseId}`);
    return response.data.data;
  },

  async getCourseOutcomes(courseId) {
    const response = await axiosInstance.get(`/course-outcomes/${courseId}`);
    return response.data?.data ?? response.data ?? [];
  },

  async getAllCourseOutcomes() {
    const response = await axiosInstance.get("/course-outcomes");
    return response.data?.data ?? response.data ?? [];
  },

  async createCourseOutcome(payload) {
    const response = await axiosInstance.post("/course-outcomes", payload);
    return response.data?.data ?? response.data;
  },

  async getProgramOutcomes() {
    const response = await axiosInstance.get("/program-outcomes");
    return response.data?.data ?? response.data ?? [];
  },

  async createProgramOutcome(payload) {
    const response = await axiosInstance.post("/program-outcomes", payload);
    return response.data?.data ?? response.data;
  },

  async updateCoPoMapping(coId, poIds) {
    const response = await axiosInstance.put(`/co-po-mapping/${coId}`, { poIds });
    return response.data?.data ?? response.data;
  },

  async getCourses() {
    const response = await axiosInstance.get("/courses");
    return response.data?.data ?? response.data ?? [];
  },

  async getAttemptTimeline(caseId) {
    const response = await axiosInstance.get(`/student/cases/${caseId}/timeline`);
    return response.data ?? [];
  },

  async logCaseActivity(caseId, event) {
    const response = await axiosInstance.post(`/student/cases/${caseId}/activity`, {
      event,
    });
    return response.data;
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

  async updateCase(caseId, payload) {
    const response = await axiosInstance.put(`/cases/${caseId}`, payload);
    return response.data?.data ?? response.data;
  },

  async publishCase(caseId) {
    const response = await axiosInstance.put(`/admin/cases/${caseId}/publish`);
    return response.data;
  },
};

export default caseService;

