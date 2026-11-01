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
  UserCheck,
  CheckCircle2,
  CreditCard
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
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">Clients Directory</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${
              activeBranch === 'All' ? 'bg-sky-50 text-sky-800 border-sky-300' : (activeBranch === 'iGift' ? 'bg-purple-50 text-purple-800 border-purple-300' : 'bg-orange-50 text-orange-900 border-orange-300')
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                activeBranch === 'All' ? 'bg-sky-500' : (activeBranch === 'iGift' ? 'bg-purple-500' : 'bg-orange-500')
              }`} />
              {activeBranch === 'All' ? 'All Branches (Consolidated)' : (activeBranch === 'iGift' ? 'iGift Shop' : 'IGH Branch')}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#334155] font-semibold mt-1">
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
        <div className="card flex items-start justify-between">
          <div>
            <p className="text-[12px] font-extrabold text-[#334155] uppercase tracking-wider">Active Accounts</p>
            <h3 className="text-2xl font-black text-blue-700 mt-1.5 tracking-tight">{(metrics.totalClients || 0)}</h3>
            <p className="text-xs font-semibold text-[#475569] mt-0.5">Registered accounts</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Users size={20} />
          </div>
        </div>

        <div className="card flex items-start justify-between">
          <div>
            <p className="text-[12px] font-extrabold text-[#334155] uppercase tracking-wider">Gross Client Invoicing</p>
            <h3 className="text-2xl font-black text-[#0F172A] mt-1.5 tracking-tight">KSh {(metrics.totalVolume || 0).toLocaleString()}</h3>
            <p className="text-xs font-semibold text-[#475569] mt-0.5">Historical billings</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="card flex items-start justify-between">
          <div>
            <p className="text-[12px] font-extrabold text-[#334155] uppercase tracking-wider">Collected Receivables</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1.5 tracking-tight">KSh {(metrics.totalPaid || 0).toLocaleString()}</h3>
            <p className="text-xs font-semibold text-[#475569] mt-0.5">Settled client payments</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="card flex items-start justify-between">
          <div>
            <p className="text-[12px] font-extrabold text-[#334155] uppercase tracking-wider">Pending Receivables</p>
            <h3 className={`text-2xl font-black mt-1.5 tracking-tight ${(metrics.totalPending || 0) > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              KSh {(metrics.totalPending || 0).toLocaleString()}
            </h3>
            <p className="text-xs font-semibold text-[#475569] mt-0.5">Outstanding client balances</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <CreditCard size={20} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 bg-white rounded-xl border border-[#CBD5E1] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-3 text-[#334155]" size={16} />
            <input
              type="text"
              placeholder="Search by client name, phone, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9"
            />
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-[#F97316] hover:underline flex items-center gap-1 font-bold">
              <RotateCcw size={12} />
              Reset Search
            </button>
          )}
        </div>
      </div>

      {/* Client Table */}
      <div className="card overflow-x-auto p-0 rounded-xl border border-[#CBD5E1]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-[#CBD5E1] bg-[#F1F5F9]">
              <th className="px-6 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Client Name</th>
              <th className="px-6 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Phone & Contact</th>
              <th className="px-6 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Location / Address</th>
              <th className="px-6 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider">Lifetime Sales</th>
              <th className="px-6 py-3.5 text-xs font-black text-[#0F172A] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredClients.map((client) => {
              const totalSpent = getClientTotalSales(client.name) || 0
              const ordersCount = getClientSalesCount(client.name) || 0

              return (
                <tr key={client.id} className="transition-all">
                  <td className="px-6 py-4 text-sm">
                    <div className="font-bold text-[#0F172A]">{client.name}</div>
                    <div className="text-xs font-semibold text-[#475569] mt-0.5">{ordersCount} recorded purchases</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {client.phone ? (
                      <div className="flex items-center gap-1.5 text-[#0F172A] font-bold">
                        <Phone size={14} className="text-[#F97316]" />
                        {client.phone}
                      </div>
                    ) : (
                      <span className="text-[#64748B] text-xs font-semibold">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {client.location || client.address ? (
                      <div className="flex items-center gap-1 text-[#334155] font-semibold">
                        <MapPin size={14} className="text-[#F97316]" />
                        {client.location || client.address}
                      </div>
                    ) : (
                      <span className="text-[#64748B] text-xs font-semibold">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-emerald-700">
                    KSh {Number(totalSpent || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => handleExportSOA(client)} title="Export Statement of Account" className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-lg transition-all flex items-center gap-1 text-xs font-bold px-2.5 border border-purple-200">
                        <FileText size={15} />
                        SOA PDF
                      </button>
                      <button onClick={() => handleOpenModal(client)} title="Edit Client" className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all hover:scale-110">
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
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all hover:scale-110"
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
