// TODO: wire to /api/dashboard/technicians in Sprint 2
const technicians = [
  {
    name: "John Smith",
    state: "busy",
    job: "WO-1042 — On-site repair, 14 George St",
    badge: { label: "In Progress", tone: "in-progress" },
  },
  {
    name: "Maria Torres",
    state: "busy",
    job: "WO-1039 — Pickup, 8 Roma St",
    badge: { label: "En Route", tone: "en-route" },
  },
  {
    name: "David Lee",
    state: "busy",
    job: "WO-1045 — In-house repair, Workshop",
    badge: { label: "Assigned", tone: "assigned" },
  },
  {
    name: "Priya Nair",
    state: "available",
    job: "No active job",
    badge: { label: "Available", tone: "completed" },
  },
  {
    name: "Tom Nguyen",
    state: "idle",
    job: "No active job",
    badge: { label: "Idle", tone: "idle" },
  },
] as const;

export default function TechnicianStatus() {
  return (
    <section className="content-card">
      <h2 className="content-card-title">Technician Status</h2>
      {technicians.map((tech) => (
        <div key={tech.name} className="tech-row">
          <span className={`tech-status-dot ${tech.state}`} />
          <span className="tech-name">{tech.name}</span>
          <span className="tech-job">{tech.job}</span>
          <span className={`status-badge ${tech.badge.tone}`}>
            {tech.badge.label}
          </span>
        </div>
      ))}
    </section>
  );
}
