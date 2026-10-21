PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('announcements','posts','projects','gallery','members')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0 AND sort_order <= 99999),
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_content_type_status_order ON content_items(type, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_content_updated_at ON content_items(updated_at DESC);
