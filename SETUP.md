# IGH BMS - Setup & Getting Started Guide

## Quick Start

### Step 1: Install Node.js
If Node.js is not installed, download and install it from: https://nodejs.org/
- Download the LTS (Long Term Support) version
- Run the installer and follow the setup wizard
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

### Step 2: Install Dependencies
Open terminal in the project folder and run:
```bash
npm install
```

This will install all required packages:
- React 18
- React Router v6
- Tailwind CSS
- Chart.js
- Vite

### Step 3: Start Development Server
```bash
npm run dev
```

### Deploy to Vercel and replace existing project

1. Create a GitHub repository and push this project (example commands):

```bash
git remote add origin git@github.com:yourusername/igh-bms.git
git branch -M main
git push -u origin main
```

2. In Vercel:
- Go to your dashboard and remove the existing project `igh-system` (this will delete the currently deployed site).
- Choose "Import Project" → connect your GitHub and import the newly pushed repository.

3. In the Vercel project settings → Environment Variables, add:

- `VITE_SUPABASE_URL` = your Supabase URL (e.g., https://ykfhjyzmrwphbxkauqlt.supabase.co)
- `VITE_SUPABASE_ANON_KEY` = your Supabase publishable API key (the anon key)

4. Deploy. Vercel will build with `npm install` and `npm run build`.

### Link Supabase and migrate data

1. In Supabase dashboard, open the SQL Editor and run the SQL in `supabase/schema.sql` to create the initial tables.

2. For migration, export your browser `localStorage` `ighData` object to a JSON file (example in browser console):

```js
copy(JSON.stringify(localStorage.getItem('ighData') ? JSON.parse(localStorage.getItem('ighData')) : {}))
```

Paste into a file `data-export.json` on your machine.

3. Set environment variables locally for migration (you need the Supabase service role key from Project Settings → API):

```bash
export SUPABASE_URL="https://ykfhjyzmrwphbxkauqlt.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
node scripts/migrate-to-supabase.js data-export.json
```

Note: use Windows PowerShell equivalents for `export` (e.g., `setx` or `$env:SUPABASE_URL = '...'`).

4. After migration, set the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` on Vercel and redeploy.

### Next steps (recommended)

- Update `src/context/DataContext.jsx` to use the Supabase client (`src/lib/supabaseClient.js`) for CRUD instead of localStorage.
- Rotate service role keys and keep them secret (never commit to repo).
- If you want, I can scaffold the DataContext migration and convert a single collection to Supabase-backed as a follow-up.


The development server will start and open in your browser at:
```
http://localhost:5173/
```

### Step 4: Login
Use the demo credentials:
- **Admin**: admin@igh.com / admin123
- **User**: user@igh.com / user123

---

## Development Workflow

### Running the App
```bash
npm run dev        # Start development server (hot reload)
```

### Building for Production
```bash
npm run build      # Create optimized production build
npm run preview    # Preview production build
```

### Project Structure
```
igh-bms/
├── src/
│   ├── components/       # Reusable UI components
│   ├── context/          # React Context for state
│   ├── pages/            # Page components
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html            # HTML template
├── package.json          # Dependencies
├── vite.config.js        # Vite config
├── tailwind.config.js    # Tailwind config
└── postcss.config.js     # PostCSS config
```

---

## Module Overview

### 1. Dashboard
- Revenue analytics and KPIs
- Real-time charts
- Quick statistics
- Recent transactions

### 2. Sales Management
- Add/edit/delete sales
- Filter by department, status
- Track payment information
- Export sales data

### 3. Clients
- Manage client directory
- Track total sales per client
- Contact information
- Edit/delete clients

### 4. Design Projects
- Project tracking
- Assign to designers
- Track completion status
- Link to clients

### 5. Expenses
- Track business expenses
- Categorize by type
- View category summaries
- Export expense reports

### 6. Suppliers
- Supplier directory
- Contact and credii information
- Track supplier expenses
- Payment history

### 7. Inventory
- Stock tracking
- Low stock alerts
- Reorder levels
- Supplier association

### 8. Reports
- Multiple report types
- Date range filtering
- CSV export
- System-wide summaries

### 9. Settings (Admin Only)
- User management
- Role assignment
- Audit trail
- System data management

---

## Features by Role

### Admin
- ✅ Full access to all modules
- ✅ User management
- ✅ System settings
- ✅ Audit trail viewing
- ✅ Data export & reset

### Designer
- ✅ View design projects
- ✅ View and filter sales
- ✅ View dashboard
- ✅ View reports

### User
- ✅ View dashboard
- ✅ View reports
- ✅ View clients (read-only)

---

## Data Management

### Adding Sample Data
The system comes with empty databases. To add data:

1. **Add Clients First**
   - Go to Clients → Add Client
   - Fill in name, phone, address, location
   - Submit

2. **Create Sales**
   - Go to Sales → Add Sale
   - Select client, department, amount
   - Choose payment method and status

3. **Add Design Projects**
   - Go to Design Projects → Add Design
   - Select client, assign designer
   - Set completion date and status

4. **Track Expenses**
   - Go to Expenses → Add Expense
   - Select category and amount
   - Add description

5. **Manage Suppliers**
   - Go to Suppliers → Add Supplier
   - Fill contact and credit information
   - Track purchases

6. **Stock Management**
   - Go to Inventory → Add Item
   - Set quantity and reorder levels
   - Assign supplier

### Exporting Data
- Go to Reports
- Select report type
- Set date range
- Click "Export to CSV"

### Clearing Data
⚠️ **Admin Only**
- Go to Settings → System
- Scroll to "Danger Zone"
- Click "Clear All Data"
- Type "RESET" when prompted

---

## Customization

### Color Scheme
Edit `tailwind.config.js`:
```javascript
extend: {
  colors: {
    primary: {
      gold: '#fbbf24',      // Main accent
      success: '#10b981',   // Success color
      danger: '#ef4444',    // Error color
      // ... more colors
    }
  }
}
```

### Dark Mode
Enabled by default toggle in topbar. Edit `src/index.css` to customize dark mode colors.

### Adding New Fields
1. Update `DataContext.jsx` data structure
2. Add form fields in corresponding page component
3. Update table columns to display new data

---

## Troubleshooting

### Port Already in Use
If port 5173 is busy:
```bash
npm run dev -- --port 3000  # Use different port
```

### Module Not Found
Delete `node_modules` and reinstall:
```bash
rm -r node_modules
npm install
```

### Data Not Saving
- Check if localStorage is enabled in browser
- Clear cache: Ctrl+Shift+Delete → Cache
- Check available storage space

### Charts Not Loading
- Clear browser cache
- Check browser console for errors (F12)
- Verify data exists in system

### Slow Performance
- Clear localStorage (Settings > System > Clear)
- Reduce data volume
- Use compact mode (top bar toggle)

---

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 90+     | ✅ Full |
| Firefox | 88+     | ✅ Full |
| Safari  | 14+     | ✅ Full |
| Edge    | 90+     | ✅ Full |
| Mobile  | Modern  | ✅ Full |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| F12 | Open Developer Tools |
| Ctrl+Shift+Delete | Clear Cache |
| Ctrl+S | Save (browser default) |

---

## Performance Tips

1. **Use Compact Mode** for better data density
2. **Clear audit log regularly** from Settings
3. **Export old data** before clearing
4. **Use filters** to reduce rendered data
5. **Close unused tabs** to free memory

---

## Getting Help

### Check These First
1. Browser console (F12) for errors
2. README.md for feature overview
3. Audit trail for activity logs
4. Settings page for system info

### Common Issues

**Login fails**
- Verify email and password
- Check caps lock
- Try incognito mode

**Data missing**
- Check ighData in localStorage (F12 > Application)
- Verify user hasn't cleared data
- Check browser storage limits

**Slow performance**
- Clear cache and reload
- Use compact mode
- Remove old audit entries

---

## Advanced Configuration

### System Requirements
- Modern web browser
- ~5MB localStorage available
- Internet connection (optional after first load)

### Environment
- Development: `npm run dev`
- Production: `npm run build`

### API Integration (Future)
When ready to add a backend:
1. Replace localStorage calls in DataContext.jsx
2. Add API endpoints configuration
3. Implement authentication with JWT
4. Update data synchronization

---

## Deployment

### Static Hosting (Vercel, Netlify, etc.)
```bash
npm run build
# Upload `dist/` folder to hosting
```

### Self-Hosted
```bash
npm run build
# Serve `dist/` folder with any web server
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

---

## Next Steps

1. ✅ Install Node.js
2. ✅ Run `npm install`
3. ✅ Run `npm run dev`
4. ✅ Add sample data
5. ✅ Explore dashboard
6. ✅ Try each module
7. ✅ Generate reports
8. ✅ Customize as needed

---

**You're all set! Start managing your business! 🚀**
