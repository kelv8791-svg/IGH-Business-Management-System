import supabase from '../lib/supabaseClient'

export async function migrateLocalStorageToSupabase() {
  const localData = localStorage.getItem('ighData')
  if (!localData) {
    console.log('No local data found to migrate.')
    return { success: false, message: 'No local data found.' }
  }

  const parsed = JSON.parse(localData)
  const results = {}

  const tables = [
    { key: 'users', table: 'users', idField: 'username' },
    { key: 'clients', table: 'clients' },
    { key: 'suppliers', table: 'suppliers' },
    { key: 'supplierExpenses', table: 'supplier_expenses' },
    { key: 'expenses', table: 'expenses' },
    { key: 'inventory', table: 'inventory' },
    { key: 'designs', table: 'designs' },
    { key: 'sales', table: 'sales' },
    { key: 'audit', table: 'audit' }
  ]

  for (const { key, table, idField = 'id' } of tables) {
    const data = parsed[key]
    if (data && data.length > 0) {
      console.log(`Migrating ${data.length} records to ${table}...`)
      
      // Filter out records that might already exist or handle conflicts
      // For simplicity, we'll use upsert
      const { error } = await supabase.from(table).upsert(data)
      
      if (error) {
        console.error(`Error migrating ${table}:`, error)
        results[table] = { success: false, error }
      } else {
        results[table] = { success: true, count: data.length }
      }
    }
  }

  return { success: true, results }
}
