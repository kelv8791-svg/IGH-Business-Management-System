-- Atomic Stock Transaction & Non-Negative Inventory Stored Procedure
-- Run this in the Supabase SQL Editor

CREATE OR REPLACE FUNCTION process_stock_transaction(
    p_item_id BIGINT,
    p_quantity_change INT,
    p_transaction_type TEXT,
    p_reason TEXT,
    p_date DATE,
    p_created_by TEXT,
    p_branch TEXT DEFAULT 'IGH'
)
RETURNS JSON AS $$
DECLARE
    v_current_qty INT;
    v_new_qty INT;
    v_transaction_id BIGINT;
    v_result JSON;
BEGIN
    -- 1. Lock the inventory row FOR UPDATE to prevent race conditions
    SELECT quantity INTO v_current_qty
    FROM inventory
    WHERE id = p_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory item % not found', p_item_id;
    END IF;

    -- 2. Compute new stock level
    v_new_qty := COALESCE(v_current_qty, 0) + p_quantity_change;

    -- 3. Prevent negative stock overselling
    IF v_new_qty < 0 THEN
        RAISE EXCEPTION 'Stock adjustment rejected: Item % has % units. Attempted change of % would reduce stock to negative (%).', 
            p_item_id, COALESCE(v_current_qty, 0), p_quantity_change, v_new_qty;
    END IF;

    -- 4. Update Inventory stock count
    UPDATE inventory
    SET quantity = v_new_qty
    WHERE id = p_item_id;

    -- 5. Insert audit log into stock_transactions
    INSERT INTO stock_transactions (
        item_id,
        quantity_change,
        transaction_type,
        reason,
        date,
        created_by,
        branch,
        created_at
    )
    VALUES (
        p_item_id,
        p_quantity_change,
        p_transaction_type,
        p_reason,
        p_date,
        p_created_by,
        p_branch,
        NOW()
    )
    RETURNING id INTO v_transaction_id;

    v_result := json_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'item_id', p_item_id,
        'previous_quantity', v_current_qty,
        'new_quantity', v_new_qty
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
