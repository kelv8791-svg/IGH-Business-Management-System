import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Download, Eye } from 'lucide-react'

export default function Reports() {
  const { data } = useData()
  const [reportType, setReportType] = useState('sales')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterDesigner, setFilterDesigner] = useState('')

  const reportTypes = [
    { value: 'sales', label: 'Sales Report' },
    { value: 'expenses', label: 'Expense Report' },
    { value: 'clients', label: 'Client Report' },
    { value: 'designs', label: 'Design Project Report' },
    { value: 'suppliers', label: 'Supplier Report' },
    { value: 'supplierExpenses', label: 'Supplier Expense Report' },
    { value: 'inventory', label: 'Inventory Valuation' },
    { value: 'stockMovement', label: 'Stock Movement Log' },
    { value: 'full', label: 'Full System Report' },
  ]

  const getFilteredData = () => {
    const dateFilter = (record) => {
      if (!startDate || !endDate) return true
      return record.date >= startDate && record.date <= endDate
    }

    switch (reportType) {
      case 'sales':
        return data.sales.filter(dateFilter)
      case 'expenses':
        return data.expenses.filter(dateFilter)
      case 'clients':
        return data.clients.map(c => ({
          ...c,
          totalSales: data.sales.filter(s => s.client === c.name).reduce((sum, s) => sum + s.amount, 0)
        }))
      case 'designs':
        return data.designs.filter(record => {
          const dateOk = dateFilter(record)
          const designerOk = !filterDesigner || record.assignedTo === filterDesigner
          return dateOk && designerOk
        })
      case 'suppliers':
        return data.suppliers.map(s => ({
          ...s,
          totalSpent: data.supplierExpenses.filter(e => e.supplier === s.id).reduce((sum, e) => sum + e.amount, 0)
        }))
      case 'supplierExpenses':
        return data.supplierExpenses.filter(dateFilter)
      case 'inventory':
        return data.inventory // Snapshot, no date filter usually, or maybe added items?
      case 'stockMovement':
        return data.stockTransactions.filter(t => {
            if (!startDate || !endDate) return true
            const date = t.created_at.split('T')[0]
            return date >= startDate && date <= endDate
        })
      case 'full':
        return {
          sales: data.sales.filter(dateFilter),
          expenses: data.expenses.filter(dateFilter),
          clients: data.clients,
          designs: data.designs.filter(dateFilter),
          suppliers: data.suppliers,
        }
      default:
        return []
    }
  }

  const generateCSV = () => {
    const filteredData = getFilteredData()
    let csv = ''

    if (reportType === 'sales') {
      csv = 'Date,Client,Department,Description,Amount,Status,Payment Method,Payment Reference\n'
      filteredData.forEach(sale => {
        csv += `"${sale.date}","${sale.client}","${sale.dept}","${sale.desc}","${sale.amount}","${sale.paymentStatus}","${sale.paymentMethod}","${sale.paymentRef}"\n`
      })
    } else if (reportType === 'expenses') {
      csv = 'Date,Category,Description,Amount\n'
      filteredData.forEach(expense => {
        csv += `"${expense.date}","${expense.cat}","${expense.desc}","${expense.amount}"\n`
      })
    } else if (reportType === 'clients') {
      csv = 'Name,Phone,Address,Location,Total Sales\n'
      filteredData.forEach(client => {
        csv += `"${client.name}","${client.phone}","${client.address}","${client.location}","${client.totalSales}"\n`
      })
    } else if (reportType === 'designs') {
      csv = 'Date,Type,Client,Designer,Amount,Completion,Status\n'
      filteredData.forEach(design => {
        csv += `"${design.date}","${design.type}","${design.client}","${design.assignedTo}","${design.amount}","${design.completion}","${design.status}"\n`
      })
    } else if (reportType === 'suppliers') {
      csv = 'Name,Contact,Phone,Email,KRA,Credit Limit,Total Spent\n'
      filteredData.forEach(supplier => {
        csv += `"${supplier.name}","${supplier.contact}","${supplier.phone}","${supplier.email}","${supplier.kra}","${supplier.credit}","${supplier.totalSpent}"\n`
      })
    } else if (reportType === 'supplierExpenses') {
      csv = 'Date,Supplier,Type,Amount,Remarks\n'
      filteredData.forEach(expense => {
        const supplierName = data.suppliers.find(s => s.id === expense.supplier)?.name || 'Unknown'
        csv += `"${expense.date}","${supplierName}","${expense.type}","${expense.amount}","${expense.remarks}"\n`
      })
    } else if (reportType === 'inventory') {
      csv = 'Item Name,Category,SKU,Quantity,Reorder Level,Unit Price,Total Value\n'
      filteredData.forEach(item => {
        const value = (item.quantity || 0) * (item.unitPrice || 0)
        csv += `"${item.name}","${item.category}","${item.sku}","${item.quantity}","${item.reorderLevel}","${item.unitPrice}","${value}"\n`
      })
    } else if (reportType === 'stockMovement') {
      csv = 'Date,Item,Type,Quantity Change,Reason,User,Notes\n'
      filteredData.forEach(trans => {
        const itemName = data.inventory.find(i => i.id === trans.item_id)?.name || 'Unknown Item'
        const date = new Date(trans.created_at).toLocaleString()
        csv += `"${date}","${itemName}","${trans.transaction_type}","${trans.quantity_change}","${trans.reason}","${trans.created_by}","${trans.notes || ''}"\n`
      })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${reportType}_report_${timestamp}.csv`
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const renderReportPreview = () => {
    const filteredData = getFilteredData()

    if (reportType === 'sales') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Client</th>
                <th className="px-4 py-2 text-left">Department</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(sale => (
                <tr key={sale.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2">{sale.date}</td>
                  <td className="px-4 py-2">{sale.client}</td>
                  <td className="px-4 py-2">{sale.dept}</td>
                  <td className="px-4 py-2 text-right font-semibold">KSh {sale.amount.toLocaleString()}</td>
                  <td className="px-4 py-2">{sale.paymentStatus}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                <td colSpan="3" className="px-4 py-2 text-right">Total Sales:</td>
                <td className="px-4 py-2 text-right">KSh {filteredData.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    }

    if (reportType === 'expenses') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(expense => (
                <tr key={expense.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2">{expense.date}</td>
                  <td className="px-4 py-2">{expense.cat}</td>
                  <td className="px-4 py-2">{expense.desc}</td>
                  <td className="px-4 py-2 text-right font-semibold">KSh {expense.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                <td colSpan="3" className="px-4 py-2 text-right">Total Expenses:</td>
                <td className="px-4 py-2 text-right">KSh {filteredData.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    }

    if (reportType === 'clients') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-right">Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(client => (
                <tr key={client.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2">{client.name}</td>
                  <td className="px-4 py-2">{client.phone}</td>
                  <td className="px-4 py-2">{client.location}</td>
                  <td className="px-4 py-2 text-right font-semibold">KSh {client.totalSales.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (reportType === 'designs') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Client</th>
                <th className="px-4 py-2 text-left">Designer</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(design => (
                <tr key={design.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2">{design.date}</td>
                  <td className="px-4 py-2">{design.type}</td>
                  <td className="px-4 py-2">{design.client}</td>
                  <td className="px-4 py-2">{design.assignedTo}</td>
                  <td className="px-4 py-2 text-right font-semibold">KSh {design.amount?.toLocaleString() || '0'}</td>
                  <td className="px-4 py-2">{design.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (reportType === 'suppliers') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Contact</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(supplier => (
                <tr key={supplier.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2">{supplier.name}</td>
                  <td className="px-4 py-2">{supplier.contact}</td>
                  <td className="px-4 py-2">{supplier.phone}</td>
                  <td className="px-4 py-2 text-right font-semibold">KSh {supplier.totalSpent.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (reportType === 'supplierExpenses') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Supplier</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(expense => {
                const supplierName = data.suppliers.find(s => s.id === expense.supplier)?.name || 'Unknown'
                return (
                  <tr key={expense.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2">{expense.date}</td>
                    <td className="px-4 py-2">{supplierName}</td>
                    <td className="px-4 py-2">{expense.type}</td>
                    <td className="px-4 py-2 text-right font-semibold">KSh {expense.amount.toLocaleString()}</td>
                  </tr>
                )
              })}
              <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                <td colSpan="3" className="px-4 py-2 text-right">Total:</td>
                <td className="px-4 py-2 text-right">KSh {filteredData.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    }

    if (reportType === 'inventory') {
      const totalValue = filteredData.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0)
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-2 text-left">Item Name</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-right">Quantity</th>
                <th className="px-4 py-2 text-right">Unit Price</th>
                <th className="px-4 py-2 text-right">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2 font-medium">{item.name}</td>
                  <td className="px-4 py-2">{item.category}</td>
                  <td className={`px-4 py-2 text-right ${item.quantity <= item.reorderLevel ? 'text-red-600 font-bold' : ''}`}>{item.quantity}</td>
                  <td className="px-4 py-2 text-right">KSh {item.unitPrice?.toLocaleString() || '0'}</td>
                  <td className="px-4 py-2 text-right font-semibold">KSh {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                <td colSpan="4" className="px-4 py-2 text-right">Total Inventory Value:</td>
                <td className="px-4 py-2 text-right">KSh {totalValue.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    }

    if (reportType === 'stockMovement') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-right">Change</th>
                <th className="px-4 py-2 text-left">Reason</th>
                <th className="px-4 py-2 text-left">User</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(trans => {
                const itemName = data.inventory.find(i => i.id === trans.item_id)?.name || 'Unknown Item'
                return (
                  <tr key={trans.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2 text-xs">{new Date(trans.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 font-medium">{itemName}</td>
                    <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                            trans.transaction_type === 'RESTOCK' ? 'bg-green-100 text-green-800' :
                            trans.transaction_type === 'VARIANCE' ? 'bg-red-100 text-red-800' :
                            trans.transaction_type === 'PROJECT_USAGE' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100'
                        }`}>
                            {trans.transaction_type}
                        </span>
                    </td>
                    <td className={`px-4 py-2 text-right font-bold ${trans.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trans.quantity_change > 0 ? '+' : ''}{trans.quantity_change}
                    </td>
                    <td className="px-4 py-2">{trans.reason}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{trans.created_by}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }

    if (reportType === 'full') {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold mb-2">Sales Summary</h3>
            <p>Total Sales: KSh {filteredData.sales.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</p>
            <p>Total Transactions: {filteredData.sales.length}</p>
          </div>
          <div>
            <h3 className="font-bold mb-2">Expenses Summary</h3>
            <p>Total Expenses: KSh {filteredData.expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</p>
            <p>Total Transactions: {filteredData.expenses.length}</p>
          </div>
          <div>
            <h3 className="font-bold mb-2">Business Overview</h3>
            <p>Total Clients: {filteredData.clients.length}</p>
            <p>Active Projects: {filteredData.designs.filter(d => d.status === 'In Progress').length}</p>
            <p>Total Suppliers: {filteredData.suppliers.length}</p>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Reports & Analytics</h1>

      {/* Report Controls */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="form-input"
            >
              {reportTypes.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input"
            />
          </div>
          {reportType === 'designs' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Designer</label>
              <select
                value={filterDesigner}
                onChange={(e) => setFilterDesigner(e.target.value)}
                className="form-input"
              >
                <option value="">All Designers</option>
                {[...new Set(data.designs.map(d => d.assignedTo))].map(designer => (
                  <option key={designer} value={designer}>{designer}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={generateCSV} className="btn-primary flex items-center gap-2">
            <Download size={20} />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Eye size={20} />
          Report Preview
        </h2>
        {renderReportPreview()}
      </div>
    </div>
  )
}
