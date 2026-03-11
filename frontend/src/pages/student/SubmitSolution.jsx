import { Navigate, useParams } from "react-router-dom";

function SubmitSolution() {
  const { caseId } = useParams();

  return <Navigate to={`/cases/${caseId}/submit`} replace />;
}

export default SubmitSolution;
