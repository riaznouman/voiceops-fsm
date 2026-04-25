// TODO: wire to /api/work-orders?limit=8&sort=recent in Sprint 2
const recentOrders = [
  {
    id: "WO-1045",
    customer: "Ben Carter",
    service: "In-house Repair",
    status: { label: "Assigned", tone: "assigned" },
    technician: "David Lee",
    scheduled: "11:30 AM",
  },
  {
    id: "WO-1044",
    customer: "Lisa Wang",
    service: "On-site Repair",
    status: { label: "In Progress", tone: "in-progress" },
    technician: "John Smith",
    scheduled: "10:00 AM",
  },
  {
    id: "WO-1043",
    customer: "Omar Hassan",
    service: "Pickup",
    status: { label: "En Route", tone: "en-route" },
    technician: "Maria Torres",
    scheduled: "9:15 AM",
  },
  {
    id: "WO-1042",
    customer: "Sarah Kim",
    service: "Delivery",
    status: { label: "Completed", tone: "completed" },
    technician: "Tom Nguyen",
    scheduled: "8:45 AM",
  },
  {
    id: "WO-1041",
    customer: "James Patel",
    service: "On-site Repair",
    status: { label: "Completed", tone: "completed" },
    technician: "Priya Nair",
    scheduled: "8:00 AM",
  },
  {
    id: "WO-1040",
    customer: "Aisha Rahman",
    service: "In-house Repair",
    status: { label: "Completed", tone: "completed" },
    technician: "David Lee",
    scheduled: "Yesterday 4:30 PM",
  },
  {
    id: "WO-1039",
    customer: "Henry Wilson",
    service: "Pickup",
    status: { label: "Cancelled", tone: "cancelled" },
    technician: "—",
    scheduled: "Yesterday 2:00 PM",
  },
] as const;

const badgeClasses: Record<string, string> = {
  assigned: "bg-amber-100 text-amber-800 border-amber-200",
  "en-route": "bg-blue-100 text-blue-800 border-blue-200",
  "in-progress": "bg-violet-100 text-violet-800 border-violet-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const headCell =
  "px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200";
const bodyCell = "px-2.5 py-2.5 text-gray-700 border-b border-gray-100";

export default function RecentWorkOrders() {
  return (
    <section className="mb-6 rounded-md border border-gray-300 bg-white p-5">
      <h2 className="mb-3 border-b border-gray-200 pb-2.5 text-[15px] font-semibold text-gray-900">
        Recent Work Orders
      </h2>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className={headCell}>ID</th>
            <th className={headCell}>Customer</th>
            <th className={headCell}>Service</th>
            <th className={headCell}>Status</th>
            <th className={headCell}>Technician</th>
            <th className={headCell}>Scheduled</th>
          </tr>
        </thead>
        <tbody>
          {recentOrders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className={`${bodyCell} font-mono text-xs font-semibold text-gray-900`}>
                {order.id}
              </td>
              <td className={bodyCell}>{order.customer}</td>
              <td className={bodyCell}>{order.service}</td>
              <td className={bodyCell}>
                <span
                  className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeClasses[order.status.tone]}`}
                >
                  {order.status.label}
                </span>
              </td>
              <td className={bodyCell}>{order.technician}</td>
              <td className={bodyCell}>{order.scheduled}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
