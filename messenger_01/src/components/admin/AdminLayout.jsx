import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const AdminLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-neutral-900">
      <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 flex flex-col">
        <div className="px-4 py-4 flex items-center justify-between">
          <span className="font-bold text-xl text-emerald-500">
            Admin Panel
          </span>
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="text-xs text-gray-500 dark:text-neutral-300 hover:underline"
          >
            Back
          </button>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          <AdminNavLink to="/admin/dashboard" label="Dashboard" />
          <AdminNavLink to="/admin/users" label="Users" />
          <AdminNavLink to="/admin/reports" label="Reports" />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

const AdminNavLink = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `block px-3 py-2 rounded-lg text-sm ${
        isActive
          ? "bg-emerald-500 text-white"
          : "text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700"
      }`
    }
  >
    {label}
  </NavLink>
);

export default AdminLayout;

