import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import caseService from "../../modules/caseStudy/services/caseService";

function CourseOutcomesPage() {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [editingOutcome, setEditingOutcome] = useState(null);
  const [selectedPoIds, setSelectedPoIds] = useState([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ courseCode: "", courseName: "" });
  const [coForm, setCoForm] = useState({ code: "", description: "" });

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
    queryKey: ["course-outcomes", selectedCourseId],
    enabled: Boolean(selectedCourseId),
    queryFn: () => caseService.getCourseOutcomes(Number(selectedCourseId)),
  });

  const { data: programOutcomes = [], isLoading: poLoading } = useQuery({
    queryKey: ["program-outcomes"],
    queryFn: () => caseService.getProgramOutcomes(),
  });

  const poLookup = useMemo(
    () => Object.fromEntries(programOutcomes.map((po) => [po.id, po])),
    [programOutcomes],
  );

  const updateMappingMutation = useMutation({
    mutationFn: ({ coId, poIds }) => caseService.updateCoPoMapping(coId, poIds),
    onSuccess: () => {
      toast.success("PO mappings updated");
      queryClient.invalidateQueries({ queryKey: ["course-outcomes"] });
      queryClient.invalidateQueries({ queryKey: ["course-outcomes-all"] });
      setEditingOutcome(null);
      setSelectedPoIds([]);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update PO mappings");
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: (payload) => caseService.createCourse(payload),
    onSuccess: (newCourse) => {
      toast.success("Course created successfully");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setShowCourseModal(false);
      setCourseForm({ courseCode: "", courseName: "" });
      setSelectedCourseId(String(newCourse.id));
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create course");
    },
  });

  const createCoMutation = useMutation({
    mutationFn: (payload) => caseService.createCourseOutcome(payload),
    onSuccess: () => {
      toast.success("Course outcome created");
      queryClient.invalidateQueries({ queryKey: ["course-outcomes", selectedCourseId] });
      queryClient.invalidateQueries({ queryKey: ["course-outcomes-all"] });
      setCoForm({ code: "", description: "" });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create course outcome");
    },
  });

  const openMappingModal = (courseOutcome) => {
    setEditingOutcome(courseOutcome);
    setSelectedPoIds(courseOutcome.mappedPoIds ?? []);
  };

  const togglePo = (poId) => {
    setSelectedPoIds((prev) =>
      prev.includes(poId) ? prev.filter((id) => id !== poId) : [...prev, poId]
    );
  };

  const handleSaveMapping = () => {
    if (!editingOutcome) {
      return;
    }

    updateMappingMutation.mutate({
      coId: editingOutcome.id,
      poIds: selectedPoIds,
    });
  };

  const handleCreateCourse = (e) => {
    e.preventDefault();
    if (!courseForm.courseCode.trim() || !courseForm.courseName.trim()) {
      toast.error("Course code and name are required");
      return;
    }
    createCourseMutation.mutate({
      courseCode: courseForm.courseCode.trim(),
      courseName: courseForm.courseName.trim(),
    });
  };

  const handleCreateCo = (e) => {
    e.preventDefault();
    if (!selectedCourseId || !coForm.code.trim() || !coForm.description.trim()) {
      toast.error("Select a course and fill in code and description");
      return;
    }
    createCoMutation.mutate({
      code: coForm.code.trim(),
      description: coForm.description.trim(),
      courseId: Number(selectedCourseId),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Course Outcomes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review course outcomes by course and manage their PO mappings.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-sm">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Select Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {coursesLoading && <option>Loading courses...</option>}
              {!coursesLoading &&
                courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.courseCode} - {course.courseName}
                  </option>
                ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowCourseModal(true)}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            + New Course
          </button>
        </div>
      </div>

      <form
        onSubmit={handleCreateCo}
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[160px_1fr_auto]"
      >
        <input
          type="text"
          value={coForm.code}
          onChange={(e) => setCoForm((prev) => ({ ...prev, code: e.target.value }))}
          placeholder="CO code (e.g. CO4)"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <input
          type="text"
          value={coForm.description}
          onChange={(e) => setCoForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Description"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={createCoMutation.isPending || !selectedCourseId}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createCoMutation.isPending ? "Saving..." : "Add CO"}
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Mapped POs
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(coLoading || poLoading) &&
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={4} className="px-4 py-4">
                      <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))}
              {!coLoading && !poLoading && courseOutcomes.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No course outcomes found for the selected course.
                  </td>
                </tr>
              )}
              {!coLoading &&
                !poLoading &&
                courseOutcomes.map((courseOutcome) => (
                  <tr key={courseOutcome.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {courseOutcome.code}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {courseOutcome.description}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(courseOutcome.mappedPoIds ?? []).length > 0 ? (
                          courseOutcome.mappedPoIds.map((poId) => (
                            <span
                              key={poId}
                              className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                            >
                              {poLookup[poId]?.code ?? `PO ${poId}`}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openMappingModal(courseOutcome)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Edit PO Mapping
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingOutcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Edit PO Mapping
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {editingOutcome.code} - {editingOutcome.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOutcome(null)}
                className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                X
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {programOutcomes.map((po) => (
                <label
                  key={po.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedPoIds.includes(po.id)}
                    onChange={() => togglePo(po.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {po.code}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {po.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingOutcome(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMapping}
                disabled={updateMappingMutation.isPending}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateMappingMutation.isPending ? "Saving..." : "Save Mapping"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Create new course
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowCourseModal(false);
                  setCourseForm({ courseCode: "", courseName: "" });
                }}
                className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                X
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Course code
                </label>
                <input
                  type="text"
                  value={courseForm.courseCode}
                  onChange={(e) =>
                    setCourseForm((prev) => ({ ...prev, courseCode: e.target.value }))
                  }
                  placeholder="e.g. CS103"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Must be unique across the platform
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Course name
                </label>
                <input
                  type="text"
                  value={courseForm.courseName}
                  onChange={(e) =>
                    setCourseForm((prev) => ({ ...prev, courseName: e.target.value }))
                  }
                  placeholder="e.g. Database Management Systems"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCourseModal(false);
                    setCourseForm({ courseCode: "", courseName: "" });
                  }}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCourseMutation.isPending}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                >
                  {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseOutcomesPage;
