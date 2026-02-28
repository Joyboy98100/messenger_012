import React, { useEffect, useState } from "react";
import {
  getAdminUsers,
  banUser,
  unbanUser,
  deactivateUser,
  forceLogoutUser,
} from "../../api/admin";
import ConfirmModal from "../../components/admin/ConfirmModal";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  const load = async (pageArg = 1, searchArg = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminUsers(pageArg, searchArg);
      setUsers(res.data.users || []);
      setPage(res.data.page || 1);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, "");
  }, []);

  const openConfirm = (action, user) => {
    setPendingAction({ action, user });
  };

  const closeConfirm = () => setPendingAction(null);

  const performAction = async () => {
    if (!pendingAction) return;
    const { action, user } = pendingAction;
    try {
      if (action === "ban") await banUser(user._id);
      else if (action === "unban") await unbanUser(user._id);
      else if (action === "deactivate") await deactivateUser(user._id);
      else if (action === "forceLogout") await forceLogoutUser(user._id);
      await load(page, search);
    } catch (err) {
      console.error(err);
      alert("Action failed");
    } finally {
      closeConfirm();
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Users</h1>
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load(1, e.target.value);
          }}
          className="w-64 rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
        />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl bg-white shadow border border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-4 py-2 text-left">Username</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="border-t border-gray-100 dark:border-neutral-700"
                  >
                    <td className="px-4 py-2">{u.username}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.role}</td>
                    <td className="px-4 py-2">
                      {u.isOnline ? (
                        <span className="text-emerald-500">Online</span>
                      ) : (
                        <span className="text-gray-500">Offline</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      {u.role !== "admin" && u.role !== "superadmin" && (
                        <>
                          {u.isBanned ? (
                            <button
                              type="button"
                              onClick={() => openConfirm("unban", u)}
                              className="rounded-lg border border-emerald-500 px-3 py-1 text-xs text-emerald-600 hover:bg-emerald-50"
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openConfirm("ban", u)}
                              className="rounded-lg border border-red-500 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              Ban
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openConfirm("deactivate", u)}
                            className="rounded-lg border border-gray-400 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            Deactivate
                          </button>
                          <button
                            type="button"
                            onClick={() => openConfirm("forceLogout", u)}
                            className="rounded-lg border border-orange-500 px-3 py-1 text-xs text-orange-600 hover:bg-orange-50"
                          >
                            Force logout
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 text-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => load(page - 1, search)}
              className="rounded-full border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-neutral-600"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => load(page + 1, search)}
              className="rounded-full border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-neutral-600"
            >
              Next
            </button>
          </div>
        </>
      )}

      <ConfirmModal
        open={!!pendingAction}
        title="Confirm action"
        message={
          pendingAction
            ? `Are you sure you want to ${pendingAction.action} ${pendingAction.user.username}?`
            : ""
        }
        onConfirm={performAction}
        onCancel={closeConfirm}
      />
    </div>
  );
};

export default AdminUsers;

