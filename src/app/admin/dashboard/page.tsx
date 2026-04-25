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

const sectionHeading =
  "mt-6 mb-3 text-base font-semibold text-gray-900 first-of-type:mt-0";

export default function DashboardPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mb-6 text-sm text-gray-500">
        Welcome back! Here&apos;s an overview of your application.
      </p>

      <h2 className={sectionHeading}>My Jobs Overview</h2>
      <div className="mb-6 grid grid-cols-4 gap-4">
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

      <h2 className={sectionHeading}>Work Orders Overview</h2>
      <div className="mb-6 grid grid-cols-5 gap-4">
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

      <h2 className={sectionHeading}>System Stats</h2>
      <div className="mb-6 grid grid-cols-4 gap-4">
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

      <h2 className={sectionHeading}>Quick Actions</h2>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <a
          href="/admin/settings"
          className="block rounded-md border border-gray-300 bg-white p-5 text-inherit no-underline transition-colors hover:border-gray-400 hover:shadow-sm"
        >
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-blue-600">
              <Users size={18} />
            </div>
            <div className="text-[15px] font-semibold text-gray-900">
              User Management
            </div>
          </div>
          <p className="mb-2.5 text-[13px] leading-relaxed text-gray-500">
            Manage users, permissions, and access controls for your application.
          </p>
          <span className="text-[13px] font-semibold text-blue-600">
            View all users →
          </span>
        </a>

        <a
          href="/admin/settings"
          className="block rounded-md border border-gray-300 bg-white p-5 text-inherit no-underline transition-colors hover:border-gray-400 hover:shadow-sm"
        >
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-blue-600">
              <Shield size={18} />
            </div>
            <div className="text-[15px] font-semibold text-gray-900">
              Role Management
            </div>
          </div>
          <p className="mb-2.5 text-[13px] leading-relaxed text-gray-500">
            Configure roles and permissions to control access across your system.
          </p>
          <span className="text-[13px] font-semibold text-blue-600">
            Manage roles →
          </span>
        </a>
      </div>

      <TechnicianStatus />

      <RecentWorkOrders />

      <section className="mb-6 rounded-md border border-gray-300 bg-white p-5">
        <h2 className="mb-3 border-b border-gray-200 pb-2.5 text-[15px] font-semibold text-gray-900">
          Recent Activity
        </h2>
        <div className="flex flex-col items-center gap-2 p-5 text-gray-400">
          <Award size={28} />
          <strong className="font-semibold text-gray-500">
            Activity Feed Coming Soon
          </strong>
          <span className="text-[13px]">
            Track user registrations, role changes, and system events.
          </span>
        </div>
      </section>
    </>
  );
}
