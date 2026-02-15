import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../App'
import Modal from '../components/Modal'
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'

export default function DesignProjects() {
  const { data, addDesign, updateDesign, deleteDesign } = useData()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: '',
    client: '',
    amount: '',
    assignedTo: '',
    completion: '',
    status: 'In Progress',
    paymentStatus: 'Not Started',
    paymentAmount: '',
    paymentDate: '',
    source: 'Design Project'
  })

  const statuses = ['In Progress', 'Completed', 'Pending', 'Outsourced']

  const handleOpenModal = (design = null) => {
    if (design) {
      setFormData(design)
      setEditId(design.id)
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: '',
        client: '',
        amount: '',
        assignedTo: '',
        completion: '',
        status: 'In Progress',
        paymentStatus: 'Not Started',
        paymentAmount: '',
        paymentDate: '',
        source: 'Design Project'
      })
      setEditId(null)
    }
    setIsOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.type || !formData.client) {
      alert('Please fill all required fields')
      return
    }

    if (editId) {
      updateDesign(editId, formData)
    } else {
      addDesign(formData)
    }
    setIsOpen(false)
  }

  const designersList = data.users.filter(u => u.role === 'designer')

  const filteredDesigns = data.designs.filter(d => {
    const matchSearch = d.type.toLowerCase().includes(search.toLowerCase()) ||
                       d.client.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || d.status === filterStatus
    return matchSearch && matchStatus
  })

  const getClientName = (id) => {
    return data.clients.find(c => c.id === id)?.name || 'Unknown'
  }

  const noClientsWarning = data.clients.length === 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Design Projects</h1>
        {noClientsWarning && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm">
            <AlertCircle size={16} />
            Add clients first
          </div>
        )}
        <button
          onClick={() => handleOpenModal()}
          disabled={noClientsWarning}
          title={noClientsWarning ? 'Add clients first' : ''}
          className={`btn-primary flex items-center gap-2 ${noClientsWarning ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Plus size={20} />
          Add Design
        </button>
      </div>

      {/* Filters */}
      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search by project type or client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-input">
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Projects:</span>
          <span className="font-bold text-blue-600">{filteredDesigns.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Client</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Designer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Completion</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Payment Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Payment Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDesigns.map((design, idx) => (
              <tr key={design.id} className={`border-b border-gray-200 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
                <td className="px-6 py-3 text-sm">{design.date}</td>
                <td className="px-6 py-3 text-sm font-medium">{design.type}</td>
                <td className="px-6 py-3 text-sm">{design.client}</td>
                <td className="px-6 py-3 text-sm">{(data.users.find(u => u.username === design.assignedTo)?.username) || design.assignedTo}</td>
                <td className="px-6 py-3 text-sm font-semibold text-green-600">KSh {design.amount?.toLocaleString() || '0'}</td>
                <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{design.completion}</td>
                <td className="px-6 py-3 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    design.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    design.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    design.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {design.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    design.paymentStatus === 'Full' ? 'bg-green-100 text-green-800' :
                    design.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {design.paymentStatus || 'Not Started'}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm font-semibold text-amber-600">KSh {design.paymentAmount?.toLocaleString() || '0'}</td>
                <td className="px-6 py-3 text-sm flex gap-2">
                  {(user?.role === 'admin' || user?.role === 'designer') && (
                    <button onClick={() => handleOpenModal(design)} className="btn-secondary p-2">
                      <Edit2 size={16} />
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <button onClick={() => deleteDesign(design.id)} className="btn-danger p-2">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredDesigns.length === 0 && (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">No design projects found</div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Edit Design Project' : 'Add New Design Project'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date*</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Type*</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="form-input"
                placeholder="e.g., Logo Design"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client*</label>
              <select
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="form-input"
                required
              >
                <option value="">Select Client</option>
                {data.clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount (KSh)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assigned To</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="form-input"
              >
                <option value="">Unassigned</option>
                {designersList.map(d => (
                  <option key={d.username} value={d.username}>{d.username}{d.email ? ` — ${d.email}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Completion Date</label>
              <input
                type="date"
                value={formData.completion}
                onChange={(e) => setFormData({ ...formData, completion: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-input"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Payment Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Payment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Status</label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                  className="form-input"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="Partial">Partial</option>
                  <option value="Full">Full</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Amount (KSh)</label>
                <input
                  type="number"
                  value={formData.paymentAmount}
                  onChange={(e) => setFormData({ ...formData, paymentAmount: parseFloat(e.target.value) || '' })}
                  className="form-input"
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Date</label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-success flex-1">Save Design</button>
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
