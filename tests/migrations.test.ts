import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

// Node's built-in SQLite (Node 22.13 or newer); the tests are skipped on older versions.
const sqlite = await import('node:sqlite').catch(() => null);
const skip = sqlite ? false : 'node:sqlite is not available in this Node version';

const dir = new URL('../migrations/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
const NOW = 1_800_000_000_000;

type Db = InstanceType<NonNullable<typeof sqlite>['DatabaseSync']>;

/** A new empty database with every migration applied; foreign keys are on, as in D1. */
function freshDb(): Db {
  const db = new sqlite!.DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const file of files) db.exec(readFileSync(new URL(file, dir), 'utf8'));
  return db;
}

function user(db: Db, id: string, email = `${id}@example.com`) {
  db.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)').run(id, email, NOW);
}

function names(db: Db, type: 'table' | 'index'): string[] {
  return (db.prepare("SELECT name FROM sqlite_master WHERE type = ? AND name NOT LIKE 'sqlite_%' ORDER BY name").all(type) as { name: string }[]).map((r) => r.name);
}

function fails(run: () => unknown, pattern: RegExp) {
  assert.throws(run, pattern);
}

const attemptSql =
  'INSERT INTO attempts (user_id, id, exercise_id, topic_id, type, correct, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

test('migration files are numbered 0001, 0002, ... without gaps and are plain SQL for D1', { skip }, () => {
  assert.ok(files.length >= 1);
  files.forEach((file, i) => {
    assert.match(file, new RegExp(`^${String(i + 1).padStart(4, '0')}_[a-z0-9_]+\\.sql$`), file);
    const sql = readFileSync(new URL(file, dir), 'utf8');
    assert.ok(!/^\s*(BEGIN|COMMIT|ROLLBACK)\b/im.test(sql), `${file}: transactions are managed by Cloudflare`);
    assert.ok(!/^\s*PRAGMA\b/im.test(sql), `${file}: PRAGMA is not allowed in migrations`);
    assert.ok(!/\bSTRICT\b/.test(sql), `${file}: STRICT tables are not used`);
  });
});

test('all migrations apply to an empty database and create the planned tables', { skip }, () => {
  const db = freshDb();
  assert.deepEqual(names(db, 'table'), [
    'attempts', 'devices', 'diagnostic_results', 'import_runs', 'lesson_states', 'mistakes', 'mock_exams',
    'section_results', 'study_sessions', 'sync_conflicts', 'sync_log', 'user_settings', 'users', 'vocabulary_words',
  ]);
  assert.equal((db.prepare('PRAGMA integrity_check').get() as { integrity_check: string }).integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('every table with learner data belongs to a user and is protected by a foreign key', { skip }, () => {
  const db = freshDb();
  for (const table of names(db, 'table')) {
    if (table === 'users') continue;
    const columns = (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
    assert.ok(columns.includes('user_id'), `${table} has no user_id`);
    const keys = db.prepare(`PRAGMA foreign_key_list(${table})`).all() as { table: string; from: string; on_delete: string }[];
    assert.ok(keys.some((k) => k.table === 'users' && k.from === 'user_id' && k.on_delete === 'CASCADE'), `${table}: user_id must reference users`);
  }
});

test('records of the learner are keyed by user and id together, so ids never clash between users', { skip }, () => {
  const db = freshDb();
  for (const table of [
    'devices', 'attempts', 'mistakes', 'vocabulary_words', 'study_sessions', 'diagnostic_results',
    'lesson_states', 'mock_exams', 'section_results', 'user_settings',
  ]) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string; pk: number }[];
    const key = columns.filter((c) => c.pk > 0).map((c) => c.name);
    assert.ok(key.includes('user_id'), `${table}: the primary key (${key.join(', ')}) must contain user_id`);
  }
});

test('the indexes needed for reading history, due reviews and sync exist', { skip }, () => {
  const indexes = names(freshDb(), 'index');
  for (const name of [
    'ix_attempts_user_time', 'ix_attempts_user_exercise', 'ix_attempts_user_topic', 'ix_mistakes_user_due',
    'ux_mistakes_open_per_exercise', 'ix_vocabulary_user_due', 'ix_sessions_user_date', 'ix_diagnostic_user_time',
    'ix_section_user_kind', 'ix_mock_user_time', 'ix_sync_log_user_seq', 'ux_import_done_per_data_set',
  ]) {
    assert.ok(indexes.includes(name), `missing index ${name}`);
  }
});

test('a record cannot belong to a user who does not exist', { skip }, () => {
  const db = freshDb();
  fails(() => db.prepare(attemptSql).run('nobody', 'a1', 'psc-001', 'present_simple_vs_continuous', 'multiple_choice', 1, 'grammar_lab', NOW, NOW), /FOREIGN KEY/);
});

test('two users can have the same record id, and never see each other\'s rows', { skip }, () => {
  const db = freshDb();
  user(db, 'user-aaaaaaaa');
  user(db, 'user-bbbbbbbb');
  const insert = db.prepare(attemptSql);
  insert.run('user-aaaaaaaa', 'att-1', 'psc-001', 'present_simple_vs_continuous', 'multiple_choice', 1, 'grammar_lab', NOW, NOW);
  insert.run('user-bbbbbbbb', 'att-1', 'psc-002', 'present_simple_vs_continuous', 'fill_blank', 0, 'daily_lesson', NOW, NOW);
  const mine = db.prepare('SELECT exercise_id FROM attempts WHERE user_id = ? AND id = ?').all('user-aaaaaaaa', 'att-1');
  assert.deepEqual(mine.map((row) => ({ ...row })), [{ exercise_id: 'psc-001' }]);
  fails(() => insert.run('user-aaaaaaaa', 'att-1', 'psc-003', 'present_simple_vs_continuous', 'fill_blank', 1, 'grammar_lab', NOW, NOW), /UNIQUE|PRIMARY/);
});

test('deleting a user removes all of their data', { skip }, () => {
  const db = freshDb();
  user(db, 'user-aaaaaaaa');
  db.prepare(attemptSql).run('user-aaaaaaaa', 'att-1', 'psc-001', 'present_simple_vs_continuous', 'multiple_choice', 1, 'grammar_lab', NOW, NOW);
  db.prepare("INSERT INTO sync_log (user_id, entity, entity_id, op, at) VALUES ('user-aaaaaaaa', 'attempt', 'att-1', 'upsert', ?)").run(NOW);
  db.prepare("DELETE FROM users WHERE id = 'user-aaaaaaaa'").run();
  assert.equal((db.prepare('SELECT count(*) AS n FROM attempts').get() as { n: number }).n, 0);
  assert.equal((db.prepare('SELECT count(*) AS n FROM sync_log').get() as { n: number }).n, 0);
});

test('wrong values are rejected by the database itself', { skip }, () => {
  const db = freshDb();
  user(db, 'user-aaaaaaaa');
  const insert = db.prepare(attemptSql);
  fails(() => insert.run('user-aaaaaaaa', 'a1', 'x', 't', 'multiple_choice', 1, 'hacker', NOW, NOW), /CHECK/); // unknown source
  fails(() => insert.run('user-aaaaaaaa', 'a2', 'x', 't', 'multiple_choice', 2, 'grammar_lab', NOW, NOW), /CHECK/); // not 0 or 1
  fails(() => insert.run('user-aaaaaaaa', 'a3', 'x', 't', 'essay', 1, 'grammar_lab', NOW, NOW), /CHECK/); // unknown type
  fails(() => insert.run('user-aaaaaaaa', 'a4', 'x', 't', 'multiple_choice', 1, 'grammar_lab', 'yesterday', NOW), /CHECK/); // time must be a number
  fails(() => db.prepare("INSERT INTO users (id, email, created_at) VALUES ('user-cccccccc', 'Big@Example.com', ?)").run(NOW), /CHECK/); // e-mail must be lower case
  fails(() => db.prepare("INSERT INTO study_sessions (user_id, id, local_date, kind, started_at, completed_at, created_at) VALUES ('user-aaaaaaaa', 's1', '05.11.2026', 'daily_lesson', 0, 0, ?)").run(NOW), /CHECK/); // date format
  fails(() => db.prepare("INSERT INTO diagnostic_results (user_id, id, taken_at, total_questions, correct_count, per_topic, created_at) VALUES ('user-aaaaaaaa', 'd1', ?, 24, 10, 'not json', ?)").run(NOW, NOW), /CHECK/); // json
  fails(() => db.prepare("INSERT INTO attempts (user_id, id, exercise_id, topic_id, type, correct, time_spent_ms, source, created_at, updated_at) VALUES ('user-aaaaaaaa', 'a5', 'x', 't', 'fill_blank', 1, 99999999999, 'grammar_lab', ?, ?)").run(NOW, NOW), /CHECK/); // more than a day
});

const mistakeSql =
  "INSERT INTO mistakes (user_id, id, exercise_id, topic_id, category, status, next_review_at, created_at, updated_at, deleted_at) VALUES ('user-aaaaaaaa', ?, ?, 'articles', 'articles', ?, ?, ?, ?, ?)";

test('only one open mistake per exercise; archived or deleted ones do not count', { skip }, () => {
  const db = freshDb();
  user(db, 'user-aaaaaaaa');
  const add = db.prepare(mistakeSql);
  add.run('m1', 'art-001', 'active', NOW, NOW, NOW, null);
  fails(() => add.run('m2', 'art-001', 'active', NOW, NOW, NOW, null), /UNIQUE/); // a second open one
  fails(() => add.run('m3', 'art-001', 'understood', NOW, NOW, NOW, null), /UNIQUE/); // closed but not archived is still open
  add.run('m4', 'art-001', 'archived', NOW, NOW, NOW, null); // archived: fine
  add.run('m5', 'art-001', 'active', NOW, NOW, NOW, NOW); // deleted: fine
  add.run('m6', 'art-002', 'active', NOW, NOW, NOW, null); // another exercise: fine
});

test('the same change sent twice is applied once (last write wins, newer beats older)', { skip }, () => {
  const db = freshDb();
  user(db, 'user-aaaaaaaa');
  db.prepare(mistakeSql).run('m1', 'art-001', 'active', NOW, NOW, NOW, null);

  // the statement the API will use for an update coming from a device
  const upsert = db.prepare(`
    INSERT INTO mistakes (user_id, id, exercise_id, topic_id, category, status, next_review_at, created_at, updated_at)
    VALUES ('user-aaaaaaaa', ?1, 'art-001', 'articles', 'articles', ?2, ?3, ?4, ?5)
    ON CONFLICT (user_id, id) DO UPDATE SET
      status = excluded.status, next_review_at = excluded.next_review_at,
      updated_at = excluded.updated_at, version = mistakes.version + 1
    WHERE excluded.updated_at > mistakes.updated_at`);

  assert.equal(upsert.run('m1', 'understood', NOW + 5, NOW, NOW + 100).changes, 1); // newer: applied
  assert.equal(upsert.run('m1', 'understood', NOW + 5, NOW, NOW + 100).changes, 0); // the same message again: nothing happens
  assert.equal(upsert.run('m1', 'active', NOW, NOW, NOW + 50).changes, 0); // older message arriving late: ignored
  const row = db.prepare("SELECT status, version FROM mistakes WHERE id = 'm1'").get() as { status: string; version: number };
  assert.deepEqual({ ...row }, { status: 'understood', version: 2 });

  // adding a new record twice (an answer, a session) does not make a duplicate
  const add = db.prepare(`${attemptSql} ON CONFLICT (user_id, id) DO NOTHING`);
  const args = ['user-aaaaaaaa', 'att-9', 'psc-001', 'present_simple_vs_continuous', 'multiple_choice', 1, 'grammar_lab', NOW, NOW] as const;
  assert.equal(add.run(...args).changes, 1);
  assert.equal(add.run(...args).changes, 0);
  assert.equal((db.prepare('SELECT count(*) AS n FROM attempts').get() as { n: number }).n, 1);
});

test('sync log: numbers only grow, and each user reads only their own changes', { skip }, () => {
  const db = freshDb();
  user(db, 'user-aaaaaaaa');
  user(db, 'user-bbbbbbbb');
  const log = db.prepare('INSERT INTO sync_log (user_id, entity, entity_id, op, at) VALUES (?, ?, ?, ?, ?)');
  log.run('user-aaaaaaaa', 'attempt', 'a1', 'upsert', NOW);
  log.run('user-bbbbbbbb', 'mistake', 'm1', 'upsert', NOW);
  log.run('user-aaaaaaaa', 'vocabulary', 'v1', 'delete', NOW);
  const read = db.prepare('SELECT seq, entity FROM sync_log WHERE user_id = ? AND seq > ? ORDER BY seq LIMIT 100');
  const all = read.all('user-aaaaaaaa', 0) as { seq: number; entity: string }[];
  assert.deepEqual(all.map((r) => r.entity), ['attempt', 'vocabulary']);
  assert.ok(all[0].seq < all[1].seq);
  assert.deepEqual(read.all('user-aaaaaaaa', all[1].seq), []); // nothing new after the last one
  fails(() => log.run('user-aaaaaaaa', 'secrets', 'x', 'upsert', NOW), /CHECK/);
});

test('section results can belong to a mock exam, which must exist', { skip }, () => {
  const db = freshDb();
  user(db, 'user-aaaaaaaa');
  const add = db.prepare(
    "INSERT INTO section_results (user_id, id, section, content_id, mock_exam_id, score, max_score, completed_at, created_at, updated_at) VALUES ('user-aaaaaaaa', ?, ?, ?, ?, 3, 5, ?, ?, ?)",
  );
  add.run('r1', 'reading', 'rd-001', null, NOW, NOW, NOW); // stand-alone result
  fails(() => add.run('r2', 'reading', 'rd-001', 'no-such-exam', NOW, NOW, NOW), /FOREIGN KEY/);
  db.prepare("INSERT INTO mock_exams (user_id, id, taken_at, created_at) VALUES ('user-aaaaaaaa', 'mock-1', ?, ?)").run(NOW, NOW);
  add.run('r3', 'listening', 'ls-001', 'mock-1', NOW, NOW, NOW);
  fails(() => add.run('r4', 'cooking', 'x', null, NOW, NOW, NOW), /CHECK/); // unknown section
});

test('an essay and its details are stored whole', { skip }, () => {
  const db = freshDb();
  user(db, 'user-aaaaaaaa');
  const essay = 'Some people think that ... '.repeat(300);
  const details = JSON.stringify({ checklist: ['wc1', 'wc2'], selfScore: 4 });
  db.prepare(
    "INSERT INTO section_results (user_id, id, section, content_id, completed_at, word_count, text_answer, details, created_at, updated_at) VALUES ('user-aaaaaaaa', 'w1', 'writing', 'wt-002', ?, 1500, ?, ?, ?, ?)",
  ).run(NOW, essay, details, NOW, NOW);
  const row = db.prepare("SELECT text_answer, details FROM section_results WHERE id = 'w1'").get() as { text_answer: string; details: string };
  assert.equal(row.text_answer, essay);
  assert.deepEqual(JSON.parse(row.details), { checklist: ['wc1', 'wc2'], selfScore: 4 });
  fails(() => db.prepare("UPDATE section_results SET text_answer = ? WHERE id = 'w1'").run('x'.repeat(30001)), /CHECK/);
});

test('the same data set can be recorded as imported only once', { skip }, () => {
  const db = freshDb();
  user(db, 'user-aaaaaaaa');
  const run = db.prepare("INSERT INTO import_runs (id, user_id, fingerprint, started_at, status) VALUES (?, 'user-aaaaaaaa', ?, ?, ?)");
  run.run('run-0001-a', 'fingerprint-1', NOW, 'failed');
  run.run('run-0002-a', 'fingerprint-1', NOW, 'running'); // an interrupted run can be repeated
  run.run('run-0003-a', 'fingerprint-1', NOW, 'completed');
  fails(() => run.run('run-0004-a', 'fingerprint-1', NOW, 'completed'), /UNIQUE/);
  run.run('run-0005-a', 'fingerprint-2', NOW, 'completed'); // different data: allowed
});

test('settings: one row per user with a valid theme and language', { skip }, () => {
  const db = freshDb();
  user(db, 'user-aaaaaaaa');
  db.prepare("INSERT INTO user_settings (user_id, updated_at) VALUES ('user-aaaaaaaa', ?)").run(NOW);
  const row = db.prepare("SELECT theme, interface_language, daily_goal_minutes, target_ielts_score, current_level FROM user_settings").get();
  assert.deepEqual({ ...row }, { theme: 'system', interface_language: 'ru', daily_goal_minutes: 20, target_ielts_score: 6, current_level: 'not_assessed' });
  fails(() => db.prepare("INSERT INTO user_settings (user_id, updated_at) VALUES ('user-aaaaaaaa', ?)").run(NOW), /UNIQUE|PRIMARY/);
  fails(() => db.prepare("UPDATE user_settings SET theme = 'pink'").run(), /CHECK/);
  fails(() => db.prepare("UPDATE user_settings SET target_ielts_score = 12").run(), /CHECK/);
});
