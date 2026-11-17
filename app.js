import { cards, grammarUnits, practiceUnits, levels, skills, units,                          } from './course.js?v=1cddd9d95782';
import { assess, authenticate, configured, mergeProgress, session, signOut, syncProgress, watchAccount } from './account.js?v=1cddd9d95782';
import { toWav } from './recording.js?v=1cddd9d95782';
import {
  advance, available, blank, completed, dueCards, evaluate, examPassed, localDate, nextUnit,
  readProgress, results, reviewCard, start,                                                      
} from './engine.js?v=1cddd9d95782';

const key = 'hablario-progress';
let activeKey = key;
let syncStatus = '';
let syncQueue = Promise.resolve();
const main = document.querySelector             ('#main') ;
const saveStatus = document.querySelector             ('#save-status') ;
let persistent = true;
function read()           {
  try { return readProgress(localStorage.getItem(activeKey)); }
  catch { persistent = false; return blank(); }
}
let state = read();

function scheduleSync() {
  const account = session;
  const storageKey = activeKey;
  if (!account || storageKey !== key + ':' + account.user.id) return;
  syncQueue = syncQueue.then(async () => {
    if (storageKey !== activeKey) return;
    try {
      const merged = await syncProgress(account, state);
      if (storageKey !== activeKey) return;
      state = mergeProgress(state, merged);
      if (persistent) localStorage.setItem(storageKey, JSON.stringify(state));
      syncStatus = 'Прогресс синхронизирован.';
    } catch {
      syncStatus = 'Синхронизация недоступна. Повторите её в настройках.';
    }
    const status = document.querySelector('#account-sync');
    if (status) status.textContent = syncStatus;
    if (storageKey === activeKey && ['home', 'progress', 'course'].includes(route())) render();
  });
}

async function update(transform                                  )                {
  const destination = activeKey;
  const commit = () => {
    if (activeKey !== destination) return;
    const previous = persistent ? read() : state;
    state = transform(previous);
    try {
      if (persistent) localStorage.setItem(activeKey, JSON.stringify(state));
    } catch { persistent = false; }
    if (!persistent) saveStatus.textContent = 'Браузер не сохраняет прогресс. Он доступен до закрытия или перезагрузки страницы.';
  };
  if (navigator.locks) await navigator.locks.request(key, commit);
  else commit();
  scheduleSync();
}
function html(value         )         {
  return String(value ?? '').replace(/[&<>"']/g, character => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character] 
  ));
}
function route()         {
  const value = location.hash.slice(1);
  return value === 'main' ? previousRoute : value || 'home';
}
function go(path        ) {
  if (route() === path) render(true);
  else location.hash = path;
}
const btn = (text        , path        , variant = '') =>
  '<a class="btn ' + variant + '" href="#' + html(path) + '">' + html(text) + '</a>';
const action = (text        , id        , variant = 'alt') =>
  '<button type="button" class="btn ' + variant + '" id="' + id + '">' + html(text) + '</button>';
const spanish = (text        ) => '<span lang="es-MX">' + html(text) + '</span>';
const heading = (title        , detail = '') =>
  '<header class="pagehead"><h1>' + html(title) + '</h1>' + (detail ? '<p>' + html(detail) + '</p>' : '') + '</header>';
const show = (content        ) => {
  main.innerHTML = '<div class="topline"><span>Мой учебный маршрут</span><span class="flag">🇲🇽 &nbsp; Мексиканский испанский</span></div>' + content;
};
const progressAction = (unit      ) => state.drafts[unit.id] ? 'Продолжить урок' : state.attempts[unit.id] ? 'Повторить' : unit.exam ? 'Начать проверку' : 'Начать урок';
function playControl(id        , label = 'Слушать')         {
  return '<div class="row">' + action(label, id) + action('Пауза', id + '-pause') +
    '<span class="muted" id="' + id + '-status" role="status"></span></div>';
}
let playing                                                              ;
let media                              ;
const manifestPath = './audio-manifest.js?v=1cddd9d95782';
const audioManifest = import(manifestPath).then(module => new Set        (module.default)).catch(() => new Set        ());
function stopAudio() {
  media?.pause();
  media = undefined;
  playing = undefined;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
function bindAudio(id        , text        , track = id) {
  let started = false;
  const status = document.getElementById(id + '-status') ;
  const pause = document.getElementById(id + '-pause')                     ;
  pause.disabled = true;
  const play = document.getElementById(id) ;
  const filename = track + '.mp3';
  void audioManifest.then(recordings => {
    if (!recordings.has(filename) || !play.isConnected) return;
    const player = document.createElement('audio');
    player.controls = true;
    player.preload = 'none';
    player.src = './audio/' + filename;
    player.setAttribute('aria-label', 'Аудиозапись урока');
    player.addEventListener('play', () => {
      if (media !== player) {
        stopAudio();
        media = player;
      }
    });
    player.addEventListener('playing', () => { started = true; });
    player.addEventListener('error', () => {
      player.remove();
      play.hidden = false;
      pause.hidden = false;
      status.textContent = 'Файл недоступен. Используйте озвучку браузера.';
    });
    play.after(player);
    play.hidden = true;
    pause.hidden = true;
  });
  document.getElementById(id) .onclick = () => {
    if (!('speechSynthesis' in window)) {
      status.textContent = 'Озвучка недоступна в этом браузере.';
      return;
    }
    if (playing) {
      const other = document.getElementById(playing.id + '-pause')                            ;
      if (other) { other.disabled = true; other.textContent = 'Пауза'; }
    }
    stopAudio();
    pause.textContent = 'Пауза';
    const voices = speechSynthesis.getVoices();
    const mexico = voices.find(voice => voice.lang.toLowerCase().replace('_','-') === 'es-mx');
    const voice = mexico ?? voices.find(voice => /^es(?:[-_]|$)/i.test(voice.lang));
    if (!voice) {
      status.textContent = 'Браузер ещё не предоставил испанский голос. Повторите попытку или откройте транскрипт.';
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice.lang;
    utterance.voice = voice;
    utterance.rate = 0.88;
    const label = 'Синтез речи · ' + voice.name + ' (' + voice.lang + ')';
    status.textContent = label;
    playing = { id, speech: utterance };
    pause.disabled = false;
    utterance.onstart = () => {
      if (playing?.speech === utterance) started = true;
    };
    utterance.onend = () => {
      if (playing?.speech !== utterance) return;
      playing = undefined;
      pause.disabled = true;
      pause.textContent = 'Пауза';
    };
    utterance.onerror = () => {
      if (playing?.speech !== utterance) return;
      playing = undefined;
      pause.disabled = true;
      status.textContent = 'Не удалось воспроизвести голос. Повторите попытку или откройте транскрипт.';
    };
    speechSynthesis.speak(utterance);
  };
  pause.onclick = () => {
    if (playing?.id !== id) return;
    if (speechSynthesis.paused) { speechSynthesis.resume(); pause.textContent = 'Пауза'; }
    else { speechSynthesis.pause(); pause.textContent = 'Продолжить аудио'; }
  };
  return () => started;
}

function courseRow(unit      ) {
  const done = completed(state, unit);
  const attempted = !!state.attempts[unit.id];
  const unlocked = available(state, unit);
  const href = attempted && !state.drafts[unit.id] ? 'result/' : 'lesson/';
  return '<div class="course-row"><div><strong>' + html(unit.name) + '</strong><p class="muted">' + html(unit.goal) +
    '</p><p class="status">' + (done ? unit.exam ? 'Есть результат' : 'Урок завершён' : !unlocked ? 'Откроется после предыдущих заданий' : 'Доступно') +
    '</p></div>' + (unlocked || attempted ? btn(attempted && !state.drafts[unit.id] ? 'Результат' : 'Открыть', href + unit.id, 'alt') : '') + '</div>';
}
function home() {
  const unit = nextUnit(state);
  const learned = units.filter(item => !item.exam && completed(state, item)).length;
  const ready = dueCards(state).length;
  const begun = !!learned || !!unit && !!state.drafts[unit.id];
  show('<section class="hero"><div class="hero-copy"><p class="eyebrow">Испанский • Мексика</p><h1>' +
    (begun ? 'Продолжим по-испански?' : 'Испанский с первого слова') + '</h1><p>' +
    html(unit ? unit.goal : 'Все доступные материалы пройдены. Закрепите изученное в повторении.') + '</p>' +
    (unit ? btn(!begun ? 'Начать первый урок →' : progressAction(unit) + ' →', 'lesson/' + unit.id, 'light') : btn('К повторению →', 'review', 'light')) +
    '</div><div class="hero-art" aria-hidden="true"><div class="tile">¡Hola!<small>México</small></div></div></section>' +
    '<div class="grid"><a class="stat" href="#course"><span class="stat-title">Текущий блок</span><span class="stat-value">' +
    html(unit?.level ?? 'B2') + '</span></a><a class="stat" href="#review"><span class="stat-title">Карточки на сегодня</span><span class="stat-value">' +
    ready + '</span></a><a class="stat" href="#progress"><span class="stat-title">Уроков завершено</span><span class="stat-value">' + learned +
    '</span></a></div><section><div class="sectionbar"><h2>Учебный маршрут</h2><a href="#course">Весь курс →</a></div><div class="panel">' +
    units.filter(item => item.level === (unit?.level ?? 'B2')).map(courseRow).join('') + '</div></section>');
}
function course() {
  show(heading('Карта курса', 'От вводных уроков до пилотных модулей B2. Уровни открываются по порядку.') +
    '<div class="stack">' + levels.map(level =>
      '<section class="course-section"><div class="course-head"><span class="level-tag">' + level.id + '</span><h2>' + html(level.name) +
      '</h2><span class="status">' + html(level.status) + '</span></div>' +
      units.filter(unit => unit.level === level.id).map(courseRow).join('') +
      '<div class="extra-practice"><h3>Дополнительная практика</h3>' +
      practiceUnits.filter(unit => unit.level === level.id).map(courseRow).join('') + '</div>' +
      (level.future ? '<p class="muted">' + html(level.future) + '</p>' : '') + '</section>'
    ).join('') + '</div><section class="course-section grammar-section"><h2>Грамматика</h2>' +
    grammarUnits.map(courseRow).join('') + '</section>');
}
function lessonIntro(unit      ) {
  const scene = unit.scene?.map(([es, ru]) => '<div>' + spanish(es) + '<p class="muted">' + html(ru) + '</p></div>').join('');
  show('<article class="lesson"><a class="back" href="#course">← Карта курса</a>' + heading(unit.name, unit.goal) +
    '<div class="lesson-panel">' + (scene ? '<h2>Ситуация</h2><p>' + html(unit.context) + '</p><div class="dialogue">' +
      scene + '</div>' + playControl('scene-audio', 'Слушать диалог') + '<h2>Что пригодится</h2><p>' + html(unit.note) + '</p>' :
      '<p>Чтение и аудирование проверяются по ключам. Для проверки письма и устного ответа войдите в аккаунт. Если открыть транскрипт в аудировании, ответ будет отмечен как выполненный с опорой.</p>') +
    action(unit.exam ? 'К проверке →' : 'К заданиям →', 'begin', '') + '</div></article>');
  if (unit.scene) bindAudio('scene-audio', unit.scene.map(line => line[0]).join(' '), unit.id + '-scene');
  document.getElementById('begin') .onclick = async () => {
    await update(before => available(before, unit) ? start(before, unit, crypto.randomUUID()) : before);
    render(true);
  };
}

const symbols = '<div class="symbols" aria-label="Испанские символы">' +
  Array.from('áéíóúüñ¿¡').map(char => '<button class="btn alt" type="button" data-symbol="' + char + '">' + char + '</button>').join('') + '</div>';
let disposeRecording                          ;
function bindRecording() {
  const record = document.querySelector                   ('#record') ;
  const remove = document.querySelector                   ('#remove-audio') ;
  const audio = document.querySelector                  ('#recording') ;
  const status = document.querySelector             ('#record-status') ;
  const file = document.querySelector                  ('#audio-file') ;
  let recorder                           ;
  let stream                         ;
  let url                    ;
  let disposed = false;
  let recording                  ;
  let timer                    ;
  const stopTracks = () => stream?.getTracks().forEach(track => track.stop());
  const clear = () => {
    if (url) URL.revokeObjectURL(url);
    url = undefined;
    recording = undefined;
    audio.removeAttribute('src');
    audio.hidden = true;
    remove.hidden = true;
  };
  disposeRecording = () => {
    disposed = true;
    window.clearTimeout(timer);
    if (recorder?.state === 'recording') recorder.stop();
    stopTracks();
    clear();
  };
  function preview(blob      ) {
    clear();
    recording = blob;
    url = URL.createObjectURL(blob);
    audio.src = url;
    audio.hidden = false;
    remove.hidden = false;
  }
  const getRecording = () => recording;
  remove.onclick = () => { clear(); file.value = ''; status.textContent = 'Запись удалена.'; };
  file.onchange = () => {
    const selected = file.files?.[0];
    if (!selected) return;
    if (selected.size > 12_000_000) {
      status.textContent = 'Выберите аудиофайл до 12 МБ.';
      return;
    }
    preview(selected);
    status.textContent = 'Файл готов к проверке.';
  };
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    record.disabled = true;
    status.textContent = 'Запись через микрофон недоступна. Загрузите аудиофайл.';
    return getRecording;
  }
  record.onclick = async () => {
    if (recorder?.state === 'recording') { recorder.stop(); return; }
    record.disabled = true;
    clear();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (disposed) { stopTracks(); return; }
      recorder = new MediaRecorder(stream);
      const parts         = [];
      recorder.ondataavailable = event => { if (event.data.size) parts.push(event.data); };
      recorder.onstop = () => {
        window.clearTimeout(timer);
        file.disabled = false;
        stopTracks();
        if (disposed) return;
        if (parts.length) {
          preview(new Blob(parts, { type: recorder?.mimeType }));
        }
        record.textContent = 'Записать снова';
        status.textContent = parts.length ? 'Запись готова к прослушиванию.' : 'Звук не записался. Попробуйте снова.';
      };
      recorder.onerror = () => {
        window.clearTimeout(timer);
        file.disabled = false;
        stopTracks();
        record.textContent = 'Записать ответ';
        status.textContent = 'Ошибка записи. Попробуйте снова или загрузите аудиофайл.';
      };
      recorder.start();
      file.disabled = true;
      timer = window.setTimeout(() => { if (recorder?.state === 'recording') recorder.stop(); }, 59000);
      record.textContent = 'Остановить запись';
      status.textContent = 'Идёт запись.';
    } catch {
      stopTracks();
      status.textContent = 'Микрофон недоступен. Загрузите аудиофайл.';
    } finally { record.disabled = false; }
  };
  return getRecording;
}
function exerciseFields(exercise          ) {
  switch (exercise.kind) {
    case 'choice':
      return '<fieldset class="choices"><legend>Выберите ответ</legend>' + exercise.options.map(option =>
        '<label class="option"><input required type="radio" name="answer" value="' + html(option) + '">' +
        (exercise.prompt.startsWith('¿') ? spanish(option) : html(option)) + '</label>').join('') + '</fieldset>';
    case 'input':
      return '<label for="response">Ответ</label><input id="response" name="answer" type="text" lang="es-MX" autocomplete="off" required>' + symbols;
    case 'match':
      return '<div class="match">' + exercise.pairs.map(([phrase], index) =>
        '<label>' + spanish(phrase) + '<select required name="pair-' + index + '"><option value="">Выберите функцию</option>' +
        exercise.pairs.map(pair => pair[1]).sort((a,b) => a.localeCompare(b,'ru')).map(value =>
          '<option value="' + html(value) + '">' + html(value) + '</option>').join('') + '</select></label>').join('') + '</div>';
    case 'order':
      return '<div><p>Ваша фраза</p><div id="sequence" class="chips"></div><p>Доступные слова</p><div id="tokens" class="chips"></div></div>';
    case 'open':
      return exercise.skill === 'writing'
        ? '<label for="response">Ваш текст</label><textarea id="response" name="answer" lang="es-MX" maxlength="4000"></textarea>' + symbols
        : '<div class="stack"><p>Запишите ответ длительностью до одной минуты.</p><div class="actions">' +
          action('Записать ответ', 'record') + '<button class="btn alt" type="button" id="remove-audio" hidden>Удалить запись</button></div>' +
          '<label for="audio-file">Или загрузите аудиофайл</label><input id="audio-file" type="file" accept="audio/*,.m4a,.webm,.mp3,.wav">' +
          '<audio id="recording" controls hidden></audio><p role="status" id="record-status" class="muted"></p></div>';
  }
}
function exerciseView(unit      ) {
  const draft = state.drafts[unit.id];
  const index = draft.marks.length;
  const exercise = unit.exercises[index];
  if (!exercise) { go('result/' + unit.id); return; }
  const audio = exercise.material && exercise.skill === 'listening' ? exercise.material : undefined;
  const passage = exercise.material && exercise.skill === 'reading' ? exercise.material : undefined;
  show('<article class="lesson stack"><div><a class="back" href="#course">← Карта курса</a>' + heading(unit.name) +
    '<label for="lesson-progress">Задание ' + (index + 1) + ' из ' + unit.exercises.length + '</label>' +
    '<progress id="lesson-progress" value="' + index + '" max="' + unit.exercises.length + '"></progress></div>' +
    '<form id="exercise" class="lesson-panel"><p class="eyebrow">' + skills[exercise.skill] + '</p><h2>' +
    html(exercise.prompt) + '</h2>' + (passage ? '<blockquote class="dialogue" lang="es-MX">' + html(passage) + '</blockquote>' : '') +
    (audio ? playControl('exercise-audio') + '<details id="transcript"><summary>Открыть транскрипт</summary><p lang="es-MX">' + html(audio) + '</p></details>' : '') +
    exerciseFields(exercise) +
    (exercise.kind === 'open' ? '<p class="muted">При нажатии «Проверить ответ» текст или запись отправляется в Google Gemini. На бесплатном тарифе Google может использовать данные для улучшения продуктов.</p>' +
      (!session ? '<a href="#settings">Войти для проверки</a>' : '') : '') +
    '<div id="feedback" role="status" hidden></div>' +
    '<div class="actions"><button class="btn" id="check">' +
    (unit.exam && exercise.kind !== 'open' ? 'Сохранить ответ' : 'Проверить ответ') +
    '</button>' + (audio || exercise.kind === 'open' ? action('Пропустить задание', 'skip-audio') : '') + '</div></form></article>');
  const form = document.querySelector                 ('#exercise') ;
  const check = document.querySelector                   ('#check') ;
  const feedback = document.querySelector             ('#feedback') ;
  const input = form.querySelector                                        ('#response');
  let assisted = false;
  let accepted                                         ;
  let submitting = false;
  const selected           = [];
  const audioStarted = audio ? bindAudio('exercise-audio', audio, exercise.id) : undefined;
  if (audio) {
    const transcript = document.querySelector                    ('#transcript') ;
    transcript.addEventListener('toggle', () => { if (transcript.open) assisted = true; });
  }
  if (input) {
    form.querySelectorAll                   ('[data-symbol]').forEach(button => {
      button.addEventListener('pointerdown', event => event.preventDefault());
      button.onclick = () => {
        input.setRangeText(button.dataset.symbol , input.selectionStart ?? input.value.length, input.selectionEnd ?? input.value.length, 'end');
        input.focus();
      };
    });
  }
  if (exercise.kind === 'order') {
    const sequence = form.querySelector             ('#sequence') ;
    const tokens = form.querySelector             ('#tokens') ;
    const updateTokens = (moved         , list              ) => {
      sequence.innerHTML = selected.map(token => '<button type="button" class="btn alt" data-token="' + token + '" aria-label="Убрать ' +
        html(exercise.tokens[token]) + '">' + spanish(exercise.tokens[token]) + '</button>').join('');
      tokens.innerHTML = exercise.tokens.map((word, token) => selected.includes(token) ? '' :
        '<button type="button" class="btn alt" data-token="' + token + '" aria-label="Добавить ' + html(word) + '">' +
        spanish(word) + '</button>').join('');
      if (list && moved !== undefined) list.querySelector                   ('[data-token="' + moved + '"]')?.focus();
    };
    for (const container of [sequence, tokens]) container.onclick = event => {
      const button = (event.target               ).closest                   ('button');
      if (!button) return;
      const token = Number(button.dataset.token);
      const position = selected.indexOf(token);
      if (position < 0) selected.push(token);
      else selected.splice(position, 1);
      updateTokens(token, position < 0 ? sequence : tokens);
    };
    updateTokens();
  }
  const getRecording = exercise.kind === 'open' && exercise.skill === 'speaking' ? bindRecording() : undefined;

  const commit = async (mark                             ) => {
    if (submitting) return;
    submitting = true;
    check.disabled = true;
    await update(before => advance(before, unit, draft.id, mark));
    if (route() !== 'lesson/' + unit.id) return;
    if (state.drafts[unit.id]) render(true);
    else go('result/' + unit.id);
  };
  document.getElementById('skip-audio')?.addEventListener('click', () => commit(evaluate(exercise, '', 'skipped')));
  form.onsubmit = async event => {
    event.preventDefault();
    if (submitting) return;
    if (accepted) { void commit(accepted); return; }
    const data = new FormData(form);
    if (exercise.kind === 'open') {
      form.querySelector('#continue-anyway')?.remove();
      const answer = input?.value.trim() ?? '';
      const audio = getRecording?.();
      feedback.hidden = false;
      feedback.className = 'feedback';
      if (!session || (!answer && !audio)) {
        feedback.textContent = !session ? 'Войдите в аккаунт для отправки ответа.' : 'Сначала добавьте ответ.';
        return;
      }
      submitting = true;
      check.disabled = true;
      const controls = Array.from(form.querySelectorAll                                                            ('textarea, input, [data-symbol], #record, #remove-audio, #skip-audio'));
      const enabled = controls.filter(control => !control.disabled);
      enabled.forEach(control => { control.disabled = true; });
      feedback.textContent = 'Проверяем ответ…';
      try {
        const result = await assess(exercise.id, answer, audio ? await toWav(audio) : undefined);
        if (!form.isConnected) return;
        const correct = result.verdict === 'correct';
        feedback.className += correct ? '' : ' wrong';
        feedback.innerHTML = '<strong>' + (correct ? 'Верно' : result.verdict === 'revise' ? 'Нужно исправить' : 'Не удалось уверенно оценить') +
          '</strong><p>' + html(result.explanation) + '</p>' +
          (result.transcript ? '<p>Распознано: ' + spanish(result.transcript) + '</p>' : '') +
          (result.correction ? '<p>Вариант ответа: ' + spanish(result.correction) + '</p>' : '');
        const mark = { exerciseId: exercise.id, mode: 'auto'         , answer: answer || result.transcript, earned: Number(correct), possible: 1 };
        if (correct) {
          accepted = mark;
          check.textContent = 'Далее →';
          return;
        }
        if (result.verdict === 'revise') {
          document.getElementById('continue-anyway')?.remove();
          check.insertAdjacentHTML('afterend', action('Сохранить результат', 'continue-anyway'));
          document.getElementById('continue-anyway') .onclick = () => { void commit(mark); };
        }
      } catch (error) {
        feedback.textContent = error instanceof Error ? error.message : 'Проверка временно недоступна.';
      } finally {
        submitting = false;
        check.disabled = false;
        if (!accepted) enabled.forEach(control => { control.disabled = false; });
      }
      return;
    }
    let answer         = String(data.get('answer') ?? '');
    if (exercise.kind === 'match') answer = exercise.pairs.map((_, n) => String(data.get('pair-' + n) ?? ''));
    if (exercise.kind === 'order') {
      answer = selected.map(token => exercise.tokens[token]).join(' ');
      if (selected.length !== exercise.tokens.length) {
        feedback.hidden = false;
        feedback.textContent = 'Соберите фразу из всех слов.';
        return;
      }
    }
    const opened = form.querySelector                    ('#transcript')?.open;
    if (audioStarted && !audioStarted() && !assisted && !opened) {
      feedback.hidden = false;
      feedback.textContent = 'Сначала включите аудио или откройте транскрипт.';
      return;
    }
    const mark = evaluate(exercise, answer, assisted || opened ? 'assisted' : undefined);
    if (unit.exam) { void commit(mark); return; }
    feedback.hidden = false;
    feedback.className = 'feedback' + (mark.earned ? '' : ' wrong');
    feedback.textContent = (mark.earned ? 'Верно. ' : 'Попробуйте ещё раз. ') + exercise.feedback;
    if (!mark.earned) {
      if (!form.querySelector('#continue-anyway')) {
        check.insertAdjacentHTML('afterend', action('Продолжить с этим ответом', 'continue-anyway'));
        document.getElementById('continue-anyway') .onclick = () => { void commit(mark); };
      } else document.getElementById('continue-anyway') .onclick = () => { void commit(mark); };
      return;
    }
    accepted = mark;
    check.textContent = 'Далее →';
    form.querySelectorAll                                                          ('input, select, [data-token], [data-symbol]').forEach(control => { control.disabled = true; });
    document.getElementById('continue-anyway')?.remove();
    document.getElementById('skip-audio')?.remove();
    check.focus();
  };
}

function scoreText(row                                                 )         {
  const scoring = row.possible ? row.earned + ' / ' + row.possible + ' · ' + (row.self ? 'самооценка' : 'автопроверка') : 'Без оценки';
  return scoring + (row.assisted ? ' · с транскриптом: ' + row.assisted : '') + (row.skipped ? ' · пропущено: ' + row.skipped : '');
}
function resultPanel(unit      , attempt         ) {
  return '<div class="panel stack">' + Object.entries(results(unit, attempt)).map(([skill, row]) =>
    '<div><h3>' + skills[skill                       ] + '</h3><p class="muted">' + html(scoreText(row)) + '</p></div>').join('') + '</div>';
}
function resultView(unit      ) {
  const attempts = state.attempts[unit.id] ?? [];
  const resultIndex = Math.min(attempts.length - 1, Math.max(0, Number(route().split('/')[2] || attempts.length) - 1));
  const attempt = attempts[resultIndex];
  if (!attempt) { go('course'); return; }
  const routeUnits = practiceUnits.includes(unit) ? practiceUnits.filter(item => item.level === unit.level) : units;
  const position = routeUnits.indexOf(unit);
  const next = position < 0 ? undefined : routeUnits[position + 1];
  const passed = unit.exam && examPassed(unit, attempt);
  const description = unit.exam
    ? passed ? 'В этой попытке выполнены все критерии.' : 'Откройте разбор, чтобы увидеть ошибки, пропуски и задания с транскриптом.'
    : 'Карточек из урока в словаре: ' + unit.cards.length + '. Новые карточки уже доступны в повторении.';
  show('<article class="lesson stack"><div><a class="back" href="#course">← Карта курса</a>' +
    heading((unit.exam ? 'Результат: ' : 'Урок завершён: ') + unit.name, description) + '</div>' + resultPanel(unit, attempt) +
    '<details class="panel"><summary>Разбор ответов</summary><div class="list">' + attempt.marks.map(mark => {
      const exercise = unit.exercises.find(item => item.id === mark.exerciseId);
      if (!exercise) return '';
      const answer = exercise.kind === 'open'
        ? (mark.response ? '<p>Ваш текст: ' + spanish(mark.response) + '</p>' : '') + '<p>Пример: ' + spanish(exercise.example) + '</p>'
        : (mark.mode !== 'skipped' ? '<p>Ваш ответ: ' + html(Array.isArray(mark.answer) ? mark.answer.join(' · ') : mark.answer) + '</p>' : '<p>Аудирование пропущено.</p>') +
          '<p>Ответ: ' + html(exercise.kind === 'input' ? exercise.answers.join(' / ') : exercise.kind === 'match' ? exercise.pairs.map(pair => pair.join(' → ')).join(' · ') : exercise.answer) + '</p>';
      return '<div class="entry"><h3>' + html(exercise.prompt) + '</h3>' +
        (exercise.skill === 'listening' && exercise.material ? '<p>Транскрипт: ' + spanish(exercise.material) + '</p>' : '') +
        answer + '<p class="muted">' + html(exercise.feedback) + '</p></div>';
    }).join('') + '</div></details>' +
    (attempts.length > 1 ? '<details class="panel"><summary>История попыток</summary><div class="actions">' + attempts.map((item, index) =>
      btn('Попытка ' + (index + 1) + ' · ' + new Date(item.at).toLocaleDateString('ru'), 'result/' + unit.id + '/' + (index + 1), 'alt')).join('') + '</div></details>' : '') +
    '<div class="actions">' +
    (next && available(state, next) ? btn('Следующий урок →', 'lesson/' + next.id) : '') +
    btn('Пройти ещё раз', 'lesson/' + unit.id, 'alt') + (!unit.exam ? btn('К повторению', 'review', 'alt') : '') + '</div></article>');
}
let reviewCardId = '';
let revealed = false;
function review() {
  const queue = dueCards(state);
  const card = queue[0];
  if (!card || reviewCardId !== card.id) { reviewCardId = card?.id ?? ''; revealed = false; }
  if (!card) {
    const nextDate = Object.values(state.review).map(item => item.due).sort()[0];
    show(heading('Повторение') + '<div class="panel stack"><h2>На сегодня всё</h2><p>' +
      (nextDate ? 'Следующие карточки появятся ' + html(new Date(nextDate + 'T12:00:00').toLocaleDateString('ru')) + '.' : 'Завершите первый урок, чтобы добавить карточки в очередь.') +
      '</p><div>' + btn('К учебному маршруту', 'home') + '</div></div>');
    return;
  }
  show(heading('Повторение', 'Карточек на сегодня: ' + queue.length) +
    '<div class="panel stack deck"><p class="eyebrow">Вспомните значение</p><h2 lang="es-MX">' + html(card.es) + '</h2>' +
    (revealed ? '<p><strong>' + html(card.ru) + '</strong></p><p lang="es-MX">' + html(card.example) + '</p>' +
      '<p class="muted">Насколько легко было вспомнить?</p><div class="actions">' + action('Не вспомнил', 'again') + action('С трудом', 'hard') +
      action('Легко', 'good', '') + '</div>' : '<div>' + action('Показать ответ', 'reveal', '') + '</div>') + '</div>');
  if (revealed) {
    const expected = state.review[card.id];
    let rated = false;
    for (const rating of ['again','hard','good']            ) document.getElementById(rating) .onclick = async () => {
      if (rated) return;
      rated = true;
      await update(before => {
        const current = before.review[card.id];
        if (!current || current.history.length !== expected.history.length || current.due > localDate()) return before;
        return { ...before, review: { ...before.review, [card.id]: reviewCard(current, rating) } };
      });
      if (route() === 'review') render(true);
    };
  } else document.getElementById('reveal') .onclick = () => {
    revealed = true;
    review();
    document.getElementById('again')?.focus();
  };
}
function dictionary() {
  const learned = cards.filter(card => !!state.review[card.id]);
  if (!learned.length) {
    show(heading('Словарь') + '<div class="panel stack"><h2>Здесь появятся изученные выражения</h2><div>' + btn('К учебному маршруту', 'home') + '</div></div>');
    return;
  }
  show(heading('Словарь', 'Изученные слова и выражения с примерами.') +
    '<div class="stack"><label for="query">Найти слово или перевод</label><input id="query" type="search" autocomplete="off"><div id="entries" class="list"></div></div>');
  const input = document.querySelector                  ('#query') ;
  const list = document.getElementById('entries') ;
  const renderEntries = () => {
    stopAudio();
    const query = input.value.trim().toLowerCase();
    const matches = learned.filter(card => (card.es + ' ' + card.ru + ' ' + card.example).toLowerCase().includes(query));
    list.innerHTML = matches.map(card => '<div class="entry"><h2 lang="es-MX">' + html(card.es) + '</h2><p>' + html(card.ru) +
      '</p><p lang="es-MX">' + html(card.example) + '</p><p class="muted">' + html(card.register ?? 'Нейтральное употребление') + '</p>' +
      playControl(card.id, 'Слушать пример') +
      '<div>' + btn('Урок: ' + ([...units, ...practiceUnits].find(unit => unit.id === card.unitId)?.name ?? ''), 'result/' + card.unitId, 'alt') + '</div></div>').join('')
      || '<p role="status">Совпадений нет. Попробуйте другой запрос.</p>';
    for (const card of matches) bindAudio(card.id, card.example);
  };
  input.addEventListener('input', renderEntries);
  renderEntries();
}
function progressPage() {
  const lessons = [...units.filter(unit => !unit.exam), ...practiceUnits, ...grammarUnits];
  const checked = units.filter(unit => unit.exam && state.attempts[unit.id]?.length);
  const total = lessons.filter(unit => completed(state, unit)).length;
  const revisit = lessons.filter(unit => {
    const marks = state.attempts[unit.id]?.at(-1)?.marks;
    return marks?.some(mark => mark.mode === 'skipped' || mark.mode === 'assisted' || mark.earned < mark.possible);
  });
  show(heading('Прогресс') + '<div class="stack"><section class="panel stack"><h2>Уроки</h2><p>Завершено: ' + total + ' из ' + lessons.length +
    '</p><progress aria-label="Завершённые уроки" value="' + total + '" max="' + lessons.length + '"></progress></section>' +
    '<section class="panel stack"><h2>Проверки по навыкам</h2>' + (checked.length ? checked.map(unit =>
      btn(unit.name + ' · ' + (state.attempts[unit.id].some(attempt => examPassed(unit, attempt)) ? 'все критерии выполнены' : 'есть результат'), 'result/' + unit.id, 'alt')).join('') :
      '<p>Первая проверка откроется после уроков A1.</p>') + '</section>' +
    (revisit.length ? '<section class="panel stack"><h2>К чему вернуться</h2><div class="actions">' +
      revisit.map(unit => btn(unit.name, 'result/' + unit.id, 'alt')).join('') + '</div></section>' : '') + '</div>');
}
function settingsPage() {
  const content = session
    ? '<p>' + html(session.user.email) + '</p><div class="actions">' + action('Синхронизировать', 'sync-progress') +
      action('Перенести гостевой прогресс', 'import-guest') + action('Выйти', 'logout') + '</div>'
    : configured
      ? '<form id="account-form" class="stack"><label>Email<input type="email" name="email" autocomplete="email" required></label>' +
        '<label>Пароль<input type="password" name="password" autocomplete="current-password" minlength="6" required></label>' +
        '<div class="actions"><button class="btn" value="signin">Войти</button><button class="btn alt" value="signup">Создать аккаунт</button></div></form>'
      : '<p>Облачный аккаунт ещё не подключён. Гостевой прогресс хранится в браузере.</p>';
  show(heading('Аккаунт и настройки') + '<section class="panel stack"><h2>Ваш прогресс</h2>' +
    '<p>Войдите на другом устройстве с тем же email, чтобы продолжить обучение.</p>' +
    content + '<p id="account-sync" role="status">' + html(syncStatus) + '</p></section>');
  const form = document.querySelector                 ('#account-form');
  const status = document.querySelector             ('#account-sync') ;
  if (form) form.onsubmit = async event => {
    event.preventDefault();
    const data = new FormData(form);
    const intent = (event.submitter                            )?.value ?? 'signin';
    const buttons = Array.from(form.querySelectorAll('button'));
    buttons.forEach(button => { button.disabled = true; });
    status.textContent = 'Подключаемся…';
    try {
      status.textContent = await authenticate(intent, String(data.get('email')), String(data.get('password')));
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Не удалось войти.';
    } finally { buttons.forEach(button => { button.disabled = false; }); }
  };
  document.getElementById('sync-progress')?.addEventListener('click', scheduleSync);
  document.getElementById('logout')?.addEventListener('click', () => {
    void signOut().catch(() => { status.textContent = 'Не удалось выйти. Попробуйте снова.'; });
  });
  document.getElementById('import-guest')?.addEventListener('click', async () => {
    try {
      const guest = readProgress(localStorage.getItem(key));
      await update(local => mergeProgress(local, guest));
      status.textContent = 'Гостевой прогресс добавлен к аккаунту.';
    } catch { status.textContent = 'Гостевой прогресс недоступен.'; }
  });
}
let previousRoute = 'home';
function render(focus = false) {
  const current = route();
  previousRoute = current;
  disposeRecording?.();
  disposeRecording = undefined;
  stopAudio();
  const [page, id] = current.split('/');
  const nav = page === 'lesson' || page === 'result' ? 'course' : page;
  document.querySelectorAll('.sidebar a[href^="#"]').forEach(link => {
    if (link.getAttribute('href') === '#' + nav && !link.classList.contains('brand')) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
  const unit = id ? [...units, ...practiceUnits, ...grammarUnits].find(item => item.id === id) : undefined;
  switch (page) {
    case 'lesson':
      if (!unit || !available(state, unit)) { go('course'); return; }
      if (state.drafts[unit.id]) exerciseView(unit);
      else lessonIntro(unit);
      break;
    case 'result':
      if (!unit) { go('course'); return; }
      resultView(unit);
      break;
    case 'course': course(); break;
    case 'review': review(); break;
    case 'dictionary': dictionary(); break;
    case 'progress': progressPage(); break;
    case 'settings': settingsPage(); break;
    default: home();
  }
  if (focus) { main.focus(); window.scrollTo(0, 0); }
}
document.querySelector                   ('.skip') .addEventListener('click', event => {
  event.preventDefault();
  main.focus();
});
window.addEventListener('hashchange', () => render(true));
window.addEventListener('storage', event => {
  if (event.key !== activeKey && event.key !== null) return;
  state = read();
  if (!route().startsWith('lesson/') && route() !== 'review') render();
});
render();
void watchAccount(account => {
  const nextKey = account ? key + ':' + account.user.id : key;
  if (nextKey === activeKey) return;
  activeKey = nextKey;
  syncStatus = '';
  state = read();
  render();
  if (account) scheduleSync();
});
window.addEventListener('online', scheduleSync);
