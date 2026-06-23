CREATE TABLE IF NOT EXISTS document_workbench_sessions (
  id TEXT PRIMARY KEY,
  document_type TEXT NOT NULL,
  document_type_rules_version TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  original_title TEXT NOT NULL,
  normalized_paragraphs TEXT NOT NULL,
  recommendation TEXT NOT NULL DEFAULT '[]',
  current_framework TEXT,
  preview TEXT,
  quality_checks TEXT NOT NULL DEFAULT '[]',
  supplements TEXT NOT NULL DEFAULT '[]',
  final_document TEXT,
  published_url TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
