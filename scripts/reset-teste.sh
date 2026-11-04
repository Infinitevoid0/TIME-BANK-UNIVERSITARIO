#!/usr/bin/env bash
# Derruba o ambiente do teste, APAGA os dados (banco e comprovantes), sobe de novo e cria as contas da equipe.
# Uso (na raiz do repositório, no Git Bash ou Linux):
#   bash scripts/reset-teste.sh            # sobe sem túnel (só http://127.0.0.1:8090)
#   bash scripts/reset-teste.sh --tunel    # sobe com o túnel HTTPS e mostra o endereço público
set -euo pipefail
cd "$(dirname "$0")/.."

ARQ_ENV=".env.teste"
COMPOSE=(docker compose -f docker-compose.teste.yml --env-file "$ARQ_ENV")

aleatorio() { LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c "$1"; }

if [ ! -f "$ARQ_ENV" ]; then
  echo "Criando $ARQ_ENV com senhas aleatórias (o arquivo não vai para o git)."
  cat > "$ARQ_ENV" <<CONF
# Segredos do ambiente de teste. Troque os e-mails da equipe se quiser; as senhas valem a partir do próximo reset.
POSTGRES_SENHA=$(aleatorio 32)
JWT_CHAVE=$(aleatorio 64)
MODERADOR_EMAIL=equipe.moderacao@ufsc.br
MODERADOR_SENHA=$(aleatorio 16)
MODERADOR_NOME="Equipe Moderação"
ADMIN_EMAIL=equipe.admin@ufsc.br
ADMIN_SENHA=$(aleatorio 16)
ADMIN_NOME="Equipe Administração"
FRONT_PORTA=8090
CONF
fi

set -a; . "./$ARQ_ENV"; set +a

echo "Derrubando o ambiente e apagando os volumes do projeto bancotempo-teste..."
"${COMPOSE[@]}" --profile tunel down -v --remove-orphans

echo "Construindo e subindo..."
if [ "${1:-}" = "--tunel" ]; then
  "${COMPOSE[@]}" --profile tunel up -d --build
else
  "${COMPOSE[@]}" up -d --build
fi

URL_LOCAL="http://127.0.0.1:${FRONT_PORTA:-8090}"
echo -n "Esperando a API responder em $URL_LOCAL/api/cursos "
for _ in $(seq 1 90); do
  if curl -fsS "$URL_LOCAL/api/cursos" >/dev/null 2>&1; then echo " ok"; break; fi
  echo -n "."; sleep 2
done
curl -fsS "$URL_LOCAL/api/cursos" >/dev/null || { echo; echo "A API não respondeu. Veja: docker compose -f docker-compose.teste.yml logs backend"; exit 1; }

echo
echo "Endereço local: $URL_LOCAL"
if [ "${1:-}" = "--tunel" ]; then
  echo -n "Esperando o endereço do túnel "
  for _ in $(seq 1 30); do
    URL_TUNEL=$("${COMPOSE[@]}" --profile tunel logs tunel 2>/dev/null | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1 || true)
    if [ -n "${URL_TUNEL:-}" ]; then echo; echo "Endereço para a turma: $URL_TUNEL"; break; fi
    echo -n "."; sleep 2
  done
  [ -n "${URL_TUNEL:-}" ] || echo " não apareceu; veja: docker compose -f docker-compose.teste.yml --profile tunel logs tunel"
fi
echo
echo "Contas da equipe (estão em $ARQ_ENV):"
echo "  Moderação:     $MODERADOR_EMAIL / $MODERADOR_SENHA"
echo "  Administração: $ADMIN_EMAIL / $ADMIN_SENHA"
