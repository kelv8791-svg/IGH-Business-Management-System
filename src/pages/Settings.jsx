import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { Plus, Edit2, Trash2, Trash, CloudCog, User, Key, Save, Shield } from 'lucide-react'
import { migrateLocalStorageToSupabase } from '../utils/migrateData'

export default function Settings() {
  const { data, addUser, updateUser, deleteUser, clearAllData, logAudit } = useData()
  const { user } = useAuth()
  const [tab, setTab] = useState('account') // Default to 'account' for all users
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [auditSearch, setAuditSearch] = useState('')

  // User Management Form
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',

    role: 'user',
    branch: 'IGH',
    pref_compact: false
  })

  // Change Password Form (My Account)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' })

  const roles = ['admin', 'designer', 'user']

  // User Management Handlers
  const handleOpenUserModal = (u = null) => {
    if (u) {
      setUserForm({ ...u })
      setEditId(u.username)
    } else {
      setUserForm({ username: '', email: '', password: '', role: 'user', branch: 'IGH', pref_compact: false })
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

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordMsg({ type: '', text: '' })

    const { currentPassword, newPassword, confirmPassword } = passwordForm

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters' })
      return
    }

    // Verify current password against data
    // Note: In a real app, strict backend verification is better, but here we check against loaded data
    // equivalent to how authentication checks are done in this app context.
    const currentUserRecord = data.users.find(u => u.username === user.username)
    
    if (!currentUserRecord || currentUserRecord.password !== currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Incorrect current password' })
      return
    }

    try {
      await updateUser(user.username, { password: newPassword })
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      logAudit('UPDATE', 'Users', `User ${user.username} changed their own password`)
    } catch (err) {
      setPasswordMsg({ type: 'error', text: 'Failed to update password: ' + err.message })
    }
  }

  const filteredUsers = data.users.filter(u =>
    (u.username || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(auditSearch.toLowerCase())
  )

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

  const handleMigrate = async () => {
    if (window.confirm('This will push all your current localStorage data to Supabase. Existing records with same IDs will be overwritten. Proceed?')) {
      const btn = document.getElementById('migrate-btn')
      if (btn) btn.disabled = true
      try {
        const result = await migrateLocalStorageToSupabase()
        if (result.success) {
          alert('Migration completed successfully!')
          logAudit('SYSTEM', 'Migration', 'Local data migrated to Supabase')
          window.location.reload()
        } else {
          alert('Migration failed: ' + (result.message || 'Unknown error'))
        }
      } catch (err) {
        alert('Migration error: ' + err.message)
      } finally {
        if (btn) btn.disabled = false
      }
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setTab('account')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            tab === 'account'
              ? 'border-primary-gold text-primary-gold'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          My Account
        </button>
        {/* Only Admin sees User Management and System */}
        {user?.role === 'admin' && (
          <>
            <button
              onClick={() => { setTab('users'); setAuditSearch(''); }}
              className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === 'users'
                  ? 'border-primary-gold text-primary-gold'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => { setTab('audit'); setAuditSearch(''); }}
              className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === 'audit'
                  ? 'border-primary-gold text-primary-gold'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Audit Trail
            </button>
            <button
              onClick={() => { setTab('system'); setAuditSearch(''); }}
              className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === 'system'
                  ? 'border-primary-gold text-primary-gold'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              System
            </button>
          </>
        )}
      </div>

      {/* My Account Tab */}
      {tab === 'account' && (
        <div className="max-w-2xl mx-auto md:mx-0">
          <div className="card space-y-6">
            <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="w-16 h-16 bg-primary-gold/10 rounded-full flex items-center justify-center text-primary-gold">
                <User size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white capitalize">{user?.username || 'User'}</h2>
                <p className="text-sm text-gray-500 capitalize flex items-center gap-1">
                  <Shield size={14} />
                  {user?.role || 'Guest'}
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Key size={18} />
                Change Password
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="form-input"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="form-input"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="form-input"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {passwordMsg.text && (
                <div className={`p-3 rounded text-sm ${
                  passwordMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {passwordMsg.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Save size={18} />
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Management Tab (Admin Only) */}
      {tab === 'users' && user?.role === 'admin' && (
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Branch</th>
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
                    <td className="px-6 py-3 text-sm">{u.branch || 'IGH'}</td>
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

      {/* Audit Trail Tab (Admin Only) */}
      {tab === 'audit' && user?.role === 'admin' && (
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

      {/* System Tab (Admin Only) */}
      {tab === 'system' && user?.role === 'admin' && (
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

          <div className="card border-2 border-primary-gold/30 dark:border-primary-gold/20">
            <h3 className="text-lg font-semibold text-primary-gold mb-4 flex items-center gap-2">
              <CloudCog size={20} />
              Cloud Migration
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Push your existing local browser data to the Supabase cloud database. 
              This will sync all your current sales, clients, and inventory data.
            </p>
            <button
              id="migrate-btn"
              onClick={handleMigrate}
              className="btn-primary"
            >
              Migrate Local Data to Cloud
            </button>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
            <select
              value={userForm.branch || 'IGH'}
              onChange={(e) => setUserForm({ ...userForm, branch: e.target.value })}
              className="form-input"
            >
              <option value="IGH">IGH</option>
              <option value="iGift">iGift</option>
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
