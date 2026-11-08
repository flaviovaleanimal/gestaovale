# Gestão de Serviços — publicar com GitHub + Supabase (com login)

| Arquivo | Para que serve |
|---|---|
| `index.html` | O aplicativo |
| `config.js` | Endereço e chave do seu banco (você preenche) |
| `cloud.js` | Conexão com o banco + **tela de login** |
| `supabase/schema.sql` | Cria a tabela e as regras de segurança (só quem está logado lê e grava) |
| `robots.txt`, `.nojekyll` | Pedem aos buscadores (Google) para não listar o site e deixam o GitHub publicar os arquivos como estão |

Como a proteção funciona: o site é público (qualquer pessoa abre o link), mas **vê só a tela de login**. Os dados ficam no Supabase, e o banco **recusa qualquer acesso de quem não está logado e autorizado**.

## Passo 1 — Banco (Supabase) — JÁ FEITO
O projeto `gestao-vale-animal` já foi criado (região São Paulo), com a tabela, as regras de segurança e a lista de e-mails autorizados. O `config.js` já está preenchido com a URL e a chave `anon`. Nada a fazer aqui.

> Use somente a chave **anon**. **Nunca** coloque a chave `service_role` em nenhum arquivo do site.

## Passo 2 — Usuários da equipe
Cada pessoa precisa de **duas** coisas:
1. Uma conta: **Authentication > Users > Add user > Create new user** (e-mail + senha, marque *Auto Confirm User*).
2. Estar na lista de autorizados: **SQL Editor** > `insert into private.allowed_users (email) values ('pessoa@exemplo.com');` (ou peça para mim).

Mesmo que alguém consiga criar uma conta, sem estar na lista de autorizados **não vê nem grava nada**. Para fechar também o cadastro: **Authentication > Sign In / Providers > Email** > desligue **Allow new users to sign up**.

Esqueceu a senha? Em **Authentication > Users** clique no usuário e crie uma nova senha.

## Passo 3 — Publicar no GitHub Pages
1. Em github.com crie uma conta e um repositório (**New repository**), por exemplo `gestao-vale-animal`.
   - Conta gratuita: o GitHub Pages só funciona com repositório **Público**. Isso é seguro aqui, porque no repositório ficam apenas o código e a chave `anon` — os dados estão no Supabase, atrás do login. **Não coloque dados, planilhas nem senhas no repositório.**
   - Repositório privado com Pages exige plano pago do GitHub.
2. No repositório: **Add file > Upload files**. Arraste **o conteúdo da pasta** (não a pasta em si, para que o `index.html` fique na raiz), incluindo `config.js` já preenchido, a pasta `supabase` e os arquivos `robots.txt` e `.nojekyll`. Clique em **Commit changes**.
3. **Settings > Pages > Build and deployment**: *Source* = **Deploy from a branch**, *Branch* = **main** e pasta **/(root)** > **Save**.
4. Em 1 a 2 minutos o endereço aparece no topo da página (ex.: `https://seu-usuario.github.io/gestao-vale-animal/`). Esse é o link da equipe.

(Se preferir Netlify: **Deploy manually** e arraste a pasta. Os passos 1 e 2 são iguais.)

## Primeiro teste (faça antes de passar o link)
1. Abra o link: deve aparecer **somente a tela de login**.
2. Entre com um usuário criado no Passo 2.
3. Cadastre uma empresa, recarregue a página (F5) e confira se ela continua lá.
4. Abra o link em uma janela anônima: deve pedir login de novo e **não** mostrar dados.
5. Clique em **Sair** (topo da tela) para encerrar a sessão.

## Dicas
- **PDF:** em relatórios e na Ficha de Serviços, clique em *Imprimir / Salvar como PDF*.
- **Atenção:** *Zerar dados* apaga os dados de **todos** os usuários. Use só com certeza.
- **Levar os dados do protótipo:** no protótipo, **Exportar dados > Copiar dados**; neste app (logado), **Importar dados**, cole e confirme. A importação **substitui** tudo.
- **Cópia de segurança:** no plano gratuito do Supabase não há backup automático. Exporte a tabela `docs` de tempos em tempos (**Table Editor > docs > Export**) ou considere um plano pago.
- **Plano gratuito do Supabase** pausa projetos sem uso por cerca de 1 semana. Abrir o painel do Supabase reativa.
- O login foi testado com um Supabase simulado; com o projeto real, faça o "Primeiro teste" acima.
