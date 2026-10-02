 
import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout.jsx'
import {Receipt,Filter,Plus,TrendingDown,Calendar,Users,} from 'lucide-react'
import { motion } from 'framer-motion'
import { getMyExpenses } from '../config/expense/expenseAPI.js'


const filters = ['All','Food','Travel','Shopping','Rent','Utilities','Entertainment','Accommodation','Medical','Other',]
const formatINR = (amount) =>  `₹${Number(amount || 0).toLocaleString('en-IN')}`
const formatDate = (date) =>date ? new Date(date).toLocaleDateString('en-IN', {  day: '2-digit', month: 'short',  year: 'numeric',}) : '—'

function Expenses() {
  const [filter, setFilter] = useState('All')
  const [showExpense, setShowExpense] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await getMyExpenses(token)
        console.log('Expenses:', response.data)
        setShowExpense(response.data)
      } catch (error) {
        console.error('Error fetching expenses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [])

  const visibleExpenses =  filter === 'All' ? showExpense  : showExpense.filter((expense) => expense.category === filter )

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-4 sm:space-y-8 sm:px-6 lg:px-8">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#159a8c]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#159a8c]">
              <Receipt className="h-3.5 w-3.5" />
              <span>Activity</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1a1a] sm:text-4xl">
              Expenses
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              Review your share of every group expense
            </p>
          </div>

          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#159a8c] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-[#159a8c]/30 transition-all hover:bg-[#117d72] active:scale-[0.99] sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* ================= FILTERS ================= */}
        <div className="flex min-w-0 items-start gap-3">

          <div className="flex shrink-0 items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </div>

          <div className="flex min-w-0 gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  filter === f ? 'bg-[#159a8c] text-white shadow-sm shadow-[#159a8c]/20' : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50' }`} >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ================= EXPENSES LIST ================= */}
        <motion.section  initial={{ opacity: 0, y: 12 }}  animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.3 }} className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm sm:rounded-3xl">

          {/* LOADING */}
          {loading ? (
            <div className="flex min-h-60 items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-[#159a8c]" />
            </div>
          ) : visibleExpenses.length === 0 ? (

            /* EMPTY */
            <div className="flex min-h-60 flex-col items-center justify-center px-6 py-12 text-center">

              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
                <Receipt className="h-7 w-7 text-stone-400" />
              </div>

              <p className="text-base font-semibold text-stone-600">
                No expenses found
              </p>

              <p className="mt-1 max-w-sm text-sm text-stone-400">
                {filter === 'All'
                  ? "You haven't added any expenses yet."
                  : `There are no ${filter.toLowerCase()} expenses yet.`}
              </p>

            </div>

          ) : (

            /* EXPENSES */
            <div className="divide-y divide-stone-100">

              {visibleExpenses.map((expense, index) => (
                <motion.article
                  key={expense._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.04,
                    duration: 0.25,
                  }}
                  className="flex flex-col gap-4 px-4 py-5 transition-colors hover:bg-stone-50/60 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-6 lg:px-8"
                >

                  {/* LEFT SIDE */}
                  <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">

                    {/* CATEGORY ICON */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-200/70 bg-gradient-to-br from-stone-100 to-stone-50 text-[10px] font-bold text-stone-500 sm:h-12 sm:w-12">
                      {expense.category?.slice(0, 2).toUpperCase()}
                    </div>

                    {/* DETAILS */}
                    <div className="min-w-0 flex-1">

                      <h2 className="truncate text-sm font-bold text-[#1a1a1a] sm:text-base">
                        {expense.title}
                      </h2>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">

                        {/* GROUP */}
                        <span className="inline-flex max-w-40 items-center gap-1 truncate sm:max-w-52">
                          <Users className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {expense.group?.name || 'Unknown group'}
                          </span>
                        </span>

                        <span className="hidden text-stone-300 sm:inline">
                          ·
                        </span>

                        {/* DATE */}
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>
                            {formatDate(expense.date)}
                          </span>
                        </span>

                      </div>

                      {/* CATEGORY */}
                      <div className="mt-2">
                        <span className="inline-flex rounded-full bg-[#159a8c]/10 px-2.5 py-1 text-[10px] font-semibold text-[#159a8c]">
                          {expense.category}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* RIGHT SIDE / AMOUNT */}
                  <div className="flex shrink-0 items-center justify-between sm:block">

                    <span className="mr-2 text-xs text-stone-400 sm:hidden">
                      Amount
                    </span>

                    <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50 px-3 py-2 sm:px-4">
                      <TrendingDown className="h-4 w-4 text-amber-600" />

                      <span className="text-sm font-bold text-amber-700 sm:text-base">
                        {formatINR(expense.amount)}
                      </span>
                    </div>

                  </div>

                </motion.article>
              ))}

            </div>
          )}

        </motion.section>
      </div>
    </AppLayout>
  )
}

export default Expenses
