import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  FileText, 
  Search, 
  Truck, 
  DollarSign, 
  CreditCard, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles,
  Building2,
  Receipt
} from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function Suppliers() {
  const { 
    data, addSupplier, updateSupplier, deleteSupplier, 
    addSupplierExpense, updateSupplierExpense, deleteSupplierExpense,
    addSupplierPayment, updateSupplierPayment, deleteSupplierPayment,
    selectedBranch
  } = useData()
  const { user } = useAuth()
  const [tab, setTab] = useState('directory')
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')

  const activeBranch = user?.role === 'admin' ? selectedBranch : user?.branch

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    kra: '',
    credit: ''
  })

  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier_id: '',
    amount: '',
    payment_method: 'Cash',
    reference: ''
  })

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    type: 'Large Format',
    amount: '',
    remarks: '',
    payment_status: 'Paid',
    is_stock_purchase: false,
    inventory_item_id: '',
    quantity: ''
  })

  const expenseTypes = ['Large Format', 'DTF Tshirts', 'Tshirt Material', '3D Cutting', 'Signage Materials', 'Other']

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

  const filteredSuppliers = useMemo(() => {
    return (data.suppliers || []).filter(s => {
      const query = search.toLowerCase()
      return !query ||
        (s.name || '').toLowerCase().includes(query) ||
        (s.phone || '').toLowerCase().includes(query) ||
        (s.email || '').toLowerCase().includes(query) ||
        (s.contact || '').toLowerCase().includes(query)
    })
  }, [data.suppliers, search])

  const getSupplierTotalExpenses = (supplierId) => {
    return (data.supplierExpenses || [])
      .filter(e => Number(e.supplier) === Number(supplierId))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)
  }

  const getSupplierBalance = (supplierId) => {
    const totalCredit = (data.supplierExpenses || [])
      .filter(e => Number(e.supplier) === Number(supplierId) && e.payment_status === 'On Credit')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)
    
    const totalPayments = (data.supplierPayments || [])
      .filter(p => Number(p.supplier_id) === Number(supplierId))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    
    return totalCredit - totalPayments
  }

  const metrics = useMemo(() => {
    const supplierList = data.suppliers || []
    const totalPurchases = (data.supplierExpenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const totalOutstanding = supplierList.reduce((sum, s) => sum + getSupplierBalance(s.id), 0)
    const totalPaymentsMade = (data.supplierPayments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)

    return {
      totalSuppliers: supplierList.length,
      totalPurchases,
      totalOutstanding,
      totalPaymentsMade
    }
  }, [data.suppliers, data.supplierExpenses, data.supplierPayments])

  const handleExportSOA = (supplier) => {
    const doc = new jsPDF()
    const expenses = (data.supplierExpenses || []).filter(e => Number(e.supplier) === Number(supplier.id))
    const payments = (data.supplierPayments || []).filter(p => Number(p.supplier_id) === Number(supplier.id))
    
    const allRecords = [
      ...expenses.map(e => ({ ...e, recordType: 'EXPENSE' })),
      ...payments.map(p => ({ ...p, recordType: 'PAYMENT' }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date))

    doc.setFontSize(20)
    doc.text(`Statement of Account`, 14, 22)
    doc.setFontSize(12)
    doc.text(`Supplier: ${supplier.name}`, 14, 32)
    doc.text(`Phone: ${supplier.phone || 'N/A'}`, 14, 38)
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 44)

    let totalOwed = 0
    let totalPaid = 0
    let balance = 0

    const tableData = allRecords.map(r => {
      const amt = Number(r.amount) || 0
      let typeLabel = r.recordType === 'EXPENSE' ? (r.payment_status === 'On Credit' ? 'Purchase (Credit)' : 'Purchase (Paid)') : `Payment (${r.payment_method})`
      
      if (r.recordType === 'EXPENSE' && r.payment_status === 'On Credit') {
        balance += amt
        totalOwed += amt
      } else if (r.recordType === 'PAYMENT') {
        balance -= amt
        totalPaid += amt
      }

      return [
        r.date,
        typeLabel,
        r.remarks || r.reference || '-',
        r.recordType === 'EXPENSE' ? `KSh ${amt.toLocaleString()}` : '-',
        r.recordType === 'PAYMENT' ? `KSh ${amt.toLocaleString()}` : '-',
        `KSh ${balance.toLocaleString()}`
      ]
    })

    doc.autoTable({
      startY: 50,
      head: [['Date', 'Description', 'Remarks/Ref', 'Purchase', 'Payment', 'Balance']],
      body: tableData,
    })

    const finalY = doc.lastAutoTable?.finalY || 50
    doc.setFontSize(14)
    doc.text(`Total Purchases (Credit): KSh ${totalOwed.toLocaleString()}`, 14, finalY + 10)
    doc.text(`Total Payments Made: KSh ${totalPaid.toLocaleString()}`, 14, finalY + 18)
    doc.text(`Net Outstanding Balance: KSh ${balance.toLocaleString()}`, 14, finalY + 26)

    doc.save(`${supplier.name}_Supplier_SOA.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Suppliers Management</h1>
            <span className="px-3 py-1 text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
              {activeBranch} Branch
            </span>
          </div>
          <p className="text-sm text-gray-300 mt-1">
            Manage vendor details, track supplier purchases, credit balances, and payments.
          </p>
        </div>
        <button onClick={() => handleOpenSupplierModal()} className="btn-primary flex items-center gap-2 py-3 px-5 text-sm font-bold shadow-lg hover:shadow-primary-gold/20 transition-all">
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Suppliers</p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">{metrics.totalSuppliers}</h3>
            <p className="text-xs text-gray-500 mt-1">Registered vendors</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
            <Truck size={24} />
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Purchases Volume</p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">KSh {metrics.totalPurchases.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Supplier expenses logged</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
            <Receipt size={24} />
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outstanding Credit Balance</p>
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">KSh {metrics.totalOutstanding.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Total pending credit owed</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payments Settled</p>
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">KSh {metrics.totalPaymentsMade.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Disbursed supplier payments</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Filter Bar */}
      <div className="card p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-750 rounded-xl">
            <button
              onClick={() => setTab('directory')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'directory' ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Supplier Directory ({filteredSuppliers.length})
            </button>
            <button
              onClick={() => setTab('purchases')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'purchases' ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Purchases Log ({(data.supplierExpenses || []).length})
            </button>
            <button
              onClick={() => setTab('payments')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'payments' ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Payments Log ({(data.supplierPayments || []).length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9"
            />
          </div>
        </div>
      </div>

      {/* Directory Tab View */}
      {tab === 'directory' && (
        <div className="card overflow-x-auto p-0 rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80">
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Supplier Name</th>
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Person & Phone</th>
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">KRA PIN</th>
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Purchases</th>
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Outstanding Credit Balance</th>
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredSuppliers.map((supplier) => {
                const totalPurchases = getSupplierTotalExpenses(supplier.id)
                const balance = getSupplierBalance(supplier.id)

                return (
                  <tr key={supplier.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-800 dark:text-white">
                      {supplier.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <div>{supplier.contact || 'No contact person'}</div>
                      <div className="text-xs text-gray-400 font-mono">{supplier.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">
                      {supplier.kra || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600 dark:text-blue-400">
                      KSh {totalPurchases.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs ${
                        balance > 0 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                      }`}>
                        KSh {balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleExportSOA(supplier)} title="Export Statement of Account" className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold px-2.5">
                          <FileText size={15} />
                          SOA PDF
                        </button>
                        <button onClick={() => handleOpenSupplierModal(supplier)} title="Edit Supplier" className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        {user?.role === 'admin' && (
                          <button onClick={() => deleteSupplier(supplier.id)} title="Delete Supplier" className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
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
          {filteredSuppliers.length === 0 && (
            <div className="p-10 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 space-y-4">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <Sparkles size={28} />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">No Suppliers Found</h3>
                <p className="text-xs text-gray-500">There are no suppliers matching your active search query.</p>
              </div>
              <button onClick={() => handleOpenSupplierModal()} className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-xs font-bold shadow-lg">
                <Plus size={16} />
                Add Supplier Record
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Edit Supplier Record' : 'Add New Supplier'}>
        <form onSubmit={handleSupplierSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Supplier Company Name *</label>
            <input
              type="text"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              className="form-input"
              placeholder="e.g. Identity Graphics Ltd, Nakuru Signs..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Person</label>
              <input
                type="text"
                value={supplierForm.contact}
                onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                className="form-input"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                className="form-input"
                placeholder="e.g. +254 712 345 678"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                className="form-input"
                placeholder="e.g. sales@supplier.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">KRA PIN</label>
              <input
                type="text"
                value={supplierForm.kra}
                onChange={(e) => setSupplierForm({ ...supplierForm, kra: e.target.value })}
                className="form-input"
                placeholder="e.g. P051234567Z"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="submit" className="btn-success flex-1 py-3 font-bold uppercase tracking-wider shadow-md">
              {editId ? 'Update Supplier' : 'Save Supplier'}
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
