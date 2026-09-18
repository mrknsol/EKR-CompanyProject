# ZEIR Frontend (EKR)

React + Vite + TypeScript витрина оптового бренда **ZEIR** (компания EKR · China).

## Запуск

```bash
cd EKR.Frontend
npm install
npm run dev
```

Откроется `http://localhost:5173`. API по умолчанию: `http://localhost:5015/api`.

## Демо-админ

- Email: `admin@zeir.cn`
- Password: `Admin123!`

## Что умеет

- Главная, каталог, карточка модели (серии, цвета/коды, материалы)
- Просмотр фото по цветам одной модели
- Логин / регистрация с флагами страны и телефона (по умолчанию 🇨🇳 +86)
- Языки: RU / EN / 中文 / AZ
- Валюты: **CNY (база)**, USD, EUR, RUB, AZN, KZT
- Профиль: данные, заказы, язык/валюта
- О компании: фабрика Хэбэй, офис/шоурум Гуанчжоу
- Корзина → checkout → демо-оплата → Excel-накладная
- Админ: CRUD курток, пользователи, заказы, upload фото в MinIO

Каталог/заказы/накладные пока на localStorage — бэкенд ещё без серий и invoice API.

Если каталог/цены выглядят старыми — в DevTools очистите `localStorage` ключи `zeir-products` и `zeir-currency`.
