"use client";

import { useEffect, useState } from "react";
import { parseErrorMessage, parseTasksSummary } from "@/lib/apiValidation";
import type { TasksSummary } from "@/types/api";

const STATUS_METRICS = [
  { key: "todo", label: "To do" },
  { key: "in-progress", label: "In progress" },
  { key: "done", label: "Done" },
] as const;

export default function ReportsPage() {
  const [summary, setSummary] = useState<TasksSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSummary() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/reports/tasks-summary", {
          signal: controller.signal,
        });
        let body: unknown;

        try {
          body = await response.json();
        } catch {
          body = null;
        }

        if (!response.ok) {
          throw new Error(parseErrorMessage(body, "Unable to load the task report."));
        }

        setSummary(parseTasksSummary(body));
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load the task report.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadSummary();
    return () => controller.abort();
  }, [reloadToken]);

  return (
    <main className="stack reports-page">
      <header className="card report-header">
        <h1>Task Reports</h1>
        <p className="muted-text">Task status and activity summary</p>
      </header>

      {loading ? (
        <section className="card status-panel" aria-live="polite">
          <p>Loading report...</p>
        </section>
      ) : null}

      {error ? (
        <section className="card error-panel" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="button"
            onClick={() => setReloadToken((value) => value + 1)}
          >
            Retry
          </button>
        </section>
      ) : null}

      {!loading && !error && summary ? (
        <section className="report-metrics" aria-label="Task and activity summary">
          <article className="card report-metric report-total">
            <h2>Total tasks</h2>
            <p>{summary.total}</p>
          </article>

          {STATUS_METRICS.map(({ key, label }) => (
            <article className="card report-metric" key={key}>
              <h2>{label}</h2>
              <p>{summary.byStatus[key]}</p>
            </article>
          ))}

          <article className="card report-metric report-activity-count">
            <h2>Recent activity</h2>
            <p>{summary.recentActivityCount}</p>
            <small className="muted-text">Last 7 days</small>
          </article>
        </section>
      ) : null}
    </main>
  );
}
