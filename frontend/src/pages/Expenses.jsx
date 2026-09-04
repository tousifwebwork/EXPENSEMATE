import { useState } from 'react'
import AppLayout from '../components/AppLayout.jsx'
import { recentExpenses } from '../mockData.js'

import {
  Receipt,
  Filter,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'

const formatINR = (amount) =>
  `${amount < 0 ? '-' : ''}₹${Math.abs(amount).toLocaleString('en-IN')}`

function Expenses() {
  const [filter, setFilter] = useState('All')
  const filters = ['All', 'Friends', 'Trip', 'Goa Trip', 'Home']
  const visibleExpenses =
    filter === 'All'
      ? recentExpenses
      : recentExpenses.filter((expense) => expense.group === filter)

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-8 animate-fade-in-up">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#159a8c]/10 text-[#159a8c] text-xs font-semibold uppercase tracking-wider mb-3">
              <Receipt className="w-3.5 h-3.5" />
              <span>Activity</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a]">
              Expenses
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              Review your share of every group expense
            </p>
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#159a8c] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-[#159a8c]/30 hover:bg-[#117d72] active:scale-[0.99] transition-all">
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* ================= FILTERS ================= */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {filters.map((item) => (
              <button
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  filter === item
                    ? 'bg-[#159a8c] text-white shadow-sm shadow-[#159a8c]/20'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300'
                }`}
                key={item}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* ================= EXPENSES LIST ================= */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.3 }}
          className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm"
        >
          {visibleExpenses.length ? (
            <div className="divide-y divide-stone-100">
              {visibleExpenses.map((expense, index) => (
                <motion.article
                  key={expense.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.25 }}
                  className="flex items-center justify-between gap-4 px-6 sm:px-8 py-6 hover:bg-stone-50/50 transition-colors"
                  style={{
                    animationDelay: `${index * 30}ms`,
                  }}
                >
                  {/* Left Side: Icon + Details */}
                  <div className="flex min-w-0 items-center gap-4 flex-1">
                    {/* Icon */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-stone-100 to-stone-50 text-2xl border border-stone-200/60">
                      {expense.icon}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-bold text-[#1a1a1a]">
                        {expense.title}
                      </h2>

                      <div className="mt-1.5 flex items-center gap-3 text-xs text-stone-500">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{expense.group}</span>
                        </span>

                        <span className="text-stone-300">·</span>

                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{expense.date}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Amount */}
                  <div className="shrink-0">
                    {expense.yourShare >= 0 ? (
                      <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/60 px-4 py-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-700">
                          {formatINR(expense.yourShare)}
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/60 px-4 py-2">
                        <TrendingDown className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-bold text-amber-700">
                          {formatINR(expense.yourShare)}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <Receipt className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-stone-600">
                No expenses found
              </p>
              <p className="text-xs text-stone-400 mt-1">
                {filter === 'All'
                  ? 'Start by adding your first expense'
                  : `No expenses in ${filter} yet`}
              </p>
            </div>
          )}
        </motion.section>
      </div>
    </AppLayout>
  )
}

export default Expenses
