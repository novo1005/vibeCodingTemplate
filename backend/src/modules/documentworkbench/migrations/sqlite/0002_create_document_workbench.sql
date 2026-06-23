CREATE TABLE IF NOT EXISTS document_workbench (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_document_workbench_created_at ON document_workbench (created_at);
