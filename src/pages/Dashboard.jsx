import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
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
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react'

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
  const [period, setPeriod] = useState('monthly')

  const getDateRange = () => {
    const now = new Date()
    let startDate
    
    switch (period) {
      case 'daily':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'weekly':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'monthly':
        startDate = new Date(now)
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'yearly':
        startDate = new Date(now)
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      default:
        startDate = new Date(now)
        startDate.setMonth(startDate.getMonth() - 1)
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    }
  }

  const dateRange = getDateRange()

  const stats = useMemo(() => {
    const filteredSales = data.sales.filter(s => s.date >= dateRange.start && s.date <= dateRange.end)
    const filteredExpenses = data.expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end)

    const totalSales = filteredSales.reduce((sum, s) => sum + (s.amount || 0), 0)
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const netBalance = totalSales - totalExpenses
    const profitMargin = totalSales > 0 ? ((netBalance / totalSales) * 100).toFixed(2) : 0

    return { totalSales, totalExpenses, netBalance, profitMargin }
  }, [data, dateRange])

  // Chart data
  const salesByDate = useMemo(() => {
    const grouped = {}
    data.sales.forEach(s => {
      const date = s.date
      if (!grouped[date]) grouped[date] = 0
      grouped[date] += s.amount
    })
    
    return {
      labels: Object.keys(grouped).sort().slice(-30),
      datasets: [
        {
          label: 'Sales Trend',
          data: Object.keys(grouped).sort().slice(-30).map(d => grouped[d]),
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
  }, [data])

  const departmentSales = useMemo(() => {
    const grouped = {}
    data.sales.forEach(s => {
      grouped[s.dept] = (grouped[s.dept] || 0) + s.amount
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
  }, [data])

  const expenseCategories = useMemo(() => {
    const grouped = {}
    data.expenses.forEach(e => {
      grouped[e.cat] = (grouped[e.cat] || 0) + e.amount
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
  }, [data])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
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
            {[...data.sales, ...data.expenses]
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
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    gold: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600',
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
