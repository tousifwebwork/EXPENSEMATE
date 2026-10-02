import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react"; // or any icon lib you're using; swap if needed

import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../config/notification/notificationAPI";

const NotificationBell = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD NOTIFICATIONS
  // =========================

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await getNotifications(token);

      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // =========================
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // =========================

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // =========================
  // MARK ONE AS READ
  // =========================

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await markAsRead(notificationId, token);

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.log(err);
    }
  };

  // =========================
  // MARK ALL AS READ
  // =========================

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await markAllAsRead(token);

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.log(err);
    }
  };

  // =========================
  // CLICK A NOTIFICATION
  // =========================

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    if (notification.relatedGroup?._id) {
      navigate(`/groups/${notification.relatedGroup._id}/expenses`);
    }

    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BELL BUTTON */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full p-2 hover:bg-slate-100 dark:hover:bg-stone-800"
      >
        <Bell className="h-6 w-6 text-slate-600 dark:text-stone-300" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-lg z-50 dark:border-stone-700 dark:bg-stone-900">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-stone-800">
            <p className="font-bold text-[#102a43] dark:text-stone-100">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-[#159a8c] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* LIST */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-center text-sm text-slate-400">
                Loading...
              </p>
            ) : notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">
                No notifications yet
              </p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`cursor-pointer border-b border-slate-50 px-4 py-3 hover:bg-slate-50 dark:border-stone-800 dark:hover:bg-stone-800 ${
                    !n.isRead ? "bg-[#159a8c]/5 dark:bg-[#159a8c]/10" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#159a8c]" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          !n.isRead
                            ? "font-semibold text-[#102a43]"
                            : "text-slate-600 dark:text-stone-300"
                        }`}
                      >
                        {n.message}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FOOTER */}
          <div className="border-t border-slate-100 px-4 py-2 text-center dark:border-stone-800">
            <button
              onClick={() => {
                navigate("/notifications");
                setOpen(false);
              }}
              className="text-xs font-semibold text-[#159a8c] hover:underline"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;