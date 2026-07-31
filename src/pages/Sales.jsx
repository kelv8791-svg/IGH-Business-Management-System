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
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  RotateCcw,
  Tag,
  PackageCheck
} from 'lucide-react'

export default function Sales() {
  const { data, addSale, updateSale, deleteSale, selectedBranch } = useData()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('')
  const [expandedMonth, setExpandedMonth] = useState(null)

  const activeBranch = user?.role === 'admin' ? selectedBranch : user?.branch
  const isIGH = activeBranch === 'IGH'

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    client: '',
    dept: 'Walk-in',
    amount: '',
    qtySold: '',
    desc: '',
    paymentMethod: 'Cash',
    paymentRef: '',
    paymentStatus: 'Paid',
    source: 'Direct Sale',
    handedOver: false,
    handedOverDate: '',
    inventory_item_id: ''
  })

  const departments = ['Walk-in', 'Online', 'Referal', 'Client', 'Reception']
  const paymentMethods = ['Cash', 'M-Pesa', 'Bank Transfer', 'Cheque', 'Credit']
  const paymentStatuses = ['Paid', 'Pending', 'Partial']

  const handleOpenModal = (sale = null) => {
    if (sale) {
      setFormData({
        ...sale,
        dept: sale.dept || 'Walk-in',
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
        paymentStatus: 'Paid',
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
      alert('Please enter a valid amount')
      return
    }

    if (isIGH) {
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

  // Sort ascending by date
  const sortedSales = useMemo(() => {
    const list = Array.isArray(data.sales) ? data.sales : []
    return [...list].sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [data.sales])

  // Filter sales
  const filteredSales = useMemo(() => {
    return sortedSales.filter(s => {
      const query = search.toLowerCase()
      const matchSearch = !query || 
        (s.desc || '').toLowerCase().includes(query) ||
        (s.client || '').toLowerCase().includes(query) ||
        (s.paymentRef || '').toLowerCase().includes(query) ||
        (s.dept || '').toLowerCase().includes(query)
      const matchDept = !filterDept || s.dept === filterDept
      const matchStatus = !filterStatus || s.paymentStatus === filterStatus
      const matchMethod = !filterPaymentMethod || s.paymentMethod === filterPaymentMethod
      return matchSearch && matchDept && matchStatus && matchMethod
    })
  }, [sortedSales, search, filterDept, filterStatus, filterPaymentMethod])

  // Top Statistics Calculations
  const stats = useMemo(() => {
    const totalRev = filteredSales.reduce((sum, s) => sum + Number(s.amount || 0), 0)
    const paidRev = filteredSales.reduce((sum, s) => s.paymentStatus === 'Paid' ? sum + Number(s.amount || 0) : sum, 0)
    const pendingCount = filteredSales.filter(s => s.paymentStatus === 'Pending').length
    const avgSale = filteredSales.length > 0 ? totalRev / filteredSales.length : 0

    return {
      totalRev,
      paidRev,
      pendingCount,
      avgSale,
      count: filteredSales.length
    }
  }, [filteredSales])

  // Grouping by Month
  const groupedSales = useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
      const month = new Date(sale.date).toLocaleString('default', { month: 'long', year: 'numeric' })
      if (!acc[month]) acc[month] = { sales: [], total: 0 }
      acc[month].sales.push(sale)
      acc[month].total += Number(sale.amount || 0)
      return acc
    }, {})
  }, [filteredSales])

  const hasActiveFilters = search || filterDept || filterStatus || filterPaymentMethod

  const resetFilters = () => {
    setSearch('')
    setFilterDept('')
    setFilterStatus('')
    setFilterPaymentMethod('')
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Sales Management</h1>
            <span className="px-3 py-1 text-xs font-semibold bg-primary-gold/20 text-primary-gold border border-primary-gold/30 rounded-full">
              {activeBranch} Branch
            </span>
          </div>
          <p className="text-sm text-gray-300 mt-1">
            Record, track, and monitor real-time sales transactions for {activeBranch === 'iGift' ? 'iGift Shop' : 'IGH'}.
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2 py-3 px-5 text-sm font-bold shadow-lg hover:shadow-primary-gold/20 transition-all">
          <Plus size={18} />
          Add Sale
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sales Volume</p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">KSh {stats.totalRev.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">{stats.count} recorded sales</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Collected Revenue</p>
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">KSh {stats.paidRev.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Fully paid transactions</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Sale Ticket</p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">KSh {Math.round(stats.avgSale).toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Per transaction average</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Status</p>
            <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pendingCount}</h3>
            <p className="text-xs text-gray-500 mt-1">Awaiting completion</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search description, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9"
            />
          </div>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="form-input">
            <option value="">All Sale Types</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-input">
            <option value="">All Statuses</option>
            {paymentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterPaymentMethod} onChange={(e) => setFilterPaymentMethod(e.target.value)} className="form-input">
            <option value="">All Payment Methods</option>
            {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
            <span>Showing filtered results ({filteredSales.length} records)</span>
            <button onClick={resetFilters} className="text-primary-gold hover:underline flex items-center gap-1 font-semibold">
              <RotateCcw size={12} />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Table & Accordion View */}
      <div className="space-y-4">
        {Object.entries(groupedSales).length > 0 ? (
          Object.entries(groupedSales).reverse().map(([month, group]) => {
            const isExpanded = expandedMonth === month || Object.entries(groupedSales).length === 1
            return (
              <div key={month} className="space-y-2">
                <button
                  onClick={() => toggleMonth(month)}
                  className="w-full flex justify-between items-center px-5 py-3.5 bg-white dark:bg-gray-800 rounded-xl border-l-4 border-primary-gold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400 group-hover:text-primary-gold transition-colors">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{month}</h2>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      {group.sales.length} sales
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-green-600 dark:text-green-400">
                    KSh {group.total.toLocaleString()}
                  </span>
                </button>
                
                {isExpanded && (
                  <div className="card overflow-x-auto p-0 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-1 duration-200">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80">
                          <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Sale Type</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Description / Ref</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status & Payment</th>
                          {isIGH ? (
                             <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Handed Over</th>
                          ) : (
                             <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Qty Sold</th>
                          )}
                          <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {group.sales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-800 dark:text-gray-200">{sale.date}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                <Tag size={12} className="text-gray-400" />
                                {sale.dept}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                              <div className="font-semibold text-gray-800 dark:text-white truncate">{sale.desc || 'No description'}</div>
                              {sale.client && <div className="text-xs text-gray-400">Client: {sale.client}</div>}
                              {sale.paymentRef && <div className="text-xs text-blue-500 font-mono">Ref: {sale.paymentRef}</div>}
                            </td>
                            <td className="px-6 py-4 text-sm whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold w-fit ${
                                  sale.paymentStatus === 'Paid'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                    : sale.paymentStatus === 'Pending'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                }`}>
                                  {sale.paymentStatus || 'Pending'}
                                </span>
                                <span className="text-xs text-gray-400">{sale.paymentMethod}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm whitespace-nowrap">
                              {isIGH ? (
                                sale.handed_over ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    <PackageCheck size={13} />
                                    Handed Over
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                    Pending Handover
                                  </span>
                                )
                              ) : (
                                sale.qty_sold ? (
                                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    {sale.qty_sold} units
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm font-extrabold text-green-600 dark:text-green-400 whitespace-nowrap">
                              KSh {Number(sale.amount).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleOpenModal(sale)} title="Edit Sale" className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                  <Edit2 size={16} />
                                </button>
                                {user?.role === 'admin' && (
                                  <button onClick={() => deleteSale(sale.id)} title="Delete Sale" className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
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
          /* Genius Clean Slate / Empty State */
          <div className="card p-10 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 space-y-4">
            <div className="w-16 h-16 bg-primary-gold/10 text-primary-gold rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Sparkles size={32} />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {activeBranch === 'iGift' ? 'iGift Sales Database Ready' : 'No Sales Records Found'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeBranch === 'iGift'
                  ? 'All invalid sales records have been cleared as requested. The database is clean and ready for new, verified transactions.'
                  : 'There are no sales matching your filter criteria. Click below to add a new sale.'}
              </p>
            </div>
            <button onClick={() => handleOpenModal()} className="btn-primary inline-flex items-center gap-2 py-3 px-6 text-sm font-bold shadow-lg">
              <Plus size={18} />
              Add First Sale
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Sale Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Edit Sale Record' : 'Record New Sale'}>
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sale Category / Type</label>
              <select
                value={formData.dept}
                onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
                className="form-input"
              >
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount (KSh) *</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="form-input font-bold text-green-600"
                placeholder="e.g. 2500"
                required
              />
            </div>

            {!isIGH ? (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link to Inventory Item</label>
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
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Handed Over</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="checkbox" 
                    checked={!!formData.handedOver} 
                    onChange={(e) => setFormData({ ...formData, handedOver: e.target.checked })} 
                    className="w-4 h-4 text-primary-gold rounded"
                  />
                  <input 
                    type="date" 
                    value={formData.handedOverDate || ''} 
                    onChange={(e) => setFormData({ ...formData, handedOverDate: e.target.value })} 
                    className="form-input text-xs" 
                  />
                </div>
              </div>
            )}

            {!isIGH && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity Sold</label>
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="form-input"
              >
                {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Status</label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                className="form-input"
              >
                {paymentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client Name</label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="form-input"
                placeholder="Client / Customer name..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description / Items</label>
            <textarea
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              className="form-input"
              rows="2"
              placeholder="Sale details, items sold, or service description..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Reference</label>
              <input
                type="text"
                value={formData.paymentRef}
                onChange={(e) => setFormData({ ...formData, paymentRef: e.target.value })}
                className="form-input"
                placeholder="e.g., M-Pesa code QX9..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Source</label>
              <select
                value={formData.source || 'Direct Sale'}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="form-input"
              >
                <option value="Direct Sale">Direct Sale</option>
                <option value="Design Project">Design Project</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="submit" className="btn-success flex-1 py-3 font-bold uppercase tracking-wider shadow-md">
              {editId ? 'Update Sale' : 'Save Sale'}
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
