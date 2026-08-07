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
        /if not exists/i,
        `not safe to re-run: ${statement.split('\n').filter((l) => !l.startsWith('--'))[0]}`,
      );
    }
  });

  test('carries the columns the app writes', () => {
    for (const column of [
      'sender_location',
      'sender_timezone',
      'opened_at',
      'opened_location',
      'opened_timezone',
    ]) {
      assert.ok(schema.includes(column), `schema is missing ${column}`);
    }
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
