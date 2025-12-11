-- Add currency column to expenses table
-- This migration adds support for storing currency with each expense

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Add comment to column for documentation
COMMENT ON COLUMN expenses.currency IS 'Three-letter ISO 4217 currency code (e.g., USD, INR, EUR)';

-- Optionally, add an index if you frequently filter by currency
-- CREATE INDEX IF NOT EXISTS idx_expenses_currency ON expenses(currency);
