-- Add default_currency column to groups table
-- This allows each group to have its own default currency

ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS default_currency VARCHAR(3) DEFAULT 'USD';

-- Add comment to column for documentation
COMMENT ON COLUMN groups.default_currency IS 'Three-letter ISO 4217 currency code for group default (e.g., USD, INR, EUR)';
