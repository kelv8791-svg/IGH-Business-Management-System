import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../App'
import Modal from '../components/Modal'
import { Plus, Edit2, Trash2 } from 'lucide-react'

export default function Expenses() {
  const { data, addExpense, updateExpense, deleteExpense } = useData()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    cat: 'Office',
    amount: '',
    desc: ''
  })

  const categories = ['Office', 'Utilities', 'Salaries', 'Marketing', 'Rent', 'Other']

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setFormData(expense)
      setEditId(expense.id)
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        cat: 'Office',
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

  const filteredExpenses = data.expenses.filter(e => {
    const matchSearch = e.desc.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || e.cat === filterCat
    return matchSearch && matchCat
  })

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
  const categoryTotals = {}
  data.expenses.forEach(e => {
    categoryTotals[e.cat] = (categoryTotals[e.cat] || 0) + e.amount
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

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Description</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((expense, idx) => (
              <tr key={expense.id} className={`border-b border-gray-200 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
                <td className="px-6 py-3 text-sm">{expense.date}</td>
                <td className="px-6 py-3 text-sm font-medium">{expense.cat}</td>
                <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{expense.desc}</td>
                <td className="px-6 py-3 text-sm font-semibold text-red-600">KSh {expense.amount.toLocaleString()}</td>
                <td className="px-6 py-3 text-sm flex gap-2">
                  <button onClick={() => handleOpenModal(expense)} className="btn-secondary p-2">
                    <Edit2 size={16} />
                  </button>
                  {user?.role === 'admin' && (
                    <button onClick={() => deleteExpense(expense.id)} className="btn-danger p-2">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredExpenses.length === 0 && (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">No expenses found</div>
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
