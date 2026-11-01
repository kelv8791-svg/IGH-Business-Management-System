import { useState, useMemo } from 'react'
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
  Calendar,
  ChevronDown,
  ChevronRight,
  Tag,
  Layers,
  AlertTriangle
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Reports() {
  const { data, selectedBranch } = useData()
  const { user } = useAuth()
  const activeBranch = user?.role === 'admin' ? selectedBranch : user?.branch
  
  const reportTypes = useMemo(() => {
    const list = [
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
      if (user?.role !== 'admin') {
        if (activeBranch === 'IGH' && r.value === 'inventory') return false
        if (activeBranch === 'iGift' && r.value === 'designs') return false
      }
      return true
    })

    const hasDesigns = data.designs && data.designs.length > 0 && activeBranch !== 'iGift'
    if (hasDesigns) {
      list.splice(3, 0, {
        value: 'designs',
        label: 'Design Projects',
        desc: 'Track project progress, designers, and project revenue.',
        icon: <FileText className="text-cyan-500" size={24} />,
        color: 'border-cyan-500'
      })
    }

    return list
  }, [user, activeBranch, data.designs])

  const [reportType, setReportType] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterDesigner, setFilterDesigner] = useState('')
  const [expandedMonths, setExpandedMonths] = useState({})

  const toggleMonth = (key) => {
    setExpandedMonths(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const setAllExpanded = (keys, expand) => {
    const next = {}
    keys.forEach(k => { next[k] = expand })
    setExpandedMonths(next)
  }

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
          totalSales: data.sales.filter(s => s.client === c.name).reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
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
          totalSpent: data.supplierExpenses.filter(e => Number(e.supplier) === Number(s.id)).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
        }))
      case 'supplierExpenses':
        return data.supplierExpenses.filter(dateFilter)
      case 'inventory':
        return data.inventory // Snapshot, usually no date filter for current levels
      case 'stockMovement':
        return data.stockTransactions.filter(t => {
            if (!startDate || !endDate) return true
            const rawDate = t.created_at ?? t.date ?? null
            if (!rawDate) return true
            const date = rawDate.split('T')[0]
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
        filteredData.forEach(s => body.push([s.date, s.client, s.dept, `KSh ${Number(s.amount || 0).toLocaleString()}`, s.paymentStatus, s.paymentMethod]))
        const total = filteredData.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
        body.push([{ content: `Total Revenue: KSh ${total.toLocaleString()}`, colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } }])
      } else if (reportType === 'expenses') {
        head = [['Date', 'Category', 'Description', 'Amount']]
        filteredData.forEach(e => body.push([e.date, e.cat, e.desc, `KSh ${Number(e.amount || 0).toLocaleString()}`]))
        const total = filteredData.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
        body.push([{ content: `Total Expenses: KSh ${total.toLocaleString()}`, colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }])
      } else if (reportType === 'clients') {
        head = [['Name', 'Phone', 'Location', 'Total Sales']]
        filteredData.forEach(c => body.push([c.name, c.phone, c.location, `KSh ${Number(c.totalSales || 0).toLocaleString()}`]))
      } else if (reportType === 'designs') {
        head = [['Date', 'Type', 'Client', 'Designer', 'Amount', 'Status']]
        filteredData.forEach(d => body.push([d.date, d.type, d.client, d.assignedTo, `KSh ${Number(d.amount || 0).toLocaleString()}`, d.status]))
      } else if (reportType === 'suppliers') {
        head = [['Name', 'Contact', 'Phone', 'Total Spent']]
        filteredData.forEach(s => body.push([s.name, s.contact, s.phone, `KSh ${Number(s.totalSpent || 0).toLocaleString()}`]))
      } else if (reportType === 'supplierExpenses') {
        head = [['Date', 'Supplier', 'Type', 'Amount', 'Remarks']]
        filteredData.forEach(e => {
          const supName = data.suppliers.find(s => s.id === e.supplier)?.name || 'Unknown'
          body.push([e.date, supName, e.type, `KSh ${Number(e.amount || 0).toLocaleString()}`, e.remarks || ''])
        })
        const total = filteredData.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
        body.push([{ content: `Total: KSh ${total.toLocaleString()}`, colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }])
      } else if (reportType === 'inventory') {
        head = [['Item', 'Category', 'Quantity', 'Price', 'Value']]
        filteredData.forEach(i => {
          const val = (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)
          body.push([i.name, i.category, String(i.quantity || 0), `KSh ${Number(i.unitPrice || 0).toLocaleString()}`, `KSh ${val.toLocaleString()}`])
        })
        const total = filteredData.reduce((sum, i) => sum + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)), 0)
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

  const groupRecordsByMonth = (records, dateFieldGetter, amountFieldGetter) => {
    const groups = {}
    ;(records || []).forEach((record) => {
      const rawDate = dateFieldGetter ? dateFieldGetter(record) : (record.date || record.created_at)
      let monthLabel = 'General / Undated'
      let sortKey = '0000-00'
      if (rawDate) {
        const d = new Date(rawDate)
        if (!isNaN(d.getTime())) {
          monthLabel = d.toLocaleString('default', { month: 'long', year: 'numeric' })
          sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        }
      }
      if (!groups[sortKey]) {
        groups[sortKey] = {
          key: sortKey,
          label: monthLabel,
          items: [],
          totalAmount: 0
        }
      }
      groups[sortKey].items.push(record)
      if (amountFieldGetter) {
        groups[sortKey].totalAmount += Number(amountFieldGetter(record) || 0)
      }
    })

    return Object.keys(groups)
      .sort()
      .reverse()
      .map(key => groups[key])
  }

  const renderAccordionWrapper = (groups, renderGroupContent, options = {}) => {
    if (!groups || groups.length === 0) {
      return (
        <div className="py-12 text-center text-[#64748B] font-semibold">
          No records found for the selected period or filter criteria.
        </div>
      )
    }

    const allKeys = groups.map(g => g.key)

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#CBD5E1]">
          <span className="text-xs font-black uppercase text-[#475569] tracking-wider">
            {options.groupLabel || 'Monthly Breakdown'} ({groups.length} {groups.length === 1 ? 'Period' : 'Periods'})
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAllExpanded(allKeys, true)}
              className="text-xs font-bold text-[#F97316] hover:underline"
            >
              Expand All
            </button>
            <span className="text-[#94A3B8]">•</span>
            <button
              type="button"
              onClick={() => setAllExpanded(allKeys, false)}
              className="text-xs font-bold text-[#64748B] hover:underline"
            >
              Collapse All
            </button>
          </div>
        </div>

        {groups.map((group, idx) => {
          const isExpanded = expandedMonths[group.key] ?? (idx === 0 || groups.length === 1)
          const borderColor = options.borderColor || 'border-[#F97316]'
          const countUnit = options.countUnit || 'records'
          const totalFormatter = options.totalFormatter || ((val) => `KSh ${Number(val || 0).toLocaleString()}`)

          return (
            <div key={group.key} className="space-y-2">
              <button
                type="button"
                onClick={() => toggleMonth(group.key)}
                className={`w-full flex justify-between items-center px-5 py-3.5 bg-white rounded-xl border-l-4 ${borderColor} border border-[#CBD5E1] shadow-sm hover:bg-[#FFF7ED] transition-all group`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-[#69778A] group-hover:text-[#F97316] transition-colors">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-[#0F172A] group-hover:text-[#F97316] transition-colors">
                    {group.label}
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-[#F1F5F9] text-[#14243B] border border-[#CBD5E1] rounded-full">
                    {group.items.length} {countUnit}
                  </span>
                </div>
                {options.showTotal !== false && (
                  <span className={`text-sm font-black ${options.totalColor || 'text-emerald-700'}`}>
                    {totalFormatter(group.totalAmount, group.items)}
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className="card overflow-x-auto p-0 rounded-xl border border-[#CBD5E1] animate-in fade-in slide-in-from-top-1 duration-200">
                  {renderGroupContent(group)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderReportPreview = () => {
    const filteredData = getFilteredData()

    if (reportType === 'sales') {
      const groups = groupRecordsByMonth(filteredData, s => s.date, s => s.amount)
      return renderAccordionWrapper(
        groups,
        (group) => (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[#CBD5E1] bg-[#F1F5F9]">
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Date</th>
                {activeBranch === 'All' && (
                  <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Branch</th>
                )}
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Client</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Department</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Description</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Status & Method</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {group.items.map(sale => (
                <tr key={sale.id} className="transition-all hover:bg-orange-50/30">
                  <td className="px-5 py-3.5 font-bold whitespace-nowrap text-[#0F172A]">{sale.date}</td>
                  {activeBranch === 'All' && (
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        (sale.branch || 'IGH') === 'iGift'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : 'bg-orange-50 text-orange-900 border-orange-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${(sale.branch || 'IGH') === 'iGift' ? 'bg-purple-500' : 'bg-orange-500'}`} />
                        {(sale.branch || 'IGH') === 'iGift' ? 'iGift' : 'IGH'}
                      </span>
                    </td>
                  )}
                  <td className="px-5 py-3.5 font-bold text-[#0F172A]">{sale.client || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#EEF3FA] text-[#14243B] border border-[#CBD5E1]">
                      <Tag size={11} className="text-[#F97316]" />
                      {sale.dept}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#334155] max-w-xs truncate">
                    <div className="font-semibold text-[#0F172A] truncate">{sale.desc || '—'}</div>
                    {sale.paymentRef && <div className="text-xs text-blue-700 font-mono font-bold mt-0.5">Ref: {sale.paymentRef}</div>}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold w-fit ${
                        sale.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : sale.paymentStatus === 'Pending'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {sale.paymentStatus || 'Paid'}
                      </span>
                      <span className="text-xs font-semibold text-[#475569]">{sale.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-black text-emerald-700 whitespace-nowrap text-right">
                    KSh {Number(sale.amount || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#CBD5E1] bg-[#F8FAFC] font-black">
                <td colSpan={activeBranch === 'All' ? 6 : 5} className="px-5 py-3 text-right text-xs uppercase tracking-wider text-[#334155]">
                  {group.label} Subtotal:
                </td>
                <td className="px-5 py-3 text-right text-sm text-emerald-700 whitespace-nowrap">
                  KSh {Number(group.totalAmount || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        ),
        { borderColor: 'border-emerald-500', totalColor: 'text-emerald-700', countUnit: 'sales' }
      )
    }

    if (reportType === 'expenses') {
      const groups = groupRecordsByMonth(filteredData, e => e.date, e => e.amount)
      return renderAccordionWrapper(
        groups,
        (group) => (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[#CBD5E1] bg-[#F1F5F9]">
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Date</th>
                {activeBranch === 'All' && (
                  <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Branch</th>
                )}
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Category</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Description</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {group.items.map(expense => (
                <tr key={expense.id} className="transition-all hover:bg-orange-50/30">
                  <td className="px-5 py-3.5 font-bold whitespace-nowrap text-[#0F172A]">{expense.date}</td>
                  {activeBranch === 'All' && (
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        (expense.branch || 'IGH') === 'iGift'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : 'bg-orange-50 text-orange-900 border-orange-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${(expense.branch || 'IGH') === 'iGift' ? 'bg-purple-500' : 'bg-orange-500'}`} />
                        {(expense.branch || 'IGH') === 'iGift' ? 'iGift' : 'IGH'}
                      </span>
                    </td>
                  )}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#EEF3FA] text-[#14243B] border border-[#CBD5E1]">
                      <Tag size={11} className="text-[#F97316]" />
                      {expense.cat}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#0F172A] font-semibold max-w-sm truncate">
                    {expense.desc || 'No description provided'}
                  </td>
                  <td className="px-5 py-3.5 font-black text-rose-600 whitespace-nowrap text-right">
                    KSh {Number(expense.amount || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#CBD5E1] bg-[#F8FAFC] font-black">
                <td colSpan={activeBranch === 'All' ? 4 : 3} className="px-5 py-3 text-right text-xs uppercase tracking-wider text-[#334155]">
                  {group.label} Subtotal:
                </td>
                <td className="px-5 py-3 text-right text-sm text-rose-600 whitespace-nowrap">
                  KSh {Number(group.totalAmount || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        ),
        { borderColor: 'border-rose-500', totalColor: 'text-rose-600', countUnit: 'expenses' }
      )
    }

    if (reportType === 'clients') {
      const groups = groupRecordsByMonth(filteredData, c => c.created_at || c.date, c => c.totalSales)
      return renderAccordionWrapper(
        groups,
        (group) => (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[#CBD5E1] bg-[#F1F5F9]">
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Client Name</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Phone</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Location / Address</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider text-right">Total Sales Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {group.items.map(client => (
                <tr key={client.id} className="transition-all hover:bg-orange-50/30">
                  <td className="px-5 py-3.5 font-bold text-[#0F172A] whitespace-nowrap">{client.name}</td>
                  <td className="px-5 py-3.5 text-[#334155] font-semibold whitespace-nowrap">{client.phone || '—'}</td>
                  <td className="px-5 py-3.5 text-[#334155]">{client.location || client.address || '—'}</td>
                  <td className="px-5 py-3.5 font-black text-emerald-700 whitespace-nowrap text-right">
                    KSh {Number(client.totalSales || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#CBD5E1] bg-[#F8FAFC] font-black">
                <td colSpan={3} className="px-5 py-3 text-right text-xs uppercase tracking-wider text-[#334155]">
                  {group.label} Sales Volume:
                </td>
                <td className="px-5 py-3 text-right text-sm text-emerald-700 whitespace-nowrap">
                  KSh {Number(group.totalAmount || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        ),
        { borderColor: 'border-blue-500', totalColor: 'text-emerald-700', countUnit: 'clients' }
      )
    }

    if (reportType === 'designs') {
      const groups = groupRecordsByMonth(filteredData, d => d.date, d => d.amount)
      return renderAccordionWrapper(
        groups,
        (group) => (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[#CBD5E1] bg-[#F1F5F9]">
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Date</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Project Type</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Client</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Designer</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Target Date</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {group.items.map(design => (
                <tr key={design.id} className="transition-all hover:bg-orange-50/30">
                  <td className="px-5 py-3.5 font-bold whitespace-nowrap text-[#0F172A]">{design.date}</td>
                  <td className="px-5 py-3.5 font-bold text-[#0F172A] whitespace-nowrap">{design.type}</td>
                  <td className="px-5 py-3.5 font-semibold text-[#0F172A]">{design.client}</td>
                  <td className="px-5 py-3.5 text-[#334155] font-semibold whitespace-nowrap">{design.assignedTo || '—'}</td>
                  <td className="px-5 py-3.5 text-[#334155] font-semibold whitespace-nowrap">{design.completion || '—'}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                      design.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : design.status === 'In Progress'
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        design.status === 'Completed' ? 'bg-emerald-500' : design.status === 'In Progress' ? 'bg-blue-500' : 'bg-amber-500'
                      }`} />
                      {design.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-black text-emerald-700 whitespace-nowrap text-right">
                    KSh {Number(design.amount || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#CBD5E1] bg-[#F8FAFC] font-black">
                <td colSpan={6} className="px-5 py-3 text-right text-xs uppercase tracking-wider text-[#334155]">
                  {group.label} Subtotal:
                </td>
                <td className="px-5 py-3 text-right text-sm text-emerald-700 whitespace-nowrap">
                  KSh {Number(group.totalAmount || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        ),
        { borderColor: 'border-cyan-500', totalColor: 'text-emerald-700', countUnit: 'projects' }
      )
    }

    if (reportType === 'suppliers') {
      const groups = groupRecordsByMonth(filteredData, s => s.created_at || s.date, s => s.totalSpent)
      return renderAccordionWrapper(
        groups,
        (group) => (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[#CBD5E1] bg-[#F1F5F9]">
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Supplier Name</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Phone / Email</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">KRA PIN</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Credit Limit</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {group.items.map(supplier => (
                <tr key={supplier.id} className="transition-all hover:bg-orange-50/30">
                  <td className="px-5 py-3.5 font-bold text-[#0F172A] whitespace-nowrap">{supplier.name}</td>
                  <td className="px-5 py-3.5 text-[#334155] font-semibold whitespace-nowrap">{supplier.contact || '—'}</td>
                  <td className="px-5 py-3.5 text-[#334155] whitespace-nowrap">
                    <div>{supplier.phone || '—'}</div>
                    {supplier.email && <div className="text-xs text-[#64748B]">{supplier.email}</div>}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-[#334155] whitespace-nowrap">{supplier.kra || '—'}</td>
                  <td className="px-5 py-3.5 font-semibold text-[#0F172A] whitespace-nowrap">
                    {supplier.credit ? `KSh ${Number(supplier.credit).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-3.5 font-black text-rose-600 whitespace-nowrap text-right">
                    KSh {Number(supplier.totalSpent || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#CBD5E1] bg-[#F8FAFC] font-black">
                <td colSpan={5} className="px-5 py-3 text-right text-xs uppercase tracking-wider text-[#334155]">
                  {group.label} Total Spent:
                </td>
                <td className="px-5 py-3 text-right text-sm text-rose-600 whitespace-nowrap">
                  KSh {Number(group.totalAmount || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        ),
        { borderColor: 'border-amber-500', totalColor: 'text-rose-600', countUnit: 'suppliers' }
      )
    }

    if (reportType === 'supplierExpenses') {
      const groups = groupRecordsByMonth(filteredData, e => e.date, e => e.amount)
      return renderAccordionWrapper(
        groups,
        (group) => (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[#CBD5E1] bg-[#F1F5F9]">
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Date</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Supplier</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Type / Category</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Remarks</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {group.items.map(expense => {
                const supplierName = data.suppliers.find(s => s.id === expense.supplier)?.name || 'Unknown'
                return (
                  <tr key={expense.id} className="transition-all hover:bg-orange-50/30">
                    <td className="px-5 py-3.5 font-bold whitespace-nowrap text-[#0F172A]">{expense.date}</td>
                    <td className="px-5 py-3.5 font-bold text-[#0F172A] whitespace-nowrap">{supplierName}</td>
                    <td className="px-5 py-3.5 text-[#334155] whitespace-nowrap">{expense.type}</td>
                    <td className="px-5 py-3.5 text-[#334155] max-w-sm truncate">{expense.remarks || '—'}</td>
                    <td className="px-5 py-3.5 font-black text-purple-700 whitespace-nowrap text-right">
                      KSh {Number(expense.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
              <tr className="border-t-2 border-[#CBD5E1] bg-[#F8FAFC] font-black">
                <td colSpan={4} className="px-5 py-3 text-right text-xs uppercase tracking-wider text-[#334155]">
                  {group.label} Subtotal:
                </td>
                <td className="px-5 py-3 text-right text-sm text-purple-700 whitespace-nowrap">
                  KSh {Number(group.totalAmount || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        ),
        { borderColor: 'border-purple-500', totalColor: 'text-purple-700', countUnit: 'vouchers' }
      )
    }

    if (reportType === 'inventory') {
      const groupsMap = {}
      ;(filteredData || []).forEach(item => {
        const cat = item.category || 'General'
        if (!groupsMap[cat]) {
          groupsMap[cat] = {
            key: cat,
            label: `${cat} Category`,
            items: [],
            totalAmount: 0
          }
        }
        groupsMap[cat].items.push(item)
        groupsMap[cat].totalAmount += (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
      })

      const groups = Object.keys(groupsMap).sort().map(k => groupsMap[k])

      return renderAccordionWrapper(
        groups,
        (group) => (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[#CBD5E1] bg-[#F1F5F9]">
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Item Name</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Category</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">SKU</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider text-right">Quantity</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider text-right">Reorder Level</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider text-right">Unit Price</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider text-right">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {group.items.map(item => {
                const isLow = Number(item.quantity || 0) <= Number(item.reorderLevel || 0)
                const val = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
                return (
                  <tr key={item.id} className="transition-all hover:bg-orange-50/30">
                    <td className="px-5 py-3.5 font-bold text-[#0F172A]">{item.name}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#EEF3FA] text-[#14243B] border border-[#CBD5E1]">
                        <Tag size={11} className="text-[#F97316]" />
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[#334155] whitespace-nowrap">{item.sku || '—'}</td>
                    <td className="px-5 py-3.5 font-black text-right whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isLow ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'text-[#0F172A]'
                      }`}>
                        {isLow && <AlertTriangle size={12} />}
                        {item.quantity} units
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#64748B] text-right whitespace-nowrap">
                      {item.reorderLevel || 0}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#0F172A] text-right whitespace-nowrap">
                      KSh {Number(item.unitPrice || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-black text-blue-700 text-right whitespace-nowrap">
                      KSh {val.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
              <tr className="border-t-2 border-[#CBD5E1] bg-[#F8FAFC] font-black">
                <td colSpan={6} className="px-5 py-3 text-right text-xs uppercase tracking-wider text-[#334155]">
                  {group.label} Stock Value:
                </td>
                <td className="px-5 py-3 text-right text-sm text-blue-700 whitespace-nowrap">
                  KSh {Number(group.totalAmount || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        ),
        { borderColor: 'border-orange-500', totalColor: 'text-blue-700', groupLabel: 'Category Breakdown', countUnit: 'items' }
      )
    }

    if (reportType === 'stockMovement') {
      const groups = groupRecordsByMonth(filteredData, t => t.created_at || t.date, t => t.quantity_change)
      return renderAccordionWrapper(
        groups,
        (group) => (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[#CBD5E1] bg-[#F1F5F9]">
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Date & Time</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Item Name</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Type</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider text-right">Change</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Reason / Linked Job</th>
                <th className="px-5 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {group.items.map(trans => {
                const itemName = data.inventory.find(i => i.id === trans.item_id)?.name || 'Unknown Item'
                let reason = trans.reason
                const projectMatch = reason?.match(/Project #(\d+)/)
                let clientName = null
                if (projectMatch) {
                  const design = data.designs.find(d => d.id == projectMatch[1])
                  if (design) clientName = design.client
                }

                return (
                  <tr key={trans.id} className="transition-all hover:bg-orange-50/30">
                    <td className="px-5 py-3.5 font-bold whitespace-nowrap text-xs text-[#0F172A]">
                      {new Date(trans.created_at || trans.date).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#0F172A] whitespace-nowrap">{itemName}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border ${
                        trans.transaction_type === 'RESTOCK'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : trans.transaction_type === 'VARIANCE'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-blue-50 text-blue-800 border-blue-300'
                      }`}>
                        {trans.transaction_type}
                      </span>
                    </td>
                    <td className={`px-5 py-3.5 font-black text-right whitespace-nowrap ${
                      trans.quantity_change > 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {trans.quantity_change > 0 ? `+${trans.quantity_change}` : trans.quantity_change} units
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#334155] max-w-xs truncate">
                      <span>{reason || '—'}</span>
                      {clientName && <span className="font-bold text-blue-700 ml-1">({clientName})</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-[#475569] whitespace-nowrap">
                      {trans.created_by || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ),
        { 
          borderColor: 'border-indigo-500', 
          countUnit: 'movements', 
          showTotal: false 
        }
      )
    }

    if (reportType === 'full') {
      const sales = filteredData.sales || []
      const expenses = filteredData.expenses || []
      const designs = filteredData.designs || []
      const totalSales = sales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
      const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
      const netProfit = totalSales - totalExpenses

      // Group full data by months
      const monthsMap = {}
      sales.forEach(s => {
        if (!s.date) return
        const d = new Date(s.date)
        if (isNaN(d.getTime())) return
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
        if (!monthsMap[key]) monthsMap[key] = { key, label, sales: 0, expenses: 0, salesList: [], expList: [] }
        monthsMap[key].sales += Number(s.amount || 0)
        monthsMap[key].salesList.push(s)
      })

      expenses.forEach(e => {
        if (!e.date) return
        const d = new Date(e.date)
        if (isNaN(d.getTime())) return
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
        if (!monthsMap[key]) monthsMap[key] = { key, label, sales: 0, expenses: 0, salesList: [], expList: [] }
        monthsMap[key].expenses += Number(e.amount || 0)
        monthsMap[key].expList.push(e)
      })

      const monthList = Object.keys(monthsMap).sort().reverse().map(k => monthsMap[k])

      return (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card border-l-4 border-emerald-500 py-4">
              <p className="text-xs font-black text-[#475569] uppercase tracking-wider mb-1">Gross Revenue</p>
              <h3 className="text-2xl font-black text-emerald-700">KSh {totalSales.toLocaleString()}</h3>
              <p className="text-xs font-semibold text-[#64748B] mt-1">{sales.length} verified transactions</p>
            </div>
            <div className="card border-l-4 border-rose-500 py-4">
              <p className="text-xs font-black text-[#475569] uppercase tracking-wider mb-1">Total Expenditures</p>
              <h3 className="text-2xl font-black text-rose-600">KSh {totalExpenses.toLocaleString()}</h3>
              <p className="text-xs font-semibold text-[#64748B] mt-1">{expenses.length} expense vouchers</p>
            </div>
            <div className={`card border-l-4 ${netProfit >= 0 ? 'border-emerald-500' : 'border-rose-500'} py-4`}>
              <p className="text-xs font-black text-[#475569] uppercase tracking-wider mb-1">Net Operating Margin</p>
              <h3 className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                KSh {netProfit.toLocaleString()}
              </h3>
              <p className="text-xs font-semibold text-[#64748B] mt-1">
                {totalSales > 0 ? `${((netProfit / totalSales) * 100).toFixed(1)}% margin` : 'No revenue'}
              </p>
            </div>
            <div className="card border-l-4 border-blue-500 py-4">
              <p className="text-xs font-black text-[#475569] uppercase tracking-wider mb-1">Portfolio Deliveries</p>
              <h3 className="text-2xl font-black text-blue-700">{(filteredData.clients || []).length} Clients</h3>
              <p className="text-xs font-semibold text-[#64748B] mt-1">{designs.length} active design jobs</p>
            </div>
          </div>

          {/* Month-by-Month Accordion Rollups */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#CBD5E1]">
              <span className="text-xs font-black uppercase text-[#475569] tracking-wider">
                Monthly Financial Rollups ({monthList.length} {monthList.length === 1 ? 'Period' : 'Periods'})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllExpanded(monthList.map(m => m.key), true)}
                  className="text-xs font-bold text-[#F97316] hover:underline"
                >
                  Expand All
                </button>
                <span className="text-[#94A3B8]">•</span>
                <button
                  type="button"
                  onClick={() => setAllExpanded(monthList.map(m => m.key), false)}
                  className="text-xs font-bold text-[#64748B] hover:underline"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {monthList.map((m, idx) => {
              const isExpanded = expandedMonths[m.key] ?? (idx === 0 || monthList.length === 1)
              const mNet = m.sales - m.expenses

              return (
                <div key={m.key} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleMonth(m.key)}
                    className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-5 py-3.5 bg-white rounded-xl border-l-4 border-blue-500 border border-[#CBD5E1] shadow-sm hover:bg-[#FFF7ED] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-[#69778A] group-hover:text-blue-600 transition-colors">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-[#0F172A] group-hover:text-blue-600 transition-colors">
                        {m.label}
                      </h2>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-extrabold">
                      <span className="text-emerald-700">Revenue: KSh {m.sales.toLocaleString()}</span>
                      <span className="text-rose-600">Expenses: KSh {m.expenses.toLocaleString()}</span>
                      <span className={`px-2.5 py-0.5 rounded-full border ${
                        mNet >= 0
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}>
                        Net: KSh {mNet.toLocaleString()}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="card p-5 rounded-xl border border-[#CBD5E1] bg-white animate-in fade-in slide-in-from-top-1 duration-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Top Month Sales</span>
                            <span className="text-xs font-bold text-[#475569]">{m.salesList.length} items</span>
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {m.salesList.slice(0, 5).map(s => (
                              <div key={s.id} className="flex justify-between items-center text-xs py-1 border-b border-[#E2E8F0] last:border-0">
                                <div>
                                  <span className="font-bold text-[#0F172A]">{s.client || 'Direct'}</span>
                                  <span className="text-[#64748B] ml-2">({s.dept})</span>
                                </div>
                                <span className="font-black text-emerald-700">KSh {Number(s.amount || 0).toLocaleString()}</span>
                              </div>
                            ))}
                            {m.salesList.length === 0 && <p className="text-xs text-[#94A3B8]">No sales in this period</p>}
                          </div>
                        </div>

                        <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-black text-rose-600 uppercase tracking-wider">Top Month Expenses</span>
                            <span className="text-xs font-bold text-[#475569]">{m.expList.length} items</span>
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {m.expList.slice(0, 5).map(e => (
                              <div key={e.id} className="flex justify-between items-center text-xs py-1 border-b border-[#E2E8F0] last:border-0">
                                <div>
                                  <span className="font-bold text-[#0F172A]">{e.cat}</span>
                                  <span className="text-[#64748B] ml-2 truncate max-w-[120px] inline-block">{e.desc}</span>
                                </div>
                                <span className="font-black text-rose-600">KSh {Number(e.amount || 0).toLocaleString()}</span>
                              </div>
                            ))}
                            {m.expList.length === 0 && <p className="text-xs text-[#94A3B8]">No expenses in this period</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )
    }
  }

  if (user?.role === 'admin' && !reportType) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="page-title">Reports Dashboard</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full border shadow-sm ${
                activeBranch === 'All'
                  ? 'bg-sky-50 text-sky-800 border-sky-300'
                  : activeBranch === 'iGift'
                  ? 'bg-purple-50 text-purple-800 border-purple-300'
                  : 'bg-orange-50 text-orange-900 border-orange-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  activeBranch === 'All' ? 'bg-sky-500' : activeBranch === 'iGift' ? 'bg-purple-500' : 'bg-orange-500'
                }`} />
                {activeBranch === 'All' ? 'All Branches (Consolidated)' : (activeBranch === 'iGift' ? 'iGift Shop' : 'IGH Branch')}
              </span>
            </div>
            <p className="page-subtitle">Select a report category to view detailed data and exports.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
                <Calendar size={16} />
                <span className="text-xs font-extrabold uppercase tracking-widest">Period</span>
             </div>
             <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-400/50 cursor-pointer min-w-[130px]"
                />
                <span className="text-slate-400 font-bold text-sm">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-400/50 cursor-pointer min-w-[130px]"
                />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {reportTypes.map((report) => (
            <button
              key={report.value}
              onClick={() => setReportType(report.value)}
              className={`group flex flex-col p-5 card border-l-4 ${report.color} hover:border-[#F97316] hover:-translate-y-1 transition-all duration-200 text-left`}
            >
              <div className="mb-4 p-3 bg-slate-50 rounded-2xl group-hover:scale-110 group-hover:bg-amber-50 transition-all duration-200 w-fit">
                {report.icon}
              </div>
              <h3 className="text-base font-black text-[#0F172A] group-hover:text-[#F97316] transition-colors mb-1.5">{report.label}</h3>
              <p className="text-xs text-[#334155] font-semibold leading-relaxed flex-1">{report.desc}</p>
              <div className="mt-4 flex items-center text-[#F97316] font-black text-xs gap-1">
                View Report <Eye size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="card text-center py-5">
              <p className="text-xs font-extrabold text-[#334155] uppercase tracking-wider mb-1.5">Total Sales</p>
              <p className="text-2xl font-black text-emerald-700">KSh {(data.sales || []).reduce((sum, s) => sum + (Number(s.amount) || 0), 0).toLocaleString()}</p>
           </div>
           <div className="card text-center py-5">
              <p className="text-xs font-extrabold text-[#334155] uppercase tracking-wider mb-1.5">Total Expenses</p>
              <p className="text-2xl font-black text-rose-600">KSh {(data.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toLocaleString()}</p>
           </div>
           <div className="card text-center py-5">
              <p className="text-xs font-extrabold text-[#334155] uppercase tracking-wider mb-1.5">Stock Value</p>
              <p className="text-2xl font-black text-blue-700">KSh {(data.inventory || []).reduce((sum, i) => sum + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)), 0).toLocaleString()}</p>
           </div>
           <div className="card text-center py-5">
              <p className="text-xs font-extrabold text-[#334155] uppercase tracking-wider mb-1.5">Active View</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full border ${
                  activeBranch === 'All'
                    ? 'bg-sky-50 text-sky-800 border-sky-300'
                    : activeBranch === 'iGift'
                    ? 'bg-purple-50 text-purple-800 border-purple-300'
                    : 'bg-orange-50 text-orange-900 border-orange-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    activeBranch === 'All' ? 'bg-sky-500' : activeBranch === 'iGift' ? 'bg-purple-500' : 'bg-orange-500'
                  }`} />
                  {activeBranch === 'All' ? 'All Branches' : (activeBranch === 'iGift' ? 'iGift Shop' : 'IGH Branch')}
                </span>
              </div>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <button
              onClick={() => setReportType(null)}
              className="topbar-btn"
              title="Back to Reports"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="page-title">
              {reportTypes.find(r => r.value === reportType)?.label || 'Report'}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={generateCSV} className="btn-secondary flex items-center gap-2">
            <Download size={16} className="text-blue-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button onClick={generatePDF} className="btn-secondary flex items-center gap-2 text-rose-600">
            <FileText size={16} />
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
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input cursor-pointer"
            />
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
