import React, { useState, useRef, useEffect } from "react";
import Avatar from "../common/Avatar";
import CallButtons from "../call/CallButtons";
import MessageSearchBar from "./MessageSearchBar";
import { Menu, MoreVertical, Search, X } from "lucide-react";

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return "";
  const date = new Date(lastSeen);
  if (Number.isNaN(date.getTime())) return "";

  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `Last seen at ${time}`;
};

const ChatHeader = ({
  activeChat,
  typingUser,
  isOnline,
  lastSeen,
  onOpenFriendsList,
  onlineUsersIncludes,
  hideProfilePhoto = false,
  onOpenProfile,
  isBlocking = false,
  onBlock,
  onUnblock,
  onSearchSelectMessage,
  searchMessagesList = [],
  onClose,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!activeChat) return null;

  const isGroup = activeChat.isGroup || false;
  const isOnlineNow = isOnline || onlineUsersIncludes;

  let statusNode = null;

  if (typingUser) {
    statusNode = (
      <span className="text-emerald-400 animate-pulse font-medium">
        {activeChat.username} is typing...
      </span>
    );
  } else if (isOnlineNow) {
    statusNode = (
      <span className="text-emerald-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        Online
      </span>
    );
  } else if (lastSeen) {
    statusNode = (
      <span className="text-gray-500 dark:text-neutral-400">
        {formatLastSeen(lastSeen)}
      </span>
    );
  } else {
    statusNode = (
      <span className="text-gray-500 dark:text-neutral-400">
        Offline
      </span>
    );
  }

  return (
    <div className="flex items-center justify-between bg-white dark:bg-neutral-800/95 backdrop-blur-sm p-4 md:p-5 rounded-2xl shadow-lg border border-gray-200 dark:border-neutral-700 mb-4 sticky top-0 z-10">
      {showSearchBar ? (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setShowSearchBar(false)}
            className="p-2 rounded-xl text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-neutral-100 shrink-0 transition-colors"
            aria-label="Close search"
          >
            <Menu size={20} />
          </button>
          <MessageSearchBar
            chatId={activeChat?._id}
            messages={searchMessagesList}
            onSelectMessage={(msg, query) => {
              onSearchSelectMessage?.(msg, query);
              setShowSearchBar(false);
            }}
            onClose={() => setShowSearchBar(false)}
          />
        </div>
      ) : (
        <>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onOpenFriendsList}
          className="md:hidden p-2 rounded-xl text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-neutral-100 transition-colors shrink-0"
        >
          <Menu size={20} />
        </button>
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-3 flex-1 min-w-0 text-left focus:outline-none rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors p-1 -m-1"
        >
          <Avatar
            name={isGroup ? activeChat.name : activeChat.username}
            src={hideProfilePhoto ? undefined : (isGroup ? (activeChat.groupLogo || activeChat.avatar) : activeChat.avatar)}
            size="md"
            online={isGroup ? false : isOnlineNow}
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-neutral-100 text-base truncate">
              {isGroup ? activeChat.name : activeChat.username}
            </h3>
            <p className="text-xs mt-0.5">
              {isGroup 
                ? `${activeChat.members?.length || 0} member${(activeChat.members?.length || 0) !== 1 ? "s" : ""}`
                : statusNode
              }
            </p>
          </div>
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setShowSearchBar(true)}
          className="p-2 rounded-xl text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-neutral-100 transition-colors"
          aria-label="Search in chat"
        >
          <Search size={20} />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="p-2 rounded-xl text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-neutral-100 transition-colors"
            aria-label="More options"
          >
            <MoreVertical size={20} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-700 z-50">
              <button
                type="button"
                onClick={() => { onOpenProfile?.(); setMenuOpen(false); }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-t-xl"
              >
                View profile
              </button>
              {isBlocking ? (
                <button
                  type="button"
                  onClick={() => { onUnblock?.(); setMenuOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700"
                >
                  Unblock user
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { onBlock?.(); setMenuOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-b-xl"
                >
                  Block user
                </button>
              )}
            </div>
          )}
        </div>
        <CallButtons
          receiverId={activeChat._id}
          receiverName={activeChat.username}
          isOnline={isOnlineNow}
        />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-neutral-100 transition-colors"
            aria-label="Close chat"
            title="Close chat"
          >
            <X size={20} />
          </button>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default ChatHeader;

