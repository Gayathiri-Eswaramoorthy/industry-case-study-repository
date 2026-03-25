import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import caseService from "../../modules/caseStudy/services/caseService";

function FacultyCourseOutcomesPage() {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseForm, setCourseForm] = useState({ courseCode: "", courseName: "" });
  const [form, setForm] = useState({ code: "", description: "" });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: () => caseService.getCourses(),
  });

  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(String(courses[0].id));
    }
  }, [courses, selectedCourseId]);

  const { data: courseOutcomes = [], isLoading: coLoading } = useQuery({
    queryKey: ["faculty-course-outcomes", selectedCourseId],
    enabled: Boolean(selectedCourseId),
    queryFn: () => caseService.getCourseOutcomes(Number(selectedCourseId)),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => caseService.createCourseOutcome(payload),
    onSuccess: () => {
      toast.success("Course outcome created successfully");
      queryClient.invalidateQueries({ queryKey: ["faculty-course-outcomes"] });
      queryClient.invalidateQueries({ queryKey: ["course-outcomes"] });
      queryClient.invalidateQueries({ queryKey: ["course-outcomes-all"] });
      setForm({ code: "", description: "" });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create course outcome");
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: ({ courseCode, courseName }) => caseService.createCourse(courseCode, courseName),
    onSuccess: async (newCourse, variables) => {
      toast.success("Course created successfully");
      if (newCourse?.id) {
        queryClient.setQueryData(["courses"], (previous = []) => {
          const withoutDuplicate = previous.filter((course) => course.id !== newCourse.id);
          return [...withoutDuplicate, newCourse];
        });
        setSelectedCourseId(String(newCourse.id));
      }
      await queryClient.refetchQueries({ queryKey: ["courses"], type: "all" });
      if (!newCourse?.id) {
        const refreshedCourses = queryClient.getQueryData(["courses"]) ?? [];
        const matchedCourse = refreshedCourses.find(
          (course) =>
            course.courseCode === variables.courseCode && course.courseName === variables.courseName,
        );
        if (matchedCourse?.id) {
          setSelectedCourseId(String(matchedCourse.id));
        }
      }
      setCourseForm({ courseCode: "", courseName: "" });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create course");
    },
  });

  const handleCreate = (event) => {
    event.preventDefault();
    if (!selectedCourseId || !form.code.trim() || !form.description.trim()) {
      toast.error("Code, description, and course are required");
      return;
    }

    createMutation.mutate({
      code: form.code.trim(),
      description: form.description.trim(),
      courseId: Number(selectedCourseId),
    });
  };

  const handleCreateCourse = (event) => {
    event.preventDefault();
    if (!courseForm.courseCode.trim() || !courseForm.courseName.trim()) {
      toast.error("Course code and course name are required");
      return;
    }

    createCourseMutation.mutate({
      courseCode: courseForm.courseCode.trim(),
      courseName: courseForm.courseName.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Course Outcomes
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Add course outcomes for your course and review existing COs.
        </p>
      </div>

      <form
        onSubmit={handleCreateCourse}
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[160px_1fr_auto]"
      >
        <input
          type="text"
          value={courseForm.courseCode}
          onChange={(event) =>
            setCourseForm((prev) => ({ ...prev, courseCode: event.target.value }))
          }
          placeholder="Course Code"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <input
          type="text"
          value={courseForm.courseName}
          onChange={(event) =>
            setCourseForm((prev) => ({ ...prev, courseName: event.target.value }))
          }
          placeholder="Course Name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={createCourseMutation.isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          {createCourseMutation.isPending ? "Creating..." : "Create Course"}
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Select Course
        </label>
        <select
          value={selectedCourseId}
          onChange={(event) => setSelectedCourseId(event.target.value)}
          className="w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          {coursesLoading && <option value="">Loading courses...</option>}
          {!coursesLoading && courses.length === 0 && (
            <option value="">No courses available</option>
          )}
          {!coursesLoading &&
            courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.courseCode} - {course.courseName}
              </option>
            ))}
        </select>
        {!coursesLoading && courses.length === 0 && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Create a course above to start adding course outcomes.
          </p>
        )}
      </div>

      <form
        onSubmit={handleCreate}
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[180px_1fr_auto]"
      >
        <input
          type="text"
          value={form.code}
          onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
          placeholder="CO code"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <input
          type="text"
          value={form.description}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, description: event.target.value }))
          }
          placeholder="Description"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={createMutation.isPending || !selectedCourseId}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createMutation.isPending ? "Saving..." : "Add CO"}
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {coLoading &&
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={2} className="px-4 py-4">
                      <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))}
              {!coLoading && courseOutcomes.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No course outcomes found for the selected course.
                  </td>
                </tr>
              )}
              {!coLoading &&
                courseOutcomes.map((courseOutcome) => (
                  <tr key={courseOutcome.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {courseOutcome.code}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {courseOutcome.description}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FacultyCourseOutcomesPage;
