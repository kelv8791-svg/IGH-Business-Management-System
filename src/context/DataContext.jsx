import { createContext, useContext, useState, useEffect, useRef } from 'react'
import supabase, { initSupabase } from '../lib/supabaseClient'

const DataContext = createContext()

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}

const initializeData = () => {
  const stored = localStorage.getItem('ighData')
  if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed && Array.isArray(parsed.users)) {
          parsed.users = parsed.users.map(u => ({
            username: u.username ? u.username : (u.email ? u.email.split('@')[0].toLowerCase() : ''),
            ...u
          }))
        }
        return parsed
      } catch (e) {
        return JSON.parse(stored)
      }
  }
  return {
    sales: [],
    clients: [],
    designs: [],
    expenses: [],
    suppliers: [],
    supplierExpenses: [],
    inventory: [],
    audit: [],
    users: [
      { username: 'admin', email: 'admin@igh.com', password: 'admin123', role: 'admin', pref_compact: false },
      { username: 'user', email: 'user@igh.com', password: 'user123', role: 'user', pref_compact: false },
    ]
  }
}

export function DataProvider({ children }) {
  const [data, setData] = useState(initializeData())

  // Save to localStorage whenever data changes
  const saveData = (newData) => {
    // Merge audit entries to avoid losing entries added via logAudit()
    const mergedAudit = [...(newData.audit || []), ...(data.audit || [])]
    const merged = { ...newData, audit: mergedAudit }
    setData(merged)
    localStorage.setItem('ighData', JSON.stringify(merged))
  }

  // Handle remote realtime changes from Supabase and merge into local state
  const handleRemoteChange = (table, eventType, record) => {
    const map = {
      sales: 'sales',
      designs: 'designs',
      clients: 'clients',
      expenses: 'expenses',
      suppliers: 'suppliers',
      inventory: 'inventory',
      supplier_expenses: 'supplierExpenses',
      users: 'users'
    }
    const key = map[table]
    if (!key) return
    setData(prev => {
      const updated = { ...prev }
      const list = Array.isArray(updated[key]) ? updated[key] : []
      if (eventType === 'INSERT') {
        if (!list.some(i => i.id == record.id)) {
          updated[key] = [record, ...list]
        }
      } else if (eventType === 'UPDATE') {
        updated[key] = list.map(i => (i.id == record.id ? { ...i, ...record } : i))
      } else if (eventType === 'DELETE') {
        updated[key] = list.filter(i => i.id != record.id)
      }
      try { localStorage.setItem('ighData', JSON.stringify(updated)) } catch (e) {}
      return updated
    })
  }

  // Setup Supabase realtime subscriptions (optional - requires VITE_SUPABASE_URL & key)
  useEffect(() => {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
    if (!SUPABASE_URL) return
    const unsubscribers = []
    ;(async () => {
      const client = await initSupabase()
      if (!client) return
      const tables = ['sales','designs','clients','expenses','suppliers','inventory','supplier_expenses','users']
      for (const table of tables) {
        try {
          const ins = client.from(table).on('INSERT', payload => handleRemoteChange(table, 'INSERT', payload.new)).subscribe()
          const upd = client.from(table).on('UPDATE', payload => handleRemoteChange(table, 'UPDATE', payload.new)).subscribe()
          const del = client.from(table).on('DELETE', payload => handleRemoteChange(table, 'DELETE', payload.old || payload)).subscribe()
          unsubscribers.push(() => { try { ins.unsubscribe() } catch (e) {} ; try { upd.unsubscribe() } catch (e) {} ; try { del.unsubscribe() } catch (e) {} })
        } catch (e) {
          console.warn('Supabase realtime subscribe error for', table, e)
        }
      }
    })()
    return () => { unsubscribers.forEach(u => u()) }
  }, [])

  // Sales operations
  const addSale = (sale) => {
    const newSale = { ...sale, id: Date.now(), handedOver: sale.handedOver || false, handedOverDate: sale.handedOverDate || null }
    const newData = { ...data, sales: [...data.sales, newSale] }
    saveData(newData)
    logAudit('CREATE', 'Sales', `Added sale of KSh ${sale.amount} from ${sale.client}`)

    // background sync to Supabase if configured
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      if (SUPABASE_URL) {
        ;(async () => {
          const { error } = await supabase.from('sales').upsert([newSale])
          if (error) console.warn('Supabase upsert sale error:', error)
        })()
      }
    } catch (e) {}

    return newSale
  }

  const updateSale = (id, updates) => {
    const newData = {
      ...data,
      sales: data.sales.map(s => s.id === id ? { ...s, ...updates } : s)
    }
    // If sale is marked handedOver and it's linked to a design, propagate to design
    const updatedSale = newData.sales.find(s => s.id === id)
    if (updatedSale && updatedSale.handedOver && updatedSale.designId) {
      newData.designs = newData.designs.map(d => d.id === updatedSale.designId ? { ...d, handedOver: true, handedOverDate: updatedSale.handedOverDate || new Date().toISOString().split('T')[0] } : d)
      logAudit('UPDATE', 'Design Projects', `Marked design ID ${updatedSale.designId} as handed over via sale ID ${id}`)
    }
    // background sync update to Supabase
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      if (SUPABASE_URL) {
        const updated = newData.sales.find(s => s.id === id)
        ;(async () => {
          const { error } = await supabase.from('sales').upsert([updated])
          if (error) console.warn('Supabase upsert sale error:', error)
        })()
      }
    } catch (e) {}

    saveData(newData)
    logAudit('UPDATE', 'Sales', `Updated sale ID ${id}`)
  }

  const deleteSale = (id) => {
    const newData = {
      ...data,
      sales: data.sales.filter(s => s.id !== id)
    }
    // background delete in Supabase
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      if (SUPABASE_URL) {
        ;(async () => {
          const { error } = await supabase.from('sales').delete().eq('id', id)
          if (error) console.warn('Supabase delete sale error:', error)
        })()
      }
    } catch (e) {}

    saveData(newData)
    logAudit('DELETE', 'Sales', `Deleted sale ID ${id}`)
  }

  // Clients operations
  const addClient = (client) => {
    const newClient = { ...client, id: Date.now() }
    const newData = { ...data, clients: [...data.clients, newClient] }
    saveData(newData)
    logAudit('CREATE', 'Clients', `Added client: ${client.name}`)
    return newClient
  }

  const updateClient = (id, updates) => {
    const newData = {
      ...data,
      clients: data.clients.map(c => c.id === id ? { ...c, ...updates } : c)
    }
    saveData(newData)
    logAudit('UPDATE', 'Clients', `Updated client ID ${id}`)
  }

  const deleteClient = (id) => {
    const newData = {
      ...data,
      clients: data.clients.filter(c => c.id !== id)
    }
    saveData(newData)
    logAudit('DELETE', 'Clients', `Deleted client ID ${id}`)
  }

  // Design Projects operations
  const addDesign = (design) => {
    const newDesign = { ...design, id: Date.now(), handedOver: design.handedOver || false, handedOverDate: design.handedOverDate || null }
    const newData = { ...data, designs: [...data.designs, newDesign] }
    saveData(newData)
    logAudit('CREATE', 'Design Projects', `Added design project for client ${design.client}`)

    // background sync to Supabase if configured
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      if (SUPABASE_URL) {
        ;(async () => {
          const { error } = await supabase.from('designs').upsert([newDesign])
          if (error) console.warn('Supabase upsert design error:', error)
        })()
      }
    } catch (e) {}

    return newDesign
  }

  const updateDesign = (id, updates) => {
    const designBeforeUpdate = data.designs.find(d => d.id === id)
    const wantCompletedWithFullPayment = updates.status === 'Completed' && updates.paymentStatus === 'Full'
    const wasNotCompletedWithFullPayment = !designBeforeUpdate || designBeforeUpdate.status !== 'Completed' || designBeforeUpdate.paymentStatus !== 'Full'
    
    const newData = {
      ...data,
      designs: data.designs.map(d => d.id === id ? { ...d, ...updates } : d)
    }

    // Auto-create sale if design is marked as Completed with Full payment
    if (wantCompletedWithFullPayment && wasNotCompletedWithFullPayment && updates.paymentAmount) {
      const saleAlreadyExists = data.sales.some(s => s.designId === id)
      
      if (!saleAlreadyExists) {
        const newSale = {
          id: Date.now() + 1,
          date: updates.paymentDate || new Date().toISOString().split('T')[0],
          client: designBeforeUpdate.client,
          dept: designBeforeUpdate.type,
          amount: updates.paymentAmount,
          desc: `${designBeforeUpdate.type} - ${designBeforeUpdate.client}`,
          source: 'Design Project',
          designId: id,
          paymentStatus: updates.paymentStatus || 'Paid',
          paymentMethod: updates.paymentMethod || updates.paymentMethod || 'Cash',
          paymentRef: updates.paymentRef || null,
          handedOver: updates.handedOver || false,
          handedOverDate: updates.handedOverDate || null
        }
        newData.sales = [...newData.sales, newSale]
        logAudit('CREATE', 'Sales', `Auto-created sale from Design Project: ${designBeforeUpdate.type} - KSh ${updates.paymentAmount}`)
      }
    }

    // If design was marked handed over, propagate to linked sale(s)
    if (updates.handedOver) {
      newData.sales = newData.sales.map(s => s.designId === id ? { ...s, handedOver: true, handedOverDate: updates.handedOverDate || new Date().toISOString().split('T')[0] } : s)
      logAudit('UPDATE', 'Sales', `Marked sale(s) from design ID ${id} as handed over`)
    }

    // background sync to Supabase for designs
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      if (SUPABASE_URL) {
        const updated = newData.designs.find(d => d.id === id)
        ;(async () => {
          const { error } = await supabase.from('designs').upsert([updated])
          if (error) console.warn('Supabase upsert design error:', error)
        })()
      }
    } catch (e) {}

    saveData(newData)
    logAudit('UPDATE', 'Design Projects', `Updated design ID ${id}`)
  }

  const deleteDesign = (id) => {
    const newData = {
      ...data,
      designs: data.designs.filter(d => d.id !== id)
    }
    // background delete in Supabase
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      if (SUPABASE_URL) {
        ;(async () => {
          const { error } = await supabase.from('designs').delete().eq('id', id)
          if (error) console.warn('Supabase delete design error:', error)
        })()
      }
    } catch (e) {}

    saveData(newData)
    logAudit('DELETE', 'Design Projects', `Deleted design ID ${id}`)
  }

  // Expenses operations
  const addExpense = (expense) => {
    const newExpense = { ...expense, id: Date.now() }
    const newData = { ...data, expenses: [...data.expenses, newExpense] }
    saveData(newData)
    logAudit('CREATE', 'Expenses', `Added expense of KSh ${expense.amount} in ${expense.cat}`)
    return newExpense
  }

  const updateExpense = (id, updates) => {
    const newData = {
      ...data,
      expenses: data.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
    }
    saveData(newData)
    logAudit('UPDATE', 'Expenses', `Updated expense ID ${id}`)
  }

  const deleteExpense = (id) => {
    const newData = {
      ...data,
      expenses: data.expenses.filter(e => e.id !== id)
    }
    saveData(newData)
    logAudit('DELETE', 'Expenses', `Deleted expense ID ${id}`)
  }

  // Suppliers operations
  const addSupplier = (supplier) => {
    const newSupplier = { ...supplier, id: Date.now() }
    const newData = { ...data, suppliers: [...data.suppliers, newSupplier] }
    saveData(newData)
    logAudit('CREATE', 'Suppliers', `Added supplier: ${supplier.name}`)
    return newSupplier
  }

  const updateSupplier = (id, updates) => {
    const newData = {
      ...data,
      suppliers: data.suppliers.map(s => s.id === id ? { ...s, ...updates } : s)
    }
    saveData(newData)
    logAudit('UPDATE', 'Suppliers', `Updated supplier ID ${id}`)
  }

  const deleteSupplier = (id) => {
    const newData = {
      ...data,
      suppliers: data.suppliers.filter(s => s.id !== id)
    }
    saveData(newData)
    logAudit('DELETE', 'Suppliers', `Deleted supplier ID ${id}`)
  }

  // Supplier Expenses operations
  const addSupplierExpense = (expense) => {
    const newExpense = { ...expense, id: Date.now() }
    const newData = { ...data, supplierExpenses: [...data.supplierExpenses, newExpense] }
    saveData(newData)
    logAudit('CREATE', 'Supplier Expenses', `Added supplier expense of KSh ${expense.amount}`)
    return newExpense
  }

  const updateSupplierExpense = (id, updates) => {
    const newData = {
      ...data,
      supplierExpenses: data.supplierExpenses.map(e => e.id === id ? { ...e, ...updates } : e)
    }
    saveData(newData)
    logAudit('UPDATE', 'Supplier Expenses', `Updated supplier expense ID ${id}`)
  }

  const deleteSupplierExpense = (id) => {
    const newData = {
      ...data,
      supplierExpenses: data.supplierExpenses.filter(e => e.id !== id)
    }
    saveData(newData)
    logAudit('DELETE', 'Supplier Expenses', `Deleted supplier expense ID ${id}`)
  }

  // Inventory operations
  const addInventoryItem = (item) => {
    const newItem = { ...item, id: Date.now() }
    const newData = { ...data, inventory: [...data.inventory, newItem] }
    saveData(newData)
    logAudit('CREATE', 'Inventory', `Added inventory item: ${item.name}`)
    return newItem
  }

  const updateInventoryItem = (id, updates) => {
    const newData = {
      ...data,
      inventory: data.inventory.map(i => i.id === id ? { ...i, ...updates } : i)
    }
    saveData(newData)
    logAudit('UPDATE', 'Inventory', `Updated inventory ID ${id}`)
  }

  const deleteInventoryItem = (id) => {
    const newData = {
      ...data,
      inventory: data.inventory.filter(i => i.id !== id)
    }
    saveData(newData)
    logAudit('DELETE', 'Inventory', `Deleted inventory ID ${id}`)
  }

  // User operations
  const addUser = (user) => {
    const username = (user.username || user.email || '').toLowerCase()
    if (!username) throw new Error('Username is required')
    // prevent duplicates
    if (data.users.some(u => u.username === username)) {
      throw new Error('Username already exists')
    }
    const newUser = { ...user, username }
    const newData = { ...data, users: [...data.users, newUser] }
    saveData(newData)
    logAudit('CREATE', 'Users', `Added user: ${username}`)
    return newUser
  }

  const updateUser = (username, updates) => {
    const normalized = (username || '').toLowerCase()
    const newData = {
      ...data,
      users: data.users.map(u => u.username === normalized ? { ...u, ...updates, username: (updates.username ? updates.username.toLowerCase() : u.username) } : u)
    }
    saveData(newData)
    logAudit('UPDATE', 'Users', `Updated user: ${normalized}`)
  }

  const deleteUser = (username) => {
    const normalized = (username || '').toLowerCase()
    const newData = {
      ...data,
      users: data.users.filter(u => u.username !== normalized)
    }
    saveData(newData)
    logAudit('DELETE', 'Users', `Deleted user: ${normalized}`)
  }

  // Audit operations
  const logAudit = (action, module, details) => {
    const currentUser = localStorage.getItem('currentUser')
    const parsed = currentUser ? JSON.parse(currentUser) : null
    const user = parsed ? (parsed.username || parsed.email || 'Unknown') : 'Unknown'
    const auditEntry = {
      timestamp: new Date().toISOString(),
      user,
      action,
      module,
      details
    }
    setData(prevData => {
      const updated = { ...prevData, audit: [auditEntry, ...prevData.audit] }
      try {
        localStorage.setItem('ighData', JSON.stringify(updated))
      } catch (e) {}
      return updated
    })
  }

  // Utility functions
  const getClientName = (id) => {
    return data.clients.find(c => c.id === id)?.name || 'Unknown'
  }

  const getSupplierName = (id) => {
    return data.suppliers.find(s => s.id === id)?.name || 'Unknown'
  }

  const getTotalSales = (startDate = null, endDate = null) => {
    let sales = data.sales
    if (startDate && endDate) {
      sales = sales.filter(s => s.date >= startDate && s.date <= endDate)
    }
    return sales.reduce((sum, s) => sum + (s.amount || 0), 0)
  }

  const getTotalExpenses = (startDate = null, endDate = null) => {
    let expenses = data.expenses
    if (startDate && endDate) {
      expenses = expenses.filter(e => e.date >= startDate && e.date <= endDate)
    }
    return expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  }

  const getNetBalance = (startDate = null, endDate = null) => {
    return getTotalSales(startDate, endDate) - getTotalExpenses(startDate, endDate)
  }

  const getSalesByDepartment = (startDate = null, endDate = null) => {
    let sales = data.sales
    if (startDate && endDate) {
      sales = sales.filter(s => s.date >= startDate && s.date <= endDate)
    }
    const grouped = {}
    sales.forEach(s => {
      grouped[s.dept] = (grouped[s.dept] || 0) + s.amount
    })
    return grouped
  }

  const getInventoryStatus = (id) => {
    const item = data.inventory.find(i => i.id === id)
    if (!item) return 'Unknown'
    if (item.quantity === 0) return 'Out of Stock'
    if (item.quantity <= item.reorderLevel) return 'Low Stock'
    return 'In Stock'
  }

  const clearAllData = () => {
    const newData = {
      sales: [],
      clients: [],
      designs: [],
      expenses: [],
      suppliers: [],
      supplierExpenses: [],
      inventory: [],
      audit: [],
      users: [
        { email: 'admin@igh.com', password: 'admin123', role: 'admin', pref_compact: false },
      ]
    }
    saveData(newData)
  }

  const value = {
    data,
    // Sales
    addSale, updateSale, deleteSale,
    // Clients
    addClient, updateClient, deleteClient,
    // Designs
    addDesign, updateDesign, deleteDesign,
    // Expenses
    addExpense, updateExpense, deleteExpense,
    // Suppliers
    addSupplier, updateSupplier, deleteSupplier,
    addSupplierExpense, updateSupplierExpense, deleteSupplierExpense,
    // Inventory
    addInventoryItem, updateInventoryItem, deleteInventoryItem,
    // Users
    addUser, updateUser, deleteUser,
    // Utilities
    getClientName, getSupplierName, getTotalSales, getTotalExpenses,
    getNetBalance, getSalesByDepartment, getInventoryStatus, clearAllData,
    logAudit
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}
