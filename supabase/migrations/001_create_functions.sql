-- ═══════════════════════════════════════════════════════════
-- Shared functions used by multiple tables.
-- Must be created before any triggers that reference them.
-- ═══════════════════════════════════════════════════════════

-- Auto-update updated_at column on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
