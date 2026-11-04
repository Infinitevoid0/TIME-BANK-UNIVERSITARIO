-- Consultas para depois do teste com a turma (PostgreSQL).
-- Rodar com: docker compose -f docker-compose.teste.yml --env-file .env.teste exec -T postgres psql -U bancotempo -d timebank < docs/consultas-analise.sql
-- Status: 1 Pendente, 2 Aprovada, 3 Recusada, 4 NecessitaCorrecao, 5 PendentePosCorrecao,
--         6 EmExecucao, 7 AguardandoValidacao, 8 NecessitaRevisao, 9 Validada, 10 Invalida.
-- Nenhuma consulta devolve nome ou e-mail.

-- 1. Atividades por estado atual.
SELECT "Status" AS status, count(*) AS atividades, sum("CustoHoras") AS horas
FROM "Atividades"
GROUP BY "Status"
ORDER BY "Status";

-- 2. Eventos por tipo.
SELECT "Tipo" AS tipo, count(*) AS quantidade
FROM "EventosSistema"
GROUP BY "Tipo"
ORDER BY quantidade DESC;

-- 3. Tempo entre etapas de cada atividade (a partir das transições aceitas).
WITH etapas AS (
    SELECT "AtividadeId",
           min("OcorridoEm") FILTER (WHERE "Tipo" = 'oferta_criada')                       AS criada,
           min("OcorridoEm") FILTER (WHERE "StatusNovo" = 2 AND "HttpStatus" = 200)          AS aprovada,
           min("OcorridoEm") FILTER (WHERE "Tipo" = 'pedido_feito')                        AS pedida,
           min("OcorridoEm") FILTER (WHERE "StatusNovo" = 7 AND "HttpStatus" = 200)          AS em_conferencia,
           min("OcorridoEm") FILTER (WHERE "StatusNovo" IN (9, 10) AND "HttpStatus" = 200)   AS encerrada
    FROM "EventosSistema"
    WHERE "AtividadeId" IS NOT NULL
    GROUP BY "AtividadeId"
)
SELECT "AtividadeId",
       aprovada - criada             AS ate_aprovacao,
       pedida - aprovada             AS ate_pedido,
       em_conferencia - pedida       AS ate_comprovantes,
       encerrada - em_conferencia    AS ate_conferencia
FROM etapas
ORDER BY "AtividadeId";

-- 3b. Médias das etapas (só atividades que chegaram em cada etapa).
WITH etapas AS (
    SELECT "AtividadeId",
           min("OcorridoEm") FILTER (WHERE "Tipo" = 'oferta_criada')                       AS criada,
           min("OcorridoEm") FILTER (WHERE "StatusNovo" = 2 AND "HttpStatus" = 200)          AS aprovada,
           min("OcorridoEm") FILTER (WHERE "Tipo" = 'pedido_feito')                        AS pedida,
           min("OcorridoEm") FILTER (WHERE "StatusNovo" = 7 AND "HttpStatus" = 200)          AS em_conferencia,
           min("OcorridoEm") FILTER (WHERE "StatusNovo" IN (9, 10) AND "HttpStatus" = 200)   AS encerrada
    FROM "EventosSistema"
    WHERE "AtividadeId" IS NOT NULL
    GROUP BY "AtividadeId"
)
SELECT avg(aprovada - criada)          AS media_ate_aprovacao,
       avg(pedida - aprovada)          AS media_ate_pedido,
       avg(em_conferencia - pedida)    AS media_ate_comprovantes,
       avg(encerrada - em_conferencia) AS media_ate_conferencia
FROM etapas;

-- 4. Tentativas recusadas por motivo (409, 422, 403, 401, 429).
SELECT "Tipo" AS tipo, "HttpStatus" AS http, coalesce("CodigoMotivo", '') AS motivo, count(*) AS quantidade
FROM "EventosSistema"
WHERE "HttpStatus" >= 400
GROUP BY "Tipo", "HttpStatus", "CodigoMotivo"
ORDER BY quantidade DESC;

-- 5. Conflitos de concorrência: pedidos que chegaram depois de outro pedido da mesma oferta.
SELECT "AtividadeId",
       count(*) FILTER (WHERE "Tipo" = 'pedido_feito')    AS pedidos_aceitos,
       count(*) FILTER (WHERE "Tipo" = 'pedido_conflito') AS pedidos_em_conflito,
       count(DISTINCT "AtorId") FILTER (WHERE "Tipo" = 'pedido_conflito') AS pessoas_em_conflito
FROM "EventosSistema"
WHERE "Tipo" IN ('pedido_feito', 'pedido_conflito')
GROUP BY "AtividadeId"
HAVING count(*) FILTER (WHERE "Tipo" = 'pedido_conflito') > 0
ORDER BY pedidos_em_conflito DESC;

-- 5b. Conferências finais concorrentes recusadas (duas pessoas da moderação ao mesmo tempo).
SELECT "AtividadeId", count(*) AS recusas
FROM "EventosSistema"
WHERE "Tipo" = 'transicao_recusada' AND "StatusAnterior" = 7 AND "CodigoMotivo" = 'TRANSICAO_INVALIDA'
GROUP BY "AtividadeId";

-- 6. Conservação de horas: tem que dar diferenca = 0.
--    Horas distribuídas no cadastro + ajustes do admin = soma das horas das pessoas + horas reservadas em trocas em andamento.
SELECT distribuidas,
       nas_contas,
       reservadas,
       distribuidas - (nas_contas + reservadas) AS diferenca
FROM (
    SELECT (SELECT coalesce(sum("DeltaHoras"), 0) FROM "EventosSistema" WHERE "Tipo" IN ('usuario_cadastrado', 'ajuste_admin')) AS distribuidas,
           (SELECT coalesce(sum("SaldoHoras"), 0) FROM "Usuarios")                                                         AS nas_contas,
           (SELECT coalesce(sum("CustoHoras"), 0) FROM "Atividades" WHERE "Status" IN (6, 7, 8))                           AS reservadas
) AS conta;

-- 6b. Conferência pelo lado dos eventos: reservas menos registros e devoluções = horas ainda reservadas.
SELECT -coalesce(sum("DeltaHoras") FILTER (WHERE "Tipo" = 'pedido_feito'), 0)
       - coalesce(sum("DeltaHoras") FILTER (WHERE "Tipo" IN ('horas_registradas', 'horas_devolvidas')), 0) AS reservadas_pelos_eventos,
       (SELECT coalesce(sum("CustoHoras"), 0) FROM "Atividades" WHERE "Status" IN (6, 7, 8))              AS reservadas_nas_atividades
FROM "EventosSistema";

-- 7. Nenhuma conta com horas negativas (o CHECK do banco também impede).
SELECT count(*) AS contas_negativas FROM "Usuarios" WHERE "SaldoHoras" < 0;

-- 8. Atividade ao longo da aula, por intervalo de 10 minutos.
SELECT date_bin('10 minutes', "OcorridoEm", TIMESTAMP '2000-01-01') AS intervalo, "Tipo" AS tipo, count(*) AS quantidade
FROM "EventosSistema"
GROUP BY intervalo, "Tipo"
ORDER BY intervalo, quantidade DESC;

-- 9. Erros do servidor, com o id de rastreio para procurar no log.
SELECT "OcorridoEm", "IdRastreio" FROM "EventosSistema" WHERE "Tipo" = 'erro_servidor' ORDER BY "OcorridoEm";
