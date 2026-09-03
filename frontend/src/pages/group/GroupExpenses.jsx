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
        err.response?.data?.message ||
          "Failed to load expenses"
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
        err.response?.data?.message ||
          "Failed to delete expense"
      );
    }
  };

  useEffect(() => {
    loadData();
  }, [groupId]);

  // =========================
  // TOTAL EXPENSE
  // =========================

  const totalExpense = expenses.reduce(
    (total, expense) =>
      total + Number(expense.amount || 0),
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
      balances[payerId].balance += Number(
        expense.amount || 0
      );

      balances[payerId].totalPaid += Number(
        expense.amount || 0
      );

      // Process each person's share
      expense.shares?.forEach((share) => {
        const userId = String(
          share.user?._id || share.user
        );

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

        // Subtract their share from net balance
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
      if (
        !expense.paidBy ||
        !expense.shares?.length
      ) {
        return;
      }

      const payer = expense.paidBy;

      expense.shares.forEach((share) => {
        if (!share.user) return;

        // Don't create:
        // Tousif should receive ₹500 from Tousif
        if (
          String(share.user._id) ===
          String(payer._id)
        ) {
          return;
        }

        const receiverId = String(payer._id);
        const senderId = String(share.user._id);

        const key = `${receiverId}-${senderId}`;

        if (!settlements[key]) {
          settlements[key] = {
            receiver: payer.name,
            sender: share.user.name,
            amount: 0,
            currency:
              expense.currency ||
              group.baseCurrency,
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
  // GROUP SETTLEMENTS BY RECEIVER
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

      {/* =========================
          BACK
      ========================= */}

      <button
        onClick={() => navigate(`/groups`)}
        className="mb-5 text-sm font-semibold text-[#159a8c]"
      >
        ← Back to Groups
      </button>

      {/* =========================
          HEADER
      ========================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">
            Expenses
          </p>

          <h1 className="text-3xl font-bold text-[#102a43]">
            {group.name}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {group.description ||
              "Track your group expenses"}
          </p>
        </div>

        <button
          onClick={() =>
            navigate(
              `/groups/${groupId}/expenses/add`
            )
          }
          className="rounded-xl bg-[#159a8c] px-5 py-3 font-semibold text-white hover:bg-[#117d72]"
        >
          + Add Expense
        </button>

      </div>

      {/* =========================
          MEMBER BALANCES
      ========================= */}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-5">
          <h2 className="text-xl font-bold text-[#102a43]">
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

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
                  key={member.user._id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >

                  {/* USER */}

                  <div className="flex items-center gap-3">

                    {member.user.profileImage ? (

                      <img
                        src={member.user.profileImage}
                        alt={member.user.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />

                    ) : (

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#159a8c]/10 font-bold text-[#159a8c]">
                        {member.user.name
                          ?.charAt(0)
                          ?.toUpperCase() || "U"}
                      </div>

                    )}

                    <div>

                      <p className="font-bold text-[#102a43]">
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

                  <div className="mt-4 flex items-center justify-between">

                    <span className="text-sm font-medium text-slate-500">
                      Balance
                    </span>

                    <span
                      className={`text-lg font-bold ${
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

                  <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">

                    <span className="text-xs font-medium text-slate-400">
                      Total Paid
                    </span>

                    <span className="text-sm font-semibold text-slate-600">
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

      </div>

      {/* =========================
          TOTAL EXPENSE
      ========================= */}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <p className="text-sm text-slate-500">
          Total Expenses
        </p>

        <p className="mt-1 text-3xl font-bold text-[#102a43]">
          {group.baseCurrency}{" "}
          {totalExpense.toFixed(2)}
        </p>

      </div>

      {/* =========================
          OVERALL SETTLEMENT
      ========================= */}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-5">

          <h2 className="text-xl font-bold text-[#102a43]">
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

            {Object.entries(
              groupedSettlements
            ).map(
              ([receiver, settlements]) => (

                <div
                  key={receiver}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >

                  {/* RECEIVER */}

                  <p className="mb-3 font-bold text-[#102a43]">
                    {receiver} should receive
                  </p>

                  {/* PEOPLE WHO OWE */}

                  <div className="space-y-2">

                    {settlements.map(
                      (settlement, index) => (

                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                        >

                          <p className="text-sm text-slate-600">

                            from{" "}

                            <span className="font-semibold text-[#102a43]">
                              {settlement.sender}
                            </span>

                          </p>

                          <span className="font-bold text-[#159a8c]">

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

      </div>

      {/* =========================
          EXPENSE LIST
      ========================= */}

      <div className="mt-6">

        <h2 className="mb-4 text-xl font-bold text-[#102a43]">
          All Expenses
        </h2>

        {expenses.length === 0 ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

            <p className="text-slate-500">
              No expenses added yet.
            </p>

            <button
              onClick={() =>
                navigate(
                  `/groups/${groupId}/expenses/add`
                )
              }
              className="mt-4 rounded-xl bg-[#159a8c] px-5 py-2 font-semibold text-white"
            >
              Add First Expense
            </button>

          </div>

        ) : (

          <div className="space-y-5">

            {expenses.map((expense) => (

              <div
                key={expense._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >

                {/* TOP SECTION */}

                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                  {/* EXPENSE DETAILS */}

                  <div className="flex-1">

                    <h3 className="text-lg font-bold text-[#102a43]">
                      {expense.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
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

                        <div className="mt-3 space-y-1">

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
                                className="text-sm text-slate-500"
                              >

                                <span className="font-semibold text-[#102a43]">
                                  {expense.paidBy.name}
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

                  {/* AMOUNT */}

                  <div className="text-left lg:text-right">

                    <p className="text-2xl font-bold text-[#159a8c]">

                      {expense.currency ||
                        group.baseCurrency}{" "}

                      {Number(
                        expense.amount
                      ).toFixed(2)}

                    </p>

                    <span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {expense.category || "Other"}
                    </span>

                  </div>

                </div>

                {/* SPLIT DETAILS */}

                <div className="mt-5 rounded-xl bg-slate-50 p-4">

                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                    <h4 className="font-bold text-[#102a43]">
                      Split Details
                    </h4>

                    <span className="w-fit rounded-full bg-[#159a8c]/10 px-3 py-1 text-xs font-semibold capitalize text-[#159a8c]">
                      {expense.splitType ||
                        "Unknown"}{" "}
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
                            className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >

                            {/* USER */}

                            <div>

                              <p className="font-semibold text-[#102a43]">
                                {share.user?.name ||
                                  "Unknown User"}
                              </p>

                            </div>

                            {/* SHARE */}

                            <div className="flex items-center gap-3">

                              {share.percentage !==
                                undefined &&
                                share.percentage !==
                                  null && (

                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
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

                {/* ACTION BUTTONS */}

                <div className="mt-5 flex flex-col gap-3 border-t border-slate-300 pt-4 sm:flex-row sm:items-center sm:justify-between">

                  <div className="min-w-0">

                    {expense.notes?.length > 0 && (

                      <p className="text-sm text-slate-500">

                        <span className="font-semibold text-[#102a43]">
                          Notes:
                        </span>{" "}

                        <span className="break-words">
                          {expense.notes}
                        </span>

                      </p>

                    )}

                  </div>

                  <div className="flex flex-row gap-3 sm:shrink-0">

                    <button
                      onClick={() =>
                        navigate(
                          `/groups/${groupId}/expenses/${expense._id}/edit`
                        )
                      }
                      className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:flex-initial"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteExpense(
                          expense._id
                        )
                      }
                      className="flex-1 rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-500 hover:text-white sm:flex-initial"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </AppLayout>
  );
};

export default GroupExpenses; 