import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../App'
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
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Info } from 'lucide-react'

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

export default function Dashboard() {
  const { data } = useData()
  const { user } = useAuth()
  const [period, setPeriod] = useState('monthly')
  const [selectedBranch, setSelectedBranch] = useState('All')

  const getDateRange = (p) => {
    const now = new Date()
    let startDate = new Date(now)

    switch (p) {
      case 'daily':
        // last 24 hours
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      default:
        startDate.setMonth(startDate.getMonth() - 1)
    }

    return {
      start: startDate,
      end: now,
    }
  }

  const dateRange = getDateRange(period)

  const formatDate = (d) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const filteredSales = useMemo(() => {
    return data.sales.filter(s => {
      const sd = new Date(s.date)
      const matchesPeriod = sd >= dateRange.start && sd <= dateRange.end
      const matchesBranch = selectedBranch === 'All' || s.branch === selectedBranch
      return matchesPeriod && matchesBranch
    })
  }, [data.sales, dateRange, selectedBranch])

  const filteredExpenses = useMemo(() => {
    return data.expenses.filter(e => {
      const ed = new Date(e.date)
      const matchesPeriod = ed >= dateRange.start && ed <= dateRange.end
      const matchesBranch = selectedBranch === 'All' || e.branch === selectedBranch
      return matchesPeriod && matchesBranch
    })
  }, [data.expenses, dateRange, selectedBranch])

  const stats = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, s) => sum + (s.amount || 0), 0)
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const netBalance = totalSales - totalExpenses
    const profitMargin = totalSales > 0 ? ((netBalance / totalSales) * 100).toFixed(2) : 0

    return { totalSales, totalExpenses, netBalance, profitMargin }
  }, [filteredSales, filteredExpenses])

  // Chart data
  const salesByDate = useMemo(() => {
    const grouped = {}
    filteredSales.forEach(s => {
      const d = new Date(s.date)
      const key = formatDate(d)
      grouped[key] = (grouped[key] || 0) + (s.amount || 0)
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
      grouped[s.dept] = (grouped[s.dept] || 0) + (s.amount || 0)
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
      grouped[e.cat] = (grouped[e.cat] || 0) + (e.amount || 0)
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
    animations: {
      tension: {
        duration: 600,
        easing: 'easeInOutQuart'
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12,
            weight: 500,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += 'KSh ' + context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome to IGH Business Management System</p>
        </div>
        </div>
        <div className="flex items-start gap-2">
          {/* Branch Switcher for Admin */}
          {user?.role === 'admin' && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="form-input w-40"
            >
              <option value="All">All Branches</option>
              <option value="IGH">IGH</option>
              <option value="iGift">iGift</option>
            </select>
          )}
          
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="form-input w-40"
          >
            <option value="daily">Last 24 Hours</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last Month</option>
            <option value="yearly">Last Year</option>
          </select>
          <span title={"Periods:\nLast 24 Hours — show entries from the previous 24 hours.\nLast 7 Days — show entries from the previous 7 days.\nLast Month — show entries from the previous month.\nLast Year — show entries from the previous year."} className="mt-1">
            <Info size={16} className="opacity-60" />
          </span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Showing: {formatDate(dateRange.start)} — {formatDate(dateRange.end)}</div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={`KSh ${stats.totalSales.toLocaleString()}`}
          icon={DollarSign}
          color="blue"
          trend={5.2}
        />
        <StatCard
          title="Total Expenses"
          value={`KSh ${stats.totalExpenses.toLocaleString()}`}
          icon={TrendingDown}
          color="red"
          trend={-2.1}
        />
        <StatCard
          title="Net Balance"
          value={`KSh ${stats.netBalance.toLocaleString()}`}
          icon={DollarSign}
          color="green"
          trend={stats.netBalance > 0 ? 3.2 : -1.5}
        />
        <StatCard
          title="Profit Margin"
          value={`${stats.profitMargin}%`}
          icon={TrendingUp}
          color="gold"
          trend={0.8}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Sales Trend</h3>
          <Line data={salesByDate} options={chartOptions} />
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Sales by Department</h3>
          <Bar data={departmentSales} options={chartOptions} />
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Department Breakdown</h3>
          <Pie data={departmentSales} options={chartOptions} />
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Expense Categories</h3>
          <Doughnut data={expenseCategories} options={chartOptions} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {[...filteredSales, ...filteredExpenses]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 5)
              .map(item => (
                <div key={`${item.id}-${item.date}`} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {item.dept || item.cat}
                    </p>
                    <p className="text-sm text-gray-500">{item.date}</p>
                  </div>
                  <div className={`font-semibold ${item.dept ? 'text-green-600' : 'text-red-600'}`}>
                    {item.dept ? '+' : '-'}KSh {item.amount.toLocaleString()}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Clients</p>
              <p className="text-2xl font-bold text-blue-600">{data.clients.length}</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Projects</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.designs.filter(d => d.status === 'In Progress').length}
              </p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Suppliers</p>
              <p className="text-2xl font-bold text-orange-600">{data.suppliers.length}</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">
                {data.inventory.filter(i => i.quantity <= i.reorderLevel).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, trend }) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    red: 'bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    green: 'bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    gold: 'bg-yellow-50 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
  }

  return (
    <div className={`card ${colorClasses[color]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <Icon size={32} className="opacity-50" />
      </div>
      <div className="mt-4">
        {trend > 0 ? (
          <span className="text-xs font-semibold text-green-600">↑ {trend}% from last period</span>
        ) : (
          <span className="text-xs font-semibold text-red-600">↓ {Math.abs(trend)}% from last period</span>
        )}
      </div>
    </div>
  )
}
