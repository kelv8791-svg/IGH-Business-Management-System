import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { Plus, Edit2, Trash2, AlertTriangle, AlertCircle, CheckCircle, ArrowUpDown } from 'lucide-react'

export default function Inventory() {
  const { data, addInventoryItem, updateInventoryItem, deleteInventoryItem, getInventoryStatus, addStockTransaction } = useData()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [adjustItem, setAdjustItem] = useState(null)
  const [adjustData, setAdjustData] = useState({
    type: 'RESTOCK', // RESTOCK, VARIANCE, CORRECTION
    quantity: 0,
    reason: 'Restock',
    notes: ''
  })

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Printing Materials',
    quantity: '',
    reorderLevel: '',
    unitPrice: '',
    supplier: ''
  })

  const categories = ['Printing Materials', 'T-shirt Stock', 'Signage Materials', 'Office Supplies', 'Other']

  const handleOpenModal = (item = null) => {
    if (item) {
      setFormData(item)
      setEditId(item.id)
    } else {
      setFormData({
        name: '',
        sku: '',
        category: 'Printing Materials',
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
      notes: ''
    })
    setIsAdjustOpen(true)
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
        created_by: user?.username || 'unknown'
      })
      
      setIsAdjustOpen(false)
    } catch (err) {
      // Error is handled in context
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

  const filteredItems = data.inventory.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                       item.sku.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || item.category === filterCat
    const itemStatus = getInventoryStatus(item.id)
    const matchStatus = !filterStatus || itemStatus === filterStatus
    return matchSearch && matchCat && matchStatus
  })

  const getSupplierName = (id) => {
    return data.suppliers.find(s => s.id === id)?.name || 'Not assigned'
  }

  const getStatusIcon = (id) => {
    const status = getInventoryStatus(id)
    if (status === 'In Stock') return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' }
    if (status === 'Low Stock') return { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' }
  }

  const stats = {
    inStock: data.inventory.filter(i => getInventoryStatus(i.id) === 'In Stock').length,
    lowStock: data.inventory.filter(i => getInventoryStatus(i.id) === 'Low Stock').length,
    outOfStock: data.inventory.filter(i => getInventoryStatus(i.id) === 'Out of Stock').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Inventory Management</h1>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Item
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card bg-green-50 dark:bg-green-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">In Stock</p>
          <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
        </div>
        <div className="card bg-yellow-50 dark:bg-yellow-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
        </div>
        <div className="card bg-red-50 dark:bg-red-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search by item name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
        />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="form-input">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-input">
          <option value="">All Statuses</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Items:</span>
          <span className="font-bold text-blue-600">{filteredItems.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Item Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">SKU</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Reorder Level</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Unit Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Supplier</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, idx) => {
              const statusInfo = getStatusIcon(item.id)
              const StatusIcon = statusInfo.icon
              return (
                <tr key={item.id} className={`border-b border-gray-200 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
                  <td className="px-6 py-3 text-sm font-medium">{item.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{item.sku}</td>
                  <td className="px-6 py-3 text-sm">{item.category}</td>
                  <td className="px-6 py-3 text-sm font-semibold">{item.quantity}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{item.reorderLevel}</td>
                  <td className="px-6 py-3 text-sm">KSh {item.unitPrice?.toLocaleString() || '0'}</td>
                  <td className="px-6 py-3 text-sm">{getSupplierName(item.supplier)}</td>
                  <td className="px-6 py-3 text-sm">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.color} w-fit`}>
                      <StatusIcon size={14} />
                      {getInventoryStatus(item.id)}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm flex gap-2">
                    <button onClick={() => handleOpenModal(item)} className="btn-secondary p-2" title="Edit Item">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleOpenAdjust(item)} className="btn-secondary p-2 text-blue-600 bg-blue-50 hover:bg-blue-100" title="Adjust Stock">
                      <ArrowUpDown size={16} />
                    </button>
                    {user?.role === 'admin' && (
                      <button onClick={() => deleteInventoryItem(item.id)} className="btn-danger p-2">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">No inventory items found</div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Edit Item' : 'Add New Item'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Item Name*</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SKU/Code</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="form-input"
                placeholder="Stock keeping unit"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-input"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supplier</label>
              <select
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="form-input"
              >
                <option value="">Not assigned</option>
                {data.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity*</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reorder Level</label>
              <input
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) })}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit Price (KSh)*</label>
              <input
                type="number"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                className="form-input"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-success flex-1">Save Item</button>
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal isOpen={isAdjustOpen} onClose={() => setIsAdjustOpen(false)} title={`Adjust Stock: ${adjustItem?.name || ''}`}>
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
             <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Stock</span>
                <span className="text-xl font-bold">{adjustItem?.quantity || 0}</span>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Action Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`p-2 rounded-lg border text-sm font-medium transition-colors ${adjustData.type === 'RESTOCK' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setAdjustData({ ...adjustData, type: 'RESTOCK', reason: 'Restock' })}
              >
                Add Stock (+)
              </button>
              <button
                type="button"
                className={`p-2 rounded-lg border text-sm font-medium transition-colors ${adjustData.type === 'VARIANCE' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setAdjustData({ ...adjustData, type: 'VARIANCE', reason: 'Damaged' })}
              >
                Remove Stock (-)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity to {adjustData.type === 'RESTOCK' ? 'Add' : 'Remove'}</label>
            <input
              type="number"
              min="1"
              value={adjustData.quantity}
              onChange={(e) => setAdjustData({ ...adjustData, quantity: parseInt(e.target.value) })}
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason</label>
            <select
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              className="form-input"
            >
              {adjustData.type === 'RESTOCK' ? (
                <>
                  <option value="Restock">New Purchase / Restock</option>
                  <option value="Return">Customer Return</option>
                  <option value="Correction">Inventory Correction (+) </option>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
            <textarea
              value={adjustData.notes}
              onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
              className="form-input"
              placeholder="Optional details..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-success flex-1">Confirm Adjustment</button>
            <button type="button" onClick={() => setIsAdjustOpen(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
