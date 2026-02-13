# Teste manual passo a passo (sem ambiente local)

## Pré-condições
- Frontend no Netlify apontando para backend do Render (`BACKEND_URL`).
- Backend com `DATABASE_URL` válido no Neon.

---

## 1) Smoke inicial de plataforma
1. Acessar frontend (`/`).
2. Validar que a página inicial abre.
3. Chamar `/api/health` (via browser/devtools) e verificar `status: ok`.

---

## 2) Fluxo de autenticação atual
1. Abrir `/onboarding`.
2. Cadastrar usuário teste com role profissional.
3. Confirmar redirecionamento.
4. Fazer logout/login.

Resultado esperado:
- sessão ativa com cookie;
- sem erro 401 inesperado após login.

---

## 3) Fluxo de profissional (estado atual)
1. Entrar no painel profissional.
2. Registrar atendimento com pagamento em dinheiro.
3. Registrar atendimento com pagamento pix/cartão e anexar comprovante.

Resultado esperado:
- em dinheiro: salva sem comprovante obrigatório;
- digital: exige comprovante + identificador.

---

## 4) Fluxo de admin (estado atual)
1. Entrar no painel admin.
2. Abrir tela de cortes/agendamentos.
3. Aprovar e recusar itens pendentes.

Resultado esperado:
- status muda para confirmado/rejeitado;
- comprovante visualiza quando existe.

---

## 5) Testes alvo da Fase 2 (quando PRs funcionais entrarem)

### PR-01 Cadastro de loja
- criar gerente com prefixo de e-mail (domínio fixo);
- validar senha com regras novas;
- confirmar geração de ID único da loja;
- confirmar exibição nome+ID na dashboard.

### PR-02 Cadastro profissional por ID
- tentar ID inválido -> mensagem amigável;
- tentar ID válido -> status pendente.

### PR-03 Aprovação profissional
- admin vê solicitação;
- aceitar/recusar;
- profissional recebe status correto.

### PR-04 Cloudinary
- upload perfil e comprovante;
- validar gravação `image_url/public_id/asset_id` no banco.

### PR-05 Ajustes finais
- alternar disponível/indisponível;
- abrir painel profissional no contexto ADM;
- regressão geral de autenticação e deploy.
