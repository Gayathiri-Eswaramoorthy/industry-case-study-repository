import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import caseService from "../../modules/caseStudy/services/caseService";

function CourseOutcomesPage() {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [editingOutcome, setEditingOutcome] = useState(null);
  const [selectedPoIds, setSelectedPoIds] = useState([]);

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
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Select Course
        </label>
        <select
          value={selectedCourseId}
          onChange={(event) => setSelectedCourseId(event.target.value)}
          className="w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
    </div>
  );
}

export default CourseOutcomesPage;
