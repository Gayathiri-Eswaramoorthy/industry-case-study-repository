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

const activityService = {
  async getStudentActivity(limit = 8) {
    const response = await axiosInstance.get("/activity/student", {
      params: { limit },
    });
    return normalizeActivities(response.data, limit);
  },

  async getFacultyActivity(limit = 8, courseId) {
    const response = await axiosInstance.get("/activity/faculty", {
      params: { limit, courseId },
    });
    return normalizeActivities(response.data, limit);
  },

  async getAdminActivity(limit = 8) {
    const response = await axiosInstance.get("/activity/admin", {
      params: { limit },
    });
    return normalizeActivities(response.data, limit);
  },
};

export default activityService;
