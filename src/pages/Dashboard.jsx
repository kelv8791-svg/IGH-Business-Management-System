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
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Info, PackageOpen } from 'lucide-react'

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

// Timezone-safe date comparison: compare YYYY-MM-DD strings directly
// This avoids the UTC-midnight parse issue where new Date("2026-07-29")
// becomes 2026-07-28T21:00:00 in EAT (UTC+3), making today's records fail
const toDateStr = (dateInput) => {
  if (!dateInput) return ''
  // If it's already a YYYY-MM-DD string, return as-is
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput
  }
  // Otherwise parse and format
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

  // Reset period to 'all' whenever the active branch changes
  // so switching from IGH to iGift always shows all available data
  useEffect(() => {
    setPeriod('all')
  }, [activeBranch])

  const dateRange = useMemo(() => getDateRange(period), [period])

  // Timezone-safe date filtering: compare YYYY-MM-DD strings
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
    const profitMargin = totalSales > 0 ? ((netBalance / totalSales) * 100).toFixed(2) : 0
    return { totalSales, totalExpenses, netBalance, profitMargin }
  }, [filteredSales, filteredExpenses])

  const hasData = filteredSales.length > 0 || filteredExpenses.length > 0

  // Chart data
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
          label: 'Sales Trend',
          data: labels.map(d => grouped[d]),
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#a855f7',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 7,
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
        label: 'Sales by Department',
        data: Object.values(grouped),
        backgroundColor: [
          '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87'
        ],
        borderRadius: 8,
        borderSkipped: false,
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
        label: 'Expenses by Category',
        data: Object.values(grouped),
        backgroundColor: [
          '#3b82f6', '#1e40af', '#1e3a8a', '#0c4a6e', '#082f49'
        ],
        borderRadius: 8,
      }]
    }
  }, [filteredExpenses])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      duration: 600,
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          padding: 20,
          font: { size: 12, weight: 500 },
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        displayColors: true,
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
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {activeBranch ? `${activeBranch} Shop Overview` : 'IGH Business Management System'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="form-input w-44"
          >
            <option value="all">All Time</option>
            <option value="daily">Last 24 Hours</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last Month</option>
            <option value="yearly">Last Year</option>
          </select>
          <span
            title={
              'Periods:\nAll Time — show all entries ever recorded.\nLast 24 Hours — show entries from the previous 24 hours.\nLast 7 Days — show entries from the previous 7 days.\nLast Month — show entries from the previous month.\nLast Year — show entries from the previous year.'
            }
            className="mt-1"
          >
            <Info size={16} className="opacity-60" />
          </span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 w-full sm:w-auto">
          Showing: <span className="font-medium">{periodLabel}</span>
          {period !== 'all' && (
            <span className="ml-1 text-xs opacity-70">
              ({dateRange.start} — {dateRange.end})
            </span>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={`KSh ${stats.totalSales.toLocaleString()}`}
          icon={DollarSign}
          color="blue"
          count={filteredSales.length}
          countLabel="transactions"
        />
        <StatCard
          title="Total Expenses"
          value={`KSh ${stats.totalExpenses.toLocaleString()}`}
          icon={TrendingDown}
          color="red"
          count={filteredExpenses.length}
          countLabel="entries"
        />
        <StatCard
          title="Net Balance"
          value={`KSh ${stats.netBalance.toLocaleString()}`}
          icon={DollarSign}
          color={stats.netBalance >= 0 ? 'green' : 'red'}
          positive={stats.netBalance >= 0}
        />
        <StatCard
          title="Profit Margin"
          value={`${stats.profitMargin}%`}
          icon={TrendingUp}
          color="gold"
          positive={Number(stats.profitMargin) >= 0}
        />
      </div>

      {/* Empty State */}
      {!hasData && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <PackageOpen size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No data found for {activeBranch || 'this branch'}
          </h3>
          <p className="text-gray-500 dark:text-gray-500 max-w-md">
            {period !== 'all'
              ? `No sales or expenses recorded in the selected period (${periodLabel}). Try switching to "All Time" to see all records.`
              : 'No sales or expenses have been recorded yet for this branch. Start by adding sales or expense entries.'}
          </p>
          {period !== 'all' && (
            <button
              onClick={() => setPeriod('all')}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              View All Time Data
            </button>
          )}
        </div>
      )}

      {/* Charts Grid — only render when there's data */}
      {hasData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Sales Trend</h3>
              {filteredSales.length > 0
                ? <Line data={salesByDate} options={chartOptions} />
                : <EmptyChart label="No sales in this period" />}
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Sales by Department</h3>
              {filteredSales.length > 0
                ? <Bar data={departmentSales} options={chartOptions} />
                : <EmptyChart label="No sales in this period" />}
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Department Breakdown</h3>
              {filteredSales.length > 0
                ? <Pie data={departmentSales} options={chartOptions} />
                : <EmptyChart label="No sales in this period" />}
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Expense Categories</h3>
              {filteredExpenses.length > 0
                ? <Doughnut data={expenseCategories} options={chartOptions} />
                : <EmptyChart label="No expenses in this period" />}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                {[...filteredSales, ...filteredExpenses]
                  .sort((a, b) => (toDateStr(b.date) > toDateStr(a.date) ? 1 : -1))
                  .slice(0, 8)
                  .map((item, idx) => (
                    <div key={`${item.id || idx}-${item.date}`} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {item.dept || item.cat || 'Entry'}
                        </p>
                        <p className="text-sm text-gray-500">{toDateStr(item.date)}</p>
                      </div>
                      <div className={`font-semibold ${item.dept ? 'text-green-600' : 'text-red-600'}`}>
                        {item.dept ? '+' : '-'}KSh {(Number(item.amount) || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                {filteredSales.length === 0 && filteredExpenses.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">No recent transactions</p>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Clients</p>
                  <p className="text-2xl font-bold text-blue-600">{(data.clients || []).length}</p>
                </div>
                {activeBranch !== 'iGift' && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Projects</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(Array.isArray(data.designs) ? data.designs : []).filter(d => d.status === 'In Progress').length}
                    </p>
                  </div>
                )}
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Suppliers</p>
                  <p className="text-2xl font-bold text-orange-600">{(data.suppliers || []).length}</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(Array.isArray(data.inventory) ? data.inventory : []).filter(i => i.quantity <= i.reorderLevel).length}
                  </p>
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
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
      {label}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, count, countLabel, positive }) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    red: 'bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    green: 'bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    gold: 'bg-yellow-50 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
  }

  return (
    <div className={`card ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <Icon size={32} className="opacity-50" />
      </div>
      <div className="mt-4">
        {count !== undefined ? (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {count} {countLabel}
          </span>
        ) : positive !== undefined ? (
          positive
            ? <span className="text-xs font-semibold text-green-600">↑ Positive balance</span>
            : <span className="text-xs font-semibold text-red-600">↓ Negative balance</span>
        ) : null}
      </div>
    </div>
  )
}
