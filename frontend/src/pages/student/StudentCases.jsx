import React from "react";
import { Link } from "react-router-dom";

const StudentCases = () => {
  // Example case data - replace with actual data from props or API
  const caseData = { id: 1 };

  return (
    <div className="student-cases">
      <h1>Student Cases</h1>
      <Link
        to={`/student/cases/${caseData.id}/submit`}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Submit Solution
      </Link>
    </div>
  );
};

export default StudentCases;
