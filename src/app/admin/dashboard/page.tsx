import {
  Award,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import StatCard from "@/components/admin/dashboard/StatCard";
import TechnicianStatus from "@/components/admin/dashboard/TechnicianStatus";
import RecentWorkOrders from "@/components/admin/dashboard/RecentWorkOrders";

// TODO: wire to /api/dashboard/stats in Sprint 2
const myJobsStats = {
  total: 18,
  today: 5,
  inProgress: 2,
  completedToday: 3,
};

const workOrderStats = {
  total: 84,
  today: 12,
  pending: 3,
  inProgress: 7,
  completedToday: 5,
};

const systemStats = {
  totalUsers: 42,
  activeUsers: 38,
  verificationRate: 90,
  newUsersToday: 2,
  totalRoles: 5,
};

export default function DashboardPage() {
  return (
    <>
      <h1 className="page-heading">Dashboard</h1>
      <p className="page-subtext">
        Welcome back! Here&apos;s an overview of your application.
      </p>

      <h2 className="section-heading">My Jobs Overview</h2>
      <div className="stats-grid">
        <StatCard
          label="Total Jobs"
          value={myJobsStats.total}
          icon={<Briefcase size={18} />}
          href="/admin/work-orders"
        />
        <StatCard
          label="Today's Jobs"
          value={myJobsStats.today}
          icon={<Calendar size={18} />}
          href="/admin/work-orders"
        />
        <StatCard
          label="In Progress"
          value={myJobsStats.inProgress}
          icon={<Clock size={18} />}
          href="/admin/work-orders"
        />
        <StatCard
          label="Completed Today"
          value={myJobsStats.completedToday}
          icon={<CheckCircle size={18} />}
          href="/admin/work-orders"
        />
      </div>

      <h2 className="section-heading">Work Orders Overview</h2>
      <div className="stats-grid-5">
        <StatCard
          label="Total Work Orders"
          value={workOrderStats.total}
          icon={<Calendar size={18} />}
          href="/admin/work-orders"
        />
        <StatCard
          label="Today's Work Orders"
          value={workOrderStats.today}
          icon={<Calendar size={18} />}
          href="/admin/work-orders"
        />
        <StatCard
          label="Pending Dispatch"
          value={workOrderStats.pending}
          icon={<Clock size={18} />}
          href="/admin/work-orders"
        />
        <StatCard
          label="In Progress"
          value={workOrderStats.inProgress}
          icon={<Briefcase size={18} />}
          href="/admin/work-orders"
        />
        <StatCard
          label="Completed Today"
          value={workOrderStats.completedToday}
          icon={<CheckCircle size={18} />}
          href="/admin/work-orders"
        />
      </div>

      <h2 className="section-heading">System Stats</h2>
      <div className="stats-grid">
        <StatCard
          label="Total Users"
          value={systemStats.totalUsers}
          icon={<Users size={18} />}
          href="/admin/settings"
        />
        <StatCard
          label="Active Users"
          value={systemStats.activeUsers}
          description={`${systemStats.verificationRate}% verified`}
          icon={<UserCheck size={18} />}
          href="/admin/settings"
        />
        <StatCard
          label="New Today"
          value={systemStats.newUsersToday}
          icon={<TrendingUp size={18} />}
          href="/admin/settings"
        />
        <StatCard
          label="Total Roles"
          value={systemStats.totalRoles}
          icon={<Shield size={18} />}
          href="/admin/settings"
        />
      </div>

      <h2 className="section-heading">Quick Actions</h2>
      <div className="actions-grid">
        <a href="/admin/settings" className="action-card">
          <div className="action-head">
            <div className="action-icon">
              <Users size={18} />
            </div>
            <div className="action-title">User Management</div>
          </div>
          <p className="action-desc">
            Manage users, permissions, and access controls for your application.
          </p>
          <span className="action-link">View all users →</span>
        </a>

        <a href="/admin/settings" className="action-card">
          <div className="action-head">
            <div className="action-icon">
              <Shield size={18} />
            </div>
            <div className="action-title">Role Management</div>
          </div>
          <p className="action-desc">
            Configure roles and permissions to control access across your
            system.
          </p>
          <span className="action-link">Manage roles →</span>
        </a>
      </div>

      <TechnicianStatus />

      <RecentWorkOrders />

      <section className="content-card">
        <h2 className="content-card-title">Recent Activity</h2>
        <div className="activity-placeholder">
          <Award size={28} />
          <strong>Activity Feed Coming Soon</strong>
          <span>Track user registrations, role changes, and system events.</span>
        </div>
      </section>
    </>
  );
}
