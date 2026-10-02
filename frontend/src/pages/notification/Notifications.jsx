import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppLayout from "../../components/AppLayout";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../../config/notification/notificationAPI";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Notifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login again");
        return;
      }

      const res = await getNotifications(token);
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await markAsRead(notificationId, token);

      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await markAllAsRead(token);

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All marked as read");
    } catch (err) {
      console.log(err);
      toast.error("Failed to mark all as read");
    }
  };

  const handleClick = (notification) => {
    if (!notification.isRead) handleMarkAsRead(notification._id);
    if (notification.relatedGroup?._id) {
      navigate(`/groups/${notification.relatedGroup._id}/expenses`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#159a8c]"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ToastContainer position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">
            Activity
          </p>
          <h1 className="text-3xl font-bold text-[#102a43]">Notifications</h1>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleClick(n)}
              className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition ${
                !n.isRead
                  ? "border-[#159a8c]/30 bg-[#159a8c]/5"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                {!n.isRead && (
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#159a8c]" />
                )}
                <div className="flex-1">
                  <p
                    className={`text-sm ${
                      !n.isRead
                        ? "font-semibold text-[#102a43]"
                        : "text-slate-600"
                    }`}
                  >
                    {n.message}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-500">
                  {n.type.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;