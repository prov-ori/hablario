import { readProgress,               } from './engine.js?v=87b047bcd3c7';

const config = (window                                                                                          ).HABLARIO_CONFIG;
export const configured = Boolean(config?.supabaseUrl && config.supabasePublishableKey);

                                                                              
export let session                 = null;

const sdkUrl = 'https://esm.sh/@supabase/supabase-js@2.57.4';
const client = configured ? import(sdkUrl).then(({ createClient }) =>
  createClient(config .supabaseUrl, config .supabasePublishableKey)
).catch(() => null) : Promise.resolve(null);

export async function watchAccount(change                                   ) {
  const sdk = await client;
  sdk?.auth.onAuthStateChange((_event        , next                ) => {
    session = next;
    setTimeout(() => { if (session === next) change(next); }, 0);
  });
}

export async function authenticate(action        , email        , password        ) {
  const sdk = await client;
  if (!sdk) throw new Error('Не удалось подключиться к Supabase.');
  const emailRedirectTo = location.origin + location.pathname;
  const result = action === 'signup'
    ? await sdk.auth.signUp({ email, password, options: { emailRedirectTo } })
    : await sdk.auth.signInWithPassword({ email, password });
  if (result.error) throw new Error('Проверьте email, пароль и подтверждение почты.');
  return result.data.session ? 'Вы вошли в аккаунт.' : 'Откройте письмо и подтвердите адрес.';
}

export async function signOut() {
  const sdk = await client;
  const result = await sdk?.auth.signOut({ scope: 'local' });
  if (result?.error) throw result.error;
}

export function mergeProgress(local          , remote          )           {
  const attempts = { ...remote.attempts };
  for (const [id, items] of Object.entries(local.attempts)) {
    attempts[id] = [...new Map([...(attempts[id] ?? []), ...items].map(item => [item.id, item])).values()]
      .sort((a, b) => a.at.localeCompare(b.at));
  }
  const drafts = { ...remote.drafts };
  for (const [id, draft] of Object.entries(local.drafts)) {
    if (!drafts[id] || draft.marks.length >= drafts[id].marks.length) drafts[id] = draft;
  }
  for (const [id, draft] of Object.entries(drafts)) {
    if (attempts[id]?.some(item => item.id === draft.id)) delete drafts[id];
  }
  const review = { ...remote.review };
  for (const [id, item] of Object.entries(local.review)) {
    const other = review[id];
    if (!other || item.history.length > other.history.length ||
      (item.history.length === other.history.length && item.due > other.due)) review[id] = item;
  }
  return { version: 1, attempts, drafts, review, current: local.current ?? remote.current };
}

export async function syncProgress(account         , local          )                    {
  const sdk = await client;
  if (!sdk || session?.user.id !== account.user.id) return local;
  const id = account.user.id;
  for (let retry = 0; retry < 4; retry++) {
    if (session?.user.id !== id) return local;
    const { data, error } = await sdk.from('learning_progress').select('snapshot,revision').eq('user_id', id).maybeSingle();
    if (error) throw error;
    if (session?.user.id !== id) return local;
    const merged = mergeProgress(local, readProgress(JSON.stringify(data?.snapshot ?? null)));
    if (!data) {
      const inserted = await sdk.from('learning_progress').insert({ user_id: id, snapshot: merged });
      if (!inserted.error) return merged;
      if (inserted.error.code !== '23505') throw inserted.error;
    } else {
      const updated = await sdk.from('learning_progress').update({ snapshot: merged, revision: data.revision + 1 })
        .eq('user_id', id).eq('revision', data.revision).select('revision').maybeSingle();
      if (updated.error) throw updated.error;
      if (updated.data) return merged;
    }
  }
  throw new Error('Прогресс изменился на другом устройстве.');
}

                                                                                                                                      
export async function assess(exerciseId        , answer        , audio       )                      {
  if (!session || !config) throw new Error('Войдите в аккаунт для проверки открытых ответов.');
  const body = new FormData();
  body.set('exerciseId', exerciseId);
  if (audio) body.set('audio', audio, 'answer.wav');
  else body.set('answer', answer);
  const response = await fetch(config.supabaseUrl.replace(/\/$/, '') + '/functions/v1/assess', {
    method: 'POST', body, headers: {
      apikey: config.supabasePublishableKey, Authorization: 'Bearer ' + session.access_token,
    }, signal: AbortSignal.timeout(40000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Проверка временно недоступна.');
  return result;
}
