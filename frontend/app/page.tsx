import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <header className="stack home-header">
        <h1>VeeLion Frontend Assessment</h1>
        <p className="muted-text">
          Two separate modules built against the provided backend.
        </p>
      </header>

      <section className="home-module-grid">
        <Link href="/tasks" className="card home-module-link">
          <h2>Task Dashboard</h2>
          <p>Review tasks, filter by status, and update completion.</p>
        </Link>

        <Link href="/activity" className="card home-module-link">
          <h2>Activity Feed</h2>
          <p>Browse and search recorded activity.</p>
        </Link>
      </section>
    </main>
  );
}
