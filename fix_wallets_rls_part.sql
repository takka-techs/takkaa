-- Ensure wallets has RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON wallets;
DROP POLICY IF EXISTS "Enable insert access for all users" ON wallets;
DROP POLICY IF EXISTS "Enable update access for all users" ON wallets;
DROP POLICY IF EXISTS "Enable delete access for all users" ON wallets;

DROP POLICY IF EXISTS "wallets_read_policy" ON wallets;
DROP POLICY IF EXISTS "wallets_insert_policy" ON wallets;
DROP POLICY IF EXISTS "wallets_update_policy" ON wallets;
DROP POLICY IF EXISTS "wallets_delete_policy" ON wallets;

-- Create secure policies
-- A user can see wallets if they are the owner OR they are a cashier in the wallet's branch
CREATE POLICY "wallets_select" ON wallets FOR SELECT USING (
  user_id = auth.uid() 
  OR 
  branch_id IN (
    SELECT branch_id FROM app_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "wallets_insert" ON wallets FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "wallets_update" ON wallets FOR UPDATE USING (
  user_id = auth.uid()
  OR
  branch_id IN (
    SELECT branch_id FROM app_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "wallets_delete" ON wallets FOR DELETE USING (
  user_id = auth.uid()
);
