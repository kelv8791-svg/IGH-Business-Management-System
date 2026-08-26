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
    const totalRevenue = (data.sales || []).reduce((sum, s) => sum + Number(s.amount || 0), 0)
    const activeClientsCount = clientList.filter(c => getClientSalesCount(c.name) > 0).length
    const avgSpend = clientList.length > 0 ? totalRevenue / clientList.length : 0

    return {
      totalClients: clientList.length,
      totalRevenue,
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Clients Directory</h1>
            <span className="px-3 py-1 text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
              {activeBranch} Branch
            </span>
          </div>
          <p className="text-sm text-gray-300 mt-1">
            Manage customer relationships, track purchase histories, and issue statements of accounts.
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2 py-3 px-5 text-sm font-bold shadow-lg hover:shadow-primary-gold/20 transition-all">
          <Plus size={18} />
          Add Client
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered Clients</p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">{metrics.totalClients}</h3>
            <p className="text-xs text-gray-500 mt-1">Total client portfolio</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
            <Users size={24} />
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Purchasing Clients</p>
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">{metrics.activeClientsCount}</h3>
            <p className="text-xs text-gray-500 mt-1">Clients with recorded sales</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-xl">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Client Revenue Generated</p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">KSh {metrics.totalRevenue.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Lifetime total revenue</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Lifetime Value</p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">KSh {Math.round(metrics.avgSpend).toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Average spend per client</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
            <ShoppingBag size={24} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by client name, phone, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9"
            />
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-primary-gold hover:underline flex items-center gap-1 font-semibold">
              <RotateCcw size={12} />
              Reset Search
            </button>
          )}
        </div>
      </div>

      {/* Client Table */}
      <div className="card overflow-x-auto p-0 rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80">
              <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Client Name</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Phone & Contact</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Location / Address</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Lifetime Sales</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredClients.map((client) => {
              const totalSpent = getClientTotalSales(client.name)
              const ordersCount = getClientSalesCount(client.name)

              return (
                <tr key={client.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm">
                    <div className="font-bold text-gray-800 dark:text-white">{client.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{ordersCount} recorded purchases</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {client.phone ? (
                      <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium">
                        <Phone size={14} className="text-blue-500" />
                        {client.phone}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {client.location || client.address ? (
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <MapPin size={14} className="text-amber-500" />
                        {client.location || client.address}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-extrabold text-green-600 dark:text-green-400">
                    KSh {totalSpent.toLocaleString()}
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
