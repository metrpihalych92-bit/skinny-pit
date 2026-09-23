# Инструкция по запуску и публикации

## Что это
Статический сайт — один файл `index.html` + `style.css` + `script.js`. Никакой сборки и зависимостей не нужно.

---

## Запуск локально

### Вариант 1 — просто открыть файл
Откройте `index.html` в браузере. Web Audio API работает из file://.

### Вариант 2 — локальный сервер (если нужен)
```bash
# Python (встроен в macOS/Linux)
python -m http.server 8080

# Node.js
npx serve .

# VS Code: расширение Live Server → правой кнопкой на index.html → Open with Live Server
```
Затем открыть `http://localhost:8080`

---

## Публикация

### GitHub Pages (бесплатно, рекомендуется)
1. Создать репозиторий на GitHub
2. Загрузить три файла: `index.html`, `style.css`, `script.js`
3. Settings → Pages → Branch: main, папка: / (root)
4. Сайт будет доступен по адресу: `https://<username>.github.io/<repo>/`

### Netlify (бесплатно, drag & drop)
1. Открыть [netlify.com/drop](https://app.netlify.com/drop)
2. Перетащить папку проекта (или ZIP из трёх файлов) в браузер
3. Сайт сразу онлайн — адрес вида `https://random-name.netlify.app`
4. Можно привязать свой домен в настройках

### Vercel (бесплатно)
```bash
npm i -g vercel
cd папка-проекта
vercel
```
Следовать инструкциям CLI. Адрес вида `https://project.vercel.app`

---

## Состав деплоя
Нужны только эти три файла:
```
index.html
style.css
script.js
```
Файлы `CLAUDE.md`, `TASK.md`, `research.md`, `DEPLOY.md` — служебные, деплоить не нужно.

---

## SEO / мета
В `<head>` уже есть:
- `<meta charset="UTF-8">`
- `<meta name="description" ...>`
- `<meta name="viewport" ...>`
- favicon через data-URI

При желании добавить Open Graph теги для красивых превью в соцсетях — достаточно вставить в `<head>`:
```html
<meta property="og:title" content="Дыхание — тренажёр техник">
<meta property="og:description" content="Бесплатный тренажёр: 4-7-8, Box Breathing, Wim Hof. Без приложений.">
<meta property="og:type" content="website">
```
