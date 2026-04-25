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

const dotClasses: Record<string, string> = {
  available: "bg-emerald-500",
  busy: "bg-amber-500",
  idle: "bg-gray-300",
};

const badgeClasses: Record<string, string> = {
  assigned: "bg-amber-100 text-amber-800 border-amber-200",
  "en-route": "bg-blue-100 text-blue-800 border-blue-200",
  "in-progress": "bg-violet-100 text-violet-800 border-violet-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  idle: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function TechnicianStatus() {
  return (
    <section className="mb-6 rounded-md border border-gray-300 bg-white p-5">
      <h2 className="mb-3 border-b border-gray-200 pb-2.5 text-[15px] font-semibold text-gray-900">
        Technician Status
      </h2>
      {technicians.map((tech) => (
        <div
          key={tech.name}
          className="flex items-center gap-3 border-b border-gray-100 py-2.5 last:border-b-0"
        >
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClasses[tech.state]}`}
          />
          <span className="w-[140px] shrink-0 text-sm font-semibold text-gray-900">
            {tech.name}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] text-gray-500">
            {tech.job}
          </span>
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeClasses[tech.badge.tone]}`}
          >
            {tech.badge.label}
          </span>
        </div>
      ))}
    </section>
  );
}
