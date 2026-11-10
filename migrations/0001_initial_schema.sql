-- Migration 0001: initial schema of the IELTS Trainer cloud database (Cloudflare D1 / SQLite).
--
-- Conventions
--  * Every table that holds learner data has user_id and is isolated by it. Primary keys are
--    (user_id, id), so ids only have to be unique per user and one user can never touch another's rows.
--  * Ids are TEXT. Records created before the cloud existed keep their old ids ("att-...", "v-001");
--    new records use UUIDs generated in the browser.
--  * Times are INTEGER milliseconds since 1970-01-01 UTC (the values the app already uses).
--  * Booleans are INTEGER 0/1. JSON columns are TEXT checked with json_valid().
--  * Changeable records have updated_at (last write wins) and version (+1 on every applied change);
--    deletions of synced records are soft (deleted_at) so that other devices learn about them.
--  * No BEGIN/COMMIT/PRAGMA here: Cloudflare runs migrations itself.

-- ── Users and devices ──────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            TEXT PRIMARY KEY CHECK (length(id) BETWEEN 8 AND 64),
  email         TEXT NOT NULL UNIQUE CHECK (email = lower(email) AND length(email) BETWEEN 3 AND 254),
  access_sub    TEXT UNIQUE,                       -- stable user id from Cloudflare Access (JWT "sub")
  display_name  TEXT CHECK (display_name IS NULL OR length(display_name) <= 100),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  created_at    INTEGER NOT NULL CHECK (typeof(created_at) = 'integer' AND created_at > 0),
  last_seen_at  INTEGER CHECK (last_seen_at IS NULL OR typeof(last_seen_at) = 'integer')
);

CREATE TABLE devices (
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id             TEXT NOT NULL CHECK (length(id) BETWEEN 8 AND 64),   -- generated once in the browser
  label          TEXT CHECK (label IS NULL OR length(label) <= 100),
  first_seen_at  INTEGER NOT NULL CHECK (typeof(first_seen_at) = 'integer' AND first_seen_at > 0),
  last_seen_at   INTEGER NOT NULL CHECK (typeof(last_seen_at) = 'integer' AND last_seen_at > 0),
  last_pull_seq  INTEGER NOT NULL DEFAULT 0 CHECK (last_pull_seq >= 0),  -- how far this device has read sync_log
  last_push_at   INTEGER CHECK (last_push_at IS NULL OR typeof(last_push_at) = 'integer'),
  PRIMARY KEY (user_id, id)
);

-- ── Settings (preferences and profile in one row: one source of truth) ───────────────

CREATE TABLE user_settings (
  user_id             TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme               TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  interface_language  TEXT NOT NULL DEFAULT 'ru' CHECK (interface_language IN ('ru', 'en')),
  daily_goal_minutes  INTEGER NOT NULL DEFAULT 20 CHECK (daily_goal_minutes BETWEEN 1 AND 600),
  target_ielts_score  REAL NOT NULL DEFAULT 6.0 CHECK (target_ielts_score BETWEEN 0 AND 9),
  current_level       TEXT NOT NULL DEFAULT 'not_assessed'
                      CHECK (current_level IN ('not_assessed', 'A2', 'B1', 'B1+', 'B2', 'IELTS_5.5', 'IELTS_6.0', 'IELTS_6.5')),
  last_diagnostic_at  INTEGER CHECK (last_diagnostic_at IS NULL OR typeof(last_diagnostic_at) = 'integer'),
  updated_at          INTEGER NOT NULL CHECK (typeof(updated_at) = 'integer' AND updated_at > 0),
  version             INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  device_id           TEXT
);

-- ── Answers to exercises (grammar lab, daily lesson, mistake retry, diagnostic) ─────────

CREATE TABLE attempts (
  user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id                   TEXT NOT NULL CHECK (length(id) BETWEEN 1 AND 64),
  exercise_id          TEXT NOT NULL CHECK (length(exercise_id) BETWEEN 1 AND 64),
  topic_id             TEXT NOT NULL CHECK (length(topic_id) BETWEEN 1 AND 64),
  type                 TEXT NOT NULL CHECK (type IN ('multiple_choice', 'fill_blank', 'find_error', 'write_sentence')),
  correct              INTEGER NOT NULL CHECK (correct IN (0, 1)),
  user_answer          TEXT NOT NULL DEFAULT '' CHECK (length(user_answer) <= 4000),
  suggested_correction TEXT NOT NULL DEFAULT '' CHECK (length(suggested_correction) <= 4000),
  time_spent_ms        INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_ms BETWEEN 0 AND 86400000),
  source               TEXT NOT NULL CHECK (source IN ('daily_lesson', 'grammar_lab', 'mistake_retry', 'diagnostic')),
  created_at           INTEGER NOT NULL CHECK (typeof(created_at) = 'integer' AND created_at > 0),
  updated_at           INTEGER NOT NULL CHECK (typeof(updated_at) = 'integer' AND updated_at > 0),  -- "my answer may be correct" changes `correct`
  version              INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  device_id            TEXT,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX ix_attempts_user_time     ON attempts (user_id, created_at);
CREATE INDEX ix_attempts_user_exercise ON attempts (user_id, exercise_id, created_at);
CREATE INDEX ix_attempts_user_topic    ON attempts (user_id, topic_id, created_at);

-- ── Mistakes notebook ────────────────────────────────────────────────────────────────

CREATE TABLE mistakes (
  user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id                   TEXT NOT NULL CHECK (length(id) BETWEEN 1 AND 64),
  exercise_id          TEXT NOT NULL CHECK (length(exercise_id) BETWEEN 1 AND 64),
  topic_id             TEXT NOT NULL CHECK (length(topic_id) BETWEEN 1 AND 64),
  category             TEXT NOT NULL CHECK (category IN
                         ('verb_tenses', 'articles', 'prepositions', 'word_order', 'sentence_structure', 'vocabulary', 'spelling', 'other')),
  question_en          TEXT NOT NULL DEFAULT '' CHECK (length(question_en) <= 2000),
  user_answer          TEXT NOT NULL DEFAULT '' CHECK (length(user_answer) <= 4000),
  suggested_correction TEXT NOT NULL DEFAULT '' CHECK (length(suggested_correction) <= 4000),
  explanation_ru       TEXT NOT NULL DEFAULT '' CHECK (length(explanation_ru) <= 4000),
  attempts             INTEGER NOT NULL DEFAULT 1 CHECK (attempts >= 0),
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'understood', 'archived')),
  next_review_at       INTEGER NOT NULL CHECK (typeof(next_review_at) = 'integer' AND next_review_at >= 0),
  review_interval_days INTEGER NOT NULL DEFAULT 1 CHECK (review_interval_days >= 0),
  created_at           INTEGER NOT NULL CHECK (typeof(created_at) = 'integer' AND created_at > 0),
  updated_at           INTEGER NOT NULL CHECK (typeof(updated_at) = 'integer' AND updated_at > 0),
  deleted_at           INTEGER CHECK (deleted_at IS NULL OR typeof(deleted_at) = 'integer'),
  version              INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  device_id            TEXT,
  PRIMARY KEY (user_id, id)
);
-- At most one open (not archived, not deleted) mistake per exercise: two devices cannot create two.
CREATE UNIQUE INDEX ux_mistakes_open_per_exercise
  ON mistakes (user_id, exercise_id) WHERE status <> 'archived' AND deleted_at IS NULL;
CREATE INDEX ix_mistakes_user_due ON mistakes (user_id, status, next_review_at);

-- ── Vocabulary ───────────────────────────────────────────────────────────────────────

CREATE TABLE vocabulary_words (
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id              TEXT NOT NULL CHECK (length(id) BETWEEN 1 AND 64),   -- "v-001" for built-in words, uuid for the learner's own
  word            TEXT NOT NULL CHECK (length(word) BETWEEN 1 AND 100),
  translation_ru  TEXT NOT NULL CHECK (length(translation_ru) BETWEEN 1 AND 300),
  example_en      TEXT NOT NULL DEFAULT '' CHECK (length(example_en) <= 500),
  note            TEXT CHECK (note IS NULL OR length(note) <= 1000),
  topic_id        TEXT NOT NULL DEFAULT 'sentence_structure',          -- required by the old data model, not used for vocabulary
  theme           TEXT CHECK (theme IS NULL OR theme IN
                    ('academic', 'education', 'work', 'technology', 'environment', 'health', 'society', 'culture', 'travel', 'other')),
  difficulty      TEXT NOT NULL DEFAULT 'B1' CHECK (difficulty IN ('A2', 'B1', 'B1+', 'B2', 'IELTS')),
  stage           INTEGER NOT NULL DEFAULT 0 CHECK (stage BETWEEN 0 AND 5),
  review_status   TEXT NOT NULL DEFAULT 'new' CHECK (review_status IN ('new', 'learning', 'review', 'mastered')),
  correct_count   INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  incorrect_count INTEGER NOT NULL DEFAULT 0 CHECK (incorrect_count >= 0),
  next_review_at  INTEGER NOT NULL CHECK (typeof(next_review_at) = 'integer' AND next_review_at >= 0),
  created_at      INTEGER NOT NULL CHECK (typeof(created_at) = 'integer' AND created_at > 0),
  updated_at      INTEGER NOT NULL CHECK (typeof(updated_at) = 'integer' AND updated_at > 0),
  deleted_at      INTEGER CHECK (deleted_at IS NULL OR typeof(deleted_at) = 'integer'),
  version         INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  device_id       TEXT,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX ix_vocabulary_user_due   ON vocabulary_words (user_id, next_review_at);
CREATE INDEX ix_vocabulary_user_theme ON vocabulary_words (user_id, theme);

-- ── Study sessions (one row per finished lesson or exercise block; days are summed on read) ──

CREATE TABLE study_sessions (
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id                  TEXT NOT NULL CHECK (length(id) BETWEEN 1 AND 64),   -- "legacy-day-YYYY-MM-DD" for days imported from the old app
  local_date          TEXT NOT NULL CHECK (local_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),  -- the learner's calendar day
  kind                TEXT NOT NULL CHECK (kind IN
                        ('daily_lesson', 'reading', 'listening', 'writing', 'speaking', 'mock_exam', 'vocabulary', 'diagnostic', 'legacy_day')),
  started_at          INTEGER NOT NULL CHECK (typeof(started_at) = 'integer' AND started_at >= 0),
  completed_at        INTEGER NOT NULL CHECK (typeof(completed_at) = 'integer' AND completed_at >= 0),
  exercises_completed INTEGER NOT NULL DEFAULT 0 CHECK (exercises_completed >= 0),
  correct_count       INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  time_spent_ms       INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_ms >= 0),
  created_at          INTEGER NOT NULL CHECK (typeof(created_at) = 'integer' AND created_at > 0),
  device_id           TEXT,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX ix_sessions_user_date ON study_sessions (user_id, local_date);

-- ── Diagnostic results ───────────────────────────────────────────────────────────────

CREATE TABLE diagnostic_results (
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id              TEXT NOT NULL CHECK (length(id) BETWEEN 1 AND 64),
  taken_at        INTEGER NOT NULL CHECK (typeof(taken_at) = 'integer' AND taken_at > 0),
  total_questions INTEGER NOT NULL CHECK (total_questions >= 0),
  correct_count   INTEGER NOT NULL CHECK (correct_count >= 0),
  per_topic       TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(per_topic)),   -- { topicId: { correct, total } }
  estimated_level TEXT CHECK (estimated_level IS NULL OR estimated_level IN
                    ('not_assessed', 'A2', 'B1', 'B1+', 'B2', 'IELTS_5.5', 'IELTS_6.0', 'IELTS_6.5')),
  level_score     REAL,
  created_at      INTEGER NOT NULL CHECK (typeof(created_at) = 'integer' AND created_at > 0),
  device_id       TEXT,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX ix_diagnostic_user_time ON diagnostic_results (user_id, taken_at);

-- ── Unfinished daily lesson (one row per day) ─────────────────────────────────────────

CREATE TABLE lesson_states (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  local_date    TEXT NOT NULL CHECK (local_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  exercise_ids  TEXT NOT NULL CHECK (json_valid(exercise_ids)),
  current_index INTEGER NOT NULL DEFAULT 0 CHECK (current_index >= 0),
  answers       TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(answers)),
  started_at    INTEGER NOT NULL CHECK (typeof(started_at) = 'integer' AND started_at >= 0),
  completed_at  INTEGER CHECK (completed_at IS NULL OR typeof(completed_at) = 'integer'),
  updated_at    INTEGER NOT NULL CHECK (typeof(updated_at) = 'integer' AND updated_at > 0),
  version       INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  device_id     TEXT,
  PRIMARY KEY (user_id, local_date)
);

-- ── Reading / Listening / Writing / Speaking / Mock exam results (new in the cloud version) ──

CREATE TABLE mock_exams (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id            TEXT NOT NULL CHECK (length(id) BETWEEN 1 AND 64),
  taken_at      INTEGER NOT NULL CHECK (typeof(taken_at) = 'integer' AND taken_at > 0),
  time_spent_ms INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_ms BETWEEN 0 AND 86400000),
  total_score   INTEGER,
  total_max     INTEGER,
  sections      TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(sections)),   -- [{ section, score, total, details }]
  created_at    INTEGER NOT NULL CHECK (typeof(created_at) = 'integer' AND created_at > 0),
  device_id     TEXT,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX ix_mock_user_time ON mock_exams (user_id, taken_at);

CREATE TABLE section_results (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id            TEXT NOT NULL CHECK (length(id) BETWEEN 1 AND 64),
  section       TEXT NOT NULL CHECK (section IN ('reading', 'listening', 'writing', 'speaking')),
  content_id    TEXT NOT NULL CHECK (length(content_id) BETWEEN 1 AND 64),   -- passage, track, task or prompt id
  mock_exam_id  TEXT,                                                        -- set when the result is part of a mock exam
  score         INTEGER,                                                     -- reading/listening: correct answers; writing/speaking: self-check points
  max_score     INTEGER,
  started_at    INTEGER CHECK (started_at IS NULL OR typeof(started_at) = 'integer'),
  completed_at  INTEGER NOT NULL CHECK (typeof(completed_at) = 'integer' AND completed_at > 0),
  time_spent_ms INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_ms BETWEEN 0 AND 86400000),
  word_count    INTEGER CHECK (word_count IS NULL OR word_count >= 0),
  text_answer   TEXT CHECK (text_answer IS NULL OR length(text_answer) <= 30000),   -- the essay or letter (writing only)
  details       TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(details)),             -- answers per question, checklist, flags; never audio
  created_at    INTEGER NOT NULL CHECK (typeof(created_at) = 'integer' AND created_at > 0),
  updated_at    INTEGER NOT NULL CHECK (typeof(updated_at) = 'integer' AND updated_at > 0),
  version       INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  device_id     TEXT,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, mock_exam_id) REFERENCES mock_exams (user_id, id)
);
CREATE INDEX ix_section_user_kind ON section_results (user_id, section, completed_at);
CREATE INDEX ix_section_user_content ON section_results (user_id, content_id);

-- ── Synchronisation ──────────────────────────────────────────────────────────────────

-- Every applied change adds one row. A device remembers the last seq it has read and asks for newer ones.
CREATE TABLE sync_log (
  seq       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity    TEXT NOT NULL CHECK (entity IN
              ('settings', 'attempt', 'mistake', 'vocabulary', 'session', 'diagnostic', 'lesson_state', 'section_result', 'mock_exam')),
  entity_id TEXT NOT NULL,
  op        TEXT NOT NULL CHECK (op IN ('upsert', 'delete')),
  at        INTEGER NOT NULL CHECK (typeof(at) = 'integer' AND at > 0),
  device_id TEXT
);
CREATE INDEX ix_sync_log_user_seq ON sync_log (user_id, seq);

-- A change that lost against a newer version is not thrown away silently: it is kept here.
CREATE TABLE sync_conflicts (
  id                TEXT PRIMARY KEY CHECK (length(id) BETWEEN 8 AND 64),
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity            TEXT NOT NULL,
  entity_id         TEXT NOT NULL,
  detected_at       INTEGER NOT NULL CHECK (typeof(detected_at) = 'integer' AND detected_at > 0),
  losing_side       TEXT NOT NULL CHECK (losing_side IN ('incoming', 'existing')),
  losing_payload    TEXT NOT NULL CHECK (json_valid(losing_payload)),
  losing_updated_at INTEGER,
  winning_updated_at INTEGER,
  device_id         TEXT,
  resolved_at       INTEGER
);
CREATE INDEX ix_sync_conflicts_user ON sync_conflicts (user_id, resolved_at);

-- Result of the one-time transfer of the old browser data (see docs/MIGRATION.md).
CREATE TABLE import_runs (
  id              TEXT PRIMARY KEY CHECK (length(id) BETWEEN 8 AND 64),
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id       TEXT,
  fingerprint     TEXT NOT NULL CHECK (length(fingerprint) BETWEEN 8 AND 128),   -- hash of the exported data set
  started_at      INTEGER NOT NULL CHECK (typeof(started_at) = 'integer' AND started_at > 0),
  finished_at     INTEGER,
  status          TEXT NOT NULL CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  backup_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (backup_confirmed IN (0, 1)),
  source_counts   TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(source_counts)),     -- rows found in the browser, per store
  imported_counts TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(imported_counts)),   -- rows now in D1, per table
  skipped         TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(skipped)),           -- [{ store, id, reason }]
  error           TEXT CHECK (error IS NULL OR length(error) <= 2000)
);
CREATE INDEX ix_import_runs_user ON import_runs (user_id, started_at);
CREATE UNIQUE INDEX ux_import_done_per_data_set ON import_runs (user_id, fingerprint) WHERE status = 'completed';
