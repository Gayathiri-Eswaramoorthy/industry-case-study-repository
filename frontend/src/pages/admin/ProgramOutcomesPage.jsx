import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import caseService from "../../modules/caseStudy/services/caseService";

function ProgramOutcomesPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ code: "", description: "" });
  const [editingPo, setEditingPo] = useState(null);
  const [selectedCoIds, setSelectedCoIds] = useState([]);

  const { data: programOutcomes = [], isLoading: poLoading } = useQuery({
    queryKey: ["program-outcomes"],
    queryFn: () => caseService.getProgramOutcomes(),
  });

  const { data: courseOutcomes = [], isLoading: coLoading } = useQuery({
    queryKey: ["course-outcomes-all"],
    queryFn: () => caseService.getAllCourseOutcomes(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => caseService.getCourses(),
  });

  const courseLookup = useMemo(
    () => Object.fromEntries(courses.map((course) => [course.id, course])),
    [courses],
  );

  const createMutation = useMutation({
    mutationFn: (payload) => caseService.createProgramOutcome(payload),
    onSuccess: () => {
      toast.success("Program outcome created successfully");
      queryClient.invalidateQueries({ queryKey: ["program-outcomes"] });
      setForm({ code: "", description: "" });
      setShowAddForm(false);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create program outcome");
    },
  });

  const updateMappingMutation = useMutation({
    mutationFn: async ({ programOutcome, newSelectedCoIds }) => {
      const updates = courseOutcomes
        .map((courseOutcome) => {
          const currentlyMapped = Array.isArray(courseOutcome.mappedPoIds)
            ? courseOutcome.mappedPoIds
            : [];
          const shouldInclude = newSelectedCoIds.includes(courseOutcome.id);
          const nextPoIds = shouldInclude
            ? Array.from(new Set([...currentlyMapped, programOutcome.id]))
            : currentlyMapped.filter((poId) => poId !== programOutcome.id);

          const isSame =
            nextPoIds.length === currentlyMapped.length &&
            nextPoIds.every((poId) => currentlyMapped.includes(poId));

          if (isSame) {
            return null;
          }

          return caseService.updateCoPoMapping(courseOutcome.id, nextPoIds);
        })
        .filter(Boolean);

      await Promise.all(updates);
    },
    onSuccess: () => {
      toast.success("CO mappings updated");
      queryClient.invalidateQueries({ queryKey: ["program-outcomes"] });
      queryClient.invalidateQueries({ queryKey: ["course-outcomes-all"] });
      queryClient.invalidateQueries({ queryKey: ["course-outcomes"] });
      setEditingPo(null);
      setSelectedCoIds([]);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update mappings");
    },
  });

  const handleCreate = (event) => {
    event.preventDefault();
    if (!form.code.trim() || !form.description.trim()) {
      toast.error("Code and description are required");
      return;
    }

    createMutation.mutate({
      code: form.code.trim(),
      description: form.description.trim(),
    });
  };

  const openMappingModal = (programOutcome) => {
    setEditingPo(programOutcome);
    setSelectedCoIds(
      courseOutcomes
        .filter((courseOutcome) => (courseOutcome.mappedPoIds ?? []).includes(programOutcome.id))
        .map((courseOutcome) => courseOutcome.id)
    );
  };

  const toggleCo = (coId) => {
    setSelectedCoIds((prev) =>
      prev.includes(coId) ? prev.filter((id) => id !== coId) : [...prev, coId]
    );
  };

  const handleSaveMapping = () => {
    if (!editingPo) {
      return;
    }

    updateMappingMutation.mutate({
      programOutcome: editingPo,
      newSelectedCoIds: selectedCoIds,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Program Outcomes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage POs and map them to course outcomes across the platform.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          {showAddForm ? "Close Form" : "Add PO"}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[180px_1fr_auto]"
        >
          <input
            type="text"
            value={form.code}
            onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
            placeholder="PO code"
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
            disabled={createMutation.isPending}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createMutation.isPending ? "Saving..." : "Save PO"}
          </button>
        </form>
      )}

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
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(poLoading || coLoading) &&
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={3} className="px-4 py-4">
                      <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))}
              {!poLoading && !coLoading && programOutcomes.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No program outcomes created yet.
                  </td>
                </tr>
              )}
              {!poLoading &&
                !coLoading &&
                programOutcomes.map((programOutcome) => (
                  <tr key={programOutcome.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {programOutcome.code}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {programOutcome.description}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openMappingModal(programOutcome)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Map COs
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Map COs to {editingPo.code}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Select all course outcomes that contribute to this program outcome.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPo(null)}
                className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                X
              </button>
            </div>

            <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              {courseOutcomes.map((courseOutcome) => {
                const course = courseLookup[courseOutcome.courseId];

                return (
                  <label
                    key={courseOutcome.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCoIds.includes(courseOutcome.id)}
                      onChange={() => toggleCo(courseOutcome.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {courseOutcome.code}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {courseOutcome.description}
                      </div>
                      {course && (
                        <div className="mt-1 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          {course.courseCode} - {course.courseName}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPo(null)}
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

export default ProgramOutcomesPage;
