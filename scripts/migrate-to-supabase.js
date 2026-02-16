import fs from 'fs/promises'
import { createClient } from '@supabase/supabase-js'

// Usage: node scripts/migrate-to-supabase.js data-export.json
// Requires env: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (use service role key for server migrations)

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/migrate-to-supabase.js <data-export.json>')
  process.exit(1)
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

async function upsert(table, rows) {
  if (!rows || rows.length === 0) return
  console.log(`Upserting ${rows.length} rows into ${table}`)
  const { data, error } = await supabase.from(table).upsert(rows)
  if (error) {
    console.error(`Error upserting ${table}:`, error)
  } else {
    console.log(`Inserted/updated ${table}`)
  }
}

async function run() {
  const content = await fs.readFile(file, 'utf8')
  const obj = JSON.parse(content)

  // Map keys to tables
  await upsert('users', obj.users || [])
  await upsert('clients', obj.clients || [])
  await upsert('suppliers', obj.suppliers || [])
  await upsert('supplier_expenses', obj.supplierExpenses || [])
  await upsert('expenses', obj.expenses || [])
  await upsert('inventory', obj.inventory || [])
  await upsert('designs', obj.designs || [])
  await upsert('sales', obj.sales || [])
  // audit entries: ensure timestamp field exists
  const auditRows = (obj.audit || []).map(a => ({ ...a }))
  await upsert('audit', auditRows)

  console.log('Migration complete')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
