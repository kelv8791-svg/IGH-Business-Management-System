import { useState, useMemo, useEffect } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Sparkles,
  Users,
  Truck,
  Boxes,
  Briefcase,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  ShoppingCart,
  Percent,
  CheckCircle2,
  Clock
} from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const toDateStr = (dateInput) => {
  if (!dateInput) return ''
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput
  }
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const todayStr = () => toDateStr(new Date())

const getDateRange = (p) => {
  const today = todayStr()
  const now = new Date()

  switch (p) {
    case 'daily': {
      const d = new Date(now)
      d.setDate(d.getDate() - 1)
      return { start: toDateStr(d), end: today }
    }
    case 'weekly': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return { start: toDateStr(d), end: today }
    }
    case 'monthly': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 1)
      return { start: toDateStr(d), end: today }
    }
    case 'yearly': {
      const d = new Date(now)
      d.setFullYear(d.getFullYear() - 1)
      return { start: toDateStr(d), end: today }
    }
    case 'all':
    default:
      return { start: '2000-01-01', end: today }
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data, selectedBranch } = useData()
  const activeBranch = user?.role === 'admin' ? selectedBranch : user?.branch
  const [period, setPeriod] = useState('all')

  useEffect(() => {
    setPeriod('all')
  }, [activeBranch])

  const dateRange = useMemo(() => getDateRange(period), [period])

  const filteredSales = useMemo(() => {
    const list = Array.isArray(data.sales) ? data.sales : []
    if (period === 'all') return list
    return list.filter(s => {
      const sd = toDateStr(s.date)
      return sd >= dateRange.start && sd <= dateRange.end
    })
  }, [data.sales, dateRange, period])

  const filteredExpenses = useMemo(() => {
    const list = Array.isArray(data.expenses) ? data.expenses : []
    if (period === 'all') return list
    return list.filter(e => {
      const ed = toDateStr(e.date)
      return ed >= dateRange.start && ed <= dateRange.end
    })
  }, [data.expenses, dateRange, period])

  const stats = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    const netBalance = totalSales - totalExpenses
    const profitMargin = totalSales > 0 ? ((netBalance / totalSales) * 100).toFixed(1) : 0
    return { totalSales, totalExpenses, netBalance, profitMargin }
  }, [filteredSales, filteredExpenses])

  const hasData = filteredSales.length > 0 || filteredExpenses.length > 0

  // Line chart with smooth gradient & crisp point dots
  const salesByDate = useMemo(() => {
    const grouped = {}
    filteredSales.forEach(s => {
      const key = toDateStr(s.date) || 'Unknown'
      grouped[key] = (grouped[key] || 0) + (Number(s.amount) || 0)
    })
    const labels = Object.keys(grouped).sort()
    return {
      labels,
      datasets: [
        {
          label: 'Revenue Trend',
          data: labels.map(d => grouped[d]),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          fill: true,
          tension: 0.38,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        }
      ]
    }
  }, [filteredSales])

  // Custom rounded pill bar chart matching reference image
  const departmentSales = useMemo(() => {
    const grouped = {}
    filteredSales.forEach(s => {
      const key = s.dept || 'Walk-in'
      grouped[key] = (grouped[key] || 0) + (Number(s.amount) || 0)
    })
    const labels = Object.keys(grouped)
    const colors = ['#10b981', '#94a3b8', '#6366f1', '#f97316', '#3b82f6', '#ec4899']

    return {
      labels,
      datasets: [{
        label: 'Sales Revenue',
        data: Object.values(grouped),
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderRadius: 8,
        barThickness: 28,
      }]
    }
  }, [filteredSales])

  const expenseCategories = useMemo(() => {
    const grouped = {}
    filteredExpenses.forEach(e => {
      const key = e.cat || 'Uncategorised'
      grouped[key] = (grouped[key] || 0) + (Number(e.amount) || 0)
    })
    return {
      labels: Object.keys(grouped),
      datasets: [{
        label: 'Expense Allocation',
        data: Object.values(grouped),
        backgroundColor: ['#f43f5e', '#f97316', '#eab308', '#06b6d4', '#8b5cf6', '#3b82f6'],
        borderWidth: 0,
      }]
    }
  }, [filteredExpenses])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 12,
        cornerRadius: 10,
        titleFont: { size: 12, weight: 'bold', family: 'Plus Jakarta Sans' },
        bodyFont: { size: 12, family: 'Plus Jakarta Sans' },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || ''
            if (label) label += ': '
            const val = context.parsed.y ?? context.parsed
            if (val !== null && val !== undefined) {
              label += 'KSh ' + Number(val).toLocaleString()
            }
            return label
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Plus Jakarta Sans' }, color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: {
          font: { size: 10, family: 'Plus Jakarta Sans' },
          color: '#94a3b8',
          callback: (value) => value >= 1000 ? (value / 1000) + 'k' : value
        }
      }
    }
  }

  const periodLabels = {
    all: 'All Time Overview',
    daily: 'Last 24 Hours',
    weekly: 'Last 7 Days',
    monthly: 'Last Month',
    yearly: 'Last Year',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Executive Header Banner ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Executive Dashboard
            </h1>
            <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              {activeBranch === 'All' ? 'All Branches' : `${activeBranch} Branch`}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time shop metrics, financial performance analysis, and recent activity logs.
          </p>
        </div>

        {/* Date Filter Pill */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white dark:bg-[#10172a] border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <Calendar size={15} className="text-slate-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer p-0 pr-2"
            style={{ backgroundImage: 'none' }}
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">All Time Overview</option>
            <option value="daily" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Last 24 Hours</option>
            <option value="weekly" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Last 7 Days</option>
            <option value="monthly" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Last Month</option>
            <option value="yearly" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Last Year</option>
          </select>
        </div>
      </div>

      {/* ── 4 Executive KPI Cards matching mockup ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Total Revenue */}
        <div className="card flex flex-col justify-between hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Total Revenue
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2 tracking-tight">
                KSh {(stats.totalSales || 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{filteredSales.length} transactions</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 shadow-sm">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
              <ArrowUpRight size={13} />
              +12.4%
            </span>
            <span className="text-[11px] text-slate-400 font-medium">vs last period</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="card flex flex-col justify-between hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Total Expenses
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-500 dark:text-rose-400 mt-2 tracking-tight">
                KSh {(stats.totalExpenses || 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{filteredExpenses.length} vouchers</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Receipt size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50">
              <ArrowDownRight size={13} />
              +3.1%
            </span>
            <span className="text-[11px] text-slate-400 font-medium">vs last period</span>
          </div>
        </div>

        {/* Net Balance */}
        <div className="card flex flex-col justify-between hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Net Balance
              </p>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight ${(stats.netBalance || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                KSh {(stats.netBalance || 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {stats.netBalance >= 0 ? 'Positive Cashflow' : 'Deficit'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
              <ArrowUpRight size={13} />
              +8.7%
            </span>
            <span className="text-[11px] text-slate-400 font-medium">vs last period</span>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="card flex flex-col justify-between hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Profit Margin
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-2 tracking-tight">
                {stats.profitMargin}%
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Revenue efficiency</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Percent size={18} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
              <ArrowUpRight size={13} />
              +2.3%
            </span>
            <span className="text-[11px] text-slate-400 font-medium">vs last period</span>
          </div>
        </div>
      </div>

      {/* ── Charts Grid ── */}
      {hasData ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Revenue Trend Over Time */}
            <div className="card lg:col-span-2">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="section-title mb-0">Revenue Trend</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Daily revenue performance over time</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {periodLabels[period]}
                </span>
              </div>
              <div className="h-64 sm:h-72 w-full pt-2">
                {filteredSales.length > 0
                  ? <Line data={salesByDate} options={chartOptions} />
                  : <EmptyChart label="No sales recorded in this period" />}
              </div>
            </div>

            {/* Sales Breakdown by Channel */}
            <div className="card">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="section-title mb-0">Sales by Channel</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Revenue breakdown by channel</p>
                </div>
              </div>
              <div className="h-64 sm:h-72 w-full pt-2">
                {filteredSales.length > 0
                  ? <Bar data={departmentSales} options={chartOptions} />
                  : <EmptyChart label="No channel breakdown recorded" />}
              </div>
            </div>
          </div>

          {/* ── Activity Feed & Quick Stats Widget ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Recent Activity List */}
            <div className="lg:col-span-2 card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="section-title mb-0">Recent Activity</h3>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                  View all
                </span>
              </div>

              <div className="space-y-2.5">
                {[...filteredSales, ...filteredExpenses]
                  .sort((a, b) => (toDateStr(b.date) > toDateStr(a.date) ? 1 : -1))
                  .slice(0, 5)
                  .map((item, idx) => {
                    const isSale = !!item.dept
                    return (
                      <div
                        key={`${item.id || idx}-${item.date}`}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isSale ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}>
                            {isSale ? <CheckCircle2 size={18} /> : <Receipt size={18} />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white truncate">
                              {item.desc || (isSale ? `Sale: ${item.dept}` : `Expense: ${item.cat}`)}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {toDateStr(item.date)} · {isSale ? item.dept : item.cat}
                            </p>
                          </div>
                        </div>
                        <div className={`text-xs sm:text-sm font-black whitespace-nowrap pl-2 ${
                          isSale ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                        }`}>
                          {isSale ? '+' : '-'}KSh {(Number(item.amount) || 0).toLocaleString()}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Quick Stats Widget matching reference mockup */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="section-title mb-0">Quick Stats</h3>
                <span className="text-xs text-slate-400 font-medium">This month</span>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Users size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Clients</span>
                  </div>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {(data.clients || []).length}
                  </span>
                </div>

                {activeBranch !== 'iGift' && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Briefcase size={16} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Design Projects</span>
                    </div>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {(Array.isArray(data.designs) ? data.designs : []).filter(d => d.status === 'In Progress').length}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Truck size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Suppliers</span>
                  </div>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {(data.suppliers || []).length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <Boxes size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Inventory Alerts</span>
                  </div>
                  <span className="text-base font-black text-rose-500">
                    {(Array.isArray(data.inventory) ? data.inventory : []).filter(i => (Number(i.quantity) || 0) <= (Number(i.reorderLevel) || 0)).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="card p-12 text-center bg-white dark:bg-[#10172a] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Sparkles size={28} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeBranch === 'iGift' ? 'iGift Shop Ready For Transactions' : 'No Dashboard Records Found'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              As you record sales, expenses, and inventory activities, this dashboard will update automatically in real-time.
            </p>
          </div>
          {period !== 'all' && (
            <button
              onClick={() => setPeriod('all')}
              className="btn-primary"
            >
              View All Time Data
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyChart({ label }) {
  return (
    <div className="flex items-center justify-center h-full text-slate-400 text-xs font-semibold italic">
      {label}
    </div>
  )
}
