import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AppLayout from '../../components/AppLayout'

import {
  getExpenseById,
  updateExpense,
  deleteExpense,
} from '../../config/expense/expenseAPI'

import { getGroupById } from '../../config/group/groupAPI'

import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import {
  ArrowLeft,
  FileText,
  DollarSign,
  Users,
  Upload,
  Calendar,
  Tag,
  StickyNote,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ChevronRight,
  Image as ImageIcon,
  X,
  Save,
  Percent,
  Equal,
  Receipt,
  Eye,
  Edit3,
} from 'lucide-react'

const EditExpense = () => {
  const { groupId, expenseId } = useParams()
  const navigate = useNavigate()

  const [group, setGroup] = useState(null)
  const [expense, setExpense] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Receipt states
  const [newReceipt, setNewReceipt] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [selectedReceipt, setSelectedReceipt] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'Other',
    date: '',
    paidBy: '',
    splitType: 'equal',
    participants: [],
    exactAmounts: {},
    percentages: {},
    notes: '',
  })

  // =========================
  // LOAD DATA
  // =========================
  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please login again')
        return
      }

      const [expenseRes, groupRes] = await Promise.all([
        getExpenseById(expenseId, token),
        getGroupById(groupId, token),
      ])

      const expenseData = expenseRes.data.expense
      const groupData = groupRes.data.group

      setExpense(expenseData)
      setGroup(groupData)

      const participants =
        expenseData.shares?.map((share) =>
          share.user?._id ? share.user._id : share.user
        ) || []

      const exactAmounts = {}
      const percentages = {}

      expenseData.shares?.forEach((share) => {
        const userId = share.user?._id || share.user
        exactAmounts[userId] = share.amount ?? ''
        percentages[userId] = share.percentage ?? ''
      })

      setFormData({
        title: expenseData.title || '',
        description: expenseData.description || '',
        amount: expenseData.amount || '',
        category: expenseData.category || 'Other',
        date: expenseData.date
          ? new Date(expenseData.date).toISOString().split('T')[0]
          : '',
        paidBy: expenseData.paidBy?._id || expenseData.paidBy || '',
        splitType: expenseData.splitType || 'equal',
        participants,
        exactAmounts,
        percentages,
        notes: expenseData.notes || '',
      })
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to load expense')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [expenseId, groupId])

  // =========================
  // INPUT CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // =========================
  // PARTICIPANTS
  // =========================
  const handleParticipantChange = (userId) => {
    setFormData((prev) => {
      const exists = prev.participants.includes(userId)
      return {
        ...prev,
        participants: exists
          ? prev.participants.filter((id) => id !== userId)
          : [...prev.participants, userId],
      }
    })
  }

  const selectAllParticipants = () => {
    if (!group?.members) return
    const allMemberIds = group.members.map(
      (member) => member.user?._id || member.user
    )
    setFormData((prev) => ({ ...prev, participants: allMemberIds }))
  }

  const clearParticipants = () => {
    setFormData((prev) => ({ ...prev, participants: [] }))
  }

  // =========================
  // AMOUNT / PERCENTAGE CHANGE
  // =========================
  const handleExactAmountChange = (userId, value) => {
    setFormData((prev) => ({
      ...prev,
      exactAmounts: { ...prev.exactAmounts, [userId]: value },
    }))
  }

  const handlePercentageChange = (userId, value) => {
    setFormData((prev) => ({
      ...prev,
      percentages: { ...prev.percentages, [userId]: value },
    }))
  }

  // =========================
  // SPLIT TYPE CHANGE
  // =========================
  const handleSplitTypeChange = (splitType) => {
    setFormData((prev) => ({ ...prev, splitType }))
  }

  // =========================
  // RECEIPT CHANGE
  // =========================
  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Receipt image must be less than 5MB')
      e.target.value = ''
      return
    }

    setNewReceipt(file)
    const previewUrl = URL.createObjectURL(file)
    setReceiptPreview(previewUrl)
  }

  const removeNewReceipt = () => {
    setNewReceipt(null)
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview)
    }
    setReceiptPreview(null)
  }

  // =========================
  // BUILD SHARES
  // =========================
  const buildShares = () => {
    if (formData.splitType === 'equal') {
      return formData.participants.map((userId) => ({ user: userId }))
    }

    if (formData.splitType === 'exact') {
      return formData.participants.map((userId) => ({
        user: userId,
        amount: Number(formData.exactAmounts[userId] || 0),
      }))
    }

    if (formData.splitType === 'percentage') {
      return formData.participants.map((userId) => ({
        user: userId,
        percentage: Number(formData.percentages[userId] || 0),
      }))
    }

    return []
  }

  // =========================
  // UPDATE EXPENSE
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Please enter expense title')
      return
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!formData.paidBy) {
      toast.error('Please select who paid')
      return
    }

    if (
      formData.splitType !== 'fullPayment' &&
      formData.participants.length === 0
    ) {
      toast.error('Please select at least one participant')
      return
    }

    // Validate exact split
    if (formData.splitType === 'exact') {
      const totalExact = formData.participants.reduce(
        (total, userId) => total + Number(formData.exactAmounts[userId] || 0),
        0
      )

      if (
        Math.round(totalExact * 100) !== Math.round(Number(formData.amount) * 100)
      ) {
        toast.error('Exact split amounts must add up to the total')
        return
      }
    }

    // Validate percentage
    if (formData.splitType === 'percentage') {
      const totalPercentage = formData.participants.reduce(
        (total, userId) => total + Number(formData.percentages[userId] || 0),
        0
      )

      if (Math.round(totalPercentage * 100) !== 10000) {
        toast.error('Percentages must add up to 100%')
        return
      }
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please login again')
        return
      }

      const shares = buildShares()
      const expenseData = new FormData()

      expenseData.append('title', formData.title.trim())
      expenseData.append('description', formData.description.trim())
      expenseData.append('amount', Number(formData.amount))
      expenseData.append('category', formData.category)
      expenseData.append('date', formData.date)
      expenseData.append('paidBy', formData.paidBy)
      expenseData.append('splitType', formData.splitType)
      expenseData.append('shares', JSON.stringify(shares))
      expenseData.append('notes', formData.notes.trim())

      if (newReceipt) {
        expenseData.append('receiptPhoto', newReceipt)
      }

      await updateExpense(expenseId, expenseData, token)
      toast.success('Expense updated successfully!')

      setTimeout(() => {
        navigate(`/groups/${groupId}/expenses`)
      }, 800)
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to update expense')
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // DELETE EXPENSE
  // =========================
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${formData.title}"? This action cannot be undone.`
    )
    if (!confirmDelete) return

    try {
      setDeleting(true)
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please login again')
        return
      }

      await deleteExpense(expenseId, token)
      toast.success('Expense deleted successfully!')

      setTimeout(() => {
        navigate(`/groups/${groupId}/expenses`)
      }, 800)
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to delete expense')
    } finally {
      setDeleting(false)
    }
  }

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

  // Calculate totals
  const totalExact = formData.participants.reduce(
    (sum, userId) => sum + Number(formData.exactAmounts[userId] || 0),
    0
  )
  const totalPercentage = formData.participants.reduce(
    (sum, userId) => sum + Number(formData.percentages[userId] || 0),
    0
  )

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-6 w-32 rounded-lg bg-stone-200" />
          <div className="h-10 w-3/4 rounded-xl bg-stone-200" />
          <div className="h-96 rounded-3xl bg-stone-100" />
        </div>
      </AppLayout>
    )
  }

  // =========================
  // NOT FOUND
  // =========================
  if (!expense || !group) {
    return (
      <AppLayout>
        <div className="py-20 text-center max-w-md mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">Expense Not Found</h2>
          <p className="mt-2 text-sm text-stone-500">
            The expense doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate(`/groups/${groupId}/expenses`)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#159a8c] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#117d72] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Expenses</span>
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
        {/* =========================
            BREADCRUMBS
        ========================= */}
        <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
          <button
            onClick={() => navigate('/groups')}
            className="hover:text-[#159a8c] transition-colors cursor-pointer"
          >
            Groups
          </button>
          <ChevronRight className="w-3 h-3 text-stone-300" />
          <button
            onClick={() => navigate(`/groups/${groupId}`)}
            className="hover:text-[#159a8c] transition-colors cursor-pointer truncate max-w-xs"
          >
            {group.name}
          </button>
          <ChevronRight className="w-3 h-3 text-stone-300" />
          <button
            onClick={() => navigate(`/groups/${groupId}/expenses`)}
            className="hover:text-[#159a8c] transition-colors cursor-pointer"
          >
            Expenses
          </button>
          <ChevronRight className="w-3 h-3 text-stone-300" />
          <span className="text-stone-900 font-semibold">Edit</span>
        </div>

        {/* =========================
            HEADER
        ========================= */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Transaction</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a]">
            Edit Expense
          </h1>

          <p className="mt-2 text-sm text-stone-500 max-w-2xl">
            Update expense details and split configuration for {group.name}.
          </p>
        </div>

        {/* =========================
            FORM
        ========================= */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BASIC DETAILS */}
          <section className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="pb-6 border-b border-stone-100">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Basic Details</span>
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a]">Expense Information</h2>
            </div>

            <div className="mt-6 space-y-5">
              {/* TITLE & AMOUNT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                    Expense Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Dinner at Beach Shack"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add details about this expense..."
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 resize-y focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
                />
              </div>

              {/* CATEGORY & DATE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                    Category
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Tag className="w-4 h-4" />
                    </div>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option value="Food">Food</option>
                      <option value="Travel">Travel</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Rent">Rent</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Accommodation">Accommodation</option>
                      <option value="Medical">Medical</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                    Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* PAID BY */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                  Paid By
                </label>
                <select
                  name="paidBy"
                  value={formData.paidBy}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all cursor-pointer"
                  required
                >
                  <option value="">Select member</option>
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
            </div>
          </section>

          {/* RECEIPT */}
          <section className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="pb-6 border-b border-stone-100">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1">
                <Receipt className="w-3.5 h-3.5" />
                <span>Receipt Image</span>
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a]">
                {expense.receiptUrl ? 'Update Receipt' : 'Add Receipt (Optional)'}
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                {expense.receiptUrl
                  ? 'Upload a new image to replace the current receipt'
                  : 'Add a photo of your receipt for record keeping (max 5MB)'}
              </p>
            </div>

            <div className="mt-6">
              {newReceipt && receiptPreview ? (
                /* NEW RECEIPT PREVIEW */
                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 overflow-hidden">
                  <div className="relative">
                    <img
                      src={receiptPreview}
                      alt="New receipt preview"
                      className="h-56 w-full object-contain bg-white"
                    />
                    <button
                      type="button"
                      onClick={removeNewReceipt}
                      className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-900/80 text-white hover:bg-stone-900 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1a1a1a] truncate">
                        {newReceipt.name}
                      </p>
                      <p className="text-xs text-stone-500">
                        New receipt ({(newReceipt.size / 1024).toFixed(2)} KB)
                      </p>
                    </div>
                    <label
                      htmlFor="receiptUrl"
                      className="ml-3 cursor-pointer rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      Change
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
                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 overflow-hidden">
                  <div className="relative">
                    <img
                      src={expense.receiptUrl}
                      alt="Current receipt"
                      className="h-56 w-full object-contain bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(expense.receiptUrl)}
                      className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-900/80 text-white hover:bg-stone-900 transition-colors cursor-pointer"
                      title="View full size"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#1a1a1a]">
                        Current Receipt
                      </p>
                      <p className="text-xs text-stone-500">
                        Upload new image to replace
                      </p>
                    </div>
                    <label
                      htmlFor="receiptUrl"
                      className="cursor-pointer rounded-xl border border-[#159a8c] bg-[#159a8c]/5 px-4 py-2 text-xs font-semibold text-[#159a8c] hover:bg-[#159a8c]/10 transition-colors"
                    >
                      Change
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
                  className="flex flex-col items-center justify-center min-h-40 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/50 px-4 py-8 text-center transition hover:border-[#159a8c] hover:bg-[#159a8c]/5 cursor-pointer"
                >
                  <Upload className="w-10 h-10 text-stone-400 mb-3" />
                  <p className="text-sm font-semibold text-stone-700">
                    Click to upload receipt image
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
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
          </section>

          {/* SPLIT CONFIGURATION */}
          <section className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="pb-6 border-b border-stone-100">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1">
                <Users className="w-3.5 h-3.5" />
                <span>Split Method</span>
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a]">How to Split</h2>
            </div>

            <div className="mt-6 space-y-6">
              {/* SPLIT TYPE SELECTOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { value: 'equal', label: 'Equal Split', icon: Equal, desc: 'Divide evenly' },
                  { value: 'exact', label: 'Exact Amount', icon: DollarSign, desc: 'Specify amounts' },
                  { value: 'percentage', label: 'Percentage', icon: Percent, desc: 'By percentage' },
                  { value: 'fullPayment', label: 'Full Payment', icon: CheckCircle2, desc: 'One person pays' },
                ].map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSplitTypeChange(option.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        formData.splitType === option.value
                          ? 'border-[#159a8c] bg-[#159a8c]/5 shadow-sm'
                          : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          formData.splitType === option.value ? 'text-[#159a8c]' : 'text-stone-400'
                        }`}
                      />
                      <div className="text-center">
                        <div
                          className={`text-xs font-bold ${
                            formData.splitType === option.value ? 'text-[#1a1a1a]' : 'text-stone-700'
                          }`}
                        >
                          {option.label}
                        </div>
                        <div className="text-[10px] text-stone-500 mt-0.5">{option.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* PARTICIPANTS */}
              {formData.splitType !== 'fullPayment' && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#1a1a1a]">Select Participants</h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Choose members who share this expense
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={selectAllParticipants}
                        className="text-xs font-semibold text-[#159a8c] hover:text-[#117d72] transition-colors cursor-pointer"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={clearParticipants}
                        className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {group.members?.map((member) => {
                      const userId = member.user?._id || member.user
                      const selected = formData.participants.includes(userId)

                      return (
                        <div
                          key={userId}
                          className={`rounded-2xl border-2 p-4 transition-all ${
                            selected
                              ? 'border-[#159a8c] bg-[#159a8c]/5'
                              : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => handleParticipantChange(userId)}
                                className="h-5 w-5 shrink-0 accent-[#159a8c] cursor-pointer rounded"
                              />

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700 font-bold text-sm">
                                {getInitials(member.user.name)}
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#1a1a1a] truncate">
                                  {member.user.name}
                                </p>
                                <p className="text-xs text-stone-500 capitalize">{member.role}</p>
                              </div>
                            </label>

                            {selected && formData.splitType === 'exact' && (
                              <div className="w-full md:w-40">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={formData.exactAmounts[userId] ?? ''}
                                  onChange={(e) =>
                                    handleExactAmountChange(userId, e.target.value)
                                  }
                                  placeholder="0.00"
                                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none"
                                />
                              </div>
                            )}

                            {selected && formData.splitType === 'percentage' && (
                              <div className="relative w-full md:w-40">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={formData.percentages[userId] ?? ''}
                                  onChange={(e) =>
                                    handlePercentageChange(userId, e.target.value)
                                  }
                                  placeholder="0"
                                  className="w-full px-3 py-2 pr-8 rounded-xl border border-stone-200 bg-white text-sm focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-stone-400">
                                  %
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* SPLIT SUMMARY */}
                  {formData.participants.length > 0 && (
                    <div className="rounded-xl bg-stone-50 border border-stone-200/60 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                          Split Summary
                        </span>
                        {formData.splitType === 'exact' && (
                          <span
                            className={`text-xs font-bold ${
                              Math.abs(totalExact - Number(formData.amount || 0)) < 0.01
                                ? 'text-emerald-600'
                                : 'text-red-600'
                            }`}
                          >
                            {group.baseCurrency || 'INR'} {totalExact.toFixed(2)} /{' '}
                            {group.baseCurrency || 'INR'}{' '}
                            {Number(formData.amount || 0).toFixed(2)}
                          </span>
                        )}
                        {formData.splitType === 'percentage' && (
                          <span
                            className={`text-xs font-bold ${
                              Math.abs(totalPercentage - 100) < 0.01
                                ? 'text-emerald-600'
                                : 'text-red-600'
                            }`}
                          >
                            {totalPercentage.toFixed(2)}% / 100%
                          </span>
                        )}
                        {formData.splitType === 'equal' && (
                          <span className="text-xs font-bold text-[#159a8c]">
                            {formData.participants.length}{' '}
                            {formData.participants.length === 1 ? 'participant' : 'participants'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* NOTES */}
          <section className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="pb-6 border-b border-stone-100">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1">
                <StickyNote className="w-3.5 h-3.5" />
                <span>Additional Notes</span>
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a]">Notes (Optional)</h2>
            </div>

            <div className="mt-6">
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any additional notes or context about this expense..."
                rows="4"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 resize-y focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
              />
            </div>
          </section>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between pt-2">
            {/* DELETE */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-6 py-3 text-sm font-semibold text-red-600 hover:bg-red-100/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer order-last sm:order-first"
            >
              {deleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Expense</span>
                </>
              )}
            </button>

            {/* CANCEL & SAVE */}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                disabled={saving || deleting}
                onClick={() => navigate(`/groups/${groupId}/expenses`)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={saving || deleting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#159a8c] px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-[#159a8c]/30 hover:bg-[#117d72] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* =========================
          RECEIPT VIEW MODAL
      ========================= */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="relative max-h-[95vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white p-3 shadow-2xl animate-scale-in"
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
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default EditExpense
