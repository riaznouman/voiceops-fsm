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

export default function RecentWorkOrders() {
  return (
    <section className="content-card">
      <h2 className="content-card-title">Recent Work Orders</h2>
      <table className="recent-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Service</th>
            <th>Status</th>
            <th>Technician</th>
            <th>Scheduled</th>
          </tr>
        </thead>
        <tbody>
          {recentOrders.map((order) => (
            <tr key={order.id}>
              <td className="wo-id">{order.id}</td>
              <td>{order.customer}</td>
              <td>{order.service}</td>
              <td>
                <span className={`status-badge ${order.status.tone}`}>
                  {order.status.label}
                </span>
              </td>
              <td>{order.technician}</td>
              <td>{order.scheduled}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
