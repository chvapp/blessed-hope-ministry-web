-- Blessed Hope Gospel Ministry: initial schema (Cloudflare D1 / SQLite)

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL            -- JSON-encoded value
);

CREATE TABLE admin_users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,   -- pbkdf2-sha256$iterations$salt$hash
  role          TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'editor')),
  is_active     INTEGER NOT NULL DEFAULT 1,
  session_version INTEGER NOT NULL DEFAULT 1,  -- bump to revoke all sessions
  last_login_at TEXT,
  created_at    TEXT NOT NULL
);

CREATE TABLE devotionals (
  id             TEXT PRIMARY KEY,
  publish_date   TEXT NOT NULL UNIQUE,          -- YYYY-MM-DD (calendar date, timezone-agnostic)
  title          TEXT NOT NULL,
  scripture_ref  TEXT NOT NULL,
  memory_verse   TEXT NOT NULL DEFAULT '',
  focus          TEXT NOT NULL DEFAULT '',
  body           TEXT NOT NULL,
  prayer_points  TEXT NOT NULL DEFAULT '[]',    -- JSON array of strings
  author         TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX idx_devotionals_status_date ON devotionals (status, publish_date DESC);

CREATE TABLE sermons (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  speaker       TEXT NOT NULL,
  series        TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT '',
  media_type    TEXT NOT NULL CHECK (media_type IN ('video', 'audio')),
  media_url     TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  duration      TEXT NOT NULL DEFAULT '',
  preached_date TEXT NOT NULL,
  summary       TEXT NOT NULL DEFAULT '',
  is_featured   INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);
CREATE INDEX idx_sermons_date ON sermons (preached_date DESC);

CREATE TABLE events (
  id                  TEXT PRIMARY KEY,
  title               TEXT NOT NULL,
  category            TEXT NOT NULL CHECK (category IN ('service', 'convention', 'academy')),
  schedule_label      TEXT NOT NULL DEFAULT '',
  start_at            TEXT NOT NULL,            -- ISO 8601 UTC
  location            TEXT NOT NULL DEFAULT '',
  description         TEXT NOT NULL DEFAULT '',
  image_url           TEXT NOT NULL DEFAULT '',
  is_countdown_target INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL
);
CREATE INDEX idx_events_start ON events (start_at);

CREATE TABLE donations (
  id               TEXT PRIMARY KEY,
  reference        TEXT NOT NULL UNIQUE,
  donor_name       TEXT NOT NULL,
  donor_email      TEXT NOT NULL,
  category         TEXT NOT NULL,
  currency         TEXT NOT NULL,
  amount_minor     INTEGER NOT NULL,
  status           TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  gateway_response TEXT NOT NULL DEFAULT '',
  paid_at          TEXT,
  created_at       TEXT NOT NULL
);
CREATE INDEX idx_donations_created ON donations (created_at DESC);

CREATE TABLE submissions (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('prayer', 'testimony', 'first_timer', 'academy', 'contact', 'salvation')),
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT NOT NULL DEFAULT '',
  subject     TEXT NOT NULL DEFAULT '',
  message     TEXT NOT NULL,
  is_approved INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed')),
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_submissions_type_created ON submissions (type, created_at DESC);

-- Members / contacts who can receive WhatsApp broadcasts.
CREATE TABLE subscribers (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL DEFAULT '',
  phone           TEXT NOT NULL UNIQUE,        -- E.164 digits without '+', e.g. 2348012345678
  email           TEXT NOT NULL DEFAULT '',
  tags            TEXT NOT NULL DEFAULT '',    -- comma-separated, e.g. "member,youth,choir"
  whatsapp_opt_in INTEGER NOT NULL DEFAULT 1,
  source          TEXT NOT NULL DEFAULT 'admin', -- admin | import | website
  created_at      TEXT NOT NULL,
  opted_out_at    TEXT
);

CREATE TABLE broadcasts (
  id             TEXT PRIMARY KEY,
  channel        TEXT NOT NULL DEFAULT 'whatsapp',
  template_name  TEXT NOT NULL,
  template_lang  TEXT NOT NULL,
  body_params    TEXT NOT NULL DEFAULT '[]',   -- JSON array; "{{name}}" is replaced per recipient
  audience_tag   TEXT NOT NULL DEFAULT '',     -- '' = all opted-in subscribers
  preview_text   TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL CHECK (status IN ('queued', 'sending', 'completed', 'cancelled')),
  total          INTEGER NOT NULL DEFAULT 0,
  sent           INTEGER NOT NULL DEFAULT 0,
  failed         INTEGER NOT NULL DEFAULT 0,
  created_by     TEXT NOT NULL DEFAULT '',
  created_at     TEXT NOT NULL,
  completed_at   TEXT
);

CREATE TABLE broadcast_recipients (
  broadcast_id  TEXT NOT NULL REFERENCES broadcasts (id) ON DELETE CASCADE,
  subscriber_id TEXT NOT NULL,
  phone         TEXT NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'delivered', 'read', 'failed', 'skipped')),
  wa_message_id TEXT,
  error         TEXT,
  updated_at    TEXT NOT NULL,
  PRIMARY KEY (broadcast_id, subscriber_id)
);
CREATE INDEX idx_recipients_pending ON broadcast_recipients (status, broadcast_id);
CREATE INDEX idx_recipients_wamid ON broadcast_recipients (wa_message_id);
