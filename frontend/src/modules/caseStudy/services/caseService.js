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

  async getRelatedCases(caseId) {
    const response = await axiosInstance.get(`/cases/${caseId}/related`);
    return response.data?.data ?? response.data ?? [];
  },

  async requestPeerReview(caseId, payload) {
    const response = await axiosInstance.post(`/cases/${caseId}/peer-review/request`, payload);
    return response.data?.data ?? response.data;
  },

  async acceptReview(caseId, reviewId) {
    const response = await axiosInstance.put(`/cases/${caseId}/peer-review/${reviewId}/accept`);
    return response.data?.data ?? response.data;
  },

  async completeReview(caseId, reviewId, payload) {
    const response = await axiosInstance.put(
      `/cases/${caseId}/peer-review/${reviewId}/complete`,
      payload
    );
    return response.data?.data ?? response.data;
  },

  async declineReview(caseId, reviewId) {
    const response = await axiosInstance.put(`/cases/${caseId}/peer-review/${reviewId}/decline`);
    return response.data?.data ?? response.data;
  },

  async getPeerReviews() {
    const response = await axiosInstance.get("/faculty/peer-reviews");
    return response.data?.data ?? response.data ?? [];
  },

  async getCasePeerReviews(caseId) {
    const response = await axiosInstance.get(`/cases/${caseId}/peer-reviews`);
    return response.data?.data ?? response.data ?? [];
  },

  async createGroup(caseId, payload) {
    const response = await axiosInstance.post(`/cases/${caseId}/groups`, payload);
    return response.data?.data ?? response.data;
  },

  async joinGroup(caseId, groupId) {
    const response = await axiosInstance.post(`/cases/${caseId}/groups/${groupId}/join`);
    return response.data?.data ?? response.data;
  },

  async approveMember(caseId, groupId, studentId) {
    const response = await axiosInstance.put(
      `/cases/${caseId}/groups/${groupId}/members/${studentId}/approve`
    );
    return response.data?.data ?? response.data;
  },

  async rejectMember(caseId, groupId, studentId) {
    const response = await axiosInstance.put(
      `/cases/${caseId}/groups/${groupId}/members/${studentId}/reject`
    );
    return response.data?.data ?? response.data;
  },

  async leaveGroup(caseId, groupId) {
    await axiosInstance.delete(`/cases/${caseId}/groups/${groupId}/leave`);
  },

  async getAllGroups(caseId) {
    const response = await axiosInstance.get(`/cases/${caseId}/groups`);
    return response.data?.data ?? response.data ?? [];
  },

  async getMyGroup(caseId) {
    const response = await axiosInstance.get(`/cases/${caseId}/my-group`, {
      validateStatus: (status) => status === 200 || status === 204,
    });
    if (response.status === 204) {
      return null;
    }
    return response.data?.data ?? response.data ?? null;
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

  async createCourse(courseCode, courseName) {
    const response = await axiosInstance.post("/courses", null, {
      params: { courseCode, courseName },
    });
    return response.data?.data ?? response.data ?? null;
  },

  async getAllTags() {
    const response = await axiosInstance.get("/cases/tags");
    return response.data?.data ?? response.data ?? [];
  },

  async searchCases({ q, status, category, difficulty, tags, minYear, maxYear, page, size, sort }) {
    const params = {};
    if (q) params.q = q;
    if (status) params.status = status;
    if (category && category !== "ALL") params.category = category;
    if (difficulty && difficulty !== "ALL") params.difficulty = difficulty;
    if (tags && tags.length > 0) params.tags = tags;
    if (minYear) params.minYear = minYear;
    if (maxYear) params.maxYear = maxYear;
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;
    if (sort) params.sort = sort;

    const response = await axiosInstance.get("/cases/search", {
      params,
      paramsSerializer: {
        serialize: (rawParams) => {
          const searchParams = new URLSearchParams();
          Object.entries(rawParams).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach((item) => searchParams.append(key, String(item)));
            } else if (value !== undefined && value !== null) {
              searchParams.append(key, String(value));
            }
          });
          return searchParams.toString();
        },
      },
    });
    return response.data?.data ?? response.data ?? {
      content: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
      last: true,
    };
  },

  async uploadCaseDocument(caseId, file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post(`/cases/${caseId}/document`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async uploadTeachingNotes(caseId, file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post(`/cases/${caseId}/teaching-notes`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async downloadTeachingNotes(caseId, originalName) {
    const token = localStorage.getItem("token");
    const apiBase = (axiosInstance.defaults.baseURL || "").replace(/\/$/, "");
    const response = await fetch(
      `${apiBase}/cases/${caseId}/teaching-notes`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error("Download failed");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = originalName || "teaching-notes.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async uploadExhibit(caseId, file, title, description) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    if (description) formData.append("description", description);
    const response = await axiosInstance.post(`/cases/${caseId}/exhibits`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async deleteExhibit(caseId, exhibitId) {
    await axiosInstance.delete(`/cases/${caseId}/exhibits/${exhibitId}`);
  },

  async downloadExhibit(caseId, exhibitId, originalFileName) {
    const token = localStorage.getItem("token");
    const apiBase = (axiosInstance.defaults.baseURL || "").replace(/\/$/, "");
    const response = await fetch(
      `${apiBase}/cases/${caseId}/exhibits/${exhibitId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error("Download failed");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = originalFileName || "exhibit";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  getCaseDocumentUrl(caseId) {
    const baseURL = (axiosInstance.defaults.baseURL || "").replace(/\/$/, "");
    if (!baseURL) {
      return `/api/cases/${caseId}/document`;
    }
    return `${baseURL}/cases/${caseId}/document`;
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
    const clean = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== null && value !== undefined)
    );

    if (hasFile) {
      const { caseMaterial, ...rest } = clean;

      const formData = new FormData();
      formData.append(
        "request",
        new Blob([JSON.stringify(rest)], { type: "application/json" })
      );
      formData.append("caseMaterial", caseMaterial);

      const response = await axiosInstance.post("/cases", formData);
      return response.data?.data ?? response.data;
    }

    const response = await axiosInstance.post("/cases", clean);
    return response.data?.data ?? response.data;
  },

  async updateCase(caseId, payload) {
    const response = await axiosInstance.put(`/faculty/cases/${caseId}`, payload);
    return response.data?.data ?? response.data;
  },

  async publishCase(caseId) {
    const response = await axiosInstance.put(`/cases/${caseId}/publish`);
    return response.data;
  },

  async getAssignments(caseId) {
    const response = await axiosInstance.get(`/admin/cases/${caseId}/assignments`);
    return response.data ?? [];
  },

  async saveAssignments(caseId, facultyIds) {
    const response = await axiosInstance.post(`/admin/cases/${caseId}/assign`, { facultyIds });
    return response.data ?? [];
  },
};

export default caseService;

