
-- Hypium Impact Manager
-- Mevcut tabloları değiştirmeden yeni tablolar oluşturur.

CREATE TABLE IF NOT EXISTS hypium_impact_events (
  id TEXT PRIMARY KEY,
  event_date TEXT,
  latitude REAL,
  longitude REAL,
  people_reached INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hypium_impact_event_translations (
  event_id TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('tr','en','de','fr')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location_name TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (event_id, language),
  FOREIGN KEY (event_id)
    REFERENCES hypium_impact_events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hypium_impact_media (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  object_key TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id)
    REFERENCES hypium_impact_events(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS hypium_impact_stats (
  id TEXT PRIMARY KEY,
  stat_key TEXT NOT NULL UNIQUE,
  value REAL NOT NULL DEFAULT 0,
  target REAL,
  unit TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hypium_impact_stat_translations (
  stat_id TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('tr','en','de','fr')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (stat_id, language),
  FOREIGN KEY (stat_id)
    REFERENCES hypium_impact_stats(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hypium_impact_map_points (
  id TEXT PRIMARY KEY,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  event_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (event_id)
    REFERENCES hypium_impact_events(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS hypium_impact_map_translations (
  point_id TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('tr','en','de','fr')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (point_id, language),
  FOREIGN KEY (point_id)
    REFERENCES hypium_impact_map_points(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hypium_impact_events_published
  ON hypium_impact_events(is_published, sort_order);

CREATE INDEX IF NOT EXISTS idx_hypium_impact_media_event
  ON hypium_impact_media(event_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_hypium_impact_map_published
  ON hypium_impact_map_points(is_published, sort_order);
