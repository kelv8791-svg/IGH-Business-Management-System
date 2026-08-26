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
    <div className="space-y-6 animate-fade-in">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Suppliers Management</h1>
            <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
              {activeBranch} Branch
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage vendor details, track supplier purchases, credit balances, and payments.
          </p>
        </div>
        <button onClick={() => handleOpenSupplierModal()} className="btn-primary flex items-center gap-2">
          <Plus size={17} />
          Add Supplier Record
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-start justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Vendors</p>
            <h3 className="text-2xl font-extrabold text-amber-500 dark:text-amber-400 mt-1.5 tracking-tight">{(metrics.totalSuppliers || 0)}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Registered suppliers</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Truck size={20} />
          </div>
        </div>

        <div className="card flex items-start justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Purchases Volume</p>
            <h3 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1.5 tracking-tight">KSh {(metrics.totalPurchases || 0).toLocaleString()}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Supplier expenses logged</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Receipt size={20} />
          </div>
        </div>

        <div className="card flex items-start justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pending Credit Owed</p>
            <h3 className={`text-2xl font-extrabold mt-1.5 tracking-tight ${(metrics.totalOutstanding || 0) > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
              KSh {(metrics.totalOutstanding || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Total credit balance pending</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <CreditCard size={20} />
          </div>
        </div>

        <div className="card flex items-start justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Payments Settled</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5 tracking-tight">KSh {(metrics.totalPaymentsMade || 0).toLocaleString()}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Disbursed supplier payments</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Filter Bar */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
            <button
              onClick={() => setTab('directory')}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${tab === 'directory' ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Supplier Directory ({filteredSuppliers.length})
            </button>
            <button
              onClick={() => setTab('purchases')}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${tab === 'purchases' ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Purchases Log ({(data.supplierExpenses || []).length})
            </button>
            <button
              onClick={() => setTab('payments')}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${tab === 'payments' ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Payments Log ({(data.supplierPayments || []).length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
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
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Supplier Name</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contact Person & Phone</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">KRA PIN</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Purchases</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Outstanding Credit</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSuppliers.map((supplier) => {
                const totalPurchases = getSupplierTotalExpenses(supplier.id) || 0
                const balance = getSupplierBalance(supplier.id) || 0

                return (
                  <tr key={supplier.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white">
                      {supplier.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      <div>{supplier.contact || 'No contact person'}</div>
                      <div className="text-xs text-slate-400 font-mono">{supplier.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">
                      {supplier.kra || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600 dark:text-blue-400">
                      KSh {Number(totalPurchases || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        balance > 0 
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                      }`}>
                        KSh {Number(balance || 0).toLocaleString()}
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
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete supplier "${supplier.name}"?`)) {
                                deleteSupplier(supplier.id)
                              }
                            }}
                            title="Delete Supplier"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
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
          {filteredSuppliers.length === 0 && (
            <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-4">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <Sparkles size={28} />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Suppliers Found</h3>
                <p className="text-xs text-slate-500">There are no suppliers matching your active search query.</p>
              </div>
              <button onClick={() => handleOpenSupplierModal()} className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-xs font-bold shadow-lg">
                <Plus size={16} />
                Add Supplier Record
              </button>
            </div>
          )}
        </div>
      )}

      {/* Purchases Tab View */}
      {tab === 'purchases' && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Supplier</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Type / Category</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(data.supplierExpenses || []).map((exp) => {
                const sup = data.suppliers.find(s => s.id === exp.supplier)
                return (
                  <tr key={exp.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{exp.date}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white">{sup?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{exp.type || exp.cat || 'Purchase'}</td>
                    <td className="px-6 py-4 text-sm font-extrabold text-blue-600 dark:text-blue-400">KSh {Number(exp.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${exp.payment_status === 'On Credit' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {exp.payment_status || 'Paid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{exp.remarks || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {(data.supplierExpenses || []).length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">No supplier purchases recorded yet.</div>
          )}
        </div>
      )}

      {/* Payments Tab View */}
      {tab === 'payments' && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Supplier</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Amount Paid</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Payment Method</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(data.supplierPayments || []).map((pay) => {
                const sup = data.suppliers.find(s => s.id === pay.supplier_id)
                return (
                  <tr key={pay.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{pay.date}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white">{sup?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm font-extrabold text-emerald-600 dark:text-emerald-400">KSh {Number(pay.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{pay.payment_method || 'Cash'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono text-xs">{pay.reference || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {(data.supplierPayments || []).length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">No supplier payments recorded yet.</div>
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
