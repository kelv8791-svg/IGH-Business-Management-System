import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

export default function Expenses() {
  const { data, addExpense, updateExpense, deleteExpense } = useData()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [expandedMonth, setExpandedMonth] = useState(null)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    cat: 'Internet',
    amount: '',
    desc: ''
  })

  const categories = ['Internet', 'Petty Cash', 'Salaries', 'Marketing', 'Rent', 'Other']

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setFormData(expense)
      setEditId(expense.id)
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        cat: 'Internet',
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
      alert('Amount is required')
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

  // Sorting: Chronological order (oldest first as per user's preference for 'asc' in Sales)
  const sortedExpenses = [...data.expenses].sort((a, b) => new Date(a.date) - new Date(b.date))

  const filteredExpenses = sortedExpenses.filter(e => {
    const query = search.toLowerCase()
    const matchSearch = (e.desc || '').toLowerCase().includes(query) ||
                       (e.cat || '').toLowerCase().includes(query)
    const matchCat = !filterCat || e.cat === filterCat
    return matchSearch && matchCat
  })

  // Grouping by Month
  const groupedExpenses = filteredExpenses.reduce((acc, expense) => {
    const month = new Date(expense.date).toLocaleString('default', { month: 'long', year: 'numeric' })
    if (!acc[month]) acc[month] = { expenses: [], total: 0 }
    acc[month].expenses.push(expense)
    acc[month].total += Number(expense.amount)
    return acc
  }, {})

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const categoryTotals = {}
  data.expenses.forEach(e => {
    categoryTotals[e.cat] = (categoryTotals[e.cat] || 0) + Number(e.amount)
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Expenses Management</h1>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search by description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
        />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="form-input">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
          <span className="font-bold text-red-600">KSh {totalFiltered.toLocaleString()}</span>
        </div>
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map(cat => (
          <div key={cat} className="card text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{cat}</p>
            <p className="text-lg font-bold text-red-600">KSh {(categoryTotals[cat] || 0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Table with Monthly Grouping */}
      <div className="space-y-4">
        {Object.entries(groupedExpenses).length > 0 ? (
          Object.entries(groupedExpenses).reverse().map(([month, group]) => {
            const isExpanded = expandedMonth === month
            return (
              <div key={month} className="space-y-2">
                <button
                  onClick={() => toggleMonth(month)}
                  className="w-full flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-red-500 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400 group-hover:text-red-500 transition-colors">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{month}</h2>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                      {group.expenses.length} expenses
                    </span>
                  </div>
                  <span className="text-sm font-bold text-red-600">
                    KSh {group.total.toLocaleString()}
                  </span>
                </button>
                
                {isExpanded && (
                  <div className="card overflow-x-auto p-0 animate-in fade-in slide-in-from-top-1 duration-200">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.expenses.map((expense) => (
                          <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 text-sm whitespace-nowrap">{expense.date}</td>
                            <td className="px-6 py-4 text-sm font-medium">{expense.cat}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{expense.desc}</td>
                            <td className="px-6 py-4 text-sm font-bold text-red-600">KSh {Number(expense.amount).toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm text-right flex justify-end gap-2">
                              <button onClick={() => handleOpenModal(expense)} className="text-blue-600 hover:text-blue-900 p-1">
                                <Edit2 size={16} />
                              </button>
                              {user?.role === 'admin' && (
                                <button onClick={() => deleteExpense(expense.id)} className="text-red-600 hover:text-red-900 p-1">
                                  <Trash2 size={16} />
                                </button>
                              )}
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
          <div className="card p-8 text-center text-gray-600 dark:text-gray-400">No expense records found</div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Edit Expense' : 'Add New Expense'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date*</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category*</label>
              <select
                value={formData.cat}
                onChange={(e) => setFormData({ ...formData, cat: e.target.value })}
                className="form-input"
                required
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount (KSh)*</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="form-input"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              className="form-input"
              rows="3"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-success flex-1">Save Expense</button>
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
