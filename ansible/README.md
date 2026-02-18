# Deployment Ansible (VPS)

Ce dossier deploie l'application sur un VPS Ubuntu/Debian avec:
- Docker + Docker Compose
- PostgreSQL + Gotenberg en conteneurs
- Application Next.js en conteneur
- Nginx en reverse proxy
- Certificat TLS Let's Encrypt (certbot)

Le mode actuel de deploiement est `local_sync`:
- le code est synchronise depuis ce poste vers le VPS via `rsync`
- pas besoin d'un `git clone` sur le VPS

## 1) Pre-requis

- Le domaine `os-job-searcg.duckdns.org` pointe vers l'IP publique du VPS.
- Acces SSH au VPS configure dans `ansible/inventory.ini`.
- Les ports 80/443 sont ouverts.
- Si Caddy est deja present, le role `base` le stoppe/desactive pour liberer 80/443.

## 2) Configurer l'inventaire

Exemple actuel:

```ini
[vps]
erp ansible_host=198.7.118.126 ansible_user=root ansible_python_interpreter=/usr/bin/python3.9 ansible_ssh_common_args='-o StrictHostKeyChecking=accept-new'
```

## 3) Configurer les variables

Fichier: `ansible/group_vars/all.yml`

Variables principales:
- `app_domain`
- `app_email`
- `app_dir`
- `deploy_mode` (par defaut: `local_sync`)
- `local_project_path`

Secrets (version test):
- `postgres_password`
- `auth_secret`
- `google_client_id`
- `google_client_secret`
- `openai_key_encryption_secret`

## 4) Lancer le deploiement

Depuis la racine du projet:

```bash
ANSIBLE_CONFIG=ansible/ansible.cfg ansible -i ansible/inventory.ini vps -m ping
ANSIBLE_CONFIG=ansible/ansible.cfg ansible-playbook -i ansible/inventory.ini ansible/playbook.yml
```

## 5) Verification rapide

```bash
ANSIBLE_CONFIG=ansible/ansible.cfg ansible -i ansible/inventory.ini vps -m shell -a "docker compose -f /opt/cv-builder/docker-compose.yml ps"
ANSIBLE_CONFIG=ansible/ansible.cfg ansible -i ansible/inventory.ini vps -m shell -a "curl -k -s -o /dev/null -w '%{http_code}\\n' https://127.0.0.1/api/state"
curl -k -s -o /dev/null -w "%{http_code}\\n" https://os-job-searcg.duckdns.org/api/state
```

Attendu:
- containers `app`, `postgres`, `gotenberg` en `Up`
- endpoint `/api/state` en `401` (route protegee), donc app reachable

## 6) Note securite

Cette version est volontairement simple pour un premier run, avec secrets en clair dans `group_vars/all.yml`.
Prochaine etape recommandee: migrer vers `ansible-vault`.
