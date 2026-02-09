COMPOSE ?= docker compose

.PHONY: up down restart logs ps pull stop db-shell reset

up:
	$(COMPOSE) up -d --remove-orphans

down:
	$(COMPOSE) down

stop:
	$(COMPOSE) stop

restart:
	$(COMPOSE) down
	$(COMPOSE) up -d --remove-orphans

logs:
	$(COMPOSE) logs -f --tail=200

ps:
	$(COMPOSE) ps

pull:
	$(COMPOSE) pull

db-shell:
	$(COMPOSE) exec postgres psql -U postgres -d job_research_assistant

reset:
	$(COMPOSE) down -v
