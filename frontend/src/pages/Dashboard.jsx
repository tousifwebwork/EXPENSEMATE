import React, { useEffect, useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Receipt,
  TrendingUp,
  Activity,
  CreditCard,
  CalendarDays,
  ChevronRight,
  Loader2,
  AlertCircle,
  IndianRupee,
  PieChart,
} from "lucide-react";
import { motion } from "framer-motion";

import AppLayout from "../components/AppLayout";
import { getDashboard } from "../config/Dashboard/dashboardAPI";

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getDashboard(token);

        if (res.data?.success) {
          setDashboard(res.data.dashboard);
        } else {
          setError(res.data?.message || "Failed to load dashboard");
        }
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(
          err.response?.data?.message ||
            "Something went wrong while loading dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboard();
    } else {
      setLoading(false);
      setError("You are not logged in.");
    }
  }, [token]);

  const formatCurrency = (amount = 0) => {
    return `₹${Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getActivityTitle = (activity) => {
    if (activity.type === "expense") {
      return activity.data?.description || "New expense";
    }

    return "Settlement recorded";
  };

  const getActivitySubtitle = (activity) => {
    const data = activity.data;

    if (activity.type === "expense") {
      return data?.group?.name || "Expense";
    }

    return data?.group?.name || "Settlement";
  };

  const getActivityAmount = (activity) => {
    return activity.data?.amount || 0;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      food: "🍔",
      travel: "✈️",
      shopping: "🛍️",
      entertainment: "🎬",
      bills: "💡",
      health: "💊",
      education: "📚",
      transport: "🚗",
      other: "📦",
    };

    return icons[category?.toLowerCase()] || "📦";
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm text-gray-500">
              Loading your dashboard...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white border border-red-100 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to load dashboard
            </h2>

            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!dashboard) return null;

  const categoryEntries = Object.entries(dashboard.categoryTotals || {});

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <p className="text-sm text-gray-500 mb-1">
                Welcome back 👋
              </p>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Dashboard
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Here's your ExpenseMate overview.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
              <CalendarDays className="w-4 h-4 text-gray-500" />

              <span className="text-sm font-medium text-gray-600">
                {new Date().toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </motion.div>

          {/* TOP SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            {/* GROUPS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Active Groups
                  </p>

                  <h2 className="text-2xl font-bold text-gray-900 mt-2">
                    {dashboard.activeGroupsCount || 0}
                  </h2>
                </div>

                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Groups you're currently part of
              </p>
            </motion.div>

            {/* YOU OWE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    You Owe
                  </p>

                  <h2 className="text-2xl font-bold text-red-600 mt-2">
                    {formatCurrency(dashboard.totalOwed)}
                  </h2>
                </div>

                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-red-500" />
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Amount you need to pay
              </p>
            </motion.div>

            {/* RECEIVABLE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    You're Owed
                  </p>

                  <h2 className="text-2xl font-bold text-emerald-600 mt-2">
                    {formatCurrency(dashboard.totalReceivable)}
                  </h2>
                </div>

                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Money others need to pay you
              </p>
            </motion.div>

            {/* MONTH */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    This Month
                  </p>

                  <h2 className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(dashboard.currentMonthTotal)}
                  </h2>
                </div>

                <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-violet-600" />
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Your share of expenses this month
              </p>
            </motion.div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* RECENT ACTIVITY */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Recent Activity
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    Your latest expenses and settlements
                  </p>
                </div>

                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-gray-600" />
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {dashboard.recentActivity?.length > 0 ? (
                  dashboard.recentActivity.map((activity, index) => {
                    const isExpense = activity.type === "expense";

                    return (
                      <motion.div
                        key={`${activity.type}-${activity.data?._id || index}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            isExpense
                              ? "bg-orange-50"
                              : "bg-emerald-50"
                          }`}
                        >
                          {isExpense ? (
                            <Receipt className="w-5 h-5 text-orange-500" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {getActivityTitle(activity)}
                          </h3>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {getActivitySubtitle(activity)}
                            </span>

                            <span className="text-gray-300">
                              •
                            </span>

                            <span className="text-xs text-gray-400">
                              {formatDate(activity.data?.date)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              getActivityAmount(activity)
                            )}
                          </p>

                          <p
                            className={`text-[11px] mt-0.5 ${
                              isExpense
                                ? "text-orange-500"
                                : "text-emerald-600"
                            }`}
                          >
                            {isExpense
                              ? "Expense"
                              : "Settlement"}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center">
                    <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-3" />

                    <p className="text-sm text-gray-500">
                      No recent activity
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Your latest transactions will appear here.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* OUTSTANDING GROUPS */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm"
            >
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-indigo-600" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Outstanding
                    </h2>

                    <p className="text-xs text-gray-500 mt-1">
                      Groups needing attention
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {dashboard.groupsWithOutstandingBalance?.length > 0 ? (
                  <div className="space-y-2">
                    {dashboard.groupsWithOutstandingBalance.map(
                      (group, index) => {
                        const owes = group.balance < 0;

                        return (
                          <motion.div
                            key={group.groupId}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: 0.35 + index * 0.05,
                            }}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                              {group.groupName
                                ?.charAt(0)
                                ?.toUpperCase() || "G"}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {group.groupName}
                              </p>

                              <p
                                className={`text-xs mt-0.5 ${
                                  owes
                                    ? "text-red-500"
                                    : "text-emerald-600"
                                }`}
                              >
                                {owes
                                  ? "You owe"
                                  : "You're owed"}
                              </p>
                            </div>

                            <div className="text-right">
                              <p
                                className={`text-sm font-semibold ${
                                  owes
                                    ? "text-red-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                {formatCurrency(
                                  Math.abs(group.balance)
                                )}
                              </p>
                            </div>
                          </motion.div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                      <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                    </div>

                    <p className="text-sm font-medium text-gray-900">
                      All settled up!
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      You have no outstanding group balances.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* LOWER GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* CATEGORY SPENDING */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Spending by Category
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    Your spending breakdown
                  </p>
                </div>

                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <PieChart className="w-4 h-4 text-violet-600" />
                </div>
              </div>

              <div className="p-5">
                {categoryEntries.length > 0 ? (
                  <div className="space-y-4">
                    {categoryEntries
                      .sort((a, b) => b[1] - a[1])
                      .map(([category, amount], index) => {
                        const total = categoryEntries.reduce(
                          (sum, [, value]) => sum + Number(value),
                          0
                        );

                        const percentage =
                          total > 0
                            ? (Number(amount) / total) * 100
                            : 0;

                        return (
                          <div key={category}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">
                                  {getCategoryIcon(category)}
                                </span>

                                <span className="text-sm font-medium text-gray-700 capitalize">
                                  {category}
                                </span>
                              </div>

                              <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(amount)}
                              </span>
                            </div>

                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${percentage}%`,
                                }}
                                transition={{
                                  duration: 0.6,
                                  delay: 0.4 + index * 0.08,
                                }}
                                className="h-full bg-indigo-500 rounded-full"
                              />
                            </div>

                            <p className="text-[11px] text-gray-400 mt-1">
                              {percentage.toFixed(1)}% of spending
                            </p>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <PieChart className="w-8 h-8 text-gray-300 mx-auto mb-3" />

                    <p className="text-sm text-gray-500">
                      No spending data yet
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* FINANCIAL OVERVIEW */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm"
            >
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">
                  Financial Overview
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Your current position
                </p>
              </div>

              <div className="p-5 space-y-4">

                {/* OWED */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-red-500" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        You need to pay
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        Outstanding amount
                      </p>
                    </div>
                  </div>

                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(dashboard.totalOwed)}
                  </p>
                </div>

                {/* RECEIVABLE */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Others need to pay
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        Money you're owed
                      </p>
                    </div>
                  </div>

                  <p className="text-lg font-bold text-emerald-600">
                    {formatCurrency(dashboard.totalReceivable)}
                  </p>
                </div>

                {/* NET */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 text-gray-600" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Net Position
                        </p>

                        <p className="text-xs text-gray-500 mt-0.5">
                          You're owed minus what you owe
                        </p>
                      </div>
                    </div>

                    <p
                      className={`text-lg font-bold ${
                        dashboard.totalReceivable -
                          dashboard.totalOwed >=
                        0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(
                        dashboard.totalReceivable -
                          dashboard.totalOwed
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* FOOTER INFO */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 py-4 text-xs text-gray-400"
          >
            <Activity className="w-3.5 h-3.5" />

            <span>
              ExpenseMate keeps your group expenses organized.
            </span>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;