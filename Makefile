.PHONY: help dev up down restart logs db-reset db-migrate db-studio redis-cli tools clean

# Цвета для красивого вывода
GREEN=\033[0;32m
NC=\033[0m # No Color

help: ## Показать эту помощь
	@echo "$(GREEN)Доступные команды:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

# ==============================================
# Docker Compose команды
# ==============================================

dev: ## Запустить всё для разработки (PostgreSQL + Redis)
	@echo "$(GREEN)🚀 Запускаем инфраструктуру для разработки...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d postgres redis
	@echo "$(GREEN)✅ PostgreSQL: localhost:5432$(NC)"
	@echo "$(GREEN)✅ Redis: localhost:6379$(NC)"

up: dev ## Алиас для dev

down: ## Остановить все контейнеры
	@echo "$(GREEN)🛑 Останавливаем контейнеры...$(NC)"
	docker-compose -f docker-compose.dev.yml down

restart: ## Перезапустить контейнеры
	@echo "$(GREEN)🔄 Перезапускаем контейнеры...$(NC)"
	docker-compose -f docker-compose.dev.yml restart

logs: ## Показать логи контейнеров
	docker-compose -f docker-compose.dev.yml logs -f

# ==============================================
# Database команды
# ==============================================

db-reset: ## Сбросить БД и применить миграции заново
	@echo "$(GREEN)⚠️  Сброс базы данных...$(NC)"
	cd apps/api && npx prisma migrate reset --force

db-migrate: ## Применить миграции
	@echo "$(GREEN)📦 Применяем миграции...$(NC)"
	cd apps/api && npx prisma migrate dev

db-studio: ## Открыть Prisma Studio
	@echo "$(GREEN)🎨 Открываем Prisma Studio...$(NC)"
	cd apps/api && npx prisma studio

db-seed: ## Заполнить БД тестовыми данными
	@echo "$(GREEN)🌱 Seeding database...$(NC)"
	cd apps/api && npx prisma db seed

# ==============================================
# Redis команды
# ==============================================

redis-cli: ## Подключиться к Redis CLI
	docker exec -it netflix-tinder-redis redis-cli -a devredispass

redis-flush: ## Очистить весь Redis
	@echo "$(GREEN)⚠️  Очищаем Redis...$(NC)"
	docker exec -it netflix-tinder-redis redis-cli -a devredispass FLUSHALL

# ==============================================
# Development tools
# ==============================================

tools: ## Запустить GUI инструменты (pgAdmin + Redis Commander)
	@echo "$(GREEN)🛠️  Запускаем dev tools...$(NC)"
	docker-compose -f docker-compose.dev.yml --profile tools up -d
	@echo "$(GREEN)✅ pgAdmin: http://localhost:5050$(NC)"
	@echo "$(GREEN)✅ Redis Commander: http://localhost:8081$(NC)"

tools-down: ## Остановить GUI инструменты
	docker-compose -f docker-compose.dev.yml --profile tools down

# ==============================================
# Cleanup
# ==============================================

clean: ## Удалить все контейнеры и volumes (ОПАСНО!)
	@echo "$(GREEN)⚠️  ВНИМАНИЕ: Удаляем все данные!$(NC)"
	@read -p "Вы уверены? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f docker-compose.dev.yml down -v; \
		echo "$(GREEN)✅ Всё удалено$(NC)"; \
	fi

status: ## Показать статус контейнеров
	@echo "$(GREEN)📊 Статус контейнеров:$(NC)"
	@docker-compose -f docker-compose.dev.yml ps

# ==============================================
# Backup & Restore
# ==============================================

db-backup: ## Сделать backup БД
	@echo "$(GREEN)💾 Создаем backup...$(NC)"
	@mkdir -p backups
	docker exec netflix-tinder-postgres pg_dump -U devuser netflix_tinder_dev > backups/db_backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Backup создан: backups/$(NC)"

db-restore: ## Восстановить БД из последнего backup
	@echo "$(GREEN)📥 Восстанавливаем из backup...$(NC)"
	@LATEST=$$(ls -t backups/*.sql 2>/dev/null | head -1); \
	if [ -z "$$LATEST" ]; then \
		echo "$(GREEN)❌ Backup файлы не найдены$(NC)"; \
	else \
		echo "Восстанавливаем из: $$LATEST"; \
		docker exec -i netflix-tinder-postgres psql -U devuser netflix_tinder_dev < $$LATEST; \
		echo "$(GREEN)✅ Восстановление завершено$(NC)"; \
	fi