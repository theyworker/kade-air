import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { statements } from '../scripts/migrate';

const schema = readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');

describe('statements', () => {
  test('splits the schema into one statement per call', () => {
    const parsed = statements('create table a ();\nalter table a add column b text;\n');
    assert.equal(parsed.length, 2);
    assert.match(parsed[1], /^alter table a/);
  });

  test('drops a trailing comment, which is not a statement to run', () => {
    assert.deepEqual(statements('create table a ();\n-- and that is all\n'), ['create table a ()']);
  });

  test('keeps a comment written above the statement it explains', () => {
    const parsed = statements('-- why\ncreate table a ();');
    assert.equal(parsed.length, 1);
    assert.match(parsed[0], /-- why/);
  });

  test('drops an empty file rather than sending a blank query', () => {
    assert.deepEqual(statements('\n\n  \n'), []);
  });
});

describe('db/schema.sql', () => {
  test('every statement is idempotent, since the file is re-applied in full', () => {
    for (const statement of statements(schema)) {
      assert.match(
        statement,
        /if (not )?exists/i,
        `not safe to re-run: ${statement.split('\n').filter((l) => !l.startsWith('--'))[0]}`,
      );
    }
  });

  test('carries what the app writes', () => {
    for (const name of ['sender_location', 'sender_timezone', 'order_opens', 'opened_at']) {
      assert.ok(schema.includes(name), `schema is missing ${name}`);
    }
  });

  test('drops the single-open columns the log replaced', () => {
    for (const column of ['opened_at', 'opened_location', 'opened_timezone']) {
      assert.match(
        schema,
        new RegExp(`alter table orders drop column if exists ${column}`),
        `orders.${column} would survive as a second place an open could live`,
      );
    }
  });

  test('drops those columns after the log exists, not before', () => {
    const parsed = statements(schema);
    const created = parsed.findIndex((s) => /create table if not exists order_opens/.test(s));
    const dropped = parsed.findIndex((s) => /drop column if exists opened_at/.test(s));
    assert.ok(created >= 0 && dropped > created, 'the log must be in place before the drop');
  });

  test('has no semicolon inside a literal, which the naive split would break on', () => {
    // Comments come out first: prose is full of apostrophes, and none of them
    // opens a string literal as far as Postgres is concerned.
    const sql = schema.replace(/--[^\n]*/g, '');
    for (const literal of sql.match(/'[^']*'/g) ?? []) {
      assert.equal(literal.includes(';'), false, `literal ${literal} would split wrongly`);
    }
  });

  test('has no semicolon inside a comment either, which splits a statement in half', () => {
    for (const comment of schema.match(/--[^\n]*/g) ?? []) {
      assert.equal(comment.includes(';'), false, `comment ${comment} would split a statement`);
    }
  });
});
