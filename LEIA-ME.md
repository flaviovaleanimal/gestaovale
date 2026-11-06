# Gestão de Serviços — pacote para publicar (Neon + Netlify)

| Arquivo | Para que serve |
|---|---|
| `index.html` | O aplicativo (mesmas telas do protótipo) |
| `cloud.js` | Conexão com o banco + tela de login |
| `netlify/functions/api.js` | O "servidor": login e leitura/gravação no Neon |
| `neon/schema.sql` | Cria as tabelas no Neon |
| `admin.html` | Página para criar usuários e trocar senhas |
| `package.json`, `netlify.toml` | Configuração do Netlify |

## Passo 1 — Banco (Neon)
1. Em neon.com, crie a conta e um projeto (nome `gestao-vale-animal`, região *São Paulo* se houver).
2. Abra **SQL Editor**, cole todo o `neon/schema.sql` e clique em **Run**.
3. Na tela inicial do projeto, clique em **Connect** e copie a **connection string** (começa com `postgresql://`). Deixe a opção *pooled connection* marcada.

## Passo 2 — Site (Netlify)
1. Em app.netlify.com, crie a conta. **Add new site > Deploy manually** e arraste esta pasta inteira.
2. Abra **Site configuration > Environment variables** e crie 3 variáveis:
   - `DATABASE_URL` = a connection string do Neon
   - `AUTH_SECRET` = um texto longo e aleatório (30+ caracteres; invente)
   - `ADMIN_KEY` = uma senha de administrador (só você usa)
3. Vá em **Deploys > Trigger deploy > Deploy site** (ou arraste a pasta de novo) para as variáveis valerem.

## Passo 3 — Usuários
1. Abra `https://SEU-SITE.netlify.app/admin.html`.
2. Informe a chave `ADMIN_KEY`, o nome, o e-mail e a senha de cada pessoa. Repita para cada pessoa da equipe. Para trocar uma senha, crie o mesmo e-mail de novo.

## Passo 4 — Usar
Mande o endereço do site para a equipe. Cada pessoa entra com e-mail e senha. A tela atualiza a cada ~10 segundos com o que os outros lançaram.
- **PDF:** em qualquer relatório e na Ficha de Serviços, clique em *Imprimir / Salvar como PDF*.
- **Levar os dados do protótipo:** no protótipo, *Exportar dados > Copiar dados*; no site, *Importar dados*, cole e confirme (substitui tudo).
- **Atenção:** *Zerar dados* apaga os dados de todos.

## Observações
- Testado com banco simulado (login, cadastro, 2 navegadores vendo os mesmos dados, API recusando acesso sem login). Não foi testado com Neon e Netlify reais; se algo falhar no primeiro uso, veja **Netlify > Logs > Functions**.
- Se o Netlify reclamar de dependência (`@neondatabase/serverless`), publique pelo GitHub em vez de arrastar a pasta.
