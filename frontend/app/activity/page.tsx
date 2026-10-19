"use client";

import { useEffect, useMemo, useState } from "react";
import { parseActivityResponse, parseErrorMessage } from "@/lib/apiValidation";
import type { ActivityLog } from "@/types/api";

export default function ActivityPage() {
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  function formatTime(value: string) {
    return new Date(value).toLocaleString();
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadActivity() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/activity", { signal: controller.signal });
        let body: unknown;
        try {
          body = await response.json();
        } catch {
          body = null;
        }

        if (!response.ok) {
          throw new Error(parseErrorMessage(body, "Unable to load activity."));
        }

        setActivity(parseActivityResponse(body));
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load activity.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadActivity();
    return () => controller.abort();
  }, [reloadToken]);

  const filteredActivity = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return activity;
    }

    return activity.filter((item) =>
      `${item.action || ""} ${item.info || ""}`.toLowerCase().includes(normalizedQuery)
    );
  }, [activity, query]);

  return (
    <main className="stack">
      <section className="card activity-panel">
        <h1>Activity Feed</h1>

        <input
          className="input"
          aria-label="Search activity"
          placeholder="Search activity"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </section>

      <section className="card activity-panel">
        <small className="muted-text">
          Total: {activity.length} | Visible: {filteredActivity.length}
        </small>
      </section>

      {error ? (
        <section className="card error-panel" role="alert">
          <p>{error}</p>
          <button type="button" className="button" onClick={() => setReloadToken((value) => value + 1)}>
            Retry
          </button>
        </section>
      ) : loading ? (
        <section className="card status-panel" aria-live="polite">
          <p>Loading activity...</p>
        </section>
      ) : filteredActivity.length === 0 ? (
        <section className="card empty-state">
          <p>{activity.length === 0 ? "No activity has been recorded." : "No activity matches this search."}</p>
        </section>
      ) : (
        <section className="card activity-panel" aria-label="Activity entries">
          <ul className="activity-list">
            {filteredActivity.map((item) => (
              <li key={item.id} className="activity-item">
                <div className="activity-action">{item.action || "(no action)"}</div>
                <div>{item.info || "(no info)"}</div>
                <small className="muted-text">{formatTime(item.when)}</small>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
