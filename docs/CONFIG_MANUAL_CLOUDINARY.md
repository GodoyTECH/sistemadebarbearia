# Configuração manual Cloudinary

## Objetivo
Armazenar imagens de:
1) foto de perfil
2) comprovantes de pagamento

com organização por loja/profissional.

---

## 1) Credenciais

No painel Cloudinary, obter:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Salvar como variáveis no backend (Render).

---

## 2) Estratégia recomendada

Usar **upload assinado server-side** para evitar abuso e controlar pasta/metadata.

Pastas obrigatórias:
- Perfil:
  - `salons/{storeId}/professionals/{professionalId}/profile`
- Comprovantes:
  - `salons/{storeId}/payments/{professionalId}/receipts`

---

## 3) Presets (opcional)

Se optar por upload preset:
- criar preset assinado (não unsigned para comprovantes)
- restringir formatos: `jpg,jpeg,png,webp`
- limitar tamanho (ex.: 5MB perfil, 8MB comprovante)

---

## 4) Persistência no Neon (obrigatório)

Salvar por upload:
- `image_url` (`secure_url`)
- `public_id`
- `asset_id`
- `created_at`
- referência de loja/profissional/pagamento

---

## 5) Checklist de validação

- [ ] upload de perfil cria registro no banco
- [ ] upload de comprovante cria registro no banco
- [ ] URL abre com HTTPS
- [ ] caminho da pasta respeita `storeId` e `professionalId`
