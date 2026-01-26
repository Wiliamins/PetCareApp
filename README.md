# 🚀 PetCareApp - Инструкция запуска

## Быстрый старт (3 минуты)

### Требования:
- **Docker** + **Docker Compose** (рекомендуется)
- Или: Node.js 18+ и Python 3.11+

---

## Вариант 1: Docker (рекомендуется) 🐳

```bash
# 1. Распаковать архив
tar -xzvf petcareapp-external-api.tar.gz
cd petcareapp

# 2. Запустить всё одной командой
docker-compose up -d

# 3. Подождать 1-2 минуты пока всё поднимется
docker-compose logs -f  # смотреть логи (Ctrl+C чтобы выйти)

# 4. Открыть в браузере
# http://localhost:3000
```

### Тестовые аккаунты:
| Email | Пароль | Роль |
|-------|--------|------|
| admin@petcareapp.com | admin123 | Администратор |
| vet@petcareapp.com | vet123 | Ветеринар |
| client@petcareapp.com | client123 | Клиент |
| it@petcareapp.com | it123 | IT специалист |

---

## Вариант 2: Без Docker (ручной запуск)

### Терминал 1 - Backend:
```bash
cd petcareapp/backend
pip install flask flask-cors requests boto3 pyjwt

# Запустить нужные сервисы
python auth_service/app.py &          # 8001
python user_service/app.py &          # 8002  
python drug_service/app.py &          # 8010
python disease_alert_service/app.py & # 8011
```

### Терминал 2 - Frontend:
```bash
cd petcareapp/frontend
npm install
npm start
# Откроется http://localhost:3000
```

---

## Вариант 3: Только Frontend (самый простой)

```bash
cd petcareapp/frontend
npm install
npm start
```

Всё работает с demo данными без backend.

---

## 🖥️ Тестовые сценарии

### Ветеринар - Baza leków:
1. Логин: vet@petcareapp.com / vet123
2. Меню → 💊 Baza leków
3. Ввести: "amoxicillin" → Szukaj
4. Результаты из URPL (PL) и FDA (US)

### Ветеринар - Alerty PIW:
1. Меню → ⚠️ Alerty PIW  
2. Вкладка "Źródła danych" - официальные источники
3. Вкладка "Mapy interaktywne" - ссылки на карты GIW

### Клиент - Запись на приём:
1. Логин: client@petcareapp.com / client123
2. Меню → 📅 Wizyty
3. Nowa wizyta → 4-шаговый wizard

---

## 📡 API Endpoints

```bash
# Drug Service - поиск лекарств
curl "http://localhost:8010/drugs/search?q=amoxicillin"
curl "http://localhost:8010/drugs/sources"

# Disease Alerts - источники
curl "http://localhost:8011/alerts/sources"
curl "http://localhost:8011/alerts/diseases"
```

---

## ❓ Проблемы

**Порт занят:** `lsof -i :3000` → `kill -9 <PID>`

**Нет данных:** Приложение использует demo данные автоматически

---

🐾 Удачного тестирования!
