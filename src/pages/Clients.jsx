import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { Plus, Edit2, Trash2, Phone, MapPin, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function Clients() {
  const { data, addClient, updateClient, deleteClient } = useData()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')

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

  const filteredClients = data.clients.filter(c => {
    const query = search.toLowerCase()
    return (c.name || '').toLowerCase().includes(query) ||
           (c.phone || '').toLowerCase().includes(query) ||
           (c.location || '').toLowerCase().includes(query) ||
           (c.address || '').toLowerCase().includes(query)
  })

  const getClientTotalSales = (clientName) => {
    return data.sales
      .filter(s => s.client === clientName)
      .reduce((sum, s) => sum + s.amount, 0)
  }

  const handleExportSOA = (client) => {
    const doc = new jsPDF()
    const projects = data.designs.filter(d => d.client === client.name)
    const sales = data.sales.filter(s => s.client === client.name)
    
    doc.setFontSize(20)
    doc.text(`Statement of Account`, 14, 22)
    doc.setFontSize(12)
    doc.text(`Client: ${client.name}`, 14, 32)
    doc.text(`Phone: ${client.phone}`, 14, 38)
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
        p.type,
        `KSh ${b.toLocaleString()}`,
        `KSh ${pd.toLocaleString()}`,
        `KSh ${(b - pd).toLocaleString()}`
      ]
    })

    // Include direct sales
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

    const finalY = doc.lastAutoTable.finalY || 50
    doc.setFontSize(14)
    doc.text(`Total Billed: KSh ${totalBilled.toLocaleString()}`, 14, finalY + 10)
    doc.text(`Total Paid: KSh ${totalPaid.toLocaleString()}`, 14, finalY + 18)
    doc.text(`Outstanding Balance: KSh ${(totalBilled - totalPaid).toLocaleString()}`, 14, finalY + 26)

    doc.save(`${client.name}_SOA.pdf`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Clients Management</h1>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <input
          type="text"
          placeholder="Search by name, phone, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
        />
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Address</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Location</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total Sales</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client, idx) => (
              <tr key={client.id} className={`border-b border-gray-200 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
                <td className="px-6 py-3 text-sm font-medium">{client.name}</td>
                <td className="px-6 py-3 text-sm flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  {client.phone}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{client.address}</td>
                <td className="px-6 py-3 text-sm flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  {client.location}
                </td>
                <td className="px-6 py-3 text-sm font-semibold text-green-600">KSh {getClientTotalSales(client.name).toLocaleString()}</td>
                <td className="px-6 py-3 text-sm flex gap-2">
                  <button onClick={() => handleExportSOA(client)} className="btn-secondary p-2 text-blue-600 bg-blue-50 hover:bg-blue-100" title="Export SOA">
                    <FileText size={16} />
                  </button>
                  <button onClick={() => handleOpenModal(client)} className="btn-secondary p-2">
                    <Edit2 size={16} />
                  </button>
                  {user?.role === 'admin' && (
                    <button onClick={() => deleteClient(client.id)} className="btn-danger p-2">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredClients.length === 0 && (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">No clients found</div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Edit Client' : 'Add New Client'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client Name*</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="form-input"
              placeholder="0700000000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="form-input"
              placeholder="Street address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="form-input"
              placeholder="City / Area"
            />
          </div>
          {user?.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch Assignment</label>
              <select
                value={formData.branch || 'IGH'}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="form-input font-semibold"
              >
                <option value="IGH">IGH</option>
                <option value="iGift">iGift</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Assign this client to a specific shop.</p>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-success flex-1">Save Client</button>
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
