# Quick Reference & Developer Guide

## Quick Commands

### Development
```bash
npm install          # Install dependencies
npm run dev         # Start dev server (auto-reload)
npm run build       # Build for production
npm run preview     # Preview production build
```

### Environment
- Dev Server: `http://localhost:5173`
- Build Output: `dist/` folder
- Data Storage: Browser localStorage under key `ighData`

---

## Key Imports

### For New Components
```javascript
import { useAuth } from '../App'          // Get user & theme
import { useData } from '../context/DataContext'  // Get data methods
import Modal from '../components/Modal'   // Reusable modal
```

### Styling Classes
```javascript
// Tailwind utilities
"btn-primary"      // Gold gradient button
"btn-secondary"    // Gray border button
"btn-success"      // Green button
"btn-danger"       // Red button
"form-input"       // Styled input field
"card"             // White card with shadow
```

---

## Adding New Modules

### 1. Create Data Context Methods
In `src/context/DataContext.jsx`:
```javascript
const addNewModule = (data) => {
  const newItem = { ...data, id: Date.now() }
  const newData = { ...globalData, modules: [...globalData.modules, newItem] }
  logAudit('CREATE', 'ModuleName', `Details...`)
  saveData(newData)
  return newItem
}
```

### 2. Create Page Component
In `src/pages/NewModule.jsx`:
```javascript
import { useState } from 'react'
import { useData } from '../context/DataContext'
import Modal from '../components/Modal'
import { Plus, Edit2, Trash2 } from 'lucide-react'

export default function NewModule() {
  // Component code
}
```

### 3. Add Routes
In `src/App.jsx`:
```javascript
<Route path="/new-module" element={<NewModule />} />
```

### 4. Add Navigation
In `src/components/Sidebar.jsx`:
```javascript
{ path: '/new-module', label: 'New Module', icon: IconComponent },
```

---

## Common Patterns

### Using Data
```javascript
const { data, addSale, updateSale, deleteSale } = useData()

// Access data
const sales = data.sales

// Add item
addSale({ date: '2024-02-15', client: 'ABC Corp', amount: 5000 })

// Update item
updateSale(saleId, { amount: 6000 })

// Delete item
deleteSale(saleId)
```

### Using Auth
```javascript
const { user, logout, darkMode, setDarkMode } = useAuth()

// Check role
if (user.role === 'admin') {
  // Show admin stuff
}

// Toggle dark mode
setDarkMode(!darkMode)
```

### Form Handling
```javascript
const [isOpen, setIsOpen] = useState(false)
const [formData, setFormData] = useState({ /* defaults */ })

const handleSubmit = (e) => {
  e.preventDefault()
  // Validate
  if (!formData.name) {
    alert('Name required')
    return
  }
  // Save
  addItem(formData)
  setIsOpen(false)
}
```

### Table Rendering
```javascript
<table className="w-full">
  <thead>
    <tr className="border-b">
      <th className="px-6 py-3 text-left font-semibold">Column</th>
    </tr>
  </thead>
  <tbody>
    {data.map((item, idx) => (
      <tr key={item.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
        <td className="px-6 py-3">{item.name}</td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## Debugging

### Check Data in Console
```javascript
// F12 to open DevTools
JSON.parse(localStorage.getItem('ighData'))
```

### View Audit Log
Settings > Audit Trail (searchable, timestamped)

### Clear Everything
Settings > System > Clear All Data (requires "RESET")

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Data not saving | Check localStorage in DevTools |
| Import errors | Check file paths in imports |
| Styling not applied | Clear browser cache |
| Dark mode not working | Check `dark:` prefix in Tailwind |
| Charts not showing | Verify data exists, check console |

---

## File Naming Conventions

- **Components**: PascalCase (Button.jsx)
- **Pages**: PascalCase (Dashboard.jsx)
- **Utilities**: camelCase (dataUtils.js)
- **Constants**: UPPER_CASE (ROLES.js)

---

## Component Props Pattern

```javascript
// Reusable component
function TableRow({ data, onEdit, onDelete }) {
  return (
    <tr>
      <td>{data.name}</td>
      <td>
        <button onClick={() => onEdit(data.id)}>Edit</button>
        <button onClick={() => onDelete(data.id)}>Delete</button>
      </td>
    </tr>
  )
}
```

---

## Adding Dark Mode to Components

```javascript
// Use dark: prefix
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content
</div>
```

---

## Responsive Patterns

```javascript
// Mobile first, then scale up
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Items */}
</div>
```

---

## Validation Examples

```javascript
// Email
if (!email.includes('@')) {
  alert('Invalid email')
  return
}

// Required field
if (!formData.name.trim()) {
  alert('Name is required')
  return
}

// Number validation
if (isNaN(amount) || amount <= 0) {
  alert('Invalid amount')
  return
}

// Date validation
if (new Date(date) > new Date()) {
  alert('Date cannot be in future')
  return
}
```

---

## localStorage Helper Pattern

```javascript
// Save
const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data))
}

// Get
const getFromStorage = (key) => {
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}
```

---

## Performance Tips

1. **Avoid unnecessary renders**
   ```javascript
   const memoValue = useMemo(() => expensiveCalculation(), [dependency])
   ```

2. **Optimize lists**
   ```javascript
   filteredList.slice(0, 100).map(item => ...)  // Limit rendered items
   ```

3. **Debounce search**
   ```javascript
   const [searchTimer, setSearchTimer] = useState(null)
   const handleSearch = (value) => {
     clearTimeout(searchTimer)
     setSearchTimer(setTimeout(() => {
       // Perform search
     }, 300))
   }
   ```

---

## Icon Usage (lucide-react)

```javascript
import { Plus, Edit2, Trash2, Save, X, Check } from 'lucide-react'

<button className="flex items-center gap-2">
  <Plus size={20} />
  Add Item
</button>
```

---

## Chart.js Quick Setup

```javascript
import { Line, Bar, Pie } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, ... } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, ...)

const chartData = {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [{
    label: 'Sales',
    data: [100, 200, 150],
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  }]
}

<Line data={chartData} options={{ responsive: true }} />
```

---

## Testing Data

### Sample Sale
```javascript
{
  date: '2024-02-15',
  client: 'ABC Corp',
  dept: 'Branding',
  amount: 50000,
  desc: 'Logo design package',
  paymentMethod: 'Bank Transfer',
  paymentRef: 'TRF-12345',
  paymentStatus: 'Paid'
}
```

### Sample Client
```javascript
{
  name: 'ABC Corporation',
  phone: '0712345678',
  address: '123 Main Street',
  location: 'Nairobi'
}
```

---

## Deployment Checklist

- [ ] Run `npm run build`
- [ ] Test production build with `npm run preview`
- [ ] Check for console errors (F12)
- [ ] Test all modules
- [ ] Verify dark mode works
- [ ] Test on mobile device
- [ ] Export test data as CSV
- [ ] Clear cache between versions

---

## Environment Variables (Future)

When adding API backend:

```javascript
// .env.local
VITE_API_URL=https://api.igh.com
VITE_VERSION=1.0.0
```

Usage:
```javascript
const apiUrl = import.meta.env.VITE_API_URL
```

---

## Security Considerations

1. **Input Validation**: Always validate before saving
2. **SQL Injection**: N/A (using localStorage)
3. **XSS Prevention**: React auto-escapes by default
4. **CSRF**: N/A (local storage only)
5. **Authentication**: Enhanced when adding backend

---

## Browser DevTools Tips

```javascript
// View data
localStorage.getItem('ighData')

// Clear everything
localStorage.clear()

// Watch for changes
JSON.parse(localStorage.getItem('ighData')).sales.length

// Simulate dark mode
document.documentElement.classList.add('dark')
```

---

## CSS Class Reference

```css
/* Primary colors */
bg-primary-bg        /* Light background #f3f6fb */
bg-primary-card      /* Card background #ffffff */
text-primary-text    /* Main text #0f172a */
text-primary-muted   /* Muted text #5b6b7a */
bg-primary-gold      /* Gold accent #fbbf24 */

/* Status colors */
text-green-600       /* Success */
text-red-600         /* Danger */
text-blue-600        /* Info */
text-yellow-600      /* Warning */

/* Convenience classes */
.card                /* White card with shadow */
.btn-primary         /* Gold gradient button */
.form-input          /* Styled input field */
```

---

## Getting Help

1. Check console (F12) for errors
2. Review Audit Trail in Settings
3. Check localStorage in DevTools
4. Refer to README.md
5. Check SETUP.md for troubleshooting

---

**Happy coding! 🚀**

This guide provides quick reference for common development tasks. For detailed information, see the README.md and SETUP.md files.
