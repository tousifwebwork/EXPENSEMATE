
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppLayout from "../../components/AppLayout";

import {
  getExpenseById,
  updateExpense,
  deleteExpense,
} from "../../config/expense/expenseAPI";

import { getGroupById } from "../../config/group/groupAPI";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EditExpense = () => {
  const { groupId, expenseId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [expense, setExpense] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    category: "Other",
    date: "",
    paidBy: "",
    splitType: "equal",
    participants: [],
    exactAmounts: {},
    percentages: {},
    notes: "",
  });

  // =========================
  // LOAD DATA
  // =========================

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again");
        return;
      }

      const [expenseRes, groupRes] = await Promise.all([
        getExpenseById(expenseId, token),
        getGroupById(groupId, token),
      ]);

      const expenseData = expenseRes.data.expense;
      const groupData = groupRes.data.group;

      setExpense(expenseData);
      setGroup(groupData);

      const participants =
        expenseData.shares?.map((share) =>
          share.user?._id ? share.user._id : share.user
        ) || [];

      const exactAmounts = {};
      const percentages = {};

      expenseData.shares?.forEach((share) => {
        const userId = share.user?._id || share.user;

        exactAmounts[userId] = share.amount ?? "";
        percentages[userId] = share.percentage ?? "";
      });

      setFormData({
        title: expenseData.title || "",
        description: expenseData.description || "",
        amount: expenseData.amount || "",
        category: expenseData.category || "Other",
        date: expenseData.date
          ? new Date(expenseData.date).toISOString().split("T")[0]
          : "",
        paidBy: expenseData.paidBy?._id || expenseData.paidBy || "",
        splitType: expenseData.splitType || "equal",
        participants,
        exactAmounts,
        percentages,
        notes: expenseData.notes || "",
      });
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message ||
          "Failed to load expense"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [expenseId, groupId]);

  // =========================
  // INPUT CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // PARTICIPANTS
  // =========================

  const handleParticipantChange = (userId) => {
    setFormData((prev) => {
      const exists = prev.participants.includes(userId);

      return {
        ...prev,
        participants: exists
          ? prev.participants.filter((id) => id !== userId)
          : [...prev.participants, userId],
      };
    });
  };

  const selectAllParticipants = () => {
    if (!group?.members) return;

    const allMemberIds = group.members.map(
      (member) => member.user._id
    );

    setFormData((prev) => ({
      ...prev,
      participants: allMemberIds,
    }));
  };

  // =========================
  // EXACT AMOUNT CHANGE
  // =========================

  const handleExactAmountChange = (userId, value) => {
    setFormData((prev) => ({
      ...prev,
      exactAmounts: {
        ...prev.exactAmounts,
        [userId]: value,
      },
    }));
  };

  // =========================
  // PERCENTAGE CHANGE
  // =========================

  const handlePercentageChange = (userId, value) => {
    setFormData((prev) => ({
      ...prev,
      percentages: {
        ...prev.percentages,
        [userId]: value,
      },
    }));
  };

  // =========================
  // BUILD SHARES
  // =========================

  const buildShares = () => {
    if (formData.splitType === "equal") {
      return formData.participants.map((userId) => ({
        user: userId,
      }));
    }

    if (formData.splitType === "exact") {
      return formData.participants.map((userId) => ({
        user: userId,
        amount: Number(formData.exactAmounts[userId] || 0),
      }));
    }

    if (formData.splitType === "percentage") {
      return formData.participants.map((userId) => ({
        user: userId,
        percentage: Number(formData.percentages[userId] || 0),
      }));
    }

    return [];
  };

  // =========================
  // UPDATE EXPENSE
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Enter expense title");
      return;
    }

    if (
      !formData.amount ||
      Number(formData.amount) <= 0
    ) {
      toast.error("Enter a valid amount");
      return;
    }

    if (!formData.paidBy) {
      toast.error("Select who paid");
      return;
    }

    if (formData.participants.length === 0) {
      toast.error("Select at least one participant");
      return;
    }

    // Validate exact split on frontend
    if (formData.splitType === "exact") {
      const totalExact = formData.participants.reduce(
        (total, userId) =>
          total +
          Number(formData.exactAmounts[userId] || 0),
        0
      );

      if (Math.round(totalExact * 100) !== Math.round(Number(formData.amount) * 100)) {
        toast.error(
          "Exact split amounts must add up to the total"
        );
        return;
      }
    }

    // Validate percentage split on frontend
    if (formData.splitType === "percentage") {
      const totalPercentage = formData.participants.reduce(
        (total, userId) =>
          total +
          Number(formData.percentages[userId] || 0),
        0
      );

      if (Math.round(totalPercentage * 100) !== 10000) {
        toast.error(
          "Percentages must add up to 100%"
        );
        return;
      }
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again");
        return;
      }

      const shares = buildShares();

      const expenseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        amount: Number(formData.amount),
        category: formData.category,
        date: formData.date,
        paidBy: formData.paidBy,
        splitType: formData.splitType,
        shares,
        notes: formData.notes.trim(),
      };

      await updateExpense(
        expenseId,
        expenseData,
        token
      );

      toast.success("Expense updated successfully!");

      setTimeout(() => {
        navigate(`/groups/${groupId}/expenses`);
      }, 800);
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message ||
          "Failed to update expense"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE EXPENSE
  // =========================

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again");
        return;
      }

      await deleteExpense(expenseId, token);

      toast.success("Expense deleted successfully!");

      setTimeout(() => {
        navigate(`/groups/${groupId}/expenses`);
      }, 800);
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message ||
          "Failed to delete expense"
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#159a8c]"></div>
        </div>
      </AppLayout>
    );
  }

  // =========================
  // NOT FOUND
  // =========================

  if (!expense || !group) {
    return (
      <AppLayout>
        <p className="py-20 text-center text-slate-500">
          Expense not found
        </p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>

      <ToastContainer position="top-right" />

      {/* BACK */}

      <button
        onClick={() =>
          navigate(`/groups/${groupId}/expenses`)
        }
        className="mb-5 text-sm font-semibold text-[#159a8c]"
      >
        ← Back to Expenses
      </button>

      {/* HEADER */}

      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">
          {group.name}
        </p>

        <h1 className="text-3xl font-bold text-[#102a43]">
          Edit Expense
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Update the details of this expense
        </p>
      </div>

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >

        {/* TITLE + AMOUNT */}

        <div className="grid gap-5 sm:grid-cols-2">

          <div>
            <label className="text-sm font-semibold text-[#102a43]">
              Expense Title
            </label>

            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Goa Dinner"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#102a43]">
              Amount
            </label>

            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              placeholder="Enter amount"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]"
            />
          </div>

        </div>

        {/* DESCRIPTION */}

        <div className="mt-5">
          <label className="text-sm font-semibold text-[#102a43]">
            Description
          </label>

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add a description"
            rows="3"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]"
          />
        </div>

        {/* CATEGORY + DATE */}

        <div className="mt-5 grid gap-5 sm:grid-cols-2">

          <div>
            <label className="text-sm font-semibold text-[#102a43]">
              Category
            </label>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="Food">Food</option>
              <option value="Travel">Travel</option>
              <option value="Shopping">Shopping</option>
              <option value="Rent">Rent</option>
              <option value="Utilities">Utilities</option>
              <option value="Entertainment">
                Entertainment
              </option>
              <option value="Accommodation">
                Accommodation
              </option>
              <option value="Medical">Medical</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#102a43]">
              Date
            </label>

            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

        </div>

        {/* PAID BY */}

        <div className="mt-6">

          <label className="text-sm font-semibold text-[#102a43]">
            Paid By
          </label>

          <select
            name="paidBy"
            value={formData.paidBy}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              Select member
            </option>

            {group.members?.map((member) => (
              <option
                key={member.user._id}
                value={member.user._id}
              >
                {member.user.name}
              </option>
            ))}
          </select>

        </div>

        {/* SPLIT TYPE */}

        <div className="mt-6">

          <label className="text-sm font-semibold text-[#102a43]">
            Split Type
          </label>

          <select
            name="splitType"
            value={formData.splitType}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="equal">
              Equal Split
            </option>

            <option value="exact">
              Exact Amount
            </option>

            <option value="percentage">
              Percentage
            </option>
          </select>

        </div>

        {/* PARTICIPANTS */}

        <div className="mt-6">

          <div className="flex items-center justify-between">

            <label className="text-sm font-semibold text-[#102a43]">
              Participants
            </label>

            <button
              type="button"
              onClick={selectAllParticipants}
              className="text-sm font-semibold text-[#159a8c]"
            >
              Select All
            </button>

          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">

            {group.members?.map((member) => {

              const userId = member.user._id;

              const selected =
                formData.participants.includes(userId);

              return (
                <div
                  key={userId}
                  className="rounded-xl border border-slate-200 p-3"
                >

                  <label className="flex cursor-pointer items-center gap-3">

                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        handleParticipantChange(userId)
                      }
                      className="h-4 w-4 accent-[#159a8c]"
                    />

                    <div>
                      <p className="font-semibold text-[#102a43]">
                        {member.user.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {member.role}
                      </p>
                    </div>

                  </label>

                  {/* EXACT AMOUNT */}

                  {selected &&
                    formData.splitType === "exact" && (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          formData.exactAmounts[userId] ?? ""
                        }
                        onChange={(e) =>
                          handleExactAmountChange(
                            userId,
                            e.target.value
                          )
                        }
                        placeholder="Amount owed"
                        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#159a8c]"
                      />
                    )}

                  {/* PERCENTAGE */}

                  {selected &&
                    formData.splitType === "percentage" && (
                      <div className="relative mt-3">

                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={
                            formData.percentages[userId] ?? ""
                          }
                          onChange={(e) =>
                            handlePercentageChange(
                              userId,
                              e.target.value
                            )
                          }
                          placeholder="Percentage"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm outline-none focus:border-[#159a8c]"
                        />

                        <span className="absolute right-3 top-2 text-sm text-slate-400">
                          %
                        </span>

                      </div>
                    )}

                </div>
              );
            })}

          </div>

        </div>

        {/* SPLIT SUMMARY */}

        {formData.splitType === "equal" &&
          formData.participants.length > 0 &&
          Number(formData.amount) > 0 && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4">

              <p className="text-sm font-semibold text-[#102a43]">
                Equal Split
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Each participant will owe approximately{" "}
                <span className="font-semibold text-[#159a8c]">
                  {(
                    Number(formData.amount) /
                    formData.participants.length
                  ).toFixed(2)}
                </span>
              </p>

            </div>
          )}

        {/* NOTES */}

        <div className="mt-6">

          <label className="text-sm font-semibold text-[#102a43]">
            Notes
          </label>

          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Optional notes"
            rows="3"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]"
          />

        </div>

        {/* BUTTONS */}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">

          {/* DELETE */}

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="rounded-xl border border-red-500 px-5 py-3 font-semibold text-red-600 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting
              ? "Deleting..."
              : "Delete Expense"}
          </button>

          {/* RIGHT BUTTONS */}

          <div className="flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={() =>
                navigate(`/groups/${groupId}/expenses`)
              }
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || deleting}
              className="rounded-xl bg-[#159a8c] px-6 py-3 font-semibold text-white hover:bg-[#117d72] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </div>

      </form>

    </AppLayout>
  );
};

export default EditExpense;