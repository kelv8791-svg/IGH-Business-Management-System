import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../App'
import Modal from '../components/Modal'
import { Plus, Edit2, Trash2 } from 'lucide-react'

export default function Suppliers() {
  const { data, addSupplier, updateSupplier, deleteSupplier, addSupplierExpense, updateSupplierExpense, deleteSupplierExpense } = useData()
  const { user } = useAuth()
  const [tab, setTab] = useState('directory')
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    kra: '',
    credit: ''
  })

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    type: 'Large Format',
    amount: '',
    remarks: ''
  })

  const expenseTypes = ['Large Format', 'DTF Tshirts', 'Tshirt Material', '3D Cutting', 'Signage Materials', 'Other']

  // Supplier Directory handlers
  const handleOpenSupplierModal = (supplier = null) => {
    if (supplier) {
      setSupplierForm(supplier)
      setEditId(supplier.id)
    } else {
      setSupplierForm({ name: '', contact: '', phone: '', email: '', kra: '', credit: '' })
      setEditId(null)
    }
    setIsOpen(true)
  }

  const handleSupplierSubmit = (e) => {
    e.preventDefault()
    if (!supplierForm.name) {
      alert('Supplier name is required')
      return
    }

    if (editId) {
      updateSupplier(editId, supplierForm)
    } else {
      addSupplier(supplierForm)
    }
    setIsOpen(false)
  }

  const filteredSuppliers = data.suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  const getSupplierTotal = (supplierId) => {
    return data.supplierExpenses
      .filter(e => e.supplier === supplierId)
      .reduce((sum, e) => sum + e.amount, 0)
  }

  // Supplier Expenses handlers
  const handleOpenExpenseModal = (expense = null) => {
    if (expense) {
      setExpenseForm(expense)
      setEditId(expense.id)
    } else {
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        supplier: '',
        type: 'Large Format',
        amount: '',
        remarks: ''
      })
      setEditId(null)
    }
    setIsOpen(true)
  }

  const handleExpenseSubmit = (e) => {
    e.preventDefault()
    if (!expenseForm.supplier || !expenseForm.amount) {
      alert('Please fill all required fields')
      return
    }

    if (editId) {
      updateSupplierExpense(editId, expenseForm)
    } else {
      addSupplierExpense(expenseForm)
    }
    setIsOpen(false)
  }

  const filteredExpenses = data.supplierExpenses.filter(e =>
    e.type.toLowerCase().includes(search.toLowerCase())
  )

  const getSupplierName = (id) => {
    return data.suppliers.find(s => s.id === id)?.name || 'Unknown'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Suppliers Management</h1>
        <button onClick={() => tab === 'directory' ? handleOpenSupplierModal() : handleOpenExpenseModal()} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          {tab === 'directory' ? 'Add Supplier' : 'Add Expense'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => { setTab('directory'); setSearch(''); setEditId(null); }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'directory'
              ? 'border-primary-gold text-primary-gold'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Supplier Directory
        </button>
        <button
          onClick={() => { setTab('expenses'); setSearch(''); setEditId(null); }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'expenses'
              ? 'border-primary-gold text-primary-gold'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Supplier Expenses
        </button>
      </div>

      {/* Supplier Directory Tab */}
      {tab === 'directory' && (
        <div className="space-y-4">
          <div className="card">
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Contact</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">KRA</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Credit Limit</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total Spent</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier, idx) => (
                  <tr key={supplier.id} className={`border-b border-gray-200 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
                    <td className="px-6 py-3 text-sm font-medium">{supplier.name}</td>
                    <td className="px-6 py-3 text-sm">{supplier.contact}</td>
                    <td className="px-6 py-3 text-sm">{supplier.phone}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{supplier.email}</td>
                    <td className="px-6 py-3 text-sm">{supplier.kra}</td>
                    <td className="px-6 py-3 text-sm">KSh {supplier.credit?.toLocaleString() || '0'}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-orange-600">KSh {getSupplierTotal(supplier.id).toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm flex gap-2">
                      <button onClick={() => handleOpenSupplierModal(supplier)} className="btn-secondary p-2">
                        <Edit2 size={16} />
                      </button>
                        {user?.role === 'admin' && (
                          <button onClick={() => deleteSupplier(supplier.id)} className="btn-danger p-2">
                            <Trash2 size={16} />
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSuppliers.length === 0 && (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">No suppliers found</div>
            )}
          </div>
        </div>
      )}

      {/* Supplier Expenses Tab */}
      {tab === 'expenses' && (
        <div className="space-y-4">
          <div className="card">
            <input
              type="text"
              placeholder="Search by expense type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Supplier</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Remarks</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense, idx) => (
                  <tr key={expense.id} className={`border-b border-gray-200 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
                    <td className="px-6 py-3 text-sm">{expense.date}</td>
                    <td className="px-6 py-3 text-sm font-medium">{getSupplierName(expense.supplier)}</td>
                    <td className="px-6 py-3 text-sm">{expense.type}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-orange-600">KSh {expense.amount.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{expense.remarks}</td>
                    <td className="px-6 py-3 text-sm flex gap-2">
                      <button onClick={() => handleOpenExpenseModal(expense)} className="btn-secondary p-2">
                        <Edit2 size={16} />
                      </button>
                      {user?.role === 'admin' && (
                        <button onClick={() => deleteSupplierExpense(expense.id)} className="btn-danger p-2">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredExpenses.length === 0 && (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">No supplier expenses found</div>
            )}
          </div>
        </div>
      )}

      {/* Modal for Suppliers */}
      {tab === 'directory' && (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Edit Supplier' : 'Add New Supplier'}>
          <form onSubmit={handleSupplierSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supplier Name*</label>
              <input
                type="text"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Person</label>
                <input
                  type="text"
                  value={supplierForm.contact}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">KRA PIN</label>
                <input
                  type="text"
                  value={supplierForm.kra}
                  onChange={(e) => setSupplierForm({ ...supplierForm, kra: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Credit Limit (KSh)</label>
              <input
                type="number"
                value={supplierForm.credit}
                onChange={(e) => setSupplierForm({ ...supplierForm, credit: parseFloat(e.target.value) })}
                className="form-input"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn-success flex-1">Save Supplier</button>
              <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal for Expenses */}
      {tab === 'expenses' && (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Edit Expense' : 'Add New Expense'}>
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date*</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supplier*</label>
                <select
                  value={expenseForm.supplier}
                  onChange={(e) => setExpenseForm({ ...expenseForm, supplier: parseInt(e.target.value) || '' })}
                  className="form-input"
                  required
                >
                  <option value="">Select Supplier</option>
                  {data.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expense Type</label>
                <select
                  value={expenseForm.type}
                  onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}
                  className="form-input"
                >
                  {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount (KSh)*</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) })}
                  className="form-input"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Remarks</label>
              <textarea
                value={expenseForm.remarks}
                onChange={(e) => setExpenseForm({ ...expenseForm, remarks: e.target.value })}
                className="form-input"
                rows="2"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn-success flex-1">Save Expense</button>
              <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
