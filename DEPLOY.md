# Déploiement AMSR sur le VPS (aux côtés de dataserv et GTpp)

Ce projet réutilise l'infrastructure déjà en place (réseau `proxy_net`, `dataserv-nginx`,
certbot webroot) mise en place pour GTpp. Voir le repo GTPP pour le détail de cette
mise en place initiale.

## 1. DNS (OVH)
Ajouter un enregistrement A : `amsr.alkaramsoft.ovh` -> IP du VPS (même IP que les autres sous-domaines).

## 2. Cloner et configurer
```bash
git clone https://github.com/Karambenkraiem/AMSR.git /opt/steg/AMSR
cd /opt/steg/AMSR

POSTGRES_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 32)
cat > .env <<EOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
EOF
```

## 3. Démarrage
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -f docker-compose.prod.yml ps
```

## 4. Schéma + seed (manuel — pas automatique au démarrage)
L'ancien `entrypoint.sh` faisait un `prisma db push --accept-data-loss` et un reseed à
chaque démarrage du conteneur. Ce n'est plus le cas en production : le conteneur backend
démarre directement `node src/server.js`, sans toucher au schéma ni aux données.
Après le premier démarrage (et après tout changement futur de `prisma/schema.prisma`) :
```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma db push
docker compose -f docker-compose.prod.yml exec backend node prisma/seed.js   # optionnel
```

Optionnel — l'ancien entrypoint faisait aussi ce nettoyage ponctuel, à lancer une seule
fois si nécessaire (plus jamais automatique) :
```bash
docker compose -f docker-compose.prod.yml exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$executeRawUnsafe(\"DELETE FROM \\\"User\\\" WHERE role::text = 'assistant_charge_exploitation'\")
  .finally(() => p.\$disconnect());
"
```

## 5. Nginx (dataserv-nginx) + SSL
`dataserv-nginx` est déjà connecté à `proxy_net` (fait pour GTpp, pas besoin de refaire).
Il faut juste ajouter les deux server blocks pour `amsr.alkaramsoft.ovh` dans
`/opt/dataserv/ProjDataservComplet/nginx/nginx.conf`, sur le modèle exact des blocs GTpp
déjà présents (phase A HTTP-only pour obtenir le certificat, puis phase B avec le bloc
HTTPS final proxyant vers `amsr_frontend_prod:80`). Voir DEPLOY.md du repo GTPP pour la
procédure détaillée (`nginx -t` avant chaque reload, jamais de restart du conteneur).

Certificat (réutilise le même webroot déjà en place) :
```bash
sudo certbot certonly --webroot -w /etc/letsencrypt/webroot -d amsr.alkaramsoft.ovh
```

## 6. GitHub Actions
Dans GitHub → repo `AMSR` → Settings → Secrets and variables → Actions, ajouter (les
mêmes noms que pour GTpp, mais ce sont des secrets **séparés propres à ce repo** —
aucun conflit) :
- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_SSH_PORT` (mêmes valeurs que pour GTpp,
  même VPS/même clé)
- `VPS_PROJECT_PATH` = `/opt/steg/AMSR` (différent de celui de GTpp)
