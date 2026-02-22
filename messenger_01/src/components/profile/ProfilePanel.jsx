import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Avatar from "../common/Avatar";
import { updateProfile } from "../../api/user";
import { blockUser, unblockUser, amBlocking } from "../../api/block";
import SharedMedia from "./SharedMedia";

const ProfilePanel = ({ onClose, currentUserId, selectedUserId, selectedUser, sharedMediaWithUserId, onBlockChange }) => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isBlocking, setIsBlocking] = useState(false);

  const viewingOther = Boolean(
    selectedUser && selectedUserId && (!currentUserId || String(selectedUserId) !== String(currentUserId))
  );

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
      setAvatarPreview(storedUser.avatar);
    }
  }, []);

  useEffect(() => {
    if (!viewingOther || !selectedUserId) return;
    amBlocking(selectedUserId)
      .then((r) => setIsBlocking(!!r.data?.blocking))
      .catch(() => setIsBlocking(false));
  }, [viewingOther, selectedUserId]);

  const handleBlock = async () => {
    if (!selectedUserId) return;
    try {
      await blockUser(selectedUserId);
      setIsBlocking(true);
      onBlockChange?.();
    } catch (err) {
      console.error("Block failed:", err);
    }
  };

  const handleUnblock = async () => {
    if (!selectedUserId) return;
    try {
      await unblockUser(selectedUserId);
      setIsBlocking(false);
      onBlockChange?.();
    } catch (err) {
      console.error("Unblock failed:", err);
    }
  };

  if (!user) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      const userId = user.id || user._id;
      formData.append("id", userId);
      formData.append("username", user.username);
      formData.append("email", user.email);
      formData.append("bio", user.bio);
      formData.append("preferredLanguage", user.preferredLanguage);

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await updateProfile(formData);

      // Backend returns the same shape as login (id, username, email, bio, avatar, preferredLanguage)
      localStorage.setItem("user", JSON.stringify(res.data));
      setUser(res.data);
      setAvatarPreview(res.data.avatar);
      setEditing(false);
    } catch (err) {
      alert("Failed to update profile");
    }
  };

  return (
    <motion.div
      className="w-full md:w-[360px] h-full bg-white dark:bg-neutral-800/95 backdrop-blur-sm border-l border-gray-200 dark:border-neutral-700 p-4 md:p-5 flex flex-col overflow-y-auto"
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
    >

      {/* Top Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 md:p-6 shadow-lg border border-gray-200 dark:border-neutral-700 text-center relative">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-xl text-gray-400 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
        >
          ✕
        </button>

        {viewingOther ? (
          <>
            <div className="flex justify-center">
              <Avatar
                name={selectedUser.username}
                src={selectedUser.avatar}
                size="lg"
              />
            </div>
            <h2 className="mt-3 font-semibold text-lg text-gray-900 dark:text-neutral-100">{selectedUser.username}</h2>
            <p className="text-gray-500 dark:text-neutral-400 text-sm">Contact</p>
            <div className="mt-4">
              {isBlocking ? (
                <button
                  onClick={handleUnblock}
                  className="w-full py-2.5 px-4 rounded-xl font-medium bg-gray-200 dark:bg-neutral-600 text-gray-900 dark:text-neutral-100 hover:bg-gray-300 dark:hover:bg-neutral-500 transition-all active:scale-95"
                >
                  Unblock User
                </button>
              ) : (
                <button
                  onClick={handleBlock}
                  className="w-full py-2.5 px-4 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white transition-all active:scale-95"
                >
                  Block User
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(!editing)}
              className="absolute top-3 left-3 p-1.5 rounded-xl text-gray-400 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            >
              ✏️
            </button>
            <div className="flex justify-center">
              <label className={editing ? "cursor-pointer" : ""}>
                <Avatar
                  name={user.username}
                  src={avatarPreview}
                  size="lg"
                />
                {editing && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                )}
              </label>
            </div>
            {editing ? (
              <input
                className="mt-3 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 p-2.5 rounded-xl w-full text-center text-gray-900 dark:text-neutral-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={user.username}
                onChange={(e) =>
                  setUser({ ...user, username: e.target.value })
                }
              />
            ) : (
              <h2 className="mt-3 font-semibold text-lg text-gray-900 dark:text-neutral-100">{user.username}</h2>
            )}
            <p className="text-emerald-500 dark:text-emerald-400 text-sm">Active</p>
          </>
        )}
      </div>

      {/* Info Section (only for own profile) */}
      {!viewingOther && (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-neutral-700 mt-4 space-y-5">

        {/* Username */}
        <div>
          <p className="text-xs text-gray-500 dark:text-neutral-400">Username</p>
          {editing ? (
            <input
              className="border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 p-2.5 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 outline-none"
              value={user.username}
              onChange={(e) =>
                setUser({ ...user, username: e.target.value })
              }
            />
          ) : (
            <p className="font-medium text-gray-900 dark:text-neutral-100">{user.username}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <p className="text-xs text-gray-500 dark:text-neutral-400">Email</p>
          {editing ? (
            <input
              className="border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 p-2.5 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 outline-none"
              value={user.email}
              onChange={(e) =>
                setUser({ ...user, email: e.target.value })
              }
            />
          ) : (
            <p className="font-medium text-gray-900 dark:text-neutral-100">{user.email}</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <p className="text-xs text-gray-500 dark:text-neutral-400">Bio</p>
          {editing ? (
            <textarea
              className="border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 p-2.5 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              value={user.bio}
              onChange={(e) =>
                setUser({ ...user, bio: e.target.value })
              }
            />
          ) : (
            <p className="font-medium text-gray-900 dark:text-neutral-100">{user.bio || "No bio"}</p>
          )}
        </div>

        {/* Preferred Language */}
        <div>
          <p className="text-xs text-gray-500 dark:text-neutral-400">Preferred Language</p>
          {editing ? (
            <select
              className="border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 p-2.5 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 outline-none"
              value={user.preferredLanguage}
              onChange={(e) =>
                setUser({
                  ...user,
                  preferredLanguage: e.target.value,
                })
              }
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Gujarati</option>
              <option>Marathi</option>
              <option>Bengali</option>
              <option>Odia</option>
            </select>
          ) : (
            <p className="font-medium text-gray-900 dark:text-neutral-100">{user.preferredLanguage}</p>
          )}
        </div>

        {/* SAVE BUTTON */}
        {editing && (
          <button
            onClick={handleSave}
            className="bg-emerald-500 hover:bg-emerald-600 text-white w-full py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 mt-2 active:scale-95"
          >
            Save Changes
          </button>
        )}
      </div>
      )}

      {/* Shared Media */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-neutral-700 mt-4 flex-1 min-h-[200px]">
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-neutral-100">
          Shared Media
        </h3>
        <SharedMedia
          currentUserId={currentUserId}
          selectedUserId={sharedMediaWithUserId ?? selectedUserId}
        />
      </div>
    </motion.div>
  );
};

export default ProfilePanel;
