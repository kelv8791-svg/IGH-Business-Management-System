// Lazy, optional Supabase client wrapper.
// This avoids Vite build-time failures when `@supabase/supabase-js` is not installed.

let _client = null

const getConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  return { url, anon }
}

const init = async () => {
  if (_client) return _client
  const { url, anon } = getConfig()
  if (!url || !anon) return null
  try {
    const mod = await import('@supabase/supabase-js')
    _client = mod.createClient(url, anon)
    return _client
  } catch (e) {
    console.warn('Supabase dynamic import failed:', e)
    return null
  }
}

const noopResponse = async () => ({ data: null, error: null })

const from = (table) => {
  return {
    upsert: async (rows) => {
      const c = await init()
      if (!c) return { data: null, error: null }
      return c.from(table).upsert(rows)
    },
    // support delete().eq('id', id)
    delete: () => ({
      eq: async (col, val) => {
        const c = await init()
        if (!c) return { data: null, error: null }
        return c.from(table).delete().eq(col, val)
      }
    }),
    insert: async (rows) => {
      const c = await init()
      if (!c) return { data: null, error: null }
      return c.from(table).insert(rows)
    }
  }
}

const supabase = { from }

export default supabase
export { init as initSupabase }
