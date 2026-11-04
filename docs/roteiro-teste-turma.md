# Roteiro do dia: teste com a turma

Para o Theo, no notebook da equipe. Comandos no Git Bash, na raiz do repositório, com o Docker Desktop aberto.

## 1. Antes da aula (uns 10 minutos)

1. Atualize o código: `git fetch && git checkout aula-pronta` (ou o branch `teste-turma`).
2. Suba tudo do zero, com o túnel:

   ```bash
   bash scripts/reset-teste.sh --tunel
   ```

   O script:
   - cria o `.env.teste` com senhas aleatórias na primeira vez (o arquivo não vai para o git);
   - derruba o ambiente e **apaga banco e comprovantes**;
   - constrói, sobe e espera a API responder;
   - mostra o endereço `https://....trycloudflare.com` e as contas da equipe.

   Se quiser outros e-mails para as contas da equipe, edite `MODERADOR_EMAIL` e `ADMIN_EMAIL` no `.env.teste` antes de rodar.
3. Anote o endereço do túnel. Ele muda a cada subida do túnel.
4. Confira:
   - pelo celular, **fora do Wi-Fi da sala (rede móvel)**, abra o endereço do túnel e veja a tela de entrada;
   - entre com a conta de moderação e veja a página **Moderação**, com a fila de ofertas e a conferência final vazias;
   - em `http://127.0.0.1:8090` também funciona, mas só nesta máquina.
5. Passe o endereço para a turma (projetor ou QR code). Cada estudante se cadastra com o e-mail `@grad.ufsc.br`; o aviso do teste aparece no cadastro.

## 2. Durante a aula

- **Moderação inicial**: em **Moderação**, aprove, peça correção ou reprove as ofertas novas.
- **Conferência final**: na mesma página, a seção "Conferência final das trocas" lista as trocas em andamento. As que estão em "Comprovantes enviados: conferir" pedem validar, invalidar ou pedir ajuste (uma vez só).
- **Troca parada**: abra a troca e use "Cancelar troca e devolver horas". As horas voltam para quem pediu.
- **Arquivo impróprio**: só pela API (`DELETE /api/anexos/{id}/arquivo`, com o token da moderação).
- Você **não** consegue moderar uma oferta ou troca da qual participa. Peça para outra pessoa da equipe.
- Se algo travar, veja os logs: `docker compose -f docker-compose.teste.yml --env-file .env.teste logs --tail 100 backend`.
- Erros 500 aparecem como evento `erro_servidor` com o id de rastreio, que também está no log.

## 3. Se o túnel cair

1. Reinicie só o túnel (o endereço muda):

   ```bash
   docker compose -f docker-compose.teste.yml --env-file .env.teste --profile tunel restart tunel
   docker compose -f docker-compose.teste.yml --env-file .env.teste --profile tunel logs tunel | grep trycloudflare
   ```

2. Plano B, na rede da sala (sem HTTPS):
   - coloque `FRONT_ENDERECO=0.0.0.0` no `.env.teste`;
   - rode `docker compose -f docker-compose.teste.yml --env-file .env.teste up -d frontend`;
   - passe `http://<IP do notebook>:8090`.
   - Isso expõe só o front; banco e API continuam sem porta.
3. Plano C: ngrok (`ngrok http 8090`), se estiver instalado.

## 4. No fim da aula

1. Exporte os eventos, ainda com o sistema no ar:
   - pela página **Usuários** logado como administração, botão de exportar eventos (entra depois da tag `aula-pronta`; antes disso, use o comando abaixo);
   - ou direto do banco: `docker compose -f docker-compose.teste.yml --env-file .env.teste exec postgres psql -U bancotempo -d timebank -c "\copy (select * from \"EventosSistema\" order by \"Id\") to stdout with csv header" > eventos-bruto.csv`.
   - O CSV da rota usa pseudônimos (U01, U02...). O bruto tem o id interno: guarde-o só com a equipe.
2. Rode as consultas de `docs/consultas-analise.sql`. A de conservação de horas tem que dar diferença zero.
3. Derrube o túnel: `docker compose -f docker-compose.teste.yml --env-file .env.teste --profile tunel stop tunel`.

## 5. Apagar os dados (até 31/12/2026, como diz o aviso)

```bash
docker compose -f docker-compose.teste.yml --env-file .env.teste --profile tunel down -v
rm .env.teste
```

O `down -v` apaga o banco e os comprovantes. Apague também cópias do CSV bruto que tenham ficado fora da equipe.
