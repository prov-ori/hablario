import { units, practiceUnits, grammarUnits, cards,                                                 } from './course.js?v=1cddd9d95782';
                                       
                    
                                                                                                        
                                   
  
                                                                
                                                  
                                               
                                                                                                
                        
                                                              
                                                                      
  
export function blank()           {
  return { version: 1, drafts: {}, attempts: {}, review: {} };
}
export function readProgress(raw               )           {
  try {
    const state = JSON.parse(raw ?? 'null');
    if (state?.version === 1 && state.drafts && state.attempts && state.review) return state;
  } catch { /* invalid snapshot */ }
  return blank();
}
export function normalize(value        , { strict = false, optionalAccents = false } = {})         {
  let result = value.normalize('NFC').trim().toLocaleLowerCase('es-MX').replace(/\s+/gu, ' ');
  if (!strict) result = result.replace(/[¿?¡!.,;:…]/gu, '').trim();
  if (optionalAccents) result = result.replace(/[áéíóú]/gu, char => char.normalize('NFD')[0]);
  return result;
}
export function evaluate(exercise          , answer        , mode                         )       {
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
export function localDate(date = new Date())         {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(n => String(n).padStart(2, '0')).join('-');
}
export function reviewCard(previous        , rating        , now = new Date())         {
  const days = rating === 'again' ? 1 : rating === 'hard' ? Math.max(1, previous.days) : Math.max(2, previous.days * 2);
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return { due: localDate(next), days, history: [...previous.history, { date: localDate(now), rating }] };
}
export function dueCards(state          , now = new Date())         {
  const today = localDate(now);
  return cards.filter(card => state.review[card.id]?.due <= today)
    .sort((a, b) => state.review[a.id].due.localeCompare(state.review[b.id].due));
}
export function start(state          , unit      , id        )           {
  if (state.drafts[unit.id]) return { ...state, current: unit.id };
  return { ...state, current: unit.id, drafts: { ...state.drafts, [unit.id]: { id, marks: [] } } };
}
export function advance(state          , unit      , attemptId        , mark      , now = new Date())           {
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
export function results(unit      , attempt         ) {
  const totals = Object.fromEntries((['reading','listening','writing','speaking']           ).map(skill => [
    skill, { earned: 0, possible: 0, skipped: 0, assisted: 0, self: false }
  ]))                                                                                                         ;
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
export function examPassed(unit      , attempt         )          {
  return Object.values(results(unit, attempt)).every(row =>
    row.possible > 0 && row.earned === row.possible && !row.skipped && !row.assisted);
}
export function completed(state          , unit      )          {
  const attempts = state.attempts[unit.id] ?? [];
  return attempts.length > 0;
}
export function available(state          , unit      )          {
  if (grammarUnits.includes(unit) || practiceUnits.includes(unit)) return true;
  const index = units.indexOf(unit);
  return index === 0 || (index > 0 && units.slice(0, index).every(previous => completed(state, previous)));
}
export function nextUnit(state          )                   {
  return [...units, ...practiceUnits, ...grammarUnits].find(unit => unit.id === state.current && state.drafts[unit.id] && available(state, unit))
    ?? units.find(unit => !completed(state, unit));
}
