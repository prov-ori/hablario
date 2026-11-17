import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cards, courseVersion, grammarUnits, levels, practiceUnits, units } from '../src/course.ts';
import { advance, available, blank, completed, dueCards, evaluate, examPassed, localDate, nextUnit, normalize, readProgress, results, reviewCard, start } from '../src/engine.ts';

function sample(exercise) {
  switch (exercise.kind) {
    case 'input': return exercise.answers[0];
    case 'match': return exercise.pairs.map(pair => pair[1]);
    case 'open': return exercise.criteria.map((_, index) => String(index));
    default: return exercise.answer;
  }
}

test('course content uses unique IDs and all four skills in every unit', () => {
  const all = [...units, ...practiceUnits, ...grammarUnits];
  const ids = all.flatMap(unit => [unit.id, ...unit.exercises.map(item => item.id), ...unit.cards.map(card => card.id)]);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(courseVersion, 1);
  assert.equal(cards.length, all.reduce((count, unit) => count + unit.cards.length, 0));
  for (const level of levels) {
    const members = units.filter(unit => unit.level === level.id);
    assert.ok(members.some(unit => !unit.exam));
    assert.equal(members.filter(unit => unit.exam).length, Number(level.id !== 'Pre-A1'));
  }
  for (const unit of all) {
    if (!grammarUnits.includes(unit)) assert.equal(new Set(unit.exercises.map(item => item.skill)).size, 4);
    for (const card of unit.cards) assert.equal(card.unitId, unit.id);
    for (const exercise of unit.exercises) {
      assert.equal(evaluate(exercise, sample(exercise)).earned, exercise.kind === 'open' ? exercise.criteria.length : 1);
      if (exercise.kind === 'choice') assert.ok(exercise.options.includes(exercise.answer));
      if (exercise.kind === 'order') assert.deepEqual([...exercise.tokens].sort(), exercise.answer.split(' ').sort());
    }
  }
});

test('short answers normalize case, punctuation, whitespace and canonical Unicode', () => {
  const accented = { kind: 'input', id: 'accent', skill: 'writing', prompt: '', feedback: '', answers: ['salón'] };
  assert.equal(evaluate(accented, '  ¡SALO\u0301N! ').earned, 1);
  assert.equal(evaluate(accented, 'salon').earned, 0);
  assert.equal(evaluate({ ...accented, optionalAccents: true }, 'salon').earned, 1);
  assert.equal(evaluate({ ...accented, strict: true }, 'salón!').earned, 0);
  assert.equal(normalize('AÑO', { optionalAccents: true }), 'año');
});

test('confirmed position restores and retries cannot apply a stale result twice', () => {
  const [unit, following] = units;
  const now = new Date(2026, 10, 17, 23, 30);
  let state = start(blank(), unit, 'attempt-one');
  assert.equal(available(state, following), false);
  const first = evaluate(unit.exercises[0], sample(unit.exercises[0]));
  state = advance(state, unit, 'attempt-one', first, now);
  state = readProgress(JSON.stringify(state));
  assert.equal(nextUnit(state)?.id, unit.id);
  assert.equal(state.drafts[unit.id].marks.length, 1);
  assert.equal(advance(state, unit, 'attempt-one', first, now), state);
  for (const exercise of unit.exercises.slice(1)) {
    state = advance(state, unit, 'attempt-one', evaluate(exercise, sample(exercise)), now);
  }
  assert.equal(available(state, following), true);
  const finish = evaluate(unit.exercises.at(-1), sample(unit.exercises.at(-1)));
  assert.equal(advance(state, unit, 'attempt-one', finish, now), state);
  assert.equal(dueCards(state, now).length, unit.cards.length);
  const firstCard = unit.cards[0].id;
  state.review[firstCard] = reviewCard(state.review[firstCard], 'good', now);
  const reviewed = state.review[firstCard];
  state = start(state, unit, 'attempt-two');
  for (const exercise of unit.exercises) {
    state = advance(state, unit, 'attempt-two', evaluate(exercise, sample(exercise)), now);
  }
  assert.equal(state.attempts[unit.id].length, 2);
  assert.equal(state.review[firstCard], reviewed);
});

test('review follows calendar days and handles the end of a year', () => {
  const now = new Date(2026, 11, 31, 23, 59);
  const current = { due: localDate(now), days: 0, history: [] };
  assert.equal(reviewCard(current, 'again', now).due, '2027-01-01');
  const good = reviewCard(current, 'good', now);
  assert.equal(good.due, '2027-01-02');
  assert.equal(reviewCard(good, 'good', new Date(2027, 0, 2)).days, 4);
  assert.equal(reviewCard(good, 'hard', new Date(2027, 0, 2)).days, 2);
});

test('assisted and skipped listening remain separate from checked results', () => {
  const unit = units.find(unit => unit.exam);
  const marks = unit.exercises.map(exercise => evaluate(exercise, sample(exercise)));
  const checked = { id: 'checked', at: '', marks };
  assert.equal(examPassed(unit, checked), true);
  const listening = unit.exercises.filter(ex => ex.skill === 'listening');
  const modified = marks.map(mark => mark.exerciseId === listening[0].id
    ? evaluate(listening[0], sample(listening[0]), 'assisted')
    : mark.exerciseId === listening[1].id ? evaluate(listening[1], '', 'skipped') : mark);
  const assisted = { ...checked, id: 'assisted', marks: modified };
  assert.equal(examPassed(unit, assisted), false);
  assert.deepEqual(results(unit, assisted).listening, { earned: 0, possible: 0, skipped: 1, assisted: 1, self: false });
  assert.equal(results(unit, assisted).writing.self, true);
});

test('the full published route unlocks through recorded assessments', () => {
  let state = blank();
  for (const unit of units) {
    assert.equal(nextUnit(state), unit);
    assert.equal(available(state, unit), true);
    const id = 'attempt-' + unit.id;
    state = start(state, unit, id);
    for (const exercise of unit.exercises) {
      state = advance(state, unit, id, evaluate(exercise, sample(exercise), exercise.skill === 'listening' ? 'skipped' : undefined));
    }
    assert.equal(completed(state, unit), true);
  }
  assert.equal(nextUnit(state), undefined);
  assert.equal(dueCards(state).length, units.reduce((count, unit) => count + unit.cards.length, 0));
});

test('missing, malformed and unknown progress versions fall back safely', () => {
  for (const snapshot of [null, '{', '{}', '{"version":2}', '{"version":1}']) {
    assert.deepEqual(readProgress(snapshot), blank());
  }
});

test('extra practice resumes, creates cards and leaves the core route accessible', () => {
  const unit = practiceUnits.find(item => item.level === 'B2');
  let state = blank();
  assert.equal(available(state, unit), true);
  state = start(state, unit, 'practice');
  state = readProgress(JSON.stringify(state));
  assert.equal(nextUnit(state), unit);
  for (const exercise of unit.exercises) {
    state = advance(state, unit, 'practice', evaluate(exercise, sample(exercise)));
  }
  assert.equal(completed(state, unit), true);
  assert.deepEqual(dueCards(state).map(card => card.id), unit.cards.map(card => card.id));
  assert.equal(nextUnit(state), units[0]);
});
