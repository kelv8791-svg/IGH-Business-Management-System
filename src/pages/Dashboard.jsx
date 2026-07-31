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
  AlertCircle, 
  Info, 
  PackageOpen, 
  Sparkles,
  Users,
  Truck,
  Boxes,
  Briefcase
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

  // Chart dataset helpers
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
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }
      ]
    }
  }, [filteredSales])

  const departmentSales = useMemo(() => {
    const grouped = {}
    filteredSales.forEach(s => {
      const key = s.dept || 'Uncategorised'
      grouped[key] = (grouped[key] || 0) + (Number(s.amount) || 0)
    })
    return {
      labels: Object.keys(grouped),
      datasets: [{
        label: 'Sales Revenue',
        data: Object.values(grouped),
        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'],
        borderRadius: 8,
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
        backgroundColor: ['#ef4444', '#f97316', '#eab308', '#06b6d4', '#6366f1'],
        borderRadius: 8,
      }]
    }
  }, [filteredExpenses])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    animation: { duration: 500 },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          padding: 16,
          font: { size: 11, weight: 600 },
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
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
    }
  }

  const periodLabel = {
    daily: 'Last 24 Hours',
    weekly: 'Last 7 Days',
    monthly: 'Last Month',
    yearly: 'Last Year',
    all: 'All Time',
  }[period]

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Executive Dashboard</h1>
            <span className="px-3 py-1 text-xs font-semibold bg-primary-gold/20 text-primary-gold border border-primary-gold/30 rounded-full">
              {activeBranch} Branch
            </span>
          </div>
          <p className="text-sm text-gray-300 mt-1">
            Real-time shop metrics, financial performance analysis, and recent activity logs.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl backdrop-blur-sm">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-transparent border-none text-xs sm:text-sm font-bold text-white focus:ring-0 cursor-pointer p-1"
          >
            <option value="all" className="text-gray-900">All Time Overview</option>
            <option value="daily" className="text-gray-900">Last 24 Hours</option>
            <option value="weekly" className="text-gray-900">Last 7 Days</option>
            <option value="monthly" className="text-gray-900">Last Month</option>
            <option value="yearly" className="text-gray-900">Last Year</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sales Revenue</p>
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">KSh {stats.totalSales.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">{filteredSales.length} total transactions</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Expenses</p>
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">KSh {stats.totalExpenses.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">{filteredExpenses.length} expense vouchers</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Cash Balance</p>
            <h3 className={`text-xl font-bold mt-1 ${stats.netBalance >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-600'}`}>
              KSh {stats.netBalance.toLocaleString()}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{stats.netBalance >= 0 ? 'Positive Cashflow' : 'Deficit Cashflow'}</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Profit Margin</p>
            <h3 className="text-xl font-bold text-primary-gold mt-1">{stats.profitMargin}%</h3>
            <p className="text-xs text-gray-500 mt-1">Revenue efficiency margin</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
            <Sparkles size={24} />
          </div>
        </div>
      </div>

      {/* Fresh Clean Slate Banner for iGift when sales are reset */}
      {!hasData && (
        <div className="card p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 space-y-4">
          <div className="w-16 h-16 bg-primary-gold/10 text-primary-gold rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Sparkles size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              {activeBranch === 'iGift' ? 'iGift Shop Ready For Fresh Sales Data' : 'No Dashboard Data Recorded'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeBranch === 'iGift'
                ? 'All previous invalid sales records have been cleared. As you feed fresh, verified sales entries into the Sales module, your dashboard charts will automatically populate in real-time.'
                : 'There are no sales or expense records found for the selected period.'}
            </p>
          </div>
          {period !== 'all' && (
            <button
              onClick={() => setPeriod('all')}
              className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-xs font-bold shadow-lg"
            >
              View All Time Data
            </button>
          )}
        </div>
      )}

      {/* Charts Grid */}
      {hasData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Revenue Trend Over Time</h3>
              {filteredSales.length > 0
                ? <Line data={salesByDate} options={chartOptions} />
                : <EmptyChart label="No sales recorded in this period" />}
            </div>
            <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Sales Breakdown by Channel</h3>
              {filteredSales.length > 0
                ? <Bar data={departmentSales} options={chartOptions} />
                : <EmptyChart label="No sales recorded in this period" />}
            </div>
            <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Department Distribution</h3>
              {filteredSales.length > 0
                ? <Pie data={departmentSales} options={chartOptions} />
                : <EmptyChart label="No sales recorded in this period" />}
            </div>
            <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Expense Categories Breakdown</h3>
              {filteredExpenses.length > 0
                ? <Doughnut data={expenseCategories} options={chartOptions} />
                : <EmptyChart label="No expenses recorded in this period" />}
            </div>
          </div>

          {/* Activity Feed & Quick Module Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Recent Financial Transactions</h3>
              <div className="space-y-2.5">
                {[...filteredSales, ...filteredExpenses]
                  .sort((a, b) => (toDateStr(b.date) > toDateStr(a.date) ? 1 : -1))
                  .slice(0, 7)
                  .map((item, idx) => (
                    <div key={`${item.id || idx}-${item.date}`} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-750 rounded-xl hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-bold text-sm text-gray-800 dark:text-white">
                          {item.desc || item.dept || item.cat || 'Transaction'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{toDateStr(item.date)} • {item.dept ? `Sale (${item.dept})` : `Expense (${item.cat})`}</p>
                      </div>
                      <div className={`font-extrabold text-sm ${item.dept ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {item.dept ? '+' : '-'}KSh {(Number(item.amount) || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Module Highlights</h3>
              <div className="space-y-3">
                <div className="p-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users size={20} className="text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Registered Clients</p>
                      <p className="text-lg font-bold text-blue-600">{(data.clients || []).length}</p>
                    </div>
                  </div>
                </div>

                {activeBranch !== 'iGift' && (
                  <div className="p-3.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Briefcase size={20} className="text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Active Projects</p>
                        <p className="text-lg font-bold text-purple-600">
                          {(Array.isArray(data.designs) ? data.designs : []).filter(d => d.status === 'In Progress').length}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck size={20} className="text-amber-600" />
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Active Suppliers</p>
                      <p className="text-lg font-bold text-amber-600">{(data.suppliers || []).length}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Boxes size={20} className="text-red-600" />
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Low Stock Inventory Items</p>
                      <p className="text-lg font-bold text-red-600">
                        {(Array.isArray(data.inventory) ? data.inventory : []).filter(i => (Number(i.quantity) || 0) <= (Number(i.reorderLevel) || 0)).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function EmptyChart({ label }) {
  return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-xs font-semibold italic">
      {label}
    </div>
  )
}
