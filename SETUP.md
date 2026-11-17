# Установка Hablario

Для локального запуска понадобится Node.js 24.4 или новее. Для облачного аккаунта и проверки нужен свой проект Supabase. Gemini не устанавливается на компьютер. Hablario обращается к Gemini API из серверной функции Supabase.

## 1. Скачать проект и проверить сборку

```sh
git clone https://github.com/prov-ori/hablario.git
cd hablario
npm run check
```

`npm run dev` запускает сайт на http://127.0.0.1:4173/. Гостевой режим доступен без ключей. В Windows, если PowerShell блокирует npm.ps1, используйте `npm.cmd`.

## 2. Настроить Supabase

1. Создайте проект в [Supabase Dashboard](https://supabase.com/dashboard). Скопируйте Project URL и **Publishable key** из окна Connect или раздела Project Settings → API Keys.
2. В Authentication → Providers включите Email. Оставьте подтверждение email включённым. Для регистрации обычных посетителей настройте Custom SMTP в Authentication. Встроенный почтовый сервис Supabase подходит для ограниченного тестирования.
3. В Authentication → URL Configuration установите Site URL в `https://prov-ori.github.io/hablario/`. Добавьте этот URL и `http://127.0.0.1:4173/` в Redirect URLs. Если публикуете форк, подставьте адрес форка везде.
4. Из корня проекта выполните следующие команды. `PROJECT_REF` замените идентификатором из адреса проекта `https://PROJECT_REF.supabase.co`. Команда db push применяет миграцию, которая создаёт таблицу прогресса, политики доступа и лимит проверки. Для уже существующей базы сначала проверьте миграции проекта.

```sh
npx supabase login
npx supabase link --project-ref PROJECT_REF
npx supabase db push
```

5. Заполните `public/config.js`. В браузер попадает только публичный ключ Supabase. Ключи `service_role`, `sb_secret_…` и Gemini хранятся на сервере.

```js
window.HABLARIO_CONFIG = {
  supabaseUrl: 'https://PROJECT_REF.supabase.co',
  supabasePublishableKey: 'sb_publishable_…',
};
```

6. Запустите `npm run dev` заново. Откройте «Настройки», создайте аккаунт и подтвердите email. Если вы учились до входа, выберите «Перенести гостевой прогресс». Пройдите задание, дождитесь сообщения о синхронизации в настройках и войдите с тем же email в другом профиле браузера. Проверьте, что позиция в уроке восстановилась.

[Supabase Auth и ограничения почты](https://supabase.com/docs/guides/auth/auth-smtp) · [Политики доступа RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Supabase CLI](https://supabase.com/docs/reference/cli/introduction)

## 3. Подключить Gemini

1. Откройте [Google AI Studio → API Keys](https://aistudio.google.com/apikey). Войдите в Google, выберите или создайте проект и нажмите Create API key. Для бесплатного режима проверьте доступность модели в регионе и текущие квоты. В коде по умолчанию используется `gemini-3.1-flash-lite`.
2. В Supabase Dashboard откройте Edge Functions → Secrets. Создайте секреты:

   | Имя | Значение |
   | --- | --- |
   | `GEMINI_API_KEY` | Ключ из Google AI Studio |
   | `GEMINI_MODEL` | `gemini-3.1-flash-lite` |
   | `HABLARIO_ALLOWED_ORIGINS` | `https://prov-ori.github.io,http://127.0.0.1:4173` |

   В списке origins указывайте только протокол, домен и порт. Адрес `/hablario/` нужен в настройках перенаправления Supabase Auth из предыдущего раздела.

3. Из корня проекта разверните функцию:

```sh
npx supabase functions deploy assess --project-ref PROJECT_REF --no-verify-jwt
```

Повторите эту команду после добавления или изменения открытых заданий в `src/course.ts`. Функция получает формулировки и критерии из этой версии курса.

Флаг отключает проверку устаревшим шлюзом. Сама функция отправляет пользовательский JWT в PostgREST. RPC проверяет право вызова и выделяет до 12 проверок в сутки по UTC для аккаунта. Только после этого функция вызывает Gemini.

4. Войдите в Hablario, напишите ответ на открытое задание и нажмите «Проверить ответ». В устном задании запишите короткую реплику или загрузите файл и повторите проверку. Сайт показывает расшифровку, объяснение и вариант исправления. По записи проверяются содержание и грамматика. Балл за произношение отдельно не вычисляется.
5. Если видите 401, войдите заново и проверьте, что URL, публичный ключ и функция относятся к одному проекту. Если браузер сообщает об ошибке CORS, проверьте `HABLARIO_ALLOWED_ORIGINS`. При серверной ошибке проверьте статус функции в Dashboard → Edge Functions → assess → Logs. Исчерпание квоты Gemini требует дождаться её обновления или выбрать доступную модель.

Проверка отправляет текст или аудио в Google только после нажатия кнопки. На бесплатном тарифе Google может использовать содержимое для улучшения продуктов.

[Ключ Gemini](https://ai.google.dev/gemini-api/docs/api-key) · [Модель](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite) · [Тарифы](https://ai.google.dev/gemini-api/docs/pricing) · [Секреты Supabase](https://supabase.com/docs/guides/functions/secrets)

## 4. Добавить готовые записи к урокам

Для воспроизведения без зависимости от установленных голосов положите MP3-файлы в `public/audio/`. Назовите диалоги `<id-урока>-scene.mp3`, аудирование `<id-задания>.mp3`, примеры словаря `<id-карточки>.mp3`. Идентификаторы берутся из `src/course.ts`. Например, первое знакомство использует `hola-scene.mp3` и `hola-listen.mp3`. Сборка создаёт список файлов автоматически. Для заданий без MP3 сайт использует системный голос и предоставляет транскрипт аудирования.

Запись ответа работает через HTTPS или на localhost. Разрешите доступ к микрофону при первом использовании. Если микрофон недоступен, загрузите MP3, WAV или M4A, который умеет воспроизводить ваш браузер. Для проверки действует ограничение в одну минуту и до 12 МБ на загружаемый файл.

## 5. Опубликовать сайт

```sh
npm run check
npm run build -- --pages
```

В GitHub Settings → Pages выберите Deploy from a branch, ветку `main` и папку `/ (root)`. Закоммитьте изменения исходников, браузерную конфигурацию, файлы сборки в корне и папки `public/audio/` и `audio/`, если добавили записи. Запушьте в `main` и дождитесь успешного деплоя в Actions. Откройте сайт из браузера на телефоне и повторите проверки входа, синхронизации и записи. Серверные секреты и локальные файлы `.env` в GitHub не отправляйте.
