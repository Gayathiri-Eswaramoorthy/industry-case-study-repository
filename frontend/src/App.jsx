import { useContext } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Users from "./pages/Users";
import CaseListPage from "./modules/caseStudy/pages/CaseListPage";
import CaseDetailsPage from "./modules/caseStudy/pages/CaseDetailsPage";
import CaseCreatePage from "./modules/caseStudy/pages/CaseCreatePage";
import CaseEditPage from "./modules/caseStudy/pages/CaseEditPage";
import SubmitSolutionPage from "./modules/submission/pages/SubmitSolutionPage";
import DashboardPage from "./modules/analytics/pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProgramOutcomesPage from "./pages/admin/ProgramOutcomesPage";
import CourseOutcomesPage from "./pages/admin/CourseOutcomesPage";
import ReevalQueuePage from "./pages/admin/ReevalQueuePage";
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import FacultyAnalytics from "./pages/faculty/FacultyAnalytics";
import FacultyCourseOutcomesPage from "./pages/faculty/FacultyCourseOutcomesPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import CoAttainment from "./pages/student/CoAttainment";
import PoAttainment from "./pages/student/PoAttainment";
import CaseSubmissions from "./pages/faculty/CaseSubmissions";
import FacultySubmissions from "./pages/faculty/FacultySubmissions";
import FacultySubmissionReview from "./pages/faculty/FacultySubmissionReview";
import SubmitSolution from "./pages/student/SubmitSolution";
import MySubmissions from "./pages/student/MySubmissions";
import NotFound from "./pages/NotFound";
import { AuthContext } from "./context/AuthContext";

function RoleDashboardRedirect() {
  const { role } = useContext(AuthContext);

  if (role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (role === "FACULTY") {
    return <Navigate to="/faculty/dashboard" replace />;
  }

  return <Navigate to="/student/dashboard" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<RoleDashboardRedirect />} />
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/program-outcomes" element={<ProgramOutcomesPage />} />
          <Route path="admin/course-outcomes" element={<CourseOutcomesPage />} />
          <Route path="admin/reeval-queue" element={<ReevalQueuePage />} />
          <Route path="faculty/dashboard" element={<FacultyDashboard />} />
          <Route path="faculty/analytics" element={<FacultyAnalytics />} />
          <Route path="faculty/course-outcomes" element={<FacultyCourseOutcomesPage />} />
          <Route path="faculty/submissions" element={<FacultySubmissions />} />
          <Route
            path="faculty/submissions/:id"
            element={<FacultySubmissionReview />}
          />
          <Route
            path="faculty/cases/:caseId/submissions"
            element={<CaseSubmissions />}
          />
          <Route path="cases/:id/submissions" element={<CaseSubmissions />} />
          <Route path="student/dashboard" element={<StudentDashboard />} />
          <Route path="student/co-attainment" element={<CoAttainment />} />
          <Route path="student/po-attainment" element={<PoAttainment />} />
          <Route path="student/submissions" element={<MySubmissions />} />
          <Route
            path="student/cases/:caseId/submit"
            element={<SubmitSolution />}
          />
          <Route path="cases" element={<CaseListPage />} />
          <Route path="cases/:caseId" element={<CaseDetailsPage />} />
          <Route path="cases/new" element={<CaseCreatePage />} />
          <Route path="cases/:caseId/edit" element={<CaseEditPage />} />
          <Route path="cases/:caseId/submit" element={<SubmitSolutionPage />} />
          <Route path="analytics" element={<DashboardPage />} />
          <Route path="admin/users" element={<Users />} />
          <Route path="users" element={<Users />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
