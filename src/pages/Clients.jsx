import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Phone, 
  MapPin, 
  FileText, 
  Search, 
  Users, 
  DollarSign, 
  ShoppingBag, 
  RotateCcw, 
  Sparkles,
  UserCheck
} from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function Clients() {
  const { data, addClient, updateClient, deleteClient, selectedBranch } = useData()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')

  const activeBranch = user?.role === 'admin' ? selectedBranch : user?.branch

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    location: ''
  })

  const handleOpenModal = (client = null) => {
    if (client) {
      setFormData(client)
      setEditId(client.id)
    } else {
      setFormData({ name: '', phone: '', address: '', location: '' })
      setEditId(null)
    }
    setIsOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name) {
      alert('Client name is required')
      return
    }

    if (editId) {
      updateClient(editId, formData)
    } else {
      addClient(formData)
    }
    setIsOpen(false)
  }

  const filteredClients = useMemo(() => {
    return (data.clients || []).filter(c => {
      const query = search.toLowerCase()
      return !query ||
        (c.name || '').toLowerCase().includes(query) ||
        (c.phone || '').toLowerCase().includes(query) ||
        (c.location || '').toLowerCase().includes(query) ||
        (c.address || '').toLowerCase().includes(query)
    })
  }, [data.clients, search])

  const getClientTotalSales = (clientName) => {
    return (data.sales || [])
      .filter(s => s.client === clientName)
      .reduce((sum, s) => sum + Number(s.amount || 0), 0)
  }

  const getClientSalesCount = (clientName) => {
    return (data.sales || []).filter(s => s.client === clientName).length
  }

  const metrics = useMemo(() => {
    const clientList = data.clients || []
    const salesList = data.sales || []
    const totalVolume = salesList.reduce((sum, s) => sum + Number(s.amount || 0), 0)
    const totalPaid = salesList
      .filter(s => s.paymentStatus === 'Paid' || s.paymentStatus === 'Full')
      .reduce((sum, s) => sum + Number(s.amount || 0), 0)
    const totalPending = Math.max(0, totalVolume - totalPaid)
    const activeClientsCount = clientList.filter(c => getClientSalesCount(c.name) > 0).length
    const avgSpend = clientList.length > 0 ? totalVolume / clientList.length : 0

    return {
      totalClients: clientList.length,
      totalVolume,
      totalPaid,
      totalPending,
      activeClientsCount,
      avgSpend
    }
  }, [data.clients, data.sales])

  const handleExportSOA = (client) => {
    const doc = new jsPDF()
    const projects = (data.designs || []).filter(d => d.client === client.name)
    const sales = (data.sales || []).filter(s => s.client === client.name)
    
    doc.setFontSize(20)
    doc.text(`Statement of Account`, 14, 22)
    doc.setFontSize(12)
    doc.text(`Client: ${client.name}`, 14, 32)
    doc.text(`Phone: ${client.phone || 'N/A'}`, 14, 38)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 44)

    let totalBilled = 0
    let totalPaid = 0

    const tableData = projects.map(p => {
      const b = Number(p.amount) || 0
      const pd = Number(p.paymentAmount) || 0
      totalBilled += b
      totalPaid += pd
      return [
        p.date,
        p.type || 'Design Project',
        `KSh ${b.toLocaleString()}`,
        `KSh ${pd.toLocaleString()}`,
        `KSh ${(b - pd).toLocaleString()}`
      ]
    })

    sales.forEach(s => {
      if (!s.designId) {
         const amt = Number(s.amount) || 0
         totalBilled += amt
         totalPaid += amt
         tableData.push([
           s.date,
           `Direct Sale: ${s.desc || s.dept}`,
           `KSh ${amt.toLocaleString()}`,
           `KSh ${amt.toLocaleString()}`,
           `KSh 0`
         ])
      }
    })

    doc.autoTable({
      startY: 50,
      head: [['Date', 'Description', 'Amount Billed', 'Amount Paid', 'Balance']],
      body: tableData,
    })

    const finalY = doc.lastAutoTable?.finalY || 50
    doc.setFontSize(14)
    doc.text(`Total Billed: KSh ${totalBilled.toLocaleString()}`, 14, finalY + 10)
    doc.text(`Total Paid: KSh ${totalPaid.toLocaleString()}`, 14, finalY + 18)
    doc.text(`Outstanding Balance: KSh ${(totalBilled - totalPaid).toLocaleString()}`, 14, finalY + 26)

    doc.save(`${client.name}_Statement.pdf`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Clients Directory</h1>
            <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              {activeBranch} Branch
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage customer relationships, track purchase histories, and issue statements of accounts.
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus size={17} />
          Add Client Record
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-start justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Accounts</p>
            <h3 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1.5 tracking-tight">{(metrics.totalClients || 0)}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Registered accounts</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Users size={20} />
          </div>
        </div>

        <div className="card flex items-start justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Gross Client Invoicing</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1.5 tracking-tight">KSh {(metrics.totalVolume || 0).toLocaleString()}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Historical billings</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="card flex items-start justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Collected Receivables</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5 tracking-tight">KSh {(metrics.totalPaid || 0).toLocaleString()}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Settled client payments</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="card flex items-start justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pending Receivables</p>
            <h3 className={`text-2xl font-extrabold mt-1.5 tracking-tight ${(metrics.totalPending || 0) > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
              KSh {(metrics.totalPending || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Outstanding client balances</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <CreditCard size={20} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by client name, phone, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9"
            />
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold">
              <RotateCcw size={12} />
              Reset Search
            </button>
          )}
        </div>
      </div>

      {/* Client Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Client Name</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Phone & Contact</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Location / Address</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Lifetime Sales</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredClients.map((client) => {
              const totalSpent = getClientTotalSales(client.name) || 0
              const ordersCount = getClientSalesCount(client.name) || 0

              return (
                <tr key={client.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                  <td className="px-6 py-4 text-sm">
                    <div className="font-bold text-slate-800 dark:text-white">{client.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{ordersCount} recorded purchases</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {client.phone ? (
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <Phone size={14} className="text-blue-500" />
                        {client.phone}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {client.location || client.address ? (
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <MapPin size={14} className="text-amber-500" />
                        {client.location || client.address}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    KSh {Number(totalSpent || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => handleExportSOA(client)} title="Export Statement of Account" className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold px-2.5">
                        <FileText size={15} />
                        SOA PDF
                      </button>
                      <button onClick={() => handleOpenModal(client)} title="Edit Client" className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete client "${client.name}"?`)) {
                              deleteClient(client.id)
                            }
                          }}
                          title="Delete Client"
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
        {filteredClients.length === 0 && (
          <div className="p-10 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 space-y-4">
            <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto">
              <Sparkles size={28} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">No Client Records Found</h3>
              <p className="text-xs text-gray-500">There are no client profiles matching your search criteria.</p>
            </div>
            <button onClick={() => handleOpenModal()} className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-xs font-bold shadow-lg">
              <Plus size={16} />
              Add Client Record
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Client Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Edit Client Details' : 'Add New Client'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client / Business Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              placeholder="e.g. Dandelion Africa, Nakuru Specialist..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input"
                placeholder="e.g. +254 700 000 000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location / Town</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="form-input"
                placeholder="e.g. Nakuru CBD"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Physical Address / Notes</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="form-input"
              rows="2"
              placeholder="Building, street, or additional contact notes..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="submit" className="btn-success flex-1 py-3 font-bold uppercase tracking-wider shadow-md">
              {editId ? 'Update Client' : 'Save Client'}
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
