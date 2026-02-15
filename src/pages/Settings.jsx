import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../App'
import Modal from '../components/Modal'
import { Plus, Edit2, Trash2, Trash } from 'lucide-react'

export default function Settings() {
  const { data, addUser, updateUser, deleteUser, clearAllData, logAudit } = useData()
  const { user } = useAuth()
  const [tab, setTab] = useState('users')
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [auditSearch, setAuditSearch] = useState('')

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    pref_compact: false
  })

  const roles = ['admin', 'designer', 'user']

  // User Management
  const handleOpenUserModal = (u = null) => {
    if (u) {
      setUserForm({ ...u })
      setEditId(u.username)
    } else {
      setUserForm({ username: '', email: '', password: '', role: 'user', pref_compact: false })
      setEditId(null)
    }
    setIsOpen(true)
  }

  const handleUserSubmit = (e) => {
    e.preventDefault()
    if (!userForm.username || !userForm.password) {
      alert('Username and password are required')
      return
    }

    // enforce lowercase username
    const normalized = userForm.username.toLowerCase()
    const payload = { ...userForm, username: normalized }

    try {
      if (editId) {
        updateUser(editId, payload)
        logAudit('UPDATE', 'Users', `Updated user: ${normalized}`)
      } else {
        addUser(payload)
        logAudit('CREATE', 'Users', `Added user: ${normalized}`)
      }
    } catch (err) {
      alert(err.message || 'Failed to save user')
      return
    }
    setIsOpen(false)
  }

  const filteredUsers = data.users.filter(u =>
    (u.username || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(auditSearch.toLowerCase())
  )

  // Audit Trail
  const filteredAudit = data.audit.filter(a =>
    a.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
    a.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    a.module.toLowerCase().includes(auditSearch.toLowerCase()) ||
    a.details.toLowerCase().includes(auditSearch.toLowerCase())
  )

  const handleReset = () => {
    if (window.confirm('Type "RESET" to confirm clearing all data:')) {
      const confirmation = window.prompt('Enter "RESET":')
      if (confirmation === 'RESET') {
        clearAllData()
        logAudit('CRITICAL', 'System', 'All data cleared')
        alert('All data has been cleared')
      }
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => { setTab('users'); setAuditSearch(''); }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'users'
              ? 'border-primary-gold text-primary-gold'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          User Management
        </button>
        <button
          onClick={() => { setTab('audit'); setAuditSearch(''); }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'audit'
              ? 'border-primary-gold text-primary-gold'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Audit Trail
        </button>
        <button
          onClick={() => { setTab('system'); setAuditSearch(''); }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'system'
              ? 'border-primary-gold text-primary-gold'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          System
        </button>
      </div>

      {/* User Management Tab */}
      {tab === 'users' && (
        <div className="space-y-4">
          <button onClick={() => handleOpenUserModal()} className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            Add User
          </button>

          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Username</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Compact Mode</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => (
                  <tr key={u.username} className={`border-b border-gray-200 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
                    <td className="px-6 py-3 text-sm font-medium">{u.username}</td>
                    <td className="px-6 py-3 text-sm font-medium">{u.email}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-red-100 text-red-800' :
                        u.role === 'designer' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">{u.pref_compact ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-3 text-sm flex gap-2">
                      <button onClick={() => handleOpenUserModal(u)} className="btn-secondary p-2">
                        <Edit2 size={16} />
                      </button>
                        {user?.role === 'admin' && data.users.length > 1 && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete user ${u.username}?`)) {
                                deleteUser(u.username)
                                logAudit('DELETE', 'Users', `Deleted user: ${u.username}`)
                              }
                            }}
                            className="btn-danger p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Trail Tab */}
      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="card">
            <input
              type="text"
              placeholder="Search audit log..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Timestamp</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">User</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Action</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Module</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudit.slice(0, 100).map((entry, idx) => (
                  <tr key={idx} className={`border-b border-gray-200 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
                    <td className="px-6 py-2">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-2">{entry.user}</td>
                    <td className="px-6 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        entry.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                        entry.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                        entry.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-6 py-2">{entry.module}</td>
                    <td className="px-6 py-2 text-gray-600 dark:text-gray-400">{entry.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAudit.length === 0 && (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">No audit entries found</div>
            )}
          </div>
        </div>
      )}

      {/* System Tab */}
      {tab === 'system' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">System Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{data.users.length}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Clients</p>
                <p className="text-2xl font-bold text-green-600">{data.clients.length}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
                <p className="text-2xl font-bold text-orange-600">{data.sales.length}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{data.expenses.length}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Design Projects</p>
                <p className="text-2xl font-bold text-purple-600">{data.designs.length}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Audit Entries</p>
                <p className="text-2xl font-bold text-indigo-600">{data.audit.length}</p>
              </div>
            </div>
          </div>

          <div className="card border-2 border-red-200 dark:border-red-800">
            <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
              <Trash size={20} />
              Danger Zone
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Clear all data in the system. This action cannot be undone.
            </p>
            <button
              onClick={handleReset}
              className="btn-danger"
            >
              Clear All Data
            </button>
          </div>
        </div>
      )}

      {/* User Modal */}
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Edit User' : 'Add New User'}>
        <form onSubmit={handleUserSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username* (lowercase)</label>
            <input
              type="text"
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value.toLowerCase() })}
              className="form-input"
              required
              disabled={!!editId}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password*</label>
            <input
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              className="form-input"
            >
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="compact"
              checked={userForm.pref_compact}
              onChange={(e) => setUserForm({ ...userForm, pref_compact: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="compact" className="text-sm text-gray-700 dark:text-gray-300">Default to Compact Mode</label>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-success flex-1">Save User</button>
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
