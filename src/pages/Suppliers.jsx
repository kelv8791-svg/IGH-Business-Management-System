import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { Plus, Edit2, Trash2, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function Suppliers() {
  const { 
    data, addSupplier, updateSupplier, deleteSupplier, 
    addSupplierExpense, updateSupplierExpense, deleteSupplierExpense,
    addSupplierPayment, updateSupplierPayment, deleteSupplierPayment
  } = useData()
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

  const getSupplierTotalExpenses = (supplierId) => {
    return data.supplierExpenses
      .filter(e => Number(e.supplier) === Number(supplierId))
      .reduce((sum, e) => sum + Number(e.amount), 0)
  }

  const getSupplierBalance = (supplierId) => {
    const totalCredit = data.supplierExpenses
      .filter(e => Number(e.supplier) === Number(supplierId) && e.payment_status === 'On Credit')
      .reduce((sum, e) => sum + Number(e.amount), 0)
    
    const totalPayments = (data.supplierPayments || [])
      .filter(p => Number(p.supplier_id) === Number(supplierId))
      .reduce((sum, p) => sum + Number(p.amount), 0)
    
    return totalCredit - totalPayments
  }

  const handleExportSOA = (supplier) => {
    const doc = new jsPDF()
    const expenses = data.supplierExpenses.filter(e => Number(e.supplier) === Number(supplier.id))
    const payments = (data.supplierPayments || []).filter(p => Number(p.supplier_id) === Number(supplier.id))
    
    const allRecords = [
      ...expenses.map(e => ({ ...e, recordType: 'EXPENSE' })),
      ...payments.map(p => ({ ...p, recordType: 'PAYMENT' }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date))

    doc.setFontSize(20)
    doc.text(`Statement of Account`, 14, 22)
    doc.setFontSize(12)
    doc.text(`Supplier: ${supplier.name}`, 14, 32)
    doc.text(`Phone: ${supplier.phone}`, 14, 38)
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

    const finalY = doc.lastAutoTable.finalY || 50
    doc.setFontSize(14)
    doc.text(`Summary as of ${new Date().toLocaleDateString()}`, 14, finalY + 10)
    doc.setFontSize(11)
    doc.text(`Total Goods Taken on Credit: KSh ${totalOwed.toLocaleString()}`, 14, finalY + 18)
    doc.text(`Total Payments Made: KSh ${totalPaid.toLocaleString()}`, 14, finalY + 24)
    
    doc.setFontSize(14)
    doc.setTextColor(balance > 0 ? 200 : 0, 0, 0)
    doc.text(`TOTAL BALANCE OWED: KSh ${balance.toLocaleString()}`, 14, finalY + 34)

    doc.save(`${supplier.name}_SOA_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Payment Handler
  const handleOpenPaymentModal = (supplier = null) => {
    setPaymentForm({
      date: new Date().toISOString().split('T')[0],
      supplier_id: supplier ? supplier.id : '',
      amount: '',
      payment_method: 'Cash',
      reference: ''
    })
    setIsPaymentOpen(true)
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    if (!paymentForm.supplier_id || !paymentForm.amount) {
      alert('Please fill all required fields')
      return
    }
    await addSupplierPayment(paymentForm)
    setIsPaymentOpen(false)
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
        remarks: '',
        payment_status: 'Paid',
        is_stock_purchase: false,
        inventory_item_id: '',
        quantity: ''
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

      {/* Stats Summary Tooltip-like Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-blue-50 dark:bg-blue-900/10">
           <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Suppliers</p>
           <p className="text-xl font-bold text-blue-600">{data.suppliers.length}</p>
        </div>
        <div className="card bg-orange-50 dark:bg-orange-900/10">
           <p className="text-xs text-gray-500 uppercase font-bold mb-1">Active Debts</p>
           <p className="text-xl font-bold text-orange-600">
             {data.suppliers.filter(s => getSupplierBalance(s.id) > 0).length} Suppliers
           </p>
        </div>
        <div className="card bg-red-50 dark:bg-red-900/10">
           <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Balance Owed</p>
           <p className="text-xl font-bold text-red-600">
             KSh {(data.suppliers.reduce((sum, s) => sum + getSupplierBalance(s.id), 0)).toLocaleString()}
           </p>
        </div>
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total Purchases</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Balance Owed</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier, idx) => {
                  const balance = getSupplierBalance(supplier.id)
                  return (
                    <tr key={supplier.id} className={`border-b border-gray-200 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
                      <td className="px-6 py-3 text-sm font-medium">{supplier.name}</td>
                      <td className="px-6 py-3 text-sm">{supplier.contact}</td>
                      <td className="px-6 py-3 text-sm">{supplier.phone}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{supplier.email}</td>
                      <td className="px-6 py-3 text-sm">{supplier.kra}</td>
                      <td className="px-6 py-3 text-sm font-medium">KSh {getSupplierTotalExpenses(supplier.id).toLocaleString()}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          KSh {balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm flex gap-2">
                        <button onClick={() => handleExportSOA(supplier)} className="btn-secondary p-2 text-blue-600 bg-blue-50 hover:bg-blue-100" title="Export SOA">
                          <FileText size={16} />
                        </button>
                        <button onClick={() => handleOpenPaymentModal(supplier)} className={`p-2 rounded-lg transition-colors ${balance > 0 ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`} disabled={balance <= 0} title="Record Payment">
                          <Plus size={16} />
                        </button>
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
                  )
                })}
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
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
                    <td className="px-6 py-3 text-sm">
                      {expense.type}
                      {expense.inventory_item_id && <span className="block text-xs text-blue-600">Inventory Stockup</span>}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${expense.payment_status === 'On Credit' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {expense.payment_status || 'Paid'}
                      </span>
                    </td>
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
            {user?.role === 'admin' && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-bold">Branch Assignment</label>
                <select
                  value={supplierForm.branch || 'IGH'}
                  onChange={(e) => setSupplierForm({ ...supplierForm, branch: e.target.value })}
                  className="form-input"
                >
                  <option value="IGH">IGH</option>
                  <option value="iGift">iGift</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Determine which shop can see and use this supplier.</p>
              </div>
            )}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category / Type</label>
                <select
                  value={expenseForm.type}
                  onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}
                  className="form-input"
                  disabled={expenseForm.is_stock_purchase}
                >
                  {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Status</label>
                <select
                  value={expenseForm.payment_status}
                  onChange={(e) => setExpenseForm({ ...expenseForm, payment_status: e.target.value })}
                  className="form-input"
                >
                  <option value="Paid">Immediate Payment (Cash/M-Pesa)</option>
                  <option value="On Credit">On Credit (To SOA)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={expenseForm.is_stock_purchase}
                  onChange={(e) => setExpenseForm({ 
                    ...expenseForm, 
                    is_stock_purchase: e.target.checked,
                    type: e.target.checked ? 'Stock Purchase' : 'Large Format'
                  })}
                  className="w-4 h-4 text-primary-gold"
                />
                <span className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">This is a Stock Purchase</span>
              </label>

              {expenseForm.is_stock_purchase && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Inventory Item*</label>
                    <select
                      value={expenseForm.inventory_item_id}
                      onChange={(e) => setExpenseForm({ ...expenseForm, inventory_item_id: e.target.value })}
                      className="form-input text-sm"
                      required
                    >
                      <option value="">Select Item to Restock</option>
                      {data.inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Cur: {i.quantity})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Quantity Purchased*</label>
                    <input
                      type="number"
                      value={expenseForm.quantity}
                      onChange={(e) => setExpenseForm({ ...expenseForm, quantity: e.target.value })}
                      className="form-input text-sm"
                      placeholder="e.g. 50"
                      required
                    />
                  </div>
                </div>
              )}
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
              {expenseForm.is_stock_purchase && expenseForm.amount && expenseForm.quantity && (
                <p className="text-xs text-blue-500 mt-1">
                  Unit Cost: KSh {(expenseForm.amount / expenseForm.quantity).toFixed(2)} (Will update inventory price)
                </p>
              )}
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

      {/* Modal for Recording Payments */}
      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title="Record Supplier Payment">
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
             <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800 mb-4">
               <div className="flex justify-between items-center text-sm font-medium text-green-800 dark:text-green-400">
                 <span>Supplier:</span>
                 <span>{getSupplierName(paymentForm.supplier_id)}</span>
               </div>
               <div className="flex justify-between items-center text-lg font-bold text-red-600 mt-2">
                 <span>Current Balance:</span>
                 <span>KSh {getSupplierBalance(paymentForm.supplier_id).toLocaleString()}</span>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Date*</label>
                 <input
                   type="date"
                   value={paymentForm.date}
                   onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                   className="form-input"
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount Paid (KSh)*</label>
                 <input
                   type="number"
                   value={paymentForm.amount}
                   onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })}
                   className="form-input"
                   required
                 />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                 <select
                   value={paymentForm.payment_method}
                   onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                   className="form-input"
                 >
                   <option value="Cash">Cash</option>
                   <option value="M-Pesa">M-Pesa</option>
                   <option value="Bank Transfer">Bank Transfer</option>
                   <option value="Cheque">Cheque</option>
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reference / Receipt #</label>
                 <input
                   type="text"
                   value={paymentForm.reference}
                   onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                   className="form-input"
                   placeholder="M-Pesa ID or Receipt #"
                 />
               </div>
             </div>

             <div className="flex gap-3 pt-4">
               <button type="submit" className="btn-success flex-1">Confirm Payment</button>
               <button type="button" onClick={() => setIsPaymentOpen(false)} className="btn-secondary flex-1">Cancel</button>
             </div>
          </form>
      </Modal>
    </div>
  )
}
