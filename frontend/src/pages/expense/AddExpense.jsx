import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppLayout from "../../components/AppLayout";

import { createExpense } from "../../config/expense/expenseAPI";
import { getGroupById } from "../../config/group/groupAPI";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddExpense = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    currency: "",
    category: "Other",
    date: new Date().toISOString().split("T")[0],
    paidBy: "",
    splitType: "equal",
    shares: [],
    notes: "",
  });

  // =========================
  // LOAD GROUP
  // =========================

  const loadGroup = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again");
        return;
      }

      const res = await getGroupById(groupId, token);

      const groupData = res.data.group;

      setGroup(groupData);

      // ✅ Pre-select all members as participants by default
      const defaultShares = groupData.members.map((member) => ({
        user: member.user._id,
        amount: "",
        percentage: "",
      }));

      setFormData((prev) => ({
        ...prev,
        currency: groupData.baseCurrency,
        paidBy: groupData.owner?._id || "",
        shares: defaultShares,
      }));
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message ||
          "Failed to load group"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroup();
  }, [groupId]);

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
  // SPLIT TYPE CHANGE
  // =========================

   const handleSplitTypeChange = (e) => {
  const splitType = e.target.value;
  setFormData((prev) => ({
    ...prev,
    splitType,
    shares: prev.shares.map((share) => ({
      user: share.user,
      amount: "",
      percentage: "",
    })), // ✅ keeps who's selected, just clears amounts
  }));
};

  // =========================
  // MEMBER SELECTION
  // =========================

  const handleMemberSelection = (userId) => {
    setFormData((prev) => {
      const exists = prev.shares.some(
        (share) => share.user === userId
      );

      if (exists) {
        return {
          ...prev,
          shares: prev.shares.filter(
            (share) => share.user !== userId
          ),
        };
      }

      return {
        ...prev,
        shares: [
          ...prev.shares,
          {
            user: userId,
            amount: "",
            percentage: "",
          },
        ],
      };
    });
  };

  // =========================
  // SELECT ALL MEMBERS
  // =========================

  const selectAllMembers = () => {
    if (!group?.members) return;

    const shares = group.members.map((member) => ({
      user: member.user._id,
      amount: "",
      percentage: "",
    }));

    setFormData((prev) => ({
      ...prev,
      shares,
    }));
  };

  // =========================
  // REMOVE ALL MEMBERS
  // =========================

  const clearMembers = () => {
    setFormData((prev) => ({
      ...prev,
      shares: [],
    }));
  };

  // =========================
  // EXACT AMOUNT CHANGE
  // =========================

  const handleExactAmountChange = (userId, value) => {
    setFormData((prev) => ({
      ...prev,
      shares: prev.shares.map((share) =>
        share.user === userId
          ? {
              ...share,
              amount: value,
            }
          : share
      ),
    }));
  };

  // =========================
  // PERCENTAGE CHANGE
  // =========================

  const handlePercentageChange = (userId, value) => {
    setFormData((prev) => ({
      ...prev,
      shares: prev.shares.map((share) =>
        share.user === userId
          ? {
              ...share,
              percentage: value,
            }
          : share
      ),
    }));
  };

  // =========================
  // CREATE EXPENSE
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Enter expense title");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    if (!formData.paidBy) {
      toast.error("Select who paid");
      return;
    }

    if (formData.shares.length === 0) {
      toast.error("Select at least one participant");
      return;
    }

    // =========================
    // PREPARE SHARES
    // =========================

    let shares = [];

    // EQUAL
    if (formData.splitType === "equal") {
      shares = formData.shares.map((share) => ({
        user: share.user,
      }));
    }

    // EXACT
    if (formData.splitType === "exact") {
      const invalid = formData.shares.some(
        (share) =>
          share.amount === "" ||
          Number(share.amount) < 0
      );

      if (invalid) {
        toast.error("Enter an amount for every participant");
        return;
      }

      const totalShares = formData.shares.reduce(
        (sum, share) => sum + Number(share.amount),
        0
      );

      if (
        Math.round(totalShares * 100) !==
        Math.round(Number(formData.amount) * 100)
      ) {
        toast.error(
          `Exact shares must equal ${formData.currency} ${Number(
            formData.amount
          ).toFixed(2)}`
        );
        return;
      }

      shares = formData.shares.map((share) => ({
        user: share.user,
        amount: Number(share.amount),
      }));
    }

    // PERCENTAGE
    if (formData.splitType === "percentage") {
      const invalid = formData.shares.some(
        (share) =>
          share.percentage === "" ||
          Number(share.percentage) < 0
      );

      if (invalid) {
        toast.error(
          "Enter percentage for every participant"
        );
        return;
      }

      const totalPercentage = formData.shares.reduce(
        (sum, share) =>
          sum + Number(share.percentage),
        0
      );

      if (Math.round(totalPercentage * 100) / 100 !== 100) {
        toast.error("Percentages must add up to 100%");
        return;
      }

      shares = formData.shares.map((share) => ({
        user: share.user,
        percentage: Number(share.percentage),
      }));
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again");
        return;
      }

      const expenseData = {
        groupId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        amount: Number(formData.amount),
        currency: formData.currency,
        category: formData.category,
        date: formData.date,
        paidBy: formData.paidBy,
        splitType: formData.splitType,
        shares,
        notes: formData.notes.trim(),
      };

      console.log("Expense Data:", expenseData);

      await createExpense(expenseData, token);

      toast.success("Expense added successfully!");

      setTimeout(() => {
        navigate(`/groups/${groupId}/expenses`);
      }, 800);
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message ||
          "Failed to add expense"
      );
    } finally {
      setSaving(false);
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
  // GROUP NOT FOUND
  // =========================

  if (!group) {
    return (
      <AppLayout>
        <p className="py-20 text-center text-slate-500">
          Group not found
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
          Add Expense
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Add and split a new expense with your group
          members.
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
              min="0"
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

        {/* CATEGORY + DATE + CURRENCY */}

        <div className="mt-5 grid gap-5 sm:grid-cols-3">

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

          <div>

            <label className="text-sm font-semibold text-[#102a43]">
              Currency
            </label>

            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-slate-300 py-3 px-4"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>

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
            Split Expense
          </label>

          <select
            value={formData.splitType}
            onChange={handleSplitTypeChange}
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

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>

              <label className="text-sm font-semibold text-[#102a43]">
                Participants
              </label>

              <p className="mt-1 text-xs text-slate-500">
                Select members who share this expense.
              </p>

            </div>

            <div className="flex gap-3">

              <button
                type="button"
                onClick={selectAllMembers}
                className="text-sm font-semibold text-[#159a8c]"
              >
                Select All
              </button>

              <button
                type="button"
                onClick={clearMembers}
                className="text-sm font-semibold text-red-500"
              >
                Clear
              </button>

            </div>

          </div>

          <div className="mt-3 space-y-3">

            {group.members?.map((member) => {

              const userId = member.user._id;

              const selected = formData.shares.some(
                (share) => share.user === userId
              );

              const selectedShare =
                formData.shares.find(
                  (share) => share.user === userId
                );

              return (
                <div
                  key={userId}
                  className={`rounded-xl border p-4 transition ${
                    selected
                      ? "border-[#159a8c] bg-slate-50"
                      : "border-slate-200"
                  }`}
                >

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    {/* MEMBER */}

                    <label className="flex cursor-pointer items-center gap-3">

                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          handleMemberSelection(userId)
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

                    {/* EXACT */}

                    {selected &&
                      formData.splitType === "exact" && (
                        <div className="w-full sm:w-40">

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              selectedShare?.amount || ""
                            }
                            onChange={(e) =>
                              handleExactAmountChange(
                                userId,
                                e.target.value
                              )
                            }
                            placeholder="Amount"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-[#159a8c]"
                          />

                        </div>
                      )}

                    {/* PERCENTAGE */}

                    {selected &&
                      formData.splitType ===
                        "percentage" && (
                        <div className="relative w-full sm:w-40">

                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={
                              selectedShare?.percentage ||
                              ""
                            }
                            onChange={(e) =>
                              handlePercentageChange(
                                userId,
                                e.target.value
                              )
                            }
                            placeholder="Percentage"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-8 outline-none focus:border-[#159a8c]"
                          />

                          <span className="absolute right-3 top-2 text-slate-400">
                            %
                          </span>

                        </div>
                      )}

                  </div>

                </div>
              );
            })}

          </div>

          {/* SPLIT SUMMARY */}

          {formData.shares.length > 0 && (
            <div className="mt-4 rounded-xl bg-slate-50 p-4">

              <p className="text-sm font-semibold text-[#102a43]">
                Split Summary
              </p>

              {formData.splitType === "equal" && (
                <p className="mt-1 text-sm text-slate-500">
                  {formData.shares.length} participant
                  {formData.shares.length !== 1
                    ? "s"
                    : ""}{" "}
                  will split the expense equally.
                </p>
              )}

              {formData.splitType === "exact" && (
                <p className="mt-1 text-sm text-slate-500">
                  Total entered:{" "}
                  <span className="font-semibold">
                    {formData.currency}{" "}
                    {formData.shares
                      .reduce(
                        (sum, share) =>
                          sum + Number(share.amount || 0),
                        0
                      )
                      .toFixed(2)}
                  </span>{" "}
                  / {formData.currency}{" "}
                  {Number(formData.amount || 0).toFixed(2)}
                </p>
              )}

              {formData.splitType === "percentage" && (
                <p className="mt-1 text-sm text-slate-500">
                  Total percentage:{" "}
                  <span className="font-semibold">
                    {formData.shares
                      .reduce(
                        (sum, share) =>
                          sum +
                          Number(
                            share.percentage || 0
                          ),
                        0
                      )
                      .toFixed(2)}
                    %
                  </span>
                </p>
              )}

            </div>
          )}

        </div>

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

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

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
            disabled={saving}
            className="rounded-xl bg-[#159a8c] px-6 py-3 font-semibold text-white hover:bg-[#117d72] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Adding..." : "Add Expense"}
          </button>

        </div>

      </form>

    </AppLayout>
  );
};

export default AddExpense;