import axiosInstance from "./axiosInstance";

export const submitSolution = async (caseId, solutionText) => {
  const response = await axiosInstance.post("/submissions", {
    caseId,
    solutionText
  });
  return response.data;
};
