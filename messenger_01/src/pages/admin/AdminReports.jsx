import React, { useEffect, useState } from "react";
import { getAdminReports, handleAdminReport } from "../../api/admin";
import ConfirmModal from "../../components/admin/ConfirmModal";

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminReports();
      setReports(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const open = (report, action) => setPending({ report, action });
  const close = () => setPending(null);

  const perform = async () => {
    if (!pending) return;
    try {
      await handleAdminReport(pending.report._id, pending.action);
      await load();
    } catch (err) {
      console.error(err);
      alert("Action failed");
    } finally {
      close();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Reports</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow border border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-neutral-700">
              <tr>
                <th className="px-4 py-2 text-left">Reporter</th>
                <th className="px-4 py-2 text-left">Message</th>
                <th className="px-4 py-2 text-left">Reason</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr
                  key={r._id}
                  className="border-t border-gray-100 dark:border-neutral-700"
                >
                  <td className="px-4 py-2">
                    {r.reporterId?.username || "Unknown"}
                  </td>
                  <td className="px-4 py-2 max-w-xs truncate">
                    {r.messageId?.text || "(deleted)"}
                  </td>
                  <td className="px-4 py-2 max-w-xs truncate">{r.reason}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-neutral-700 dark:text-neutral-200">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right space-x-2">
                    {r.status === "open" && (
                      <>
                        <button
                          type="button"
                          onClick={() => open(r, "warn")}
                          className="rounded-lg border border-yellow-500 px-3 py-1 text-xs text-yellow-700 hover:bg-yellow-50"
                        >
                          Warn
                        </button>
                        <button
                          type="button"
                          onClick={() => open(r, "delete_message")}
                          className="rounded-lg border border-red-500 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Delete message
                        </button>
                        <button
                          type="button"
                          onClick={() => open(r, "ban_user")}
                          className="rounded-lg border border-red-700 px-3 py-1 text-xs text-red-700 hover:bg-red-100"
                        >
                          Ban user
                        </button>
                        <button
                          type="button"
                          onClick={() => open(r, "dismiss")}
                          className="rounded-lg border border-gray-400 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No reports
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </div>
      )}

      <ConfirmModal
        open={!!pending}
        title="Confirm action"
        message={
          pending
            ? `Are you sure you want to ${pending.action} for this report?`
            : ""
        }
        onConfirm={perform}
        onCancel={close}
      />
    </div>
  );
};

export default AdminReports;

