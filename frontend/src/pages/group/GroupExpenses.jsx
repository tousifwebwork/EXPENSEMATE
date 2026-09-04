import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AppLayout from '../../components/AppLayout'
import {
  getGroupExpenses,
  deleteExpense,
} from '../../config/expense/expenseAPI'
import { getGroupById } from '../../config/group/groupAPI'

import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import {
  ArrowLeft,
  Plus,
  Receipt,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  Eye,
  Edit3,
  Trash2,
  Image as ImageIcon,
  X,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Wallet,
  FileText,
} from 'lucide-react'
import { motion } from 'framer-motion'

const GroupExpenses = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()

  const [group, setGroup] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReceipt, setSelectedReceipt] = useState(null)

  // =========================
  // LOAD GROUP + EXPENSES
  // =========================
  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please login again')
        return
      }

      const [groupRes, expenseRes] = await Promise.all([
        getGroupById(groupId, token),
        getGroupExpenses(groupId, token),
      ])

      setGroup(groupRes.data.group)
      setExpenses(expenseRes.data.expenses || [])
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  // =========================
  // DELETE EXPENSE
  // =========================
  const handleDeleteExpense = async (expenseId, expenseTitle) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${expenseTitle}"? This action cannot be undone.`
    )
    if (!confirmDelete) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please login again')
        return
      }

      await deleteExpense(expenseId, token)
      toast.success('Expense deleted successfully!')
      await loadData()
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to delete expense')
    }
  }

  // =========================
  // EDIT RECEIPT
  // =========================
  const handleEditReceipt = (expense) => {
    navigate(`/groups/${groupId}/expenses/${expense._id}/edit`)
  }

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    loadData()
  }, [groupId])

  // =========================
  // TOTAL EXPENSE
  // =========================
  const totalExpense = expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  )

  // =========================
  // CALCULATE MEMBER BALANCES
  // =========================
  const calculateBalances = () => {
    if (!group?.members?.length) return []

    const balances = {}

    // Seed with current members
    group.members.forEach((member) => {
      const userId = String(member.user?._id)
      if (!userId || userId === 'undefined') return

      balances[userId] = {
        user: member.user,
        balance: 0,
        totalPaid: 0,
        totalSpent: 0,
      }
    })

    expenses.forEach((expense) => {
      const payerId = String(expense.paidBy?._id || expense.paidBy)
      if (!payerId || payerId === 'undefined') return

      // Add removed payer if necessary
      if (!balances[payerId]) {
        balances[payerId] = {
          user: expense.paidBy?.name
            ? expense.paidBy
            : { _id: payerId, name: 'Removed User' },
          balance: 0,
          totalPaid: 0,
          totalSpent: 0,
        }
      }

      balances[payerId].balance += Number(expense.amount || 0)
      balances[payerId].totalPaid += Number(expense.amount || 0)

      // Process shares
      expense.shares?.forEach((share) => {
        const userId = String(share.user?._id || share.user)
        if (!userId || userId === 'undefined') return

        if (!balances[userId]) {
          balances[userId] = {
            user: share.user?.name
              ? share.user
              : { _id: userId, name: 'Removed User' },
            balance: 0,
            totalPaid: 0,
            totalSpent: 0,
          }
        }

        balances[userId].balance -= Number(share.amount || 0)
        balances[userId].totalSpent += Number(share.amount || 0)
      })
    })

    return Object.values(balances)
  }

  const memberBalances = calculateBalances()

  // =========================
  // CALCULATE OVERALL SETTLEMENT
  // =========================
  const calculateOverallSettlements = () => {
    const settlements = {}

    expenses.forEach((expense) => {
      if (!expense.paidBy || !expense.shares?.length) return

      const payer = expense.paidBy

      expense.shares.forEach((share) => {
        if (!share.user) return

        // Don't create self-payments
        if (
          String(share.user?._id || share.user) ===
          String(expense.paidBy?._id || expense.paidBy)
        ) {
          return
        }

        const receiverId = String(payer._id || payer)
        const senderId = String(share.user._id || share.user)
        const key = `${receiverId}-${senderId}`

        if (!settlements[key]) {
          settlements[key] = {
            receiver: payer.name || 'Unknown User',
            sender: share.user.name || 'Unknown User',
            amount: 0,
            currency: expense.currency || group.baseCurrency,
          }
        }

        settlements[key].amount += Number(share.amount || 0)
      })
    })

    return Object.values(settlements)
  }

  const overallSettlements = calculateOverallSettlements()

  // Group settlements by receiver
  const groupedSettlements = {}
  overallSettlements.forEach((settlement) => {
    if (!groupedSettlements[settlement.receiver]) {
      groupedSettlements[settlement.receiver] = []
    }
    groupedSettlements[settlement.receiver].push(settlement)
  })

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-6 w-32 rounded-lg bg-stone-200" />
          <div className="h-10 w-3/4 rounded-xl bg-stone-200" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-3xl bg-stone-100" />
            ))}
          </div>
          <div className="h-64 rounded-3xl bg-stone-100" />
        </div>
      </AppLayout>
    )
  }

  // =========================
  // GROUP NOT FOUND
  // =========================
  if (!group) {
    return (
      <AppLayout>
        <div className="py-20 text-center max-w-md mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">Group Not Found</h2>
          <p className="mt-2 text-sm text-stone-500">
            The group you're looking for doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate('/groups')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#159a8c] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#117d72] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Groups</span>
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
        {/* =========================
            BREADCRUMBS
        ========================= */}
        <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
          <button
            onClick={() => navigate('/groups')}
            className="inline-flex items-center gap-1.5 hover:text-[#159a8c] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Groups</span>
          </button>
          <ChevronRight className="w-3 h-3 text-stone-300" />
          <button
            onClick={() => navigate(`/groups/${groupId}`)}
            className="hover:text-[#159a8c] transition-colors cursor-pointer truncate max-w-xs"
          >
            {group.name}
          </button>
          <ChevronRight className="w-3 h-3 text-stone-300" />
          <span className="text-stone-900 font-semibold">Expenses</span>
        </div>

        {/* =========================
            HEADER
        ========================= */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#159a8c]/10 text-[#159a8c] text-xs font-semibold uppercase tracking-wider mb-3">
              <Receipt className="w-3.5 h-3.5" />
              <span>Track Record</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a]">
              {group.name} Expenses
            </h1>

            <p className="mt-2 text-sm text-stone-500 max-w-2xl">
              {group.description || 'Monitor all transactions and view real-time balance updates.'}
            </p>
          </div>

          <button
            onClick={() => navigate(`/groups/${groupId}/expenses/add`)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#159a8c] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-[#159a8c]/30 hover:bg-[#117d72] active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* =========================
            STATS ROW
        ========================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* TOTAL EXPENSES */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Total Expenses
              </span>
              <TrendingUp className="w-4 h-4 text-[#159a8c]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#1a1a1a]">
                {group.baseCurrency} {totalExpense.toFixed(2)}
              </span>
            </div>
            <div className="mt-1 text-xs text-stone-400">
              {expenses.length} {expenses.length === 1 ? 'transaction' : 'transactions'}
            </div>
          </div>

          {/* MEMBERS COUNT */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Active Members
              </span>
              <Users className="w-4 h-4 text-[#159a8c]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#1a1a1a]">
                {memberBalances.length}
              </span>
            </div>
            <div className="mt-1 text-xs text-stone-400">
              People with activity
            </div>
          </div>

          {/* SETTLEMENT STATUS */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Settlement Status
              </span>
              <ArrowRightLeft className="w-4 h-4 text-[#159a8c]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              {Object.keys(groupedSettlements).length === 0 ? (
                <span className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>All Settled</span>
                </span>
              ) : (
                <span className="text-2xl font-extrabold text-[#1a1a1a]">
                  {overallSettlements.length}
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-stone-400">
              {Object.keys(groupedSettlements).length === 0
                ? 'No pending payments'
                : 'Pending settlements'}
            </div>
          </div>
        </div>

        {/* =========================
            MEMBER BALANCES
        ========================= */}
        <section className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <div className="pb-6 border-b border-stone-100">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1">
              <Wallet className="w-3.5 h-3.5" />
              <span>Financial Overview</span>
            </div>
            <h2 className="text-xl font-bold text-[#1a1a1a]">Member Balances</h2>
            <p className="mt-1 text-sm text-stone-500">
              Track who owes money and who should receive payments.
            </p>
          </div>

          {memberBalances.length === 0 ? (
            <p className="mt-6 text-sm text-stone-500">No member activity yet.</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {memberBalances.map((member) => {
                const balance = Number(member.balance || 0)
                const roundedBalance = Math.abs(balance) < 0.01 ? 0 : balance

                return (
                  <div
                    key={member.user?._id || member.user}
                    className="rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4 hover:shadow-sm transition-shadow"
                  >
                    {/* USER */}
                    <div className="flex items-center gap-3">
                      {member.user.profileImage ? (
                        <img
                          src={member.user.profileImage}
                          alt={member.user.name}
                          className="h-12 w-12 rounded-2xl object-cover ring-1 ring-stone-200"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#159a8c]/15 text-[#159a8c] font-bold text-sm">
                          {getInitials(member.user.name)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-[#1a1a1a] text-sm">
                          {member.user.name}
                        </p>
                        <p className="text-xs text-stone-500">
                          {roundedBalance > 0
                            ? 'Should receive'
                            : roundedBalance < 0
                            ? 'Owes group'
                            : 'Settled up'}
                        </p>
                      </div>
                    </div>

                    {/* BALANCE */}
                    <div className="mt-4 pt-4 border-t border-stone-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                          Balance
                        </span>
                        <span
                          className={`text-lg font-extrabold ${
                            roundedBalance > 0
                              ? 'text-emerald-600'
                              : roundedBalance < 0
                              ? 'text-red-600'
                              : 'text-stone-500'
                          }`}
                        >
                          {roundedBalance > 0 ? '+' : roundedBalance < 0 ? '-' : ''}
                          {group.baseCurrency} {Math.abs(roundedBalance).toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-stone-400">Total Paid</span>
                        <span className="font-semibold text-stone-600">
                          {group.baseCurrency} {Number(member.totalPaid || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* =========================
            OVERALL SETTLEMENT
        ========================= */}
        <section className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <div className="pb-6 border-b border-stone-100">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Settlement Plan</span>
            </div>
            <h2 className="text-xl font-bold text-[#1a1a1a]">Overall Settlement</h2>
            <p className="mt-1 text-sm text-stone-500">
              Simplified payment paths to settle all group balances.
            </p>
          </div>

          {Object.keys(groupedSettlements).length === 0 ? (
            <div className="mt-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Everyone is settled up!
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  No pending payments in this group.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {Object.entries(groupedSettlements).map(([receiver, settlements]) => (
                <div
                  key={receiver}
                  className="rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4"
                >
                  <p className="font-bold text-[#1a1a1a] mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#159a8c]/15 text-[#159a8c] text-xs font-bold">
                      {getInitials(receiver)}
                    </span>
                    <span>{receiver}</span>
                    <span className="text-stone-500 font-normal text-sm">should receive</span>
                  </p>

                  <div className="space-y-2">
                    {settlements.map((settlement, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3"
                      >
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <span>from</span>
                          <span className="font-bold text-[#1a1a1a]">
                            {settlement.sender}
                          </span>
                        </div>

                        <span className="font-bold text-[#159a8c] text-base">
                          {settlement.currency} {Number(settlement.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =========================
            EXPENSE LIST
        ========================= */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1a1a1a]">All Expenses</h2>
            {expenses.length > 0 && (
              <span className="text-xs text-stone-500">
                {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </div>

          {expenses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-200 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#1a1a1a]">No expenses yet</h3>
              <p className="mt-2 text-sm text-stone-500 max-w-sm mx-auto">
                Start tracking shared costs by adding your first expense transaction.
              </p>
              <button
                onClick={() => navigate(`/groups/${groupId}/expenses/add`)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#159a8c] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#117d72] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Expense</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {expenses.map((expense, index) => (
                <motion.article
                  key={expense._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.28 }}
                  className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* TOP SECTION */}
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
                    {/* LEFT: EXPENSE DETAILS */}
                    <div className="space-y-4">
                      {/* TITLE & AMOUNT */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl font-bold text-[#1a1a1a] break-words">
                            {expense.title}
                          </h3>
                          {expense.description && (
                            <p className="mt-1 text-sm text-stone-500 break-words">
                              {expense.description}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                            Amount
                          </p>
                          <p className="text-2xl font-extrabold text-[#159a8c]">
                            {expense.currency || group.baseCurrency}{' '}
                            {Number(expense.amount || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* META INFO */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 text-stone-500">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>
                            Paid by{' '}
                            <span className="font-semibold text-[#1a1a1a]">
                              {expense.paidBy?.name || 'Unknown'}
                            </span>
                          </span>
                        </div>

                        {expense.date && (
                          <div className="flex items-center gap-1.5 text-stone-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {new Date(expense.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        )}

                        {expense.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium capitalize">
                            {expense.category}
                          </span>
                        )}
                      </div>

                      {/* SETTLEMENT INFO */}
                      {expense.shares?.length > 0 && expense.paidBy && (
                        <div className="rounded-xl bg-stone-50/70 border border-stone-100 p-3 space-y-1.5">
                          {expense.shares
                            .filter(
                              (share) =>
                                share.user?._id &&
                                String(share.user._id) !== String(expense.paidBy._id)
                            )
                            .map((share) => (
                              <p
                                key={share._id || share.user._id}
                                className="text-xs text-stone-600 leading-relaxed"
                              >
                                <span className="font-semibold text-[#1a1a1a]">
                                  {expense.paidBy.name}
                                </span>{' '}
                                should receive{' '}
                                <span className="font-bold text-[#159a8c]">
                                  {expense.currency || group.baseCurrency}{' '}
                                  {Number(share.amount || 0).toFixed(2)}
                                </span>{' '}
                                from{' '}
                                <span className="font-semibold text-[#1a1a1a]">
                                  {share.user.name}
                                </span>
                              </p>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* RIGHT: RECEIPT */}
                    <div className="flex flex-col items-center gap-2 lg:w-32">
                      {expense.receiptUrl ? (
                        <>
                          <button
                            onClick={() => setSelectedReceipt(expense.receiptUrl)}
                            className="group relative h-32 w-full lg:w-32 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-xs hover:shadow-md transition-all cursor-pointer"
                            title="View receipt"
                          >
                            <img
                              src={expense.receiptUrl}
                              alt="Receipt"
                              className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>

                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => setSelectedReceipt(expense.receiptUrl)}
                              className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-stone-100 hover:bg-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors cursor-pointer"
                              title="View"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => handleEditReceipt(expense)}
                              className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-stone-100 hover:bg-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEditReceipt(expense)}
                          className="flex h-32 w-full lg:w-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/50 text-stone-400 transition hover:border-[#159a8c] hover:bg-[#159a8c]/5 hover:text-[#159a8c] cursor-pointer"
                          title="Add receipt"
                        >
                          <ImageIcon className="w-6 h-6 mb-1" />
                          <span className="text-xs font-semibold">Add Image</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SPLIT DETAILS */}
                  <div className="mt-6 pt-6 border-t border-stone-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-[#1a1a1a]">Split Details</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#159a8c]/10 text-[#159a8c] text-[11px] font-semibold uppercase tracking-wider">
                        {expense.splitType || 'Unknown'} Split
                      </span>
                    </div>

                    {expense.shares?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {expense.shares.map((share) => (
                          <div
                            key={share._id || share.user?._id}
                            className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2.5"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700 font-bold text-[10px] shrink-0">
                                {getInitials(share.user?.name)}
                              </div>
                              <span className="text-xs font-semibold text-[#1a1a1a] truncate">
                                {share.user?.name || 'Unknown'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {share.percentage !== undefined &&
                                share.percentage !== null && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                                    {share.percentage}%
                                  </span>
                                )}
                              <span className="text-xs font-bold text-[#159a8c]">
                                {expense.currency || group.baseCurrency}{' '}
                                {Number(share.amount || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-stone-500">No split details available.</p>
                    )}
                  </div>

                  {/* NOTES & ACTIONS */}
                  <div className="mt-6 pt-6 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {expense.notes?.length > 0 && (
                        <p className="text-xs text-stone-500 break-words">
                          <span className="font-semibold text-stone-700">Notes:</span>{' '}
                          {expense.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() =>
                          navigate(`/groups/${groupId}/expenses/${expense._id}/edit`)
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteExpense(expense._id, expense.title)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100/70 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* =========================
          RECEIPT MODAL
      ========================= */}
      {selectedReceipt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedReceipt(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative max-h-[95vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-stone-900/80 text-white hover:bg-stone-900 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={selectedReceipt}
              alt="Receipt preview"
              className="max-h-[90vh] max-w-full rounded-2xl object-contain mx-auto"
            />
          </motion.div>
        </motion.div>
      )}
    </AppLayout>
  )
}

export default GroupExpenses
