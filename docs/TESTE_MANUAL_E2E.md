# Teste manual E2E

1. Gerente cadastra com `emailPrefix + @luxe.com`.
2. Confirmar criação de loja e visualização do ID no dashboard admin.
3. Profissional cadastra com ID da loja.
4. Tentar login de profissional pendente (deve bloquear com mensagem clara).
5. Gerente aprova profissional em "Solicitações de Profissionais".
6. Profissional faz login com sucesso após aprovação.
7. Repetir com novo profissional e recusar; login deve permanecer bloqueado.
8. Profissional aprovado faz upload de comprovante e registra corte.
9. Profissional aprovado faz upload de foto de perfil.
10. Executar `npm run check` e `npm run build`.
11. Confirmar ausência do termo legado incorreto no repositório.
