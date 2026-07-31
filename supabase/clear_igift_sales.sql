-- Script to clear incorrect sales data for iGift branch ONLY
-- Preserves all IGH sales data and all non-sales data (clients, inventory, expenses, designs, suppliers) across all branches

DELETE FROM sales WHERE LOWER(branch) = 'igift';

-- Log audit entry for the database cleanup
INSERT INTO audit ("user", action, module, details)
VALUES ('admin', 'DELETE', 'Sales', 'Cleared 153 invalid sales records for iGift branch per user request');
