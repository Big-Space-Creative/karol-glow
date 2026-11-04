# Karol Glow

Loja de cosméticos e beleza feminina da Karol Glow: site público (home, catálogo e página de produto) e painel administrativo (produtos, catálogo e vendas), com API em Node.js e banco PostgreSQL. O design vem do Figma e está implementado para desktop (1440 px) e mobile (390 px).

> **Estado atual:** front-end e API estão integrados. O site e o painel leem e gravam no PostgreSQL pela API; o login do painel usa a sessão da API (cookie `HttpOnly`). Veja [Próximos passos](#próximos-passos).

## Stack

- **Front-end:** [Vue 3](https://vuejs.org/) + [Vite](https://vite.dev/), [Vue Router](https://router.vuejs.org/), [Pinia](https://pinia.vuejs.org/) e [Tailwind CSS v4](https://tailwindcss.com/)
- **API:** Node.js 20+ com [Express 5](https://expressjs.com/), [`pg`](https://node-postgres.com/) e [zod](https://zod.dev/)
- **Banco de dados:** PostgreSQL 14+ (esquema em `db/schema.sql`)
- Fontes locais via Fontsource: Fraunces (títulos) e Plus Jakarta Sans (interface)

## Como rodar

### 1. Front-end

```bash
npm install
npm run dev                  # http://localhost:5173 (precisa da API rodando na porta 3001)
```

| Comando           | O que faz                                  |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Servidor de desenvolvimento com hot reload |
| `npm run build`   | Gera a versão de produção em `dist/`       |
| `npm run preview` | Serve a build de produção localmente       |

Em desenvolvimento, as chamadas para `/api` são encaminhadas para `http://localhost:3001` (veja `vite.config.js`).

### 2. Banco de dados (desenvolvimento)

Use um PostgreSQL local ou o do `docker-compose.dev.yml` (exposto só em `127.0.0.1:5432`). As credenciais ficam em variáveis de ambiente, nunca no repositório:

```bash
cp .env.example .env          # preencha POSTGRES_USER e POSTGRES_PASSWORD
docker compose -f docker-compose.dev.yml --env-file .env up -d
```

### 3. API

```bash
cd server
npm install
cp .env.example .env          # ajuste DATABASE_URL e demais variáveis
npm run migrate               # cria as tabelas (db/schema.sql)
npm run seed                  # (opcional) produtos de exemplo
npm run admin:create -- voce@exemplo.com "Seu Nome"   # pede a senha no terminal
npm run dev                   # http://localhost:3001
```

| Comando (em `server/`) | O que faz                                                         |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run dev`          | API com reinício automático                                       |
| `npm start`            | API em modo normal                                                |
| `npm run migrate`      | Aplica `db/schema.sql`                                            |
| `npm run seed`         | Insere produtos de exemplo (pode rodar mais de uma vez)           |
| `npm run admin:create` | Cria ou atualiza um usuário administrador                         |
| `npm test`             | Testes de integração (precisa de `TEST_DATABASE_URL`, banco de teste) |

> Os testes criam e apagam dados. Aponte `TEST_DATABASE_URL` **somente** para um banco descartável.

## Produção com Docker

Uma única imagem: a API serve também o front compilado (`Dockerfile` na raiz), então site e API ficam na mesma origem.

**Local/homologação** (banco + app):

```bash
cp .env.example .env     # defina POSTGRES_USER, POSTGRES_PASSWORD (longa, sem @ : / ? # %)
docker compose up -d --build            # http://localhost:3008
docker compose exec app node scripts/create-admin.js voce@exemplo.com "Seu Nome"   # pede a senha
docker compose exec app node scripts/remove-admin.js voce@exemplo.com                # remove um acesso (não remove o último)
```

**Servidor (Docker Swarm + Traefik)** com `manager.yaml`:

```bash
docker build -t karol-glow/app:1.0.0 .
APP_TAG=1.0.0 APP_DOMAIN=loja.exemplo.com POSTGRES_PASSWORD=... docker stack deploy -c manager.yaml karol-glow
```

- Crie antes o banco e o usuário no serviço `postgres` compartilhado; o esquema é aplicado sozinho na primeira subida.
- Containers rodam sem root; o certificado HTTPS fica por conta do Traefik (`TRUST_PROXY=1` e cookie `Secure`).
- Backup: `pg_dump` do banco, guardado fora do repositório.

## Endpoints da API

Públicos:

| Método | Rota                   | Descrição                                                  |
| ------ | ---------------------- | ---------------------------------------------------------- |
| GET    | `/api/health`          | Verifica API e banco                                       |
| GET    | `/api/products`        | Lista com filtros (`q`, `category`, `brand`, `skin`, `minPrice`, `maxPrice`, `inStock`, `onSale`, `sort`, `page`, `perPage`) |
| GET    | `/api/products/:id`    | Produto com variações                                      |
| GET    | `/api/catalog`         | Categorias, marcas, tipos de pele e de variação            |

Administração (exigem sessão):

| Método              | Rota                                | Descrição                                      |
| ------------------- | ----------------------------------- | ---------------------------------------------- |
| POST                | `/api/auth/login`                   | Entrar                                         |
| GET                 | `/api/auth/me`                      | Usuário da sessão                              |
| POST                | `/api/auth/logout`                  | Sair                                           |
| GET/POST/PUT/PATCH/DELETE | `/api/admin/products[/:id]`   | CRUD de produtos                               |
| POST/PUT/DELETE     | `/api/admin/catalog/:lista[/:id]`   | Categorias, marcas, tipos de pele e de variação |
| GET/POST            | `/api/admin/sales`                  | Lista e registra vendas                        |
| GET                 | `/api/admin/sales/stats`            | Resumo do dia                                  |
| POST                | `/api/admin/sales/:id/undo`         | Desfaz uma venda                               |

## Segurança

- Sessão por cookie `HttpOnly`, `SameSite=Strict` (e `Secure` em produção); no banco fica apenas o hash do token.
- Senhas com hash forte e comparação em tempo constante; mensagens de erro de login genéricas.
- Proteção contra CSRF, limite de requisições, bloqueio após tentativas de login falhas e prazo de sessão por validade e inatividade.
- Todas as consultas usam parâmetros; entradas são validadas com zod; cabeçalhos de segurança via Helmet.
- Variáveis de ambiente e chaves nunca são versionadas (veja `.gitignore`); use os arquivos `*.example` como modelo.

## Rotas do site

| Rota                  | Tela                                            | Acesso    |
| --------------------- | ----------------------------------------------- | --------- |
| `/`                   | Home                                            | Público   |
| `/produtos`           | Catálogo com filtros e paginação                | Público   |
| `/produtos/:id`       | Página do produto                               | Público   |
| `/componentes`        | Vitrine de componentes                          | Público   |
| `/login`              | Login do painel                                 | Visitante |
| `/admin/produtos`     | Lista de produtos                               | Admin     |
| `/admin/produtos/novo`| Cadastro de produto                             | Admin     |
| `/admin/produtos/:id` | Edição de produto                               | Admin     |
| `/admin/catalogo`     | Categorias, marcas, tipos de pele e de variação | Admin     |
| `/admin/vendas`       | Registro de vendas e histórico                  | Admin     |

## Estrutura do projeto

```
db/                  Esquema PostgreSQL
Dockerfile             Imagem única (front + API)
docker-compose.yml     Local/homologação: banco + app
docker-compose.dev.yml Só o banco, para desenvolvimento
manager.yaml           Stack Swarm/Traefik para o servidor
docs/figma-ref/      Capturas do Figma usadas como referência
server/              API (Express + pg)
  src/routes/        auth, products, catalog, sales
  src/middleware/    sessão, CSRF e cabeçalhos
  scripts/           migrate, seed, create-admin
  test/              Testes de integração
src/                 Front-end
  components/        Componentes do site e do painel (components/admin)
  layouts/           MainLayout e AdminLayout
  router/            Rotas e guardas de navegação
  stores/            Pinia: products, cart, auth
  views/             Telas (views/admin para o painel)
```

## Design

- Arquivo do Figma: **Karol-Glow** (páginas `style`, `ui`, `desk-prototype` e `mobile-prototype`).
- Cores: ameixa `#3a1632`, ameixa suave `#6e5868`, lilás `#b565e0`, lilás claro `#f1e6f7`, creme `#fbf6ee`, linha `#e8dde6` (classes `bg-plum`, `text-plum-muted`, `text-lilac`, `bg-lilac-soft`, `border-line`, `font-display`, `font-ui`).
- Breakpoint mobile/desktop: `768px` (`md:`).

## Próximos passos

- Upload de imagens de produto (hoje o cadastro aceita o endereço/URL da imagem) e fotos reais nas categorias.
- Escolha de variação (tamanho, cor) na tela de vendas e na página do produto.
- Carrinho e checkout.
- Publicação (variáveis de produção, HTTPS e proxy reverso).

## Licença

[MIT](LICENSE) © 2026 Big Space Creative
