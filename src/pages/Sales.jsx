import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

export default function Sales() {
  const { data, addSale, updateSale, deleteSale, selectedBranch } = useData()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedMonth, setExpandedMonth] = useState(null)

  const activeBranch = user?.role === 'admin' ? selectedBranch : user?.branch
  const isIGH = activeBranch === 'IGH'

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    client: '',
    dept: 'Reception',
    amount: '',
    qtySold: '',
    desc: '',
    paymentMethod: 'Cash',
    paymentRef: '',
    paymentStatus: 'Pending',
    source: 'Direct Sale',
    handedOver: false,
    handedOverDate: '',
    inventory_item_id: ''
  })

  const departments = ['Walk-in', 'Online', 'Referal', 'Client']
  const paymentMethods = ['Cash', 'M-Pesa', 'Bank Transfer', 'Cheque', 'Credit']
  const paymentStatuses = ['Paid', 'Pending', 'Partial']

  const handleOpenModal = (sale = null) => {
    if (sale) {
      setFormData({
        ...sale,
        qtySold: sale.qty_sold || '',
        handedOver: !!sale.handed_over,
        handedOverDate: sale.handed_over_date || '',
        inventory_item_id: sale.inventory_item_id || ''
      })
      setEditId(sale.id)
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        client: '',
        dept: 'Walk-in',
        amount: '',
        qtySold: '',
        desc: '',
        paymentMethod: 'Cash',
        paymentRef: '',
        paymentStatus: 'Pending',
        source: 'Direct Sale',
        handedOver: false,
        handedOverDate: '',
        inventory_item_id: ''
      })
      setEditId(null)
    }
    setIsOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.amount) {
      alert('Please fill the amount')
      return
    }

    if (isIGH) {
      // Restore IGH specific Handed Over confirmation logic
      if (editId) {
        const prev = data.sales.find(s => s.id === editId)
        if (prev && !prev.handed_over && formData.handedOver) {
          if (!window.confirm('Marking this sale as handed over will also mark the linked design as handed over. Continue?')) {
            return
          }
        }
      } else if (formData.handedOver) {
        if (!window.confirm('Marking this new sale as handed over will mark the linked design as handed over (if linked). Continue?')) return
      }
    }
    
    if (editId) {
      updateSale(editId, formData)
    } else {
      addSale(formData)
    }
    setIsOpen(false)
  }

  const toggleMonth = (month) => {
    setExpandedMonth(prev => prev === month ? null : month)
  }

  // Sorting: Ascending order of date as requested
  const sortedSales = [...data.sales].sort((a, b) => new Date(a.date) - new Date(b.date))

  const filteredSales = sortedSales.filter(s => {
    const matchSearch = (s.desc || '').toLowerCase().includes(search.toLowerCase())
    const matchDept = !filterDept || s.dept === filterDept
    const matchStatus = !filterStatus || s.paymentStatus === filterStatus
    return matchSearch && matchDept && matchStatus
  })

  // Grouping by Month
  const groupedSales = filteredSales.reduce((acc, sale) => {
    const month = new Date(sale.date).toLocaleString('default', { month: 'long', year: 'numeric' })
    if (!acc[month]) acc[month] = { sales: [], total: 0 }
    acc[month].sales.push(sale)
    acc[month].total += Number(sale.amount)
    return acc
  }, {})

  const totalFiltered = filteredSales.reduce((sum, s) => sum + Number(s.amount), 0)

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
          placeholder="Search by description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
        />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="form-input">
          <option value="">All Sale Types</option>
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

      {/* Table with Monthly Grouping */}
      <div className="space-y-4">
        {Object.entries(groupedSales).length > 0 ? (
          Object.entries(groupedSales).reverse().map(([month, group]) => {
            const isExpanded = expandedMonth === month
            return (
              <div key={month} className="space-y-2">
                <button
                  onClick={() => toggleMonth(month)}
                  className="w-full flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-primary-gold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400 group-hover:text-primary-gold transition-colors">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{month}</h2>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                      {group.sales.length} sales
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    KSh {group.total.toLocaleString()}
                  </span>
                </button>
                
                {isExpanded && (
                  <div className="card overflow-x-auto p-0 animate-in fade-in slide-in-from-top-1 duration-200">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                          {isIGH ? (
                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Handed Over</th>
                          ) : (
                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                          )}
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.sales.map((sale) => (
                          <tr key={sale.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 text-sm whitespace-nowrap">{sale.date}</td>
                            <td className="px-6 py-4 text-sm font-medium">{sale.dept}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{sale.desc}</td>
                            <td className="px-6 py-4 text-sm">
                              {isIGH ? (
                                sale.handed_over ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Handed</span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">No</span>
                                )
                              ) : (
                                sale.qty_sold || '-'
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-green-600">KSh {Number(sale.amount).toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm text-right flex justify-end gap-2">
                              <button onClick={() => handleOpenModal(sale)} className="text-blue-600 hover:text-blue-900 p-1">
                                <Edit2 size={16} />
                              </button>
                              {user?.role === 'admin' && (
                                <button onClick={() => deleteSale(sale.id)} className="text-red-600 hover:text-red-900 p-1">
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
          <div className="card p-8 text-center text-gray-600 dark:text-gray-400">No sales records found</div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Edit Sale' : 'Add New Sale'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date*</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sale Type</label>
              <select
                value={formData.dept}
                onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
                className="form-input"
              >
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Amount (KSh)*</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="form-input"
                required
              />
            </div>
            {!isIGH && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Link to Inventory Item</label>
                <select
                  value={formData.inventory_item_id}
                  onChange={(e) => setFormData({ ...formData, inventory_item_id: e.target.value })}
                  className="form-input text-blue-600 font-medium"
                >
                  <option value="">Not linked</option>
                  {data.inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Stock: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isIGH ? (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Handed Over</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="checkbox" 
                    checked={!!formData.handedOver} 
                    onChange={(e) => setFormData({ ...formData, handedOver: e.target.checked })} 
                  />
                  <input 
                    type="date" 
                    value={formData.handedOverDate || ''} 
                    onChange={(e) => setFormData({ ...formData, handedOverDate: e.target.value })} 
                    className="form-input" 
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Quantity Sold</label>
                <input
                  type="number"
                  value={formData.qtySold}
                  onChange={(e) => setFormData({ ...formData, qtySold: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 5"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="form-input"
              >
                {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Payment Status</label>
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
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
            <textarea
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              className="form-input"
              rows="2"
              placeholder="Sale details..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Payment Reference</label>
            <input
              type="text"
              value={formData.paymentRef}
              onChange={(e) => setFormData({ ...formData, paymentRef: e.target.value })}
              className="form-input"
              placeholder="e.g., M-Pesa code"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Source</label>
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
            <button type="submit" className="btn-success flex-1 py-3 font-bold uppercase tracking-wider">Save Sale</button>
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1 py-3 font-bold uppercase tracking-wider">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
