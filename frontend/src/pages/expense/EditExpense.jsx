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

  // Receipt states
  const [newReceipt, setNewReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

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
        err.response?.data?.message || "Failed to load expense"
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
  (member) => member.user?._id || member.user
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
  // RECEIPT CHANGE
  // =========================

  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Receipt image must be less than 5MB");
      e.target.value = "";
      return;
    }

    setNewReceipt(file);

    const previewUrl = URL.createObjectURL(file);
    setReceiptPreview(previewUrl);
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

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    if (!formData.paidBy) {
      toast.error("Select who paid");
      return;
    }

    if (
      formData.splitType !== "fullPayment" &&
      formData.participants.length === 0
    ) {
      toast.error("Select at least one participant");
      return;
    }

    // =========================
    // VALIDATE EXACT SPLIT
    // =========================

    if (formData.splitType === "exact") {
      const totalExact = formData.participants.reduce(
        (total, userId) =>
          total +
          Number(formData.exactAmounts[userId] || 0),
        0
      );

      if (
        Math.round(totalExact * 100) !==
        Math.round(Number(formData.amount) * 100)
      ) {
        toast.error(
          "Exact split amounts must add up to the total"
        );
        return;
      }
    }

    // =========================
    // VALIDATE PERCENTAGE
    // =========================

    if (formData.splitType === "percentage") {
      const totalPercentage = formData.participants.reduce(
        (total, userId) =>
          total +
          Number(formData.percentages[userId] || 0),
        0
      );

      if (Math.round(totalPercentage * 100) !== 10000) {
        toast.error("Percentages must add up to 100%");
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

      // =========================
      // FORM DATA
      // =========================

      const expenseData = new FormData();

      expenseData.append(
        "title",
        formData.title.trim()
      );

      expenseData.append(
        "description",
        formData.description.trim()
      );

      expenseData.append(
        "amount",
        Number(formData.amount)
      );

      expenseData.append(
        "category",
        formData.category
      );

      expenseData.append(
        "date",
        formData.date
      );

      expenseData.append(
        "paidBy",
        formData.paidBy
      );

      expenseData.append(
        "splitType",
        formData.splitType
      );

      expenseData.append(
        "shares",
        JSON.stringify(shares)
      );

      expenseData.append(
        "notes",
        formData.notes.trim()
      );

      // Add new receipt only if user selected one
      if (newReceipt) {
        expenseData.append(
  "receiptPhoto",
  newReceipt
);
      }

      await updateExpense(
        expenseId,
        expenseData,
        token
      );

      toast.success(
        "Expense updated successfully!"
      );

      setTimeout(() => {
        navigate(
          `/groups/${groupId}/expenses`
        );
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

      await deleteExpense(
        expenseId,
        token
      );

      toast.success(
        "Expense deleted successfully!"
      );

      setTimeout(() => {
        navigate(
          `/groups/${groupId}/expenses`
        );
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
          navigate(
            `/groups/${groupId}/expenses`
          )
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
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
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
                key={member.user?._id || member.user}
  value={member.user?._id || member.user}
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

            <option value="fullPayment">
              Full Payment
            </option>
          </select>

        </div>

        {/* PARTICIPANTS */}

        {formData.splitType !== "fullPayment" && (
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

               const userId = member.user?._id || member.user;

                const selected =
                  formData.participants.includes(
                    userId
                  );

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
                          handleParticipantChange(
                            userId
                          )
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
                            formData.exactAmounts[
                              userId
                            ] ?? ""
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
                      formData.splitType ===
                        "percentage" && (
                        <div className="relative mt-3">

                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={
                              formData.percentages[
                                userId
                              ] ?? ""
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
        )}

        {/* FULL PAYMENT SUMMARY */}

        {formData.splitType ===
          "fullPayment" &&
          Number(formData.amount) > 0 && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4">

              <p className="text-sm font-semibold text-[#102a43]">
                Full Payment
              </p>

              <p className="mt-1 text-sm text-slate-500">

                <span className="font-semibold text-[#159a8c]">
                  {group.members?.find(
                    (member) =>
  String(member.user?._id || member.user) ===
  String(formData.paidBy)
                  )?.user.name ||
                    "Selected member"}
                </span>{" "}

                paid the full{" "}

                <span className="font-semibold">
                  {Number(
                    formData.amount
                  ).toFixed(2)}
                </span>{" "}

                amount.

              </p>

            </div>
          )}

        {/* EQUAL SPLIT SUMMARY */}

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

        {/* =========================
            RECEIPT IMAGE
        ========================= */}

        <div className="mt-6">

          <label className="text-sm font-semibold text-[#102a43]">
            Receipt Image
          </label>

          <p className="mt-1 text-xs text-slate-500">
            Upload a new receipt image to replace the current one.
          </p>

          <div className="mt-3">

            {/* NEW RECEIPT SELECTED */}

            {newReceipt && receiptPreview ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">

                <div className="relative">

                  <img
                    src={receiptPreview}
                    alt="New receipt preview"
                    className="h-56 w-full object-contain bg-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setNewReceipt(null);

                      if (receiptPreview) {
                        URL.revokeObjectURL(
                          receiptPreview
                        );
                      }

                      setReceiptPreview(null);
                    }}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-xl text-white hover:bg-black"
                    title="Remove selected image"
                  >
                    ×
                  </button>

                </div>

                <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#102a43]">
                      {newReceipt.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      New receipt selected
                    </p>
                  </div>

                  <label
                    htmlFor="receiptUrl"
                    className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Change Image

                    <input
                      id="receiptUrl"
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptChange}
                      className="hidden"
                    />
                  </label>

                </div>

              </div>
            ) : expense.receiptUrl ? (

              /* EXISTING RECEIPT */

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">

                <div className="relative">

                  <img
                    src={expense.receiptUrl}
                    alt="Current expense receipt"
                    className="h-56 w-full object-contain bg-slate-100"
                  />

                  {/* EYE BUTTON */}

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedReceipt(
                        expense.receiptUrl
                      )
                    }
                    className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-lg text-white shadow-lg hover:bg-black"
                    title="View receipt"
                  >
                    👁
                  </button>

                </div>

                <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <p className="text-sm font-semibold text-[#102a43]">
                      Current Receipt
                    </p>

                    <p className="text-xs text-slate-500">
                      Select a new image below to replace it.
                    </p>
                  </div>

                  <label
                    htmlFor="receiptUrl"
                    className="cursor-pointer rounded-lg border border-[#159a8c] px-4 py-2 text-center text-sm font-semibold text-[#159a8c] hover:bg-[#159a8c]/5"
                  >
                    Change Image

                    <input
                      id="receiptUrl"
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptChange}
                      className="hidden"
                    />
                  </label>

                </div>

              </div>

            ) : (

              /* NO RECEIPT */

              <label
                htmlFor="receiptUrl"
                className="flex min-h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-[#159a8c] hover:bg-[#159a8c]/5"
              >

                <span className="text-4xl text-slate-400">
                  ＋
                </span>

                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Add Receipt Image
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  PNG, JPG, JPEG up to 5MB
                </p>

                <input
                  id="receiptUrl"
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptChange}
                  className="hidden"
                />

              </label>
            )}

          </div>
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
                navigate(
                  `/groups/${groupId}/expenses`
                )
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

      {/* =========================
          RECEIPT VIEW MODAL
      ========================= */}

      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5"
          onClick={() =>
            setSelectedReceipt(null)
          }
        >

          <div
            className="relative flex max-h-[95vh] w-full max-w-4xl items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-2xl sm:p-3"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* CLOSE */}

            <button
              type="button"
              onClick={() =>
                setSelectedReceipt(null)
              }
              className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-xl text-white transition hover:bg-black"
              title="Close"
            >
              ×
            </button>

            <img
              src={selectedReceipt}
              alt="Expense receipt large preview"
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
            />

          </div>

        </div>
      )}

    </AppLayout>
  );
};

export default EditExpense; 