import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import supabase from '../lib/supabaseClient'
import { useAuth } from './AuthContext'

const DataContext = createContext()

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}

const initialData = {
  sales: [],
  clients: [],
  designs: [],
  expenses: [],
  suppliers: [],
  supplierExpenses: [],
  inventory: [],
  stockTransactions: [],
  audit: [],
  users: []
}

export function DataProvider({ children }) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [selectedBranch, setSelectedBranch] = useState('IGH')
  const { user, setUser } = useAuth()

  // Derived filtered data based on branch selection (for Admins)
  const filteredData = useMemo(() => {
    if (!user || user.role !== 'admin') return data;
    
    // For admins, filter everything by selectedBranch
    // Note: Clients and Suppliers might be shared, but let's filter if they have a branch column
    // For now, we assume strict separation for core modules.
    const filterByBranch = (list) => {
      if (selectedBranch === 'All') return list
      return list.filter(item => !item.branch || item.branch === selectedBranch)
    }

    return {
      sales: filterByBranch(data.sales),
      clients: data.clients, // Clients are often shared, or we can add branch column later if needed.
      designs: filterByBranch(data.designs),
      expenses: filterByBranch(data.expenses),
      suppliers: data.suppliers, // Suppliers often shared
      supplierExpenses: filterByBranch(data.supplierExpenses),
      inventory: filterByBranch(data.inventory),
      stockTransactions: filterByBranch(data.stockTransactions),
      audit: data.audit, // Audit logs usually global for admin
      users: data.users
    }
  }, [data, user, selectedBranch])

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser')
    if (currentUser) {
      const parsedUser = JSON.parse(currentUser)
      setUser(parsedUser)
      // Set initial branch
      if (parsedUser.branch) {
        setSelectedBranch(parsedUser.branch)
      }
    }
    setLoading(false)
  }, [])
  
  // Fetch all data from Supabase on mount or when user changes
  useEffect(() => {
    async function fetchAllData() {


      setLoading(true)
      try {
        // Base queries
        let salesQuery = supabase.from('sales').select('*').order('date', { ascending: false })
        let designsQuery = supabase.from('designs').select('*').order('date', { ascending: false })
        let expensesQuery = supabase.from('expenses').select('*').order('date', { ascending: false })
        let inventoryQuery = supabase.from('inventory').select('*').order('name')
        let stockTransQuery = supabase.from('stock_transactions').select('*').order('created_at', { ascending: false })
        
        // Multi-branch filtering
        // If not logged in, we only strictly need 'users' for login check. 
        // But for safety, let's fetch nothing else or public stuff?
        // If logged in as non-admin, filter by branch.
        if (user && user.role !== 'admin') {
            salesQuery = salesQuery.eq('branch', user.branch)
            designsQuery = designsQuery.eq('branch', user.branch)
            expensesQuery = expensesQuery.eq('branch', user.branch)
            inventoryQuery = inventoryQuery.eq('branch', user.branch)
            stockTransQuery = stockTransQuery.eq('branch', user.branch)
            // Note: Suppliers/Clients/SupplierExpenses might be shared or filtered. 
            // For now, let's leave them global or filter if needed. 
            // Plan didn't specify strict segregation for them, but let's be consistent if 'branch' exists.
            // checking schema update: I added branch to them.
            // Let's filter them too for standard users.
        }

        const [
          { data: sales, error: salesErr },
          { data: clients, error: clientsErr },
          { data: designs, error: designsErr },
          { data: expenses, error: expensesErr },
          { data: suppliers, error: suppliersErr },
          { data: supplierExpenses, error: supplierExpensesErr },
          { data: inventory, error: inventoryErr },
          { data: stockTransactions, error: stockTransErr },
          { data: audit, error: auditErr },
          { data: users, error: usersErr }
        ] = await Promise.all([
          user ? salesQuery : Promise.resolve({ data: [] }), // Only fetch if user exists
          supabase.from('clients').select('*').order('name'), // Clients might be shared? Let's keep global for now
          user ? designsQuery : Promise.resolve({ data: [] }),
          user ? expensesQuery : Promise.resolve({ data: [] }),
          supabase.from('suppliers').select('*').order('name'), // Suppliers might be shared
          supabase.from('supplier_expenses').select('*').order('date', { ascending: false }),
          user ? inventoryQuery : Promise.resolve({ data: [] }),
          user ? stockTransQuery : Promise.resolve({ data: [] }),
          supabase.from('audit').select('*').order('timestamp', { ascending: false }),
          supabase.from('users').select('*') // Always fetch users
        ])

        if (usersErr) console.error('Error fetching users:', usersErr)

        setData({
          sales: sales || [],
          clients: clients || [],
          designs: designs || [],
          expenses: expenses || [],
          suppliers: suppliers || [],
          supplierExpenses: supplierExpenses || [],
          inventory: inventory || [],
          stockTransactions: stockTransactions || [],
          audit: audit || [],
          users: users || []
        })
      } catch (error) {
        console.error('Error fetching data from Supabase:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [user])

  // Real-time subscriptions
  useEffect(() => {
    const tables = ['sales', 'clients', 'designs', 'expenses', 'suppliers', 'supplier_expenses', 'inventory', 'stock_transactions', 'audit', 'users']
    
    const channels = tables.map(table => {
      const keyMap = { supplier_expenses: 'supplierExpenses', stock_transactions: 'stockTransactions' }
      const dataKey = keyMap[table] || table

      return supabase.channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          setData(prev => {
            const list = prev[dataKey] || []
            if (payload.eventType === 'INSERT') {
              // Avoid duplicates
              const idField = table === 'users' ? 'username' : 'id'
              if (list.some(item => item[idField] === payload.new[idField])) return prev;
              return { ...prev, [dataKey]: [payload.new, ...list] }
            } else if (payload.eventType === 'UPDATE') {
              const idField = table === 'users' ? 'username' : 'id'
              return { ...prev, [dataKey]: list.map(item => item[idField] === payload.new[idField] ? payload.new : item) }
            } else if (payload.eventType === 'DELETE') {
              const idField = table === 'users' ? 'username' : 'id'
              const deletedId = payload.old[idField] || (payload.new ? payload.new[idField] : null)
              if (!deletedId) return prev;
              return { ...prev, [dataKey]: list.filter(item => item[idField] !== deletedId) }
            }
            return prev
          })
        })
        .subscribe()
    })

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [])

  // Helper for optimistic updates
  const updateLocalState = (table, action, record, idField = 'id') => {
    const keyMap = { supplier_expenses: 'supplierExpenses' }
    const dataKey = keyMap[table] || table

    setData(prev => {
      const list = prev[dataKey] || []
      if (action === 'CREATE') {
        if (list.some(item => item[idField] === record[idField])) return prev;
        return { ...prev, [dataKey]: [record, ...list] }
      } else if (action === 'UPDATE') {
        return { ...prev, [dataKey]: list.map(item => item[idField] === record[idField] ? { ...item, ...record } : item) }
      } else if (action === 'DELETE') {
         return { ...prev, [dataKey]: list.filter(item => item[idField] !== record[idField]) }
      }
      return prev
    })
  }

  // Combined function to update Supabase
  async function performAction(table, action, record, idField = 'id') {
    let result;
    if (action === 'CREATE') {
      result = await supabase.from(table).insert(record).select()
    } else if (action === 'UPDATE') {
      result = await supabase.from(table).update(record).eq(idField, record[idField]).select()
    } else if (action === 'DELETE') {
      result = await supabase.from(table).delete().eq(idField, record[idField])
    }

    if (result.error) {
      console.error(`Supabase ${action} error on ${table}:`, result.error)
      // Optional: Revert local state here if needed, or rely on next fetch
      throw result.error
    }
    return result.data?.[0] || record
  }

  // Sales operations
  // Sales operations
  const addSale = async (sale) => {
    const newSale = { 
      ...sale, 
      id: Date.now(), 
      handed_over: sale.handedOver || false, 
      handed_over_date: sale.handedOverDate || null,
      source: sale.source || 'Direct Sale',
      branch: user?.branch || 'IGH'
    }
    
    // Cleanup camelCase fields that we manually map or don't need
    delete newSale.handedOver
    delete newSale.handedOverDate

    updateLocalState('sales', 'CREATE', newSale)
    try {
      await performAction('sales', 'CREATE', newSale)
      logAudit('CREATE', 'Sales', `Added sale of KSh ${sale.amount} from ${sale.client}`)
      return newSale
    } catch (err) {
      alert('Failed to save sale to cloud! ' + err.message)
      window.location.reload()
      throw err
    }
  }

  const updateSale = async (id, updates) => {
    const sale = data.sales.find(s => s.id === id)
    if (!sale) return;
    const updatedSale = { ...sale, ...updates }
    
    // If sale is marked handed_over and it's linked to a design, propagate to design
    if (updatedSale.handed_over && updatedSale.designId) {
      const design = data.designs.find(d => d.id === updatedSale.designId)
      if (design && !design.handed_over) {
        await updateDesign(design.id, { handed_over: true, handed_over_date: updatedSale.handed_over_date || new Date().toISOString().split('T')[0] })
        logAudit('UPDATE', 'Design Projects', `Marked design ID ${design.id} as handed over via sale ID ${id}`)
      }
    }

    updateLocalState('sales', 'UPDATE', updatedSale)
    await performAction('sales', 'UPDATE', updatedSale)
    logAudit('UPDATE', 'Sales', `Updated sale ID ${id}`)
  }

  const deleteSale = async (id) => {
    updateLocalState('sales', 'DELETE', { id })
    await performAction('sales', 'DELETE', { id })
    logAudit('DELETE', 'Sales', `Deleted sale ID ${id}`)
  }

  // Clients operations
  const addClient = async (client) => {
    const newClient = { ...client, id: Date.now() }
    updateLocalState('clients', 'CREATE', newClient)
    try {
      await performAction('clients', 'CREATE', newClient)
      logAudit('CREATE', 'Clients', `Added client: ${client.name}`)
      return newClient
    } catch (err) {
      alert('Failed to save client! ' + err.message)
      window.location.reload()
      throw err
    }
  }

  const updateClient = async (id, updates) => {
    const client = data.clients.find(c => c.id === id)
    if (!client) return;
    updateLocalState('clients', 'UPDATE', { ...client, ...updates })
    await performAction('clients', 'UPDATE', { ...client, ...updates })
    logAudit('UPDATE', 'Clients', `Updated client ID ${id}`)
  }

  const deleteClient = async (id) => {
    updateLocalState('clients', 'DELETE', { id })
    await performAction('clients', 'DELETE', { id })
    logAudit('DELETE', 'Clients', `Deleted client ID ${id}`)
  }

  // Design Projects operations
  // Design Projects operations
  const addDesign = async (design) => {
    const newDesign = {
      ...design, 
      id: Date.now(),
      amount: Number(design.amount) || 0,
      paymentAmount: Number(design.paymentAmount) || 0,
      completion: design.completion || null,
      paymentDate: design.paymentDate || null,
      handed_over: design.handedOver || false, 
      handed_over_date: design.handedOverDate || null,
      branch: user?.branch || 'IGH'
    }

    delete newDesign.handedOver
    delete newDesign.handedOverDate

    updateLocalState('designs', 'CREATE', newDesign)
    try {
      await performAction('designs', 'CREATE', newDesign)
      logAudit('CREATE', 'Design Projects', `Added design project: ${design.type} for ${design.client}`)
      return newDesign
    } catch (err) {
      alert('Failed to save design project! ' + err.message)
      window.location.reload()
      throw err
    }
  }

  const updateDesign = async (id, updates) => {
    const designBeforeUpdate = data.designs.find(d => d.id === id)
    if (!designBeforeUpdate) return;
    if (!designBeforeUpdate) return;
    
    // Sanitize numeric fields if present
    const sanitizedUpdates = { ...updates }
    if ('amount' in updates) sanitizedUpdates.amount = Number(updates.amount) || 0
    if ('paymentAmount' in updates) sanitizedUpdates.paymentAmount = Number(updates.paymentAmount) || 0
    
    // Sanitize date fields
    if ('completion' in updates) sanitizedUpdates.completion = updates.completion || null
    if ('paymentDate' in updates) sanitizedUpdates.paymentDate = updates.paymentDate || null
    if ('handed_over_date' in updates) sanitizedUpdates.handed_over_date = updates.handed_over_date || null

    const updatedDesign = { ...designBeforeUpdate, ...sanitizedUpdates }
    
    const wantCompletedWithFullPayment = updates.status === 'Completed' && (updates.paymentStatus === 'Full' || updates.paymentStatus === 'Paid')
    const wasNotCompletedWithFullPayment = !designBeforeUpdate || designBeforeUpdate.status !== 'Completed' || (designBeforeUpdate.paymentStatus !== 'Full' && designBeforeUpdate.paymentStatus !== 'Paid')
    
    // Auto-create sale if design is marked as Completed with Full payment
    if (wantCompletedWithFullPayment && wasNotCompletedWithFullPayment && (updates.paymentAmount || designBeforeUpdate.paymentAmount)) {
      const saleAlreadyExists = data.sales.some(s => Number(s.designId) === Number(id))
      
      if (!saleAlreadyExists) {
        const newSale = {
          id: Date.now() + 1,
          date: updates.paymentDate || designBeforeUpdate.paymentDate || new Date().toISOString().split('T')[0],
          client: designBeforeUpdate.client,
          dept: designBeforeUpdate.title || 'Design',
          amount: updates.paymentAmount || designBeforeUpdate.paymentAmount,
          desc: `${designBeforeUpdate.title || 'Design'} - ${designBeforeUpdate.client}`,
          source: 'Design Project',
          designId: id,
          paymentMethod: updates.paymentMethod || 'Cash',
          paymentStatus: 'Paid',
          handed_over: updates.handed_over || designBeforeUpdate.handed_over || false,
          handed_over_date: updates.handed_over_date || designBeforeUpdate.handed_over_date || null
        }
        await performAction('sales', 'CREATE', newSale)
        logAudit('CREATE', 'Sales', `Auto-created sale from Design Project: KSh ${newSale.amount}`)
      }
    }

    // If design was marked handed over, propagate to linked sale(s)
    if (updates.handed_over) {
      const linkedSales = data.sales.filter(s => Number(s.designId) === Number(id) && !s.handed_over)
      for (const sale of linkedSales) {
        await updateSale(sale.id, { handed_over: true, handed_over_date: updates.handed_over_date || new Date().toISOString().split('T')[0] })
      }
    }

    updateLocalState('designs', 'UPDATE', updatedDesign)
    await performAction('designs', 'UPDATE', updatedDesign)
    logAudit('UPDATE', 'Design Projects', `Updated design ID ${id}`)
  }

  const deleteDesign = async (id) => {
    updateLocalState('designs', 'DELETE', { id })
    await performAction('designs', 'DELETE', { id })
    logAudit('DELETE', 'Design Projects', `Deleted design ID ${id}`)
  }

  // Expenses operations
  // Expenses operations
  const addExpense = async (expense) => {
    const newExpense = { ...expense, id: Date.now() }
    updateLocalState('expenses', 'CREATE', newExpense)
    try {
      await performAction('expenses', 'CREATE', newExpense)
      logAudit('CREATE', 'Expenses', `Added expense of KSh ${expense.amount} in ${expense.cat}`)
      return newExpense
    } catch (err) {
      alert('Failed to save expense! ' + err.message)
      window.location.reload()
      throw err
    }
  }

  const updateExpense = async (id, updates) => {
    const expense = data.expenses.find(e => e.id === id)
    if (!expense) return;
    updateLocalState('expenses', 'UPDATE', { ...expense, ...updates })
    await performAction('expenses', 'UPDATE', { ...expense, ...updates })
    logAudit('UPDATE', 'Expenses', `Updated expense ID ${id}`)
  }

  const deleteExpense = async (id) => {
    updateLocalState('expenses', 'DELETE', { id })
    await performAction('expenses', 'DELETE', { id })
    logAudit('DELETE', 'Expenses', `Deleted expense ID ${id}`)
  }

  // Suppliers operations
  // Suppliers operations
  const addSupplier = async (supplier) => {
    const newSupplier = { ...supplier, id: Date.now() }
    updateLocalState('suppliers', 'CREATE', newSupplier)
    try {
      await performAction('suppliers', 'CREATE', newSupplier)
      logAudit('CREATE', 'Suppliers', `Added supplier: ${supplier.name}`)
      return newSupplier
    } catch (err) {
      alert('Failed to save supplier! ' + err.message)
      window.location.reload()
      throw err
    }
  }

  const updateSupplier = async (id, updates) => {
    const supplier = data.suppliers.find(s => s.id === id)
    if (!supplier) return;
    updateLocalState('suppliers', 'UPDATE', { ...supplier, ...updates })
    await performAction('suppliers', 'UPDATE', { ...supplier, ...updates })
    logAudit('UPDATE', 'Suppliers', `Updated supplier ID ${id}`)
  }

  const deleteSupplier = async (id) => {
    updateLocalState('suppliers', 'DELETE', { id })
    await performAction('suppliers', 'DELETE', { id })
    logAudit('DELETE', 'Suppliers', `Deleted supplier ID ${id}`)
  }

  // Supplier Expenses operations
  // Supplier Expenses operations
  const addSupplierExpense = async (expense) => {
    const newExpense = { ...expense, id: Date.now() }
    updateLocalState('supplier_expenses', 'CREATE', newExpense)
    try {
      await performAction('supplier_expenses', 'CREATE', newExpense)
      logAudit('CREATE', 'Supplier Expenses', `Added supplier expense of KSh ${expense.amount}`)
      return newExpense
    } catch (err) {
      alert('Failed to save supplier expense! ' + err.message)
      window.location.reload()
      throw err
    }
  }

  const updateSupplierExpense = async (id, updates) => {
    const expense = data.supplierExpenses.find(e => e.id === id)
    if (!expense) return;
    updateLocalState('supplier_expenses', 'UPDATE', { ...expense, ...updates })
    await performAction('supplier_expenses', 'UPDATE', { ...expense, ...updates })
    logAudit('UPDATE', 'Supplier Expenses', `Updated supplier expense ID ${id}`)
  }

  const deleteSupplierExpense = async (id) => {
    updateLocalState('supplier_expenses', 'DELETE', { id })
    await performAction('supplier_expenses', 'DELETE', { id })
    logAudit('DELETE', 'Supplier Expenses', `Deleted supplier expense ID ${id}`)
  }

  // Inventory operations
  // Inventory operations
  const addInventoryItem = async (item) => {
    const newItem = { ...item, id: Date.now(), branch: user?.branch || 'IGH' }
    updateLocalState('inventory', 'CREATE', newItem)
    try {
      await performAction('inventory', 'CREATE', newItem)
      logAudit('CREATE', 'Inventory', `Added inventory item: ${item.name}`)
      return newItem
    } catch (err) {
      alert('Failed to save inventory item! ' + err.message)
      window.location.reload()
      throw err
    }
  }

  const updateInventoryItem = async (id, updates) => {
    const item = data.inventory.find(i => i.id === id)
    if (!item) return;
    updateLocalState('inventory', 'UPDATE', { ...item, ...updates })
    await performAction('inventory', 'UPDATE', { ...item, ...updates })
    logAudit('UPDATE', 'Inventory', `Updated inventory ID ${id}`)
  }

  const deleteInventoryItem = async (id) => {
    updateLocalState('inventory', 'DELETE', { id })
    await performAction('inventory', 'DELETE', { id })
    logAudit('DELETE', 'Inventory', `Deleted inventory ID ${id}`)
  }

  // User operations
  // User operations
  const addUser = async (user) => {
    const username = (user.username || user.email || '').toLowerCase()
    if (!username) throw new Error('Username is required')
    if (data.users.some(u => u.username === username)) {
      throw new Error('Username already exists')
    }
    const newUser = { ...user, username }
    updateLocalState('users', 'CREATE', newUser, 'username')
    try {
      await performAction('users', 'CREATE', newUser, 'username')
      logAudit('CREATE', 'Users', `Added user: ${username}`)
      return newUser
    } catch (err) {
      alert('Failed to save user! ' + err.message)
      window.location.reload()
      throw err
    }
  }

  const updateUser = async (username, updates) => {
    const normalized = (username || '').toLowerCase()
    const user = data.users.find(u => u.username === normalized)
    if (!user) return;
    const updatedUser = { ...user, ...updates, username: (updates.username ? updates.username.toLowerCase() : user.username) }
    updateLocalState('users', 'UPDATE', updatedUser, 'username')
    await performAction('users', 'UPDATE', updatedUser, 'username')
    logAudit('UPDATE', 'Users', `Updated user: ${normalized}`)
  }

  const deleteUser = async (username) => {
    const normalized = (username || '').toLowerCase()
    updateLocalState('users', 'DELETE', { username: normalized }, 'username')
    await performAction('users', 'DELETE', { username: normalized }, 'username')
    logAudit('DELETE', 'Users', `Deleted user: ${normalized}`)
  }

  // Stock Transaction operations
  const addStockTransaction = async (transaction) => {
    // 1. Calculate new quantity
    const item = data.inventory.find(i => Number(i.id) === Number(transaction.item_id))
    if (!item) throw new Error('Item not found')

    const newQuantity = (item.quantity || 0) + transaction.quantity_change

    // 2. Insert transaction
    const newTransaction = { ...transaction, branch: user?.branch || 'IGH' }
    // optimistic update for transaction? Maybe not needed for UI immediately, but good practice
    
    try {
        const { error: transError } = await supabase.from('stock_transactions').insert(newTransaction)
        if (transError) throw transError

        // 3. Update inventory item quantity
        const { error: invError } = await supabase.from('inventory').update({ quantity: newQuantity }).eq('id', item.id)
        if (invError) throw invError
        
        // Update local state for inventory
        updateLocalState('inventory', 'UPDATE', { ...item, quantity: newQuantity })

        // 4. Log audit
        logAudit('UPDATE', 'Inventory', `Adjusted stock for ${item.name}: ${transaction.quantity_change > 0 ? '+' : ''}${transaction.quantity_change} (${transaction.transaction_type})`)

        return newQuantity
    } catch (err) {
        console.error('Stock transaction failed:', err)
        alert('Failed to update stock! ' + err.message)
        throw err
    }
  }

  // Design Materials operations
  const getDesignMaterials = async (designId) => {
    const { data: materials, error } = await supabase
      .from('design_materials')
      .select('*, inventory(name, unitPrice)')
      .eq('design_id', designId)
    
    if (error) {
      console.error('Error fetching design materials:', error)
      return []
    }
    return materials
  }

  const addDesignMaterial = async (material) => {
    try {
      // 1. Add to design_materials table
      const { data: newMaterial, error: matError } = await supabase
        .from('design_materials')
        .insert(material)
        .select()
        .single()
      
      if (matError) throw matError

      // 2. Deduct from Inventory (Stock Transaction)
      await addStockTransaction({
        item_id: material.item_id,
        quantity_change: -material.quantity_used,
        transaction_type: 'PROJECT_USAGE',
        reason: `Used for Design Project #${material.design_id}`,
        created_by: material.assigned_by
      })

      return newMaterial
    } catch (err) {
      console.error('Failed to add design material:', err)
      throw err
    }
  }

  const deleteDesignMaterial = async (id, itemId, quantity, designId) => {
    try {
        // 1. Delete from design_materials
        const { error } = await supabase.from('design_materials').delete().eq('id', id)
        if (error) throw error

        // 2. Refund stock (optional, but good for corrections)
        await addStockTransaction({
            item_id: itemId,
            quantity_change: quantity,
            transaction_type: 'PROJECT_RETURN',
            reason: `Removed from Design Project #${designId}`,
            created_by: 'system'
        })
    } catch (err) {
        console.error('Failed to remove material:', err)
        throw err
    }
  }

  // Audit operations
  const logAudit = async (action, module, details) => {
    const currentUser = localStorage.getItem('currentUser')
    const parsed = currentUser ? JSON.parse(currentUser) : null
    const user = parsed ? (parsed.username || parsed.email || 'Unknown') : 'Unknown'
    const auditEntry = {
      user,
      action,
      module,
      details
    }
    try {
      await supabase.from('audit').insert(auditEntry)
    } catch (e) {
      console.warn('Audit logging failed:', e)
    }
  }

  // Utility functions
  const getClientName = (id) => {
    return data.clients.find(c => Number(c.id) === Number(id))?.name || 'Unknown'
  }

  const getSupplierName = (id) => {
    return data.suppliers.find(s => Number(s.id) === Number(id))?.name || 'Unknown'
  }

  const getTotalSales = (startDate = null, endDate = null) => {
    let sales = data.sales
    if (startDate && endDate) {
      sales = sales.filter(s => s.date >= startDate && s.date <= endDate)
    }
    return sales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
  }

  const getTotalExpenses = (startDate = null, endDate = null) => {
    let expenses = data.expenses
    if (startDate && endDate) {
      expenses = expenses.filter(e => e.date >= startDate && e.date <= endDate)
    }
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
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
      grouped[s.dept] = (grouped[s.dept] || 0) + Number(s.amount)
    })
    return grouped
  }

  const getInventoryStatus = (id) => {
    const item = data.inventory.find(i => Number(i.id) === Number(id))
    if (!item) return 'Unknown'
    if (item.quantity === 0) return 'Out of Stock'
    if (item.quantity <= item.reorderLevel) return 'Low Stock'
    return 'In Stock'
  }

  const clearAllData = async () => {
    const confirmation = window.confirm('Are you sure you want to clear all data from Supabase?')
    if (!confirmation) return;
    
    const tables = ['sales', 'clients', 'designs', 'expenses', 'suppliers', 'supplier_expenses', 'inventory', 'audit', 'users']
    for (const table of tables) {
      await supabase.from(table).delete().neq(table === 'users' ? 'username' : 'id', -1)
    }
    // Re-add default admin if not present
    await addUser({ username: 'admin', email: 'admin@igh.com', password: 'admin123', role: 'admin', pref_compact: false })
  }

  const value = {
    data: filteredData, // Expose filtered data to the app
    allData: data,      // Expose raw data if needed (e.g. for debug or specific admin views)
    selectedBranch,     // Global branch selection
    setSelectedBranch,  // Function to switch branch
    loading,
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
    addInventoryItem, updateInventoryItem, deleteInventoryItem, addStockTransaction,
    // Project Materials
    addDesignMaterial, getDesignMaterials, deleteDesignMaterial,
    // Users
    addUser, updateUser, deleteUser,
    // Utilities
    getClientName, getSupplierName, getTotalSales, getTotalExpenses,
    getNetBalance, getSalesByDepartment, getInventoryStatus, clearAllData,
    logAudit
  }

  return (
    <DataContext.Provider value={value}>
      {!loading ? children : <div className="flex items-center justify-center min-h-screen">Loading system data...</div>}
    </DataContext.Provider>
  )
}
