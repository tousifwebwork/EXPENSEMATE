import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AppLayout from '../../components/AppLayout'

import { createExpense } from '../../config/expense/expenseAPI'
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
  Plus,
  Minus,
  ChevronRight,
  Image as ImageIcon,
  X,
  Sparkles,
  Percent,
  Equal,
  Receipt,
} from 'lucide-react'

const AddExpense = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()

  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    currency: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    paidBy: '',
    splitType: 'equal',
    shares: [],
    notes: '',
    receiptUrl: null,
  })

  // =========================
  // LOAD GROUP
  // =========================
  const loadGroup = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please login again')
        return
      }

      const res = await getGroupById(groupId, token)
      const groupData = res.data.group

      setGroup(groupData)

      // Select all members by default
      const defaultShares = groupData.members.map((member) => ({
        user: member.user?._id || member.user,
        amount: '',
        percentage: '',
      }))

      setFormData((prev) => ({
        ...prev,
        currency: groupData.baseCurrency,
        paidBy: groupData.owner?._id || groupData.owner || '',
        shares: defaultShares,
      }))
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to load group')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroup()
  }, [groupId])

  // =========================
  // INPUT CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // =========================
  // RECEIPT IMAGE
  // =========================
  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Receipt image must be less than 5MB')
      return
    }

    setFormData((prev) => ({ ...prev, receiptUrl: file }))
  }

  const removeReceipt = () => {
    setFormData((prev) => ({ ...prev, receiptUrl: null }))
  }

  // =========================
  // SPLIT TYPE CHANGE
  // =========================
  const handleSplitTypeChange = (splitType) => {
    setFormData((prev) => ({
      ...prev,
      splitType,
      shares: prev.shares.map((share) => ({
        user: share.user,
        amount: '',
        percentage: '',
      })),
    }))
  }

  // =========================
  // MEMBER SELECTION
  // =========================
  const handleMemberSelection = (userId) => {
    setFormData((prev) => {
      const exists = prev.shares.some((share) => share.user === userId)

      if (exists) {
        return {
          ...prev,
          shares: prev.shares.filter((share) => share.user !== userId),
        }
      }

      return {
        ...prev,
        shares: [...prev.shares, { user: userId, amount: '', percentage: '' }],
      }
    })
  }

  // =========================
  // SELECT ALL / CLEAR
  // =========================
  const selectAllMembers = () => {
    if (!group?.members) return
    const shares = group.members.map((member) => ({
      user: member.user?._id || member.user,
      amount: '',
      percentage: '',
    }))
    setFormData((prev) => ({ ...prev, shares }))
  }

  const clearMembers = () => {
    setFormData((prev) => ({ ...prev, shares: [] }))
  }

  // =========================
  // AMOUNT / PERCENTAGE CHANGE
  // =========================
  const handleExactAmountChange = (userId, value) => {
    setFormData((prev) => ({
      ...prev,
      shares: prev.shares.map((share) =>
        share.user === userId ? { ...share, amount: value } : share
      ),
    }))
  }

  const handlePercentageChange = (userId, value) => {
    setFormData((prev) => ({
      ...prev,
      shares: prev.shares.map((share) =>
        share.user === userId ? { ...share, percentage: value } : share
      ),
    }))
  }

  // =========================
  // CREATE EXPENSE
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

    if (formData.splitType !== 'fullPayment' && formData.shares.length === 0) {
      toast.error('Please select at least one participant')
      return
    }

    // Prepare shares
    let shares = []

    if (formData.splitType === 'equal') {
      shares = formData.shares.map((share) => ({ user: share.user }))
    }

    if (formData.splitType === 'exact') {
      const invalid = formData.shares.some(
        (share) => share.amount === '' || Number(share.amount) < 0
      )

      if (invalid) {
        toast.error('Enter an amount for every participant')
        return
      }

      const totalShares = formData.shares.reduce(
        (sum, share) => sum + Number(share.amount),
        0
      )

      if (
        Math.round(totalShares * 100) !== Math.round(Number(formData.amount) * 100)
      ) {
        toast.error(
          `Exact shares must equal ${formData.currency} ${Number(formData.amount).toFixed(2)}`
        )
        return
      }

      shares = formData.shares.map((share) => ({
        user: share.user,
        amount: Number(share.amount),
      }))
    }

    if (formData.splitType === 'percentage') {
      const invalid = formData.shares.some(
        (share) =>
          share.percentage === '' ||
          Number(share.percentage) < 0 ||
          Number(share.percentage) > 100
      )

      if (invalid) {
        toast.error('Enter a valid percentage for every participant')
        return
      }

      const totalPercentage = formData.shares.reduce(
        (sum, share) => sum + Number(share.percentage || 0),
        0
      )

      if (Math.round(totalPercentage * 100) / 100 !== 100) {
        toast.error('Percentages must add up to 100%')
        return
      }

      shares = formData.shares.map((share) => ({
        user: share.user,
        percentage: Number(share.percentage),
      }))
    }

    if (formData.splitType === 'fullPayment') {
      shares = []
    }

    // Save
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please login again')
        return
      }

      const expenseData = new FormData()
      expenseData.append('groupId', groupId)
      expenseData.append('title', formData.title.trim())
      expenseData.append('description', formData.description.trim())
      expenseData.append('amount', Number(formData.amount))
      expenseData.append('currency', formData.currency)
      expenseData.append('category', formData.category)
      expenseData.append('date', formData.date)
      expenseData.append('paidBy', formData.paidBy)
      expenseData.append('splitType', formData.splitType)
      expenseData.append('shares', JSON.stringify(shares))
      expenseData.append('notes', formData.notes.trim())

      if (formData.receiptUrl) {
        expenseData.append('receiptPhoto', formData.receiptUrl)
      }

      await createExpense(expenseData, token)
      toast.success('Expense added successfully!')

      setTimeout(() => {
        navigate(`/groups/${groupId}/expenses`)
      }, 800)
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to add expense')
    } finally {
      setSaving(false)
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

  // Calculate split totals
  const totalExact = formData.shares.reduce(
    (sum, share) => sum + Number(share.amount || 0),
    0
  )
  const totalPercentage = formData.shares.reduce(
    (sum, share) => sum + Number(share.percentage || 0),
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
            The group doesn't exist or you don't have access.
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
          <span className="text-stone-900 font-semibold">New</span>
        </div>

        {/* =========================
            HEADER
        ========================= */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#159a8c]/10 text-[#159a8c] text-xs font-semibold uppercase tracking-wider mb-3">
            <Plus className="w-3.5 h-3.5" />
            <span>New Transaction</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a]">
            Add Expense
          </h1>

          <p className="mt-2 text-sm text-stone-500 max-w-2xl">
            Record a shared expense and split it among {group.name} members.
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
                      min="0"
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

              {/* CATEGORY, DATE, CURRENCY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
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
                    <option key={member.user._id} value={member.user._id}>
                      {member.user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* RECEIPT UPLOAD */}
          <section className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="pb-6 border-b border-stone-100">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1">
                <Receipt className="w-3.5 h-3.5" />
                <span>Receipt Image</span>
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a]">Upload Receipt (Optional)</h2>
              <p className="mt-1 text-xs text-stone-500">
                Add a photo of your receipt for record keeping (max 5MB)
              </p>
            </div>

            <div className="mt-6">
              {formData.receiptUrl ? (
                <div className="flex items-center gap-4 p-4 rounded-xl border border-stone-200 bg-stone-50/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#159a8c]/10 text-[#159a8c]">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1a1a] truncate">
                      {formData.receiptUrl.name}
                    </p>
                    <p className="text-xs text-stone-500">
                      {(formData.receiptUrl.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeReceipt}
                    className="p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
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
                  {
                    value: 'equal',
                    label: 'Equal Split',
                    icon: Equal,
                    desc: 'Divide evenly',
                  },
                  {
                    value: 'exact',
                    label: 'Exact Amount',
                    icon: DollarSign,
                    desc: 'Specify amounts',
                  },
                  {
                    value: 'percentage',
                    label: 'Percentage',
                    icon: Percent,
                    desc: 'By percentage',
                  },
                  {
                    value: 'fullPayment',
                    label: 'Full Payment',
                    icon: CheckCircle2,
                    desc: 'One person pays',
                  },
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
                          formData.splitType === option.value
                            ? 'text-[#159a8c]'
                            : 'text-stone-400'
                        }`}
                      />
                      <div className="text-center">
                        <div
                          className={`text-xs font-bold ${
                            formData.splitType === option.value
                              ? 'text-[#1a1a1a]'
                              : 'text-stone-700'
                          }`}
                        >
                          {option.label}
                        </div>
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          {option.desc}
                        </div>
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
                        onClick={selectAllMembers}
                        className="text-xs font-semibold text-[#159a8c] hover:text-[#117d72] transition-colors cursor-pointer"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={clearMembers}
                        className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {group.members?.map((member) => {
                      const userId = member.user?._id || member.user
                      const selected = formData.shares.some(
                        (share) => share.user === userId
                      )
                      const selectedShare = formData.shares.find(
                        (share) => share.user === userId
                      )

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
                            {/* MEMBER INFO */}
                            <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => handleMemberSelection(userId)}
                                className="h-5 w-5 shrink-0 accent-[#159a8c] cursor-pointer rounded"
                              />

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700 font-bold text-sm">
                                {getInitials(member.user.name)}
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#1a1a1a] truncate">
                                  {member.user.name}
                                </p>
                                <p className="text-xs text-stone-500 capitalize">
                                  {member.role}
                                </p>
                              </div>
                            </label>

                            {/* EXACT AMOUNT INPUT */}
                            {selected && formData.splitType === 'exact' && (
                              <div className="w-full md:w-40">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={selectedShare?.amount || ''}
                                  onChange={(e) =>
                                    handleExactAmountChange(userId, e.target.value)
                                  }
                                  placeholder="0.00"
                                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none"
                                />
                              </div>
                            )}

                            {/* PERCENTAGE INPUT */}
                            {selected && formData.splitType === 'percentage' && (
                              <div className="relative w-full md:w-40">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={selectedShare?.percentage || ''}
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
                  {formData.shares.length > 0 && (
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
                            {formData.currency} {totalExact.toFixed(2)} / {formData.currency}{' '}
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
                            {formData.shares.length}{' '}
                            {formData.shares.length === 1 ? 'participant' : 'participants'}
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
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => navigate(`/groups/${groupId}/expenses`)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#159a8c] px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-[#159a8c]/30 hover:bg-[#117d72] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Add Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default AddExpense
