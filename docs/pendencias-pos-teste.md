# Pendências para depois do teste com a turma

- **D18.** O comentário em `Atividade.DisciplinaId` diz que só atividade sem disciplina passa por moderação, mas o POST sempre cria como `Pendente` (ou `Aprovada` quando `BancoTempo:ModeracaoInicial` é `false`). A regra não mudou hoje; decidir qual das duas vale e alinhar código, comentário e `exemplos.http`.
- **Verificação de e-mail.** Qualquer pessoa pode cadastrar o e-mail institucional de outra, e cada conta nasce com horas. Precisa de envio de e-mail para confirmar a conta.
