-- Add 'canceled' to trigger_type CHECK constraint
-- This allows the ㄱㅌ (cancel) signal to update trigger_type to 'canceled'

-- First, drop the existing constraint
ALTER TABLE status_board DROP CONSTRAINT IF EXISTS status_board_trigger_type_check;

-- Add the new constraint with 'canceled' included
ALTER TABLE status_board ADD CONSTRAINT status_board_trigger_type_check
  CHECK (trigger_type IN ('start', 'hourly', 'end', 'canceled'));
