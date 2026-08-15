CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  service TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'New'
    CHECK (status IN ('New', 'Contacted', 'Quoted', 'Scheduled', 'Completed', 'Archived')),
  notes TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at
  ON leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_status
  ON leads(status);

CREATE INDEX IF NOT EXISTS idx_leads_name
  ON leads(name);
