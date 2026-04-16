# VibeCoddedToDo

VibeCoddedToDo is a small vibe-coded todo web app built for submitting lab assignments. It gives you a simple interface where you can add your own tasks, mark them as done, and remove items that are no longer relevant.

## Ідея проєкту

Це вайбкоджений to-do сайтик для здачі лабораторних, де можна додавати свої таски, відмічати виконані справи та тримати все необхідне в одному місці.

## Можливості

- додавання нових задач;
- позначення задач як виконаних;
- видалення задач;
- збереження задач у локальний JSON-файл;
- простий і охайний UI для MVP-версії.

## Технології

- Node.js
- Express
- EJS
- HTML / CSS / JavaScript

## Запуск локально

```bash
npm install
npm run dev
```

Для звичайного запуску без `nodemon`:

```bash
npm start
```

## Структура

- `src/` - серверна логіка, роутинг, контролери, сервіси
- `views/` - EJS-шаблони
- `public/` - стилі та клієнтський JavaScript
- `data/` - локальне збереження todo-даних

## Призначення

Проєкт створений як компактний MVP: без зайвої складності, але з достатньо акуратною структурою та приємним інтерфейсом для щоденного використання або навчальної демонстрації.
