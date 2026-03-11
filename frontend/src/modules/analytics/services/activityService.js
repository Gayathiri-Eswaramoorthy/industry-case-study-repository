import axiosInstance from "../../../api/axiosInstance";

function normalizeActivities(data, maxItems) {
  const items = Array.isArray(data) ? data : [];

  return items
    .filter((item) => item?.timestamp)
    .sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, maxItems)
    .map((item, index) => ({
      id: item.id ?? `${item.type ?? "activity"}-${index}`,
      type: item.type ?? "activity",
      message: item.message ?? "Activity update",
      timestamp: item.timestamp,
    }));
}

function buildRequestConfig(params = {}) {
  const token = localStorage.getItem("token");

  return {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
}

const activityService = {
  async getStudentActivity(limit = 8) {
    const response = await axiosInstance.get(
      "/activity/student",
      buildRequestConfig({ limit })
    );
    return normalizeActivities(response.data, limit);
  },

  async getFacultyActivity(limit = 8, courseId) {
    const params = { limit };
    if (courseId != null) {
      params.courseId = courseId;
    }

    const response = await axiosInstance.get(
      "/activity/faculty",
      buildRequestConfig(params)
    );
    return normalizeActivities(response.data, limit);
  },

  async getAdminActivity(limit = 8) {
    const response = await axiosInstance.get(
      "/activity/admin",
      buildRequestConfig({ limit })
    );
    return normalizeActivities(response.data, limit);
  },
};

export default activityService;
