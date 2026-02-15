# IGH Business Management System

A comprehensive, professional business management system for Identity Graphics Houzz (IGH) - built with React, Vite, and Tailwind CSS.

## Features

### Core Modules
- **Dashboard** - Real-time analytics with charts and KPIs
- **Sales Management** - Track sales by department, client, and payment status
- **Clients Management** - Complete client directory with transaction history
- **Design Projects** - Project tracking with status and designer assignment
- **Expenses Management** - Track business expenses by category
- **Suppliers Management** - Supplier directory and purchase tracking
- **Inventory Management** - Stock tracking with low stock alerts
- **Reports** - Comprehensive reporting with CSV export
- **Settings** - Admin panel for user management and system configuration

### Advanced Features
- **Authentication** - Secure login with role-based access control
- **Dark Mode** - Toggle between light and dark themes
- **Compact Mode** - Dense data display for more information at once
- **Audit Trail** - Complete activity logging for compliance
- **Data Persistence** - All data saved to browser localStorage
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Real-time Charts** - Sales trends, department breakdown, expense analysis

## Tech Stack

- **Frontend**: React 18 + React Router v6
- **Styling**: Tailwind CSS
- **Charts**: Chart.js + react-chartjs-2
- **Build Tool**: Vite
- **State Management**: React Context API
- **Data Storage**: Browser localStorage

## Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup Steps

1. **Extract Project**
```bash
cd igh-bms
```

2. **Install Dependencies**
```bash
npm install
```

3. **Start Development Server**
```bash
npm run dev
```

The application will open at `http://localhost:5173`

4. **Build for Production**
```bash
npm run build
```

## Default Credentials

### Admin Account
- Email: `admin@igh.com`
- Password: `admin123`
- Access: Full system access

### User Account
- Email: `user@igh.com`
- Password: `user123`
- Access: View-only for most modules

## Project Structure

```
igh-bms/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Topbar.jsx
│   │   └── Modal.jsx
│   ├── context/          # State management
│   │   └── DataContext.jsx
│   ├── pages/            # Page components
│   │   ├── LoginPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Sales.jsx
│   │   ├── Clients.jsx
│   │   ├── DesignProjects.jsx
│   │   ├── Expenses.jsx
│   │   ├── Suppliers.jsx
│   │   ├── Inventory.jsx
│   │   ├── Reports.jsx
│   │   └── Settings.jsx
│   ├── App.jsx           # Main app with routing
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static files
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
├── postcss.config.js     # PostCSS configuration
└── package.json          # Dependencies
```

## Key Features Explained

### Authentication & Roles
- **Admin**: Full access to all features and settings
- **Designer**: Access to design projects and sales viewing
- **User**: Basic dashboard and reporting access

### Sales Module
- Track sales by department (Reception, Branding, Designing, 3D Design & Signage, Marketing)
- Payment methods: Cash, M-Pesa, Bank Transfer, Cheque, Credit
- Payment status: Paid, Pending, Partial
- Link sales to design projects

### Inventory System
- Three status levels: In Stock, Low Stock (alert), Out of Stock
- Reorder level tracking
- Supplier association
- Category organization

### Reporting System
- Multiple report types with date filtering
- CSV export with timestamps
- Export all data or specific modules
- Printable reports

### Dashboard Analytics
- Real-time statistics cards
- Sales trend chart
- Department performance comparison
- Expense category breakdown
- Recent transaction feed
- Quick statistics panel

## Data Management

### Local Storage Structure
All data is stored in browser's localStorage under the key `ighData`:

```javascript
{
  sales: [],           // Sales transactions
  clients: [],         // Client directory
  designs: [],         // Design projects
  expenses: [],        // Business expenses
  suppliers: [],       // Supplier directory
  supplierExpenses: [], // Purchase orders
  inventory: [],       // Stock items
  audit: [],           // Activity log
  users: []            // User accounts
}
```

### Backup & Export
- Use Reports section to export data as CSV
- Admin can clear all data (with confirmation)

## Customization

### Color Scheme
Edit `tailwind.config.js` to customize colors:

```javascript
colors: {
  primary: {
    bg: '#f3f6fb',       // Background
    card: '#ffffff',     // Card background
    text: '#0f172a',     // Text
    gold: '#fbbf24',     // Accent
    success: '#10b981',  // Success
    danger: '#ef4444',   // Error
  }
}
```

### Dark Mode
Automatically detected in Topbar. Toggle with the moon icon.

### Adding New Modules
1. Create page component in `src/pages/`
2. Add context methods in `src/context/DataContext.jsx`
3. Add route in `src/App.jsx`
4. Add navigation item in `src/components/Sidebar.jsx`

## Performance Tips

- Data is cached in localStorage for fast loading
- Charts are memoized to prevent unnecessary re-renders
- Lazy loading of components via React Router
- Debounced search inputs

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## Troubleshooting

### Data Not Saving
1. Check browser localStorage is enabled
2. Check available storage space
3. Clear browser cache and reload

### Charts Not Displaying
1. Ensure Chart.js and react-chartjs-2 are installed
2. Check browser console for errors
3. Verify data exists in dashboard

### Login Issues
1. Check entered credentials match demo accounts
2. Try incognito mode to avoid cached issues
3. Clear localStorage and reset to defaults

## Future Enhancements

- **Phase 2**: Cloud backup with Supabase
- **Phase 3**: Email notifications and SMS integration
- **Phase 4**: Invoice generation and receipt printing
- **Phase 5**: Mobile app version
- **Phase 6**: Advanced analytics with predictions

## Support & Maintenance

For issues or feature requests:
1. Check browser console for error messages
2. Verify data integrity in Settings > Audit Trail
3. Export data for backup before major changes
4. Check localStorage size limits

## License

© 2024 Identity Graphics Houzz. All rights reserved.

---

**Happy Managing! 🚀**

For more information, see the comprehensive project prompt in `IGH_COMPLETE_PROJECT_PROMPT.md`.
