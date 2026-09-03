 
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppLayout from "../../components/AppLayout";
import {
  getGroupExpenses,
  deleteExpense,
} from "../../config/expense/expenseAPI";
import { getGroupById } from "../../config/group/groupAPI";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const GroupExpenses = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected receipt for large preview modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // =========================
  // LOAD GROUP + EXPENSES
  // =========================

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again");
        return;
      }

      const [groupRes, expenseRes] = await Promise.all([
        getGroupById(groupId, token),
        getGroupExpenses(groupId, token),
      ]);

      setGroup(groupRes.data.group);
      setExpenses(expenseRes.data.expenses || []);
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message || "Failed to load expenses"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DELETE EXPENSE
  // =========================

  const handleDeleteExpense = async (expenseId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again");
        return;
      }

      await deleteExpense(expenseId, token);

      toast.success("Expense deleted successfully!");

      await loadData();
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message || "Failed to delete expense"
      );
    }
  };

  // =========================
  // EDIT RECEIPT
  // =========================

  const handleEditReceipt = (expense) => {
    navigate(`/groups/${groupId}/expenses/${expense._id}/edit`);
  };

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    loadData();
  }, [groupId]);

  // =========================
  // TOTAL EXPENSE
  // =========================

  const totalExpense = expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  // =========================
  // CALCULATE MEMBER BALANCES
  // =========================

  const calculateBalances = () => {
    if (!group?.members?.length) return [];

    const balances = {};

    // Seed with current members
    group.members.forEach((member) => {
      const userId = String(member.user?._id);

      if (!userId || userId === "undefined") return;

      balances[userId] = {
        user: member.user,
        balance: 0,
        totalPaid: 0,
        totalSpent: 0,
      };
    });

    expenses.forEach((expense) => {
      const payerId = String(
        expense.paidBy?._id || expense.paidBy
      );

      if (!payerId || payerId === "undefined") return;

      // Add removed payer if necessary
      if (!balances[payerId]) {
        balances[payerId] = {
          user: expense.paidBy?.name
            ? expense.paidBy
            : {
                _id: payerId,
                name: "Removed User",
              },
          balance: 0,
          totalPaid: 0,
          totalSpent: 0,
        };
      }

      // Payer fronted this amount
      balances[payerId].balance += Number(expense.amount || 0);

      balances[payerId].totalPaid += Number(expense.amount || 0);

      // Process shares
      expense.shares?.forEach((share) => {
        const userId = String(
          share.user?._id || share.user
        );

        if (!userId || userId === "undefined") return;

        if (!balances[userId]) {
          balances[userId] = {
            user: share.user?.name
              ? share.user
              : {
                  _id: userId,
                  name: "Removed User",
                },
            balance: 0,
            totalPaid: 0,
            totalSpent: 0,
          };
        }

        // Subtract their share
        balances[userId].balance -= Number(
          share.amount || 0
        );

        // Track personal spending
        balances[userId].totalSpent += Number(
          share.amount || 0
        );
      });
    });

    return Object.values(balances);
  };

  const memberBalances = calculateBalances();

  // =========================
  // CALCULATE OVERALL SETTLEMENT
  // =========================

  const calculateOverallSettlements = () => {
    const settlements = {};

    expenses.forEach((expense) => {
      if (!expense.paidBy || !expense.shares?.length) {
        return;
      }

      const payer = expense.paidBy;

      expense.shares.forEach((share) => {
        if (!share.user) return;

        // Don't create:
        // Tousif should receive ₹500 from Tousif
        if (
          String(share.user?._id || share.user) !==
String(expense.paidBy?._id || expense.paidBy)
        ) {
          return;
        }

        const receiverId = String(payer._id || payer);
const senderId = String(share.user._id || share.user);

        const key = `${receiverId}-${senderId}`;

        if (!settlements[key]) {
          settlements[key] = {
             receiver: payer.name || "Unknown User",
          sender: share.user.name || "Unknown User",
            amount: 0,
            currency:
              expense.currency || group.baseCurrency,
          };
        }

        settlements[key].amount += Number(
          share.amount || 0
        );
      });
    });

    return Object.values(settlements);
  };

  const overallSettlements =
    calculateOverallSettlements();

  // =========================
  // GROUP SETTLEMENTS
  // =========================

  const groupedSettlements = {};

  overallSettlements.forEach((settlement) => {
    if (!groupedSettlements[settlement.receiver]) {
      groupedSettlements[settlement.receiver] = [];
    }

    groupedSettlements[settlement.receiver].push(
      settlement
    );
  });

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#159a8c]" />
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
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <p className="text-center text-slate-500">
            Group not found
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full min-w-0">
        {/* =========================
            BACK
        ========================= */}

        <button
          type="button"
          onClick={() => navigate("/groups")}
          className="mb-5 inline-flex items-center text-sm font-semibold text-[#159a8c] transition hover:text-[#117d72]"
        >
          ← Back to Groups
        </button>

        {/* =========================
            HEADER
        ========================= */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#159a8c] sm:text-sm">
              Expenses
            </p>

            <h1 className="mt-1 break-words text-2xl font-bold text-[#102a43] sm:text-3xl">
              {group.name}
            </h1>

            <p className="mt-2 max-w-2xl break-words text-sm text-slate-500">
              {group.description ||
                "Track your group expenses"}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/groups/${groupId}/expenses/add`
              )
            }
            className="w-full shrink-0 rounded-xl bg-[#159a8c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#117d72] sm:w-auto"
          >
            + Add Expense
          </button>
        </div>

        {/* =========================
            MEMBER BALANCES
        ========================= */}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#102a43] sm:text-xl">
              Member Balances
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              See who owes money and who should receive money.
            </p>
          </div>

          {memberBalances.length === 0 ? (
            <p className="text-sm text-slate-500">
              No members found.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {memberBalances.map((member) => {
                const balance = Number(
                  member.balance || 0
                );

                const roundedBalance =
                  Math.abs(balance) < 0.01
                    ? 0
                    : balance;

                return (
                  <div
                    key={member.user?._id || member.user}
                    className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    {/* USER */}

                    <div className="flex min-w-0 items-center gap-3">
                      {member.user.profileImage ? (
                        <img
                          src={member.user.profileImage}
                          alt={member.user.name}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#159a8c]/10 font-bold text-[#159a8c]">
                          {member.user.name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#102a43]">
                          {member.user.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {roundedBalance > 0
                            ? "Should receive"
                            : roundedBalance < 0
                            ? "Owes"
                            : "Settled"}
                        </p>
                      </div>
                    </div>

                    {/* BALANCE */}

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-500">
                        Balance
                      </span>

                      <span
                        className={`text-right text-base font-bold sm:text-lg ${
                          roundedBalance > 0
                            ? "text-green-600"
                            : roundedBalance < 0
                            ? "text-red-600"
                            : "text-slate-500"
                        }`}
                      >
                        {roundedBalance > 0
                          ? "+"
                          : roundedBalance < 0
                          ? "-"
                          : ""}

                        {group.baseCurrency}{" "}
                        {Math.abs(
                          roundedBalance
                        ).toFixed(2)}
                      </span>
                    </div>

                    {/* TOTAL PAID */}

                    <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
                      <span className="text-xs font-medium text-slate-400">
                        Total Paid
                      </span>

                      <span className="text-right text-sm font-semibold text-slate-600">
                        {group.baseCurrency}{" "}
                        {Number(
                          member.totalPaid || 0
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =========================
            TOTAL EXPENSE
        ========================= */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm text-slate-500">
            Total Expenses
          </p>

          <p className="mt-1 break-words text-2xl font-bold text-[#102a43] sm:text-3xl">
            {group.baseCurrency}{" "}
            {totalExpense.toFixed(2)}
          </p>
        </section>

        {/* =========================
            OVERALL SETTLEMENT
        ========================= */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#102a43] sm:text-xl">
              Overall Settlement
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              See who should receive money and who they should receive it from.
            </p>
          </div>

          {Object.keys(groupedSettlements).length === 0 ? (
            <div className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
              ✓ Everyone is settled.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedSettlements).map(
                ([receiver, settlements]) => (
                  <div
                    key={receiver}
                    className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4"
                  >
                    {/* RECEIVER */}

                    <p className="mb-3 break-words font-bold text-[#102a43]">
                      {receiver} should receive
                    </p>

                    {/* PEOPLE WHO OWE */}

                    <div className="space-y-2">
                      {settlements.map(
                        (settlement, index) => (
                          <div
                            key={index}
                            className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                          >
                            <p className="min-w-0 break-words text-sm text-slate-600">
                              from{" "}
                              <span className="font-semibold text-[#102a43]">
                                {settlement.sender}
                              </span>
                            </p>

                            <span className="shrink-0 font-bold text-[#159a8c]">
                              {settlement.currency}{" "}
                              {Number(
                                settlement.amount || 0
                              ).toFixed(2)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* =========================
            EXPENSE LIST
        ========================= */}

        <section className="mt-6">
          <h2 className="mb-4 text-lg font-bold text-[#102a43] sm:text-xl">
            All Expenses
          </h2>

          {expenses.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
              <p className="text-sm text-slate-500">
                No expenses added yet.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/groups/${groupId}/expenses/add`
                  )
                }
                className="mt-4 rounded-xl bg-[#159a8c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117d72]"
              >
                Add First Expense
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {expenses.map((expense) => (
                <article
                  key={expense._id}
                  className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  {/* =========================
                      TOP SECTION
                  ========================= */}

                  <div className="flex flex-col gap-6">
                    {/* DETAILS + RECEIPT */}

                    <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                      {/* DETAILS */}

                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-bold text-[#102a43]">
                          {expense.title}
                        </h3>

                        <p className="mt-1 break-words text-sm text-slate-500">
                          {expense.description ||
                            "No description"}
                        </p>

                        <p className="mt-3 text-sm text-slate-500">
                          Paid by{" "}
                          <span className="font-semibold text-[#102a43]">
                            {expense.paidBy?.name ||
                              "Unknown"}
                          </span>
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {expense.date
                            ? new Date(
                                expense.date
                              ).toLocaleDateString()
                            : "No date"}
                        </p>

                        {/* EXPENSE SETTLEMENT */}

                        {expense.shares?.length > 0 &&
                          expense.paidBy && (
                            <div className="mt-3 space-y-1.5">
                              {expense.shares
                                .filter(
                                  (share) =>
                                    share.user?._id &&
                                    String(
                                      share.user._id
                                    ) !==
                                      String(
                                        expense.paidBy._id
                                      )
                                )
                                .map((share) => (
                                  <p
                                    key={
                                      share._id ||
                                      share.user._id
                                    }
                                    className="break-words text-sm leading-6 text-slate-500"
                                  >
                                    <span className="font-semibold text-[#102a43]">
                                      {
                                        expense.paidBy
                                          .name
                                      }
                                    </span>{" "}
                                    should receive{" "}
                                    <span className="font-semibold text-[#159a8c]">
                                      {expense.currency ||
                                        group.baseCurrency}{" "}
                                      {Number(
                                        share.amount || 0
                                      ).toFixed(2)}
                                    </span>{" "}
                                    from{" "}
                                    <span className="font-semibold text-[#102a43]">
                                      {share.user.name}
                                    </span>
                                  </p>
                                ))}
                            </div>
                          )}
                      </div>

                      {/* RECEIPT */}
 {/* RECEIPT */}
<div className="flex w-full flex-col items-start gap-2 md:w-32 md:items-center">

  {expense.receiptUrl ? (
    <>
      {/* RECEIPT IMAGE */}
      <button
        type="button"
        onClick={() =>
          setSelectedReceipt(expense.receiptUrl)
        }
        className="group relative h-28 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:h-32 md:h-24 md:w-32"
        title="View receipt"
      >
        <img
          src={expense.receiptUrl}
          alt="Expense receipt"
          className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
        /> 
      </button>

      {/* RECEIPT ACTIONS */}
      <div className="flex w-full gap-2 md:w-auto">

        {/* VIEW */}
        <button
          type="button"
          onClick={() =>
            setSelectedReceipt(expense.receiptUrl)
          }
          className="flex flex-1 items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200 md:flex-none"
          title="View receipt"
        >
          👁️
          <span className="ml-1 hidden sm:inline">
            View
          </span>
        </button>

        {/* EDIT */}
        <button
          type="button"
          onClick={() =>
            handleEditReceipt(expense)
          }
          className="flex flex-1 items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200 md:flex-none"
          title="Edit receipt"
        >
          ✏️
          <span className="ml-1 hidden sm:inline">
            Edit
          </span>
        </button>

      </div>
    </>
  ) : (
    /* NO RECEIPT */
    <button
      type="button"
      onClick={() =>
        handleEditReceipt(expense)
      }
      className="flex h-28 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-[#159a8c] hover:bg-[#159a8c]/5 hover:text-[#159a8c] sm:h-32 md:h-24 md:w-32"
      title="Add receipt"
    >
      <span className="text-2xl">＋</span>
      <span className="mt-1 text-xs font-semibold">
        Add Image
      </span>
    </button>
  )}

</div> 

                    </div>

                    {/* =========================
                        AMOUNT
                    ========================= */}

                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Amount
                        </p>

                        <p className="mt-1 text-2xl font-bold text-[#159a8c]">
                          {expense.currency ||
                            group.baseCurrency}{" "}
                          {Number(
                            expense.amount || 0
                          ).toFixed(2)}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                        {expense.category || "Other"}
                      </span>
                    </div>
                  </div>

                  {/* =========================
                      SPLIT DETAILS
                  ========================= */}

                  <div className="mt-5 rounded-xl bg-slate-50 p-3 sm:p-4">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h4 className="font-bold text-[#102a43]">
                        Split Details
                      </h4>

                      <span className="w-fit rounded-full bg-[#159a8c]/10 px-3 py-1 text-xs font-semibold capitalize text-[#159a8c]">
                        {expense.splitType || "Unknown"}{" "}
                        Split
                      </span>
                    </div>

                    {expense.shares?.length > 0 ? (
                      <div className="space-y-2">
                        {expense.shares.map(
                          (share) => (
                            <div
                              key={
                                share._id ||
                                share.user?._id
                              }
                              className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                            >
                              {/* USER */}

                              <div className="min-w-0">
                                <p className="break-words font-semibold text-[#102a43]">
                                  {share.user?.name ||
                                    "Unknown User"}
                                </p>
                              </div>

                              {/* SHARE */}

                              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                                {share.percentage !==
                                  undefined &&
                                  share.percentage !==
                                    null && (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                      {
                                        share.percentage
                                      }
                                      %
                                    </span>
                                  )}

                                <span className="font-bold text-[#159a8c]">
                                  {expense.currency ||
                                    group.baseCurrency}{" "}
                                  {Number(
                                    share.amount || 0
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No split details available.
                      </p>
                    )}
                  </div>

                  {/* =========================
                      ACTION BUTTONS
                  ========================= */}

                  <div className="mt-5 flex flex-col gap-4 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* NOTES */}

                    <div className="min-w-0 flex-1">
                      {expense.notes?.length > 0 && (
                        <p className="break-words text-sm leading-6 text-slate-500">
                          <span className="font-semibold text-[#102a43]">
                            Notes:
                          </span>{" "}
                          {expense.notes}
                        </p>
                      )}
                    </div>

                    {/* ACTIONS */}

                    <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:flex sm:flex-row">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/groups/${groupId}/expenses/${expense._id}/edit`
                          )
                        }
                        className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteExpense(
                            expense._id
                          )
                        }
                        className="rounded-lg border border-red-500 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-500 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* =========================
          RECEIPT MODAL
      ========================= */}

      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="relative flex max-h-[95vh] w-full max-w-4xl items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-2xl sm:p-3"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* CLOSE BUTTON */}

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

            {/* RECEIPT IMAGE */}

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

export default GroupExpenses;
 