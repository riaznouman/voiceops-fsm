export default function DashboardPage() {
  return (
    <>
      <h1 className="page-heading">Dashboard</h1>
      <p className="page-subtext">Overview of today&apos;s activity</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">12</div>
          <div className="stat-label">Active Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">8</div>
          <div className="stat-label">Today&apos;s Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">5</div>
          <div className="stat-label">Technicians on Duty</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">3</div>
          <div className="stat-label">Pending Dispatch</div>
        </div>
      </div>

      <div className="content-card">
        <p className="coming-soon">
          Recent work orders and technician activity — coming soon.
        </p>
      </div>
    </>
  );
}
