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
  const { data, selectedBranch, setSelectedBranch } = useData()
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
          borderColor: '#F97316',
          backgroundColor: 'rgba(249,115,22,0.06)',
          fill: true,
          tension: 0.38,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#F97316',
          pointBorderColor: '#FFFFFF',
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
    const colors = ['#F97316', '#E8AB3C', '#14243B', '#526E99', '#8B97A6']

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
        backgroundColor: ['#F97316', '#ea6b0a', '#c2570a', '#555', '#383838', '#242424'],
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
        backgroundColor: '#182A42',
        borderColor: '#E3E8EF',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        titleColor: '#FFFFFF',
        bodyColor: '#CBD5E1',
        titleFont: { size: 12, weight: 'bold', family: 'Inter' },
        bodyFont: { size: 12, family: 'Inter' },
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
        ticks: { font: { size: 11, family: 'Inter' }, color: '#69778A' }
      },
      y: {
        grid: { color: '#E3E8EF' },
        ticks: {
          font: { size: 10, family: 'Inter' },
          color: '#69778A',
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
    <div className="space-y-6 animate-fade-in max-w-[1312px] mx-auto">
      {/* ── Page Heading (Figma: Page heading) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-[#E3E8EF]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#182A42] leading-tight">
              Business Overview
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full border shadow-sm ${
              activeBranch === 'All'
                ? 'bg-sky-50 text-sky-800 border-sky-300'
                : activeBranch === 'iGift'
                ? 'bg-purple-50 text-purple-800 border-purple-300'
                : 'bg-orange-50 text-orange-900 border-orange-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                activeBranch === 'All' ? 'bg-sky-500' : activeBranch === 'iGift' ? 'bg-purple-500' : 'bg-orange-500'
              }`} />
              {activeBranch === 'All' ? 'All Branches (Consolidated)' : (activeBranch === 'iGift' ? 'iGift Shop' : 'IGH Branch')}
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-[#69778A]">
            Real-time financial performance metrics, shop turnover, and operational activity.
          </p>
        </div>

        {/* Page Actions (Figma: Action buttons) */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-[#182A42] bg-white border border-[#E3E8EF] hover:bg-[#F8FAFC] transition-colors shadow-sm"
          >
            Export View
          </button>
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-[#182A42] bg-[#E8AB3C] hover:bg-[#d99d30] transition-colors shadow-sm cursor-default">
            Active System
          </div>
        </div>
      </div>

      {/* ── Scope and Data Context (Figma: Scope and data context) ── */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          
          {/* Branch selector (Admin only) (Figma: Branch selector) */}
          {user?.role === 'admin' ? (
            <div className="inline-flex items-center p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl gap-1 shadow-sm max-w-full overflow-x-auto">
              {[
                { id: 'All',   label: 'All Branches', fullLabel: 'All Branches (Consolidated)', color: 'text-sky-700' },
                { id: 'IGH',   label: 'IGH Branch',   fullLabel: 'IGH Branch',                  color: 'text-orange-700' },
                { id: 'iGift', label: 'iGift Shop',   fullLabel: 'iGift Shop',                  color: 'text-purple-700' },
              ].map(b => {
                const active = selectedBranch === b.id
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBranch(b.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      active
                        ? `bg-white ${b.color} shadow-sm border border-slate-200/80`
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <span className="sm:hidden">{b.label}</span>
                    <span className="hidden sm:inline">{b.fullLabel}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold shadow-sm ${
              activeBranch === 'iGift'
                ? 'bg-purple-50 text-purple-800 border-purple-300'
                : 'bg-orange-50 text-orange-900 border-orange-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${activeBranch === 'iGift' ? 'bg-purple-500' : 'bg-orange-500'}`} />
              Branch: {activeBranch === 'iGift' ? 'iGift Shop' : 'IGH Branch'}
            </div>
          )}

          {/* Period options (Figma: Period options) */}
          <div className="inline-flex items-center p-1 bg-[#F1F5F9] rounded-lg gap-1 overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'daily', label: '24 Hours' },
              { id: 'weekly', label: '7 Days' },
              { id: 'monthly', label: '30 Days' },
              { id: 'yearly', label: '1 Year' },
            ].map(p => {
              const active = period === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-[#14243B] text-white shadow-sm'
                      : 'text-[#69778A] hover:text-[#182A42]'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Data Fidelity Notice (Figma: Data fidelity notice) */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[#FFF6E5] border border-[#FDE68A] rounded-lg text-[11px] sm:text-xs text-[#8C5B0D]">
          <span className="font-semibold flex-shrink-0">Data Integrity:</span>
          <span className="truncate">All records, historic transactions, and branch figures synchronized in real time with 0 alterations.</span>
        </div>
      </div>

      {/* ── Key Metrics Cards (Figma: Key metrics) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Revenue */}
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#334155]">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F97316] flex items-center justify-center">
              <ArrowUpRight size={17} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-xs font-bold text-[#64748B]">KSh</span>
            <span className="text-2xl sm:text-[28px] font-black text-[#0F172A] tracking-tight leading-none">
              {(stats.totalSales || 0).toLocaleString()}
            </span>
          </div>
          <p className="text-xs font-semibold text-[#475569] mt-2">
            {filteredSales.length} sales orders recorded
          </p>
        </div>

        {/* Metric 2: Total Expenses */}
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#334155]">Total Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight size={17} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-xs font-bold text-[#64748B]">KSh</span>
            <span className="text-2xl sm:text-[28px] font-black text-rose-600 tracking-tight leading-none">
              {(stats.totalExpenses || 0).toLocaleString()}
            </span>
          </div>
          <p className="text-xs font-semibold text-[#475569] mt-2">
            {filteredExpenses.length} expense vouchers logged
          </p>
        </div>

        {/* Metric 3: Net Balance */}
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#334155]">Net Balance</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              (stats.netBalance || 0) >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-rose-600'
            }`}>
              <DollarSign size={17} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-xs font-bold text-[#64748B]">KSh</span>
            <span className={`text-2xl sm:text-[28px] font-black tracking-tight leading-none ${
              (stats.netBalance || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}>
              {(stats.netBalance || 0).toLocaleString()}
            </span>
          </div>
          <p className="text-xs font-semibold text-[#475569] mt-2">
            {(stats.netBalance || 0) >= 0 ? 'Net positive operational cashflow' : 'Operating deficit in period'}
          </p>
        </div>

        {/* Metric 4: Profit Margin */}
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#334155]">Profit Margin</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F97316] flex items-center justify-center">
              <Percent size={17} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl sm:text-[28px] font-black text-[#0F172A] tracking-tight leading-none">
              {stats.profitMargin}%
            </span>
          </div>
          <p className="text-xs font-semibold text-[#475569] mt-2">
            Revenue retained after operating expenses
          </p>
        </div>
      </div>

      {/* ── Charts Grid ── */}
      {hasData ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue Trend Over Time */}
            <div className="card lg:col-span-2">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A]">Revenue Trend</h3>
                  <p className="text-xs font-semibold text-[#475569]">Daily revenue performance over time</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#F1F5F9] text-[#14243B] border border-[#CBD5E1]">
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
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A]">Sales by Channel</h3>
                  <p className="text-xs font-semibold text-[#475569]">Revenue breakdown by department</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Activity List */}
            <div className="card lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A]">Recent Activity</h3>
                  <p className="text-xs font-semibold text-[#475569]">Latest recorded sales and business transactions</p>
                </div>
                <span className="text-xs font-black text-[#F97316] cursor-pointer hover:underline">View all</span>
              </div>

              <div className="space-y-2">
                {[...filteredSales, ...filteredExpenses]
                  .sort((a, b) => (toDateStr(b.date) > toDateStr(a.date) ? 1 : -1))
                  .slice(0, 5)
                  .map((item, idx) => {
                    const isSale = !!item.dept
                    return (
                      <div
                        key={`${item.id || idx}-${item.date}`}
                        className="flex items-center justify-between p-3 rounded-lg border border-[#EDF2F7] hover:bg-[#F8FAFC] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSale ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                          }`}>
                            {isSale ? <CheckCircle2 size={16} /> : <Receipt size={16} />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs sm:text-sm text-[#182A42] truncate">
                              {item.desc || (isSale ? `Sale: ${item.dept}` : `Expense: ${item.cat}`)}
                            </p>
                            <p className="text-[11px] text-[#69778A] mt-0.5">
                              {toDateStr(item.date)} · {isSale ? item.dept : item.cat}
                            </p>
                          </div>
                        </div>
                        <div className={`text-xs sm:text-sm font-bold whitespace-nowrap pl-2 ${
                          isSale ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {isSale ? '+' : '-'}KSh {(Number(item.amount) || 0).toLocaleString()}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Quick Stats Widget */}
            <div className="card flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A]">Operational Totals</h3>
                  <p className="text-xs font-semibold text-[#475569]">Active entities in scope</p>
                </div>
                <span className="text-xs font-bold text-[#14243B] bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 rounded">Live</span>
              </div>

              <div className="space-y-2.5">
                {[{
                  icon: Users,    label: 'Registered Clients', value: (data.clients || []).length, color: '#182A42'
                }, activeBranch !== 'iGift' ? {
                  icon: Briefcase, label: 'Design Projects (Active)', value: (Array.isArray(data.designs) ? data.designs : []).filter(d => d.status === 'In Progress').length, color: '#182A42'
                } : null, {
                  icon: Truck,    label: 'Active Suppliers', value: (data.suppliers || []).length, color: '#182A42'
                }, {
                  icon: Boxes,    label: 'Inventory Alerts', value: (Array.isArray(data.inventory) ? data.inventory : []).filter(i => (Number(i.quantity) || 0) <= (Number(i.reorderLevel) || 0)).length, color: '#DC2626'
                }].filter(Boolean).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-[#EDF2F7] bg-[#F8FAFC]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center bg-[#EEF3FA] text-[#526E99]">
                        <item.icon size={15} />
                      </div>
                      <span className="text-xs font-medium text-[#69778A]">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="bg-white border-2 border-dashed border-[#E3E8EF] p-12 text-center rounded-2xl space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto bg-orange-50 text-[#F97316]">
            <Sparkles size={28} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-semibold text-[#182A42]">
              {activeBranch === 'iGift' ? 'iGift Shop Ready For Transactions' : 'No Dashboard Records Found'}
            </h3>
            <p className="text-xs sm:text-sm text-[#69778A]">
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
    <div className="flex items-center justify-center h-full text-xs font-semibold italic text-[#8B97A6]">
      {label}
    </div>
  )
}
