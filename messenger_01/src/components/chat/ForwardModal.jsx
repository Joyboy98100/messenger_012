import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFriends } from "../../api/friends";

const ForwardModal = ({ isOpen, onClose, onConfirm }) => {
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        const res = await getFriends();
        setFriends(res.data);
      } catch (err) {
        console.error("Failed to load friends for forward", err);
      }
    };
    load();
    setSelected({});
  }, [isOpen]);

  const toggle = (id) => {
    setSelected((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSend = () => {
    const ids = Object.keys(selected).filter((id) => selected[id]);
    if (ids.length === 0) return;
    onConfirm(ids);
  };

  return (
    <AnimatePresence>
      {isOpen && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-sm p-5 border border-neutral-700"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-base font-semibold text-neutral-100 mb-4">
            Forward message
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-1 mb-4">
            {friends.map((f) => (
              <label
                key={f._id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-700 cursor-pointer text-sm transition-colors"
              >
                <input
                  type="checkbox"
                  className="accent-emerald-500 rounded"
                  checked={!!selected[f._id]}
                  onChange={() => toggle(f._id)}
                />
                <span className="text-neutral-100">
                  {f.username}
                </span>
              </label>
            ))}
            {friends.length === 0 && (
              <p className="text-sm text-neutral-400 px-3">
                No friends to forward to.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-600 text-neutral-200 hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors active:scale-95"
            >
              Send
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ForwardModal;

