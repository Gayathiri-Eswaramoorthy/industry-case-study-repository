import axios from "../utils/axios";

export const getFacultyDashboard = async () => {
  const res = await axios.get("/faculty/dashboard");
  return res.data;
};
