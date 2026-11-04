# Pendências para depois do teste com a turma

- **D18.** O comentário em `Atividade.DisciplinaId` diz que só atividade sem disciplina passa por moderação, mas o POST sempre cria como `Pendente` (ou `Aprovada` quando `BancoTempo:ModeracaoInicial` é `false`). A regra não mudou hoje; decidir qual das duas vale e alinhar código, comentário e `exemplos.http`.
- **Verificação de e-mail.** Qualquer pessoa pode cadastrar o e-mail institucional de outra, e cada conta nasce com horas. Precisa de envio de e-mail para confirmar a conta.
- **Etapa "Visto" da linha do tempo.** O DESIGN.md prevê "Enviado, Visto, Aceito...", mas o sistema não registra quando alguém viu um pedido. A linha do tempo mostra só etapas com dado real; para ter "Visto" é preciso gravar um evento de leitura.
- **Modos escuro e alto contraste (P2).** Os tokens do DESIGN.md existem só para o modo claro no front. Sem os quatro modos verificados, não há seletor de tema (regra R-34 do antislop).
- **Pedido aberto (P2).** Pedir ajuda sem uma oferta existente pede o campo `Tipo` em `Atividade`, migração e testes da inversão (quem responde oferece e recebe as horas).
- **Modalidade e disponibilidade (P2).** Campos previstos no formulário curto do DESIGN.md e ainda inexistentes na API.
- **`exemplos.http`.** Os exemplos ainda usam as rotas antigas com ids no corpo e na query; atualizar para o contrato com token (`docs/contrato-api.md`).
- **`ReferenceHandler.IgnoreCycles`.** Pode sair, porque todas as respostas são DTOs; ficou para não mexer na serialização antes da aula.
- **Tamanho do pacote do front.** O build avisa que o JavaScript passa de 500 kB por causa do editor Quill; carregar o editor só na página de oferta.
- **Contas sem vínculo.** Excluir pessoa com ofertas, trocas ou mensagens dá 409 `EM_USO`; definir a política de anonimização ou exclusão em cascata depois do teste, junto com a LGPD.
- **Branch `feat/anexos-e-seguranca`.** É mais antigo que o `main` e foi ignorado; decidir se ainda tem algo a aproveitar ou se pode ser apagado.
