# 🐳 Docker Setup для разработки

## 📋 Быстрый старт

### 1. Настроить переменные окружения

```bash
# Скопировать example файл
cp .env.example .env

# Отредактировать если нужно (можно оставить дефолтные для dev)
nano .env
```

### 2. Запустить инфраструктуру

```bash
# Вариант 1: Через Makefile (рекомендуется)
make dev

# Вариант 2: Напрямую через docker-compose
docker-compose -f docker-compose.dev.yml up -d postgres redis
```

### 3. Проверить что всё работает

```bash
# Проверить статус контейнеров
make status
# или
docker-compose -f docker-compose.dev.yml ps

# Должны быть запущены:
# ✅ netflix-tinder-postgres
# ✅ netflix-tinder-redis
```

### 4. Применить миграции Prisma

```bash
# В директории apps/api
cd apps/api
npx prisma migrate dev

# Или через Makefile из корня
make db-migrate
```

---

## 🎯 Основные команды

### Управление контейнерами

```bash
make dev          # Запустить PostgreSQL + Redis
make down         # Остановить всё
make restart      # Перезапустить
make logs         # Посмотреть логи
make status       # Статус контейнеров
```

### База данных

```bash
make db-migrate   # Применить миграции
make db-reset     # Сбросить БД (удалит все данные!)
make db-studio    # Открыть Prisma Studio (GUI)
make db-seed      # Заполнить тестовыми данными
make db-backup    # Создать backup
```

### Redis

```bash
make redis-cli    # Открыть Redis CLI
make redis-flush  # Очистить весь Redis
```

### Dev Tools (опционально)

```bash
make tools        # Запустить pgAdmin + Redis Commander
# Откроются:
# - http://localhost:5050 (pgAdmin)
# - http://localhost:8081 (Redis Commander)

make tools-down   # Остановить инструменты
```

---

## 🔧 Детали конфигурации

### PostgreSQL

- **Порт:** 5432
- **База:** `netflix_tinder_dev`
- **Пользователь:** `devuser`
- **Пароль:** `devpassword`
- **Connection String:**
  ```
  postgresql://devuser:devpassword@localhost:5432/netflix_tinder_dev
  ```

### Redis

- **Порт:** 6379
- **Пароль:** `devredispass`
- **Connection String:**
  ```
  redis://:devredispass@localhost:6379
  ```

### Volumes (персистентность данных)

```bash
# Данные сохраняются в Docker volumes:
postgres_data     # PostgreSQL данные
redis_data        # Redis AOF файлы
pgadmin_data      # pgAdmin настройки

# Посмотреть volumes
docker volume ls | grep netflix-tinder
```

---

## 🛠️ Troubleshooting

### Порты заняты

**Проблема:** `Error: bind: address already in use`

**Решение:**
```bash
# Найти процесс на порту 5432
sudo lsof -i :5432
# Или для Redis (6379)
sudo lsof -i :6379

# Убить процесс или изменить порт в docker-compose.dev.yml
```

### Контейнер не стартует

**Проверить логи:**
```bash
docker logs netflix-tinder-postgres
docker logs netflix-tinder-redis
```

**Пересоздать контейнер:**
```bash
make down
docker volume rm netflix-tinder_postgres_data  # удалит данные!
make dev
```

### Prisma не подключается к БД

**Проверить:**
1. Контейнер запущен: `docker ps`
2. Healthcheck OK: `docker inspect netflix-tinder-postgres | grep Health`
3. Connection string в `.env` корректный

**Решение:**
```bash
# Подождать пока БД полностью запустится
sleep 10

# Проверить подключение
docker exec netflix-tinder-postgres pg_isready -U devuser
```

### Redis требует пароль

**В коде используй:**
```typescript
// NestJS
RedisModule.forRoot({
  config: {
    host: 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
  },
})

// Node Redis
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
})
```

---

## 🔄 Обновление конфигурации

После изменений в `docker-compose.dev.yml`:

```bash
# Пересоздать контейнеры
docker-compose -f docker-compose.dev.yml up -d --force-recreate

# Или просто
make restart
```

---

## 🧹 Очистка

### Мягкая очистка (сохранить данные)
```bash
make down
```

### Жесткая очистка (удалить всё)
```bash
make clean  # Спросит подтверждение

# Или вручную
docker-compose -f docker-compose.dev.yml down -v
```

### Очистить только Redis
```bash
make redis-flush
```

### Очистить только PostgreSQL
```bash
make db-reset
```

---

## 📊 Мониторинг

### Использование ресурсов
```bash
docker stats netflix-tinder-postgres netflix-tinder-redis
```

### Размер данных
```bash
docker system df -v
```

### Health check
```bash
# PostgreSQL
docker exec netflix-tinder-postgres pg_isready -U devuser

# Redis
docker exec netflix-tinder-redis redis-cli -a devredispass ping
```

---

## 🚀 Production готовность

Для production используй отдельный `docker-compose.prod.yml` с:

- ✅ Сильные пароли (не дефолтные!)
- ✅ Resource limits (CPU, Memory)
- ✅ Restart policies
- ✅ Healthchecks с alerting
- ✅ Backup стратегия
- ✅ SSL/TLS для Redis
- ✅ Connection pooling
- ✅ Мониторинг (Prometheus, Grafana)

---

## 💡 Полезные команды

```bash
# Посмотреть все запущенные контейнеры проекта
docker ps --filter "name=netflix-tinder"

# Посмотреть логи конкретного сервиса
docker-compose -f docker-compose.dev.yml logs -f postgres
docker-compose -f docker-compose.dev.yml logs -f redis

# Зайти внутрь контейнера
docker exec -it netflix-tinder-postgres bash
docker exec -it netflix-tinder-redis sh

# Выполнить SQL запрос
docker exec netflix-tinder-postgres psql -U devuser -d netflix_tinder_dev -c "SELECT NOW();"

# Импорт SQL дампа
docker exec -i netflix-tinder-postgres psql -U devuser netflix_tinder_dev < dump.sql

# Экспорт БД
docker exec netflix-tinder-postgres pg_dump -U devuser netflix_tinder_dev > dump.sql
```

---

## 🎓 Best Practices

1. **Никогда не коммить `.env`** — только `.env.example`
2. **Регулярные backup'ы** — `make db-backup` перед важными изменениями
3. **Чистить Redis** после больших изменений в схеме
4. **Использовать миграции** вместо ручных изменений БД
5. **Проверять healthcheck** перед запуском приложения

---

Нужна помощь? Создай issue или спроси в чате! 🚀
