"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Edit3,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Receipt,
  Trash2,
  Users,
  X,
  Wallet,
} from "lucide-react";

import AppLayout from "../components/AppLayout";

import {
  createSettlement,
  getGroupSettlements,
  updateSettlement,
  deleteSettlement,
} from "../config/settlement/settlementAPI";

import { getMyGroups } from "../config/group/groupAPI";

const Settlement = () => {
  const [searchParams] = useSearchParams();

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(
    searchParams.get("groupId") || ""
  );

  const [settlements, setSettlements] = useState([]);

  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingSettlements, setLoadingSettlements] = useState(false);

  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [settlementToDelete, setSettlementToDelete] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    payer: "",
    receiver: "",
    amount: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
  });

  const token = localStorage.getItem("token");

  /* --------------------------------------------------
     FETCH GROUPS
  -------------------------------------------------- */

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoadingGroups(true);
        setError("");

        const response = await getMyGroups(token);

        const fetchedGroups = response?.data?.groups || [];

        setGroups(fetchedGroups);

        if (!selectedGroup && fetchedGroups.length > 0) {
          setSelectedGroup(fetchedGroups[0]._id);
        }
      } catch (err) {
        console.error("Failed to fetch groups:", err);

        setError(
          err?.response?.data?.message ||
            "Unable to load your groups. Please try again."
        );
      } finally {
        setLoadingGroups(false);
      }
    };

    if (token) {
      fetchGroups();
    }
  }, [token]);

  /* --------------------------------------------------
     FETCH SETTLEMENTS
  -------------------------------------------------- */

  useEffect(() => {
    if (!selectedGroup || !token) return;

    fetchSettlements();
  }, [selectedGroup]);

  const fetchSettlements = async () => {
    try {
      setLoadingSettlements(true);
      setError("");

      const response = await getGroupSettlements(token, selectedGroup);

      setSettlements(response?.data?.settlements || []);
    } catch (err) {
      console.error("Failed to fetch settlements:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load settlement history."
      );
    } finally {
      setLoadingSettlements(false);
    }
  };

  /* --------------------------------------------------
     SELECTED GROUP
  -------------------------------------------------- */

  const currentGroup = groups.find(
    (group) => group._id === selectedGroup
  );

  const members = currentGroup?.members || [];

  /* --------------------------------------------------
     HELPERS
  -------------------------------------------------- */

  const getMemberUser = (member) => {
    return member?.user || member;
  };

  const getUserId = (user) => {
    if (!user) return "";

    return user?._id || user?.id || user;
  };

  const getName = (user) => {
    if (!user) return "Unknown User";

    return (
      user?.name ||
      user?.username ||
      user?.email ||
      "Unknown User"
    );
  };

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (date) => {
    if (!date) return "No date";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* --------------------------------------------------
     SUMMARY
  -------------------------------------------------- */

  const totalSettled = settlements.reduce(
    (total, settlement) =>
      total + Number(settlement.amount || 0),
    0
  );

  const settlementCount = settlements.length;

  /* --------------------------------------------------
     FORM
  -------------------------------------------------- */

  const resetForm = () => {
    setFormData({
      payer: "",
      receiver: "",
      amount: "",
      note: "",
      date: new Date().toISOString().split("T")[0],
    });

    setEditingSettlement(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (settlement) => {
    setEditingSettlement(settlement);

    setFormData({
      payer: getUserId(settlement.payer),
      receiver: getUserId(settlement.receiver),
      amount: settlement.amount || "",
      note: settlement.note || "",
      date: settlement.date
        ? new Date(settlement.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* --------------------------------------------------
     CREATE / UPDATE
  -------------------------------------------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedGroup) {
      setError("Please select a group.");
      return;
    }

    if (!formData.payer || !formData.receiver) {
      setError("Please select both payer and receiver.");
      return;
    }

    if (formData.payer === formData.receiver) {
      setError("Payer and receiver cannot be the same person.");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError("Settlement amount must be greater than zero.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingSettlement) {
        await updateSettlement(
          token,
          editingSettlement._id,
          {
            amount: Number(formData.amount),
            note: formData.note,
            date: formData.date,
          }
        );
      } else {
        await createSettlement(token, {
          groupId: selectedGroup,
          payer: formData.payer,
          receiver: formData.receiver,
          amount: Number(formData.amount),
          note: formData.note,
          date: formData.date,
        });
      }

      await fetchSettlements();

      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Settlement save error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to save settlement."
      );
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------------------------------
     DELETE
  -------------------------------------------------- */

  const openDeleteModal = (settlement) => {
    setSettlementToDelete(settlement);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setShowDeleteModal(false);
    setSettlementToDelete(null);
  };

  const handleDelete = async () => {
    if (!settlementToDelete) return;

    try {
      setDeleting(true);
      setError("");

      await deleteSettlement(
        token,
        settlementToDelete._id
      );

      setSettlements((prev) =>
        prev.filter(
          (item) => item._id !== settlementToDelete._id
        )
      );

      closeDeleteModal();
    } catch (err) {
      console.error("Delete settlement error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to delete settlement."
      );
    } finally {
      setDeleting(false);
    }
  };

  /* --------------------------------------------------
     LOADING GROUPS
  -------------------------------------------------- */

  if (loadingGroups) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#159a8c] to-[#0e6d63] flex items-center justify-center shadow-lg shadow-indigo-200">
              <Loader2
                size={24}
                className="text-white animate-spin"
              />
            </div>

            <p className="text-sm font-medium text-slate-500">
              Loading settlements...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  /* --------------------------------------------------
     MAIN UI
  -------------------------------------------------- */

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">
        {/* HEADER */}

        <div className="border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#159a8c] to-[#0e6d63] flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Wallet
                      size={22}
                      className="text-white"
                    />
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                      Settlements
                    </h1>

                    <p className="text-sm text-slate-500 mt-0.5">
                      Track and manage payments between group members
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={openCreateModal}
                disabled={!selectedGroup}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-br from-[#159a8c] to-[#0e6d63] hover:bg-gradient-to-br hover:from-[#159a8c] hover:to-[#0e6d63] text-white font-semibold text-sm shadow-lg shadow-indigo-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                Record Settlement
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          {/* ERROR */}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <X
                  size={18}
                  className="text-red-600"
                />
              </div>

              <div className="flex-1">
                <p className="font-semibold text-red-800 text-sm">
                  Something went wrong
                </p>

                <p className="text-sm text-red-600 mt-0.5">
                  {error}
                </p>
              </div>

              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* GROUP SELECTOR */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Users
                    size={19}
                    className="text-slate-600"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Current Group
                  </p>

                  <p className="font-semibold text-slate-900">
                    {currentGroup?.name || "Select a group"}
                  </p>
                </div>
              </div>

              <div className="relative w-full md:w-72">
                <select
                  value={selectedGroup}
                  onChange={(e) =>
                    setSelectedGroup(e.target.value)
                  }
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  {groups.length === 0 && (
                    <option value="">
                      No groups available
                    </option>
                  )}

                  {groups.map((group) => (
                    <option
                      key={group._id}
                      value={group._id}
                    >
                      {group.name}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={17}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* SUMMARY CARDS */}

          {selectedGroup && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Settlements
                    </p>

                    <p className="text-2xl font-bold text-slate-900 mt-2">
                      {settlementCount}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Recorded payments
                    </p>
                  </div>

                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Receipt
                      size={20}
                      className="text-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Total Settled
                    </p>

                    <p className="text-2xl font-bold text-slate-900 mt-2">
                      ₹{formatAmount(totalSettled)}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Across all payments
                    </p>
                  </div>

                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <CreditCard
                      size={20}
                      className="text-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Members
                    </p>

                    <p className="text-2xl font-bold text-slate-900 mt-2">
                      {members.length}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      In this group
                    </p>
                  </div>

                  <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Users
                      size={20}
                      className="text-violet-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION HEADER */}

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Settlement History
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Payments recorded for this group
              </p>
            </div>

            {selectedGroup && !loadingSettlements && (
              <button
                onClick={fetchSettlements}
                className="text-sm font-semibold text-[#159a8c]  hover:text-[#159a8c] transition"
              >
                Refresh
              </button>
            )}
          </div>

          {/* LOADING */}

          {loadingSettlements ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-14 flex flex-col items-center justify-center shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <Loader2
                  size={21}
                  className="text-indigo-600 animate-spin"
                />
              </div>

              <p className="text-sm font-semibold text-slate-700">
                Loading settlement history
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Please wait a moment...
              </p>
            </div>
          ) : settlements.length === 0 ? (
            /* EMPTY STATE */

            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
                <Receipt
                  size={28}
                  className="text-slate-400"
                />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                No settlements yet
              </h3>

              <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                When someone pays another member to settle a
                balance, the payment will appear here.
              </p>

              <button
                onClick={openCreateModal}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-[#159a8c] to-[#0e6d63] hover:bg-gradient-to-br hover:from-[#159a8c] hover:to-[#0e6d63] text-white text-sm font-semibold transition"
              >
                <Plus size={17} />
                Record First Settlement
              </button>
            </div>
          ) : (
            /* SETTLEMENT LIST */

            <div className="space-y-4">
              {settlements.map((settlement) => {
                const payerName = getName(
                  settlement.payer
                );

                const receiverName = getName(
                  settlement.receiver
                );

                return (
                  <div
                    key={settlement._id}
                    className="group bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                      {/* PAYMENT INFO */}

                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          {/* PAYER */}

                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {getInitials(payerName)}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs text-slate-400 font-medium">
                                Paid by
                              </p>

                              <p className="font-semibold text-slate-900 truncate">
                                {payerName}
                              </p>
                            </div>
                          </div>

                          {/* ARROW */}

                          <div className="hidden sm:flex w-9 h-9 rounded-full bg-slate-100 items-center justify-center shrink-0">
                            <ArrowRight
                              size={17}
                              className="text-slate-400"
                            />
                          </div>

                          {/* RECEIVER */}

                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {getInitials(receiverName)}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs text-slate-400 font-medium">
                                Received by
                              </p>

                              <p className="font-semibold text-slate-900 truncate">
                                {receiverName}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* META */}

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <CalendarDays size={14} />
                            {formatDate(settlement.date)}
                          </div>

                          {settlement.note && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <FileText size={14} />
                              <span className="max-w-xs truncate">
                                {settlement.note}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AMOUNT + ACTIONS */}

                      <div className="flex items-center justify-between lg:justify-end gap-5 border-t lg:border-t-0 pt-4 lg:pt-0">
                        <div className="text-left lg:text-right">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Amount
                          </p>

                          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                            ₹{formatAmount(settlement.amount)}
                          </p>

                          <div className="flex items-center lg:justify-end gap-1.5 mt-1 text-xs text-emerald-600 font-medium">
                            <CheckCircle2 size={13} />
                            Settled
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              openEditModal(settlement)
                            }
                            className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition"
                            title="Edit settlement"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            onClick={() =>
                              openDeleteModal(settlement)
                            }
                            className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center transition"
                            title="Delete settlement"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* --------------------------------------------------
            CREATE / EDIT MODAL
        -------------------------------------------------- */}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              onClick={closeModal}
            />

            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* MODAL HEADER */}

              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    {editingSettlement ? (
                      <Edit3
                        size={19}
                        className="text-indigo-600"
                      />
                    ) : (
                      <Wallet
                        size={19}
                        className="text-indigo-600"
                      />
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      {editingSettlement
                        ? "Edit Settlement"
                        : "Record Settlement"}
                    </h3>

                    <p className="text-xs text-slate-500 mt-0.5">
                      {editingSettlement
                        ? "Correct the settlement details"
                        : "Record a payment between group members"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeModal}
                  className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
                >
                  <X size={19} />
                </button>
              </div>

              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                className="h-90 p-6 space-y-5 overflow-auto"
              >
                {/* PAYER */}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Who paid?
                  </label>

                  <div className="relative">
                    <select
                      name="payer"
                      value={formData.payer}
                      onChange={handleInputChange}
                      disabled={!!editingSettlement}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        Select payer
                      </option>

                      {members.map((member) => {
                        const user = getMemberUser(member);
                        const userId = getUserId(user);

                        return (
                          <option
                            key={userId}
                            value={userId}
                          >
                            {getName(user)}
                          </option>
                        );
                      })}
                    </select>

                    <ChevronDown
                      size={17}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                {/* RECEIVER */}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Who received?
                  </label>

                  <div className="relative">
                    <select
                      name="receiver"
                      value={formData.receiver}
                      onChange={handleInputChange}
                      disabled={!!editingSettlement}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        Select receiver
                      </option>

                      {members.map((member) => {
                        const user = getMemberUser(member);
                        const userId = getUserId(user);

                        return (
                          <option
                            key={userId}
                            value={userId}
                          >
                            {getName(user)}
                          </option>
                        );
                      })}
                    </select>

                    <ChevronDown
                      size={17}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                {/* AMOUNT */}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Amount
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                      ₹
                    </span>

                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* DATE */}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Date
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />

                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* NOTE */}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Note
                    <span className="font-normal text-slate-400 ml-1">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Add a note about this payment..."
                    className="w-full resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* ACTIONS */}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        {editingSettlement
                          ? "Update Settlement"
                          : "Record Settlement"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --------------------------------------------------
            DELETE MODAL
        -------------------------------------------------- */}

        {showDeleteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              onClick={closeDeleteModal}
            />

            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2
                    size={21}
                    className="text-red-600"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Delete settlement?
                  </h3>

                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                    This will permanently remove this settlement
                    from the group history. This action cannot be
                    undone.
                  </p>
                </div>
              </div>

              {settlementToDelete && (
                <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-400">
                        Payment
                      </p>

                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {getName(
                          settlementToDelete.payer
                        )}{" "}
                        →{" "}
                        {getName(
                          settlementToDelete.receiver
                        )}
                      </p>
                    </div>

                    <p className="font-bold text-slate-900">
                      ₹
                      {formatAmount(
                        settlementToDelete.amount
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={17} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Settlement;