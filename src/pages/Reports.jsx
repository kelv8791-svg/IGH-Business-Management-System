import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { 
  Download, 
  Eye, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Truck, 
  ShoppingCart, 
  Package, 
  History, 
  BarChart3,
  ArrowLeft,
  Search,
  Calendar
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Reports() {
  const { data, selectedBranch } = useData()
  const { user } = useAuth()
  const activeBranch = user?.role === 'admin' ? selectedBranch : user?.branch
  
  const reportTypes = [
    { 
      value: 'sales', 
      label: 'Sales Report', 
      desc: 'Overview of all sales transactions and revenue.',
      icon: <TrendingUp className="text-green-500" size={24} />,
      color: 'border-green-500'
    },
    { 
      value: 'expenses', 
      label: 'Expense Report', 
      desc: 'Track operational costs and categorical spending.',
      icon: <TrendingDown className="text-red-500" size={24} />,
      color: 'border-red-500'
    },
    { 
      value: 'clients', 
      label: 'Client Report', 
      desc: 'Analysis of client relationships and lifetime value.',
      icon: <Users className="text-blue-500" size={24} />,
      color: 'border-blue-500'
    },
    { 
      value: 'suppliers', 
      label: 'Supplier Report', 
      desc: 'Summary of supplier interactions and credit limits.',
      icon: <Truck className="text-amber-500" size={24} />,
      color: 'border-amber-500'
    },
    { 
      value: 'supplierExpenses', 
      label: 'Supplier Expenses', 
      desc: 'Detailed log of purchases and supplier costs.',
      icon: <ShoppingCart className="text-purple-500" size={24} />,
      color: 'border-purple-500'
    },
    { 
      value: 'inventory', 
      label: 'Inventory Report', 
      desc: 'Current stock levels, valuation, and reorder alerts.',
      icon: <Package className="text-orange-500" size={24} />,
      color: 'border-orange-500'
    },
    { 
      value: 'stockMovement', 
      label: 'Stock Movement', 
      desc: 'Log of all stock additions, sales, and adjustments.',
      icon: <History className="text-indigo-500" size={24} />,
      color: 'border-indigo-500'
    },
    { 
      value: 'full', 
      label: 'Full System Report', 
      desc: 'Comprehensive business overview across all modules.',
      icon: <BarChart3 className="text-slate-500" size={24} />,
      color: 'border-slate-500'
    },
  ].filter(r => {
    if (user?.role !== 'admin' && r.value !== 'inventory') return false
    // Designs is hidden for iGift but I'll add it back if user wants, 
    // user didn't mention it but it was in the original list.
    // I'll keep the ones user explicitly mentioned.
    return true
  })

  // Add designs back if needed, but keeping it focused for now.
  // Original had designs: { value: 'designs', label: 'Design Project Report' }
  const hasDesigns = data.designs && data.designs.length > 0 && activeBranch !== 'iGift'
  if (hasDesigns) {
    reportTypes.splice(3, 0, {
      value: 'designs',
      label: 'Design Projects',
      desc: 'Track project progress, designers, and project revenue.',
      icon: <FileText className="text-cyan-500" size={24} />,
      color: 'border-cyan-500'
    })
  }

  const [reportType, setReportType] = useState(user?.role === 'admin' ? null : 'inventory')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterDesigner, setFilterDesigner] = useState('')

  const getFilteredData = () => {
    const dateFilter = (record) => {
      if (!startDate || !endDate) return true
      const rDate = record.date || (record.created_at ? record.created_at.split('T')[0] : null)
      if (!rDate) return true
      return rDate >= startDate && rDate <= endDate
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
        return data.inventory // Snapshot, usually no date filter for current levels
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
        
        let reason = trans.reason
        const projectMatch = reason.match(/Project #(\d+)/)
        if (projectMatch) {
            const designId = projectMatch[1]
            const design = data.designs.find(d => d.id == designId)
            if (design) {
                reason = `${reason} - ${design.client}`
            }
        }

        csv += `"${date}","${itemName}","${trans.transaction_type}","${trans.quantity_change}","${reason}","${trans.created_by}","${trans.notes || ''}"\n`
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

  const generatePDF = () => {
    try {
      const filteredData = getFilteredData()
      const doc = new jsPDF('landscape')
      const timestamp = new Date().toLocaleDateString()
      const label = reportTypes.find(r => r.value === reportType)?.label || 'System Report'
      
      doc.setFontSize(22)
      doc.setTextColor(40, 40, 40)
      doc.text(`IGH BMS - ${label}`, 14, 20)
      
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Branch: ${activeBranch}`, 14, 33)
      if (startDate && endDate) {
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 38)
      }

      let head = []
      let body = []

      if (reportType === 'sales') {
        head = [['Date', 'Client', 'Department', 'Amount', 'Status', 'Method']]
        filteredData.forEach(s => body.push([s.date, s.client, s.dept, `KSh ${s.amount.toLocaleString()}`, s.paymentStatus, s.paymentMethod]))
        const total = filteredData.reduce((sum, s) => sum + s.amount, 0)
        body.push([{ content: `Total Revenue: KSh ${total.toLocaleString()}`, colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } }])
      } else if (reportType === 'expenses') {
        head = [['Date', 'Category', 'Description', 'Amount']]
        filteredData.forEach(e => body.push([e.date, e.cat, e.desc, `KSh ${e.amount.toLocaleString()}`]))
        const total = filteredData.reduce((sum, e) => sum + e.amount, 0)
        body.push([{ content: `Total Expenses: KSh ${total.toLocaleString()}`, colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }])
      } else if (reportType === 'clients') {
        head = [['Name', 'Phone', 'Location', 'Total Sales']]
        filteredData.forEach(c => body.push([c.name, c.phone, c.location, `KSh ${c.totalSales.toLocaleString()}`]))
      } else if (reportType === 'designs') {
        head = [['Date', 'Type', 'Client', 'Designer', 'Amount', 'Status']]
        filteredData.forEach(d => body.push([d.date, d.type, d.client, d.assignedTo, `KSh ${d.amount?.toLocaleString() || '0'}`, d.status]))
      } else if (reportType === 'suppliers') {
        head = [['Name', 'Contact', 'Phone', 'Total Spent']]
        filteredData.forEach(s => body.push([s.name, s.contact, s.phone, `KSh ${s.totalSpent.toLocaleString()}`]))
      } else if (reportType === 'supplierExpenses') {
        head = [['Date', 'Supplier', 'Type', 'Amount', 'Remarks']]
        filteredData.forEach(e => {
          const supName = data.suppliers.find(s => s.id === e.supplier)?.name || 'Unknown'
          body.push([e.date, supName, e.type, `KSh ${e.amount.toLocaleString()}`, e.remarks || ''])
        })
        const total = filteredData.reduce((sum, e) => sum + e.amount, 0)
        body.push([{ content: `Total: KSh ${total.toLocaleString()}`, colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }])
      } else if (reportType === 'inventory') {
        head = [['Item', 'Category', 'Quantity', 'Price', 'Value']]
        filteredData.forEach(i => {
          const val = (i.quantity || 0) * (i.unitPrice || 0)
          body.push([i.name, i.category, String(i.quantity), `KSh ${i.unitPrice?.toLocaleString() || '0'}`, `KSh ${val.toLocaleString()}`])
        })
        const total = filteredData.reduce((sum, i) => sum + ((i.quantity || 0) * (i.unitPrice || 0)), 0)
        body.push([{ content: `Total Inventory Value: KSh ${total.toLocaleString()}`, colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }])
      } else if (reportType === 'stockMovement') {
        head = [['Date', 'Item', 'Type', 'Change', 'Reason', 'User']]
        filteredData.forEach(t => {
          const itemName = data.inventory.find(i => i.id === t.item_id)?.name || 'Unknown Item'
          let reason = t.reason
          const pMatch = reason.match(/Project #(\d+)/)
          if (pMatch) {
              const des = data.designs.find(d => d.id == pMatch[1])
              if (des) reason = `${reason} - ${des.client}`
          }
          body.push([new Date(t.created_at).toLocaleDateString(), itemName, t.transaction_type, String(t.quantity_change), reason, t.created_by])
        })
      } else if (reportType === 'full') {
        doc.text('A full system export is best generated via CSV due to multiple data shapes.', 14, 50)
        doc.save(`system_report_${timestamp}.pdf`)
        return
      }

      if (body.length > 0) {
        autoTable(doc, { 
          startY: 45, 
          head, 
          body,
          theme: 'striped',
          headStyles: { fillStyle: [41, 128, 185], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        })
      } else {
        doc.text('No matching data for given filters.', 14, 50)
      }

      doc.save(`${reportType}_report_${timestamp}.pdf`)
    } catch (error) {
      console.error('PDF Generation failed:', error)
      alert('Failed to generate PDF. Check console for details.')
    }
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
                    <td className="px-4 py-2">
                        {(() => {
                            let reason = trans.reason
                            const projectMatch = reason.match(/Project #(\d+)/)
                            if (projectMatch) {
                                const designId = projectMatch[1]
                                const design = data.designs.find(d => d.id == designId)
                                if (design) {
                                    return (
                                        <span>
                                            {reason} <span className="font-semibold text-blue-600"> - {design.client}</span>
                                        </span>
                                    )
                                }
                            }
                            return reason
                        })()}
                    </td>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
              <h3 className="font-bold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                <TrendingUp size={18} /> Sales Summary
              </h3>
              <p className="text-2xl font-bold">KSh {filteredData.sales.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</p>
              <p className="text-sm text-gray-500">{filteredData.sales.length} Transactions</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
              <h3 className="font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                <TrendingDown size={18} /> Expenses Summary
              </h3>
              <p className="text-2xl font-bold">KSh {filteredData.expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</p>
              <p className="text-sm text-gray-500">{filteredData.expenses.length} Transactions</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <Users size={18} /> Clients & Projects
              </h3>
              <p className="text-2xl font-bold">{filteredData.clients.length} Clients</p>
              <p className="text-sm text-gray-500">{filteredData.designs.length} Total Projects</p>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="font-bold text-lg mb-4">Detailed Breakdown</h3>
            <p className="text-gray-600 dark:text-gray-400">
              The full system report provides a birds-eye view of your business health. 
              For a granular row-by-row analysis, please use the CSV Export which combines all data points into a single spreadsheet.
            </p>
          </div>
        </div>
      )
    }
  }

  if (user?.role === 'admin' && !reportType) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Reports Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">Select a report category to view detailed data and exports.</p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
             <Calendar className="text-primary-gold" size={20} />
             <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer"
                  placeholder="Start Date"
                />
                <span className="text-gray-400">to</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer"
                  placeholder="End Date"
                />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {reportTypes.map((report) => (
            <button
              key={report.value}
              onClick={() => setReportType(report.value)}
              className={`group flex flex-col p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-l-4 ${report.color} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left`}
            >
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl group-hover:scale-110 transition-transform duration-300 w-fit">
                {report.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{report.label}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{report.desc}</p>
              <div className="mt-auto pt-4 flex items-center text-primary-gold font-semibold text-sm">
                View Report <Eye size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
           <div className="card text-center py-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Sales</p>
              <p className="text-2xl font-extrabold text-green-600">KSh {data.sales.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</p>
           </div>
           <div className="card text-center py-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Expenses</p>
              <p className="text-2xl font-extrabold text-red-600">KSh {data.expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</p>
           </div>
           <div className="card text-center py-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Stock Value</p>
              <p className="text-2xl font-extrabold text-blue-600">KSh {data.inventory.reduce((sum, i) => sum + ((i.quantity || 0) * (i.unitPrice || 0)), 0).toLocaleString()}</p>
           </div>
           <div className="card text-center py-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Active Branch</p>
              <p className="text-2xl font-extrabold text-primary-gold">{activeBranch}</p>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user?.role === 'admin' && (
            <button 
              onClick={() => setReportType(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {reportTypes.find(r => r.value === reportType)?.label || 'Report'}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={generateCSV} className="btn-secondary flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <Download size={18} className="text-blue-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button onClick={generatePDF} className="btn-secondary flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-600">
            <FileText size={18} />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="card grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="form-input"
              disabled={reportTypes.length <= 1}
            >
              {reportTypes.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Start Date</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">End Date</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
          {reportType === 'designs' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Designer</label>
              <div className="relative">
                <select
                  value={filterDesigner}
                  onChange={(e) => setFilterDesigner(e.target.value)}
                  className="form-input pl-10"
                >
                  <option value="">All Designers</option>
                  {[...new Set(data.designs.map(d => d.assignedTo))].map(designer => (
                    <option key={designer} value={designer}>{designer}</option>
                  ))}
                </select>
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>
          )}
          {reportType !== 'designs' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-500">
               <Search size={16} />
               <span>Filtering for {activeBranch}</span>
            </div>
          )}
      </div>

      {/* Report Preview */}
      <div className="card min-h-[400px]">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <Eye size={20} className="text-primary-gold" />
          Live Preview
        </h2>
        {renderReportPreview()}
      </div>
    </div>
  )
}
