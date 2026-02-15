import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../App'
import Modal from '../components/Modal'
import { Plus, Edit2, Trash2 } from 'lucide-react'

export default function Sales() {
  const { data, addSale, updateSale, deleteSale } = useData()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    client: '',
    dept: 'Reception',
    amount: '',
    desc: '',
    paymentMethod: 'Cash',
    paymentRef: '',
    paymentStatus: 'Pending',
    source: 'Direct Sale'
  })

  const departments = ['Reception', 'Branding', 'Designing', '3D Design & Signage', 'Marketing']
  const paymentMethods = ['Cash', 'M-Pesa', 'Bank Transfer', 'Cheque', 'Credit']
  const paymentStatuses = ['Paid', 'Pending', 'Partial']

  const handleOpenModal = (sale = null) => {
    if (sale) {
      setFormData(sale)
      setEditId(sale.id)
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        client: '',
        dept: 'Reception',
        amount: '',
        desc: '',
        paymentMethod: 'Cash',
        paymentRef: '',
        paymentStatus: 'Pending',
        source: 'Direct Sale'
      })
      setEditId(null)
    }
    setIsOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.client || !formData.amount) {
      alert('Please fill all required fields')
      return
    }

    if (editId) {
      updateSale(editId, formData)
    } else {
      addSale(formData)
    }
    setIsOpen(false)
  }

  const filteredSales = data.sales.filter(s => {
    const matchSearch = s.client.toLowerCase().includes(search.toLowerCase()) ||
                       s.desc.toLowerCase().includes(search.toLowerCase())
    const matchDept = !filterDept || s.dept === filterDept
    const matchStatus = !filterStatus || s.paymentStatus === filterStatus
    return matchSearch && matchDept && matchStatus
  })

  const totalFiltered = filteredSales.reduce((sum, s) => sum + s.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Sales Management</h1>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Sale
        </button>
      </div>

      {/* Filters */}
      <div className="card grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search by client or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
        />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="form-input">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-input">
          <option value="">All Statuses</option>
          {paymentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
          <span className="font-bold text-green-600">KSh {totalFiltered.toLocaleString()}</span>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Client</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Department</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Description</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Source</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Payment Method</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale, idx) => (
              <tr key={sale.id} className={`border-b border-gray-200 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
                <td className="px-6 py-3 text-sm">{sale.date}</td>
                <td className="px-6 py-3 text-sm font-medium">{sale.client}</td>
                <td className="px-6 py-3 text-sm">{sale.dept}</td>
                <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{sale.desc}</td>
                <td className="px-6 py-3 text-sm font-semibold text-green-600">KSh {sale.amount.toLocaleString()}</td>
                <td className="px-6 py-3 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    sale.source === 'Design Project' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {sale.source || 'Direct Sale'}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    sale.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                    sale.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {sale.paymentStatus}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm">{sale.paymentMethod}</td>
                <td className="px-6 py-3 text-sm flex gap-2">
                  <button onClick={() => handleOpenModal(sale)} className="btn-secondary p-2">
                    <Edit2 size={16} />
                  </button>
                  {user?.role === 'admin' && (
                    <button onClick={() => deleteSale(sale.id)} className="btn-danger p-2">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSales.length === 0 && (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">No sales found</div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Edit Sale' : 'Add New Sale'}>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client*</label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
              <select
                value={formData.dept}
                onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
                className="form-input"
              >
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount (KSh)*</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="form-input"
              >
                {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Status</label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                className="form-input"
              >
                {paymentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Reference</label>
            <input
              type="text"
              value={formData.paymentRef}
              onChange={(e) => setFormData({ ...formData, paymentRef: e.target.value })}
              className="form-input"
              placeholder="e.g., Cheque #, M-Pesa code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source</label>
            <select
              value={formData.source || 'Direct Sale'}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="form-input"
            >
              <option value="Direct Sale">Direct Sale</option>
              <option value="Design Project">Design Project</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-success flex-1">Save Sale</button>
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
