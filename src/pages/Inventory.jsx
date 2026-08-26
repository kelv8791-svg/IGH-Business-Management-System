import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  ArrowUpDown, 
  FileText,
  Search,
  Package,
  Boxes,
  DollarSign,
  TrendingDown,
  RotateCcw,
  Sparkles,
  Tag
} from 'lucide-react'

export default function Inventory() {
  const { data, addInventoryItem, updateInventoryItem, deleteInventoryItem, getInventoryStatus, addStockTransaction, addInventoryCategory, selectedBranch } = useData()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [isMovementOpen, setIsMovementOpen] = useState(false)
  const [adjustItem, setAdjustItem] = useState(null)
  const [movementItem, setMovementItem] = useState(null)
  
  const activeBranch = user?.role === 'admin' ? selectedBranch : user?.branch

  const [adjustData, setAdjustData] = useState({
    type: 'RESTOCK',
    quantity: 0,
    reason: 'Restock',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: '',
    reorderLevel: '',
    unitPrice: '',
    supplier: ''
  })

  // Dynamic categories from DataContext
  const categoriesList = (data.inventoryCategories || []).map(c => c.name)

  const handleOpenModal = (item = null) => {
    if (item) {
      setFormData(item)
      setEditId(item.id)
    } else {
      setFormData({
        name: '',
        sku: '',
        category: '',
        quantity: '',
        reorderLevel: '',
        unitPrice: '',
        supplier: ''
      })
      setEditId(null)
    }
    setIsOpen(true)
  }

  const handleOpenAdjust = (item) => {
    setAdjustItem(item)
    setAdjustData({
      type: 'RESTOCK',
      quantity: 0,
      reason: 'Restock',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    })
    setIsAdjustOpen(true)
  }

  const handleOpenMovement = (item) => {
    setMovementItem(item)
    setIsMovementOpen(true)
  }

  const handleAdjustSubmit = async (e) => {
    e.preventDefault()
    if (!adjustItem || adjustData.quantity <= 0) {
      alert('Please enter a valid quantity')
      return
    }

    try {
      const quantityChange = adjustData.type === 'RESTOCK' 
        ? adjustData.quantity 
        : -adjustData.quantity

      await addStockTransaction({
        item_id: adjustItem.id,
        quantity_change: quantityChange,
        transaction_type: adjustData.type,
        reason: adjustData.reason,
        notes: adjustData.notes,
        date: adjustData.date,
        created_by: user?.username || 'unknown'
      })
      
      setIsAdjustOpen(false)
    } catch (err) {
      console.error('Error adjusting stock:', err)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || formData.quantity === '' || !formData.unitPrice) {
      alert('Please fill all required fields')
      return
    }

    if (editId) {
      updateInventoryItem(editId, formData)
    } else {
      addInventoryItem(formData)
    }
    setIsOpen(false)
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    try {
      await addInventoryCategory(newCategoryName.trim())
      setNewCategoryName('')
      setIsCategoryModalOpen(false)
      if (isOpen) setFormData(prev => ({ ...prev, category: newCategoryName.trim() }))
    } catch (err) {
      if (err.code === '23505') {
        alert("Category already exists!")
      }
    }
  }

  const filteredItems = useMemo(() => {
    return (data.inventory || []).filter(item => {
      const query = search.toLowerCase()
      const matchSearch = !query ||
        (item.name || '').toLowerCase().includes(query) ||
        (item.sku || '').toLowerCase().includes(query) ||
        (item.category || '').toLowerCase().includes(query)
      const matchCat = !filterCat || item.category === filterCat
      const itemStatus = getInventoryStatus(item.id)
      const matchStatus = !filterStatus || itemStatus === filterStatus
      return matchSearch && matchCat && matchStatus
    })
  }, [data.inventory, search, filterCat, filterStatus, getInventoryStatus])

  const getSupplierName = (id) => {
    return (data.suppliers || []).find(s => Number(s.id) === Number(id))?.name || 'Not assigned'
  }

  const getStatusBadge = (id) => {
    const status = getInventoryStatus(id)
    if (status === 'In Stock') {
      return { label: 'In Stock', icon: CheckCircle, cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200' }
    }
    if (status === 'Low Stock') {
      return { label: 'Low Stock', icon: AlertCircle, cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200' }
    }
    return { label: 'Out of Stock', icon: AlertTriangle, cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200' }
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalValuation = (data.inventory || []).reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0)
    const inStock = (data.inventory || []).filter(i => getInventoryStatus(i.id) === 'In Stock').length
    const lowStock = (data.inventory || []).filter(i => getInventoryStatus(i.id) === 'Low Stock').length
    const outOfStock = (data.inventory || []).filter(i => getInventoryStatus(i.id) === 'Out of Stock').length

    return {
      totalValuation,
      inStock,
      lowStock,
      outOfStock,
      totalCount: (data.inventory || []).length
    }
  }, [data.inventory, getInventoryStatus])

  const resetFilters = () => {
    setSearch('')
    setFilterCat('')
    setFilterStatus('')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Inventory Management</h1>
            <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
              {activeBranch} Branch
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor stock levels, manage reorder thresholds, and track stock movements.
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          {(user?.branch === 'iGift' || user?.role === 'admin') && (
            <button onClick={() => setIsCategoryModalOpen(true)} className="btn-secondary">
              <Plus size={16} />
              Add Category
            </button>
          )}
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <Plus size={16} />
            Add Inventory Item
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-start justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Stock Valuation</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1.5 tracking-tight">KSh {metrics.totalValuation.toLocaleString()}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{metrics.totalCount} active inventory items</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Boxes size={20} />
          </div>
        </div>

        <div className="card flex items-start justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">In Stock SKUs</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5 tracking-tight">{metrics.inStock}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Sufficient inventory levels</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="card flex items-start justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Low Stock Alerts</p>
            <h3 className="text-2xl font-extrabold text-amber-500 dark:text-amber-400 mt-1.5 tracking-tight">{metrics.lowStock}</h3>
            <p className="text-xs text-slate-400 mt-0.5">At or below reorder level</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={20} />
          </div>
        </div>

        <div className="card flex items-start justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Out of Stock</p>
            <h3 className="text-2xl font-extrabold text-rose-500 dark:text-rose-400 mt-1.5 tracking-tight">{metrics.outOfStock}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Needs immediate restock</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search item name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9"
            />
          </div>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="form-input">
            <option value="">All Categories</option>
            {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-input">
            <option value="">All Stock Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-xs font-semibold text-gray-500 uppercase">Filtered Items:</span>
            <span className="font-extrabold text-primary-gold">{filteredItems.length}</span>
          </div>
        </div>

        {(search || filterCat || filterStatus) && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
            <span>Showing filtered results</span>
            <button onClick={resetFilters} className="text-primary-gold hover:underline flex items-center gap-1 font-semibold">
              <RotateCcw size={12} />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Inventory Table */}
      <div className="card overflow-x-auto p-0 rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80">
              <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Item Details</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Reorder Level</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Unit Price</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock Valuation</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredItems.map((item) => {
              const badge = getStatusBadge(item.id)
              const StatusIcon = badge.icon
              const itemValue = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)

              return (
                <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm">
                    <div className="font-bold text-gray-800 dark:text-white">{item.name}</div>
                    {item.sku && <div className="text-xs font-mono text-gray-400">SKU: {item.sku}</div>}
                    <div className="text-xs text-gray-400 mt-0.5">Supplier: {getSupplierName(item.supplier)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      <Tag size={12} className="text-gray-400" />
                      {item.category || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-extrabold text-gray-800 dark:text-gray-200">
                    {item.quantity} units
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {item.reorderLevel ? `${item.reorderLevel} units` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
                    KSh {Number(item.unitPrice || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-600 dark:text-blue-400">
                    KSh {itemValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.cls}`}>
                      <StatusIcon size={13} />
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => handleOpenModal(item)} title="Edit Item" className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleOpenAdjust(item)} title="Adjust Stock" className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                        <ArrowUpDown size={16} />
                      </button>
                      <button onClick={() => handleOpenMovement(item)} title="Stock Movement Log" className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors">
                        <FileText size={16} />
                      </button>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to permanently delete "${item.name}" (Stock: ${item.quantity} units)?`)) {
                              deleteInventoryItem(item.id)
                            }
                          }}
                          title="Delete Item"
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className="p-10 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 space-y-4">
            <div className="w-14 h-14 bg-primary-gold/10 text-primary-gold rounded-full flex items-center justify-center mx-auto">
              <Sparkles size={28} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">No Inventory Items Found</h3>
              <p className="text-xs text-gray-500">There are no inventory items matching your current filters.</p>
            </div>
            <button onClick={() => handleOpenModal()} className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-xs font-bold shadow-lg">
              <Plus size={16} />
              Add Inventory Item
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Item Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Edit Inventory Item' : 'Add Inventory Item'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
                placeholder="e.g. A4 Glossy Photo Paper"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU / Code</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="form-input"
                placeholder="Stock keeping unit..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-input"
              >
                <option value="">Select Category</option>
                {!categoriesList.includes(formData.category) && formData.category && (
                  <option value={formData.category}>{formData.category}</option>
                )}
                {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Supplier</label>
              <select
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="form-input"
              >
                <option value="">Not assigned</option>
                {(data.suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity *</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || '' })}
                className="form-input"
                placeholder="e.g. 50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reorder Level</label>
              <input
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || '' })}
                className="form-input"
                placeholder="e.g. 10"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit Price (KSh) *</label>
              <input
                type="number"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || '' })}
                className="form-input font-bold text-green-600"
                placeholder="e.g. 1200"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="submit" className="btn-success flex-1 py-3 font-bold uppercase tracking-wider shadow-md">Save Item</button>
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1 py-3 font-bold uppercase tracking-wider">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal isOpen={isAdjustOpen} onClose={() => setIsAdjustOpen(false)} title={`Stock Adjustment: ${adjustItem?.name || ''}`}>
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
             <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase">Current Inventory Level</span>
                <span className="text-xl font-extrabold text-blue-600">{adjustItem?.quantity || 0} units</span>
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Adjustment Direction</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${adjustData.type === 'RESTOCK' ? 'bg-green-500 text-white border-green-500 shadow-md' : 'bg-white dark:bg-gray-800 border-gray-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
                onClick={() => setAdjustData({ ...adjustData, type: 'RESTOCK', reason: 'Restock' })}
              >
                + Add Stock (Restock)
              </button>
              <button
                type="button"
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${adjustData.type === 'VARIANCE' ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white dark:bg-gray-800 border-gray-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
                onClick={() => setAdjustData({ ...adjustData, type: 'VARIANCE', reason: 'Damaged' })}
              >
                - Remove Stock (Variance)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date *</label>
              <input
                type="date"
                value={adjustData.date}
                onChange={(e) => setAdjustData({ ...adjustData, date: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                value={adjustData.quantity}
                onChange={(e) => setAdjustData({ ...adjustData, quantity: parseInt(e.target.value) || 0 })}
                className="form-input font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason</label>
            <select
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              className="form-input"
            >
              {adjustData.type === 'RESTOCK' ? (
                <>
                  <option value="Restock">New Purchase / Restock</option>
                  <option value="Return">Customer Return</option>
                  <option value="Correction">Inventory Correction (+)</option>
                  <option value="Other">Other</option>
                </>
              ) : (
                <>
                  <option value="Damaged">Damaged</option>
                  <option value="Spoilt">Spoilt</option>
                  <option value="Expired">Expired</option>
                  <option value="Theft">Theft / Lost</option>
                  <option value="Usage">Internal Usage</option>
                  <option value="Correction">Inventory Correction (-)</option>
                  <option value="Other">Other</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
            <textarea
              value={adjustData.notes}
              onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
              className="form-input"
              placeholder="Optional transaction details..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="submit" className="btn-success flex-1 py-3 font-bold uppercase tracking-wider shadow-md">Confirm Adjustment</button>
            <button type="button" onClick={() => setIsAdjustOpen(false)} className="btn-secondary flex-1 py-3 font-bold uppercase tracking-wider">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Stock Movement Modal */}
      <Modal isOpen={isMovementOpen} onClose={() => setIsMovementOpen(false)} title={`Stock Movement Log: ${movementItem?.name || ''}`}>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {(data.stockTransactions || [])
            .filter(t => Number(t.item_id) === Number(movementItem?.id))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map(trans => (
              <div key={trans.id} className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      trans.transaction_type === 'RESTOCK' ? 'bg-green-100 text-green-700' :
                      trans.transaction_type === 'SALE' ? 'bg-blue-100 text-blue-700' :
                      trans.transaction_type === 'VARIANCE' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {trans.transaction_type}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">{new Date(trans.created_at).toLocaleString()}</span>
                  </div>
                  <span className={`font-extrabold text-sm ${trans.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trans.quantity_change > 0 ? '+' : ''}{trans.quantity_change} units
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">{trans.reason}</p>
                {trans.notes && <p className="text-xs text-gray-500 italic mt-0.5">{trans.notes}</p>}
                <p className="text-[10px] text-gray-400 mt-1 uppercase">Recorded By: {trans.created_by}</p>
              </div>
            ))}
          {(data.stockTransactions || []).filter(t => Number(t.item_id) === Number(movementItem?.id)).length === 0 && (
            <p className="text-center text-xs text-gray-500 py-6">No stock movement logs recorded yet.</p>
          )}
        </div>
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
           <button onClick={() => setIsMovementOpen(false)} className="btn-secondary w-full py-2.5 text-xs font-bold uppercase">Close Log</button>
        </div>
      </Modal>

      {/* Add Category Modal */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Add Inventory Category">
         <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category Name *</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="form-input"
                required
                placeholder="e.g. Branding Materials, Stationeries..."
              />
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button type="submit" className="btn-success flex-1 py-2.5 font-bold uppercase tracking-wider">Save Category</button>
              <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="btn-secondary flex-1 py-2.5 font-bold uppercase tracking-wider">Cancel</button>
            </div>
         </form>
      </Modal>
    </div>
  )
}
