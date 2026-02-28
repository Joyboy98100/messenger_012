import React, { useEffect, useState } from "react";
import { getAdminDashboard } from "../../api/admin";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getAdminDashboard();
        setStats(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard label="Total users" value={stats.totalUsers} />
        <StatCard label="Active (24h)" value={stats.activeUsers24h} />
        <StatCard label="Total messages" value={stats.totalMessages} />
        <StatCard label="Banned users" value={stats.bannedUsers} />
        <StatCard label="Open reports" value={stats.openReports} />
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="rounded-2xl bg-white p-4 shadow border border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-neutral-400">
      {label}
    </p>
    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-neutral-100">
      {value}
    </p>
  </div>
);

export default AdminDashboard;

