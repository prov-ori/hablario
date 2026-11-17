import { units, grammarUnits, cards, type Card, type Exercise, type Skill, type Unit } from './course.ts';
export type Answer = string | string[];
export type Mark = {
  exerciseId: string; answer: Answer; response?: string; mode: 'auto' | 'self' | 'assisted' | 'skipped';
  earned: number; possible: number;
};
export type Attempt = { id: string; at: string; marks: Mark[] };
export type Draft = { id: string; marks: Mark[] };
export type Rating = 'again' | 'hard' | 'good';
export type Review = { due: string; days: number; history: { date: string; rating: Rating }[] };
export type Progress = {
  version: 1; current?: string; drafts: Record<string, Draft>;
  attempts: Record<string, Attempt[]>; review: Record<string, Review>;
};
export function blank(): Progress {
  return { version: 1, drafts: {}, attempts: {}, review: {} };
}
export function readProgress(raw: string | null): Progress {
  try {
    const state = JSON.parse(raw ?? 'null');
    if (state?.version === 1 && state.drafts && state.attempts && state.review) return state;
  } catch { /* invalid snapshot */ }
  return blank();
}
export function normalize(value: string, { strict = false, optionalAccents = false } = {}): string {
  let result = value.normalize('NFC').trim().toLocaleLowerCase('es-MX').replace(/\s+/gu, ' ');
  if (!strict) result = result.replace(/[¿?¡!.,;:…]/gu, '').trim();
  if (optionalAccents) result = result.replace(/[áéíóú]/gu, char => char.normalize('NFD')[0]);
  return result;
}
export function evaluate(exercise: Exercise, answer: Answer, mode?: 'assisted' | 'skipped'): Mark {
  const base = { exerciseId: exercise.id, answer };
  if (mode === 'skipped') return { ...base, mode, earned: 0, possible: 0 };
  if (exercise.kind === 'open') {
    const selected = new Set(Array.isArray(answer) ? answer : []);
    return { ...base, mode: 'self', earned: exercise.criteria.filter((_, index) => selected.has(String(index))).length, possible: exercise.criteria.length };
  }
  let correct = false;
  if (exercise.kind === 'match') {
    correct = Array.isArray(answer) && exercise.pairs.every((pair, index) => answer[index] === pair[1]);
  } else if (exercise.kind === 'input') {
    correct = typeof answer === 'string' && exercise.answers.some(expected => normalize(expected, exercise) === normalize(answer, exercise));
  } else {
    correct = answer === exercise.answer;
  }
  return { ...base, mode: mode ?? 'auto', earned: Number(correct), possible: 1 };
}
export function localDate(date = new Date()): string {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(n => String(n).padStart(2, '0')).join('-');
}
export function reviewCard(previous: Review, rating: Rating, now = new Date()): Review {
  const days = rating === 'again' ? 1 : rating === 'hard' ? Math.max(1, previous.days) : Math.max(2, previous.days * 2);
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return { due: localDate(next), days, history: [...previous.history, { date: localDate(now), rating }] };
}
export function dueCards(state: Progress, now = new Date()): Card[] {
  const today = localDate(now);
  return cards.filter(card => state.review[card.id]?.due <= today)
    .sort((a, b) => state.review[a.id].due.localeCompare(state.review[b.id].due));
}
export function start(state: Progress, unit: Unit, id: string): Progress {
  if (state.drafts[unit.id]) return { ...state, current: unit.id };
  return { ...state, current: unit.id, drafts: { ...state.drafts, [unit.id]: { id, marks: [] } } };
}
export function advance(state: Progress, unit: Unit, attemptId: string, mark: Mark, now = new Date()): Progress {
  const draft = state.drafts[unit.id];
  if (!draft || draft.id !== attemptId || unit.exercises[draft.marks.length]?.id !== mark.exerciseId) return state;
  const marks = [...draft.marks, mark];
  if (marks.length < unit.exercises.length) {
    return { ...state, drafts: { ...state.drafts, [unit.id]: { ...draft, marks } } };
  }
  const drafts = { ...state.drafts };
  delete drafts[unit.id];
  const review = { ...state.review };
  for (const card of unit.cards) review[card.id] ??= { due: localDate(now), days: 0, history: [] };
  return {
    ...state, current: state.current === unit.id ? undefined : state.current, drafts, review,
    attempts: { ...state.attempts, [unit.id]: [...(state.attempts[unit.id] ?? []), { id: attemptId, at: now.toISOString(), marks }] }
  };
}
export function results(unit: Unit, attempt: Attempt) {
  const totals = Object.fromEntries((['reading','listening','writing','speaking'] as Skill[]).map(skill => [
    skill, { earned: 0, possible: 0, skipped: 0, assisted: 0, self: false }
  ])) as Record<Skill, { earned: number; possible: number; skipped: number; assisted: number; self: boolean }>;
  for (const mark of attempt.marks) {
    const exercise = unit.exercises.find(item => item.id === mark.exerciseId);
    if (!exercise) continue;
    const total = totals[exercise.skill];
    if (mark.mode === 'skipped') total.skipped++;
    if (mark.mode === 'assisted') total.assisted++;
    if (mark.mode === 'self') total.self = true;
    if (mark.mode === 'auto' || mark.mode === 'self') {
      total.earned += mark.earned;
      total.possible += mark.possible;
    }
  }
  return totals;
}
export function examPassed(unit: Unit, attempt: Attempt): boolean {
  return Object.values(results(unit, attempt)).every(row =>
    row.possible > 0 && row.earned === row.possible && !row.skipped && !row.assisted);
}
export function completed(state: Progress, unit: Unit): boolean {
  const attempts = state.attempts[unit.id] ?? [];
  return attempts.length > 0;
}
export function available(state: Progress, unit: Unit): boolean {
  if (grammarUnits.includes(unit)) return true;
  const index = units.indexOf(unit);
  return index === 0 || (index > 0 && units.slice(0, index).every(previous => completed(state, previous)));
}
export function nextUnit(state: Progress): Unit | undefined {
  return units.find(unit => unit.id === state.current && state.drafts[unit.id] && available(state, unit))
    ?? units.find(unit => !completed(state, unit));
}
