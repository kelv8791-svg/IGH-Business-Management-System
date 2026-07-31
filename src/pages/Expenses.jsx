import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Tag, 
  RotateCcw, 
  Sparkles,
  PieChart
} from 'lucide-react'

export default function Expenses() {
  const { data, addExpense, updateExpense, deleteExpense, selectedBranch } = useData()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [expandedMonth, setExpandedMonth] = useState(null)

  const activeBranch = user?.role === 'admin' ? selectedBranch : user?.branch

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    cat: 'Petty Cash',
    amount: '',
    desc: ''
  })

  const categories = ['Petty Cash', 'Internet', 'Salaries', 'Marketing', 'Rent', 'Utilities', 'Maintenance', 'Other']

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setFormData(expense)
      setEditId(expense.id)
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        cat: 'Petty Cash',
        amount: '',
        desc: ''
      })
      setEditId(null)
    }
    setIsOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.amount) {
      alert('Please fill in the expense amount')
      return
    }

    if (editId) {
      updateExpense(editId, formData)
    } else {
      addExpense(formData)
    }
    setIsOpen(false)
  }

  const toggleMonth = (month) => {
    setExpandedMonth(prev => prev === month ? null : month)
  }

  // Sorted ascending by date
  const sortedExpenses = useMemo(() => {
    const list = Array.isArray(data.expenses) ? data.expenses : []
    return [...list].sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [data.expenses])

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return sortedExpenses.filter(e => {
      const query = search.toLowerCase()
      const matchSearch = !query ||
        (e.desc || '').toLowerCase().includes(query) ||
        (e.cat || '').toLowerCase().includes(query)
      const matchCat = !filterCat || e.cat === filterCat
      return matchSearch && matchCat
    })
  }, [sortedExpenses, search, filterCat])

  // Metrics
  const stats = useMemo(() => {
    const totalExpenditure = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const avgExpense = filteredExpenses.length > 0 ? totalExpenditure / filteredExpenses.length : 0
    const count = filteredExpenses.length

    return {
      totalExpenditure,
      avgExpense,
      count
    }
  }, [filteredExpenses])

  const categoryTotals = useMemo(() => {
    const totals = {}
    ;(data.expenses || []).forEach(e => {
      totals[e.cat] = (totals[e.cat] || 0) + Number(e.amount || 0)
    })
    return totals
  }, [data.expenses])

  // Monthly Grouping
  const groupedExpenses = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => {
      const month = new Date(expense.date).toLocaleString('default', { month: 'long', year: 'numeric' })
      if (!acc[month]) acc[month] = { expenses: [], total: 0 }
      acc[month].expenses.push(expense)
      acc[month].total += Number(expense.amount || 0)
      return acc
    }, {})
  }, [filteredExpenses])

  const resetFilters = () => {
    setSearch('')
    setFilterCat('')
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Expenses Management</h1>
            <span className="px-3 py-1 text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
              {activeBranch} Branch
            </span>
          </div>
          <p className="text-sm text-gray-300 mt-1">
            Track operational costs, overhead expenditures, and categorical spending.
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2 py-3 px-5 text-sm font-bold shadow-lg hover:shadow-primary-gold/20 transition-all">
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Operational Expenses</p>
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">KSh {stats.totalExpenditure.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">{stats.count} recorded expense vouchers</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Average Expense Voucher</p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">KSh {Math.round(stats.avgExpense).toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Average payout per entry</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
            <Receipt size={24} />
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expense Categories</p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">{categories.length} Active</h3>
            <p className="text-xs text-gray-500 mt-1">Categorical cost centers</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
            <PieChart size={24} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search description or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9"
            />
          </div>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="form-input">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-750 rounded-lg">
            <span className="text-xs font-semibold text-gray-500 uppercase">Filtered Total:</span>
            <span className="font-extrabold text-red-600">KSh {stats.totalExpenditure.toLocaleString()}</span>
          </div>
        </div>

        {(search || filterCat) && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
            <span>Showing filtered expense records</span>
            <button onClick={resetFilters} className="text-primary-gold hover:underline flex items-center gap-1 font-semibold">
              <RotateCcw size={12} />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Category Breakdown Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {categories.map(cat => (
          <div key={cat} className="card p-3 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-[11px] font-semibold text-gray-500 truncate">{cat}</p>
            <p className="text-sm font-extrabold text-red-600 dark:text-red-400 mt-0.5">KSh {(categoryTotals[cat] || 0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Table & Accordion View */}
      <div className="space-y-4">
        {Object.entries(groupedExpenses).length > 0 ? (
          Object.entries(groupedExpenses).reverse().map(([month, group]) => {
            const isExpanded = expandedMonth === month || Object.entries(groupedExpenses).length === 1
            return (
              <div key={month} className="space-y-2">
                <button
                  onClick={() => toggleMonth(month)}
                  className="w-full flex justify-between items-center px-5 py-3.5 bg-white dark:bg-gray-800 rounded-xl border-l-4 border-red-500 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400 group-hover:text-red-500 transition-colors">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{month}</h2>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      {group.expenses.length} expenses
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-red-600 dark:text-red-400">
                    KSh {group.total.toLocaleString()}
                  </span>
                </button>
                
                {isExpanded && (
                  <div className="card overflow-x-auto p-0 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-1 duration-200">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80">
                          <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {group.expenses.map((expense) => (
                          <tr key={expense.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-800 dark:text-gray-200">{expense.date}</td>
                            <td className="px-6 py-4 text-sm whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                <Tag size={12} className="text-gray-400" />
                                {expense.cat}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                              {expense.desc || 'No description provided'}
                            </td>
                            <td className="px-6 py-4 text-sm font-extrabold text-red-600 dark:text-red-400 whitespace-nowrap">
                              KSh {Number(expense.amount).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                              <div className="flex justify-end gap-1.5">
                                <button onClick={() => handleOpenModal(expense)} title="Edit Expense" className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                  <Edit2 size={16} />
                                </button>
                                {user?.role === 'admin' && (
                                  <button onClick={() => deleteExpense(expense.id)} title="Delete Expense" className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="card p-10 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 space-y-4">
            <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Sparkles size={28} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">No Expense Vouchers Found</h3>
              <p className="text-xs text-gray-500">There are no operational expense records matching your active filters.</p>
            </div>
            <button onClick={() => handleOpenModal()} className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-xs font-bold shadow-lg">
              <Plus size={16} />
              Add Expense Record
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Edit Expense Voucher' : 'Record New Expense'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expense Category *</label>
              <select
                value={formData.cat}
                onChange={(e) => setFormData({ ...formData, cat: e.target.value })}
                className="form-input"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount (KSh) *</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="form-input font-bold text-red-600"
              placeholder="e.g. 4500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description / Details</label>
            <textarea
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              className="form-input"
              rows="3"
              placeholder="Expense breakdown or payout purpose..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="submit" className="btn-success flex-1 py-3 font-bold uppercase tracking-wider shadow-md">
              {editId ? 'Update Expense' : 'Save Expense'}
            </button>
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1 py-3 font-bold uppercase tracking-wider">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
