import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppLayout from "../../components/AppLayout";
import { getGroupActivity } from "../../config/activity/activityAPI";
import { getGroupById } from "../../config/group/groupAPI";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Map each action type to an icon/color for quick visual scanning
const ACTION_STYLES = {
  group_created: { icon: "🎉", color: "text-[#159a8c]" },
  group_updated: { icon: "✏️", color: "text-slate-600" },
  member_added: { icon: "➕", color: "text-green-600" },
  member_removed: { icon: "➖", color: "text-red-600" },
  member_role_changed: { icon: "🔑", color: "text-amber-600" },
  expense_added: { icon: "💰", color: "text-[#159a8c]" },
  expense_updated: { icon: "✏️", color: "text-amber-600" },
  expense_deleted: { icon: "🗑️", color: "text-red-600" },
  settlement_recorded: { icon: "✅", color: "text-green-600" },
  settlement_updated: { icon: "✏️", color: "text-amber-600" },
  settlement_deleted: { icon: "🗑️", color: "text-red-600" },
};

const GroupActivity = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD ACTIVITY
  // =========================

  const loadActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login again");
        return;
      }

      const [groupRes, activityRes] = await Promise.all([
        getGroupById(groupId, token),
        getGroupActivity(groupId, token, page, 15),
      ]);

      setGroup(groupRes.data.group);
      setActivities(activityRes.data.activities || []);
      setPagination(activityRes.data.pagination);
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "Failed to load activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
    // eslint-disable-next-line
  }, [groupId, page]);

  // =========================
  // FORMAT TIME
  // =========================

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // =========================
  // LOADING
  // =========================

  if (loading && !group) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#159a8c]"></div>
        </div>
      </AppLayout>
    );
  }

  if (!group) {
    return (
      <AppLayout>
        <p className="py-20 text-center text-slate-500">Group not found</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ToastContainer position="top-right" />

      {/* BACK */}
      <button
        onClick={() => navigate(`/groups/${groupId}/expenses`)}
        className="mb-5 text-sm font-semibold text-[#159a8c]"
      >
        ← Back to Expenses
      </button>

      {/* HEADER */}
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">
          {group.name}
        </p>
        <h1 className="text-3xl font-bold text-[#102a43]">Activity History</h1>
        <p className="mt-2 text-sm text-slate-500">
          A timeline of everything that happened in this group.
        </p>
      </div>

      {/* ACTIVITY FEED */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {activities.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-500">No activity yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((activity) => {
              const style = ACTION_STYLES[activity.action] || { icon: "📌", color: "text-slate-600" };

              return (
                <div key={activity._id} className="flex items-start gap-4 px-6 py-4">
                  {/* ICON */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-lg">
                    {style.icon}
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1">
                    <p className="text-sm text-[#102a43]">
                      <span className="font-semibold">
                        {activity.actor?.name || "Someone"}
                      </span>{" "}
                      <span className={style.color}>{activity.description}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </AppLayout>
  );
};

export default GroupActivity;