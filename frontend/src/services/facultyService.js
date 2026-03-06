import axios from "../utils/axios";

export const getFacultyAnalytics = async () => {
  const res = await axios.get("/faculty/analytics");
  return res.data;
};
