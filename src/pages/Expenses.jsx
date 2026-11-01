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
    desc: '',
    branch: user?.role === 'admin' ? (selectedBranch === 'iGift' ? 'iGift' : 'IGH') : (user?.branch || 'IGH')
  })

  const categories = ['Petty Cash', 'Internet', 'Salaries', 'Marketing', 'Rent', 'Utilities', 'Maintenance', 'Other']

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setFormData({
        ...expense,
        branch: expense.branch || (selectedBranch === 'iGift' ? 'iGift' : 'IGH')
      })
      setEditId(expense.id)
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        cat: 'Petty Cash',
        amount: '',
        desc: '',
        branch: user?.role === 'admin' ? (selectedBranch === 'iGift' ? 'iGift' : 'IGH') : (user?.branch || 'IGH')
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
    <div className="space-y-6 animate-fade-in">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">Expenses Management</h1>
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
          <p className="text-xs sm:text-sm text-[#334155] font-semibold mt-1">
            Track operational costs, overhead expenditures, and categorical spending.
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus size={17} />
          Add Expense Voucher
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-start justify-between">
          <div>
            <p className="text-[12px] font-extrabold text-[#334155] uppercase tracking-wider">Total Expenditure</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1.5 tracking-tight">KSh {(stats.totalExpenditure || 0).toLocaleString()}</h3>
            <p className="text-xs font-semibold text-[#475569] mt-0.5">{(stats.count || 0)} recorded expense vouchers</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={20} />
          </div>
        </div>

        <div className="card flex items-start justify-between">
          <div>
            <p className="text-[12px] font-extrabold text-[#334155] uppercase tracking-wider">Average Voucher</p>
            <h3 className="text-2xl font-black text-[#0F172A] mt-1.5 tracking-tight">KSh {Math.round(stats.avgExpense || 0).toLocaleString()}</h3>
            <p className="text-xs font-semibold text-[#475569] mt-0.5">Average payout per entry</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
            <Receipt size={20} />
          </div>
        </div>

        <div className="card flex items-start justify-between">
          <div>
            <p className="text-[12px] font-extrabold text-[#334155] uppercase tracking-wider">Active Categories</p>
            <h3 className="text-2xl font-black text-blue-700 mt-1.5 tracking-tight">{categories.length} Cost Centers</h3>
            <p className="text-xs font-semibold text-[#475569] mt-0.5">Categorical spending breakdown</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <PieChart size={20} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 bg-white rounded-xl border border-[#CBD5E1] shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-[#334155]" size={16} />
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
          <div className="flex items-center justify-between px-4 py-2 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg">
            <span className="text-xs font-bold text-[#334155] uppercase">Filtered Total:</span>
            <span className="font-black text-rose-600">KSh {(stats.totalExpenditure || 0).toLocaleString()}</span>
          </div>
        </div>

        {(search || filterCat) && (
          <div className="flex justify-between items-center pt-2 border-t border-[#E2E8F0] text-xs font-semibold text-[#334155]">
            <span>Showing filtered expense records</span>
            <button onClick={resetFilters} className="text-[#F97316] hover:underline flex items-center gap-1 font-bold">
              <RotateCcw size={12} />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Category Breakdown Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {categories.map(cat => (
          <div key={cat} className="card p-3 text-center bg-white rounded-xl border border-[#CBD5E1] shadow-sm hover:border-[#F97316] hover:scale-105 transition-all">
            <p className="text-[11px] font-bold text-[#334155] truncate uppercase">{cat}</p>
            <p className="text-sm font-black text-rose-600 mt-0.5">KSh {(categoryTotals[cat] || 0).toLocaleString()}</p>
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
                  className="w-full flex justify-between items-center px-5 py-3.5 bg-white rounded-xl border-l-4 border-rose-500 border border-[#CBD5E1] shadow-sm hover:bg-[#FFF7ED] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-[#69778A] group-hover:text-rose-600 transition-colors">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    <h2 className="text-lg font-black text-[#0F172A] group-hover:text-rose-600 transition-colors">{month}</h2>
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-[#F1F5F9] text-[#14243B] border border-[#CBD5E1] rounded-full">
                      {group.expenses.length} expenses
                    </span>
                  </div>
                  <span className="text-sm font-black text-rose-600">
                    KSh {Number(group.total || 0).toLocaleString()}
                  </span>
                </button>
                
                {isExpanded && (
                  <div className="card overflow-x-auto p-0 rounded-xl border border-[#CBD5E1] animate-in fade-in slide-in-from-top-1 duration-200">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b-2 border-[#CBD5E1] bg-[#F1F5F9]">
                          <th className="px-6 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Date</th>
                          {activeBranch === 'All' && (
                            <th className="px-6 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Branch</th>
                          )}
                          <th className="px-6 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {group.expenses.map((expense) => (
                          <tr key={expense.id} className="transition-all">
                            <td className="px-6 py-4 text-sm font-bold whitespace-nowrap text-[#0F172A]">{expense.date}</td>
                            {activeBranch === 'All' && (
                              <td className="px-6 py-4 text-sm whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  (expense.branch || 'IGH') === 'iGift'
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : 'bg-orange-50 text-orange-900 border-orange-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${(expense.branch || 'IGH') === 'iGift' ? 'bg-purple-500' : 'bg-orange-500'}`} />
                                  {(expense.branch || 'IGH') === 'iGift' ? 'iGift Shop' : 'IGH Branch'}
                                </span>
                              </td>
                            )}
                            <td className="px-6 py-4 text-sm whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-[#EEF3FA] text-[#14243B] border border-[#CBD5E1]">
                                <Tag size={12} className="text-[#F97316]" />
                                {expense.cat}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-[#0F172A] font-semibold max-w-xs truncate">
                              {expense.desc || 'No description provided'}
                            </td>
                            <td className="px-6 py-4 text-sm font-black text-rose-600 whitespace-nowrap">
                              KSh {Number(expense.amount || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                              <div className="flex justify-end gap-1.5">
                                <button onClick={() => handleOpenModal(expense)} title="Edit Expense" className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all hover:scale-110">
                                  <Edit2 size={16} />
                                </button>
                                {user?.role === 'admin' && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete this expense of KSh ${Number(expense.amount || 0).toLocaleString()} (${expense.cat}: ${expense.desc || 'No details'})?`)) {
                                        deleteExpense(expense.id)
                                      }
                                    }}
                                    title="Delete Expense"
                                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-all hover:scale-110"
                                  >
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
          {user?.role === 'admin' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Branch *</label>
              <select
                value={formData.branch || (selectedBranch === 'iGift' ? 'iGift' : 'IGH')}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="form-input font-bold"
              >
                <option value="IGH">IGH Branch (Design & Print)</option>
                <option value="iGift">iGift Shop (Merchandise)</option>
              </select>
            </div>
          )}

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
